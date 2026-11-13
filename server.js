const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// =========================================================================
// 1. GITHUB CONFIGURATION & IN-MEMORY CACHE
// =========================================================================
const GITHUB_CONFIG = {
  owner: "vsdevelopers789-hash",
  repo: "live-stream-data",
  path: "matches.json",
  branch: "main",
  token: process.env.GITHUB_TOKEN // Render Environment Variable నుండి టోకెన్ తీసుకుంటుంది
};

let inMemoryMatchesCache = [];
let inMemoryDeletedMatches = [];
let inMemoryCategoryVisibility = { Cricket: true, IPL: true, Football: true };
let inMemorySubCategories = { Cricket: {}, IPL: {}, Football: {} };
let inMemoryTimerState = {};
let inMemoryStreamSources = [];
let serverDataVersion = Date.now().toString();

// Keep-Alive Health Route (Prevents Render from sleeping)
app.get('/ping', (req, res) => {
  res.status(200).send('SERVER_ACTIVE_OK');
});

// =========================================================================
// 2. GITHUB RAW JSON FILE FETCHER & PUSHER
// =========================================================================
async function fetchRawJsonFromGitHub() {
  if (!GITHUB_CONFIG.token) throw new Error("GITHUB_TOKEN environment variable is missing!");

  const fileUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}?_t=${Date.now()}`;
  const ghRes = await fetch(fileUrl, {
    headers: {
      "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
      "Accept": "application/vnd.github+json",
      "User-Agent": "Render-Backend-LiveSync"
    }
  });

  if (!ghRes.ok) throw new Error(`GitHub fetch failed: ${ghRes.statusText}`);

  const fileData = await ghRes.json();
  const rawCleanBase64 = fileData.content.replace(/\s/g, '');
  const decodedContent = Buffer.from(rawCleanBase64, 'base64').toString('utf-8');
  const parsedData = JSON.parse(decodedContent);

  if (Array.isArray(parsedData.matches)) inMemoryMatchesCache = parsedData.matches;
  if (Array.isArray(parsedData.deleted_matches)) inMemoryDeletedMatches = parsedData.deleted_matches;
  if (parsedData.category_visibility) inMemoryCategoryVisibility = parsedData.category_visibility;
  if (parsedData.sub_categories) inMemorySubCategories = parsedData.sub_categories;

  return { parsedData, sha: fileData.sha };
}

async function pushJsonToGitHub(payload) {
  if (!GITHUB_CONFIG.token) return false;

  const fileUrl = `https://api.github.com/repos/${GITHUB_CONFIG.owner}/${GITHUB_CONFIG.repo}/contents/${GITHUB_CONFIG.path}`;
  let fileSha = "";

  try {
    const getRes = await fetch(fileUrl + `?_t=${Date.now()}`, {
      headers: {
        "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "Render-Backend-LiveSync"
      }
    });
    if (getRes.ok) {
      const fData = await getRes.json();
      fileSha = fData.sha;
    }
  } catch (e) {}

  const contentEncoded = Buffer.from(JSON.stringify(payload, null, 2)).toString('base64');
  const putRes = await fetch(fileUrl, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${GITHUB_CONFIG.token}`,
      "Accept": "application/vnd.github+json",
      "Content-Type": "application/json",
      "User-Agent": "Render-Backend-LiveSync"
    },
    body: JSON.stringify({
      message: `Render Auto-Sync: ${Date.now()}`,
      content: contentEncoded,
      sha: fileSha || undefined,
      branch: GITHUB_CONFIG.branch
    })
  });

  return putRes.ok;
}

(async () => {
  try {
    await fetchRawJsonFromGitHub();
    console.log("Successfully preloaded matches.json from GitHub into Render memory.");
  } catch (e) {
    console.warn("Preload warning:", e.message);
  }
})();

// =========================================================================
// 3. RENDER REPLACEMENT APIS (RAW MATCHES, VERSION, TIMER, SOURCES, PARSER)
// =========================================================================
app.get('/api/raw-matches', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    if (inMemoryMatchesCache.length === 0) await fetchRawJsonFromGitHub();
    res.status(200).json({
      success: true,
      v: serverDataVersion,
      category_visibility: inMemoryCategoryVisibility,
      sub_categories: inMemorySubCategories,
      matches: inMemoryMatchesCache,
      deleted_matches: inMemoryDeletedMatches
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/matches', async (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  try {
    if (inMemoryMatchesCache.length === 0) await fetchRawJsonFromGitHub();
    res.status(200).json({
      v: serverDataVersion,
      category_visibility: inMemoryCategoryVisibility,
      sub_categories: inMemorySubCategories,
      matches: inMemoryMatchesCache,
      deleted_matches: inMemoryDeletedMatches
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/matches', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.matches) inMemoryMatchesCache = body.matches;
    if (body.deleted_matches) inMemoryDeletedMatches = body.deleted_matches;
    if (body.category_visibility) inMemoryCategoryVisibility = body.category_visibility;
    if (body.sub_categories) inMemorySubCategories = body.sub_categories;
    if (body.timerStatePayload) {
      inMemoryTimerState = { ...inMemoryTimerState, ...body.timerStatePayload };
      delete body.timerStatePayload;
    }

    serverDataVersion = Date.now().toString();
    const fullPayload = {
      category_visibility: inMemoryCategoryVisibility,
      sub_categories: inMemorySubCategories,
      matches: inMemoryMatchesCache,
      deleted_matches: inMemoryDeletedMatches
    };

    pushJsonToGitHub(fullPayload).catch(e => {});
    res.status(200).json({ success: true, v: serverDataVersion });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/matches/version', (req, res) => {
  res.status(200).json({ v: serverDataVersion });
});

app.get('/api/timer-state', (req, res) => {
  res.status(200).json(inMemoryTimerState);
});

// Stream Sources Pool
app.get('/api/stream-sources', (req, res) => {
  res.status(200).json(inMemoryStreamSources);
});

app.post('/api/stream-sources', (req, res) => {
  const { id, label, url } = req.body;
  if (!url) return res.status(400).json({ success: false });
  if (id) {
    inMemoryStreamSources = inMemoryStreamSources.map(s => s.id === id ? { ...s, label, url } : s);
  } else {
    inMemoryStreamSources.push({ id: 'src_' + Date.now(), label: label || "Feed", url });
  }
  res.status(200).json({ success: true, sources: inMemoryStreamSources });
});

app.post('/api/stream-sources/delete/:id', (req, res) => {
  inMemoryStreamSources = inMemoryStreamSources.filter(s => s.id !== req.params.id);
  res.status(200).json({ success: true, sources: inMemoryStreamSources });
});

// Parse Source API (Robust Time, Timezone & Status Extraction)
app.get('/api/parse-source', async (req, res) => {
  const targetUrl = req.query.url;
  if (!targetUrl) return res.status(400).json({ error: "Missing url" });

  try {
    const fetchRes = await fetch(targetUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });
    if (!fetchRes.ok) throw new Error("Feed fetch failed");

    const data = await fetchRes.json();
    const extractedMatches = [];
    let rawList = Array.isArray(data) ? data : (data.Matches || data.matches || data.data || data.events || []);

    rawList.forEach((match, mIdx) => {
      let team1 = match.team_1 || match.t1 || "Team 1";
      let team2 = match.team_2 || match.t2 || "Team 2";
      const titleText = match.event_name || match.title || "";
      
      if (titleText.includes(" vs ")) {
        const parts = titleText.split(" vs ");
        if (parts.length === 2 && team1 === "Team 1") {
          team1 = parts[0].trim();
          team2 = parts[1].trim();
        }
      }

      // Match Status Mapping (Live vs Finished)
      let rawStatus = (match.status || match.match_status || "live").toLowerCase();
      let matchStatus = "live";
      if (rawStatus.includes("finish") || rawStatus.includes("ended") || rawStatus.includes("ft") || rawStatus.includes("completed") || rawStatus.includes("ltvp")) {
        matchStatus = rawStatus.includes("finish") || rawStatus.includes("ended") || rawStatus.includes("ft") ? "finished" : "live";
      }

      // Robust Date, Time & Timezone Extraction
      const matchTime = match.time || match.match_time || match.date_time || match.date || match.start_time || match.finished_at || "";
      const matchTimezone = match.timezone || match.tz || match.time_zone || "IST";

      const srvList = [];
      let posCounter = 1;

      if (match.CnpTV) {
        Object.keys(match.CnpTV).forEach(srvKey => {
          const sUrl = match.CnpTV[srvKey];
          if (sUrl && typeof sUrl === 'string' && sUrl.startsWith('http')) {
            srvList.push({
              name: `${match.event_name || 'Match'} (${srvKey.replace(/_/g, ' ').toUpperCase()})`,
              url: sUrl + (match.drm_key ? `|drmLicense=${match.drm_key}` : ""),
              isBrowser: false,
              playerType: sUrl.includes('.mpd') ? 'dash' : 'hls',
              visible: true,
              pos: posCounter++
            });
          }
        });
      } else if (match.stream_url_alpha) {
        Object.keys(match.stream_url_alpha).forEach(alphaKey => {
          const aUrl = match.stream_url_alpha[alphaKey];
          if (aUrl && typeof aUrl === 'string' && aUrl.startsWith('http')) {
            srvList.push({
              name: `${match.event_name || 'Match'} - ${alphaKey}`,
              url: aUrl + (match.drm_key ? `|drmLicense=${match.drm_key}` : ""),
              isBrowser: false,
              playerType: aUrl.includes('.mpd') ? 'dash' : 'hls',
              visible: true,
              pos: posCounter++
            });
          }
        });
      }

      if (srvList.length > 0) {
        const matchId = String(match.match_id || match.id || `match_${mIdx}_${Date.now()}`);

        extractedMatches.push({
          id: matchId,
          title: titleText || `${team1} vs ${team2}`,
          team_1: team1,
          team_2: team2,
          category: "Cricket",
          sub_category: titleText,
          card: match.banner || match.card || "",
          status: matchStatus,
          time: matchTime,
          timezone: matchTimezone,
          servers: srvList
        });
      }
    });

    res.status(200).json({
      success: true,
      count: extractedMatches.length,
      matches: extractedMatches
    });
  } catch(err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// =========================================================================
// 4. LIVE CRICKET SCORE ROUTE (CRICBUZZ)
// =========================================================================
app.get('/api/fetch-score', async (req, res) => {
  const target = req.query.id || "";
  if (!target) return res.status(400).json({ success: false, message: "Missing id/url" });

  try {
    let cbMatchId = target;
    const m = target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
    if (m && m[1]) cbMatchId = m[1];

    const cbUrl = `https://www.cricbuzz.com/api/cricket-match/commentary/${cbMatchId}`;
    const headers = { "User-Agent": "Mozilla/5.0" };
    const cbRes = await fetch(cbUrl, { headers });
    if (!cbRes.ok) throw new Error("Cricbuzz fetch failed");
    
    const cbJson = await cbRes.json();
    const mHeader = cbJson.matchHeader || {};
    const minScore = cbJson.miniscore || {};

    let s1 = "", s2 = "";
    const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];
    inningsList.forEach(sc => {
      const formatted = `${sc.score || sc.runs}/${sc.wickets || 0} (${sc.overs || 0} ov)`;
      if (sc.inningsId === 1) s1 = formatted;
      else if (sc.inningsId === 2) s2 = formatted;
    });

    res.json({
      success: true,
      t1: mHeader.team1?.name || "Team 1",
      t2: mHeader.team2?.name || "Team 2",
      t1_score: s1,
      t2_score: s2,
      isLive: mHeader.state === "inprogress",
      isFinished: mHeader.state === "complete"
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 5. LISTEN ON PORT
// =========================================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Render Server running on port ${PORT}`));
