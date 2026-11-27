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
    'User-Agent': 'Vercel-Backend-LiveSync'
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

function sourceIdentityKey(item) {
  if (!item || !item.sourceId || !item.sourceMatchId) return "";
  return `${String(item.sourceId)}::${String(item.sourceMatchId)}`;
}

function getSourceTombstoneKeys() {
  const keys = new Set();
  for (const item of inMemoryDeletedMatches) {
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

function normalizeDrmValue(val) {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object') {
    if (val.clearKeys && typeof val.clearKeys === 'object') {
      return JSON.stringify(val.clearKeys);
    }
    const kid = val.kid || val.keyId || val.key_id || '';
    const key = val.key || val.keyValue || val.key_value || '';
    if (kid && key) return `${String(kid).trim()}:${String(key).trim()}`;
    return JSON.stringify(val);
  }
  return '';
}

function extractDrmKeyFromObj(obj, fallback = '') {
  if (!obj || typeof obj !== 'object') return normalizeDrmValue(fallback);
  const keysToCheck = [
    'drm_key', 'drmKey', 'drm_keys', 'drmKeys',
    'drmLicense', 'drm_license', 'licenseKey', 'license_key',
    'clearKeys', 'clear_keys', 'clearkeys', 'clearkey', 'clear_key',
    'mpd_key', 'mpdKey', 'drm', 'key', 'keys'
  ];
  for (const k of keysToCheck) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') {
      const normalized = normalizeDrmValue(obj[k]);
      if (normalized) return normalized;
    }
  }
  return normalizeDrmValue(fallback);
}

function appendDrmToMpdUrl(streamUrl, drmKey) {
  const cleanUrl = String(streamUrl || '').trim();
  const cleanKey = normalizeDrmValue(drmKey);
  if (!cleanUrl || !cleanKey) return cleanUrl;
  if (/\.mpd(?:$|[?#])/i.test(cleanUrl) && !/drmLicense=|clearKeys=/i.test(cleanUrl)) {
    const sep = cleanUrl.includes('|') ? '&' : '|';
    return `${cleanUrl}${sep}drmLicense=${encodeURIComponent(cleanKey)}`;
  }
  return cleanUrl;
}

app.get('/ping', (_req, res) => res.status(200).send('SERVER_ACTIVE_OK'));

async function fetchRawJsonFromGitHub() {
  if (!GITHUB_CONFIG.token) throw new Error('GITHUB_TOKEN environment variable is missing');
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

  // cloudflare_matches మరియు matches రెండింటినీ కలిపి తీసుకోవడం
  const cfMatches = Array.isArray(parsedData.cloudflare_matches) ? parsedData.cloudflare_matches : [];
  const ghMatches = Array.isArray(parsedData.matches) ? parsedData.matches : [];
  
  const allCombined = [...cfMatches];
  const seenIds = new Set(cfMatches.map(m => String(m.fb_key || m.id)));
  ghMatches.forEach(m => {
    const k = String(m.fb_key || m.id);
    if (!seenIds.has(k)) {
      seenIds.add(k);
      allCombined.push(m);
    }
  });
  
  inMemoryMatchesCache = allCombined;

  const cfDeleted = Array.isArray(parsedData.cloudflare_deleted_matches) ? parsedData.cloudflare_deleted_matches : [];
  const ghDeleted = Array.isArray(parsedData.deleted_matches) ? parsedData.deleted_matches : [];
  inMemoryDeletedMatches = [...cfDeleted, ...ghDeleted];

  if (parsedData.category_visibility && typeof parsedData.category_visibility === 'object') inMemoryCategoryVisibility = parsedData.category_visibility;
  if (parsedData.sub_categories && typeof parsedData.sub_categories === 'object') inMemorySubCategories = parsedData.sub_categories;
  if (Array.isArray(parsedData.stream_sources)) inMemoryStreamSources = parsedData.stream_sources;
  githubLoaded = true;
  serverDataVersion = Date.now().toString();
  return { parsedData, sha: fileData.sha };
}

async function pushJsonToGitHub(payload) {
  if (!GITHUB_CONFIG.token) throw new Error('GITHUB_TOKEN environment variable is missing');
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
        message: `Vercel Auto-Sync: ${new Date().toISOString()}`,
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
      const drmKey = String(a['drm-key'] || a['drmkey'] || a['key'] || pendingOptions['drm-key'] || '').trim();
      const url = appendDrmToMpdUrl(line, drmKey);
      const playerType = /\.mpd(?:$|[?#])/i.test(url) ? 'dash' : (/\.m3u8?(?:$|[?#])/i.test(url) ? 'hls' : 'iframe');
      const stable = `${source.id}:${channelId}`;
      channels.push({
        id: stable,
        fb_key: `m3u_${Buffer.from(stable).toString('base64url').slice(0, 48)}`,
        sourceId: source.id,
        sourceLabel: source.label || 'Feed',
        isChannelCard: true,
        channelId,
        channelName,
        groupTitle: a['group-title'] || currentGroup,
        logo,
        card: logo,
        category: 'Others',
        sub_category: a['group-title'] || currentGroup,
        title: channelName,
        team_1: channelName,
        team_2: '',
        status: 'live',
        time: '',
        timezone: 'Asia/Kolkata',
        drm_key: drmKey,
        servers: [{
          id: `${stable}:server`,
          name: serverName,
          url,
          headers,
          isBrowser: playerType === 'iframe',
          playerType,
          sourceManaged: true,
          visible: true,
          pos: 1,
          drm_key: drmKey
        }]
      });
      pending = null;
    }
  }
  return channels;
}

function normaliseChannelEntry(item, source, index) {
  const name = String(item.name || item.channel_name || item.tvg_name || item.title || item.tvgName || `Channel ${index + 1}`).trim();
  const channelId = String(item.id || item.channel_id || item.tvg_id || item.tvgId || name).trim();

  const rawUrl = String(item.proxied_url || item.backup_proxied_url || item.raw_url || item.url || item.stream_url || item.stream || item.play_url || '').trim();
  if (!/^https?:\/\//i.test(rawUrl)) return null;

  const logo = String(item.logo || item.tvg_logo || item.tvgLogo || item.icon || item.image || '').trim();
  const drmKey = extractDrmKeyFromObj(item, '');
  const url = appendDrmToMpdUrl(rawUrl, drmKey);
  const playerType = /\.mpd(?:$|[?#])/i.test(url) ? 'dash' : (/\.m3u8?(?:$|[?#])/i.test(url) ? 'hls' : 'file');

  return {
    id: `${source.id}:${channelId}`,
    fb_key: `m3u_${Buffer.from(`${source.id}:${channelId}`).toString('base64url').slice(0, 48)}`,
    sourceId: source.id,
    sourceLabel: source.label || 'Feed',
    isChannelCard: true,
    channelId,
    channelName: name,
    groupTitle: String(item.group_title || item.group || item.category || 'Live TV'),
    logo,
    card: logo,
    category: 'Others',
    sub_category: String(item.group_title || item.group || 'Live TV'),
    title: name,
    team_1: name,
    team_2: '',
    status: 'live',
    time: '',
    timezone: 'Asia/Kolkata',
    drm_key: drmKey,
    servers: [{
      id: `${source.id}:${channelId}:server`,
      name,
      channelName: name,
      logo,
      url,
      headers: item.headers && typeof item.headers === 'object' ? item.headers : {},
      isBrowser: false,
      playerType,
      sourceManaged: true,
      visible: true,
      pos: 1,
      drm_key: drmKey
    }],
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
      const matchDrmKey = extractDrmKeyFromObj(m, '');

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
          const rawStreamUrl = String(entry.proxied_url || entry.backup_proxied_url || entry.raw_url || entry.url || entry.stream_url || entry.play_url || entry.src || '').trim();
          if (!/^https?:\/\//i.test(rawStreamUrl)) continue;
          const entryDrmKey = extractDrmKeyFromObj(entry, matchDrmKey);
          const streamUrl = appendDrmToMpdUrl(rawStreamUrl, entryDrmKey);
          serverEntries.push({
            name: String(entry.name || `${groupName} ${key}`).trim(),
            url: streamUrl,
            headers: entry.headers && typeof entry.headers === 'object' ? entry.headers : {},
            playerType: /\.mpd(?:$|[?#])/i.test(streamUrl) ? 'dash' : (/\.m3u8?(?:$|[?#])/i.test(streamUrl) ? 'hls' : 'file'),
            drmKey: entryDrmKey
          });
        }
      }
      const seenStreamUrls = new Set();
      const servers = serverEntries.filter(entry => {
        const key = entry.url;
        if (seenStreamUrls.has(key)) return false;
        seenStreamUrls.add(key); return true;
      }).map((entry, n) => {
        const finalSrvDrm = entry.drmKey || matchDrmKey || '';
        const finalUrl = appendDrmToMpdUrl(entry.url, finalSrvDrm);
        return {
          name: `${title || t1 || 'Live'} (${entry.name})`,
          url: finalUrl,
          headers: entry.headers,
          isBrowser: false,
          playerType: entry.playerType,
          sourceManaged: true,
          visible: true,
          pos: n + 1,
          drm_key: finalSrvDrm,
          drmProtected: !!finalSrvDrm || !!m.drm || !!m.license_url || !!m.licenseUrl,
          drmSystem: m.drm_system || m.drmSystem || '',
          licenseUrl: m.license_url || m.licenseUrl || m.widevine_license_url || m.widevineLicenseUrl || ''
        };
      });

      const hasMatchDetails = !!(t1 && t2 && title);
      if (!hasMatchDetails && servers.length) {
        return normaliseChannelEntry({
          name: title || m.name || `Channel ${i + 1}`,
          id: m.id || m.match_id || i,
          logo: m.logo || m.image || m.banner || m.card || '',
          raw_url: servers[0].url,
          drm_key: servers[0].drm_key || matchDrmKey
        }, source, i);
      }

      return {
        id: String(m.match_id || m.id || `${source.id}_${i}`),
        sourceId: source.id,
        sourceMatchId: String(m.match_id || m.id || `${source.id}_${i}`),
        title: title || `${t1} vs ${t2}`,
        team_1: t1,
        team_2: t2,
        team_1_logo: m.team_1_logo || m.t1_logo || m.home_team_logo || m.team1_logo || '',
        team_2_logo: m.team_2_logo || m.t2_logo || m.away_team_logo || m.team2_logo || '',
        category: m.category || m.sport || m.game || 'Cricket',
        sub_category: m.sub_category || m.series || title || `${t1} vs ${t2}`,
        card: m.banner || m.card || m.image || m.cover_image || '',
        synopsis: m.synopsis || m.description || '',
        status: (() => {
          const rawStatus = String(m.status || m.match_status || m.state || '').toLowerCase();
          const rawTime = m.time || m.match_time || m.date_time || m.date || m.start_time || '';
          const parsedTime = rawTime ? new Date(rawTime).getTime() : NaN;
          if (/finish|ended|\bft\b|complete|result|abandon|no result|drawn/i.test(rawStatus)) return 'finished';
          if (/upcoming|scheduled|fixture|not started|starts at|toss/i.test(rawStatus) || (!/live|progress|innings|stumps/i.test(rawStatus) && Number.isFinite(parsedTime) && parsedTime > Date.now())) return 'upcoming';
          return 'live';
        })(),
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

(async () => { try { await fetchRawJsonFromGitHub(); } catch (e) { console.warn('GitHub preload:', e.message); } })();

app.get('/api/raw-matches', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { 
    if (!githubLoaded || inMemoryMatchesCache.length === 0) await fetchRawJsonFromGitHub(); 
    res.json({ 
      success: true, 
      v: serverDataVersion, 
      category_visibility: inMemoryCategoryVisibility, 
      sub_categories: inMemorySubCategories, 
      matches: inMemoryMatchesCache, 
      deleted_matches: inMemoryDeletedMatches 
    }); 
  }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/matches', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { 
    if (!githubLoaded || inMemoryMatchesCache.length === 0) await fetchRawJsonFromGitHub(); 
    res.json({ 
      v: serverDataVersion, 
      category_visibility: inMemoryCategoryVisibility, 
      sub_categories: inMemorySubCategories, 
      matches: inMemoryMatchesCache, 
      deleted_matches: inMemoryDeletedMatches 
    }); 
  }
  catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/matches', async (req, res) => {
  try {
    const body = req.body || {};
    if (Array.isArray(body.matches)) inMemoryMatchesCache = body.matches;
    if (Array.isArray(body.deleted_matches)) {
      inMemoryDeletedMatches = body.deleted_matches;
      sourceSyncCache.updatedAt = 0;
    }
    if (body.category_visibility) inMemoryCategoryVisibility = body.category_visibility;
    if (body.sub_categories) inMemorySubCategories = body.sub_categories;
    if (body.timerStatePayload) { inMemoryTimerState = { ...inMemoryTimerState, ...body.timerStatePayload }; delete body.timerStatePayload; }
    serverDataVersion = Date.now().toString();
    const stored = await pushJsonToGitHub({ 
      category_visibility: inMemoryCategoryVisibility, 
      sub_categories: inMemorySubCategories, 
      cloudflare_matches: inMemoryMatchesCache.filter(m => m._dbSource === 'cloudflare'), 
      matches: inMemoryMatchesCache.filter(m => m._dbSource !== 'cloudflare'), 
      cloudflare_deleted_matches: inMemoryDeletedMatches.filter(m => m._dbSource === 'cloudflare'), 
      deleted_matches: inMemoryDeletedMatches.filter(m => m._dbSource !== 'cloudflare'), 
      stream_sources: inMemoryStreamSources 
    });
    if (!stored) throw new Error('Database persistence failed');
    res.json({ success: true, v: serverDataVersion, persisted: true });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/matches/version', async (_req, res) => {
  try {
    if (!githubLoaded) await fetchRawJsonFromGitHub();
    res.json({ v: serverDataVersion });
  } catch(e) {
    res.json({ v: serverDataVersion });
  }
});

app.get('/api/timer-state', (_req, res) => res.json(inMemoryTimerState));


// ---------------------------------------------------------------------------
// Public score lookup for Cricbuzz / ESPN match URLs.
// Returns a consistent payload consumed by the existing IPTV admin + score sync.
// ---------------------------------------------------------------------------
function decodeScoreHtml(value) {
  return String(value || '')
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"').replace(/&#39;/gi, "'")
    .replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function extractCricbuzzId(input) {
  const s = String(input || '').trim();
  const m = s.match(/(?:live-cricket-scorecard|live-cricket-match|cricket-match|live-cricket-scores|cricket-scorecard)\/(\d+)/i);
  if (m) return m[1];
  if (/^\d{5,8}$/.test(s)) return s;
  return '';
}
function parseScoreText(html, originalUrl) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = decodeScoreHtml(titleMatch ? titleMatch[1] : '');
  const text = decodeScoreHtml(html);
  const vsMatch = (title + ' ' + text).match(/([A-Za-z][A-Za-z .&'()-]{1,45})\s+vs\.?\s+([A-Za-z][A-Za-z .&'()-]{1,45})/i);
  const t1 = vsMatch ? vsMatch[1].replace(/\s+-.*$/, '').trim() : '';
  const t2 = vsMatch ? vsMatch[2].split(/\s+(?:live|scorecard|cricket|match|commentary)\b/i)[0].trim() : '';

  const scoreMatches = [...text.matchAll(/\b(\d{1,4}(?:\/\d{1,2})?)\s*\((\d{1,2}(?:\.\d+)?)\s*Ov(?:ers?)?\.?\)/gi)];
  const scores = [];
  for (const m of scoreMatches) {
    const val = `${m[1]} (${m[2]} Ov)`;
    if (!scores.includes(val)) scores.push(val);
    if (scores.length === 2) break;
  }
  const statusText = (text.match(/(Match\s+(?:in progress|delayed|abandoned|tied|drawn|won|completed|ended)|Innings\s+break|Stumps|Day\s+\d+|Yet to bat|Starts at[^.]{0,80}|Scheduled|Live now|Live)/i) || [])[0] || '';
  const lower = `${title} ${statusText} ${text.slice(-1200)}`.toLowerCase();
  const isFinished = /\b(match won|won by|match drawn|match tied|abandoned|no result|innings defeat|match completed|stumps|match ended)\b/.test(lower);
  const isLive = !isFinished && (/\b(live|in progress|innings break|day \d+|stumps)\b/.test(lower) || scores.length > 0);
  const dateMatch = text.match(/(?:Starts|Start|Scheduled)\s*(?:at|:)?\s*([A-Z][a-z]{2,8}\s+\d{1,2},?\s+\d{4}[^.]{0,35})/i);
  let startTime = '';
  if (dateMatch) {
    const parsed = new Date(dateMatch[1]);
    if (!Number.isNaN(parsed.getTime())) startTime = parsed.toISOString();
  }
  const isUpcoming = !isLive && !isFinished;
  return {
    success: !!(t1 || t2 || scores.length || statusText),
    t1, t2, t1_score: scores[0] || '', t2_score: scores[1] || '',
    isLive, isFinished, isUpcoming, startTime, startTimeGMT: startTime, dateTimeGMT: startTime,
    api_status: isFinished ? 'FINISHED' : isLive ? 'LIVE' : 'UPCOMING',
    statusNotice: statusText || (isFinished ? 'MATCH FINISHED' : isLive ? 'LIVE' : 'UPCOMING'),
    dynamicBadge: isFinished ? 'MATCH ENDED' : isLive ? (statusText || 'LIVE') : 'UPCOMING',
    scoreSource: originalUrl
  };
}

app.get('/api/fetch-score', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const input = String(req.query.id || '').trim();
  if (!input) return res.status(400).json({ success: false, message: 'Missing match URL or ID' });
  try {
    let targetUrl = '';
    if (/^\d{5,8}$/.test(input)) {
      targetUrl = `https://www.cricbuzz.com/live-cricket-scorecard/${input}`;
    } else {
      let parsed;
      try { parsed = new URL(input); } catch (_) { return res.status(400).json({ success: false, message: 'Enter a valid Cricbuzz or ESPN match URL / ID' }); }
      const host = parsed.hostname.toLowerCase();
      if (!(host === 'cricbuzz.com' || host.endsWith('.cricbuzz.com') || host === 'espncricinfo.com' || host.endsWith('.espncricinfo.com') || host === 'espn.in' || host.endsWith('.espn.in'))) {
        return res.status(400).json({ success: false, message: 'Only Cricbuzz / ESPNcricinfo match URLs are supported' });
      }
      targetUrl = parsed.toString();
    }

    const id = extractCricbuzzId(input);
    const candidates = id
      ? [`https://www.cricbuzz.com/api/html/cricket-scorecard/${id}`, targetUrl]
      : [targetUrl];
    let lastError = '';
    for (const candidate of candidates) {
      try {
        const response = await fetch(candidate, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124 Safari/537.36',
            'Accept': 'text/html,application/json;q=0.9,*/*;q=0.8',
            'Referer': 'https://www.cricbuzz.com/'
          },
          signal: AbortSignal.timeout(15000)
        });
        if (!response.ok) { lastError = `Score provider returned HTTP ${response.status}`; continue; }
        const body = await response.text();
        const result = parseScoreText(body, targetUrl);
        if (result.success) {
          result.matchId = id || '';
          result.provider = candidate.includes('cricbuzz') ? 'Cricbuzz' : 'ESPNcricinfo';
          result.calculatedFinishedDate = result.isFinished ? new Date().toISOString() : '';
          return res.json(result);
        }
        lastError = 'Could not identify team names or score from the supplied match page';
      } catch (e) { lastError = e.message; }
    }
    return res.status(502).json({ success: false, message: lastError || 'Could not retrieve match score' });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
});

app.get('/api/stream-sources', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    if (!githubLoaded || inMemoryStreamSources.length === 0) {
      await fetchRawJsonFromGitHub();
    }
    res.json(inMemoryStreamSources);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

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
    res.json({ success: true, count: matches.length, matches, suppressedDeleted: parsedMatches.length - matches.length });
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
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;
