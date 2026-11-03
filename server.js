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

  // --- Associate & Global Members ---
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
  "thailand": `${CRICAPI_FLAG_CDN_BASE}/th.svg`, "thai": `${CRICAPI_FLAG_CDN_BASE}/th.svg`, "thaiw": `${CRICAPI_FLAG_CDN_BASE}/th.svg`
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
// 2. TEAM ALIASES & PARSERS
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

function fmtInning(sc, defaultMaxOvers) {
  if (!sc) return "";
  const runs = sc.runs !== undefined ? sc.runs : (sc.score !== undefined ? sc.score : 0);
  let wkts = sc.wickets !== undefined ? `/${sc.wickets}` : (sc.wkts !== undefined ? `/${sc.wkts}` : (sc.isAllOut ? '/10' : ''));
  let rawOv = sc.overs ?? sc.ovrs ?? sc.totalOvers ?? sc.maxOvers ?? '';
  if (!rawOv && defaultMaxOvers) rawOv = defaultMaxOvers;
  let oversStr = (rawOv !== '' && rawOv !== undefined) ? ` (${rawOv} ov)` : '';
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

// ప్లేయింగ్ సమయం + అదనంగా 3 గంటలు
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

// =========================================================================
// 3. COMPLETE LIVE SCORE ROUTE (START TIME + END TIME + WON BY / NEED)
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

      // 1. ఖచ్చితమైన ప్రారంభ సమయం (Start Time) ని గుర్తించడం
      rawStart = infoJson.matchInfo?.startDate || infoJson.startDate || infoJson.matchStartTimestamp || infoJson.matchInfo?.matchStartTimestamp 
              || mHeader.startDate || mHeader.matchStartTimestamp || cbJson.matchStartTimestamp;

      if (!rawStart && htmlText) {
        // A. JSON-LD లో startDate
        const ldMatch = htmlText.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (ldMatch && ldMatch[1]) {
          try {
            const parsedLd = JSON.parse(ldMatch[1]);
            if (parsedLd.startDate) rawStart = parsedLd.startDate;
          } catch(e) {}
        }
        // B. HTML లోని timestamp
        if (!rawStart) {
          const tsMatch = htmlText.match(/(?:data-start-time|matchStartTimestamp)="(\d+)"/i) || htmlText.match(/"startDate":"([^"]+)"/i);
          if (tsMatch && tsMatch[1]) {
            rawStart = tsMatch[1].length === 10 ? parseInt(tsMatch[1]) * 1000 : (isNaN(tsMatch[1]) ? tsMatch[1] : parseInt(tsMatch[1]));
          }
        }
        // C. వెబ్ పేజీ టెక్స్ట్ సమయం (ఉదా: 12:30 PM ( November 1 ))
        if (!rawStart) {
          const txtDateMatch = htmlText.match(/(\d{1,2}:\d{2}\s*(?:AM|PM))\s*\(\s*([A-Za-z]+\s*\d{1,2})\s*\)/i);
          if (txtDateMatch) {
            const curYear = new Date().getFullYear();
            const rawParsed = new Date(`${txtDateMatch[2]} ${curYear} ${txtDateMatch[1]} +05:30`).getTime();
            if (!isNaN(rawParsed)) rawStart = rawParsed;
          }
        }
      }

      // టీమ్ పేర్లు
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

      const outT1 = t1Query || t1Name || "IND";
      const outT2 = t2Query || t2Name || "NZ";

      let formatStr = (mHeader.matchFormat || infoJson.matchInfo?.matchFormat || "").toLowerCase();
      if (!formatStr && htmlText) {
        if (/t20/i.test(htmlText.substring(0, 5000))) formatStr = "t20";
        else if (/odi/i.test(htmlText.substring(0, 5000))) formatStr = "odi";
      }
      const maxOversLimit = formatStr.includes("t20") ? 20 : (formatStr.includes("odi") ? 50 : 0);
      const defaultMaxOvers = maxOversLimit ? String(maxOversLimit) : "";

      let s1 = "", s2 = "";
      let secondInningsOvers = 0;

      // స్కోర్ల సేకరణ
      const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];
      inningsList.forEach((sc, idx) => {
        const scStr = fmtInning(sc, defaultMaxOvers);
        if (sc.batTeamId === mHeader.team1?.id) {
          if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
        } else if (sc.batTeamId === mHeader.team2?.id) {
          if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
        }
        if (idx === 1 || sc.inningsId === 2) {
          secondInningsOvers = parseFloat(sc.overs ?? sc.ovrs ?? 0);
        }
      });

      const t1ScObj = mHeader.team1Score || minScore.matchScoreDetails?.team1Score;
      const t2ScObj = mHeader.team2Score || minScore.matchScoreDetails?.team2Score;
      if (t1ScObj) {
        const inng = t1ScObj.inngs2 || t1ScObj.inngs1;
        if (inng) {
          const scStr = fmtInning(inng, defaultMaxOvers);
          if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
          if (t1ScObj.inngs2) secondInningsOvers = parseFloat(t1ScObj.inngs2.overs || 0);
        }
      }
      if (t2ScObj) {
        const inng = t2ScObj.inngs2 || t2ScObj.inngs1;
        if (inng) {
          const scStr = fmtInning(inng, defaultMaxOvers);
          if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
          if (t2ScObj.inngs2) secondInningsOvers = parseFloat(t2ScObj.inngs2.overs || 0);
        }
      }

      // HTML స్కోర్లు
      let extractedScores = [];
      if (htmlText) {
        const cleanScoreRegex = /([A-Z]{2,6}(?:-W)?)\s+([0-9]{1,4}(?:\/[0-9]{1,2})?)\s*(?:\(([\d\.]+(?:\s*(?:ov|ovs))?)\))?/gi;
        let mEntry;
        while ((mEntry = cleanScoreRegex.exec(htmlText.substring(0, 15000))) !== null) {
          const teamKey = mEntry[1].trim();
          const scoreVal = mEntry[2].trim().replace('-', '/');
          let rawOv = mEntry[3] ? mEntry[3].replace(/ovs?/i, '').trim() : '';
          const oversVal = rawOv ? ` (${rawOv} ov)` : (defaultMaxOvers ? ` (${defaultMaxOvers} ov)` : '');
          extractedScores.push({ name: teamKey, score: `${scoreVal}${oversVal}`.trim(), overs: parseFloat(rawOv || 0) });
        }
        if (!s1 || !s2) {
          extractedScores.forEach(item => {
            if (isSameTeam(outT1, item.name) && !s1) s1 = item.score;
            else if (isSameTeam(outT2, item.name) && !s2) s2 = item.score;
          });
          if (!s1 && extractedScores[0]) s1 = extractedScores[0].score;
          if (!s2 && extractedScores[1]) s2 = extractedScores[1].score;
        }
        if (!secondInningsOvers && extractedScores[1]) {
          secondInningsOvers = extractedScores[1].overs;
        }
      }

      // 2. ఖచ్చితమైన స్టేటస్ (Won by / Left balls / Need)
      let statusText = mHeader.result?.message 
                    || infoJson.matchInfo?.result?.message 
                    || infoJson.result?.message
                    || minScore.matchScoreDetails?.customStatus 
                    || mHeader.statusTitle 
                    || mHeader.status 
                    || cbJson.status 
                    || infoJson.status 
                    || infoJson.matchInfo?.status 
                    || "";

      if ((!statusText || statusText.toLowerCase() === "complete") && htmlText) {
        const statusRegexes = [
          /<div[^>]*class="[^"]*(?:cb-text-complete|cb-min-stts|cb-text-live|cb-text-inprogress)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
          /<div[^>]*class="[^"]*cb-col-100 cb-col cb-font-18 cb-text-bold[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
          /"status":"([^"]+)"/i
        ];
        for (const reg of statusRegexes) {
          const found = htmlText.match(reg);
          if (found && found[1]) {
            const clean = found[1].replace(/<[^>]+>/g, '').trim();
            if (clean.length > 3 && !clean.includes("{")) {
              statusText = clean;
              break;
            }
          }
        }
      }

      const statusLower = statusText.toLowerCase();
      const state = (mHeader.state || infoJson.matchInfo?.state || "").toLowerCase();
      const isFinished = state === "complete" || statusLower.includes("won by") || statusLower.includes("beat") || (Boolean(s1) && Boolean(s2) && (inningsList.length >= 2 || extractedScores.length >= 2));
      const isLive = !isFinished && (state === "inprogress" || state === "innings break" || statusLower.includes("need") || statusLower.includes("opt to"));

      // Left Balls / Need Equation లెక్కింపు
      let targetEq = statusText;
      if (isFinished) {
        let ballsLeft = minScore.ballsRemaining || minScore.remBalls;
        if (!ballsLeft && maxOversLimit && secondInningsOvers > 0 && statusLower.includes("wkts")) {
          const completedOvers = Math.floor(secondInningsOvers);
          const extraBalls = Math.round((secondInningsOvers - completedOvers) * 10);
          const ballsBowled = (completedOvers * 6) + extraBalls;
          const totalBallsInMatch = maxOversLimit * 6;
          if (totalBallsInMatch > ballsBowled) {
            ballsLeft = totalBallsInMatch - ballsBowled;
          }
        }
        if (ballsLeft && ballsLeft > 0 && !statusText.includes("balls remaining") && !statusText.includes("left")) {
          statusText = `${statusText} (with ${ballsLeft} balls remaining)`;
        }
        targetEq = statusText;
      } else if (minScore.remRuns !== undefined && minScore.remBalls !== undefined && minScore.remRuns !== null) {
        const chasingTeam = minScore.batTeam?.teamName || outT1;
        targetEq = `${chasingTeam} need ${minScore.remRuns} runs in ${minScore.remBalls} balls`;
        if (!statusText) statusText = targetEq;
      }

      let seriesName = mHeader.seriesName || mHeader.seriesDesc || (mHeader.series && mHeader.series.name) || detectedSeries || "";
      if (!seriesName && htmlText) {
        const navMatch = htmlText.match(/class="[^"]*cb-nav-hdr[^"]*"[^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i);
        if (navMatch && navMatch[1]) {
          const fullH1 = navMatch[1].replace(/<[^>]+>/g, '').trim();
          const h1Parts = fullH1.split(',');
          if (h1Parts.length > 1) seriesName = h1Parts[h1Parts.length - 1].trim();
        }
      }

      let dynamicBadge = isFinished ? "MATCH ENDED" : (statusLower.includes("innings break") ? "INNINGS BREAK" : (s1 && s2 ? "2ND INNINGS" : "1ST INNINGS"));

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
        statusNotice: statusText,
        dynamicBadge: dynamicBadge,
        targetEquation: targetEq || statusText,
        isLive: Boolean(isLive),
        isFinished: Boolean(isFinished),
        startTimeGMT: matchStartTimeIso,
        dateTimeGMT: matchStartTimeIso,
        startDate: matchStartTimeIso,
        calculatedFinishedDate: calculatedFinishedIso
      });
    }

    return res.status(404).json({ success: false, message: "Match details not found" });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
