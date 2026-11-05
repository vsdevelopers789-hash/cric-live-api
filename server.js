const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// =========================================================================
// 1. UNIVERSAL CDN COUNTRY FLAGS BASE & MAPPINGS
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
  "ireland": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "ire": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "irew": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`,
  "usa": `${CRICAPI_FLAG_CDN_BASE}/us.svg`, "nepal": `${CRICAPI_FLAG_CDN_BASE}/np.svg`, "netherlands": `${CRICAPI_FLAG_CDN_BASE}/nl.svg`,
  "scotland": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "namibia": `${CRICAPI_FLAG_CDN_BASE}/na.svg`, "uae": `${CRICAPI_FLAG_CDN_BASE}/ae.svg`,
  "canada": `${CRICAPI_FLAG_CDN_BASE}/ca.svg`, "oman": `${CRICAPI_FLAG_CDN_BASE}/om.svg`, "png": `${CRICAPI_FLAG_CDN_BASE}/pg.svg`
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
            if (item.id) DYNAMIC_COUNTRY_CDN_MAP[item.id.toLowerCase()] = item.genericFlag;
          }
        });
      }
    }
  } catch (e) {}
}
preloadCricapiCountries();

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
// 3. API ROUTE (STRICT UPCOMING / LIVE / FINISHED LOGIC)
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
    let rawStart = null;
    let htmlText = "";

    const results = await Promise.allSettled([
      fetch(cbUrl, { headers }),
      fetch(cbInfoUrl, { headers }),
      fetch(mobileWebUrl, { headers })
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

    // HTML నుండి ప్రారంభ సమయం (ఉదా: "Match starts at Nov 07, 02:00 GMT")
    let upcomingNotice = "";
    if (htmlText) {
      const matchStartsRegex = /Match starts at ([A-Za-z0-9,\s:]+GMT)/i;
      const startsMatch = htmlText.match(matchStartsRegex);
      if (startsMatch) {
        upcomingNotice = startsMatch[0].trim();
        if (!rawStart) {
          // తేదీని ISO రూపంలోకి మార్చడం
          const gmtStr = startsMatch[1];
          const parsedEpoch = new Date(`${gmtStr} 2026`).getTime() || new Date(gmtStr).getTime();
          if (parsedEpoch && !isNaN(parsedEpoch)) rawStart = parsedEpoch;
        }
      }
    }

    // టీమ్ పేర్లు గుర్తించడం
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

    const outT1 = t1Query || t1Name || "Team 1";
    const outT2 = t2Query || t2Name || "Team 2";

    // మ్యాచ్ స్థితి నిర్ణయం (State)
    const state = (mHeader.state || infoJson.matchInfo?.state || cbJson.state || "").toLowerCase();
    const statusRaw = (mHeader.status || infoJson.matchInfo?.status || mHeader.result?.message || cbJson.status || "").trim();
    const statusLower = statusRaw.toLowerCase();

    // Upcoming స్థితి ఖచ్చితమైన తనిఖీ
    const isMatchPreview = Boolean(upcomingNotice) 
                        || state === "preview" 
                        || state === "upcoming" 
                        || statusLower.includes("starts at") 
                        || statusLower.includes("match starts");

    const isMatchComplete = !isMatchPreview && (
      state === "complete" || state === "finished" || statusLower.includes("won by") || statusLower.includes("beat") || statusLower.includes("match drawn")
    );

    const isMatchLive = !isMatchPreview && !isMatchComplete;

    let s1 = "", s2 = "";
    let statusNotice = "";

    // -------------------------------------------------------------------------
    // 1. UPCOMING MATCH అయితే స్కోర్లు ఉండకూడదు, కేవలం టైమ్ మాత్రమే ఉండాలి
    // -------------------------------------------------------------------------
    if (isMatchPreview) {
      s1 = "";
      s2 = "";
      statusNotice = upcomingNotice || statusRaw || "Match Starts Soon";
    } 
    // -------------------------------------------------------------------------
    // 2. LIVE లేదా FINISHED అయితే మాత్రమే స్కోర్లు ప్రాసెస్ చేయాలి
    // -------------------------------------------------------------------------
    else {
      const inningsList = minScore.matchScoreDetails?.inningsScoreList || cbJson.miniscore?.matchScoreDetails?.inningsScoreList || [];
      if (inningsList.length > 0) {
        inningsList.forEach((sc, idx) => {
          const r = sc.score ?? sc.runs ?? 0;
          let w = sc.wickets !== undefined ? `/${sc.wickets}` : (sc.isAllOut ? '/10' : '');
          let ov = sc.overs ?? sc.ovrs ?? "";
          let ovStr = (ov !== "" && ov !== undefined) ? ` (${ov} ov)` : '';
          const formatted = `${r}${w}${ovStr}`.trim();

          if (sc.batTeamId === mHeader.team1?.id || idx === 0) {
            if (isSameTeam(outT1, mHeader.team1?.name)) s1 = formatted;
            else s2 = formatted;
          } else if (sc.batTeamId === mHeader.team2?.id || idx === 1) {
            if (isSameTeam(outT2, mHeader.team2?.name)) s2 = formatted;
            else s1 = formatted;
          }
        });
      }

      if (isMatchComplete) {
        if (mHeader.result?.message && (isSameTeam(outT1, mHeader.result.message) || isSameTeam(outT2, mHeader.result.message))) {
          statusNotice = mHeader.result.message;
        } else if (statusLower.includes("won by")) {
          statusNotice = statusRaw;
        } else if (htmlText) {
          const wonMatch = htmlText.match(new RegExp(`(?:${outT1}|${outT2})\\s+won by [^<\\n]*`, "i"));
          if (wonMatch) statusNotice = wonMatch[0].replace(/<[^>]+>/g, '').trim();
        }
        if (!statusNotice) statusNotice = "Match Ended";
      } else {
        const isInningsBreak = htmlText.includes("Innings Break") || statusLower.includes("innings break");
        if (isInningsBreak) {
          statusNotice = "Innings Break";
        } else {
          const liveNeedRegex = new RegExp(`(?:${outT1}|${outT2})\\s+need\\s+\\d+\\s+runs[^<"\\n]*`, "i");
          const needMatch = htmlText.match(liveNeedRegex);
          if (needMatch) {
            statusNotice = needMatch[0].replace(/<[^>]+>/g, '').replace(/href="[^"]*"/gi, '').replace(/\s+/g, ' ').trim();
          } else if (minScore.remRuns) {
            const remB = minScore.remBalls ? ` in ${minScore.remBalls} balls` : '';
            statusNotice = `${outT2} need ${minScore.remRuns} runs${remB}`;
          } else if (mHeader.tossResults?.tossWinnerName) {
            statusNotice = `${mHeader.tossResults.tossWinnerName} opt to ${mHeader.tossResults.decision?.toLowerCase() || 'bowl'}`;
          } else {
            statusNotice = "Match in progress";
          }
        }
      }
    }

    // డైనమిక్ బ్యాడ్జ్
    let dynamicBadge = "UPCOMING";
    if (isMatchComplete) {
      dynamicBadge = "MATCH ENDED";
    } else if (statusNotice === "Innings Break") {
      dynamicBadge = "INNINGS BREAK";
    } else if (isMatchLive) {
      dynamicBadge = s2 ? "2ND INNINGS" : "1ST INNINGS";
    }

    const matchStartTimeIso = parseToIsoDate(rawStart);
    const seriesTitle = detectedSeries || mHeader.seriesName || infoJson.matchInfo?.series?.name || "Cricket Series";
    const calculatedFinishedIso = calculateSeriesSmartTime(rawStart, seriesTitle, isMatchComplete);

    return res.json({
      success: true,
      source: "cricbuzz",
      matchId: cbMatchId,
      series: seriesTitle,
      t1: outT1,
      t2: outT2,
      t1_img: getTeamFlagUrl(outT1),
      t2_img: getTeamFlagUrl(outT2),
      t1_score: s1,
      t2_score: s2,
      statusNotice: statusNotice,
      dynamicBadge: dynamicBadge,
      targetEquation: statusNotice,
      isLive: Boolean(isMatchLive),
      isFinished: Boolean(isMatchComplete),
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
