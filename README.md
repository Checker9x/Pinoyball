# Pinoy Ball — Project Overview & Worker Guide

**Pinoy Ball** is an independent NBA match prediction and editorial analysis website built specifically for Philippine basketball fans (`en-PH`). Every game schedule, tip-off time, and archive record is presented in **Philippine Standard Time (PHT / `Asia/Manila`, UTC+8)**.

- **Live Production URL (Vercel):** https://pinoyball-prediction.vercel.app/
- **GitHub Repository:** https://github.com/Checker9x/Pinoyball
- **Tech Stack:** Zero-dependency Node.js (`>= 18`) static site generator (ES Modules) + Vanilla HTML, CSS, and JavaScript.

---

## 1. How the Project Works (100% Manual Editorial Control)

1. **Single Source of Truth (`src/data.mjs`):** All NBA matchup previews, editorial picks, team records, archive status (`archived: true/false`), game winners (`winner`), final scores (`finalScore`), schedule snapshots (`nbaSchedule`), and USDT tip details live inside `src/data.mjs`.
2. **Deterministic Static Build (`scripts/build.mjs`):** Running `npm run build` reads `src/data.mjs` and compiles the static website into `dist/`. Nothing updates or moves automatically behind the scenes—every change happens only when you edit `src/data.mjs` and rebuild.
3. **Manual Upcoming vs. Archive Control:**
   - **Upcoming Games (`"archived": false`):** Appear on the **Homepage (`/`)** under `Upcoming predictions`, grouped by PHT date.
   - **Archived Games (`"archived": true`):** Appear on **Prediction Results Archive (`/archive/`)**, displaying `Our prediction`, `Result winner`, the right-side `Winner` badge, and the **Overall Prediction Win % / Wins vs Losses** scorecard.
4. **Frontend UI (`public/app.js` & `public/style.css`):**
   - Mobile hamburger menu (`#menu-toggle`), Competition/Date dropdown filters on the homepage, sticky right sidebar (`Send a tip` USDT TRC-20 QR widget + `What's behind a pick?`), one-click USDT wallet copy button, and schedule date selector on `/schedule/`.

---

## 2. Folder & File Structure

```text
Pinoyball Sports Prediction/
├── src/
│   ├── data.mjs               # Main database: siteMeta, sources, games[], nbaSchedule[], cryptoTips[]
│   └── snapshots/             # Historical source snapshots (do not delete)
├── public/
│   ├── app.js                 # UI interactions: mobile menu, dropdown filters, USDT copy, scorecard tally
│   ├── style.css              # All desktop & mobile responsive styles (including sticky sidebar)
│   ├── assets/                # Brand logo (pinoyball-logo.png)
│   └── favicon.*              # Favicons & Apple touch icon
├── scripts/
│   ├── build.mjs              # Generates static HTML, JSON-LD SEO schemas, sitemap.xml, robots.txt -> dist/
│   ├── serve.mjs              # Local preview server (http://127.0.0.1:4173) serving dist/
│   └── test.mjs               # Automated test suite (SEO lengths, links, JSON-LD, PHT time checks)
├── dist/                      # Generated production output served by Vercel
├── vercel.json                # Tells Vercel to run `npm run build` and serve `dist/`
└── package.json               # Scripts: `build`, `dev`, `test` (no npm dependencies needed)
```

---

## 3. Site Pages Overview

| Route | Purpose |
| :--- | :--- |
| `/` | **Homepage (`Overview`):** Displays all games with `"archived": false` grouped by PHT date, Competition/Date filters, PHT date badge, and the sticky sidebar (`Send a tip` + `What's behind a pick?`). |
| `/predictions/<slug>/` | **Matchup Preview Page:** Full 10-section editorial breakdown for a single game (Pick/Confidence tier, Supporting evidence, Season form, Key matchup, Head-to-head, Counterargument & upset scenario, Player availability, Limitations, Sources). |
| `/schedule/` | **Full NBA Schedule:** Displays NBA schedule cards in PHT with links to editorial picks and a manual US Slate Date (`ET`) selector. |
| `/archive/` | **Prediction Results Archive:** Displays all games with `"archived": true` grouped by PHT date (`Team vs Team`, `Our prediction`, `Result winner`), right-side `Winner` badge, and the `OVERALL PREDICTION` Win % scorecard (`No pick` games are excluded from Win/Loss totals). |
| `/methodology/` | **Our Methodology:** Documents our 6 analytical pillars, confidence tiers (`Slight lean`, `Lean`, `Stronger lean`, `No pick`), injury rules, and grading transparency. |

---

## 4. Local Commands for Workers

No `npm install` is required (uses built-in Node.js 18+ APIs):

```bash
# 1. Build static production files into dist/
npm run build

# 2. Run automated SEO, schema, link, and data validation tests
npm test

# 3. Preview dist/ locally at http://127.0.0.1:4173
npm run dev
```

> **Rule:** Always run `npm run build && npm test` after editing `src/data.mjs` and before pushing to GitHub.

---

## 5. Worker SOP: Manual Daily Tasks (`src/data.mjs` Only)

You **only** ever need to edit **`src/data.mjs`** (you do not need to touch `public/app.js` or `scripts/test.mjs`).

### Task A: Move Completed Games to the Archive
When an upcoming game finishes and you want to move it from Homepage `Upcoming predictions` into `/archive/`:
1. Open `src/data.mjs` and find that game inside `games`.
2. Update these three fields manually:
   ```js
   "archived": true,
   "winner": "Boston Celtics",   // Exact winning team name matching `home` or `away`
   "finalScore": "109–102"       // Winning score first, separated by en dash
   ```
3. Run `npm run build && npm test` — the game moves to `/archive/` and the overall Win % updates automatically during the build.

### Task B: Add New Upcoming Predictions
1. **Add Game Entries to `src/data.mjs`:**
   - Copy the sample upcoming game object in `games` (`src/data.mjs`) as a template (or replace it).
   - Keep `games` in **strict chronological order** by ISO UTC `date` (e.g., `'2026-11-13T00:30:00Z'`).
   - Set `"archived": false`, `"winner": ""`, and `"finalScore": ""`.
   - **Never delete archived games:** Keep completed games (`"archived": true`) in `games` so the `/archive/` history and Win/Loss percentage remain intact.
   - **Unique slug format:** `<away-short>-<home-short>-<YYYY-MM-DD-PHT>`.
   - **Confidence levels (`level`):** `'Lean'`, `'Slight lean'`, `'Stronger lean'`, or `'No pick'` (for `'No pick'`, set `pick` to `'Wait for official injury report'`).
2. **Follow Strict SEO Character Limits (Checked by `npm test`):**
   - **Title (`seoTitle`):** **37 to 47 characters** (`50 to 60 characters` total with ` | Pinoy Ball`).
   - **Meta Description (`seoDescription`):** **145 to 160 characters**.
   - **Logos:** Use ESPN CDN NBA scoreboard URLs (`https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/<abbr>.png`).
3. **Build, Test & Deploy:**
   ```bash
   npm run build && npm test
   git add .
   git commit -m "Update NBA predictions and archive results"
   git push origin main
   ```
   Vercel automatically builds and deploys `dist/` when changes are pushed to `main`.
