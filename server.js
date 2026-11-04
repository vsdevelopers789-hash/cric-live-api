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
  // --- 1. ICC Full Members (Men & Women) ---
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

  // --- 2. Associate Nations ---
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
  "bah": ["bahrain", "bh"],
  "sau": ["saudiarabia", "ksa"],

  // --- 3. Indian Premier League (IPL) ---
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

  // --- 4. Women's Premier League (WPL) ---
  "dcw": ["delhicapitalswomen", "dcwomen", "dcw"],
  "miw": ["mumbaiindianswomen", "miwomen", "miw"],
  "rcbw":["royalchallengersbengaluruwomen", "rcbwomen", "rcbw"],
  "ggw": ["gujaratgiants", "gujaratgiantswomen", "gg", "ggw"],
  "upw": ["upwarriorz", "upwarriorzwomen", "upw"],

  // --- 5. Pakistan Super League (PSL) ---
  "lq":  ["lahoreqalandars", "lq", "lahore"],
  "kk":  ["karachikings", "kk", "karachi"],
  "islu":["islamabadunited", "iu", "islu", "islamabad"],
  "pz":  ["peshawarzalmi", "pz", "peshawar"],
  "ms":  ["multansultans", "ms", "multan"],
  "qg":  ["quettagladiators", "qg", "quetta"],

  // --- 6. Big Bash League (BBL & WBBL) ---
  "ps":  ["perthscorchers", "ps", "scorchers"],
  "ss":  ["sydneysixers", "ss", "sixers"],
  "msb": ["melbournestars", "stars"],
  "mr":  ["melbournerenegades", "renegades"],
  "bh":  ["brisbaneheat", "heat"],
  "as":  ["adelaidestrikers", "strikers"],
  "hh":  ["hobarthurricanes", "hurricanes"],
  "st":  ["sydneythunder", "thunder"],

  // --- 7. SA20 (South Africa) ---
  "sec": ["sunriserseasterncape", "sec", "sunrisers"],
  "pr":  ["paarlroyals", "pr", "paarl"],
  "mict":["micapetown", "mict", "capetown"],
  "jsk": ["joburgsuperkings", "jsk", "joburg"],
  "dsg": ["durbanssupergiants", "dsg", "durban"],
  "pc":  ["pretoriacapitals", "pc", "pretoria"],

  // --- 8. Caribbean Premier League (CPL) ---
  "tkr": ["trinbagoknightriders", "tkr", "trinbago"],
  "br":  ["barbadosroyals", "br", "barbados"],
  "gaw": ["guyanaamazonwarriors", "gaw", "guyana", "warriors"],
  "sknp":["stkittsnevispatriots", "sknp", "patriots"],
  "slk": ["stluciakings", "slk", "stlucia"],
  "abf": ["antiguabarbuda falcons", "falcons", "abf"],

  // --- 9. Major League Cricket (MLC - USA) ---
  "miny": ["minewyork", "miny", "newyork"],
  "tsk":  ["texassuperkings", "tsk", "texas"],
  "seo":  ["seattleorcas", "orcas", "seattle"],
  "wfr":  ["washingtonfreedom", "freedom", "washington"],
  "lakr": ["losangelesknightriders", "lakr", "losangeles"],
  "sf":   ["sanfranciscounicorns", "unicorns", "sanfrancisco"],

  // --- 10. International League T20 (ILT20 - UAE) ---
  "miev": ["miemirates", "miev", "emirates"],
  "adkr": ["abudhabiknightriders", "adkr", "abudhabi"],
  "dv":   ["desertvipers", "vipers"],
  "ggae": ["gulfgiants", "giants"],
  "sw":   ["sharjahwarriors", "warriors"],
  "dcae": ["dubaicapitals", "dubai"],

  // --- 11. The Hundred (England) ---
  "bp":  ["birminghamphoenix", "phoenix"],
  "ls":  ["londonspirit", "spirit"],
  "mo":  ["manchesteroriginals", "originals"],
  "nsc": ["northernsuperchargers", "superchargers"],
  "ov":  ["ovalinvincibles", "invincibles"],
  "sb":  ["southernbrave", "brave"],
  "tr":  ["trentrockets", "rockets"],
  "wf":  ["welshfire", "fire"],

  // --- 12. Super Smash (New Zealand) ---
  "ack": ["aucklandaces", "auckland"],
  "can-nz": ["canterburykings", "canterbury"],
  "cd":  ["centralstags", "stags"],
  "nd":  ["northernbrave", "knights"],
  "otg": ["otagovolts", "volts"],
  "wel": ["wellingtonfirebirds", "firebirds"],

  // --- 13. Bangladesh Premier League (BPL) ---
  "cv":  ["comillavictorians", "comilla"],
  "rr-bd":["rangpurriders", "rangpur"],
  "fb":  ["fortunebarishal", "barishal"],
  "ss-bd":["sylhetstrikers", "sylhet"],
  "cc":  ["chattogramchallengers", "chattogram"],
  "kt":  ["khulnatigers", "khulna"],
  "dr":  ["dhakadominators", "dhaka"],

  // --- 14. Lanka Premier League (LPL) ---
  "jk":  ["jaffnakings", "jaffna"],
  "ck":  ["colombostrikers", "colombo"],
  "gm":  ["gallemarvels", "galletitans", "galle"],
  "bf":  ["b-lovekandy", "kandyfalcons", "kandy"],
  "da":  ["dambullaaurora", "dambullasixers", "dambulla"]
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
    // A. ESPN CRICINFO HANDLER
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
                let statusText = m.statusText || m.resultNote || "";
                const state = (m.stage || m.state || "").toLowerCase();
                const isFinished = state === "finished" || state === "complete" || m.status === "post" || statusText.toLowerCase().includes("won by");
                const isLive = !isFinished && (state === "live" || state === "in_progress" || state === "mid");

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
                const seriesTitle = m.series?.name || m.series?.longName || "";

                const rawStart = m.startDate || m.startTime || m.startDateTime;
                const matchStartTimeIso = parseToIsoDate(rawStart);
                const calculatedFinishedIso = calculateSeriesSmartTime(rawStart, seriesTitle, isFinished);

                return res.json({
                  success: true,
                  source: "espncricinfo",
                  matchId: espnMatchId,
                  series: seriesTitle,
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
                  startTimeGMT: matchStartTimeIso,
                  dateTimeGMT: matchStartTimeIso,
                  startDate: matchStartTimeIso,
                  calculatedFinishedDate: calculatedFinishedIso
                });
              }
            }
          } catch(e) {}
        }
      }
    }

    // -------------------------------------------------------------
    // B. CRICBUZZ HANDLER (JSON API + PARALLEL HTML SCRAPER)
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

      if (!rawStart && htmlText) {
        const ldMatch = htmlText.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/i);
        if (ldMatch && ldMatch[1]) {
          try {
            const parsedLd = JSON.parse(ldMatch[1]);
            if (parsedLd.startDate) rawStart = parsedLd.startDate;
          } catch(e) {}
        }
        if (!rawStart) {
          const tsMatch = htmlText.match(/(?:data-start-time|matchStartTimestamp)="(\d+)"/i) || htmlText.match(/"startDate":"([^"]+)"/i);
          if (tsMatch && tsMatch[1]) {
            rawStart = tsMatch[1].length === 10 ? parseInt(tsMatch[1]) * 1000 : (isNaN(tsMatch[1]) ? tsMatch[1] : parseInt(tsMatch[1]));
          }
        }
      }

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
      if (!formatStr && htmlText) {
        if (/t20/i.test(htmlText.substring(0, 5000))) formatStr = "t20";
        else if (/odi/i.test(htmlText.substring(0, 5000))) formatStr = "odi";
      }
      const maxOversLimit = formatStr.includes("t20") ? 20 : (formatStr.includes("odi") ? 50 : 0);
      const defaultMaxOvers = maxOversLimit ? String(maxOversLimit) : "";

      let s1 = "", s2 = "";
      let secondInningsOvers = 0;

      // 3. అఫీషియల్ JSON API నుండి స్కోర్ల వెలికితీత
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

      // ఒకవేళ JSON లో స్కోర్లు అస్సలు దొరక్కపోతే మాత్రమే HTML ఫాల్‌బ్యాక్ వాడాలి
      if (!s1 && htmlText) {
        const cleanScoreRegex = /([A-Z]{2,6}(?:-W)?)\s+([0-9]{1,4}(?:\/[0-9]{1,2})?)\s*(?:\(([\d\.]+(?:\s*(?:ov|ovs))?)\))?/gi;
        let mEntry;
        while ((mEntry = cleanScoreRegex.exec(htmlText.substring(0, 8000))) !== null) {
          const teamKey = mEntry[1].trim();
          const scoreVal = mEntry[2].trim().replace('-', '/');
          let rawOv = mEntry[3] ? mEntry[3].replace(/ovs?/i, '').trim() : '';
          const oversVal = rawOv ? ` (${rawOv} ov)` : (defaultMaxOvers ? ` (${defaultMaxOvers} ov)` : '');
          const formattedScore = `${scoreVal}${oversVal}`.trim();
          
          if (isSameTeam(outT1, teamKey) && !s1) s1 = formattedScore;
          else if (isSameTeam(outT2, teamKey) && !s2) s2 = formattedScore;
        }
      }

      // =========================================================================
      // 4. ఫలితం / టాస్ / లైవ్ స్టేటస్ గుర్తింపు
      // =========================================================================
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

      // HTML నుంచి స్టేటస్ తీసేటప్పుడు కేవలం ప్రస్తుత మ్యాచ్ కి సంబంధించినది మాత్రమే తీసుకోవాలి
      if (htmlText) {
        const resultPatterns = [
          /<div[^>]*class="[^"]*(?:cb-text-complete|cb-min-stts|cb-text-live|cb-text-inprogress)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
          /class="[^"]*cb-col-100 cb-col cb-font-18 cb-text-bold[^"]*"[^>]*>([\s\S]*?)<\/div>/i
        ];
        for (const reg of resultPatterns) {
          const found = htmlText.match(reg);
          if (found && found[1]) {
            const clean = found[1].replace(/<[^>]+>/g, '').trim();
            if (clean.length > 5 && !clean.includes("{")) {
              if (isSameTeam(outT1, clean) || isSameTeam(outT2, clean) || clean.toLowerCase().includes("opt to")) {
                statusText = clean;
                break;
              }
            }
          }
        }
      }

      // టాస్ సమాచారం
      let tossStatus = "";
      if (mHeader.tossResults?.tossWinnerName) {
        tossStatus = `${mHeader.tossResults.tossWinnerName} opt to ${mHeader.tossResults.decision?.toLowerCase() || 'bowl'}`;
      } else if (htmlText) {
        const tossMatch = htmlText.match(/([A-Za-z\s]+opt to (?:bowl|bat))/i);
        if (tossMatch && tossMatch[1]) {
          tossStatus = tossMatch[1].trim();
        }
      }

      const statusLower = statusText.toLowerCase();
      const state = (mHeader.state || infoJson.matchInfo?.state || "").toLowerCase();

      // లైవ్ మ్యాచ్ పరిస్థితులు
      const isActuallyLive = state === "inprogress" || state === "in progress" || state === "live"
                          || statusLower.includes("opt to") 
                          || statusLower.includes("trail by") 
                          || statusLower.includes("lead by")
                          || statusLower.includes("innings break");

      const isFinished = !isActuallyLive && (
          state === "complete" || 
          state === "finished" || 
          statusLower.includes("won by") || 
          statusLower.includes("beat") || 
          statusLower.includes("match drawn") || 
          statusLower.includes("no result")
      );

      // =========================================================================
      // కచ్చితమైన రెండవ ఇన్నింగ్స్ చెక్: అఫీషియల్ ఇన్నింగ్స్ లిస్ట్ 2 ఉంటేనే 2nd ఇన్నింగ్స్!
      // =========================================================================
      const hasTwoInnings = inningsList.length >= 2 || (t1ScObj?.inngs2 !== undefined) || (t2ScObj?.inngs2 !== undefined);
      const isSecondInnings = isActuallyLive && hasTwoInnings;
      const isLive = !isFinished && (isActuallyLive || Boolean(s1));

      // మొదటి ఇన్నింగ్స్ మాత్రమే జరుగుతుంటే Team 2 స్కోరును ఖచ్చితంగా ఖాళీగా ఉంచడం
      if (isLive && !isSecondInnings) {
        s2 = ""; 
      }

      const p1 = parseScoreDetails(s1);
      const p2 = parseScoreDetails(s2);

      let targetEq = "";

      if (isFinished) {
        if (!statusText || statusText.toLowerCase() === "complete" || !statusText.includes("won by")) {
          if (p1.r > 0 && p2.r > 0) {
            if (p1.r > p2.r) {
              statusText = `${outT1} won by ${10 - p1.w} wkts`;
            } else if (p2.r > p1.r) {
              statusText = `${outT2} won by ${10 - p2.w} wkts`;
            } else {
              statusText = `${p1.r > p2.r ? outT1 : outT2} won by ${Math.abs(p1.r - p2.r)} runs`;
            }
          }
        }
        targetEq = statusText;
      } else if (isLive) {
        // రెండవ ఇన్నింగ్స్ నడుస్తుంటే మాత్రమే NEED RUNS సమీకరణం రావాలి
        if (isSecondInnings && minScore.remRuns !== undefined && minScore.remBalls !== undefined && minScore.remRuns !== null) {
          const chasingTeam = minScore.batTeam?.teamName || outT2;
          targetEq = `${chasingTeam} need ${minScore.remRuns} runs in ${minScore.remBalls} balls`;
          statusText = targetEq;
        } else {
          // మొదటి ఇన్నింగ్స్ అయితే టాస్ ఫలితం మాత్రమే రావాలి
          statusText = tossStatus || (statusLower.includes("opt to") ? statusText : "Match in progress");
          targetEq = statusText;
        }
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

      let dynamicBadge = isFinished ? "MATCH ENDED" : (statusLower.includes("innings break") ? "INNINGS BREAK" : (isSecondInnings ? "2ND INNINGS" : "1ST INNINGS"));

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

          targetEq = d.status || "";

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
            targetEquation: targetEq,
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
