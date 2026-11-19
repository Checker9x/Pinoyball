import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import {games,nbaSchedule} from '../src/data.mjs';
assert.deepEqual(games.map(g=>g.date),games.map(g=>g.date).sort());assert.equal(new Set(games.map(g=>g.slug)).size,games.length);
assert(Array.isArray(nbaSchedule));
const unesc=s=>String(s||'').replaceAll('&amp;','&').replaceAll('&lt;','<').replaceAll('&gt;','>').replaceAll('&quot;','"');
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${f.name}`;if(f.isDirectory())await walk(p);else if(p.endsWith('.html')){const html=await readFile(p,'utf8');assert(html.includes('name="description"'));assert(html.includes('name="keywords"'));assert(html.includes('rel="canonical"'));assert(html.includes('name="twitter:card"'));if(!p.endsWith('404.html')){assert(html.includes('content="index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"'));assert(html.includes('https://www.pinoyball.com'));}if(!p.endsWith('404.html')&&!p.includes('/predictions/')){const tMatch=html.match(/<title>([^<]+)<\/title>/);const dMatch=html.match(/<meta name="description" content="([^"]+)">/);const tStr=unesc(tMatch?.[1]);const dStr=unesc(dMatch?.[1]);assert(tStr.length>=50&&tStr.length<=60,`Title length ${tStr.length} out of 50-60 range in ${p}: "${tStr}"`);assert(dStr.length>=145&&dStr.length<=160,`Description length ${dStr.length} out of 145-160 range in ${p}: "${dStr}"`);}const ldMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);assert(ldMatch,`Missing JSON-LD in ${p}`);const ld=JSON.parse(ldMatch[1]);assert.equal(ld['@context'],'https://schema.org');assert(Array.isArray(ld['@graph']));for(const [,href]of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)){await readFile(`dist${href.endsWith('/')?href+'index.html':href}`);}}}}await walk('dist');console.log('Passed: chronological data, unique slugs, SEO metadata, JSON-LD schema, and all internal page/asset links.');
const dayKey=g=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(g.date));
for (const g of games) {
 const fullPhtDate=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric'}).format(new Date(g.date));
 assert(g.homeLogo.startsWith('https://a.espncdn.com/i/teamlogos/nba/500/'));
 assert(g.awayLogo.startsWith('https://a.espncdn.com/i/teamlogos/nba/500/'));
 const html=await readFile(`dist/predictions/${g.slug}/index.html`,'utf8');
 const md=await readFile(`dist/predictions/${g.slug}/index.md`,'utf8');
 assert(html.includes(fullPhtDate),`Missing PHT date ${fullPhtDate} on ${g.slug}`);
 assert(html.includes(g.homeLogo));assert(html.includes(g.awayLogo));
 assert(html.includes('"@type":"SportsEvent"'));assert(html.includes('"@type":"AnalysisNewsArticle"'));assert(html.includes('"@type":"FAQPage"'));assert(html.includes('"@type":"SpeakableSpecification"'));
 assert(md.includes(`# ${g.away} vs ${g.home}`));
}
const home=await readFile('dist/index.html','utf8');
const archivePage=await readFile('dist/archive/index.html','utf8');
for(const g of games){
 if(g.archived){
  assert(archivePage.includes(`/predictions/${g.slug}/`),`Archived game ${g.slug} missing from /archive/`);
  assert(!home.includes(`/predictions/${g.slug}/`),`Archived game ${g.slug} should not appear in upcoming`);
 }else{
  assert(home.includes(`data-day="${dayKey(g)}"`),`Upcoming day ${dayKey(g)} missing from homepage`);
  assert(home.includes(`/predictions/${g.slug}/`),`Upcoming game ${g.slug} missing from homepage`);
 }
}
assert(home.includes('pinoyball-logo.png'));assert(!home.includes('id="nba-schedule"'));assert(home.includes('Send a tip'));assert(home.includes('class="qr-svg"'));
assert(archivePage.includes('id="archive-win-pct"'));
const schedPage=await readFile('dist/schedule/index.html','utf8');assert(schedPage.includes('id="nba-schedule"'));
const method=await readFile('dist/methodology/index.html','utf8');
for(const id of ['approach','data','what-we-analyze','process','preview-structure','confidence','models','updates','accountability','independence'])assert(method.includes(`id="${id}"`),`Missing section #${id}`);
assert(method.includes('"@type":"AboutPage"'));
const robots=await readFile('dist/robots.txt','utf8');
for(const bot of ['Googlebot','Bingbot','GPTBot','OAI-SearchBot','ClaudeBot','PerplexityBot','Google-Extended'])assert(robots.includes(`User-agent: ${bot}`),`Missing ${bot} in robots.txt`);
assert(!robots.includes('Disallow: /'));assert(robots.includes('sitemap.xml'));assert(robots.includes('llms.txt'));
const llms=await readFile('dist/llms.txt','utf8');assert(llms.startsWith('# Pinoy Ball'));
const llmsFull=await readFile('dist/llms-full.txt','utf8');assert(llmsFull.startsWith('# Pinoy Ball'));
const sitemap=await readFile('dist/sitemap.xml','utf8');assert(sitemap.includes('<urlset'));assert(sitemap.includes('https://www.pinoyball.com/methodology/'));
await readFile('dist/assets/pinoyball-logo.png');
await readFile('dist/favicon.ico');
await readFile('dist/favicon.png');
await readFile('dist/apple-touch-icon.png');
assert(home.includes('href="/favicon.png"'));
const schedJson=JSON.parse(await readFile('dist/schedule.json','utf8'));
assert(Array.isArray(schedJson));

// Verify Vercel Function handlers & shared SSR renderer
const {GET: renderGet} = await import('../api/render.js');
const {GET: adminGet} = await import('../api/admin.js');
const {renderPredictionHtml, renderPredictionMarkdown} = await import('../src/render.mjs');

const sampleGame = {
  slug: 'celtics-76ers-2026-11-20',
  espnId: '401800001',
  date: '2026-11-20T00:30:00Z',
  dateOnly: false,
  publishedAt: '2026-11-19T06:00:00Z',
  updatedAt: '2026-11-19T06:00:00Z',
  league: 'NBA',
  venue: 'Wells Fargo Center, Philadelphia',
  away: 'Boston Celtics',
  awayAbbr: 'BOS',
  awayLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bos.png',
  awayRecord: '11–3',
  home: 'Philadelphia 76ers',
  homeAbbr: 'PHI',
  homeLogo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phi.png',
  homeRecord: '9–5',
  pick: 'Boston Celtics',
  level: 'Lean',
  summary: 'Boston holds the half-court spacing edge.',
  reasons: ['Perimeter shooting volume'],
  analysis: '## Tactical Read\n- Spacing advantage on the perimeter',
  archived: false,
  winner: '',
  finalScore: ''
};
const renderedPredHtml = renderPredictionHtml(sampleGame, [sampleGame]);
const renderedPredMd = renderPredictionMarkdown(sampleGame);
assert(renderedPredHtml.includes('"@type":"SportsEvent"'));
assert(renderedPredHtml.includes('"@type":"AnalysisNewsArticle"'));
assert(renderedPredHtml.includes('"@type":"FAQPage"'));
assert(renderedPredMd.includes('# Boston Celtics vs Philadelphia 76ers'));

const homeRes = await renderGet(new Request('https://www.pinoyball.com/api/render?route=home'));
assert.equal(homeRes.status, 200);
assert((await homeRes.text()).includes('NBA MATCH PREDICTION'));

const unauthAdminPage = await adminGet(new Request('https://www.pinoyball.com/api/admin?adminPath=/'));
assert.equal(unauthAdminPage.status, 302);
assert.equal(unauthAdminPage.headers.get('location'), '/admin/login');
assert.equal(unauthAdminPage.headers.get('x-robots-tag'), 'noindex, nofollow, noarchive');

const unauthAdminApi = await adminGet(new Request('https://www.pinoyball.com/api/admin?adminPath=/api/games'));
assert.equal(unauthAdminApi.status, 401);

console.log('Passed: SEO & AI crawler rules, llms.txt + Markdown mirrors, JSON-LD, Vercel SSR + Admin Functions, and sitemap.');
