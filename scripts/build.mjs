import {mkdir, writeFile, copyFile, rm} from 'node:fs/promises';
import {games as staticGames, nbaSchedule} from '../src/data.mjs';
import {hasDatabaseUrl, ensureSchema, listPredictions, upsertPrediction} from '../src/db.mjs';
import {
  renderHomeHtml,
  renderPredictionHtml,
  renderPredictionMarkdown,
  renderArchiveHtml,
  renderScheduleHtml,
  renderMethodologyHtml,
  renderNotFoundHtml,
  renderSitemapXml,
  renderLlmsTxt,
  renderLlmsFullTxt,
  renderRobotsTxt
} from '../src/render.mjs';

await rm('dist', {recursive: true, force: true});
await mkdir('dist', {recursive: true});

let games = staticGames;
if (hasDatabaseUrl()) {
  await ensureSchema();
  let dbGames = await listPredictions();
  if (dbGames.length === 0 && staticGames.length > 0) {
    for (const g of staticGames) {
      await upsertPrediction(g);
    }
    dbGames = await listPredictions();
  }
  games = dbGames;
  console.log(`Loaded ${games.length} prediction(s) from Neon Postgres.`);
}

const nowPht = new Date();
const isVercelBuild = process.env.VERCEL === '1';

// Static pages & assets always emitted to dist/
await mkdir('dist/methodology', {recursive: true});
await writeFile('dist/methodology/index.html', renderMethodologyHtml(), 'utf8');

await mkdir('dist/schedule', {recursive: true});
await writeFile('dist/schedule/index.html', renderScheduleHtml(nbaSchedule, nowPht), 'utf8');

await writeFile('dist/schedule.json', JSON.stringify(nbaSchedule, null, 2), 'utf8');
await writeFile('dist/robots.txt', renderRobotsTxt(), 'utf8');
await writeFile('dist/404.html', renderNotFoundHtml(), 'utf8');

await mkdir('dist/assets', {recursive: true});
await copyFile('public/assets/pinoyball-logo.png', 'dist/assets/pinoyball-logo.png');
for (const f of ['style.css', 'app.js', 'favicon.ico', 'favicon.png', 'apple-touch-icon.png']) {
  await copyFile(`public/${f}`, `dist/${f}`);
}

// Locally (and in CI tests), write full static HTML/MD/XML/TXT output to dist/.
// On Vercel (VERCEL=1), omit DB-backed files from dist/ so vercel.json rewrites
// serve live Neon Postgres responses via /api/render with zero redeploy delay.
if (!isVercelBuild) {
  await writeFile('dist/index.html', renderHomeHtml(games, nowPht), 'utf8');
  await mkdir('dist/archive', {recursive: true});
  await writeFile('dist/archive/index.html', renderArchiveHtml(games), 'utf8');

  for (const g of games) {
    const dir = `dist/predictions/${g.slug}`;
    await mkdir(dir, {recursive: true});
    await writeFile(`${dir}/index.html`, renderPredictionHtml(g, games), 'utf8');
    await writeFile(`${dir}/index.md`, renderPredictionMarkdown(g), 'utf8');
  }

  await writeFile('dist/games.json', JSON.stringify(games, null, 2), 'utf8');
  await writeFile('dist/llms.txt', renderLlmsTxt(games), 'utf8');
  await writeFile('dist/llms-full.txt', renderLlmsFullTxt(games), 'utf8');
  await writeFile('dist/sitemap.xml', renderSitemapXml(games, nowPht), 'utf8');
}

console.log(`Built site in dist/ (${isVercelBuild ? 'Vercel SSR + static assets mode' : 'full static build'}).`);
