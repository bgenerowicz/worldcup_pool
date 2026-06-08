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
      const id = String(r[0]); const out = String(r[4]).trim().toLowerCase();
      if (id && (out === "home" || out === "draw" || out === "away")) results[id] = out;
    });
  }

  return json({ predictions: predictions, results: results });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const body = JSON.parse(e.postData.contents);
    if (body.action === "savePick") {
      savePick(body.name, body.matchId, body.pick);
    } else if (body.action === "savePicks" && Array.isArray(body.picks)) {
      body.picks.forEach(p => savePick(body.name, p.matchId, p.pick));
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
function savePick(name, matchId, pick) {
  name = String(name).trim();
  matchId = String(matchId).trim();
  pick = String(pick).trim().toLowerCase();
  if (!name || !matchId || ["home", "draw", "away"].indexOf(pick) === -1) return;

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

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
