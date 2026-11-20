const express = require('express');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const GITHUB_CONFIG = Object.freeze({
  owner: 'vsdevelopers789-hash',
  repo: 'live-stream-data',
  path: 'matches.json',
  branch: 'main',
  token: process.env.GITHUB_TOKEN
});

function githubFileUrl(includeBranch = false) {
  const safePath = GITHUB_CONFIG.path.split('/').map(encodeURIComponent).join('/');
  const url = new URL(`https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${safePath}`);
  if (includeBranch) url.searchParams.set('ref', GITHUB_CONFIG.branch);
  return url;
}

function githubHeaders() {
  return {
    Authorization: `Bearer ${GITHUB_CONFIG.token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    'User-Agent': 'Render-Backend-LiveSync'
  };
}

let inMemoryMatchesCache = [];
let inMemoryDeletedMatches = [];
let inMemoryCategoryVisibility = { Cricket: true, IPL: true, Football: true };
let inMemorySubCategories = { Cricket: {}, IPL: {}, Football: {} };
let inMemoryTimerState = {};
let inMemoryStreamSources = [];
let serverDataVersion = Date.now().toString();
let sourceSyncCache = { updatedAt: 0, channels: [], errors: [] };
let sourceSyncRunning = false;
let githubLoaded = false;
let githubWriteQueue = Promise.resolve();


// ---------------------------------------------------------------------------
// Source-feed deletion protection.
// A deleted feed match is identified by sourceId + sourceMatchId, not by the
// local Firebase/GitHub key (which can change when records are migrated).
// cloudflare_deleted_matches is persisted in matches.json by /api/matches.
function sourceIdentityKey(item) {
  if (!item || !item.sourceId || !item.sourceMatchId) return "";
  return `${String(item.sourceId)}::${String(item.sourceMatchId)}`;
}

function getSourceTombstoneKeys() {
  const keys = new Set();
  for (const item of inMemoryDeletedMatches) {
    // Only feed-backed records can suppress a source-feed re-import.
    const key = sourceIdentityKey(item);
    if (key && (item._isAutoFeedMatch === true || item.sourceId)) keys.add(key);
  }
  return keys;
}

function filterDeletedSourceMatches(items) {
  const blocked = getSourceTombstoneKeys();
  if (!blocked.size) return items;
  return items.filter(item => {
    const key = sourceIdentityKey(item);
    return !key || !blocked.has(key);
  });
}

app.get('/ping', (_req, res) => res.status(200).send('SERVER_ACTIVE_OK'));

async function fetchRawJsonFromGitHub() {
  if (!GITHUB_CONFIG.token) throw new Error('GITHUB_TOKEN environment variable is missing in Render');
  const fileUrl = githubFileUrl(true);
  fileUrl.searchParams.set('_t', String(Date.now()));
  const ghRes = await fetch(fileUrl, { headers: githubHeaders() });
  if (!ghRes.ok) {
    const detail = await ghRes.text().catch(() => '');
    throw new Error(`GitHub fetch failed (${ghRes.status}): ${detail.slice(0, 400) || ghRes.statusText}`);
  }
  const fileData = await ghRes.json();
  if (!fileData.content || !fileData.sha) throw new Error('GitHub matches.json response has no content or SHA');
  let parsedData;
  try {
    const decoded = Buffer.from(String(fileData.content).replace(/\s/g, ''), 'base64').toString('utf8');
    parsedData = JSON.parse(decoded);
  } catch (error) {
    throw new Error(`GitHub matches.json is not valid Base64 JSON: ${error.message}`);
  }
  if (!parsedData || Array.isArray(parsedData) || typeof parsedData !== 'object') {
    throw new Error('GitHub matches.json must contain a JSON object');
  }

  if (Array.isArray(parsedData.cloudflare_matches)) inMemoryMatchesCache = parsedData.cloudflare_matches;
  else if (!githubLoaded) inMemoryMatchesCache = [];
  if (Array.isArray(parsedData.cloudflare_deleted_matches)) inMemoryDeletedMatches = parsedData.cloudflare_deleted_matches;
  else if (!githubLoaded) inMemoryDeletedMatches = [];
  if (parsedData.category_visibility && typeof parsedData.category_visibility === 'object') inMemoryCategoryVisibility = parsedData.category_visibility;
  if (parsedData.sub_categories && typeof parsedData.sub_categories === 'object') inMemorySubCategories = parsedData.sub_categories;
  if (Array.isArray(parsedData.stream_sources)) inMemoryStreamSources = parsedData.stream_sources;
  githubLoaded = true;
  serverDataVersion = Date.now().toString();
  return { parsedData, sha: fileData.sha };
}

async function pushJsonToGitHub(payload) {
  if (!GITHUB_CONFIG.token) throw new Error('GITHUB_TOKEN environment variable is missing in Render');
  const write = async () => {
    const fileUrl = githubFileUrl(false);
    const readUrl = githubFileUrl(true);
    readUrl.searchParams.set('_t', String(Date.now()));
    const headers = githubHeaders();
    const getRes = await fetch(readUrl, { headers });
    if (!getRes.ok) {
      const detail = await getRes.text().catch(() => '');
      throw new Error(`GitHub read before write failed (${getRes.status}): ${detail.slice(0, 400) || getRes.statusText}`);
    }
    const file = await getRes.json();
    if (!file.sha || typeof file.content !== 'string') throw new Error('GitHub did not return matches.json content and SHA');

    let existing;
    try {
      existing = JSON.parse(Buffer.from(file.content.replace(/\s/g, ''), 'base64').toString('utf8') || '{}');
    } catch (error) {
      throw new Error(`Cannot update matches.json because its existing JSON is invalid: ${error.message}`);
    }
    if (!existing || Array.isArray(existing) || typeof existing !== 'object') {
      throw new Error('Cannot update matches.json: root JSON value must be an object');
    }

    const merged = { ...existing, ...payload };
    const content = Buffer.from(JSON.stringify(merged, null, 2), 'utf8').toString('base64');
    const putRes = await fetch(fileUrl, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: `Render Auto-Sync: ${new Date().toISOString()}`,
        content,
        sha: file.sha,
        branch: GITHUB_CONFIG.branch
      })
    });
    if (!putRes.ok) {
      const detail = await putRes.text().catch(() => '');
      throw new Error(`GitHub write failed (${putRes.status}): ${detail.slice(0, 500) || putRes.statusText}`);
    }
    return true;
  };

  const task = githubWriteQueue.then(write, write);
  githubWriteQueue = task.catch(() => {});
  return task;
}

function parseAttributeList(line) {
  const out = {};
  const re = /([\w-]+)=(?:"([^"]*)"|([^,]*))/g;
  let m;
  while ((m = re.exec(line))) out[m[1].toLowerCase()] = (m[2] ?? m[3] ?? '').trim();
  return out;
}

function parseM3U(text, source) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const channels = [];
  let pending = null;
  let pendingHeaders = {};
  let pendingOptions = {};
  let currentGroup = '';
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(',');
      const meta = comma >= 0 ? line.slice(0, comma) : line;
      const display = comma >= 0 ? line.slice(comma + 1).trim() : '';
      const attrs = parseAttributeList(meta);
      currentGroup = attrs['group-title'] || currentGroup || 'Live TV';
      pending = { attrs, displayName: display || attrs['tvg-name'] || attrs['tvg-id'] || 'Live Channel' };
      pendingHeaders = {};
      pendingOptions = {};
      continue;
    }
    if (line.startsWith('#EXTVLCOPT:') && pending) {
      const value = line.slice('#EXTVLCOPT:'.length);
      const ix = value.indexOf('=');
      if (ix > 0) pendingOptions[value.slice(0, ix).trim().toLowerCase()] = value.slice(ix + 1).trim();
      continue;
    }
    if (line.startsWith('#EXTHTTP:') && pending) {
      try { Object.assign(pendingHeaders, JSON.parse(line.slice('#EXTHTTP:'.length))); } catch (_) {}
      continue;
    }
    if (line.startsWith('#')) continue;
    if (/^https?:\/\//i.test(line) && pending) {
      const a = pending.attrs;
      const channelName = a['tvg-name'] || pending.displayName;
      const channelId = a['tvg-id'] || channelName;
      const logo = a['tvg-logo'] || '';
      const serverName = `${channelName}${a['group-title'] ? ` · ${a['group-title']}` : ''}`;
      const headers = { ...pendingHeaders };
      if (pendingOptions['http-user-agent']) headers['User-Agent'] = pendingOptions['http-user-agent'];
      if (pendingOptions['http-referrer']) headers['Referer'] = pendingOptions['http-referrer'];
      if (pendingOptions['http-cookie']) headers['Cookie'] = pendingOptions['http-cookie'];
      let url = line;
      const playerType = /\.mpd(?:$|\?)/i.test(url) ? 'dash' : (/\.m3u8?(?:$|\?)/i.test(url) ? 'hls' : 'iframe');
      const stable = `${source.id}:${channelId}`;
      channels.push({
        id: stable, fb_key: `m3u_${Buffer.from(stable).toString('base64url').slice(0, 48)}`,
        sourceId: source.id, sourceLabel: source.label || 'Feed', isChannelCard: true,
        channelId, channelName, groupTitle: a['group-title'] || currentGroup,
        logo, card: logo, category: 'Others', sub_category: a['group-title'] || currentGroup,
        title: channelName, team_1: channelName, team_2: '', status: 'live', time: '', timezone: 'Asia/Kolkata',
        drm_key: '',
        servers: [{ id: `${stable}:server`, name: serverName, url, headers, isBrowser: playerType === 'iframe', playerType, sourceManaged: true, visible: true, pos: 1, drm_key: '' }]
      });
      pending = null;
    }
  }
  return channels;
}

function normaliseChannelEntry(item, source, index) {
  const name = String(item.name || item.channel_name || item.tvg_name || item.title || item.tvgName || `Channel ${index + 1}`).trim();
  const channelId = String(item.id || item.channel_id || item.tvg_id || item.tvgId || name).trim();
  
  // Proxied URL ki మొదటి ప్రయారిటీ ఇచ్చేలా అప్‌డేట్ చేయబడింది
  const url = String(item.proxied_url || item.backup_proxied_url || item.raw_url || item.url || item.stream_url || item.stream || item.play_url || '').trim();
  if (!/^https?:\/\//i.test(url)) return null;
  
  const logo = String(item.logo || item.tvg_logo || item.tvgLogo || item.icon || item.image || '').trim();
  const drmKey = String(item.drm_key || item.drmKey || item.key || '').trim();
  const playerType = /\.mpd(?:$|\?)/i.test(url) ? 'dash' : (/\.m3u8?(?:$|\?)/i.test(url) ? 'hls' : 'file');
  
  return {
    id: `${source.id}:${channelId}`, fb_key: `m3u_${Buffer.from(`${source.id}:${channelId}`).toString('base64url').slice(0, 48)}`,
    sourceId: source.id, sourceLabel: source.label || 'Feed', isChannelCard: true,
    channelId, channelName: name, groupTitle: String(item.group_title || item.group || item.category || 'Live TV'),
    logo, card: logo, category: 'Others', sub_category: String(item.group_title || item.group || 'Live TV'),
    title: name, team_1: name, team_2: '', status: 'live', time: '', timezone: 'Asia/Kolkata',
    drm_key: drmKey,
    servers: [{ id: `${source.id}:${channelId}:server`, name, channelName: name, logo, url,
      headers: item.headers && typeof item.headers === 'object' ? item.headers : {},
      isBrowser: false, playerType, sourceManaged: true, visible: true, pos: 1, drm_key: drmKey }],
    networkLogo: String(item.network_logo || item.networkLogo || '').trim()
  };
}

function extractTeams(match, title) {
  let t1 = String(match.team_1 || match.team1 || match.t1 || match.home_team || match.homeTeam || '').trim();
  let t2 = String(match.team_2 || match.team2 || match.t2 || match.away_team || match.awayTeam || '').trim();
  const text = String(title || match.event_name || match.title || match.synopsis || '');
  if ((!t1 || !t2) && /\s+vs\.?\s+/i.test(text)) {
    const parts = text.split(/\s+vs\.?\s+/i);
    if (parts.length >= 2) {
      const left = parts[0].split(/\s+-\s+/).pop().trim();
      const right = parts.slice(1).join(' vs ').split(/\s+-\s+/)[0].split(/\s+[|,(]/)[0].trim();
      if (!t1) t1 = left;
      if (!t2) t2 = right;
    }
  }
  return { t1, t2 };
}

async function fetchAndParseSource(source) {
  const u = new URL(source.url);
  if (!['http:', 'https:'].includes(u.protocol)) throw new Error('Only HTTP/HTTPS source URLs are allowed');
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(u, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; LiveSourceSync/1.0)', Accept: '*/*' }, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const body = await response.text();
    if (body.length > 12 * 1024 * 1024) throw new Error('Source exceeds 12MB limit');
    if (body.trimStart().startsWith('#EXTM3U') || body.includes('#EXTINF:')) return parseM3U(body, source);
    let json;
    try { json = JSON.parse(body); } catch (_) { throw new Error('Unsupported source: expected M3U or JSON'); }

    const channelList = Array.isArray(json) ? json : (json.channels || json.Channels || json.channel_list || json.items || []);
    if (Array.isArray(channelList) && channelList.length && channelList.some(x => x && (x.raw_url || x.proxied_url || x.channel_name || x.tvg_id || x.channel_id))) {
      const parsedChannels = channelList.map((x, i) => normaliseChannelEntry(x, source, i)).filter(Boolean);
      return parsedChannels;
    }

    const list = Array.isArray(json) ? json : (json.Matches || json.matches || json.data || json.events || json.results || []);
    if (!Array.isArray(list)) throw new Error('JSON source has no supported matches/channels array');
    
    return list.map((m, i) => {
      const title = String(m.event_name || m.title || m.synopsis || m.name || '').trim();
      const { t1, t2 } = extractTeams(m, title);
      const matchDrmKey = String(m.drm_key || m.drmKey || m.key || '').trim();
      
      const serverGroups = [
        ['CnpTV', m.CnpTV], ['Alpha', m.stream_url_alpha],
        ['Bravo', m.stream_url_bravo], ['Streams', m.streams]
      ];
      const serverEntries = [];
      for (const [groupName, group] of serverGroups) {
        if (!group) continue;
        const entries = Array.isArray(group)
          ? group.map((v, n) => [v?.name || `${groupName} Server ${n + 1}`, v])
          : (typeof group === 'object' ? Object.entries(group) : []);
        for (const [key, value] of entries) {
          const entry = typeof value === 'string' ? { url: value } : (value && typeof value === 'object' ? value : {});
          // Proxied URL లేదా raw URL ఫెచ్ చేసుకునేటప్పుడు ప్రయారిటీ ఇవ్వడం
          const streamUrl = String(entry.proxied_url || entry.backup_proxied_url || entry.raw_url || entry.url || entry.stream_url || entry.play_url || entry.src || '').trim();
          if (!/^https?:\/\//i.test(streamUrl)) continue;
          serverEntries.push({
            name: String(entry.name || `${groupName} ${key}`).trim(),
            url: streamUrl,
            headers: entry.headers && typeof entry.headers === 'object' ? entry.headers : {},
            playerType: /\.mpd(?:$|[?#])/i.test(streamUrl) ? 'dash' : (/\.m3u8?(?:$|[?#])/i.test(streamUrl) ? 'hls' : 'file')
          });
        }
      }
      const seenStreamUrls = new Set();
      const servers = serverEntries.filter(entry => {
        const key = entry.url;
        if (seenStreamUrls.has(key)) return false;
        seenStreamUrls.add(key); return true;
      }).map((entry, n) => ({
        name: `${title || t1 || 'Live'} (${entry.name})`, url: entry.url,
        headers: entry.headers, isBrowser: false, playerType: entry.playerType,
        sourceManaged: true, visible: true, pos: n + 1,
        drm_key: matchDrmKey,
        drmProtected: !!matchDrmKey || !!m.drm || !!m.license_url || !!m.licenseUrl,
        drmSystem: m.drm_system || m.drmSystem || '',
        licenseUrl: m.license_url || m.licenseUrl || m.widevine_license_url || m.widevineLicenseUrl || ''
      }));

      const hasMatchDetails = !!(t1 && t2 && title);
      if (!hasMatchDetails && servers.length) {
        return normaliseChannelEntry({ name: title || m.name || `Channel ${i + 1}`, id: m.id || m.match_id || i,
          logo: m.logo || m.image || m.banner || m.card || '', raw_url: servers[0].url, drm_key: matchDrmKey }, source, i);
      }
      
      return { 
        id: String(m.match_id || m.id || `${source.id}_${i}`), sourceId: source.id,
        sourceMatchId: String(m.match_id || m.id || `${source.id}_${i}`), title: title || `${t1} vs ${t2}`,
        team_1: t1, team_2: t2, team_1_logo: m.team_1_logo || m.t1_logo || m.home_team_logo || m.team1_logo || '', team_2_logo: m.team_2_logo || m.t2_logo || m.away_team_logo || m.team2_logo || '', category: m.category || m.sport || m.game || 'Cricket',
        sub_category: m.sub_category || m.series || title || `${t1} vs ${t2}`,
        card: m.banner || m.card || m.image || m.cover_image || '',
        synopsis: m.synopsis || m.description || '',
        status: /finish|ended|\bft\b|complete/i.test(String(m.status || m.match_status || 'live')) ? 'finished' : 'live',
        time: m.time || m.match_time || m.date_time || m.date || m.start_time || '',
        timezone: m.timezone || m.tz || 'Asia/Kolkata',
        drm_key: matchDrmKey,
        drmProtected: !!matchDrmKey || !!m.drm || !!m.license_url || !!m.licenseUrl,
        drmSystem: m.drm_system || m.drmSystem || '',
        licenseUrl: m.license_url || m.licenseUrl || m.widevine_license_url || m.widevineLicenseUrl || '',
        servers 
      };
    }).filter(m => m.servers && m.servers.length);
  } finally { clearTimeout(timeout); }
}

async function syncAllSources() {
  if (sourceSyncRunning) return sourceSyncCache;
  sourceSyncRunning = true;
  const channels = [], errors = [];
  try {
    const results = await Promise.all(inMemoryStreamSources.map(async source => {
      try { return await fetchAndParseSource(source); }
      catch (e) { errors.push({ id: source.id, label: source.label, error: e.message }); return []; }
    }));
    results.forEach(items => channels.push(...items));
    sourceSyncCache = { updatedAt: Date.now(), channels, errors };
    return sourceSyncCache;
  } finally { sourceSyncRunning = false; }
}

(async () => { try { await fetchRawJsonFromGitHub(); console.log('GitHub matches preloaded'); } catch (e) { console.warn('GitHub preload:', e.message); } })();

app.get('/api/raw-matches', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { if (!githubLoaded) await fetchRawJsonFromGitHub(); res.json({ success: true, v: serverDataVersion, category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/matches', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { if (!githubLoaded) await fetchRawJsonFromGitHub(); res.json({ v: serverDataVersion, category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/matches', async (req, res) => {
  try {
    const body = req.body || {};
    if (Array.isArray(body.matches)) inMemoryMatchesCache = body.matches;
    if (Array.isArray(body.deleted_matches)) {
      inMemoryDeletedMatches = body.deleted_matches;
      // Re-apply the latest deletion list on the next source sync request.
      sourceSyncCache.updatedAt = 0;
    }
    if (body.category_visibility) inMemoryCategoryVisibility = body.category_visibility;
    if (body.sub_categories) inMemorySubCategories = body.sub_categories;
    if (body.timerStatePayload) { inMemoryTimerState = { ...inMemoryTimerState, ...body.timerStatePayload }; delete body.timerStatePayload; }
    serverDataVersion = Date.now().toString();
    const stored = await pushJsonToGitHub({ category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, cloudflare_matches: inMemoryMatchesCache, cloudflare_deleted_matches: inMemoryDeletedMatches, stream_sources: inMemoryStreamSources });
    if (!stored) throw new Error('Cloudflare database persistence failed');
    res.json({ success: true, v: serverDataVersion, persisted: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/matches/version', (_req, res) => res.json({ v: serverDataVersion }));
app.get('/api/timer-state', (_req, res) => res.json(inMemoryTimerState));
app.get('/api/stream-sources', (_req, res) => res.setHeader('Cache-Control', 'no-store').json(inMemoryStreamSources));

app.post('/api/stream-sources', async (req, res) => {
  const { id, label, url } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL required' });
  if (id) inMemoryStreamSources = inMemoryStreamSources.map(s => s.id === id ? { ...s, label: label || 'Feed', url } : s);
  else inMemoryStreamSources.push({ id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: label || 'Feed', url });
  sourceSyncCache.updatedAt = 0;
  try { await pushJsonToGitHub({ stream_sources: inMemoryStreamSources }); res.json({ success: true, sources: inMemoryStreamSources, persisted: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.post('/api/stream-sources/delete/:id', async (req, res) => {
  inMemoryStreamSources = inMemoryStreamSources.filter(s => s.id !== req.params.id);
  sourceSyncCache.updatedAt = 0;
  try { await pushJsonToGitHub({ stream_sources: inMemoryStreamSources }); res.json({ success: true, sources: inMemoryStreamSources, persisted: true }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/parse-source', async (req, res) => {
  if (!req.query.url) return res.status(400).json({ success: false, error: 'Missing url' });
  try {
    const source = { id: 'manual_parse', label: 'Manual Source', url: String(req.query.url) };
    const parsedMatches = await fetchAndParseSource(source);
    const matches = filterDeletedSourceMatches(parsedMatches);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: matches.length, matches,
      suppressedDeleted: parsedMatches.length - matches.length });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/sync-stream-sources', async (_req, res) => {
  try {
    const data = await syncAllSources();
    const matches = filterDeletedSourceMatches(data.channels || []);
    res.setHeader('Cache-Control', 'no-store');
    res.json({
      success: true,
      updatedAt: data.updatedAt,
      channels: matches,
      count: matches.length,
      suppressedDeleted: (data.channels || []).length - matches.length,
      errors: data.errors || []
    });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

setInterval(() => { if (inMemoryStreamSources.length) syncAllSources().catch(e => console.error('Source sync:', e.message)); }, 60000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render Server running on port ${PORT}`));
