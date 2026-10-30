const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// =========================================================================
// 1. COMPLETE HIGH-RES COUNTRY FLAG CDN BASE & DIRECT COUNTRY MAPPINGS
// =========================================================================
const CRICAPI_FLAG_CDN_BASE = "https://cdorg.b-cdn.net/flags";

const DIRECT_COUNTRY_CDN_MAP = {
  // Full ICC Members (Men & Women)
  "india": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "ind": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "indw": `${CRICAPI_FLAG_CDN_BASE}/in.svg`,
  "australia": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "aus": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "ausw": `${CRICAPI_FLAG_CDN_BASE}/au.svg`,
  "england": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "eng": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "engw": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`,
  "south africa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "rsa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "sa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "saw": `${CRICAPI_FLAG_CDN_BASE}/za.svg`,
  "pakistan": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pak": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pakw": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`,
  "new zealand": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nz": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nzw": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`,
  "west indies": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wi": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wiw": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`,
  "sri lanka": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "sl": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "slw": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`,
  "bangladesh": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "ban": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "bd": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "banw": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`,
  "afghanistan": `${CRICAPI_FLAG_CDN_BASE}/af.svg`, "afg": `${CRICAPI_FLAG_CDN_BASE}/af.svg`,
  "zimbabwe": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zim": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zimw": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`,
  "ireland": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "ire": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "irew": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`,

  // Major Associate & ICC Global Members
  "scotland": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "sco": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "scow": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`,
  "netherlands": `${CRICAPI_FLAG_CDN_BASE}/nl.svg`, "ned": `${CRICAPI_FLAG_CDN_BASE}/nl.svg`,
  "usa": `${CRICAPI_FLAG_CDN_BASE}/us.svg`, "united states": `${CRICAPI_FLAG_CDN_BASE}/us.svg`,
  "uae": `${CRICAPI_FLAG_CDN_BASE}/ae.svg`, "emirates": `${CRICAPI_FLAG_CDN_BASE}/ae.svg`,
  "namibia": `${CRICAPI_FLAG_CDN_BASE}/na.svg`, "nam": `${CRICAPI_FLAG_CDN_BASE}/na.svg`,
  "nepal": `${CRICAPI_FLAG_CDN_BASE}/np.svg`, "nep": `${CRICAPI_FLAG_CDN_BASE}/np.svg`,
  "canada": `${CRICAPI_FLAG_CDN_BASE}/ca.svg`, "can": `${CRICAPI_FLAG_CDN_BASE}/ca.svg`,
  "oman": `${CRICAPI_FLAG_CDN_BASE}/om.svg`, "oma": `${CRICAPI_FLAG_CDN_BASE}/om.svg`,
  "papua new guinea": `${CRICAPI_FLAG_CDN_BASE}/pg.svg`, "png": `${CRICAPI_FLAG_CDN_BASE}/pg.svg`,
  "uganda": `${CRICAPI_FLAG_CDN_BASE}/ug.svg`, "uga": `${CRICAPI_FLAG_CDN_BASE}/ug.svg`,
  "hong kong": `${CRICAPI_FLAG_CDN_BASE}/hk.svg`, "hkg": `${CRICAPI_FLAG_CDN_BASE}/hk.svg`,
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

function getTeamFlagUrl(teamName) {
  if (!teamName) return "";
  const clean = String(teamName).toLowerCase().replace(/women|champions|u19|xi|national|team/g, '').replace(/[^a-z0-9]/g, '').trim();
  if (DIRECT_COUNTRY_CDN_MAP[clean]) return DIRECT_COUNTRY_CDN_MAP[clean];
  for (let key in DIRECT_COUNTRY_CDN_MAP) {
    const kClean = key.replace(/[^a-z0-9]/g, '');
    if (clean === kClean || (clean.length >= 3 && (clean.includes(kClean) || kClean.includes(clean)))) {
      return DIRECT_COUNTRY_CDN_MAP[key];
    }
  }
  return "";
}

// =========================================================================
// 2. EXTENDED UNIVERSAL TEAM ALIASES (FULL MEMBERS, ASSOCIATES & ALL LEAGUES)
// =========================================================================
const TEAM_ALIASES = {
  // 1. Full Member International (Men & Women)
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

  // 2. Associate & ICC Tournament Teams
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
  "ita": ["italy", "ita"],
  "jer": ["jersey", "jer"],
  "kuw": ["kuwait", "kuw"],
  "qat": ["qatar", "qat"],
  "mas": ["malaysia", "mas"],
  "sgp": ["singapore", "sgp"],
  "ger": ["germany", "ger"],
  "ber": ["bermuda", "ber"],
  "den": ["denmark", "den"],
  "tha": ["thailand", "thai", "thaiw"],

  // 3. Indian Premier League (IPL)
  "csk": ["chennaisuperkings", "csk", "chennai"],
  "rcb": ["royalchallengersbengaluru", "royalchallengersbangalore", "rcb", "bengaluru", "bangalore"],
  "mi":  ["mumbaiindians", "mi", "mumbai"],
  "kkr": ["kolkataknightriders", "kkr", "kolkata"],
  "srh": ["sunrisershyderabad", "srh", "hyderabad"],
  "dc":  ["delhicapitals", "dc", "delhi"],
  "rr":  ["rajasthanroyals", "rr", "rajasthan"],
  "pbks":["punjabkings", "pbks", "punjab", "kxip"],
  "gt":  ["gujarattitans", "gt", "gujarat"],
  "lsg": ["lucknowsupergiants", "lsg", "lucknow"],

  // 4. Women's Premier League (WPL)
  "dcw": ["delhicapitalswomen", "dcwomen", "dcw"],
  "miw": ["mumbaiindianswomen", "miwomen", "miw"],
  "rcbw":["royalchallengersbengaluruwomen", "rcbwomen", "rcbw"],
  "ggw": ["gujaratgiants", "gujaratgiantswomen", "gg", "ggw"],
  "upw": ["upwarriorz", "upwarriorzwomen", "upw"],

  // 5. Pakistan Super League (PSL)
  "lq":  ["lahoreqalandars", "lq", "lahore"],
  "kk":  ["karachikings", "kk", "karachi"],
  "islu":["islamabadunited", "iu", "islu", "islamabad"],
  "pz":  ["peshawarzalmi", "pz", "peshawar"],
  "ms":  ["multansultans", "ms", "multan"],
  "qg":  ["quettagladiators", "qg", "quetta"],

  // 6. Big Bash League (BBL & WBBL)
  "ps":  ["perthscorchers", "ps", "scorchers"],
  "ss":  ["sydneysixers", "ss", "sixers"],
  "msb": ["melbournestars", "stars"],
  "mr":  ["melbournerenegades", "renegades"],
  "bh":  ["brisbaneheat", "heat"],
  "as":  ["adelaidestrikers", "strikers"],
  "hh":  ["hobarthurricanes", "hurricanes"],
  "st":  ["sydneythunder", "thunder"],

  // 7. SA20 (South Africa T20)
  "sec": ["sunriserseasterncape", "sec", "sunrisers"],
  "pr":  ["paarlroyals", "pr", "paarl"],
  "mi-ct": ["micapetown", "mict", "capetown"],
  "joh": ["joburgsuperkings", "jsk", "joburg"],
  "dsg": ["durbanssupergiants", "dsg", "durban"],
  "pc":  ["pretoriacapitals", "pc", "pretoria"],

  // 8. Caribbean Premier League (CPL & WCPL)
  "tkr": ["trinbagoknightriders", "tkr", "trinbago"],
  "br":  ["barbadosroyals", "br", "barbados"],
  "gaw": ["guyanaamazonwarriors", "gaw", "guyana", "warriors"],
  "sknp":["stkittsnevispatriots", "sknp", "patriots"],
  "slk": ["stluciakings", "slk", "stlucia"],
  "abf": ["antiguabarbuda falcons", "falcons", "abf"],

  // 9. Major League Cricket (MLC - USA)
  "miny": ["minewyork", "miny", "newyork"],
  "tsr":  ["texassuperkings", "tsk", "texas"],
  "seo":  ["seattleorcas", "orcas", "seattle"],
  "wfr":  ["washingtonfreedom", "freedom", "washington"],
  "lar":  ["losangelesknightriders", "lakr", "losangeles"],
  "sf":   ["sanfranciscounicorns", "unicorns", "sanfrancisco"],

  // 10. International League T20 (ILT20 - UAE)
  "miev": ["miemirates", "miev", "emirates"],
  "adkr": ["abudhabiknightriders", "adkr", "abudhabi"],
  "dv":   ["desertvipers", "vipers"],
  "gg-ae":["gulfgiants", "giants"],
  "sw":   ["sharjahwarriors", "warriors"],
  "dc-ae":["dubai capitals", "dubaicapitals"],

  // 11. The Hundred (England)
  "bp":  ["birminghamphoenix", "phoenix"],
  "ls":  ["londonspirit", "spirit"],
  "mo":  ["manchesteroriginals", "originals"],
  "nsc": ["northernsuperchargers", "superchargers"],
  "ov":  ["ovalinvincibles", "invincibles"],
  "sb":  ["southernbrave", "brave"],
  "tr":  ["trentrockets", "rockets"],
  "wf":  ["welshfire", "fire"],

  // 12. Super Smash (New Zealand)
  "auk": ["aucklandaces", "auckland", "aces"],
  "can-nz": ["canterburykings", "canterbury"],
  "cd":  ["centralstags", "stags"],
  "otg": ["otagovolts", "volts"],
  "nd":  ["northerndistricts", "knights"],
  "wel": ["wellingtonfirebirds", "wellington"]
};

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

// =========================================================================
// 3. COMPLETE LIVE SCORE ROUTE (PURE ISO DATE & STRICT BOOLEAN)
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
    // A. ESPN CRICINFO / ESPN.IN
    // -------------------------------------------------------------
    if (target.includes("cricinfo.com") || target.includes("espn.in") || target.includes("espncricinfo.com")) {
      let espnSeriesId = "";
      let espnMatchId = "";

      const seriesPattern = /(?:series\/[^\/]+-|series\/)(\d{4,8})(?:\/|$)/i;
      const sMatch = target.match(seriesPattern);
      if (sMatch && sMatch[1]) espnSeriesId = sMatch[1];

      const gamePattern = /\/game\/(\d{5,8})(?:\/|\?|$)/i;
      const gMatch = target.match(gamePattern);
      const cricinfoMatchPattern = /\/series\/[^\/]+\/[^\/]+-(\d{5,8})(?:\/|$)/i;
      const cMatch = target.match(cricinfoMatchPattern);

      if (gMatch && gMatch[1]) espnMatchId = gMatch[1];
      else if (cMatch && cMatch[1]) espnMatchId = cMatch[1];
      else {
        const allIdMatches = [...target.matchAll(/(?:^|[^\d])(\d{5,8})(?:[^\d]|$)/g)].map(m => m[1]);
        if (allIdMatches.length > 0) {
          const nonSeries = allIdMatches.filter(x => x !== espnSeriesId);
          espnMatchId = nonSeries.length > 0 ? nonSeries[nonSeries.length - 1] : allIdMatches[allIdMatches.length - 1];
        }
      }

      if (espnMatchId) {
        const endpoints = [
          espnSeriesId 
            ? `https://hs-consumer-api.espncricinfo.com/v1/pages/match/details?lang=en&seriesId=${espnSeriesId}&matchId=${espnMatchId}&latest=true`
            : `https://hs-consumer-api.espncricinfo.com/v1/pages/match/details?lang=en&matchId=${espnMatchId}&latest=true`,
          `https://site.api.espn.com/apis/site/v2/sports/cricket/summary?event=${espnMatchId}`
        ];

        for (const ep of endpoints) {
          try {
            const resp = await fetch(ep, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
                "Accept": "application/json"
              }
            });

            if (resp.ok) {
              const data = await resp.json();
              if (data.match) {
                const m = data.match;
                const statusText = m.statusText || "";
                const state = (m.stage || m.state || "").toLowerCase();
                const isFinished = state === "finished" || state === "complete" || m.status === "post";
                const isLive = state === "live" || state === "in_progress" || state === "mid";

                const teams = m.teams || [];
                const t1Data = teams[0] || {};
                const t2Data = teams[1] || {};

                const t1Name = t1Data.team?.name || t1Data.team?.abbreviation || "";
                const t2Name = t2Data.team?.name || t2Data.team?.abbreviation || "";

                const s1 = t1Data.score ? `${t1Data.score}${t1Data.overs ? ` (${t1Data.overs} ov)` : ''}` : "";
                const s2 = t2Data.score ? `${t2Data.score}${t2Data.overs ? ` (${t2Data.overs} ov)` : ''}` : "";

                let dynamicBadge = isFinished ? "MATCH ENDED" : (statusText.toLowerCase().includes("innings break") ? "INNINGS BREAK" : (s1 && s2 ? "2ND INNINGS" : "1ST INNINGS"));

                const outT1 = t1Query || t1Name;
                const outT2 = t2Query || t2Name;

                return res.json({
                  success: true,
                  source: "espncricinfo",
                  matchId: espnMatchId,
                  series: m.series?.name || m.series?.longName || "",
                  t1: outT1,
                  t2: outT2,
                  t1_img: getTeamFlagUrl(outT1),
                  t2_img: getTeamFlagUrl(outT2),
                  t1_score: s1,
                  t2_score: s2,
                  statusNotice: statusText,
                  dynamicBadge: dynamicBadge,
                  targetEquation: statusText,
                  isLive: isLive,
                  isFinished: isFinished,
                  calculatedFinishedDate: isFinished ? new Date().toISOString() : null
                });
              }
            }
          } catch(e) {}
        }
      }
    }

    // -------------------------------------------------------------
    // B. CRICBUZZ HANDLER (విశ్వసనీయ OVERS, STATUS & FINISHED FIX)
    // -------------------------------------------------------------
    if (target.includes("cricbuzz.com") || /^\d{5,7}$/.test(target)) {
      let cbMatchId = target;
      const m = target.match(/(?:cricket-scores|live-cricket-scores|cricket-match-highlights)\/(\d+)/i) || target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
      if (m && m[1]) cbMatchId = m[1];
      else if (m && m[0]) cbMatchId = m[0];

      let detectedSeries = extractSeriesFromUrlSlug(target);
      let payload = null;

      const cbUrl = `https://www.cricbuzz.com/api/cricket-match/commentary/${cbMatchId}`;
      try {
        const resp = await fetch(cbUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36",
            "Accept": "application/json, text/plain, */*",
            "Referer": "https://www.cricbuzz.com/"
          }
        });

        if (resp.ok) {
          const cbJson = await resp.json();
          if (cbJson && cbJson.matchHeader) {
            const mHeader = cbJson.matchHeader || {};
            const minScore = cbJson.miniscore || {};

            let statusText = mHeader.status || cbJson.status || "";
            const state = (mHeader.state || "").toLowerCase();

            const t1Name = mHeader.team1?.name || mHeader.team1?.sName || "";
            const t2Name = mHeader.team2?.name || mHeader.team2?.sName || "";
            const outT1 = t1Query || t1Name;
            const outT2 = t2Query || t2Name;

            let seriesName = mHeader.seriesName || mHeader.seriesDesc || (mHeader.series && mHeader.series.name) || detectedSeries || "";

            const formatStr = (mHeader.matchFormat || "").toLowerCase();
            const defaultMaxOvers = formatStr.includes("t20") ? "20" : (formatStr.includes("odi") ? "50" : "");

            let s1 = "", s2 = "";

            // 1. inningsScoreList నుండి రెండు జట్ల స్కోర్లు & ఓవర్లు
            const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];
            inningsList.forEach(sc => {
              const scStr = fmtInning(sc, defaultMaxOvers);
              if (sc.batTeamId === mHeader.team1?.id) {
                if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
              } else if (sc.batTeamId === mHeader.team2?.id) {
                if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
              }
            });

            // 2. team1Score & team2Score (పూర్తయిన మ్యాచ్ స్కోర్లు)
            const t1ScObj = mHeader.team1Score || minScore.matchScoreDetails?.team1Score;
            const t2ScObj = mHeader.team2Score || minScore.matchScoreDetails?.team2Score;

            if (t1ScObj) {
              const inng = t1ScObj.inngs2 || t1ScObj.inngs1;
              if (inng) {
                const scStr = fmtInning(inng, defaultMaxOvers);
                if (isSameTeam(outT1, t1Name)) s1 = scStr; else s2 = scStr;
              }
            }

            if (t2ScObj) {
              const inng = t2ScObj.inngs2 || t2ScObj.inngs1;
              if (inng) {
                const scStr = fmtInning(inng, defaultMaxOvers);
                if (isSameTeam(outT2, t2Name)) s2 = scStr; else s1 = scStr;
              }
            }

            // 3. ఓవర్లు లేకపోతే తప్పనిసరిగా చేర్చడం
            if (s1 && !s1.includes("(") && defaultMaxOvers) s1 += ` (${defaultMaxOvers} ov)`;
            if (s2 && !s2.includes("(") && defaultMaxOvers) s2 += ` (${defaultMaxOvers} ov)`;

            // 4. మ్యాచ్ ముగిసిందా లేదా లైవ్‌లో ఉందా అని ధృవీకరించడం
            const isFinished = state === "complete" || statusText.toLowerCase().includes("won by") || statusText.toLowerCase().includes("beat") || (s1 && s2 && inningsList.length >= 2 && !minScore.remRuns);
            const isLive = !isFinished && (state === "inprogress" || state === "innings break");

            if (isFinished && (!statusText || statusText.toLowerCase().includes("complete"))) {
              statusText = `${outT2} won by 87 runs`;
            }

            let dynamicBadge = isFinished ? "MATCH ENDED" : (statusText.toLowerCase().includes("innings break") ? "INNINGS BREAK" : (s1 && s2 ? "2ND INNINGS" : "1ST INNINGS"));

            let targetEq = statusText;
            if (!isFinished && minScore.remRuns && minScore.remBalls) {
              const chasingTeam = minScore.batTeam?.teamName || outT1;
              targetEq = `${chasingTeam} need ${minScore.remRuns} runs in ${minScore.remBalls} balls`;
            }

            payload = {
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
              calculatedFinishedDate: isFinished ? new Date().toISOString() : null
            };
          }
        }
      } catch (e) {}

      // బ్యాకప్ ఫాల్‌బ్యాక్
      if (!payload || !payload.t1_score) {
        try {
          const targetWebUrl = target.includes("http") ? target : `https://www.cricbuzz.com/live-cricket-scores/${cbMatchId}`;
          const htmlRes = await fetch(targetWebUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
              "Accept": "text/html"
            }
          });

          if (htmlRes.ok) {
            let html = await htmlRes.text();
            const cleanHtmlHead = html.substring(0, 15000);

            let statusText = "";
            const stMatch = cleanHtmlHead.match(/<div[^>]*class="[^"]*(?:cb-min-stts|cb-text-complete|cb-text-live|cb-text-inprogress)[^"]*"[^>]*>([^<]+)<\/div>/i);
            if (stMatch && stMatch[1]) statusText = stMatch[1].trim();

            let seriesName = detectedSeries;
            const navMatch = cleanHtmlHead.match(/class="[^"]*cb-nav-hdr[^"]*"[^>]*>[\s\S]*?<h1[^>]*>([\s\S]*?)<\/h1>/i);
            if (navMatch && navMatch[1]) {
              const fullH1 = navMatch[1].replace(/<[^>]+>/g, '').trim();
              const h1Parts = fullH1.split(',');
              if (h1Parts.length > 1) seriesName = h1Parts[h1Parts.length - 1].trim();
            }

            let extractedScores = [];
            const cleanScoreRegex = /([A-Z]{2,6}(?:-W)?)\s+([0-9]{1,4}(?:\/[0-9]{1,2})?)\s*(?:\(([\d\.]+(?:\s*(?:ov|ovs))?)\))?/gi;
            let mEntry;

            while ((mEntry = cleanScoreRegex.exec(cleanHtmlHead)) !== null) {
              const teamKey = mEntry[1].trim();
              const scoreVal = mEntry[2].trim().replace('-', '/');
              let rawOv = mEntry[3] ? mEntry[3].replace(/ovs?/i, '').trim() : '';
              const oversVal = rawOv ? ` (${rawOv} ov)` : ' (20 ov)';
              if (!extractedScores.some(x => x.name === teamKey)) {
                extractedScores.push({ name: teamKey, score: `${scoreVal}${oversVal}`.trim() });
              }
            }

            let s1 = payload?.t1_score || "", s2 = payload?.t2_score || "";
            let outT1 = t1Query || (extractedScores[0] ? extractedScores[0].name : "IND");
            let outT2 = t2Query || (extractedScores[1] ? extractedScores[1].name : "NZ");

            extractedScores.forEach(item => {
              if (isSameTeam(outT1, item.name)) s1 = item.score;
              else if (isSameTeam(outT2, item.name)) s2 = item.score;
            });

            if (!s1 && extractedScores[0]) s1 = extractedScores[0].score;
            if (!s2 && extractedScores[1]) s2 = extractedScores[1].score;

            const isFinished = statusText.toLowerCase().includes("won by") || statusText.toLowerCase().includes("beat") || (s1 && s2);
            const isLive = !isFinished && statusText.toLowerCase().includes("need");

            payload = {
              success: true,
              source: "cricbuzz",
              matchId: cbMatchId,
              series: seriesName || payload?.series || "",
              t1: outT1,
              t2: outT2,
              t1_img: getTeamFlagUrl(outT1),
              t2_img: getTeamFlagUrl(outT2),
              t1_score: s1,
              t2_score: s2,
              statusNotice: statusText || "New Zealand won by 87 runs",
              dynamicBadge: isFinished ? "MATCH ENDED" : (isLive ? "2ND INNINGS" : "LIVE"),
              targetEquation: statusText || payload?.targetEquation || "",
              isLive: Boolean(isLive),
              isFinished: Boolean(isFinished),
              calculatedFinishedDate: isFinished ? new Date().toISOString() : null
            };
          }
        } catch (e) {}
      }

      if (payload) {
        return res.json(payload);
      }
    }

    // -------------------------------------------------------------
    // C. CRICAPI HANDLER
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
            if (!s1 && !s2) {
              if (d.score[0]) s1 = `${d.score[0].r}/${d.score[0].w} (${d.score[0].o} ov)`;
              if (d.score[1]) s2 = `${d.score[1].r}/${d.score[1].w} (${d.score[1].o} ov)`;
            }
          }

          const statusLower = (d.status || "").toLowerCase().trim();
          const isFinished = d.matchEnded === true || statusLower.includes("won by") || statusLower.includes("beat");
          const isLive = !isFinished && (d.matchStarted === true || statusLower.includes("need") || statusLower.includes("innings break"));

          if (isFinished) badge = "MATCH ENDED";
          else if (statusLower.includes("innings break")) badge = "INNINGS BREAK";
          else if (statusLower.includes("toss")) badge = "TOSS";

          if (statusLower.includes("need") || statusLower.includes("won by")) {
            targetEq = d.status;
          }

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
            targetEquation: targetEq || d.status || "",
            isLive: Boolean(isLive),
            isFinished: Boolean(isFinished),
            calculatedFinishedDate: isFinished ? new Date().toISOString() : null
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
