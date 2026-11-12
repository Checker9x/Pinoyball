export const siteMeta = {
  "name": "Pinoy Ball",
  "tagline": "2026-2027 NBA Match Predictions, Picks & Betting Matchup Previews · Philippine Time (PHT)",
  "url": "https://pinoyball.com",
  "locale": "en_PH",
  "timezone": "Asia/Manila",
  "logo": "https://pinoyball.com/assets/pinoyball-logo.png",
  "description": "Free 2026-2027 NBA predictions today, tonight and tomorrow. Expert NBA betting predictions, team vs team picks, matchup previews and live PHT schedules.",
  "keywords": "nba predictions, 2026-2027 nba predictions, nba predictions today, nba predictions tomorrow, nba predictions tonight, nba betting predictions, nba picks and predictions, nba odds and predictions, nba match predictions, nba game predictions, free nba predictions, accurate nba predictions"
};

export const sources = {
  "schedule": {
    "id": "schedule",
    "label": "NBA official 2026–27 schedule (ET)",
    "url": "https://ak-static.cms.nba.com/wp-content/uploads/sites/46/2026/08/2026-27-NBA-Regular-Season-Schedule-By-Date.pdf",
    "retrievedAt": "2026-11-12",
    "note": "Official NBA regular-season schedule cross-checked against current schedule listings."
  },
  "records": {
    "id": "records",
    "label": "Plain Text Sports · 2026–27 NBA schedule & records",
    "url": "https://plaintextsports.com/nba/2026-2027/schedule",
    "retrievedAt": "2026-11-12",
    "note": "Full-season-to-date win–loss records snapshot."
  },
  "rankings": {
    "id": "rankings",
    "label": "NBA.com · Season analysis",
    "url": "https://www.nba.com/news",
    "retrievedAt": "2026-11-12",
    "note": "Editorial context for previous meetings; not a current injury report."
  },
  "espn": {
    "id": "espn",
    "label": "ESPN Public NBA Scoreboard API",
    "url": "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard",
    "retrievedAt": "2026-11-12",
    "note": "Provides official NBA team logos, arena venues, team records and game schedules."
  }
};

export const espnScoreboardUrl = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard";

/*
 * WORKER TEMPLATE — Copy & paste an object like this inside `games` below:
 *
 * {
 *   "slug": "celtics-76ers-2026-11-13",
 *   "espnId": "401909961",
 *   "date": "2026-11-13T00:30:00Z", // ISO UTC timestamp (must be sorted chronologically)
 *   "publishedAt": "2026-11-12T18:00:00+08:00",
 *   "updatedAt": "2026-11-12T18:00:00+08:00",
 *   "league": "NBA",
 *   "venue": "Wells Fargo Center, Philadelphia",
 *   "venueCity": "Philadelphia, PA",
 *   "home": "Philadelphia 76ers",
 *   "homeAbbr": "PHI",
 *   "homeLogo": "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phi.png",
 *   "homeRecord": "8–2",
 *   "away": "Boston Celtics",
 *   "awayAbbr": "BOS",
 *   "awayLogo": "https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bos.png",
 *   "awayRecord": "7–3",
 *   "pick": "Philadelphia 76ers", // Or "Wait for official injury report" when level is "No pick"
 *   "level": "Slight lean",       // "Slight lean" | "Lean" | "Stronger lean" | "No pick"
 *   "assessmentType": "Preliminary assessment",
 *   "record": "8–2 / 7–3",
 *   "seoTitle": "Celtics vs 76ers NBA Prediction & Picks (2026)", // Must be 37-47 chars
 *   "seoDescription": "Boston Celtics vs Philadelphia 76ers 2026-27 NBA prediction, betting picks and matchup preview for Nov 13 (8:30 AM PHT). Compare records and home lean.", // Must be 145-160 chars
 *   "seoKeywords": "celtics vs 76ers nba prediction, boston vs philadelphia prediction, 2026-2027 nba predictions",
 *   "summary": "Short 1-sentence matchup summary shown on the homepage card.",
 *   "reasons": [
 *     "First verified fact or team form comparison.",
 *     "Our read: main tactical or home-court reason for the lean."
 *   ],
 *   "keyMatchup": "Main tactical matchup on the floor.",
 *   "counterargument": "Strongest case for the other team.",
 *   "upsetScenario": "How the underdog or opposing team wins.",
 *   "risk": "Key injury, rest, or shooting variance risk.",
 *   "availability": "A current official injury report for this game has not been verified. No player is assumed healthy, injured or available for this forecast.",
 *   "limitations": "Preliminary assessment based on season records and venue without game-day injury confirmation.",
 *   "analysis": "Editorial paragraph explaining the pick in context.",
 *   "history": "Head-to-head note or state that it is not used in the pick.",
 *   "historySource": null,
 *   "gameSource": null,
 *   "sourceNote": "Official schedule lists Boston at Philadelphia on November 12, 7:30 PM ET (November 13, 8:30 AM PHT).",
 *   "archived": false, // Set to true when game finishes to move it to /archive/
 *   "winner": "",      // Set winning team display name (e.g. "Philadelphia 76ers") when archived
 *   "finalScore": ""   // Set final score (e.g. "114–108") when archived
 * }
 */
export const games = [];

export const nbaSchedule = [];

export const cryptoTips = [
  {
    "id": "usdt",
    "symbol": "USDT",
    "name": "Tether",
    "network": "USDT (TRC-20)",
    "color": "#26a17b",
    "glyph": "₮",
    "address": "TNPha9PinoyBall7xK9m2V4n6P3r5T7w9Y2z4A6"
  }
];
