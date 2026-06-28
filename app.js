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

// How many days before a match everyone's guesses become visible.
//   0 = on match day · 1 = the day before · 2 = two days before
const REVEAL_DAYS_BEFORE = 1;

// The moment a match's guesses become visible (local midnight, N days before).
function revealTime(match) {
  const d = new Date(match.date + "T00:00:00");
  d.setDate(d.getDate() - REVEAL_DAYS_BEFORE);
  return d;
}

// Are this match's guesses visible yet? (purely time-based, independent of the
// global edit-lock — so freezing editing never exposes future matches' picks)
function isRevealed(match) {
  return new Date() >= revealTime(match);
}

// Can this pick still be EDITED? Frozen globally, or once the reveal time passes
// (so a guess is never visible while its owner can still change it).
function isLocked(match) {
  return LOCK_ALL_PICKS || isRevealed(match);
}

// All match times are shown in this timezone, regardless of the viewer's device.
const TZ = "Europe/Amsterdam";

function koDate(match) {
  return new Date(match.kickoff || (match.date + "T12:00:00Z"));
}
function fmtDay(match) {
  return koDate(match).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: TZ });
}
function fmtTime(match) {
  return koDate(match).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: TZ });
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
  const meta = (m.ko ? m.round : "Group " + m.group) + (m.kickoff ? " · " + fmtTime(m) : "");
  top.appendChild(el("span", "grp", meta));
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

  // Reveal everyone's picks + the result once the match's reveal time passes.
  if (isRevealed(m)) {
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
  activeMatches()
    .filter(m => filter === "all" || m.group === filter)
    .slice()
    .sort((a, b) => (a.kickoff || a.date).localeCompare(b.kickoff || b.date))
    .forEach(m => {
    const header = m.ko ? m.round : fmtDay(m);
    if (header !== lastHeader) {
      list.appendChild(el("div", "day-head", header));
      lastHeader = header;
    }
    list.appendChild(makeMatchCard(m));
  });
  if (filter === "all") {
    const msg = (typeof BRACKET_ENABLED !== "undefined" && BRACKET_ENABLED)
      ? "🏆 Group stage done — head to the <b>Bracket</b> tab to predict the knockouts!"
      : "🏆 Knockout predictions unlock once the group stage finishes.";
    list.appendChild(el("div", "hint", msg));
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
  const ensure = n => (players[n] = players[n] || { name: n, group: 0, bracket: 0, pts: 0 });
  allPredictions.forEach(p => ensure(p.name));
  if (me) ensure(me);

  // Group stage — 1 pt per correct outcome (m.. results are home/draw/away).
  allPredictions.forEach(p => {
    if (/^m/.test(p.matchId) && results[p.matchId] && p.pick === results[p.matchId]) players[p.name].group++;
  });

  // Bracket — weighted round-set scoring: points for each team you correctly
  // sent through a round, regardless of the matchup you projected.
  const actual = actualWinnersByRound();
  const predBy = {}; // name -> round -> Set(teams)
  allPredictions.forEach(p => {
    const node = bracketNodeById[p.matchId];
    if (!node) return;
    predBy[p.name] = predBy[p.name] || {};
    (predBy[p.name][node.round] = predBy[p.name][node.round] || new Set()).add(p.pick);
  });
  Object.keys(players).forEach(name => {
    const pr = predBy[name] || {};
    ROUND_ORDER.forEach(r => {
      if (!pr[r]) return;
      let correct = 0; pr[r].forEach(t => { if (actual[r].has(t)) correct++; });
      players[name].bracket += correct * ROUND_POINTS[r];
    });
  });

  Object.values(players).forEach(p => { p.pts = p.group + p.bracket; });
  const rows = Object.values(players).sort((a, b) => b.pts - a.pts || a.name.localeCompare(b.name));

  box.innerHTML = "";
  if (!rows.length) {
    box.appendChild(el("div", "empty", "No picks yet — head to <b>Groups</b> or <b>Bracket</b>! ⚽"));
  } else {
    const lb = el("div", "lb");
    rows.forEach((r, i) => {
      const top = i === 0 && r.pts > 0;
      const row = el("div", "lb-row" + (r.name === me ? " me" : "") + (top ? " top" : ""));
      row.appendChild(el("div", "rank", top ? "🏅" : "#" + (i + 1)));
      row.appendChild(el("div", "pname", r.name + (r.name === me ? " (you)" : "")));
      row.appendChild(el("div", "pts", `${r.pts} <small>pts</small><small class="brk">G ${r.group} · B ${r.bracket}</small>`));
      lb.appendChild(row);
    });
    box.appendChild(lb);
  }
  $("#resultsNote").innerHTML = "<b>G</b> = group (1 pt/correct) · <b>B</b> = bracket (R32 2 · R16 3 · QF 4 · SF 5 · Final 6, per team that actually advances).";
}

// ===== KNOCKOUT BRACKET ==================================================
const ROUND_LABELS = { r32: "Round of 32", r16: "Round of 16", qf: "Quarter-finals", sf: "Semi-finals", final: "Final" };
const ROUND_ORDER = ["r32", "r16", "qf", "sf", "final"];

// Flatten every bracket node in round order.
const BRACKET_NODES = [];
if (typeof BRACKET_R32 !== "undefined") {
  BRACKET_R32.forEach(n => BRACKET_NODES.push({ id: n.id, round: "r32", home: n.home, away: n.away, kickoff: n.kickoff, date: n.date }));
  ["r16", "qf", "sf", "final"].forEach(r => (BRACKET_TREE[r] || []).forEach(n => BRACKET_NODES.push({ id: n.id, round: r, from: n.from })));
}
const bracketNodeById = Object.fromEntries(BRACKET_NODES.map(n => [n.id, n]));
const nodesByRound = r => BRACKET_NODES.filter(n => n.round === r);

function bracketLocked() { return new Date() >= new Date(BRACKET_DEADLINE); }

// The two candidate teams for a node, given a set of bracket picks.
function nodeTeams(node, picks) {
  if (node.round === "r32") return [node.home, node.away];
  return node.from.map(f => picks[f] || null);
}

// After an upstream change, drop any downstream pick that's no longer reachable.
function reconcileBracket(picks) {
  ["r16", "qf", "sf", "final"].forEach(r => {
    nodesByRound(r).forEach(n => {
      if (picks[n.id] && nodeTeams(n, picks).indexOf(picks[n.id]) === -1) delete picks[n.id];
    });
  });
}

// Teams that ACTUALLY advanced out of each round (results[nodeId] = winner name).
function actualWinnersByRound() {
  const out = {};
  ROUND_ORDER.forEach(r => {
    out[r] = new Set();
    nodesByRound(r).forEach(n => { if (results[n.id]) out[r].add(results[n.id]); });
  });
  return out;
}

const shortNode = id =>
  id.indexOf("b32_") === 0 ? "R32·" + (+id.slice(4)) :
  id.indexOf("b16_") === 0 ? "R16·" + id.slice(4) :
  id.indexOf("bqf_") === 0 ? "QF·" + id.slice(4) :
  id.indexOf("bsf_") === 0 ? "SF·" + id.slice(4) : "Final";

function fmtDeadline() {
  return new Date(BRACKET_DEADLINE).toLocaleString("en-GB",
    { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: TZ });
}

let bracketView = null; // which player's bracket we're viewing (null = me)

// Everyone who has at least one bracket pick (you first, then alphabetical).
function bracketPlayers() {
  const names = new Set();
  allPredictions.forEach(p => { if (bracketNodeById[p.matchId]) names.add(p.name); });
  if (me) names.add(me);
  return [...names].sort((a, b) => (a === me ? -1 : b === me ? 1 : a.localeCompare(b)));
}

function bracketPicksOf(name) {
  if (name === me) return myPicks;
  const p = {};
  allPredictions.forEach(x => { if (x.name === name && bracketNodeById[x.matchId]) p[x.matchId] = x.pick; });
  return p;
}

function renderBracket() {
  const box = $("#bracket");
  if (typeof BRACKET_ENABLED === "undefined" || !BRACKET_ENABLED) {
    box.innerHTML = '<div class="empty">🏆 The knockout bracket opens after the group stage.</div>';
    return;
  }
  const locked = bracketLocked();
  if (!locked) bracketView = null;          // others stay hidden until lock
  const viewing = bracketView || me;
  const isMine = viewing === me;
  const editable = isMine && !locked;

  if (isMine) reconcileBracket(myPicks);
  const picks = bracketPicksOf(viewing);
  box.innerHTML = "";

  // Header
  const head = el("div", "bracket-head");
  if (editable) {
    const done = BRACKET_NODES.filter(n => myPicks[n.id]).length;
    head.innerHTML = `Tap a team to send them through. <b>${done}/${BRACKET_NODES.length}</b> picked · locks <b>${fmtDeadline()}</b>`;
  } else if (!locked) {
    head.innerHTML = `🔒 Read-only. Everyone's brackets reveal when picks lock (<b>${fmtDeadline()}</b>).`;
  } else {
    head.innerHTML = `🔒 Picks are final — browse anyone's bracket below.`;
  }
  box.appendChild(head);

  // Player switcher — only after lock, so nobody can copy beforehand.
  if (locked) {
    const bar = el("div", "viewbar");
    bar.appendChild(el("span", "viewbar-label", "Viewing"));
    const sel = el("select", "viewsel");
    bracketPlayers().forEach(name => {
      const o = document.createElement("option");
      o.value = name; o.textContent = name === me ? name + " (you)" : name;
      if (name === viewing) o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => { bracketView = sel.value; renderBracket(); });
    bar.appendChild(sel);
    box.appendChild(bar);
  }

  const actual = actualWinnersByRound();
  ROUND_ORDER.forEach(r => {
    const sec = el("div", "kround");
    const pts = ROUND_POINTS[r];
    sec.appendChild(el("div", "kround-head", `${ROUND_LABELS[r]} · ${pts} pt${pts > 1 ? "s" : ""} each`));
    nodesByRound(r).forEach(n => sec.appendChild(makeBracketNode(n, picks, editable, actual)));
    box.appendChild(sec);
  });

  const champ = picks["bfinal"];
  const who = isMine ? "Your" : viewing + "’s";
  const banner = el("div", "champ");
  banner.innerHTML = champ
    ? `🏆 ${who} champion: <span class="flag">${FLAGS[champ] || "🏳️"}</span> <b>${champ}</b>`
    : `🏆 ${who} champion: <i>not picked</i>`;
  box.appendChild(banner);
}

function makeBracketNode(n, picks, editable, actual) {
  const card = el("div", "knode" + (editable ? "" : " locked"));
  if (n.round === "r32" && n.kickoff) card.appendChild(el("div", "knode-meta", fmtDay(n) + " · " + fmtTime(n)));
  const teams = nodeTeams(n, picks);
  const pick = picks[n.id];
  const wrap = el("div", "knode-teams");
  teams.forEach((team, i) => {
    const btn = el("button", "kteam");
    if (!team) {
      btn.classList.add("tbd");
      const fid = n.from && n.from[i];
      btn.innerHTML = `<span class="name">Winner of ${fid ? shortNode(fid) : "TBD"}</span>`;
      btn.disabled = true;
    } else {
      btn.innerHTML = `<span class="flag">${FLAGS[team] || "🏳️"}</span><span class="name">${team}</span>`;
      if (pick === team) {
        btn.classList.add("sel");
        if (actual[n.round] && actual[n.round].size) btn.classList.add(actual[n.round].has(team) ? "good" : "bad");
      }
      if (editable) btn.addEventListener("click", () => chooseBracket(n.id, team));
      else btn.disabled = true;
    }
    wrap.appendChild(btn);
  });
  card.appendChild(wrap);
  return card;
}

function chooseBracket(nodeId, team) {
  if (myPicks[nodeId] === team) return;
  myPicks[nodeId] = team;
  reconcileBracket(myPicks);
  localStorage.setItem("wc_picks", JSON.stringify(myPicks));
  // mirror my bracket into allPredictions for the leaderboard
  allPredictions = allPredictions.filter(p => !(p.name === me && /^b/.test(p.matchId)));
  BRACKET_NODES.forEach(n => { if (myPicks[n.id]) allPredictions.push({ name: me, matchId: n.id, pick: myPicks[n.id] }); });
  renderBracket();
  scheduleBracketSave();
}

let _bracketSaveT;
function scheduleBracketSave() {
  clearTimeout(_bracketSaveT);
  _bracketSaveT = setTimeout(saveBracketRemote, 700);
}
async function saveBracketRemote() {
  const picks = {};
  BRACKET_NODES.forEach(n => { if (myPicks[n.id]) picks[n.id] = myPicks[n.id]; });
  if (!WEB_APP_URL) { toast("Saved on this phone"); return; }
  try {
    await fetch(WEB_APP_URL, { method: "POST", body: JSON.stringify({ action: "saveBracket", name: me, picks }) });
    toast("Bracket saved ✓");
  } catch (e) { toast("Saved on this phone (will sync)"); }
}

// --- tabs ---
function switchTab(name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.toggle("active", t.dataset.tab === name));
  $("#tab-picks").classList.toggle("hidden", name !== "picks");
  $("#tab-bracket").classList.toggle("hidden", name !== "bracket");
  $("#tab-board").classList.toggle("hidden", name !== "board");
  if (name === "board") renderLeaderboard();
  if (name === "picks") renderMatches();
  if (name === "bracket") renderBracket();
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
