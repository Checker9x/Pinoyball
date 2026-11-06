# Pinoyball

A dependency-free, static basketball editorial portal with four sourced NBA previews for November 5, 2026 (PHT). The real-game edition replaces the original fictional dataset.

## Run

Node.js 18+; no install required.

```sh
npm run build
npm test
npm run dev
```

Preview: http://127.0.0.1:4173

Edit `src/data.mjs` for content and source metadata, `scripts/build.mjs` for pages, and `public/` for styling and browser interactions. Rebuild after edits. Output: `dist/`.

## Sources and scope

Fixtures: official NBA 2026–27 schedule, page 3, cross-checked with available NBA game pages and Plain Text Sports. Records: Plain Text Sports November 3, approximately 4 AM ET snapshot. Historical context: linked NBA game pages and November 2 NBA editorial analysis. Source links and limitations appear on every matchup page.

The source-checked date is November 3, 2026. All four games occur November 4 in US Eastern Standard Time, converted to November 5 PHT. These are selected games, not a complete slate. Three slight leans and one no-pick are independent editorial inferences, not source predictions. No official game-day injury report was verified. No odds, modeled probabilities, automated feed or verified outcomes are provided.

`src/snapshots/2026-11-03.json` preserves the original picks and extracted facts/source references. Preserve it when making later editorial updates. It is not a full copy of the external source pages.

## Brand

Original logo generated with the built-in image generation tool, saved at `public/assets/pinoyball-logo.png` with transparency. The brief/prompt is in `artifacts/logo-prompt.txt`. The site header uses the new logo.

## Before public launch

Keep fixtures and availability current, add verified final results with source attribution, set a production canonical URL and sitemap, and establish an editorial update workflow. The local preview retains noindex and robots disallow until an intentional launch. Nothing has been deployed externally.
