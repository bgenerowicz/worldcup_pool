# ⚽ Family World Cup Pool 2026

A dead-simple prediction game for the family. Everyone opens the same link on
their phone, picks **1 (home win) / X (draw) / 2 (away win)** for each World Cup
2026 group-stage match, and the leaderboard tracks who's winning. **1 point per
correct outcome.** Matches lock at the start of their match day so nobody can
peek at results first.

- **Frontend:** plain HTML/CSS/JS — hosted free on **GitHub Pages**.
- **Backend:** a **Google Sheet** + a tiny Apps Script (free, no server to run).
  You (the organiser) enter results straight into the sheet.

There's nothing to install and no accounts for the family — they just type their
name once.

---

## Setup (about 15 minutes, once)

### 1. The Google Sheet backend

1. Go to <https://sheets.google.com> and create a **new blank spreadsheet**.
   Name it e.g. *World Cup Pool*.
2. Menu: **Extensions → Apps Script**. A code editor opens.
3. Delete whatever is in `Code.gs`, then copy–paste the **entire contents of
   [`apps-script.gs`](apps-script.gs)** into it. Click 💾 Save.
4. In the function dropdown at the top, choose **`setup`** and click **Run**.
   - Google asks you to authorise — approve it (it's your own script).
   - This creates two tabs: **Predictions** (fills up as people pick) and
     **Results** (pre-loaded with all 72 matches for you to score).
5. Click **Deploy → New deployment**.
   - Click the gear ⚙ → **Web app**.
   - **Execute as:** Me
   - **Who has access:** **Anyone**  ← important
   - Click **Deploy**, authorise again, and **copy the Web app URL**
     (it ends in `/exec`).

### 2. Wire the website to the sheet

Open [`app.js`](app.js) and paste your URL into the first line:

```js
const WEB_APP_URL = "https://script.google.com/macros/s/AKfy.....I/exec";
```

(If you leave it blank, the site runs in *demo mode* — picks save only on that
one phone, no shared scoreboard.)

### 3. Publish on GitHub Pages

1. Create a new GitHub repo (e.g. `worldcup-pool`) and upload these files
   (`index.html`, `app.js`, `styles.css`, `matches.js`).
2. Repo **Settings → Pages → Build and deployment → Source: Deploy from a
   branch**, branch `main`, folder `/ (root)`. Save.
3. After a minute your site is live at
   `https://<your-username>.github.io/worldcup-pool/`.
4. **Share that link** with the family. Done. 🎉

---

## Running the pool

- **Family members:** open the link, type a name (same one each time), tap a
  result for each match. Picks save automatically. They can change a pick any
  time until that match's day begins, then it locks.
- **You (results):** after each game, open the sheet's **Results** tab and set
  the **Result** column to `home`, `draw`, or `away` (there's a dropdown).
  Scores recompute the next time anyone opens the **Leaderboard** tab.

### Knockout rounds (the "fill in later" part)

Group-stage picks are live now. Knockout matchups depend on who advances, so
add them **after the group stage ends (28 June)**:

1. Edit [`matches.js`](matches.js) → fill the `KNOCKOUT_MATCHES` array using the
   same shape as the group matches, e.g.:
   ```js
   const KNOCKOUT_MATCHES = [
     { id: "r32_1", group: "R32", date: "2026-06-28", home: "Winner A", away: "Runner-up B" },
     // ...
   ];
   ```
2. Add the same rows to the **Results** tab of the sheet (MatchID + Result), or
   re-run `setup` after also adding them to the `MATCHES` list inside
   `apps-script.gs`.
3. Re-upload `matches.js` to GitHub. The new round appears for everyone.

---

## Files

| File | What it is |
|------|-----------|
| `index.html` | The page structure |
| `styles.css` | Mobile-first styling |
| `app.js` | App logic + the `WEB_APP_URL` you paste in |
| `matches.js` | All 72 group fixtures (+ knockout slot) |
| `apps-script.gs` | Paste into Google Apps Script (the backend) |

## Notes & tweaks

- **Scoring** is flat 1 point per correct outcome, all matches equal. To weight
  later rounds, change the scoring loop in `renderLeaderboard()` in `app.js`.
- **Lock time** is local midnight at the start of a match's date. Change
  `isLocked()` in `app.js` if you want kickoff-time locking.
- **Fixtures** are from the official draw / ESPN schedule. If FIFA shifts a
  date, just edit `matches.js`.
- **Cheating:** other people's picks for a match are hidden until it locks.
