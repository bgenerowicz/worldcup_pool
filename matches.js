// World Cup 2026 — group stage fixtures (all 72 matches)
// Source: official FIFA draw / ESPN schedule. Dates are local match-day dates.
// Each match: id, group, date (YYYY-MM-DD), home, away.
// Picks lock at the start (local midnight) of the match's date — see app.js LOCK logic.

const FLAGS = {
  "Mexico": "🇲🇽", "South Africa": "🇿🇦", "South Korea": "🇰🇷", "Czechia": "🇨🇿",
  "Canada": "🇨🇦", "Bosnia and Herzegovina": "🇧🇦", "Qatar": "🇶🇦", "Switzerland": "🇨🇭",
  "Brazil": "🇧🇷", "Morocco": "🇲🇦", "Haiti": "🇭🇹", "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "United States": "🇺🇸", "Paraguay": "🇵🇾", "Australia": "🇦🇺", "Türkiye": "🇹🇷",
  "Germany": "🇩🇪", "Curaçao": "🇨🇼", "Ivory Coast": "🇨🇮", "Ecuador": "🇪🇨",
  "Netherlands": "🇳🇱", "Japan": "🇯🇵", "Sweden": "🇸🇪", "Tunisia": "🇹🇳",
  "Belgium": "🇧🇪", "Egypt": "🇪🇬", "Iran": "🇮🇷", "New Zealand": "🇳🇿",
  "Spain": "🇪🇸", "Cape Verde": "🇨🇻", "Saudi Arabia": "🇸🇦", "Uruguay": "🇺🇾",
  "France": "🇫🇷", "Senegal": "🇸🇳", "Iraq": "🇮🇶", "Norway": "🇳🇴",
  "Argentina": "🇦🇷", "Algeria": "🇩🇿", "Austria": "🇦🇹", "Jordan": "🇯🇴",
  "Portugal": "🇵🇹", "DR Congo": "🇨🇩", "Uzbekistan": "🇺🇿", "Colombia": "🇨🇴",
  "England": "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "Croatia": "🇭🇷", "Ghana": "🇬🇭", "Panama": "🇵🇦"
};

const MATCHES = [
  { id: "m01", group: "A", date: "2026-06-11", kickoff: "2026-06-11T19:00Z", home: "Mexico", away: "South Africa" },
  { id: "m02", group: "A", date: "2026-06-11", kickoff: "2026-06-12T02:00Z", home: "South Korea", away: "Czechia" },
  { id: "m03", group: "B", date: "2026-06-12", kickoff: "2026-06-12T19:00Z", home: "Canada", away: "Bosnia and Herzegovina" },
  { id: "m04", group: "D", date: "2026-06-12", kickoff: "2026-06-13T01:00Z", home: "United States", away: "Paraguay" },
  { id: "m05", group: "B", date: "2026-06-13", kickoff: "2026-06-13T19:00Z", home: "Qatar", away: "Switzerland" },
  { id: "m06", group: "C", date: "2026-06-13", kickoff: "2026-06-13T22:00Z", home: "Brazil", away: "Morocco" },
  { id: "m07", group: "C", date: "2026-06-13", kickoff: "2026-06-14T01:00Z", home: "Haiti", away: "Scotland" },
  { id: "m08", group: "D", date: "2026-06-13", kickoff: "2026-06-14T04:00Z", home: "Australia", away: "Türkiye" },
  { id: "m09", group: "E", date: "2026-06-14", kickoff: "2026-06-14T17:00Z", home: "Germany", away: "Curaçao" },
  { id: "m10", group: "F", date: "2026-06-14", kickoff: "2026-06-14T20:00Z", home: "Netherlands", away: "Japan" },
  { id: "m11", group: "E", date: "2026-06-14", kickoff: "2026-06-14T23:00Z", home: "Ivory Coast", away: "Ecuador" },
  { id: "m12", group: "F", date: "2026-06-14", kickoff: "2026-06-15T02:00Z", home: "Sweden", away: "Tunisia" },
  { id: "m13", group: "H", date: "2026-06-15", kickoff: "2026-06-15T16:00Z", home: "Spain", away: "Cape Verde" },
  { id: "m14", group: "G", date: "2026-06-15", kickoff: "2026-06-15T19:00Z", home: "Belgium", away: "Egypt" },
  { id: "m15", group: "H", date: "2026-06-15", kickoff: "2026-06-15T22:00Z", home: "Saudi Arabia", away: "Uruguay" },
  { id: "m16", group: "G", date: "2026-06-15", kickoff: "2026-06-16T01:00Z", home: "Iran", away: "New Zealand" },
  { id: "m17", group: "I", date: "2026-06-16", kickoff: "2026-06-16T19:00Z", home: "France", away: "Senegal" },
  { id: "m18", group: "I", date: "2026-06-16", kickoff: "2026-06-16T22:00Z", home: "Iraq", away: "Norway" },
  { id: "m19", group: "J", date: "2026-06-16", kickoff: "2026-06-17T01:00Z", home: "Argentina", away: "Algeria" },
  { id: "m20", group: "J", date: "2026-06-16", kickoff: "2026-06-17T04:00Z", home: "Austria", away: "Jordan" },
  { id: "m21", group: "K", date: "2026-06-17", kickoff: "2026-06-17T17:00Z", home: "Portugal", away: "DR Congo" },
  { id: "m22", group: "L", date: "2026-06-17", kickoff: "2026-06-17T20:00Z", home: "England", away: "Croatia" },
  { id: "m23", group: "L", date: "2026-06-17", kickoff: "2026-06-17T23:00Z", home: "Ghana", away: "Panama" },
  { id: "m24", group: "K", date: "2026-06-17", kickoff: "2026-06-18T02:00Z", home: "Uzbekistan", away: "Colombia" },
  { id: "m25", group: "A", date: "2026-06-18", kickoff: "2026-06-18T16:00Z", home: "Czechia", away: "South Africa" },
  { id: "m26", group: "B", date: "2026-06-18", kickoff: "2026-06-18T19:00Z", home: "Switzerland", away: "Bosnia and Herzegovina" },
  { id: "m27", group: "B", date: "2026-06-18", kickoff: "2026-06-18T22:00Z", home: "Canada", away: "Qatar" },
  { id: "m28", group: "A", date: "2026-06-18", kickoff: "2026-06-19T01:00Z", home: "Mexico", away: "South Korea" },
  { id: "m29", group: "D", date: "2026-06-19", kickoff: "2026-06-19T19:00Z", home: "United States", away: "Australia" },
  { id: "m30", group: "C", date: "2026-06-19", kickoff: "2026-06-19T22:00Z", home: "Scotland", away: "Morocco" },
  { id: "m31", group: "C", date: "2026-06-19", kickoff: "2026-06-20T00:30Z", home: "Brazil", away: "Haiti" },
  { id: "m32", group: "D", date: "2026-06-19", kickoff: "2026-06-20T03:00Z", home: "Türkiye", away: "Paraguay" },
  { id: "m33", group: "F", date: "2026-06-20", kickoff: "2026-06-20T17:00Z", home: "Netherlands", away: "Sweden" },
  { id: "m34", group: "E", date: "2026-06-20", kickoff: "2026-06-20T20:00Z", home: "Germany", away: "Ivory Coast" },
  { id: "m35", group: "E", date: "2026-06-20", kickoff: "2026-06-21T00:00Z", home: "Ecuador", away: "Curaçao" },
  { id: "m36", group: "F", date: "2026-06-20", kickoff: "2026-06-21T04:00Z", home: "Tunisia", away: "Japan" },
  { id: "m37", group: "H", date: "2026-06-21", kickoff: "2026-06-21T16:00Z", home: "Spain", away: "Saudi Arabia" },
  { id: "m38", group: "G", date: "2026-06-21", kickoff: "2026-06-21T19:00Z", home: "Belgium", away: "Iran" },
  { id: "m39", group: "H", date: "2026-06-21", kickoff: "2026-06-21T22:00Z", home: "Uruguay", away: "Cape Verde" },
  { id: "m40", group: "G", date: "2026-06-21", kickoff: "2026-06-22T01:00Z", home: "New Zealand", away: "Egypt" },
  { id: "m41", group: "J", date: "2026-06-22", kickoff: "2026-06-22T17:00Z", home: "Argentina", away: "Austria" },
  { id: "m42", group: "I", date: "2026-06-22", kickoff: "2026-06-22T21:00Z", home: "France", away: "Iraq" },
  { id: "m43", group: "I", date: "2026-06-22", kickoff: "2026-06-23T00:00Z", home: "Norway", away: "Senegal" },
  { id: "m44", group: "J", date: "2026-06-22", kickoff: "2026-06-23T03:00Z", home: "Jordan", away: "Algeria" },
  { id: "m45", group: "K", date: "2026-06-23", kickoff: "2026-06-23T17:00Z", home: "Portugal", away: "Uzbekistan" },
  { id: "m46", group: "L", date: "2026-06-23", kickoff: "2026-06-23T20:00Z", home: "England", away: "Ghana" },
  { id: "m47", group: "L", date: "2026-06-23", kickoff: "2026-06-23T23:00Z", home: "Panama", away: "Croatia" },
  { id: "m48", group: "K", date: "2026-06-23", kickoff: "2026-06-24T02:00Z", home: "Colombia", away: "DR Congo" },
  { id: "m49", group: "B", date: "2026-06-24", kickoff: "2026-06-24T19:00Z", home: "Switzerland", away: "Canada" },
  { id: "m50", group: "B", date: "2026-06-24", kickoff: "2026-06-24T19:00Z", home: "Bosnia and Herzegovina", away: "Qatar" },
  { id: "m51", group: "C", date: "2026-06-24", kickoff: "2026-06-24T22:00Z", home: "Scotland", away: "Brazil" },
  { id: "m52", group: "C", date: "2026-06-24", kickoff: "2026-06-24T22:00Z", home: "Morocco", away: "Haiti" },
  { id: "m53", group: "A", date: "2026-06-24", kickoff: "2026-06-25T01:00Z", home: "Czechia", away: "Mexico" },
  { id: "m54", group: "A", date: "2026-06-24", kickoff: "2026-06-25T01:00Z", home: "South Africa", away: "South Korea" },
  { id: "m55", group: "E", date: "2026-06-25", kickoff: "2026-06-25T20:00Z", home: "Ecuador", away: "Germany" },
  { id: "m56", group: "E", date: "2026-06-25", kickoff: "2026-06-25T20:00Z", home: "Curaçao", away: "Ivory Coast" },
  { id: "m57", group: "F", date: "2026-06-25", kickoff: "2026-06-25T23:00Z", home: "Japan", away: "Sweden" },
  { id: "m58", group: "F", date: "2026-06-25", kickoff: "2026-06-25T23:00Z", home: "Tunisia", away: "Netherlands" },
  { id: "m59", group: "D", date: "2026-06-25", kickoff: "2026-06-26T02:00Z", home: "Türkiye", away: "United States" },
  { id: "m60", group: "D", date: "2026-06-25", kickoff: "2026-06-26T02:00Z", home: "Paraguay", away: "Australia" },
  { id: "m61", group: "I", date: "2026-06-26", kickoff: "2026-06-26T19:00Z", home: "Norway", away: "France" },
  { id: "m62", group: "I", date: "2026-06-26", kickoff: "2026-06-26T19:00Z", home: "Senegal", away: "Iraq" },
  { id: "m63", group: "H", date: "2026-06-26", kickoff: "2026-06-27T00:00Z", home: "Cape Verde", away: "Saudi Arabia" },
  { id: "m64", group: "H", date: "2026-06-26", kickoff: "2026-06-27T00:00Z", home: "Uruguay", away: "Spain" },
  { id: "m65", group: "G", date: "2026-06-26", kickoff: "2026-06-27T03:00Z", home: "Egypt", away: "Iran" },
  { id: "m66", group: "G", date: "2026-06-26", kickoff: "2026-06-27T03:00Z", home: "New Zealand", away: "Belgium" },
  { id: "m67", group: "L", date: "2026-06-27", kickoff: "2026-06-27T21:00Z", home: "Panama", away: "England" },
  { id: "m68", group: "L", date: "2026-06-27", kickoff: "2026-06-27T21:00Z", home: "Croatia", away: "Ghana" },
  { id: "m69", group: "K", date: "2026-06-27", kickoff: "2026-06-27T23:30Z", home: "Colombia", away: "Portugal" },
  { id: "m70", group: "K", date: "2026-06-27", kickoff: "2026-06-27T23:30Z", home: "DR Congo", away: "Uzbekistan" },
  { id: "m71", group: "J", date: "2026-06-27", kickoff: "2026-06-28T02:00Z", home: "Algeria", away: "Austria" },
  { id: "m72", group: "J", date: "2026-06-27", kickoff: "2026-06-28T02:00Z", home: "Jordan", away: "Argentina" }
];

// ---- Knockout rounds ----------------------------------------------------
// Dormant until you flip KNOCKOUT_ENABLED to true (do that once the group
// stage ends, after you've replaced the placeholder names with real teams).
// While false, the app shows the "unlock later" message and ignores these.
const KNOCKOUT_ENABLED = false;

// Real 2026 bracket structure with placeholder team names. After the group
// stage: edit the home/away names below (e.g. "Winner A" → "Argentina"),
// flip KNOCKOUT_ENABLED above, and re-upload. Knockout matches have no draw —
// you pick which team goes through (1 = home, 2 = away).
const KNOCKOUT_MATCHES = [
  // Round of 32 — June 28 to July 3 (official pairings)
  { id: "k32_01", round: "Round of 32", group: "", ko: true, date: "2026-06-28", home: "Runner-up A", away: "Runner-up B" },
  { id: "k32_02", round: "Round of 32", group: "", ko: true, date: "2026-06-29", home: "Winner C", away: "Runner-up F" },
  { id: "k32_03", round: "Round of 32", group: "", ko: true, date: "2026-06-29", home: "Winner E", away: "3rd A/B/C/D/F" },
  { id: "k32_04", round: "Round of 32", group: "", ko: true, date: "2026-06-29", home: "Winner F", away: "Runner-up C" },
  { id: "k32_05", round: "Round of 32", group: "", ko: true, date: "2026-06-30", home: "Runner-up E", away: "Runner-up I" },
  { id: "k32_06", round: "Round of 32", group: "", ko: true, date: "2026-06-30", home: "Winner I", away: "3rd C/D/F/G/H" },
  { id: "k32_07", round: "Round of 32", group: "", ko: true, date: "2026-06-30", home: "Winner A", away: "3rd C/E/F/H/I" },
  { id: "k32_08", round: "Round of 32", group: "", ko: true, date: "2026-07-01", home: "Winner L", away: "3rd E/H/I/J/K" },
  { id: "k32_09", round: "Round of 32", group: "", ko: true, date: "2026-07-01", home: "Winner G", away: "3rd A/E/H/I/J" },
  { id: "k32_10", round: "Round of 32", group: "", ko: true, date: "2026-07-01", home: "Winner D", away: "3rd B/E/F/I/J" },
  { id: "k32_11", round: "Round of 32", group: "", ko: true, date: "2026-07-02", home: "Winner H", away: "Runner-up J" },
  { id: "k32_12", round: "Round of 32", group: "", ko: true, date: "2026-07-02", home: "Runner-up K", away: "Runner-up L" },
  { id: "k32_13", round: "Round of 32", group: "", ko: true, date: "2026-07-02", home: "Winner B", away: "3rd E/F/G/I/J" },
  { id: "k32_14", round: "Round of 32", group: "", ko: true, date: "2026-07-03", home: "Runner-up D", away: "Runner-up G" },
  { id: "k32_15", round: "Round of 32", group: "", ko: true, date: "2026-07-03", home: "Winner J", away: "Runner-up H" },
  { id: "k32_16", round: "Round of 32", group: "", ko: true, date: "2026-07-03", home: "Winner K", away: "3rd D/E/I/J/L" },

  // Round of 16 — July 4 to 7
  { id: "k16_1", round: "Round of 16", group: "", ko: true, date: "2026-07-04", home: "Winner R32-1", away: "Winner R32-2" },
  { id: "k16_2", round: "Round of 16", group: "", ko: true, date: "2026-07-04", home: "Winner R32-3", away: "Winner R32-4" },
  { id: "k16_3", round: "Round of 16", group: "", ko: true, date: "2026-07-05", home: "Winner R32-5", away: "Winner R32-6" },
  { id: "k16_4", round: "Round of 16", group: "", ko: true, date: "2026-07-05", home: "Winner R32-7", away: "Winner R32-8" },
  { id: "k16_5", round: "Round of 16", group: "", ko: true, date: "2026-07-06", home: "Winner R32-9", away: "Winner R32-10" },
  { id: "k16_6", round: "Round of 16", group: "", ko: true, date: "2026-07-06", home: "Winner R32-11", away: "Winner R32-12" },
  { id: "k16_7", round: "Round of 16", group: "", ko: true, date: "2026-07-07", home: "Winner R32-13", away: "Winner R32-14" },
  { id: "k16_8", round: "Round of 16", group: "", ko: true, date: "2026-07-07", home: "Winner R32-15", away: "Winner R32-16" },

  // Quarter-finals — July 9 to 11
  { id: "kqf_1", round: "Quarter-finals", group: "", ko: true, date: "2026-07-09", home: "Winner R16-1", away: "Winner R16-2" },
  { id: "kqf_2", round: "Quarter-finals", group: "", ko: true, date: "2026-07-10", home: "Winner R16-3", away: "Winner R16-4" },
  { id: "kqf_3", round: "Quarter-finals", group: "", ko: true, date: "2026-07-10", home: "Winner R16-5", away: "Winner R16-6" },
  { id: "kqf_4", round: "Quarter-finals", group: "", ko: true, date: "2026-07-11", home: "Winner R16-7", away: "Winner R16-8" },

  // Semi-finals — July 14 & 15
  { id: "ksf_1", round: "Semi-finals", group: "", ko: true, date: "2026-07-14", home: "Winner QF-1", away: "Winner QF-2" },
  { id: "ksf_2", round: "Semi-finals", group: "", ko: true, date: "2026-07-15", home: "Winner QF-3", away: "Winner QF-4" },

  // Third-place play-off — July 18
  { id: "k3p", round: "Third-place Play-off", group: "", ko: true, date: "2026-07-18", home: "Loser SF-1", away: "Loser SF-2" },

  // Final — July 19
  { id: "kfinal", round: "Final", group: "", ko: true, date: "2026-07-19", home: "Winner SF-1", away: "Winner SF-2" }
];

if (typeof module !== "undefined") { module.exports = { MATCHES, KNOCKOUT_MATCHES, KNOCKOUT_ENABLED, FLAGS }; }
