const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// 1. అఫీషియల్ CricAPI / High-Res Flag CDN బేస్ & డైరెక్ట్ మ్యాపింగ్
const CRICAPI_FLAG_CDN_BASE = "https://cdorg.b-cdn.net/flags";

const DIRECT_COUNTRY_CDN_MAP = {
  "india": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "ind": `${CRICAPI_FLAG_CDN_BASE}/in.svg`, "indw": `${CRICAPI_FLAG_CDN_BASE}/in.svg`,
  "australia": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "aus": `${CRICAPI_FLAG_CDN_BASE}/au.svg`, "ausw": `${CRICAPI_FLAG_CDN_BASE}/au.svg`,
  "england": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "eng": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`, "engw": `${CRICAPI_FLAG_CDN_BASE}/gb-eng.svg`,
  "south africa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "rsa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`, "sa": `${CRICAPI_FLAG_CDN_BASE}/za.svg`,
  "pakistan": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pak": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`, "pakw": `${CRICAPI_FLAG_CDN_BASE}/pk.svg`,
  "new zealand": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nz": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`, "nzw": `${CRICAPI_FLAG_CDN_BASE}/nz.svg`,
  "west indies": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wi": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`, "wiw": `${CRICAPI_FLAG_CDN_BASE}/wi.svg`,
  "sri lanka": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "sl": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`, "slw": `${CRICAPI_FLAG_CDN_BASE}/lk.svg`,
  "bangladesh": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "ban": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`, "bd": `${CRICAPI_FLAG_CDN_BASE}/bd.svg`,
  "afghanistan": `${CRICAPI_FLAG_CDN_BASE}/af.svg`, "afg": `${CRICAPI_FLAG_CDN_BASE}/af.svg`,
  "zimbabwe": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zim": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`, "zimw": `${CRICAPI_FLAG_CDN_BASE}/zw.svg`,
  "ireland": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`, "ire": `${CRICAPI_FLAG_CDN_BASE}/ie.svg`,
  "scotland": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`, "sco": `${CRICAPI_FLAG_CDN_BASE}/gb-sct.svg`,
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
  "qatar": `${CRICAPI_FLAG_CDN_BASE}/qa.svg`, "qat": `${CRICAPI_FLAG_CDN_BASE}/qa.svg`
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

// 2. సమగ్ర టీమ్ మ్యాపింగ్ డిక్షనరీ (అన్ని లీగ్‌లు & జట్లు కలిపి)
const TEAM_ALIASES = {
  // 1. Full Member International Men & Women Teams
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
  "sco": ["scotland", "sco", "scotlandw"],
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

  // 6. Big Bash League (BBL)
  "ps":  ["perthscorchers", "ps", "scorchers"],
  "ss":  ["sydneysixers", "ss", "sixers"],
  "msb": ["melbournestars", "stars"],
  "mr":  ["melbournerenegades", "renegades"],
  "bh":  ["brisbaneheat", "heat"],
  "as":  ["adelaidestrikers", "strikers"],
  "hh":  ["hobarthurricanes", "hurricanes"],
  "st":  ["sydneythunder", "thunder"]
};

// 3. సమగ్ర టీమ్ మ్యాచింగ్ ఫంక్షన్
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

// 4. యూనివర్సల్ లైవ్ స్కోర్ హ్యాండ్లర్
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
    // A. ESPN CRICINFO / ESPN.IN (Strict Match ID Separation)
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
                  series: m.series?.name || "",
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
    // B. CRICBUZZ HANDLER (వికెట్లు, ఓవర్లు, ఫ్లాగ్స్, Need runs / Result)
    // -------------------------------------------------------------
    if (target.includes("cricbuzz.com") || /^\d{5,7}$/.test(target)) {
      let cbMatchId = target;
      const m = target.match(/(?:cricket-scores|live-cricket-scores|cricket-match-highlights)\/(\d+)/i) || target.match(/\/(\d+)/) || target.match(/\d{5,7}/);
      if (m && m[1]) cbMatchId = m[1];
      else if (m && m[0]) cbMatchId = m[0];

      let payload = null;

      // 1. JSON API
      const endpoints = [
        `https://www.cricbuzz.com/api/cricket-match/commentary/${cbMatchId}`,
        `https://www.cricbuzz.com/api/cricket-match/live-scores/${cbMatchId}`
      ];

      for (const ep of endpoints) {
        try {
          const resp = await fetch(ep, {
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
              const statusText = mHeader.status || cbJson.status || "";
              const state = (mHeader.state || "").toLowerCase();

              const t1Name = mHeader.team1?.name || mHeader.team1?.sName || "";
              const t2Name = mHeader.team2?.name || mHeader.team2?.sName || "";
              const outT1 = t1Query || t1Name;
              const outT2 = t2Query || t2Name;

              let s1 = "", s2 = "";
              const inningsList = minScore.matchScoreDetails?.inningsScoreList || [];

              function buildExactScoreStr(sc) {
                const runs = sc.score !== undefined ? sc.score : (sc.runs !== undefined ? sc.runs : 0);
                let wkts = "";
                if (sc.wickets !== undefined) wkts = `/${sc.wickets}`;
                else if (sc.wkts !== undefined) wkts = `/${sc.wkts}`;
                else if (sc.isAllOut) wkts = `/10`;

                let rawOv = sc.overs ?? sc.ovrs ?? sc.totalOvers ?? sc.maxOvers ?? '';
                let oversStr = (rawOv !== '' && rawOv !== undefined) ? ` (${rawOv} ov)` : '';
                return `${runs}${wkts}${oversStr}`.trim();
              }

              inningsList.forEach(sc => {
                const scStr = buildExactScoreStr(sc);
                const batName = (sc.batTeamId === mHeader.team1?.id) ? t1Name : ((sc.batTeamId === mHeader.team2?.id) ? t2Name : "");

                if (isSameTeam(outT1, batName)) s1 = scStr;
                else if (isSameTeam(outT2, batName)) s2 = scStr;
              });

              if (!s1 && !s2 && inningsList.length > 0) {
                s1 = buildExactScoreStr(inningsList[0]);
                if (inningsList[1]) s2 = buildExactScoreStr(inningsList[1]);
              }

              const formatStr = (mHeader.matchFormat || "").toLowerCase();
              const defaultOvers = formatStr.includes("t20") ? " (20 ov)" : (formatStr.includes("odi") ? " (50 ov)" : "");
              if (s1 && !s1.includes("(") && defaultOvers) s1 += defaultOvers;
              if (s2 && !s2.includes("(") && defaultOvers) s2 += defaultOvers;

              const isFinished = state === "complete" || statusText.toLowerCase().includes("won by") || statusText.toLowerCase().includes("beat");
              const isLive = !isFinished && (state === "inprogress" || state === "innings break");

              let dynamicBadge = isFinished ? "MATCH ENDED" : (statusText.toLowerCase().includes("innings break") ? "INNINGS BREAK" : (inningsList.length >= 2 ? "2ND INNINGS" : "1ST INNINGS"));

              let targetEq = "";
              if (!isFinished && minScore.remRuns && minScore.remBalls) {
                const chasingTeam = minScore.batTeam?.teamName || outT1;
                targetEq = `${chasingTeam} need ${minScore.remRuns} runs in ${minScore.remBalls} balls`;
              } else if (!isFinished && minScore.remRuns) {
                targetEq = `Need ${minScore.remRuns} runs`;
              } else if (statusText) {
                targetEq = statusText;
              }

              payload = {
                success: true,
                source: "cricbuzz",
                matchId: cbMatchId,
                series: mHeader.seriesName || "",
                t1: outT1,
                t2: outT2,
                t1_img: getTeamFlagUrl(outT1),
                t2_img: getTeamFlagUrl(outT2),
                t1_score: s1,
                t2_score: s2,
                statusNotice: targetEq || statusText,
                dynamicBadge: dynamicBadge,
                targetEquation: targetEq || statusText,
                isLive: isLive,
                isFinished: isFinished,
                calculatedFinishedDate: isFinished ? new Date().toISOString() : null
              };
              break;
            }
          }
        } catch (e) {}
      }

      // 2. HTML Scraper ఫాల్‌బ్యాక్
      if (!payload) {
        try {
          const targetWebUrl = target.includes("http") ? target : `https://www.cricbuzz.com/live-cricket-scores/${cbMatchId}`;
          const htmlRes = await fetch(targetWebUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
            }
          });

          if (htmlRes.ok) {
            let html = await htmlRes.text();
            let statusText = "";
            const stMatch = html.match(/<div[^>]*class="[^"]*(?:cb-min-stts|cb-text-complete|cb-text-live|cb-text-inprogress)[^"]*"[^>]*>([^<]+)<\/div>/i);
            if (stMatch && stMatch[1]) statusText = stMatch[1].trim();

            const needRunsMatch = html.match(/([A-Za-z\s]+need\s+[0-9]+\s+runs(?:[^\n<]*))/i);
            if (needRunsMatch && needRunsMatch[1]) statusText = needRunsMatch[1].trim();

            let extractedScores = [];
            const cleanScoreRegex = /([A-Z]{2,6}(?:-W)?)\s+([0-9]{1,4}(?:\/[0-9]{1,2})?)\s*(?:\(([\d\.]+(?:\s*(?:ov|ovs))?)\))?/gi;
            let mEntry;

            while ((mEntry = cleanScoreRegex.exec(html)) !== null) {
              const teamKey = mEntry[1].trim();
              const scoreVal = mEntry[2].trim().replace('-', '/');
              let rawOv = mEntry[3] ? mEntry[3].replace(/ovs?/i, '').trim() : '';
              const oversVal = rawOv ? ` (${rawOv} ov)` : '';
              const rawRuns = parseInt(scoreVal.split('/')[0]);
              if (rawRuns < 1000 && (rawRuns >= 10 || scoreVal.includes('/'))) {
                if (!extractedScores.some(x => x.name === teamKey)) {
                  extractedScores.push({ name: teamKey, score: `${scoreVal}${oversVal}`.trim() });
                }
              }
            }

            let s1 = "", s2 = "";
            let outT1 = t1Query || (extractedScores[0] ? extractedScores[0].name : "Team 1");
            let outT2 = t2Query || (extractedScores[1] ? extractedScores[1].name : "Team 2");

            extractedScores.forEach(item => {
              if (isSameTeam(outT1, item.name)) s1 = item.score;
              else if (isSameTeam(outT2, item.name)) s2 = item.score;
            });

            if (!s1 && !s2 && extractedScores.length > 0) {
              s1 = extractedScores[0] ? extractedScores[0].score : "";
              s2 = extractedScores[1] ? extractedScores[1].score : "";
            }

            const statusLower = statusText.toLowerCase();
            const isFinished = statusLower.includes("won by") || statusLower.includes("beat");
            const isLive = !isFinished && (statusLower.includes("need") || statusLower.includes("trail") || statusLower.includes("lead"));

            payload = {
              success: true,
              source: "cricbuzz",
              matchId: cbMatchId,
              series: "",
              t1: outT1,
              t2: outT2,
              t1_img: getTeamFlagUrl(outT1),
              t2_img: getTeamFlagUrl(outT2),
              t1_score: s1,
              t2_score: s2,
              statusNotice: statusText,
              dynamicBadge: isFinished ? "MATCH ENDED" : (s1 && s2 ? "2ND INNINGS" : "1ST INNINGS"),
              targetEquation: statusText,
              isLive: isLive,
              isFinished: isFinished,
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
    // C. CRICAPI HANDLER (Flag CDN & Exact Scores)
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
            isLive: isLive,
            isFinished: isFinished,
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
