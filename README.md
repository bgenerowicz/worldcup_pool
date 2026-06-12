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

The **full knockout bracket is already built** into `matches.js` (Round of 32 →
Final, with the real 2026 pairings and dates) — but it stays **hidden** until
you switch it on, so the group stage stays the focus. Knockout matches have no
draw: players pick **1 (home advances) / 2 (away advances)**.

When the group stage ends (**28 June**) and you know who qualified:

1. **Edit the team names** in the `KNOCKOUT_MATCHES` array in
   [`matches.js`](matches.js). Replace placeholders like `"Winner A"` /
   `"3rd A/B/C/D/F"` with the real countries (e.g. `"Argentina"`). Using exact
   country names makes the flags show up. You can do this round-by-round as
   teams become known.
2. **Flip the switch:** in `matches.js`, set `const KNOCKOUT_ENABLED = true;`
3. **Re-upload `matches.js`** to GitHub — the knockout rounds now appear for
   everyone to predict.
4. **In the sheet:** open Apps Script and run the **`addKnockout`** function
   once. It adds all knockout matches to the Results tab (with a home/away
   dropdown) so you can score them just like the group games.

---

### Automatic results (optional)

Don't want to type results in by hand? [`auto-results.gs`](auto-results.gs) pulls
finished scores from **ESPN's public scoreboard** (**no signup, no API key**) and
fills the Result column for you.

1. Paste `auto-results.gs` into your Apps Script project (new file).
2. Run **`updateResults`** once and authorise it.
3. Run **`installAutoUpdate`** once — it then runs every 30 minutes by itself.
   (Run `removeAutoUpdate` to turn it off.)

It only fills **empty** Result cells, so anything you set by hand always wins —
auto + manual mix happily. It matches games to your fixtures by team name (with
spelling/accents normalised) and tolerates the ±1-day timezone drift in the
feed. Results usually land within minutes of full-time. Knockout games decided
on penalties use ESPN's "advancing team" flag, but it's worth a glance at those.

## Files

| File | What it is |
|------|-----------|
| `index.html` | The page structure |
| `styles.css` | Mobile-first styling |
| `app.js` | App logic + the `WEB_APP_URL` you paste in |
| `matches.js` | All 72 group fixtures (+ knockout slot) |
| `apps-script.gs` | Paste into Google Apps Script (the backend) |
| `auto-results.gs` | Optional — auto-fills results from a free feed |
| `add-claude.gs` | Optional — adds "Claude 🤖" as a player |

## Notes & tweaks

- **Scoring** is flat 1 point per correct outcome, all matches equal. To weight
  later rounds, change the scoring loop in `renderLeaderboard()` in `app.js`.
- **Lock time** is local midnight at the start of a match's date. Change
  `isLocked()` in `app.js` if you want kickoff-time locking.
- **Fixtures** are from the official draw / ESPN schedule. If FIFA shifts a
  date, just edit `matches.js`.
- **Cheating:** other people's picks for a match are hidden until it locks.
