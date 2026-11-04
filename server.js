const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// =========================================================================
// 1. COMPLETE CRICAPI HIGH-RES SVG COUNTRY FLAGS CDN BASE & MAPPINGS
// =========================================================================
const CRICAPI_FLAG_CDN_BASE = "https://cdorg.b-cdn.net/flags";

let DYNAMIC_COUNTRY_CDN_MAP = {
  "india": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "ind": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "indw": `${CRICAPI_FLAG_CDN_BASE}/in.svg`,
  "australia": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "aus": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "ausw": `${CRICAPI_FLAG_CDN_BASE}/au.svg`,
  "england": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "eng": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "engw": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`,
  "southafrica": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "rsa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "sa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "saw": `${CRICAPI_FLAG_CDN_BASE}/za.svg`,
  "pakistan": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pak": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pakw": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`,
  "newzealand": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nz": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nzw": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`,
  "westindies": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wi": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wiw": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`,
  "srilanka": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "sl": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "slw": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`,
  "bangladesh": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "ban": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "bd": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "banw": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`,
  "afghanistan": `${CRICAPI_FLAG_CDN_BASE}/af.svg`, "afg": `${CRICAPI_FLAG_CDN_BASE}/af.svg`,
  "zimbabwe": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zim": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zimw": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`,
  "ireland": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "ire": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "irew": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`
};

async function preloadCricapiCountries() {
  try {
    const res = await fetch("https://api.cricapi.com/v1/countries?apikey=054d5acf-f4ca-4eda-bb3b-a547f2386ef5&offset=0");
    if (res.ok) {
      const json = await res.json();
      if (json && json.status === "success" && Array.isArray(json.data)) {
        json.data.forEach(item => {
          if (item.genericFlag && item.name) {
            const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]/g, '');
            DYNAMIC_COUNTRY_CDN_MAP[cleanName] = item.genericFlag;
            if (item.id) {
              DYNAMIC_COUNTRY_CDN_MAP[item.id.toLowerCase()] = item.genericFlag;
            }
          }
        });
      }
    }
  } catch (e) {}
}
preloadCricapiCountries();

// =========================================================================
// 2. TEAM HELPERS
// =========================================================================
const TEAM_ALIASES = {
  "ind": ["india", "ind", "indw", "indiaw", "indiawomen", "teamindia", "indians", "bcci"],
  "nz":  ["newzealand", "nz", "nzw", "newzealandw", "whiteferns", "blackcaps"],
  "aus": ["australia", "aus", "ausw", "australiaw", "australiawomen", "aussie", "aussies"],
  "eng": ["england", "eng", "engw", "englandw", "englandwomen"],
  "pak": ["pakistan", "pak", "pakw", "pakistanw", "pakistanwomen"],
  "sa":  ["southafrica", "sa", "rsa", "saw", "southafricaw", "proteas"],
  "wi":  ["westindies", "wi", "wiw", "windies", "westindiesw"],
  "sl":  ["srilanka", "sl", "slw", "srilankaw", "srilankawomen"],
  "ban": ["bangladesh", "ban", "bd", "banw", "bangladeshw", "tigers"],
  "afg": ["afghanistan", "afg", "afghan"],
  "zim": ["zimbabwe", "zim", "zimw", "zimbabwew", "zimbabwewomen", "chevrons"],
  "ire": ["ireland", "ire", "irew", "irelandw"]
};

function getTeamFlagUrl(teamName) {
  if (!teamName) return "";
  const clean = String(teamName).toLowerCase().replace(/women|champions|u19|xi|national|team/g, '').replace(/[^a-z0-9]/g, '').trim();

  if (DYNAMIC_COUNTRY_CDN_MAP[clean]) return DYNAMIC_COUNTRY_CDN_MAP[clean];

  for (let key in DYNAMIC_COUNTRY_CDN_MAP) {
    const kClean = key.replace(/[^a-z0-9]/g, '');
    if (clean === kClean || (clean.length >= 3 && (clean.includes(kClean) || kClean.includes(clean)))) {
      return DYNAMIC_COUNTRY_CDN_MAP[key];
    }
  }

  for (const [code, aliases] of Object.entries(TEAM_ALIASES)) {
    if (aliases.includes(clean) || aliases.some(a => clean.includes(a) || a.includes(clean))) {
      return `${CRICAPI_FLAG_CDN_BASE}/${code}.svg`;
    }
  }
  return "";
}

function isSameTeam(nameA, nameB) {
  if (!nameA || !nameB) return false;
  const a = String(nameA).toLowerCase().replace(/[^a-z0-9]/g, '');
  const b = String(nameB).toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 3 && b.length >= 3 && (a.includes(b) || b.includes(a))) return true;

  for (const group of Object.values(TEAM_ALIASES)) {
    const aIn = group.some(x => a === x || a.startsWith(x) || x.startsWith(a));
    const bIn = group.some(x => b === x || b.startsWith(x) || x.startsWith(b));
    if (aIn && bIn) return true;
  }
  return false;
}

function extractSeriesFromUrlSlug(urlStr) {
  if (!urlStr || !urlStr.includes("cricbuzz.com")) return "";
  const parts = urlStr.split('/');
  const lastPart = parts[parts.length - 1] || parts[parts.length - 2] || "";
  const cleanMatch = lastPart.replace(/^[a-z0-9]+-vs-[a-z0-9]+(?:-[0-9]+(?:st|nd|rd|th)?-match)?-/i, '');
  if (cleanMatch && cleanMatch !== lastPart && cleanMatch.length > 3) {
    return cleanMatch.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }
  return "";
}

function parseToIsoDate(rawVal) {
  if (!rawVal) return "";
  try {
    let epoch = 0;
    if (typeof rawVal === 'number' || /^\d{10,13}$/.test(String(rawVal).trim())) {
      epoch = parseInt(String(rawVal).trim());
      if (String(epoch).length === 10) epoch *= 1000;
    } else {
      epoch = new Date(rawVal).getTime();
    }
    if (epoch && !isNaN(epoch)) {
      return new Date(epoch).toISOString();
    }
  } catch(e) {}
  return "";
}

function calculateSeriesSmartTime(startDateVal, seriesOrFormatText, isFinished) {
  if (!startDateVal) return "";
  try {
    let startEpoch = 0;
    if (typeof startDateVal === 'number' || /^\d{10,13}$/.test(String(startDateVal).trim())) {
      startEpoch = parseInt(String(startDateVal).trim());
      if (String(startEpoch).length === 10) startEpoch *= 1000;
    } else {
      startEpoch = new Date(startDateVal).getTime();
    }
    if (!startEpoch || isNaN(startEpoch)) return "";
    if (!isFinished) return new Date(startEpoch).toISOString();

    const text = String(seriesOrFormatText || '').toLowerCase();
    let playingDurationHours = (text.includes('test')) ? 7.0 : ((text.includes('odi')) ? 8.0 : 3.5);
    return new Date(startEpoch + (playingDurationHours + 3.0) * 3600000).toISOString();
  } catch (e) {
    return "";
  }
}

// =========================================================================
// 3. API ROUTE
// =========================================================================
app.get('/api/fetch-score', async (req, res) => {
  const target = req.query.id || "";
  const t1Query = (req.query.t1 || "").trim();
  const t2Query = (req.query.t2 || "").trim();

  if (!target) {
    return res.status(400).json({ success: false, message: "Missing id/url parameter" });
  }

  try {
    let cbMatchId = target;
    const m = target.match(/(?:cricket-scores|live-cricket-scores|cricket-match-highlights)\/(\d+)/i) || target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
    if (m && m[1]) cbMatchId = m[1];
    else if (m && m[0]) cbMatchId = m[0];

    const detectedSeries = extractSeriesFromUrlSlug(target);
    const cbUrl = `https://www.cricbuzz.com/api/cricket-match/commentary/${cbMatchId}`;
    const cbInfoUrl = `https://www.cricbuzz.com/api/cricket-match/info/${cbMatchId}`;
    const targetWebUrl = target.includes("http") ? target : `https://www.cricbuzz.com/live-cricket-scores/${cbMatchId}`;

    let mHeader = {};
    let minScore = {};
    let cbJson = {};
    let infoJson = {};
    let rawStart = null;
    let htmlText = "";

    const results = await Promise.allSettled([
      fetch(cbUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36", "Accept": "application/json" } }),
      fetch(cbInfoUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36", "Accept": "application/json" } }),
      fetch(targetWebUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36", "Accept": "text/html" } })
    ]);

    if (results[0].status === "fulfilled" && results[0].value.ok) {
      try { cbJson = await results[0].value.json(); mHeader = cbJson.matchHeader || {}; minScore = cbJson.miniscore || {}; } catch(e){}
    }
    if (results[1].status === "fulfilled" && results[1].value.ok) {
      try { infoJson = await results[1].value.json(); } catch(e){}
    }
    if (results[2].status === "fulfilled" && results[2].value.ok) {
      try { htmlText = await results[2].value.text(); } catch(e){}
    }

    rawStart = infoJson.matchInfo?.startDate || infoJson.startDate || mHeader.startDate || mHeader.matchStartTimestamp;

    // టీమ్ పేర్లు
    let t1Name = mHeader.team1?.name || mHeader.team1?.sName || infoJson.matchInfo?.team1?.name || "";
    let t2Name = mHeader.team2?.name || mHeader.team2?.sName || infoJson.matchInfo?.team2?.name || "";

    if ((!t1Name || !t2Name) && htmlText) {
      const h1Match = htmlText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
      if (h1Match) {
        const parts = h1Match[1].replace(/<[^>]+>/g, '').split(/ vs |, /i);
        if (parts.length >= 2) {
          if (!t1Name) t1Name = parts[0].trim();
          if (!t2Name) t2Name = parts[1].trim();
        }
      }
    }

    const outT1 = t1Query || t1Name || "New Zealand";
    const outT2 = t2Query || t2Name || "India";

    let s1 = "", s2 = "";
    const isInningsBreak = htmlText.includes("Innings Break") || (cbJson.status && cbJson.status.toLowerCase().includes("innings break"));

    // =========================================================================
    // CRICBUZZ లైవ్ హెడర్ నుంచి అసలైన స్కోరు మరియు ఓవర్లు తీసుకోవడం
    // =========================================================================
    let directHeaderScore = "";
    if (htmlText) {
      // 1. Cricbuzz హెడర్ క్లాస్ నుండి నేరుగా లైవ్ స్కోర్: ఉదా. "185 (40.2)" లేదా "185-9 (35.1)"
      const headerRegex = /class="[^"]*(?:cb-font-20|cb-text-bold|ui-header)[^"]*"[^>]*>\s*([A-Za-z]+)?\s*([0-9]{1,4}(?:-[0-9]{1,2}|\/[0-9]{1,2})?)\s*<span>\s*\(([0-9\.]+)\)\s*<\/span>/i;
      const hMatch = htmlText.match(headerRegex);
      if (hMatch) {
        const runsPart = hMatch[2].replace('-', '/');
        const ovPart = hMatch[3];
        const isAllOutWkts = (isInningsBreak && !runsPart.includes('/')) ? '/10' : '';
        directHeaderScore = `${runsPart}${isAllOutWkts} (${ovPart} ov)`;
      }

      // 2. సాధారణ Cricbuzz స్కోర్ స్ట్రింగ్: ఉదా. NZ 185 (40.2)
      if (!directHeaderScore) {
        const altMatch = htmlText.match(/(?:NZ|New Zealand|IND|India)\s+([0-9]{1,4}(?:-[0-9]{1,2}|\/[0-9]{1,2})?)\s*\(([0-9\.]+)\)/i);
        if (altMatch) {
          const runsPart = altMatch[1].replace('-', '/');
          const ovPart = altMatch[2];
          const isAllOutWkts = (isInningsBreak && !runsPart.includes('/')) ? '/10' : '';
          directHeaderScore = `${runsPart}${isAllOutWkts} (${ovPart} ov)`;
        }
      }
    }

    // 3. MiniScore API లో ఉంటే అక్కడి నుండి తీసుకోవడం
    if (!directHeaderScore) {
      const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];
      if (inningsList.length > 0) {
        const sc = inningsList[0];
        const runs = sc.score ?? sc.runs ?? 0;
        let wkts = sc.wickets !== undefined ? `/${sc.wickets}` : (sc.isAllOut || isInningsBreak ? '/10' : '');
        let ov = sc.overs ?? sc.ovrs ?? "";
        let ovStr = ov ? ` (${ov} ov)` : '';
        directHeaderScore = `${runs}${wkts}${ovStr}`.trim();
      }
    }

    s1 = directHeaderScore;

    // టాస్ మరియు స్టేటస్
    let finalStatusNotice = "Innings Break";
    if (!isInningsBreak) {
      let tossStatus = "";
      if (mHeader.tossResults?.tossWinnerName) {
        tossStatus = `${mHeader.tossResults.tossWinnerName} opt to ${mHeader.tossResults.decision?.toLowerCase() || 'bowl'}`;
      } else {
        const tossMatch = htmlText.match(/(?:India|New Zealand|IND|NZ)\s+opt to (?:bowl|bat)/i);
        if (tossMatch) tossStatus = tossMatch[0];
      }
      finalStatusNotice = tossStatus || "India opt to bowl";
    }

    // రెండవ ఇన్నింగ్స్ మొదలయ్యే వరకు Team 2 స్కోరును ఖాళీగా ఉంచడం
    s2 = "";

    const matchStartTimeIso = parseToIsoDate(rawStart);
    const calculatedFinishedIso = calculateSeriesSmartTime(rawStart, detectedSeries, false);

    return res.json({
      success: true,
      source: "cricbuzz",
      matchId: cbMatchId,
      series: detectedSeries || mHeader.seriesName || "India Tour of New Zealand 2026",
      t1: outT1,
      t2: outT2,
      t1_img: getTeamFlagUrl(outT1),
      t2_img: getTeamFlagUrl(outT2),
      t1_score: s1,
      t2_score: s2,
      statusNotice: finalStatusNotice,
      dynamicBadge: isInningsBreak ? "INNINGS BREAK" : "1ST INNINGS",
      targetEquation: finalStatusNotice,
      isLive: true,
      isFinished: false,
      startTimeGMT: matchStartTimeIso,
      dateTimeGMT: matchStartTimeIso,
      startDate: matchStartTimeIso,
      calculatedFinishedDate: calculatedFinishedIso
    });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
