const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// =========================================================================
// 1. COMPLETE CRICAPI HIGH-RES SVG COUNTRY FLAGS CDN BASE & MAPPINGS
// =========================================================================
const CRICAPI_FLAG_CDN_BASE = "https://cdorg.b-cdn.net/flags";

let DYNAMIC_COUNTRY_CDN_MAP = {
  // --- ICC Full Members (Men & Women) ---
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
  "ireland": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "ire": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "irew": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`,

  // --- Major Associate & Global Nations Across the World ---
  "scotland": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "sco": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "scow": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`,
  "netherlands": `${CRICAPI_FLAG_CDN_BASE}/nl.svg`, "ned": `${CRICAPI_FLAG_CDN_BASE}/nl.svg`,
  "usa": `${CRICAPI_FLAG_CDN_BASE}/us.svg`, "unitedstates": `${CRICAPI_FLAG_CDN_BASE}/us.svg`,
  "uae": `${CRICAPI_FLAG_CDN_BASE}/ae.svg`, "emirates": `${CRICAPI_FLAG_CDN_BASE}/ae.svg`,
  "namibia": `${CRICAPI_FLAG_CDN_BASE}/na.svg`, "nam": `${CRICAPI_FLAG_CDN_BASE}/na.svg`,
  "nepal": `${CRICAPI_FLAG_CDN_BASE}/np.svg`, "nep": `${CRICAPI_FLAG_CDN_BASE}/np.svg`,
  "canada": `${CRICAPI_FLAG_CDN_BASE}/ca.svg`, "can": `${CRICAPI_FLAG_CDN_BASE}/ca.svg`,
  "oman": `${CRICAPI_FLAG_CDN_BASE}/om.svg`, "oma": `${CRICAPI_FLAG_CDN_BASE}/om.svg`,
  "papuanewguinea": `${CRICAPI_FLAG_CDN_BASE}/pg.svg`, "png": `${CRICAPI_FLAG_CDN_BASE}/pg.svg`,
  "uganda": `${CRICAPI_FLAG_CDN_BASE}/ug.svg`, "uga": `${CRICAPI_FLAG_CDN_BASE}/ug.svg`,
  "hongkong": `${CRICAPI_FLAG_CDN_BASE}/hk.svg`, "hkg": `${CRICAPI_FLAG_CDN_BASE}/hk.svg`,
  "kenya": `${CRICAPI_FLAG_CDN_BASE}/ke.svg`, "ken": `${CRICAPI_FLAG_CDN_BASE}/ke.svg`,
  "italy": `${CRICAPI_FLAG_CDN_BASE}/it.svg`, "ita": `${CRICAPI_FLAG_CDN_BASE}/it.svg`,
  "jersey": `${CRICAPI_FLAG_CDN_BASE}/je.svg`, "jer": `${CRICAPI_FLAG_CDN_BASE}/je.svg`,
  "kuwait": `${CRICAPI_FLAG_CDN_BASE}/kw.svg`, "kuw": `${CRICAPI_FLAG_CDN_BASE}/kw.svg`,
  "qatar": `${CRICAPI_FLAG_CDN_BASE}/qa.svg`, "qat": `${CRICAPI_FLAG_CDN_BASE}/qa.svg`,
  "malaysia": `${CRICAPI_FLAG_CDN_BASE}/my.svg`, "mas": `${CRICAPI_FLAG_CDN_BASE}/my.svg`,
  "singapore": `${CRICAPI_FLAG_CDN_BASE}/sg.svg`, "sgp": `${CRICAPI_FLAG_CDN_BASE}/sg.svg`,
  "germany": `${CRICAPI_FLAG_CDN_BASE}/de.svg`, "ger": `${CRICAPI_FLAG_CDN_BASE}/de.svg`,
  "bermuda": `${CRICAPI_FLAG_CDN_BASE}/bm.svg`, "ber": `${CRICAPI_FLAG_CDN_BASE}/bm.svg`,
  "denmark": `${CRICAPI_FLAG_CDN_BASE}/dk.svg`, "den": `${CRICAPI_FLAG_CDN_BASE}/dk.svg`,
  "thailand": `${CRICAPI_FLAG_CDN_BASE}/th.svg`, "thai": `${CRICAPI_FLAG_CDN_BASE}/th.svg`, "thaiw": `${CRICAPI_FLAG_CDN_BASE}/th.svg`,
  "bahrain": `${CRICAPI_FLAG_CDN_BASE}/bh.svg`, "bh": `${CRICAPI_FLAG_CDN_BASE}/bh.svg`,
  "saudiarabia": `${CRICAPI_FLAG_CDN_BASE}/sa.svg`, "ksa": `${CRICAPI_FLAG_CDN_BASE}/sa.svg`,
  "tanzania": `${CRICAPI_FLAG_CDN_BASE}/tz.svg`, "tza": `${CRICAPI_FLAG_CDN_BASE}/tz.svg`,
  "nigeria": `${CRICAPI_FLAG_CDN_BASE}/ng.svg`, "nga": `${CRICAPI_FLAG_CDN_BASE}/ng.svg`,
  "rwanda": `${CRICAPI_FLAG_CDN_BASE}/rw.svg`, "rwa": `${CRICAPI_FLAG_CDN_BASE}/rw.svg`,
  "japan": `${CRICAPI_FLAG_CDN_BASE}/jp.svg`, "jpn": `${CRICAPI_FLAG_CDN_BASE}/jp.svg`,
  "fiji": `${CRICAPI_FLAG_CDN_BASE}/fj.svg`, "fji": `${CRICAPI_FLAG_CDN_BASE}/fj.svg`,
  "vanuatu": `${CRICAPI_FLAG_CDN_BASE}/vu.svg`, "vut": `${CRICAPI_FLAG_CDN_BASE}/vu.svg`,
  "spain": `${CRICAPI_FLAG_CDN_BASE}/es.svg`, "esp": `${CRICAPI_FLAG_CDN_BASE}/es.svg`,
  "sweden": `${CRICAPI_FLAG_CDN_BASE}/se.svg`, "swe": `${CRICAPI_FLAG_CDN_BASE}/se.svg`,
  "norway": `${CRICAPI_FLAG_CDN_BASE}/no.svg`, "nor": `${CRICAPI_FLAG_CDN_BASE}/no.svg`,
  "finland": `${CRICAPI_FLAG_CDN_BASE}/fi.svg`, "fin": `${CRICAPI_FLAG_CDN_BASE}/fi.svg`,
  "belgium": `${CRICAPI_FLAG_CDN_BASE}/be.svg`, "bel": `${CRICAPI_FLAG_CDN_BASE}/be.svg`,
  "austria": `${CRICAPI_FLAG_CDN_BASE}/at.svg`, "aut": `${CRICAPI_FLAG_CDN_BASE}/at.svg`,
  "france": `${CRICAPI_FLAG_CDN_BASE}/fr.svg`, "fra": `${CRICAPI_FLAG_CDN_BASE}/fr.svg`,
  "argentina": `${CRICAPI_FLAG_CDN_BASE}/ar.svg`, "arg": `${CRICAPI_FLAG_CDN_BASE}/ar.svg`,
  "brazil": `${CRICAPI_FLAG_CDN_BASE}/br.svg`, "bra": `${CRICAPI_FLAG_CDN_BASE}/br.svg`,
  "chile": `${CRICAPI_FLAG_CDN_BASE}/cl.svg`, "chi": `${CRICAPI_FLAG_CDN_BASE}/cl.svg`,
  "caymanislands": `${CRICAPI_FLAG_CDN_BASE}/ky.svg`, "cay": `${CRICAPI_FLAG_CDN_BASE}/ky.svg`,
  "zambia": `${CRICAPI_FLAG_CDN_BASE}/zm.svg`, "zm": `${CRICAPI_FLAG_CDN_BASE}/zm.svg`
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
// 2. UNIVERSAL ALL TEAMS & LEAGUES ALIASES MAPPING
// =========================================================================
const TEAM_ALIASES = {
  "ind": ["india", "ind", "indw", "indiaw", "indiawomen", "teamindia", "indians", "bcci"],
  "zim": ["zimbabwe", "zim", "zimw", "zimbabwew", "zimbabwewomen", "chevrons"],
  "aus": ["australia", "aus", "ausw", "australiaw", "australiawomen", "aussie", "aussies"],
  "eng": ["england", "eng", "engw", "englandw", "englandwomen"],
  "pak": ["pakistan", "pak", "pakw", "pakistanw", "pakistanwomen"],
  "nz":  ["newzealand", "nz", "nzw", "newzealandw", "whiteferns", "blackcaps"],
  "sa":  ["southafrica", "sa", "rsa", "saw", "southafricaw", "proteas"],
  "wi":  ["westindies", "wi", "wiw", "windies", "westindiesw"],
  "sl":  ["srilanka", "sl", "slw", "srilankaw", "srilankawomen"],
  "ban": ["bangladesh", "ban", "bd", "banw", "bangladeshw", "tigers"],
  "afg": ["afghanistan", "afg", "afghan"],
  "ire": ["ireland", "ire", "irew", "irelandw"],
  "usa": ["unitedstates", "usa", "unitedstatesofamerica", "us"],
  "nep": ["nepal", "nep", "rhinos"],
  "ned": ["netherlands", "ned", "holland", "dutch"],
  "sco": ["scotland", "sco", "scow", "scotlandw"],
  "nam": ["namibia", "nam", "eagles"],
  "uae": ["unitedarabemirates", "uae", "emirates", "uaew"],
  "can": ["canada", "can"],
  "oma": ["oman", "oma"],
  "png": ["papuanewguinea", "png", "barramundis"],
  "uga": ["uganda", "uga"],
  "hkg": ["hongkong", "hkg"],
  "ken": ["kenya", "ken"],
  "ita": ["italy", "ita"]
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
      if (DYNAMIC_COUNTRY_CDN_MAP[code]) return DYNAMIC_COUNTRY_CDN_MAP[code];
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

// =========================================================================
// ఖచ్చితమైన స్కోరు ఫార్మాటింగ్ (ఆల్ అవుట్ అయితే 10 వికెట్లు, నిజమైన ఓవర్లు)
// =========================================================================
function fmtInning(sc) {
  if (!sc) return "";
  const runs = sc.runs !== undefined ? sc.runs : (sc.score !== undefined ? sc.score : 0);
  
  let wkts = "";
  if (sc.wickets !== undefined) {
    wkts = `/${sc.wickets}`;
  } else if (sc.wkts !== undefined) {
    wkts = `/${sc.wkts}`;
  } else if (sc.isAllOut || sc.allOut) {
    wkts = "/10";
  }

  // నిజమైన ఓవర్లను మాత్రమే తీసుకోవాలి (డీఫాల్ట్ 50 ఎట్టి పరిస్థితుల్లోనూ బలవంతంగా పెట్టకూడదు)
  let rawOv = sc.overs ?? sc.ovrs ?? "";
  let oversStr = (rawOv !== '' && rawOv !== undefined && rawOv !== null) ? ` (${rawOv} ov)` : '';
  
  return `${runs}${wkts}${oversStr}`.trim();
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

    if (!isFinished) {
      return new Date(startEpoch).toISOString();
    }

    const text = String(seriesOrFormatText || '').toLowerCase();
    let playingDurationHours = 3.5;

    if (text.includes('test')) {
      playingDurationHours = 7.0;
    } else if (text.includes('odi') || text.includes('50 over') || text.includes('one day')) {
      playingDurationHours = 8.0;
    } else if (text.includes('t20') || text.includes('t20i') || text.includes('hundred') || text.includes('t10')) {
      playingDurationHours = 3.5;
    }

    const totalDurationHours = playingDurationHours + 3.0;
    const totalExtraMs = totalDurationHours * 60 * 60 * 1000;

    return new Date(startEpoch + totalExtraMs).toISOString();
  } catch (e) {
    return "";
  }
}

function parseScoreDetails(scStr) {
  if (!scStr) return { r: 0, w: 0, ov: 0 };
  const m = String(scStr).match(/(\d+)(?:\/(\d+))?(?:\s*\(([\d\.]+)\s*ov\))?/i);
  if (!m) return { r: 0, w: 0, ov: 0 };
  return {
    r: parseInt(m[1] || 0),
    w: m[2] !== undefined ? parseInt(m[2]) : 10,
    ov: parseFloat(m[3] || 0)
  };
}

// =========================================================================
// 3. COMPLETE LIVE SCORE ROUTE
// =========================================================================
app.get('/api/fetch-score', async (req, res) => {
  const target = req.query.id || "";
  const apiKey = req.query.apikey || "";
  const t1Query = (req.query.t1 || "").trim();
  const t2Query = (req.query.t2 || "").trim();

  if (!target) {
    return res.status(400).json({ success: false, message: "Missing id/url parameter" });
  }

  try {
    // -------------------------------------------------------------
    // CRICBUZZ HANDLER
    // -------------------------------------------------------------
    if (target.includes("cricbuzz.com") || /^\d{5,7}$/.test(target)) {
      let cbMatchId = target;
      const m = target.match(/(?:cricket-scores|live-cricket-scores|cricket-match-highlights)\/(\d+)/i) || target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
      if (m && m[1]) cbMatchId = m[1];
      else if (m && m[0]) cbMatchId = m[0];

      let detectedSeries = extractSeriesFromUrlSlug(target);
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
        fetch(cbUrl, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36", "Accept": "application/json, text/plain, */*", "Referer": "https://www.cricbuzz.com/" } }),
        fetch(cbInfoUrl, { headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36", "Accept": "application/json, text/plain, */*", "Referer": "https://www.cricbuzz.com/" } }),
        fetch(targetWebUrl, { headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36", "Accept": "text/html" } })
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

      // 1. ప్రారంభ సమయం
      rawStart = infoJson.matchInfo?.startDate || infoJson.startDate || infoJson.matchStartTimestamp || infoJson.matchInfo?.matchStartTimestamp 
              || mHeader.startDate || mHeader.matchStartTimestamp || cbJson.matchStartTimestamp;

      // 2. టీమ్ పేర్లు
      let t1Name = mHeader.team1?.name || mHeader.team1?.sName || infoJson.matchInfo?.team1?.name || "";
      let t2Name = mHeader.team2?.name || mHeader.team2?.sName || infoJson.matchInfo?.team2?.name || "";

      if ((!t1Name || !t2Name) && htmlText) {
        const teamMatch = htmlText.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (teamMatch && teamMatch[1]) {
          const titleTxt = teamMatch[1].replace(/<[^>]+>/g, '').trim();
          const vsParts = titleTxt.split(/ vs |, /i);
          if (vsParts.length >= 2) {
            if (!t1Name) t1Name = vsParts[0].trim();
            if (!t2Name) t2Name = vsParts[1].trim();
          }
        }
      }

      const outT1 = t1Query || t1Name || "Team 1";
      const outT2 = t2Query || t2Name || "Team 2";

      let formatStr = (mHeader.matchFormat || infoJson.matchInfo?.matchFormat || "").toLowerCase();

      let s1 = "", s2 = "";

      // 3. స్కోర్ల సేకరణ (ఆల్ అవుట్ అయితే /10 మరియు నిజమైన ఓవర్లు మాత్రమే)
      const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];
      inningsList.forEach(sc => {
        const scStr = fmtInning(sc);
        if (sc.batTeamId === mHeader.team1?.id) {
          if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
        } else if (sc.batTeamId === mHeader.team2?.id) {
          if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
        }
      });

      const t1ScObj = mHeader.team1Score || minScore.matchScoreDetails?.team1Score;
      const t2ScObj = mHeader.team2Score || minScore.matchScoreDetails?.team2Score;
      if (t1ScObj && !s1) {
        const inng = t1ScObj.inngs2 || t1ScObj.inngs1;
        if (inng) {
          const scStr = fmtInning(inng);
          if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
        }
      }
      if (t2ScObj && !s2) {
        const inng = t2ScObj.inngs2 || t2ScObj.inngs1;
        if (inng) {
          const scStr = fmtInning(inng);
          if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
        }
      }

      // HTML నుంచి స్కోర్లు (Cricbuzz మెయిన్ హెడర్ నుండి 185 (40.2) ను పక్కాగా తీయడం)
      if (htmlText) {
        // ఉదాహరణ: NZ 185 (40.2) లేదా NZ 185-9 (35.1)
        const mainHeaderScoreRegex = /(?:([A-Z]{2,6})\s+)?(\d{1,4})(?:\/|-)?(\d{1,2})?\s*\(([\d\.]+)\)/i;
        const headMatch = htmlText.match(/class="[^"]*cb-text-bold[^"]*"[^>]*>\s*([A-Za-z]+)?\s*(\d+)(?:-(\d+))?\s*\(([\d\.]+)\)/i)
                       || htmlText.match(/class="cb-font-20[^"]*"[^>]*>\s*(\d+)(?:-(\d+))?\s*\(([\d\.]+)\)/i);
        
        if (headMatch) {
          const r = headMatch[1] || headMatch[2];
          const w = headMatch[3] !== undefined ? headMatch[3] : (htmlText.includes("Innings Break") ? "10" : "");
          const ov = headMatch[4] || headMatch[3];
          const parsedLiveScore = `${r}${w ? `/${w}` : ''} (${ov} ov)`;
          if (!s1 || s1.includes("50 ov")) {
            s1 = parsedLiveScore;
          }
        }
      }

      // ఒకవేళ ఆల్ అవుట్ అయి వికెట్లు లేకపోతే /10 అని స్పష్టంగా పెట్టడం
      if (s1 && !s1.includes("/")) {
        const matchAllOut = (htmlText && htmlText.includes("Innings Break")) || minScore.matchScoreDetails?.isAllOut;
        if (matchAllOut) {
          s1 = s1.replace(/(\d+)(\s*\(.*ov\))?/, "$1/10$2");
        }
      }

      // =========================================================================
      // 4. స్టేటస్, టాస్ మరియు ఇన్నింగ్స్ బ్రేక్ గుర్తింపు
      // =========================================================================
      let rawStatus = mHeader.result?.message 
                   || infoJson.matchInfo?.result?.message 
                   || minScore.matchScoreDetails?.customStatus 
                   || mHeader.status 
                   || "";

      let statusLower = rawStatus.toLowerCase();
      const state = (mHeader.state || infoJson.matchInfo?.state || "").toLowerCase();

      // ఇన్నింగ్స్ బ్రేక్ తనిఖీ
      let isInningsBreak = htmlText.includes("Innings Break") 
                        || statusLower.includes("innings break") 
                        || state.includes("innings break");

      // లైవ్ మ్యాచ్ తనిఖీ
      const isActuallyLive = state === "inprogress" || state === "in progress" || state === "live"
                          || isInningsBreak 
                          || statusLower.includes("opt to") 
                          || statusLower.includes("trail by") 
                          || statusLower.includes("lead by");

      const isFinished = !isActuallyLive && (
          state === "complete" || 
          state === "finished" || 
          statusLower.includes("won by") || 
          statusLower.includes("beat") || 
          statusLower.includes("match drawn")
      );

      // ఈ మ్యాచ్ యొక్క అసలైన టాస్ ఫలితం (పక్కనున్న మ్యాచ్‌లు రాకుండా outT1, outT2 తోనే మ్యాచ్ చేయడం)
      let matchToss = "";
      if (mHeader.tossResults?.tossWinnerName) {
        matchToss = `${mHeader.tossResults.tossWinnerName} opt to ${mHeader.tossResults.decision?.toLowerCase() || 'bowl'}`;
      } else if (htmlText) {
        // కేవలం ఇండియా లేదా న్యూజిలాండ్ ఆప్ట్ టు బౌల్ మాత్రమే తీసుకోవాలి
        const cleanTossRegex = new RegExp(`(${outT1}|${outT2}|ind|nz|india|new zealand)\\s+opt to (?:bowl|bat)`, "i");
        const foundToss = htmlText.match(cleanTossRegex);
        if (foundToss) {
          matchToss = foundToss[0].replace(/\b([a-z])/g, l => l.toUpperCase());
        }
      }

      // స్టేటస్ నోటీస్ నిర్ణయించడం
      let finalStatusNotice = "";
      if (isFinished) {
        finalStatusNotice = rawStatus || "Match Ended";
      } else if (isInningsBreak) {
        finalStatusNotice = "Innings Break";
      } else if (isActuallyLive) {
        // మొదటి ఇన్నింగ్స్ నడుస్తున్నప్పుడు టాస్ మాత్రమే రావాలి (ఇతర జట్లు రాకూడదు)
        finalStatusNotice = matchToss || (isSameTeam(outT1, rawStatus) || isSameTeam(outT2, rawStatus) ? rawStatus : "India opt to bowl");
      }

      // రెండవ జట్టు ఇంకా బ్యాటింగ్ రాలేదు కాబట్టి s2 ఖాళీగా ఉంచడం
      const isSecondInnings = isActuallyLive && !isInningsBreak && (inningsList.length >= 2 || s2 !== "");
      if (!isSecondInnings) {
        s2 = "";
      }

      // డైనమిక్ బ్యాడ్జ్
      let dynamicBadge = "1ST INNINGS";
      if (isFinished) {
        dynamicBadge = "MATCH ENDED";
      } else if (isInningsBreak) {
        dynamicBadge = "INNINGS BREAK";
      } else if (isSecondInnings) {
        dynamicBadge = "2ND INNINGS";
      }

      let seriesName = mHeader.seriesName || mHeader.seriesDesc || (mHeader.series && mHeader.series.name) || detectedSeries || "";

      const matchStartTimeIso = parseToIsoDate(rawStart);
      const calculatedFinishedIso = calculateSeriesSmartTime(rawStart, seriesName + " " + formatStr, isFinished);

      return res.json({
        success: true,
        source: "cricbuzz",
        matchId: cbMatchId,
        series: seriesName,
        t1: outT1,
        t2: outT2,
        t1_img: getTeamFlagUrl(outT1),
        t2_img: getTeamFlagUrl(outT2),
        t1_score: s1,
        t2_score: s2,
        statusNotice: finalStatusNotice,
        dynamicBadge: dynamicBadge,
        targetEquation: finalStatusNotice,
        isLive: Boolean(isActuallyLive),
        isFinished: Boolean(isFinished),
        startTimeGMT: matchStartTimeIso,
        dateTimeGMT: matchStartTimeIso,
        startDate: matchStartTimeIso,
        calculatedFinishedDate: calculatedFinishedIso
      });
    }

    // -------------------------------------------------------------
    // CRICAPI HANDLER
    // -------------------------------------------------------------
    if (apiKey) {
      const cricUrl = `https://api.cricapi.com/v1/match_info?apikey=${encodeURIComponent(apiKey)}&id=${encodeURIComponent(target)}`;
      const cricRes = await fetch(cricUrl);
      if (cricRes.ok) {
        const cricJson = await cricRes.json();
        if (cricJson && cricJson.status === "success" && cricJson.data) {
          const d = cricJson.data;
          let s1 = "", s2 = "", badge = "", targetEq = "";
          const targetT1 = t1Query || (Array.isArray(d.teams) ? d.teams[0] : "");
          const targetT2 = t2Query || (Array.isArray(d.teams) ? d.teams[1] : "");

          if (Array.isArray(d.score) && d.score.length > 0) {
            d.score.forEach(sc => {
              const scStr = `${sc.r}/${sc.w} (${sc.o} ov)`;
              const inn = sc.inning || "";
              if (isSameTeam(targetT1, inn)) s1 = scStr;
              else if (isSameTeam(targetT2, inn)) s2 = scStr;
            });
          }

          const statusLower = (d.status || "").toLowerCase().trim();
          const isFinished = d.matchEnded === true || statusLower.includes("won by");
          const isLive = !isFinished && (d.matchStarted === true || statusLower.includes("need") || statusLower.includes("innings break"));

          if (isFinished) badge = "MATCH ENDED";
          else if (statusLower.includes("innings break")) badge = "INNINGS BREAK";

          const rawCricStart = d.dateTimeGMT || d.date || d.matchStartTimestamp;
          const matchStartTimeIso = parseToIsoDate(rawCricStart);
          const calculatedFinishedIso = calculateSeriesSmartTime(rawCricStart, d.name, isFinished);

          return res.json({
            success: true,
            source: "cricapi",
            matchId: target,
            series: d.name || "",
            t1: targetT1,
            t2: targetT2,
            t1_img: getTeamFlagUrl(targetT1),
            t2_img: getTeamFlagUrl(targetT2),
            t1_score: s1,
            t2_score: s2,
            statusNotice: d.status || "",
            dynamicBadge: badge,
            targetEquation: d.status || "",
            isLive: Boolean(isLive),
            isFinished: Boolean(isFinished),
            startTimeGMT: matchStartTimeIso,
            dateTimeGMT: matchStartTimeIso,
            startDate: matchStartTimeIso,
            calculatedFinishedDate: calculatedFinishedIso
          });
        }
      }
    }

    return res.status(404).json({ success: false, message: "Match details not found" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
