import assert from 'node:assert/strict';import {readFile,readdir} from 'node:fs/promises';import {games,nbaSchedule} from '../src/data.mjs';
assert.deepEqual(games.map(g=>g.date),games.map(g=>g.date).sort());assert.equal(new Set(games.map(g=>g.slug)).size,games.length);
assert(Array.isArray(nbaSchedule));
async function walk(dir){for(const f of await readdir(dir,{withFileTypes:true})){const p=`${dir}/${f.name}`;if(f.isDirectory())await walk(p);else if(p.endsWith('.html')){const html=await readFile(p,'utf8');assert(html.includes('name="description"'));assert(html.includes('name="keywords"'));assert(html.includes('rel="canonical"'));assert(html.includes('name="twitter:card"'));if(!p.endsWith('404.html')){const tMatch=html.match(/<title>([^<]+)<\/title>/);const dMatch=html.match(/<meta name="description" content="([^"]+)">/);assert(tMatch&&tMatch[1].length>=50&&tMatch[1].length<=60,`Title length ${tMatch?.[1]?.length} out of 50-60 range in ${p}: "${tMatch?.[1]}"`);assert(dMatch&&dMatch[1].length>=145&&dMatch[1].length<=160,`Description length ${dMatch?.[1]?.length} out of 145-160 range in ${p}: "${dMatch?.[1]}"`);}const ldMatch=html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);assert(ldMatch,`Missing JSON-LD in ${p}`);const ld=JSON.parse(ldMatch[1]);assert.equal(ld['@context'],'https://schema.org');assert(Array.isArray(ld['@graph']));for(const [,href]of html.matchAll(/href="(\/[^"#]*)(?:#[^"]*)?"/g)){await readFile(`dist${href.endsWith('/')?href+'index.html':href}`);}}}}await walk('dist');console.log('Passed: chronological data, unique slugs, SEO metadata, JSON-LD schema, and all internal page/asset links.');
const dayKey=g=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(g.date));
for (const g of games) {
 const fullPhtDate=new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'long',day:'numeric'}).format(new Date(g.date));
 assert(g.homeLogo.startsWith('https://a.espncdn.com/i/teamlogos/nba/500/'));
 assert(g.awayLogo.startsWith('https://a.espncdn.com/i/teamlogos/nba/500/'));
 for(const field of ['publishedAt','updatedAt','assessmentType','keyMatchup','counterargument','upsetScenario','availability','limitations'])assert(g[field],`Missing ${field} on ${g.slug}`);
 const html=await readFile(`dist/predictions/${g.slug}/index.html`,'utf8');
 assert(html.includes(fullPhtDate),`Missing PHT date ${fullPhtDate} on ${g.slug}`);assert(html.includes('Sources & verification'));assert(html.includes('https://ak-static.cms.nba.com/'));assert(html.includes('current official injury report'));
 assert(html.includes(g.homeLogo));assert(html.includes(g.awayLogo));
 assert(html.includes('"@type":"SportsEvent"'));assert(html.includes('"@type":"AnalysisNewsArticle"'));
 assert(!/fictional|demo matchup|Island League|Metro Cup/i.test(html));
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
const robots=await readFile('dist/robots.txt','utf8');assert(robots.includes('Allow: /'));assert(robots.includes('sitemap.xml'));
const sitemap=await readFile('dist/sitemap.xml','utf8');assert(sitemap.includes('<urlset'));assert(sitemap.includes('/methodology/'));
await readFile('dist/assets/pinoyball-logo.png');
await readFile('dist/favicon.ico');
await readFile('dist/favicon.png');
await readFile('dist/apple-touch-icon.png');
assert(home.includes('href="/favicon.png"'));
const schedJson=JSON.parse(await readFile('dist/schedule.json','utf8'));
assert(Array.isArray(schedJson));
console.log('Passed: verified schedule-to-PHT conversion, ESPN NBA schedule & team logos, Prediction Wizard schema, sitemap/robots, and logo asset.');
