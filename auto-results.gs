/* ============================================================
   Automatic result updates (no API key, no signup)
   ------------------------------------------------------------
   Pulls finished scores from ESPN's public scoreboard and fills
   the Results tab for you (home / draw / away). Only fills EMPTY
   cells, so anything you set by hand is always kept.

   SETUP (one time):
   1. Run setup() first (if you haven't) so the Results tab exists.
   2. Paste this file into your Apps Script project (new file).
   3. Run `updateResults` once and authorise it.
   4. Run `installAutoUpdate` once — it schedules updateResults to
      run by itself every 30 minutes. Done.

   To stop the automation later: run `removeAutoUpdate`.

   Notes:
   - Results usually appear within minutes of full-time.
   - Knockout games decided on penalties are handled via ESPN's
     "advancing team" flag, but glance at those to be safe — the
     script never writes "draw" into a knockout row.
   ============================================================ */

const ESPN = "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=";

// Normalise team names so the feed's spelling matches ours.
// (handles hyphens, accents, and the word "and" -> e.g. ESPN's
//  "Bosnia-Herzegovina" matches our "Bosnia and Herzegovina")
function canon_(name) {
  let s = String(name).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  s = s.replace(/[^a-z]+/g, " ").replace(/\band\b/g, " ").replace(/\s+/g, " ").trim();
  const syn = {
    "turkey": "turkiye",
    "cote divoire": "ivory coast",
    "korea republic": "south korea",
    "korea": "south korea",
    "usa": "united states",
    "united states of america": "united states",
    "congo dr": "dr congo",
    "congo": "dr congo",
    "democratic republic of congo": "dr congo",
    "czech republic": "czechia",
    "cape verde islands": "cape verde"
  };
  return syn[s] || s;
}

function updateResults() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Results");
  if (!sheet || sheet.getLastRow() < 2) throw new Error("Run setup() first.");

  const rng = sheet.getRange(2, 1, sheet.getLastRow() - 1, 5); // id, date, grp/round, label, result
  const rows = rng.getValues();
  const today = new Date().toISOString().slice(0, 10);

  // Which dates still need filling (date is today or past, result blank)?
  const datesNeeded = {};
  rows.forEach(r => {
    const date = formatDate_(r[1]);
    const result = String(r[4]).trim();
    if (!result && date && date <= today) datesNeeded[date] = true;
  });
  if (!Object.keys(datesNeeded).length) { ss.toast("Nothing new to update."); return; }

  // Fetch each needed date AND its neighbours (±1 day) to absorb timezone
  // drift, then index events by canonical team pair (a pair meets at most
  // once in a short window, so the pairing is a reliable key).
  const fetchDates = {};
  Object.keys(datesNeeded).forEach(d => { [-1, 0, 1].forEach(o => { fetchDates[shiftDate_(d, o)] = true; }); });

  const eventsByKey = {}; // pair -> array of events
  let fetchedEvents = 0;
  const problems = [];
  Object.keys(fetchDates).forEach(date => {
    try {
      const resp = UrlFetchApp.fetch(ESPN + date.replace(/-/g, ""), {
        muteHttpExceptions: true, followRedirects: true,
        headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
      });
      const code = resp.getResponseCode();
      if (code !== 200) { problems.push(date + " → HTTP " + code); return; }
      const data = JSON.parse(resp.getContentText() || "{}");
      const evs = data.events || [];
      fetchedEvents += evs.length;
      evs.forEach(ev => {
        const comp = (ev.competitions && ev.competitions[0]) || {};
        const cs = comp.competitors || [];
        const homeC = cs.filter(c => c.homeAway === "home")[0];
        const awayC = cs.filter(c => c.homeAway === "away")[0];
        if (!homeC || !awayC || !homeC.team || !awayC.team) return;
        const h = canon_(homeC.team.displayName), a = canon_(awayC.team.displayName);
        const completed = !!(ev.status && ev.status.type && ev.status.type.completed);
        let winner = null; // canonical winner name, or "draw", or null if not finished
        if (completed) {
          if (homeC.winner) winner = h;
          else if (awayC.winner) winner = a;
          else {
            const hs = Number(homeC.score), as = Number(awayC.score);
            winner = hs > as ? h : (as > hs ? a : "draw");
          }
        }
        const key = [h, a].sort().join("|");
        (eventsByKey[key] = eventsByKey[key] || []).push({
          home: h, away: a, date: formatDate_(ev.date), completed: completed, winner: winner
        });
      });
    } catch (e) { problems.push(date + " → " + e); }
    Utilities.sleep(300); // be polite
  });

  // Write results.
  let written = 0;
  rows.forEach((r, i) => {
    const id = String(r[0]);
    const date = formatDate_(r[1]);
    const label = String(r[3]);
    const already = String(r[4]).trim();
    if (already || !date || date > today) return;

    const parts = label.split(" v ");
    if (parts.length !== 2) return;
    const ourHome = canon_(parts[0]), ourAway = canon_(parts[1]);
    const candidates = eventsByKey[[ourHome, ourAway].sort().join("|")] || [];
    // Pick the candidate whose date is closest to ours (within 2 days).
    let ev = null, best = 3;
    candidates.forEach(c => { const d = Math.abs(dayDiff_(c.date, date)); if (d <= 2 && d < best) { best = d; ev = c; } });
    if (!ev || !ev.completed) return;

    const result = ev.winner === "draw" ? "draw" : (ev.winner === ourHome ? "home" : "away");

    // Knockout rows have no draw — leave penalty results for manual entry.
    const isKnockout = /^k/.test(id);
    if (isKnockout && result === "draw") return;

    sheet.getRange(i + 2, 5).setValue(result);
    written++;
  });

  // Also fill the knockout bracket winners (separate, team-name based).
  try { updateBracketResults(); } catch (e) { Logger.log("bracket: " + e); }

  let msg;
  if (written) msg = written + " result(s) auto-filled ✓";
  else if (problems.length) msg = "Feed problem — " + problems[0];
  else if (fetchedEvents === 0) msg = "Reached the feed but got 0 games back (run testFeed for detail).";
  else msg = "Checked " + fetchedEvents + " feed games — none of the still-blank matches are finished yet.";
  Logger.log(msg + (problems.length ? " | issues: " + problems.join("; ") : ""));
  ss.toast(msg);
}

// ----- Knockout bracket results --------------------------------------------
// Writes the WINNING TEAM NAME into each bracket node's Result cell, matched
// positionally (round + chronological order) to ESPN — the same order the app's
// bracket uses. Fills only empty cells. Needs setupBracket() to have run.
const BRACKET_ROUNDS = [
  { from: "2026-06-28", to: "2026-07-04", nodes: ["b32_01","b32_02","b32_03","b32_04","b32_05","b32_06","b32_07","b32_08","b32_09","b32_10","b32_11","b32_12","b32_13","b32_14","b32_15","b32_16"] },
  { from: "2026-07-04", to: "2026-07-08", nodes: ["b16_1","b16_2","b16_3","b16_4","b16_5","b16_6","b16_7","b16_8"] },
  { from: "2026-07-09", to: "2026-07-13", nodes: ["bqf_1","bqf_2","bqf_3","bqf_4"] },
  { from: "2026-07-14", to: "2026-07-16", nodes: ["bsf_1","bsf_2"] },
  { from: "2026-07-19", to: "2026-07-20", nodes: ["bfinal"] }  // final only (skips 3rd-place on the 18th)
];

const OUR_TEAMS = [
  "Mexico","South Africa","South Korea","Czechia","Canada","Bosnia and Herzegovina","Qatar","Switzerland",
  "Brazil","Morocco","Haiti","Scotland","United States","Paraguay","Australia","Türkiye","Germany","Curaçao",
  "Ivory Coast","Ecuador","Netherlands","Japan","Sweden","Tunisia","Belgium","Egypt","Iran","New Zealand",
  "Spain","Cape Verde","Saudi Arabia","Uruguay","France","Senegal","Iraq","Norway","Argentina","Algeria",
  "Austria","Jordan","Portugal","DR Congo","Uzbekistan","Colombia","England","Croatia","Ghana","Panama"
];
function ourName_(espn) {
  const c = canon_(espn);
  for (let i = 0; i < OUR_TEAMS.length; i++) if (canon_(OUR_TEAMS[i]) === c) return OUR_TEAMS[i];
  return espn;
}

function updateBracketResults() {
  const res = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RES);
  if (!res || res.getLastRow() < 2) return;
  const ids = res.getRange(2, 1, res.getLastRow() - 1, 1).getValues().map(r => String(r[0]));
  const cur = res.getRange(2, 5, res.getLastRow() - 1, 1).getValues().map(r => String(r[0]).trim());
  const rowOf = {}; ids.forEach((id, i) => rowOf[id] = i + 2);
  const today = new Date().toISOString().slice(0, 10);

  BRACKET_ROUNDS.forEach(rd => {
    const anyEmpty = rd.nodes.some(id => rowOf[id] && !cur[rowOf[id] - 2]);
    if (!anyEmpty || rd.from > today) return;
    const evs = {};
    let d = rd.from;
    while (d <= rd.to) {
      try {
        const resp = UrlFetchApp.fetch(ESPN + d.replace(/-/g, ""), {
          muteHttpExceptions: true, followRedirects: true,
          headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
        });
        if (resp.getResponseCode() === 200) (JSON.parse(resp.getContentText() || "{}").events || []).forEach(ev => evs[ev.id] = ev);
      } catch (e) { /* retry next run */ }
      d = shiftDate_(d, 1);
      Utilities.sleep(250);
    }
    const list = Object.keys(evs).map(k => evs[k]).sort((a, b) => a.date < b.date ? -1 : 1);
    for (let i = 0; i < rd.nodes.length && i < list.length; i++) {
      const row = rowOf[rd.nodes[i]];
      if (!row || cur[row - 2]) continue;
      const w = winnerName_(list[i]);
      if (w) { res.getRange(row, 5).setValue(w); cur[row - 2] = w; }
    }
  });
}

function winnerName_(ev) {
  if (!(ev.status && ev.status.type && ev.status.type.completed)) return null;
  const cs = (ev.competitions && ev.competitions[0] && ev.competitions[0].competitors) || [];
  const h = cs.filter(c => c.homeAway === "home")[0], a = cs.filter(c => c.homeAway === "away")[0];
  if (!h || !a) return null;
  let win = null;
  if (h.winner) win = h; else if (a.winner) win = a;
  else { const hs = Number(h.score), as = Number(a.score); if (hs > as) win = h; else if (as > hs) win = a; else return null; }
  return ourName_(win.team.displayName);
}

// Quick diagnostic — run this and read the popup to see if the feed is reachable.
function testFeed() {
  let msg;
  try {
    const resp = UrlFetchApp.fetch(ESPN + "20260611", {
      muteHttpExceptions: true, followRedirects: true,
      headers: { "User-Agent": "Mozilla/5.0", "Accept": "application/json" }
    });
    const code = resp.getResponseCode();
    const data = JSON.parse(resp.getContentText() || "{}");
    const evs = data.events || [];
    let sample = "";
    if (evs[0]) {
      const cs = evs[0].competitions[0].competitors;
      sample = cs.map(c => c.team.displayName + " " + c.score).join(" v ");
    }
    msg = "HTTP " + code + " | games returned: " + evs.length + (sample ? " | e.g. " + sample : "");
  } catch (e) { msg = "Error: " + e; }
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) { SpreadsheetApp.getActive().toast(msg); }
}

function formatDate_(v) {
  if (v instanceof Date) return Utilities.formatDate(v, Session.getScriptTimeZone(), "yyyy-MM-dd");
  return String(v).trim().slice(0, 10);
}

function shiftDate_(dateStr, days) {
  const d = new Date(dateStr + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function dayDiff_(a, b) {
  return Math.round((new Date(a + "T12:00:00Z") - new Date(b + "T12:00:00Z")) / 86400000);
}

// --- automation on/off -------------------------------------------------
function installAutoUpdate() {
  removeAutoUpdate();
  ScriptApp.newTrigger("updateResults").timeBased().everyMinutes(30).create();
  SpreadsheetApp.getActive().toast("Auto-update on — runs every 30 min ✓");
}

function removeAutoUpdate() {
  ScriptApp.getProjectTriggers().forEach(t => {
    if (t.getHandlerFunction() === "updateResults") ScriptApp.deleteTrigger(t);
  });
}
