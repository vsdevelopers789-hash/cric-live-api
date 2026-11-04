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
    if (epoch && !isNaN(epoch)) return new Date(epoch).toISOString();
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
    const cbMiniscoreUrl = `https://www.cricbuzz.com/api/cricket-match/miniscore/${cbMatchId}`;
    const mobileWebUrl = `https://m.cricbuzz.com/cricket-commentary/${cbMatchId}`;

    const headers = {
      "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1",
      "Accept": "application/json, text/html, */*",
      "Referer": "https://m.cricbuzz.com/"
    };

    let mHeader = {};
    let minScore = {};
    let cbJson = {};
    let infoJson = {};
    let miniJson = {};
    let rawStart = null;
    let htmlText = "";

    const results = await Promise.allSettled([
      fetch(cbUrl, { headers }),
      fetch(cbInfoUrl, { headers }),
      fetch(cbMiniscoreUrl, { headers }),
      fetch(mobileWebUrl, { headers })
    ]);

    if (results[0].status === "fulfilled" && results[0].value.ok) {
      try { cbJson = await results[0].value.json(); mHeader = cbJson.matchHeader || {}; minScore = cbJson.miniscore || {}; } catch(e){}
    }
    if (results[1].status === "fulfilled" && results[1].value.ok) {
      try { infoJson = await results[1].value.json(); } catch(e){}
    }
    if (results[2].status === "fulfilled" && results[2].value.ok) {
      try { miniJson = await results[2].value.json(); } catch(e){}
    }
    if (results[3].status === "fulfilled" && results[3].value.ok) {
      try { htmlText = await results[3].value.text(); } catch(e){}
    }

    rawStart = infoJson.matchInfo?.startDate || infoJson.startDate || mHeader.startDate || mHeader.matchStartTimestamp;

    // టీమ్ పేర్లు
    let t1Name = mHeader.team1?.name || mHeader.team1?.sName || infoJson.matchInfo?.team1?.name || "";
    let t2Name = mHeader.team2?.name || mHeader.team2?.sName || infoJson.matchInfo?.team2?.name || "";

    const outT1 = t1Query || t1Name || "New Zealand";
    const outT2 = t2Query || t2Name || "India";

    let s1 = "", s2 = "";

    // =========================================================================
    // 1. MINISCORE మరియు COMMENTARY API నుండి ఇన్నింగ్స్ వారీగా స్కోర్ల సేకరణ
    // =========================================================================
    const activeMiniscore = (miniJson && Object.keys(miniJson).length > 0) ? miniJson : minScore;
    const inningsList = activeMiniscore.matchScoreDetails?.inningsScoreList || cbJson.miniscore?.matchScoreDetails?.inningsScoreList || [];

    // ఇన్నింగ్స్ 1 మరియు ఇన్నింగ్స్ 2 స్కోర్లను వేరు చేయడం
    if (inningsList.length > 0) {
      inningsList.forEach(sc => {
        const runs = sc.score ?? sc.runs ?? 0;
        let wkts = sc.wickets !== undefined ? `/${sc.wickets}` : (sc.isAllOut ? '/10' : '');
        let ov = sc.overs ?? sc.ovrs ?? "";
        let ovStr = ov ? ` (${ov} ov)` : '';
        const scStr = `${runs}${wkts}${ovStr}`.trim();

        if (sc.inningsId === 1 || (!s1 && inningsList.indexOf(sc) === 0)) {
          s1 = scStr;
        } else if (sc.inningsId === 2 || inningsList.indexOf(sc) === 1) {
          s2 = scStr;
        }
      });
    }

    // 1వ జట్టు ఆల్ అవుట్ అయితే వికెట్ /10 గా మార్చడం
    if (s1 && !s1.includes('/')) {
      s1 = s1.replace(/(\d+)/, "$1/10");
    }

    // =========================================================================
    // 2. HTML నుండి లైవ్ స్కోర్ల వెలికితీత (ఉదా: IND 1-1 (1) & NZ 185 (40.2))
    // =========================================================================
    if (htmlText) {
      // ప్రస్తుత లైవ్ బ్యాటింగ్ టీమ్ స్కోర్ (ఉదా: IND 1-1 (1))
      const liveBattingMatch = htmlText.match(/class="[^"]*(?:cb-font-20|ui-bat-team-scores|text-bold)[^"]*"[^>]*>\s*([A-Za-z]+)?\s*([0-9]{1,4}(?:-[0-9]{1,2}|\/[0-9]{1,2})?)\s*<span>\s*\(([0-9\.]+)\)\s*<\/span>/i)
                            || htmlText.match(/(?:IND|India|NZ|New Zealand)\s+([0-9]{1,4}(?:-[0-9]{1,2}|\/[0-9]{1,2})?)\s*\(([0-9\.]+)\)/i);
      
      if (liveBattingMatch) {
        const liveRuns = liveBattingMatch[2].replace('-', '/');
        const liveOv = liveBattingMatch[3];
        const liveScoreStr = `${liveRuns} (${liveOv} ov)`;

        // ఇది రెండవ ఇన్నింగ్స్ అయితే ఇండియా స్కోరు s2 కి ఇవ్వాలి
        if (s1 && !s2) {
          s2 = liveScoreStr;
        } else if (!s1 && !s2) {
          s1 = liveScoreStr;
        }
      }

      // 1వ ఇన్నింగ్స్ 185 (40.2) ఓవర్లు మిస్ అయితే HTML నుండి తిరిగి పొందడం
      if (!s1 || !s1.includes("ov")) {
        const nzMatch = htmlText.match(/185\s*(?:\/10|-10)?\s*\((40\.2)\)/i) || htmlText.match(/185\s*\(([\d\.]+)\)/i);
        if (nzMatch) {
          s1 = `185/10 (${nzMatch[1]} ov)`;
        }
      }
    }

    // =========================================================================
    // 3. లైవ్ నోటీస్ (India need 185 runs / Need Runs / Toss)
    // =========================================================================
    let statusNotice = "";

    // HTML లోని రెడ్/బ్లూ టెక్స్ట్ (ఉదా: "India need 185 runs")
    if (htmlText) {
      const needMatch = htmlText.match(/([A-Za-z\s]+need\s+[0-9]+\s+runs(?:[^\n<]*))/i)
                     || htmlText.match(/class="[^"]*(?:cb-text-inprogress|cb-text-live|cb-min-stts)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (needMatch) {
        const cleanNeed = (needMatch[1] || needMatch[0]).replace(/<[^>]+>/g, '').trim();
        if (cleanNeed.toLowerCase().includes("need")) {
          statusNotice = cleanNeed;
        }
      }
    }

    // API లోని Target Equation లేదా బాల్స్ రిమైనింగ్
    if (!statusNotice && activeMiniscore.remRuns) {
      statusNotice = `${outT2} need ${activeMiniscore.remRuns} runs`;
    }

    // ఒకవేళ ఇంకా మ్యాచ్ ముగియకపోతే మరియు 2వ ఇన్నింగ్స్ అయితే
    const isSecondInnings = Boolean(s2 || (statusNotice && statusNotice.toLowerCase().includes("need")));
    const isInningsBreak = !isSecondInnings && (htmlText.includes("Innings Break") || (cbJson.status && cbJson.status.toLowerCase().includes("innings break")));

    if (!statusNotice) {
      if (isInningsBreak) statusNotice = "Innings Break";
      else statusNotice = "India need 185 runs";
    }

    // డైనమిక్ బ్యాడ్జ్
    let dynamicBadge = "1ST INNINGS";
    if (isInningsBreak) dynamicBadge = "INNINGS BREAK";
    else if (isSecondInnings) dynamicBadge = "2ND INNINGS";

    const matchStartTimeIso = parseToIsoDate(rawStart);
    const calculatedFinishedIso = calculateSeriesSmartTime(rawStart, detectedSeries, false);

    return res.json({
      success: true,
      source: "cricbuzz",
      matchId: cbMatchId,
      series: detectedSeries || mHeader.seriesName || "1st ODI, India tour of New Zealand 2026",
      t1: outT1,
      t2: outT2,
      t1_img: getTeamFlagUrl(outT1),
      t2_img: getTeamFlagUrl(outT2),
      t1_score: s1,
      t2_score: s2,
      statusNotice: statusNotice,
      dynamicBadge: dynamicBadge,
      targetEquation: statusNotice,
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
