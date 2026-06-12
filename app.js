/* ============================================================
   Family World Cup Pool — frontend logic
   Backend: Google Apps Script web app (see apps-script.gs + README)
   ============================================================ */

// 👉 PASTE your Apps Script web-app URL here (ends with /exec).
// Leave it as "" to run in local-only mode (picks saved in this browser only).
const WEB_APP_URL = "https://script.google.com/macros/s/AKfycbwH7ojZfxqYPyGFwOQxi4yiR3o_E_trfFlMApRP7cGcHvqXXiIzOgMAy7WYZTIje3huEw/exec";

const OUTCOMES = [
  { key: "home", label: "1", sub: "Home win" },
  { key: "draw", label: "X", sub: "Draw" },
  { key: "away", label: "2", sub: "Away win" }
];
// Knockout matches have no draw — you pick who advances.
const KO_OUTCOMES = [
  { key: "home", label: "1", sub: "advances" },
  { key: "away", label: "2", sub: "advances" }
];
const outcomesFor = m => (m.ko ? KO_OUTCOMES : OUTCOMES);

// Matches currently live in the app: group stage always, knockout once enabled.
function activeMatches() {
  return MATCHES.concat(KNOCKOUT_ENABLED ? KNOCKOUT_MATCHES : []);
}

// --- state ---
let me = localStorage.getItem("wc_name") || "";
let myPicks = JSON.parse(localStorage.getItem("wc_picks") || "{}"); // { matchId: "home"|"draw"|"away" }
let allPredictions = [];   // [{name, matchId, pick}] from backend
let results = {};          // { matchId: "home"|"draw"|"away" }
const allMatches = MATCHES.concat(KNOCKOUT_MATCHES);
const matchById = Object.fromEntries(allMatches.map(m => [m.id, m]));

// --- helpers ---
const $ = sel => document.querySelector(sel);
const el = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };

// 🔒 Set to true to FREEZE ALL picks immediately — nobody can change anything,
// regardless of match date. Set back to false to resume normal per-day locking.
const LOCK_ALL_PICKS = true;

// Can this pick still be edited? Locked globally, or once its match day starts.
function isLocked(match) {
  return LOCK_ALL_PICKS || new Date() >= new Date(match.date + "T00:00:00");
}

function fmtDay(dateStr) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}

function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.remove("hidden", "fade");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    t.classList.add("fade");
    setTimeout(() => t.classList.add("hidden"), 300);
  }, 1600);
}

// --- backend ---
async function loadData() {
  if (!WEB_APP_URL) return; // local-only mode
  try {
    const res = await fetch(WEB_APP_URL + "?action=getData", { method: "GET" });
    const data = await res.json();
    allPredictions = data.predictions || [];
    results = data.results || {};
    // sync my own picks from server (in case I switched device)
    allPredictions.filter(p => p.name === me).forEach(p => { myPicks[p.matchId] = p.pick; });
    localStorage.setItem("wc_picks", JSON.stringify(myPicks));
  } catch (e) {
    showBanner("Couldn't reach the scoreboard — your picks are saved on this phone and will sync when you're back online.", true);
  }
}

async function savePickRemote(matchId, pick) {
  if (!WEB_APP_URL) return true;
  try {
    await fetch(WEB_APP_URL, {
      method: "POST",
      body: JSON.stringify({ action: "savePick", name: me, matchId, pick })
    });
    return true;
  } catch (e) {
    return false;
  }
}

// --- rendering ---
function showBanner(msg, warn) {
  const b = $("#banner");
  b.textContent = msg;
  b.className = "banner" + (warn ? " warn" : "");
  b.classList.remove("hidden");
}

function renderProgress() {
  const list = activeMatches();
  const done = list.filter(m => myPicks[m.id]).length;
  $("#progress").textContent = `${done} / ${list.length} picked`;
}

function makeMatchCard(m) {
  const card = el("div", "match");
  const locked = isLocked(m);
  if (locked) card.classList.add("locked");

  const top = el("div", "match-top");
  top.appendChild(el("span", "grp", m.ko ? m.round : "Group " + m.group));
  top.appendChild(el("span", "lock" + (locked ? " locked" : ""), locked ? "🔒 Locked" : "Open"));
  card.appendChild(top);

  const row = el("div", "row");
  const home = el("div", "team", `<span class="flag">${FLAGS[m.home] || "🏳️"}</span><span class="name">${m.home}</span>`);
  const away = el("div", "team", `<span class="flag">${FLAGS[m.away] || "🏳️"}</span><span class="name">${m.away}</span>`);
  const opts = el("div", "opts");

  const actual = results[m.id];
  outcomesFor(m).forEach(o => {
    const b = el("button", "opt", `${o.label}<small>${o.sub}</small>`);
    b.dataset.key = o.key;
    if (myPicks[m.id] === o.key) b.classList.add("sel");
    if (actual) {
      if (o.key === actual) b.classList.add("actual");
      if (o.key === actual && myPicks[m.id] === actual) b.classList.add("correct");
    }
    if (locked) {
      b.disabled = true;
    } else {
      b.addEventListener("click", () => choose(m.id, o.key, card));
    }
    opts.appendChild(b);
  });

  row.appendChild(home);
  row.appendChild(opts);
  row.appendChild(away);
  card.appendChild(row);

  // Reveal everyone's picks + the result once the match is locked.
  if (locked) {
    const reveal = el("div", "reveal");
    if (actual) {
      const aLabel = actual === "home" ? m.home + " win" : actual === "away" ? m.away + " win" : "Draw";
      reveal.appendChild(el("span", null, `Result: <b>${aLabel}</b>`));
    }
    const picks = allPredictions.filter(p => p.matchId === m.id);
    picks.forEach(p => {
      const lbl = p.pick === "home" ? "1" : p.pick === "draw" ? "X" : "2";
      let cls = "pickchip";
      if (actual) cls += p.pick === actual ? " ok" : " no";
      reveal.appendChild(el("span", cls, `${p.name}: ${lbl}`));
    });
    if (reveal.childNodes.length) card.appendChild(reveal);
  }

  return card;
}

function renderMatches() {
  const filter = $("#groupFilter").value;
  const list = $("#matchList");
  list.innerHTML = "";
  let lastHeader = null;
  // Knockout matches have no group letter, so a group filter hides them.
  activeMatches().filter(m => filter === "all" || m.group === filter).forEach(m => {
    const header = m.ko ? m.round : fmtDay(m.date);
    if (header !== lastHeader) {
      list.appendChild(el("div", "day-head", header));
      lastHeader = header;
    }
    list.appendChild(makeMatchCard(m));
  });
  if (!KNOCKOUT_ENABLED && (filter === "all")) {
    list.appendChild(el("div", "hint", "🏆 Knockout-round predictions unlock once the group stage finishes."));
  }
  renderProgress();
}

async function choose(matchId, pick, card) {
  myPicks[matchId] = pick;
  localStorage.setItem("wc_picks", JSON.stringify(myPicks));
  // optimistic UI
  card.querySelectorAll(".opt").forEach(b => {
    b.classList.toggle("sel", b.dataset.key === pick);
  });
  renderProgress();
  const ok = await savePickRemote(matchId, pick);
  toast(ok ? "Saved ✓" : "Saved on this phone (will sync)");
  // keep local mirror of predictions for leaderboard
  const existing = allPredictions.find(p => p.name === me && p.matchId === matchId);
  if (existing) existing.pick = pick;
  else allPredictions.push({ name: me, matchId, pick });
}

function renderLeaderboard() {
  const box = $("#leaderboard");
  const players = {};
  allPredictions.forEach(p => { players[p.name] = players[p.name] || { name: p.name, pts: 0, scored: 0 }; });
  // also make sure I appear even with no scored games yet
  if (me) players[me] = players[me] || { name: me, pts: 0, scored: 0 };

  let resultedCount = 0;
  Object.keys(results).forEach(mid => { if (results[mid]) resultedCount++; });

  allPredictions.forEach(p => {
    if (results[p.matchId]) {
      players[p.name].scored++;
      if (p.pick === results[p.matchId]) players[p.name].pts++;
    }
  });

  const rows = Object.values(players).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));
  box.innerHTML = "";
  if (!rows.length) {
    box.appendChild(el("div", "empty", "No picks yet. Be the first — head to <b>My Picks</b>! ⚽"));
  } else {
    const lb = el("div", "lb");
    rows.forEach((r, i) => {
      const row = el("div", "lb-row" + (r.name === me ? " me" : "") + (i === 0 && r.pts > 0 ? " top" : ""));
      row.appendChild(el("div", "rank", i === 0 && r.pts > 0 ? "🏅" : "#" + (i + 1)));
      row.appendChild(el("div", "pname", r.name + (r.name === me ? " (you)" : "")));
      row.appendChild(el("div", "pts", `${r.pts} <small>pt${r.pts === 1 ? "" : "s"}</small>`));
      lb.appendChild(row);
    });
    box.appendChild(lb);
  }
  $("#resultsNote").textContent = resultedCount
    ? `${resultedCount} match${resultedCount === 1 ? "" : "es"} scored so far · 1 point per correct outcome.`
    : "Scores appear here as matches finish and results are entered. 1 point per correct outcome.";
}

// --- tabs ---
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $("#tab-picks").classList.toggle("hidden", name !== "picks");
  $("#tab-board").classList.toggle("hidden", name !== "board");
  if (name === "board") renderLeaderboard();
  if (name === "picks") renderMatches();
}

// --- init ---
function populateGroupFilter() {
  const groups = [...new Set(MATCHES.map(m => m.group))];
  const sel = $("#groupFilter");
  groups.forEach(g => {
    const o = document.createElement("option");
    o.value = g; o.textContent = "Group " + g;
    sel.appendChild(o);
  });
}

function logout() {
  if (!confirm("Log out / switch player? Your picks are safely saved on the scoreboard.")) return;
  localStorage.removeItem("wc_name");
  localStorage.removeItem("wc_picks");
  me = "";
  myPicks = {};
  allPredictions = [];
  results = {};
  $("#app").classList.add("hidden");
  $("#logout").classList.add("hidden");
  $("#who").textContent = "";
  $("#nameInput").value = "";
  $("#nameScreen").classList.remove("hidden");
  $("#nameInput").focus();
}

function startApp() {
  $("#nameScreen").classList.add("hidden");
  $("#app").classList.remove("hidden");
  $("#who").textContent = "👤 " + me;
  $("#logout").classList.remove("hidden");
  if (!WEB_APP_URL) {
    showBanner("Demo mode: no scoreboard connected yet. Picks are saved on this phone only. (Add your Google Sheet link in app.js to share scores.)");
  }
  renderMatches();
}

async function init() {
  populateGroupFilter();
  document.querySelectorAll(".tab").forEach(t => t.addEventListener("click", () => switchTab(t.dataset.tab)));
  $("#groupFilter").addEventListener("change", renderMatches);

  $("#nameSave").addEventListener("click", () => {
    const v = $("#nameInput").value.trim();
    if (!v) { $("#nameInput").focus(); return; }
    me = v;
    localStorage.setItem("wc_name", me);
    startApp();
    loadData().then(() => { renderMatches(); });
  });
  $("#nameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("#nameSave").click(); });
  $("#logout").addEventListener("click", logout);

  if (me) {
    startApp();
    await loadData();
    renderMatches();
  } else {
    $("#nameScreen").classList.remove("hidden");
  }
}

document.addEventListener("DOMContentLoaded", init);
