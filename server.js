const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const GITHUB_CONFIG = {
  owner: 'vsdevelopers789-hash', repo: 'live-stream-data',
  path: 'matches.json', branch: 'main', token: process.env.GITHUB_TOKEN
};

let inMemoryMatchesCache = [];
let inMemoryDeletedMatches = [];
let inMemoryCategoryVisibility = { Cricket: true, IPL: true, Football: true };
let inMemorySubCategories = { Cricket: {}, IPL: {}, Football: {} };
let inMemoryTimerState = {};
let inMemoryStreamSources = [];
let serverDataVersion = Date.now().toString();
let sourceSyncCache = { updatedAt: 0, channels: [], errors: [] };
let sourceSyncRunning = false;

app.get('/ping', (_req, res) => res.status(200).send('SERVER_ACTIVE_OK'));

async function fetchRawJsonFromGitHub() {
  if (!GITHUB_CONFIG.token) throw new Error('GITHUB_TOKEN environment variable is missing');
  const fileUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?_t=${Date.now()}`;
  const ghRes = await fetch(fileUrl, { headers: {
    Authorization: `Bearer ${GITHUB_CONFIG.token}`, Accept: 'application/vnd.github+json',
    'User-Agent': 'Render-Backend-LiveSync'
  }});
  if (!ghRes.ok) throw new Error(`GitHub fetch failed: ${ghRes.status} ${ghRes.statusText}`);
  const fileData = await ghRes.json();
  const decodedContent = Buffer.from(String(fileData.content || '').replace(/\s/g, ''), 'base64').toString('utf8');
  const parsedData = JSON.parse(decodedContent);
  if (Array.isArray(parsedData.matches)) inMemoryMatchesCache = parsedData.matches;
  if (Array.isArray(parsedData.deleted_matches)) inMemoryDeletedMatches = parsedData.deleted_matches;
  if (parsedData.category_visibility) inMemoryCategoryVisibility = parsedData.category_visibility;
  if (parsedData.sub_categories) inMemorySubCategories = parsedData.sub_categories;
  if (Array.isArray(parsedData.stream_sources)) inMemoryStreamSources = parsedData.stream_sources;
  return { parsedData, sha: fileData.sha };
}

async function pushJsonToGitHub(payload) {
  if (!GITHUB_CONFIG.token) return false;
  const fileUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
  let sha;
  const getRes = await fetch(`${fileUrl}?_t=${Date.now()}`, { headers: {
    Authorization: `Bearer ${GITHUB_CONFIG.token}`, Accept: 'application/vnd.github+json',
    'User-Agent': 'Render-Backend-LiveSync'
  }});
  if (getRes.ok) sha = (await getRes.json()).sha;
  const content = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
  const putRes = await fetch(fileUrl, { method: 'PUT', headers: {
    Authorization: `Bearer ${GITHUB_CONFIG.token}`, Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json', 'User-Agent': 'Render-Backend-LiveSync'
  }, body: JSON.stringify({ message: `Render Auto-Sync: ${Date.now()}`, content, sha, branch: GITHUB_CONFIG.branch }) });
  return putRes.ok;
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
      const logo = a['tvg-logo'] || a['logo'] || '';
      const networkLogo = a['group-logo'] || a['tvg-network-logo'] || a['network-logo'] || '';
      const networkName = a['tvg-network'] || a['network'] || source.label || 'Live TV Network';
      const serverName = `${channelName}${a['group-title'] ? ` · ${a['group-title']}` : ''}`;
      const headers = { ...pendingHeaders };
      if (pendingOptions['http-user-agent']) headers['User-Agent'] = pendingOptions['http-user-agent'];
      if (pendingOptions['http-referrer']) headers['Referer'] = pendingOptions['http-referrer'];
      if (pendingOptions['http-cookie']) headers['Cookie'] = pendingOptions['http-cookie'];
      let url = line;
      const playerType = /\.mpd(?:$|[?#])/i.test(url) ? 'dash' : (/\.m3u8?(?:$|[?#])/i.test(url) ? 'hls' : (/\.(?:mp4|m4v|webm|mov|ts|aac|mp3|m4a)(?:$|[?#])/i.test(url) ? 'direct' : 'auto'));
      const isEmbed = /(?:youtube\.com|youtu\.be|\.php(?:$|[?#])|\/embed\/)/i.test(url) && !/\.m3u8?(?:$|[?#])/i.test(url);
      const stable = `${source.id}:${channelId}`;
      channels.push({
        id: stable, fb_key: `m3u_${Buffer.from(stable).toString('base64url').slice(0, 48)}`,
        sourceId: source.id, sourceLabel: source.label || 'Feed', isChannelCard: true,
        channelId, channelName, groupTitle: a['group-title'] || currentGroup, networkName, networkLogo,
        logo, card: networkLogo || logo, category: 'Others', sub_category: 'Live TV',
        title: channelName, team_1: '', team_2: '', status: 'live', time: '', timezone: 'Asia/Kolkata',
        servers: [{ id: `${stable}:server`, name: channelName, logo, url, headers, isBrowser: isEmbed, playerType, visible: true, pos: 1 }]
      });
      pending = null;
    }
  }
  if (!channels.length) return [];
  const networkName = channels.find(c => c.networkName)?.networkName || source.label || 'Live TV Network';
  const explicitNetworkLogo = channels.find(c => c.networkLogo)?.networkLogo || '';
  const bannerLogo = explicitNetworkLogo || channels.find(c => c.logo)?.logo || '';
  const stable = `${source.id}:network`;
  return [{ id: stable, fb_key: `m3u_${Buffer.from(stable).toString('base64url').slice(0, 48)}`, sourceId: source.id,
    sourceLabel: source.label || 'Feed', isChannelCard: true, isNetworkCard: true, channelId: 'network',
    channelName: networkName, networkName, groupTitle: 'Live TV Network', logo: bannerLogo, card: bannerLogo,
    category: 'Others', sub_category: 'Live TV', title: networkName, team_1: '', team_2: '', status: 'live', time: '', timezone: 'Asia/Kolkata',
    servers: channels.flatMap(c => c.servers.map(srv => ({ ...srv, name: c.channelName, logo: c.logo, channelName: c.channelName, channelId: c.channelId }))) }];
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
    const list = Array.isArray(json) ? json : (json.Matches || json.matches || json.data || json.events || []);
    return list.map((m, i) => {
      const t1 = m.team_1 || m.t1 || 'Team 1';
      const t2 = m.team_2 || m.t2 || 'Team 2';
      const title = m.event_name || m.title || `${t1} vs ${t2}`;
      const rawStatus = String(m.status || m.match_status || 'live').toLowerCase();
      const status = /finish|ended|\bft\b|complete/.test(rawStatus) ? 'finished' : 'live';
      const serverMap = m.CnpTV || m.stream_url_alpha || {};
      const servers = Object.entries(serverMap).filter(([, v]) => typeof v === 'string' && /^https?:/i.test(v)).map(([k, v], n) => ({
        name: `${title} (${k})`, url: v + (m.drm_key ? `|drmLicense=${m.drm_key}` : ''),
        isBrowser: false, playerType: /\.mpd/i.test(v) ? 'dash' : 'hls', visible: true, pos: n + 1
      }));
      return { id: String(m.match_id || m.id || `${source.id}_${i}`), title, team_1: t1, team_2: t2,
        category: m.category || 'Cricket', sub_category: m.sub_category || title, card: m.banner || m.card || '',
        status, time: m.time || m.match_time || m.date_time || m.date || '', timezone: m.timezone || m.tz || 'Asia/Kolkata', servers };
    }).filter(m => m.servers.length);
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
  try { if (!inMemoryMatchesCache.length) await fetchRawJsonFromGitHub(); res.json({ success: true, v: serverDataVersion, category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/matches', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try { if (!inMemoryMatchesCache.length) await fetchRawJsonFromGitHub(); res.json({ v: serverDataVersion, category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
app.post('/api/matches', async (req, res) => {
  try {
    const body = req.body || {};
    if (Array.isArray(body.matches)) inMemoryMatchesCache = body.matches;
    if (Array.isArray(body.deleted_matches)) inMemoryDeletedMatches = body.deleted_matches;
    if (body.category_visibility) inMemoryCategoryVisibility = body.category_visibility;
    if (body.sub_categories) inMemorySubCategories = body.sub_categories;
    if (body.timerStatePayload) { inMemoryTimerState = { ...inMemoryTimerState, ...body.timerStatePayload }; delete body.timerStatePayload; }
    serverDataVersion = Date.now().toString();
    pushJsonToGitHub({ category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches, stream_sources: inMemoryStreamSources }).catch(e => console.error('GitHub push:', e.message));
    res.json({ success: true, v: serverDataVersion });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/matches/version', (_req, res) => res.json({ v: serverDataVersion }));
app.get('/api/timer-state', (_req, res) => res.json(inMemoryTimerState));
app.get('/api/stream-sources', (_req, res) => res.setHeader('Cache-Control', 'no-store').json(inMemoryStreamSources));
app.post('/api/stream-sources', (req, res) => {
  const { id, label, url } = req.body || {};
  if (!url || !/^https?:\/\//i.test(url)) return res.status(400).json({ success: false, error: 'Valid HTTP/HTTPS URL required' });
  if (id) inMemoryStreamSources = inMemoryStreamSources.map(s => s.id === id ? { ...s, label: label || 'Feed', url, ...(typeof req.body.approved === 'boolean' ? { approved: req.body.approved } : {}), ...(req.body.targetDatabase ? { targetDatabase: req.body.targetDatabase } : {}) } : s);
  else inMemoryStreamSources.push({ id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: label || 'Feed', url, approved: req.body.approved === true, targetDatabase: req.body.targetDatabase || 'cloudflare' });
  sourceSyncCache.updatedAt = 0;
  pushJsonToGitHub({ category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches, stream_sources: inMemoryStreamSources }).catch(e => console.error('Persist sources:', e.message));
  res.json({ success: true, sources: inMemoryStreamSources });
});
app.post('/api/stream-sources/delete/:id', (req, res) => {
  inMemoryStreamSources = inMemoryStreamSources.filter(s => s.id !== req.params.id);
  sourceSyncCache.updatedAt = 0;
  pushJsonToGitHub({ category_visibility: inMemoryCategoryVisibility, sub_categories: inMemorySubCategories, matches: inMemoryMatchesCache, deleted_matches: inMemoryDeletedMatches, stream_sources: inMemoryStreamSources }).catch(e => console.error('Persist sources:', e.message));
  res.json({ success: true, sources: inMemoryStreamSources });
});
app.get('/api/parse-source', async (req, res) => {
  if (!req.query.url) return res.status(400).json({ success: false, error: 'Missing url' });
  try {
    const source = { id: 'manual_parse', label: 'Manual Source', url: String(req.query.url) };
    const matches = await fetchAndParseSource(source);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, count: matches.length, matches });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/sync-stream-sources', async (_req, res) => {
  try { const data = await syncAllSources(); res.setHeader('Cache-Control', 'no-store'); res.json({ success: true, ...data }); }
  catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// Keep server-side source cache warm every 60 seconds; frontend applies changes to Cloudflare match storage.
setInterval(() => { if (inMemoryStreamSources.length) syncAllSources().catch(e => console.error('Source sync:', e.message)); }, 60000);

app.get('/api/fetch-score', async (req, res) => {
  const target = String(req.query.id || '');
  if (!target) return res.status(400).json({ success: false, message: 'Missing id/url' });
  try {
    const m = target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
    const cbMatchId = m ? (m[1] || m[0]) : target;
    const cbRes = await fetch(`https://www.cricbuzz.com/api/cricket-match/commentary/${cbMatchId}`, { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!cbRes.ok) throw new Error('Cricbuzz fetch failed');
    const cbJson = await cbRes.json(); const h = cbJson.matchHeader || {}; const mini = cbJson.miniscore || {};
    let s1 = '', s2 = '';
    (mini.matchScoreDetails?.inningsScoreList || []).forEach(sc => { const v = `${sc.score || sc.runs}/${sc.wickets || 0} (${sc.overs || 0} ov)`; if (sc.inningsId === 1) s1 = v; else if (sc.inningsId === 2) s2 = v; });
    res.json({ success: true, t1: h.team1?.name || 'Team 1', t2: h.team2?.name || 'Team 2', t1_score: s1, t2_score: s2, isLive: h.state === 'inprogress', isFinished: h.state === 'complete' });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render Server running on port ${PORT}`));
