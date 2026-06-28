/* ============================================================
   Family World Cup Pool — Google Apps Script backend
   ------------------------------------------------------------
   This turns a Google Sheet into a tiny free database/API.

   ONE-TIME SETUP (see README.md for screenshots-level detail):
   1. Create a new Google Sheet.
   2. Extensions → Apps Script. Delete any code, paste THIS file.
   3. Run the `setup` function once (authorize when asked).
      → creates the "Predictions" and "Results" tabs and fills
        "Results" with all 72 matches ready for you to score.
   4. Deploy → New deployment → type "Web app".
        - Execute as: Me
        - Who has access: Anyone
      Copy the /exec URL and paste it into app.js (WEB_APP_URL).

   ENTERING RESULTS during the tournament:
   - Open the "Results" tab. For each finished match, put the
     outcome in the "Result" column: home / draw / away.
     (Dropdown is provided.) Scores update automatically.
   ============================================================ */

const SHEET_PRED = "Predictions";
const SHEET_RES = "Results";

// 🔒 Optional server-side lock. Left off — the front-end LOCK_ALL_PICKS flag
// handles the freeze. Set to true only if you ever want an airtight backend lock.
const POOL_LOCKED = false;

// Mirror of the group-stage fixtures (used by setup() to fill the Results tab).
const MATCHES = [
  ["m01","A","2026-06-11","Mexico","South Africa"],
  ["m02","A","2026-06-11","South Korea","Czechia"],
  ["m03","B","2026-06-12","Canada","Bosnia and Herzegovina"],
  ["m04","D","2026-06-12","United States","Paraguay"],
  ["m05","B","2026-06-13","Qatar","Switzerland"],
  ["m06","C","2026-06-13","Brazil","Morocco"],
  ["m07","C","2026-06-13","Haiti","Scotland"],
  ["m08","D","2026-06-13","Australia","Türkiye"],
  ["m09","E","2026-06-14","Germany","Curaçao"],
  ["m10","F","2026-06-14","Netherlands","Japan"],
  ["m11","E","2026-06-14","Ivory Coast","Ecuador"],
  ["m12","F","2026-06-14","Sweden","Tunisia"],
  ["m13","H","2026-06-15","Spain","Cape Verde"],
  ["m14","G","2026-06-15","Belgium","Egypt"],
  ["m15","H","2026-06-15","Saudi Arabia","Uruguay"],
  ["m16","G","2026-06-15","Iran","New Zealand"],
  ["m17","I","2026-06-16","France","Senegal"],
  ["m18","I","2026-06-16","Iraq","Norway"],
  ["m19","J","2026-06-16","Argentina","Algeria"],
  ["m20","J","2026-06-16","Austria","Jordan"],
  ["m21","K","2026-06-17","Portugal","DR Congo"],
  ["m22","L","2026-06-17","England","Croatia"],
  ["m23","L","2026-06-17","Ghana","Panama"],
  ["m24","K","2026-06-17","Uzbekistan","Colombia"],
  ["m25","A","2026-06-18","Czechia","South Africa"],
  ["m26","B","2026-06-18","Switzerland","Bosnia and Herzegovina"],
  ["m27","B","2026-06-18","Canada","Qatar"],
  ["m28","A","2026-06-18","Mexico","South Korea"],
  ["m29","D","2026-06-19","United States","Australia"],
  ["m30","C","2026-06-19","Scotland","Morocco"],
  ["m31","C","2026-06-19","Brazil","Haiti"],
  ["m32","D","2026-06-19","Türkiye","Paraguay"],
  ["m33","F","2026-06-20","Netherlands","Sweden"],
  ["m34","E","2026-06-20","Germany","Ivory Coast"],
  ["m35","E","2026-06-20","Ecuador","Curaçao"],
  ["m36","F","2026-06-20","Tunisia","Japan"],
  ["m37","H","2026-06-21","Spain","Saudi Arabia"],
  ["m38","G","2026-06-21","Belgium","Iran"],
  ["m39","H","2026-06-21","Uruguay","Cape Verde"],
  ["m40","G","2026-06-21","New Zealand","Egypt"],
  ["m41","J","2026-06-22","Argentina","Austria"],
  ["m42","I","2026-06-22","France","Iraq"],
  ["m43","I","2026-06-22","Norway","Senegal"],
  ["m44","J","2026-06-22","Jordan","Algeria"],
  ["m45","K","2026-06-23","Portugal","Uzbekistan"],
  ["m46","L","2026-06-23","England","Ghana"],
  ["m47","L","2026-06-23","Panama","Croatia"],
  ["m48","K","2026-06-23","Colombia","DR Congo"],
  ["m49","B","2026-06-24","Switzerland","Canada"],
  ["m50","B","2026-06-24","Bosnia and Herzegovina","Qatar"],
  ["m51","C","2026-06-24","Scotland","Brazil"],
  ["m52","C","2026-06-24","Morocco","Haiti"],
  ["m53","A","2026-06-24","Czechia","Mexico"],
  ["m54","A","2026-06-24","South Africa","South Korea"],
  ["m55","E","2026-06-25","Ecuador","Germany"],
  ["m56","E","2026-06-25","Curaçao","Ivory Coast"],
  ["m57","F","2026-06-25","Japan","Sweden"],
  ["m58","F","2026-06-25","Tunisia","Netherlands"],
  ["m59","D","2026-06-25","Türkiye","United States"],
  ["m60","D","2026-06-25","Paraguay","Australia"],
  ["m61","I","2026-06-26","Norway","France"],
  ["m62","I","2026-06-26","Senegal","Iraq"],
  ["m63","H","2026-06-26","Cape Verde","Saudi Arabia"],
  ["m64","H","2026-06-26","Uruguay","Spain"],
  ["m65","G","2026-06-26","Egypt","Iran"],
  ["m66","G","2026-06-26","New Zealand","Belgium"],
  ["m67","L","2026-06-27","Panama","England"],
  ["m68","L","2026-06-27","Croatia","Ghana"],
  ["m69","K","2026-06-27","Colombia","Portugal"],
  ["m70","K","2026-06-27","DR Congo","Uzbekistan"],
  ["m71","J","2026-06-27","Algeria","Austria"],
  ["m72","J","2026-06-27","Jordan","Argentina"]
];

// Knockout matches [id, date, round, label]. Run addKnockout() AFTER the group
// stage to append these to the Results tab so you can score them.
const KNOCKOUT = [
  ["k32_01","2026-06-28","Round of 32","Runner-up A v Runner-up B"],
  ["k32_02","2026-06-29","Round of 32","Winner C v Runner-up F"],
  ["k32_03","2026-06-29","Round of 32","Winner E v 3rd A/B/C/D/F"],
  ["k32_04","2026-06-29","Round of 32","Winner F v Runner-up C"],
  ["k32_05","2026-06-30","Round of 32","Runner-up E v Runner-up I"],
  ["k32_06","2026-06-30","Round of 32","Winner I v 3rd C/D/F/G/H"],
  ["k32_07","2026-06-30","Round of 32","Winner A v 3rd C/E/F/H/I"],
  ["k32_08","2026-07-01","Round of 32","Winner L v 3rd E/H/I/J/K"],
  ["k32_09","2026-07-01","Round of 32","Winner G v 3rd A/E/H/I/J"],
  ["k32_10","2026-07-01","Round of 32","Winner D v 3rd B/E/F/I/J"],
  ["k32_11","2026-07-02","Round of 32","Winner H v Runner-up J"],
  ["k32_12","2026-07-02","Round of 32","Runner-up K v Runner-up L"],
  ["k32_13","2026-07-02","Round of 32","Winner B v 3rd E/F/G/I/J"],
  ["k32_14","2026-07-03","Round of 32","Runner-up D v Runner-up G"],
  ["k32_15","2026-07-03","Round of 32","Winner J v Runner-up H"],
  ["k32_16","2026-07-03","Round of 32","Winner K v 3rd D/E/I/J/L"],
  ["k16_1","2026-07-04","Round of 16","Winner R32-1 v Winner R32-2"],
  ["k16_2","2026-07-04","Round of 16","Winner R32-3 v Winner R32-4"],
  ["k16_3","2026-07-05","Round of 16","Winner R32-5 v Winner R32-6"],
  ["k16_4","2026-07-05","Round of 16","Winner R32-7 v Winner R32-8"],
  ["k16_5","2026-07-06","Round of 16","Winner R32-9 v Winner R32-10"],
  ["k16_6","2026-07-06","Round of 16","Winner R32-11 v Winner R32-12"],
  ["k16_7","2026-07-07","Round of 16","Winner R32-13 v Winner R32-14"],
  ["k16_8","2026-07-07","Round of 16","Winner R32-15 v Winner R32-16"],
  ["kqf_1","2026-07-09","Quarter-finals","Winner R16-1 v Winner R16-2"],
  ["kqf_2","2026-07-10","Quarter-finals","Winner R16-3 v Winner R16-4"],
  ["kqf_3","2026-07-10","Quarter-finals","Winner R16-5 v Winner R16-6"],
  ["kqf_4","2026-07-11","Quarter-finals","Winner R16-7 v Winner R16-8"],
  ["ksf_1","2026-07-14","Semi-finals","Winner QF-1 v Winner QF-2"],
  ["ksf_2","2026-07-15","Semi-finals","Winner QF-3 v Winner QF-4"],
  ["k3p","2026-07-18","Third-place Play-off","Loser SF-1 v Loser SF-2"],
  ["kfinal","2026-07-19","Final","Winner SF-1 v Winner SF-2"]
];

function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // Predictions tab
  let pred = ss.getSheetByName(SHEET_PRED);
  if (!pred) pred = ss.insertSheet(SHEET_PRED);
  pred.clear();
  pred.getRange(1, 1, 1, 4).setValues([["Timestamp", "Name", "MatchID", "Pick"]]).setFontWeight("bold");
  pred.setFrozenRows(1);

  // Results tab — pre-filled with every match
  let res = ss.getSheetByName(SHEET_RES);
  if (!res) res = ss.insertSheet(SHEET_RES);
  res.clear();
  res.getRange(1, 1, 1, 5).setValues([["MatchID", "Date", "Group", "Match", "Result"]]).setFontWeight("bold");
  const rows = MATCHES.map(m => [m[0], m[2], m[1], m[3] + " v " + m[4], ""]);
  res.getRange(2, 1, rows.length, 5).setValues(rows);
  res.setFrozenRows(1);

  // Dropdown on the Result column: home / draw / away
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["home", "draw", "away"], true)
    .setAllowInvalid(false).build();
  res.getRange(2, 5, rows.length, 1).setDataValidation(rule);
  res.autoResizeColumns(1, 5);

  SpreadsheetApp.getUi && SpreadsheetApp.getActive().toast("Setup complete ✓");
}

// Run this once after the group stage to add the knockout matches to Results.
// (Idempotent — won't add duplicates if you run it twice.)
function addKnockout() {
  const res = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_RES);
  if (!res) throw new Error("Run setup() first.");
  const existing = res.getLastRow() > 1
    ? res.getRange(2, 1, res.getLastRow() - 1, 1).getValues().map(r => String(r[0]))
    : [];
  const toAdd = KNOCKOUT.filter(k => existing.indexOf(k[0]) === -1)
    .map(k => [k[0], k[1], k[2], k[3], ""]);
  if (!toAdd.length) { SpreadsheetApp.getActive().toast("Knockout already added."); return; }
  const start = res.getLastRow() + 1;
  res.getRange(start, 1, toAdd.length, 5).setValues(toAdd);
  // Knockout has no draw — restrict those Result cells to home / away.
  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(["home", "away"], true).setAllowInvalid(false).build();
  res.getRange(start, 5, toAdd.length, 1).setDataValidation(rule);
  SpreadsheetApp.getActive().toast(toAdd.length + " knockout matches added ✓");
}

// Bracket node ids per round, in the SAME chronological order ESPN lists them.
const BRACKET_NODE_IDS = {
  r32: ["b32_01","b32_02","b32_03","b32_04","b32_05","b32_06","b32_07","b32_08",
        "b32_09","b32_10","b32_11","b32_12","b32_13","b32_14","b32_15","b32_16"],
  r16: ["b16_1","b16_2","b16_3","b16_4","b16_5","b16_6","b16_7","b16_8"],
  qf:  ["bqf_1","bqf_2","bqf_3","bqf_4"],
  sf:  ["bsf_1","bsf_2"],
  final: ["bfinal"]
};

// Adds the 31 bracket nodes to the Results tab so the winning team of each can
// be recorded (auto-results fills these, or type the team name by hand).
// Result cell = the team that advanced (e.g. "Brazil"). Run once.
function setupBracket() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const res = ss.getSheetByName(SHEET_RES);
  if (!res) throw new Error("Run setup() first.");
  const existing = res.getLastRow() > 1
    ? res.getRange(2, 1, res.getLastRow() - 1, 1).getValues().map(r => String(r[0]))
    : [];
  const labels = { r32: "Round of 32", r16: "Round of 16", qf: "Quarter-final", sf: "Semi-final", final: "Final" };
  const rows = [];
  Object.keys(BRACKET_NODE_IDS).forEach(rnd => {
    BRACKET_NODE_IDS[rnd].forEach(id => {
      if (existing.indexOf(id) === -1) rows.push([id, "", labels[rnd], labels[rnd] + " (winner)", ""]);
    });
  });
  if (!rows.length) { SpreadsheetApp.getActive().toast("Bracket nodes already present."); return; }
  res.getRange(res.getLastRow() + 1, 1, rows.length, 5).setValues(rows);
  SpreadsheetApp.getActive().toast(rows.length + " bracket nodes added ✓");
}

function doGet(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const predSheet = ss.getSheetByName(SHEET_PRED);
  const resSheet = ss.getSheetByName(SHEET_RES);

  const predictions = [];
  if (predSheet && predSheet.getLastRow() > 1) {
    const vals = predSheet.getRange(2, 1, predSheet.getLastRow() - 1, 4).getValues();
    vals.forEach(r => {
      if (r[1] && r[2]) predictions.push({ name: String(r[1]), matchId: String(r[2]), pick: String(r[3]) });
    });
  }

  const results = {};
  if (resSheet && resSheet.getLastRow() > 1) {
    const vals = resSheet.getRange(2, 1, resSheet.getLastRow() - 1, 5).getValues();
    vals.forEach(r => {
      const id = String(r[0]); const raw = String(r[4]).trim();
      if (!id || !raw) return;
      if (id.indexOf("b") === 0) {
        results[id] = raw; // bracket node → winning team name
      } else {
        const out = raw.toLowerCase();
        if (out === "home" || out === "draw" || out === "away") results[id] = out;
      }
    });
  }

  return json({ predictions: predictions, results: results });
}

function doPost(e) {
  if (POOL_LOCKED) return json({ ok: false, locked: true });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === "savePick") {
      savePick(body.name, body.matchId, body.pick);
    } else if (body.action === "savePicks" && Array.isArray(body.picks)) {
      body.picks.forEach(p => savePick(body.name, p.matchId, p.pick));
    } else if (body.action === "saveBracket") {
      saveBracket(body.name, body.picks || {});
    } else {
      return json({ ok: false, error: "unknown action" });
    }
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

// Upsert one (name, matchId) → pick.
// Group/knockout-match picks are home/draw/away; bracket-node picks (ids starting
// with "b") are team names, kept verbatim.
function savePick(name, matchId, pick) {
  name = String(name).trim();
  matchId = String(matchId).trim();
  var isBracket = matchId.indexOf("b") === 0;
  pick = isBracket ? String(pick).trim() : String(pick).trim().toLowerCase();
  if (!name || !matchId || !pick) return;
  if (!isBracket && ["home", "draw", "away"].indexOf(pick) === -1) return;

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRED);
  const last = sheet.getLastRow();
  if (last > 1) {
    const vals = sheet.getRange(2, 2, last - 1, 2).getValues(); // Name, MatchID
    for (let i = 0; i < vals.length; i++) {
      if (String(vals[i][0]) === name && String(vals[i][1]) === matchId) {
        sheet.getRange(i + 2, 1, 1, 4).setValues([[new Date(), name, matchId, pick]]);
        return;
      }
    }
  }
  sheet.appendRow([new Date(), name, matchId, pick]);
}

// Replace a player's entire bracket in one shot: clear their existing bracket
// rows (matchId starting with "b"), then write the current picks.
function saveBracket(name, picks) {
  name = String(name).trim();
  if (!name) return;
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_PRED);
  const last = sheet.getLastRow();
  if (last > 1) {
    const vals = sheet.getRange(2, 2, last - 1, 2).getValues(); // Name, MatchID
    // delete from the bottom up so row indices stay valid
    for (let i = vals.length - 1; i >= 0; i--) {
      if (String(vals[i][0]) === name && String(vals[i][1]).indexOf("b") === 0) {
        sheet.deleteRow(i + 2);
      }
    }
  }
  const now = new Date();
  const rows = [];
  Object.keys(picks).forEach(id => {
    const team = String(picks[id]).trim();
    if (id && team) rows.push([now, name, id, team]);
  });
  if (rows.length) sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, 4).setValues(rows);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
