/* ============================================================
   Add "Claude 🤖" as a player in the pool.

   HOW TO USE (one time):
   1. Open your pool's Apps Script editor (Extensions → Apps Script).
   2. Click the + next to "Files" → Script, name it "addClaude",
      and paste THIS whole file in. (Or paste it under your existing code.)
   3. Run `setup` first if you haven't already (creates the sheets).
   4. Choose `addClaude` in the function dropdown → Run.
      → 72 group-stage picks are written to the Predictions tab.
   Run it again any time to refresh them (it overwrites, no duplicates).

   Want a different name? Change NAME below before running.
   ============================================================ */

function addClaude() {
  const NAME = "Claude 🤖";

  // pick = "home" (1) / "draw" (X) / "away" (2)
  const PICKS = {
    m01: "home", m02: "home", m03: "home", m04: "home", m05: "away", m06: "home",
    m07: "away", m08: "away", m09: "home", m10: "home", m11: "draw", m12: "home",
    m13: "home", m14: "home", m15: "away", m16: "home", m17: "home", m18: "away",
    m19: "home", m20: "home", m21: "home", m22: "home", m23: "home", m24: "away",
    m25: "home", m26: "home", m27: "home", m28: "home", m29: "home", m30: "away",
    m31: "home", m32: "home", m33: "home", m34: "home", m35: "home", m36: "away",
    m37: "home", m38: "home", m39: "home", m40: "away", m41: "home", m42: "home",
    m43: "home", m44: "away", m45: "home", m46: "home", m47: "away", m48: "home",
    m49: "home", m50: "home", m51: "away", m52: "home", m53: "away", m54: "away",
    m55: "away", m56: "away", m57: "home", m58: "away", m59: "draw", m60: "home",
    m61: "draw", m62: "home", m63: "draw", m64: "away", m65: "draw", m66: "away",
    m67: "away", m68: "home", m69: "draw", m70: "home", m71: "draw", m72: "away"
  };

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Predictions");
  if (!sheet) throw new Error("No 'Predictions' tab — run setup() first.");

  // Index existing rows for this player so we overwrite instead of duplicating.
  const existing = {}; // matchId -> row number
  if (sheet.getLastRow() > 1) {
    const vals = sheet.getRange(2, 2, sheet.getLastRow() - 1, 2).getValues(); // Name, MatchID
    for (let i = 0; i < vals.length; i++) {
      if (String(vals[i][0]) === NAME) existing[String(vals[i][1])] = i + 2;
    }
  }

  const now = new Date();
  const newRows = [];
  Object.keys(PICKS).forEach(mid => {
    const row = existing[mid];
    if (row) sheet.getRange(row, 1, 1, 4).setValues([[now, NAME, mid, PICKS[mid]]]);
    else newRows.push([now, NAME, mid, PICKS[mid]]);
  });
  if (newRows.length) {
    sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, 4).setValues(newRows);
  }

  SpreadsheetApp.getActive().toast(NAME + " added — " + Object.keys(PICKS).length + " picks ✓");
}
