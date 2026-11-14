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
  const out = {}; const re = /([\w-]+)=(?:"([^"]*)"|([^,]*))/g; let m;
  while ((m = re.exec(line))) out[m[1].toLowerCase()] = (m[2] ?? m[3] ?? '').trim();
  return out;
}
function getPlayerType(url) {
  const u = String(url || '').toLowerCase();
  return /\.mpd(?:$|[?#])/.test(u) ? 'dash' : (/\.m3u8?(?:$|[?#])/.test(u) ? 'hls' : 'iframe');
}
function parseM3U(text, source) {
  const lines = String(text || '').replace(/^\uFEFF/, '').split(/\r?\n/);
  const channels = []; let pending = null, headers = {}, options = {}, currentGroup = 'Live TV';
  for (const raw of lines) {
    const line = raw.trim(); if (!line) continue;
    if (line.startsWith('#EXTINF:')) {
      const comma = line.indexOf(','); const meta = comma >= 0 ? line.slice(0, comma) : line;
      const display = comma >= 0 ? line.slice(comma + 1).trim() : '';
      const attrs = parseAttributeList(meta); currentGroup = attrs['group-title'] || currentGroup;
      pending = { attrs, displayName: display || attrs['tvg-name'] || attrs['tvg-id'] || 'Live Channel' }; headers = {}; options = {}; continue;
    }
    if (line.startsWith('#EXTVLCOPT:') && pending) { const v=line.slice(11), i=v.indexOf('='); if(i>0) options[v.slice(0,i).trim().toLowerCase()]=v.slice(i+1).trim(); continue; }
    if (line.startsWith('#EXTHTTP:') && pending) { try { Object.assign(headers, JSON.parse(line.slice(9))); } catch (_) {} continue; }
    if (line.startsWith('#')) continue;
    if (/^https?:\/\//i.test(line) && pending) {
      const a=pending.attrs, name=a['tvg-name'] || pending.displayName, id=a['tvg-id'] || name;
      const h={...headers}; if(options['http-user-agent'])h['User-Agent']=options['http-user-agent']; if(options['http-referrer'])h.Referer=options['http-referrer']; if(options['http-cookie'])h.Cookie=options['http-cookie'];
      const stable=`${source.id}:${id}`;
      channels.push({ id:stable, fb_key:`m3u_${Buffer.from(stable).toString('base64url').slice(0,48)}`, sourceId:source.id, sourceLabel:source.label||'Feed', isChannelCard:true,
        channelId:id, channelName:name, groupTitle:a['group-title']||currentGroup, logo:a['tvg-logo']||'', card:a['tvg-logo']||'', title:name,
        servers:[{id:`${stable}:server`,name,url:line,headers:h,isBrowser:getPlayerType(line)==='iframe',playerType:getPlayerType(line),visible:true,pos:1,channelLogo:a['tvg-logo']||''}] });
      pending=null;
    }
  }
  return channels;
}
function normalizeName(v) { return String(v||'').toLowerCase().replace(/\b(browserplay|hd|sd)\b/g,'').replace(/[^a-z0-9]+/g,' ').trim(); }
function makeMatchRecord(m, source, i) {
  const t1=m.team_1||m.t1||m.team1?.name||'', t2=m.team_2||m.t2||m.team2?.name||'';
  const title=m.event_name||m.title||m.name||`${t1} vs ${t2}`;
  const map={...(m.CnpTV||{}),...(m.stream_url_alpha||{}),...(m.stream_url_bravo||{})};
  if(Array.isArray(m.streams)) m.streams.forEach((x,j)=>{ if(typeof x==='string')map[`Server ${j+1}`]=x; else if(x?.url)map[x.name||`Server ${j+1}`]=x.url; });
  if(m.raw_url) map[m.name||'Main Server']=m.raw_url;
  const drm=m.drm_key||m.drmKey||'';
  const servers=Object.entries(map).filter(([,v])=>typeof v==='string'&&/^https?:\/\//i.test(v)).map(([name,url],n)=>({name,url:url+(drm&&!url.includes('drmLicense=')?`|drmLicense=${drm}`:''),drmKey:drm,playerType:getPlayerType(url),isBrowser:getPlayerType(url)==='iframe',visible:true,pos:n+1}));
  const rawStatus=String(m.status||m.match_status||'live').toLowerCase();
  const status=/finish|ended|\bft\b|complete|result/.test(rawStatus)?'finished':(/upcoming|scheduled|not.?start/.test(rawStatus)?'upcoming':'live');
  const teamParts=title.split(/\s+-\s+/).pop().split(/\s+vs\s+/i);
  return {id:String(m.match_id||m.id||`${source.id}_${i}`),sourceId:source.id,title,team_1:t1||teamParts[0]||'Team 1',team_2:t2||teamParts[1]||'Team 2',
    category:m.category||m.sport||'Cricket',sub_category:m.sub_category||m.series||title,card:m.banner||m.card||m.image||m.cover_image||'',
    team_1_logo:m.team_1_logo||m.t1_img||m.team1?.logo||'',team_2_logo:m.team_2_logo||m.t2_img||m.team2?.logo||'',status,
    time:m.time||m.match_time||m.date_time||m.date||m.start_time||'',timezone:m.timezone||m.tz||'Asia/Kolkata',servers};
}
async function fetchAndParseSource(source) {
  const u=new URL(source.url); if(!['http:','https:'].includes(u.protocol))throw new Error('Only HTTP/HTTPS source URLs are allowed');
  const controller=new AbortController(), timeout=setTimeout(()=>controller.abort(),20000);
  try {
    const response=await fetch(u,{headers:{'User-Agent':'Mozilla/5.0 (compatible; LiveSourceSync/1.0)','Accept':'*/*'},signal:controller.signal});
    if(!response.ok)throw new Error(`HTTP ${response.status}`);
    const body=await response.text(); if(body.length>12*1024*1024)throw new Error('Source exceeds 12MB limit');
    if(body.trimStart().startsWith('#EXTM3U')||body.includes('#EXTINF:'))return {type:'channels',matches:parseM3U(body,source)};
    let json; try{json=JSON.parse(body)}catch(_){throw new Error('Unsupported source: expected M3U or JSON')}
    // Sony-style JSON channel directory: channels[{id,name,raw_url,proxied_url}]
    if(Array.isArray(json.channels)) {
      let logoMap={};
      if(json.source && /^https?:\/\//i.test(json.source)) {
        try { const lr=await fetch(json.source,{headers:{'User-Agent':'Mozilla/5.0','Accept':'*/*'},signal:controller.signal}); if(lr.ok){const txt=await lr.text(); parseM3U(txt,source).forEach(c=>{logoMap[normalizeName(c.channelId)]=c.logo;logoMap[normalizeName(c.channelName)]=c.logo;});} } catch(_){}
      }
      const channels=json.channels.map((c,i)=>{const name=c.name||c.title||`Channel ${i+1}`, id=String(c.id||c.tvg_id||name), raw=c.raw_url||c.url||c.stream_url||c.proxied_url||c.backup_proxied_url||'';
        const urls=[c.raw_url,c.proxied_url,c.backup_proxied_url,c.url,c.stream_url].filter((v,j,a)=>typeof v==='string'&&/^https?:\/\//i.test(v)&&a.indexOf(v)===j);
        const logo=c.logo||c.tvg_logo||logoMap[normalizeName(id)]||logoMap[normalizeName(name)]||'';
        return {id:`${source.id}:${id}`,fb_key:`jsonch_${Buffer.from(`${source.id}:${id}`).toString('base64url').slice(0,42)}`,sourceId:source.id,sourceLabel:source.label||'Feed',isChannelCard:true,channelId:id,channelName:name,groupTitle:c.group||c.category||source.label||'Live TV',logo,card:logo,title:name,servers:urls.map((url,j)=>({name:j===0?'Main Server':j===1?'Backup Server':`Server ${j+1}`,url,playerType:getPlayerType(url),isBrowser:getPlayerType(url)==='iframe',visible:true,pos:j+1,channelLogo:logo}))};
      }).filter(c=>c.servers.length);
      return {type:'channels',matches:channels};
    }
    const rawList=Array.isArray(json)?json:(json.Matches||json.matches||json.data||json.events||[]);
    if(!Array.isArray(rawList))throw new Error('JSON feed has no matches[] or channels[] array');
    const matches=rawList.map((m,i)=>makeMatchRecord(m,source,i)).filter(m=>m.servers.length);
    return {type:'matches',matches};
  } finally {clearTimeout(timeout)}
}

async function syncAllSources() {
  if (sourceSyncRunning) return sourceSyncCache;
  sourceSyncRunning = true;
  const channels = [], errors = [];
  try {
    const results = await Promise.all(inMemoryStreamSources.map(async source => {
      try { return await fetchAndParseSource(source); }
      catch (e) { errors.push({ id: source.id, label: source.label, error: e.message }); return { type: 'error', matches: [] }; }
    }));
    results.forEach(result => channels.push(...(result.matches || [])));
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
  if (id) inMemoryStreamSources = inMemoryStreamSources.map(s => s.id === id ? { ...s, label: label || 'Feed', url } : s);
  else inMemoryStreamSources.push({ id: `src_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`, label: label || 'Feed', url });
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
    const parsed = await fetchAndParseSource(source);
    res.setHeader('Cache-Control', 'no-store');
    res.json({ success: true, type: parsed.type, count: parsed.matches.length, matches: parsed.matches });
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
