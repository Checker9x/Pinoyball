import {mkdir,writeFile,copyFile,rm} from 'node:fs/promises';
import {siteMeta,games,nbaSchedule,sources,espnScoreboardUrl,cryptoTips} from '../src/data.mjs';

await rm('dist',{recursive:true,force:true});
await mkdir('dist',{recursive:true});

const liveSchedule = nbaSchedule;

const date=g=>new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',month:'short',day:'numeric',weekday:'short'}).format(new Date(g.date));
const time=g=>new Intl.DateTimeFormat('en-PH',{timeZone:'Asia/Manila',hour:'numeric',minute:'2-digit'}).format(new Date(g.date));
const dayKey=g=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(g.date));
const sourceLink=key=>`<a href="${sources[key].url}">${sources[key].label}</a>`;

const orgSchema = {
  '@type': 'Organization',
  '@id': `${siteMeta.url}/#organization`,
  name: siteMeta.name,
  url: siteMeta.url,
  logo: {
    '@type': 'ImageObject',
    url: siteMeta.logo,
    width: 300,
    height: 100
  }
};

const websiteSchema = {
  '@type': 'WebSite',
  '@id': `${siteMeta.url}/#website`,
  url: siteMeta.url,
  name: siteMeta.name,
  alternateName: 'Pinoy Ball NBA Predictions',
  description: siteMeta.description,
  keywords: siteMeta.keywords,
  inLanguage: 'en-PH',
  publisher: {'@id': `${siteMeta.url}/#organization`}
};

function breadcrumbSchema(items) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, path], idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name,
      item: `${siteMeta.url}${path}`
    }))
  };
}

function sportsEventSchema(g) {
  return {
    '@type': 'SportsEvent',
    '@id': `${siteMeta.url}/predictions/${g.slug}/#event`,
    name: `${g.away} vs ${g.home} (2026-2027 NBA Regular Season)`,
    description: g.seoDescription || g.summary,
    sport: 'Basketball',
    startDate: g.date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: g.venue,
      address: g.venueCity || g.venue
    },
    homeTeam: {
      '@type': 'SportsTeam',
      name: g.home,
      alternateName: g.homeAbbr,
      sport: 'Basketball',
      logo: g.homeLogo
    },
    awayTeam: {
      '@type': 'SportsTeam',
      name: g.away,
      alternateName: g.awayAbbr,
      sport: 'Basketball',
      logo: g.awayLogo
    },
    url: `${siteMeta.url}/predictions/${g.slug}/`
  };
}

function shell({title, desc, keywords = siteMeta.keywords, body, active = '', canonicalPath = '/', ogType = 'website', publishedAt = null, updatedAt = null, schemaGraph = [], noindex = false}) {
  const canonicalUrl = `${siteMeta.url}${canonicalPath}`;
  const robots = noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large';
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [orgSchema, websiteSchema, ...schemaGraph]
  });
  return `<!doctype html>
<html lang="en-PH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${title} | Pinoy Ball</title>
  <meta name="description" content="${desc}">
  <meta name="keywords" content="${keywords}">
  <meta name="robots" content="${robots}">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:site_name" content="${siteMeta.name}">
  <meta property="og:locale" content="${siteMeta.locale}">
  <meta property="og:title" content="${title} | Pinoy Ball">
  <meta property="og:description" content="${desc}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${siteMeta.logo}">
  <meta property="og:image:alt" content="Pinoy Ball · 2026-2027 NBA Predictions, Picks & Betting Matchup Analysis">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title} | Pinoy Ball">
  <meta name="twitter:description" content="${desc}">
  <meta name="twitter:image" content="${siteMeta.logo}">
  ${publishedAt ? `<meta property="article:published_time" content="${publishedAt}">` : ''}
  ${updatedAt ? `<meta property="article:modified_time" content="${updatedAt}">` : ''}
  <meta name="theme-color" content="#1355a0">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" href="/favicon.png" sizes="64x64">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" sizes="180x180">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow+Semi+Condensed:wght@500;600;700&family=Barlow:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap">
  <link rel="stylesheet" href="/style.css">
  <script type="application/ld+json">${jsonLd}</script>
  <script src="/app.js" defer></script>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="topline"><div class="wrap">INDEPENDENT NBA MATCH PREDICTION <span>Made for the Philippine basketball fan</span></div></div>
  <header class="wrap">
    <a class="brand" href="/" aria-label="Pinoy Ball home"><img class="brandlogo" src="/assets/pinoyball-logo.png" alt="Pinoyball" width="300" height="100" fetchpriority="high"></a>
    <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Toggle navigation menu"><span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="menu-label">Menu</span></button>
  </header>
  <nav id="main-nav" aria-label="Main navigation">
    <div class="wrap">${[['/','Overview'],['/#predictions','Predictions'],['/schedule/','NBA Schedule'],['/archive/','Prediction results archive'],['/methodology/','Our methodology']].map(([href,label])=>`<a href="${href}" ${active===label?'aria-current="page"':''}>${label}</a>`).join('')}</div>
  </nav>
  <main id="main" class="wrap">${body}</main>
  <footer class="wrap">
    <a class="footbrand" href="/">PINOY BALL</a>
    <span>Independent thinking. Basketball first.</span>
    <a href="/methodology/">Methodology & sources</a>
  </footer>
</body>
</html>`;
}

const nowPht = new Date();
const isGameDone = g => Boolean(g.archived);

const upcomingGames = games.filter(g => !isGameDone(g));
const archivedGames = games.filter(g => isGameDone(g));

const row=g=>`<article class="match" data-espn-id="${g.espnId}" data-datetime="${g.date}" data-league="${g.league}" data-date="${dayKey(g)}"><div class="gametime"><time datetime="${g.date}">${time(g)}</time><span>PHT · UTC+8</span><span class="league">${g.league}</span></div><div class="matchbody"><div class="matchtitle"><a class="matchteams" href="/predictions/${g.slug}/"><span class="teamchip"><img class="teamlogo" src="${g.awayLogo}" alt="" width="26" height="26">${g.away}</span> <span>vs</span> <span class="teamchip"><img class="teamlogo" src="${g.homeLogo}" alt="" width="26" height="26">${g.home}</span></a><span class="pill ${g.level==='No pick'?'neutral':''}">${g.level}</span></div><p class="matchmeta">${g.venue} · Records (${g.awayAbbr} ${g.awayRecord} · ${g.homeAbbr} ${g.homeRecord}) · ${g.assessmentType}</p><p>${g.summary}</p><div class="pick">${g.level==='No pick'?'Decision':'Our lean'}: <strong>${g.pick}</strong></div><ul>${g.reasons.map(r=>`<li>${r}</li>`).join('')}</ul><a class="read" href="/predictions/${g.slug}/">Full matchup analysis <span>→</span></a></div></article>`;

const scheduleCard=s=>`<article class="sched-card"><div class="sched-head"><time datetime="${s.date}">${time(s)} PHT</time><span class="sched-status">${s.status}</span></div><div class="sched-teams"><div class="sched-team"><img class="teamlogo" src="${s.awayLogo}" alt="" width="24" height="24" loading="lazy"><span class="sched-name">${s.away}</span><span class="sched-rec">${s.awayRecord}</span></div><div class="sched-team"><img class="teamlogo" src="${s.homeLogo}" alt="" width="24" height="24" loading="lazy"><span class="sched-name">${s.home} <small>HOME</small></span><span class="sched-rec">${s.homeRecord}</span></div></div><div class="sched-foot"><span>${s.venue}</span>${s.predictionSlug?`<a href="/predictions/${s.predictionSlug}/">Editorial pick →</a>`:`<span>Event #${s.espnId}</span>`}</div></article>`;

let schedule='';
for(const day of [...new Set(upcomingGames.map(g=>dayKey(g)))]){
  schedule+=`<section class="day" data-day="${day}"><h3>${date(upcomingGames.find(g=>dayKey(g)===day))} <span>All times Philippine Standard Time</span></h3>${upcomingGames.filter(g=>dayKey(g)===day).map(row).join('')}</section>`;
}

const archiveRow=g=>{
  const winLogo=g.winner===g.home?g.homeLogo:(g.winner===g.away?g.awayLogo:'');
  const winLabel=g.winner?`${g.winner}${g.finalScore?` (${g.finalScore})`:''}`:'Pending';
  return `<article class="match archive-match" data-espn-id="${g.espnId}" data-pick="${g.pick}" data-level="${g.level}" data-winner="${g.winner||''}" data-league="${g.league}" data-date="${dayKey(g)}"><div class="gametime"><time datetime="${g.date}">${time(g)}</time><span>PHT · UTC+8</span><span class="league">${g.league}</span></div><div class="matchbody"><div class="matchtitle"><a class="matchteams" href="/predictions/${g.slug}/"><span class="teamchip"><img class="teamlogo" src="${g.awayLogo}" alt="" width="26" height="26">${g.away}</span> <span>vs</span> <span class="teamchip"><img class="teamlogo" src="${g.homeLogo}" alt="" width="26" height="26">${g.home}</span></a><span class="winner-right" data-role="winner-badge"><span class="statusdot"></span>${winLogo?`<img class="teamlogo" src="${winLogo}" alt="" width="20" height="20">`:''}<span>Winner: <strong>${winLabel}</strong></span></span></div><div class="pick">Our prediction: <strong>${g.pick}</strong></div><div class="pick">Result winner: <strong data-role="result-winner">${winLabel}</strong></div></div></article>`;
};

const gradedGames=archivedGames.filter(g=>g.level!=='No pick'&&(g.pick===g.home||g.pick===g.away)&&g.winner);
const archiveWins=gradedGames.filter(g=>g.pick===g.winner).length;
const archiveLosses=gradedGames.length-archiveWins;
const archivePct=gradedGames.length?`${Math.round((archiveWins/gradedGames.length)*1000)/10}%`:'0%';

let archiveSchedule='';
for(const day of [...new Set(archivedGames.map(g=>dayKey(g)))]){
  archiveSchedule+=`<section class="day" data-day="${day}"><h3>${date(archivedGames.find(g=>dayKey(g)===day))} <span>All times Philippine Standard Time</span></h3>${archivedGames.filter(g=>dayKey(g)===day).map(archiveRow).join('')}</section>`;
}

const fullSlateHtml=`<section id="nba-schedule" class="sched-section"><div class="sectionhead"><h2>Full NBA Schedule</h2><span id="espn-slate-count">${liveSchedule.length} games on slate</span></div><div class="sched-controls"><label for="espn-date">US Slate Date (ET) <input type="date" id="espn-date" value="2026-11-04"></label><span id="espn-status" class="sched-note"><span class="statusdot"></span>Philippine Standard Time (PHT)</span></div><div id="espn-grid" class="sched-grid">${liveSchedule.map(scheduleCard).join('')}</div></section>`;

const cryptoIcon=id=>{
  if(id==='usdt')return `<svg class="crypto-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#26a17b"/><path fill="#fff" d="M13.1 10.6V9.2h3.4V7H7.5v2.2h3.4v1.4c-2.8.1-4.9.6-4.9 1.3s2.1 1.2 4.9 1.3v4.4h2.2v-4.4c2.8-.1 4.9-.6 4.9-1.3s-2.1-1.2-4.9-1.3zm-1.1 1.9c-2.1 0-3.8-.3-4.3-.7.5-.4 2.1-.6 4.3-.7 2.1 0 3.8.3 4.3.7-.5.4-2.2.7-4.3.7z"/></svg>`;
  return '';
};

function qrSvg(tip){
  const size=21;
  let rects='';
  const inFinder=(r,c,r0,c0)=>r>=r0&&r<r0+7&&c>=c0&&c<c0+7;
  const finderDark=(r,c,r0,c0)=>{const dr=r-r0,dc=c-c0;return dr===0||dr===6||dc===0||dc===6||(dr>=2&&dr<=4&&dc>=2&&dc<=4);};
  let hash=2166136261;
  for(let i=0;i<tip.address.length;i++)hash=Math.imul(hash^tip.address.charCodeAt(i),16777619);
  for(let r=0;r<size;r++){
    for(let c=0;c<size;c++){
      if(r>=8&&r<=12&&c>=8&&c<=12)continue;
      let dark=false;
      if(inFinder(r,c,0,0))dark=finderDark(r,c,0,0);
      else if(inFinder(r,c,0,14))dark=finderDark(r,c,0,14);
      else if(inFinder(r,c,14,0))dark=finderDark(r,c,14,0);
      else if((r<8&&c<8)||(r<8&&c>=13)||(r>=13&&c<8))dark=false;
      else if(r===6||c===6)dark=(r+c)%2===0;
      else{
        const v=Math.imul(hash^(r*31+c*17),2654435761)>>>0;
        dark=(v%10)<5;
      }
      if(dark)rects+=`<rect x="${c}" y="${r}" width="1" height="1"/>`;
    }
  }
  return `<svg class="qr-svg" viewBox="0 0 21 21" width="112" height="112" role="img" aria-label="QR code for ${tip.name} wallet address"><rect width="21" height="21" fill="#fff"/><g fill="#182a3e">${rects}</g><rect x="8.2" y="8.2" width="4.6" height="4.6" rx="1" fill="${tip.color}"/><text x="10.5" y="11.6" text-anchor="middle" fill="#fff" font-size="3.1" font-weight="700">${tip.glyph}</text></svg>`;
}

const firstTip=cryptoTips[0];
const tipBoxHtml=`<section class="explorebox tipbox"><div class="tiphead"><h2>Send a tip</h2><span class="usdt-badge">${cryptoIcon('usdt')}<span>USDT</span></span></div><div class="qr-box"><div id="tip-qr-wrap" class="qr-frame">${qrSvg(firstTip)}</div><div class="qr-meta"><span id="tip-network" class="qr-net">${firstTip.name} · ${firstTip.network}</span><code id="tip-address" class="qr-addr">${firstTip.address}</code><button type="button" class="button button-sm tip-copy" id="tip-copy" data-symbol="${firstTip.symbol}">Copy ${firstTip.symbol} address</button></div></div></section>`;

const homeSchemaGraph = [
  {
    '@type': 'CollectionPage',
    '@id': `${siteMeta.url}/#webpage`,
    url: `${siteMeta.url}/`,
    name: 'NBA Predictions Today & Tomorrow (2026-2027) · Free NBA Matchup Picks & Betting Previews | Pinoy Ball',
    description: siteMeta.description,
    keywords: siteMeta.keywords,
    isPartOf: {'@id': `${siteMeta.url}/#website`},
    mainEntity: {
      '@type': 'ItemList',
      name: '2026-2027 NBA Matchup Predictions & Picks',
      itemListElement: upcomingGames.map((g, idx) => ({
        '@type': 'ListItem',
        position: idx + 1,
        item: sportsEventSchema(g)
      }))
    }
  }
];

const phtMonth = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', month: 'short'}).format(nowPht).toUpperCase();
const phtDay = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', day: '2-digit'}).format(nowPht);
const phtYear = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', year: 'numeric'}).format(nowPht);
const phtClock = new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit'}).format(nowPht);

await writeFile('dist/index.html', shell({
  title: '2026-27 NBA Predictions Today & Matchup Picks',
  desc: 'Free 2026-2027 NBA predictions today, tonight and tomorrow. Expert NBA betting predictions, team vs team picks, matchup previews and live PHT schedules.',
  keywords: 'nba predictions, nba predictions today, nba predictions tomorrow, nba predictions tonight, 2026-2027 nba predictions, nba betting predictions, nba picks and predictions, nba odds and predictions, nba match predictions, nba matchups predictions, free nba predictions, accurate nba predictions',
  canonicalPath: '/',
  active: 'Overview',
  schemaGraph: homeSchemaGraph,
  body: `<div class="pageheading"><div><h1>NBA MATCH PREDICTION</h1><p>Team vs Team win or loss prediction matches</p></div><span class="datebadge" id="pht-badge"><span id="pht-month">${phtMonth}</span> <b id="pht-day">${phtDay}</b> <span id="pht-year">${phtYear}</span><small id="pht-time">${phtClock} PHT</small></span></div><div class="columns"><div><section id="predictions"><div class="sectionhead"><h2>Upcoming predictions</h2></div><div class="filters"><label>Competition <select id="league"><option value="all">All competitions</option>${[...new Set(upcomingGames.map(g=>g.league))].map(league=>`<option>${league}</option>`).join('')}</select></label><label>Date <select id="day"><option value="all">All upcoming dates</option>${[...new Set(upcomingGames.map(dayKey))].map(day=>`<option value="${day}">${date(upcomingGames.find(g=>dayKey(g)===day))}</option>`).join('')}</select></label><span id="count" aria-live="polite">${upcomingGames.length} matchup${upcomingGames.length===1?'':'s'}</span></div>${schedule}<p id="empty"${upcomingGames.length?' hidden':''}>No upcoming matchups posted right now. Check back soon or try another filter.</p></section></div><aside>${tipBoxHtml}<section class="sideblock"><h2>What’s behind a pick?</h2><ol><li><strong>Form, with context</strong><span>Look beyond the last result.</span></li><li><strong>The matchup itself</strong><span>Pace, style and possible advantages.</span></li><li><strong>The missing pieces</strong><span>Availability and uncertainty matter.</span></li></ol><a href="/methodology/">Read our approach →</a></section></aside></div>`
}));

async function page(path, title, desc, content, active = '', extra = {}) {
  await mkdir(`dist/${path}`, {recursive: true});
  await writeFile(`dist/${path}/index.html`, shell({
    title,
    desc,
    body: content,
    active,
    canonicalPath: `/${path}/`,
    ...extra
  }));
}

for (const g of games) {
  const path = `predictions/${g.slug}`;
  const pageTitle = g.seoTitle || `${g.away} vs ${g.home} NBA Prediction, Picks & Betting Matchup Preview`;
  const pageDesc = g.seoDescription || g.summary;
  const fullPhtDate = new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', month: 'long', day: 'numeric'}).format(new Date(g.date));
  await page(
    path,
    pageTitle,
    pageDesc,
    `<article class="article">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <a href="/#predictions">Predictions</a> <span>/</span> <span aria-current="page">${g.awayAbbr} vs ${g.homeAbbr}</span></nav>
      <header class="article-header">
        <p class="eyebrow">${g.league} 2026–2027 · MATCHUP PREDICTION & PREVIEW</p>
        <h1>${g.away} vs ${g.home}</h1>
        <div class="matchbanner">
          <div class="bannerteam"><img class="bannerlogo" src="${g.awayLogo}" alt="" width="52" height="52"><div><strong>${g.away}</strong><span>Away · ${g.awayAbbr} (${g.awayRecord})</span></div></div>
          <div class="bannervs"><span>VS</span><small>${time(g)} PHT</small></div>
          <div class="bannerteam"><img class="bannerlogo" src="${g.homeLogo}" alt="" width="52" height="52"><div><strong>${g.home}</strong><span>Home · ${g.homeAbbr} (${g.homeRecord})</span></div></div>
        </div>
        <p class="lead">${g.summary}</p>
        <dl class="meta-grid">
          <div><dt>Date & Philippine Time</dt><dd>${date(g)} · <time datetime="${g.date}">${time(g)} PHT (UTC+8)</time></dd></div>
          <div><dt>Venue</dt><dd>${g.venue}</dd></div>
          <div><dt>Assessment Tier</dt><dd>${g.assessmentType}</dd></div>
          <div><dt>Publication Status</dt><dd>Published <time datetime="${g.publishedAt}">Nov 3, 2026</time> · <a href="#sources">Sources ↓</a></dd></div>
        </dl>
      </header>
      <div class="analysispick">
        <span>${g.level} · ${g.assessmentType}</span>
        <h2>${g.pick}</h2>
        <p>Pinoy Ball editorial judgment. Not a calibrated probability or a source’s prediction.</p>
      </div>
      <section id="supporting-evidence">
        <h2>Supporting evidence</h2>
        <ul>${g.reasons.map(r=>`<li>${r}</li>`).join('')}</ul>
      </section>
      <section id="season-form">
        <h2>Season form, in context</h2>
        <p>Season records (${g.home} / ${g.away}): <strong>${g.record}</strong>. ${sourceLink('records')}, November 3 snapshot. These are full-season-to-date records, not last-five results.</p>
        <p>${g.analysis}</p>
      </section>
      <section id="key-matchup">
        <h2>Key matchup</h2>
        <p>${g.keyMatchup}</p>
      </section>
      <section id="head-to-head">
        <h2>Head-to-head context</h2>
        <p>${g.history} ${g.historySource==='game'?`<a href="${g.gameSource}">NBA matchup history</a>`:g.historySource?sourceLink(g.historySource):''}</p>
      </section>
      <section id="counterargument">
        <h2>Strongest counterargument & upset scenario</h2>
        <p><strong>Opposing case:</strong> ${g.counterargument}</p>
        <p><strong>Upset scenario:</strong> ${g.upsetScenario}</p>
        <p>${g.risk}</p>
      </section>
      <section id="availability">
        <h2>Player availability</h2>
        <p>${g.availability}</p>
      </section>
      <section id="limitations">
        <h2>Limitations</h2>
        <p>${g.limitations}</p>
      </section>
      <section id="sources">
        <h2>Sources & verification</h2>
        <ul class="sources">
          <li>${sourceLink('schedule')}<p>${g.sourceNote} Converted from EST (UTC−5) to PHT (UTC+8): the Philippine date is ${fullPhtDate}.</p></li>
          <li>${sourceLink('espn')}<p>Event ID ${g.espnId} · ${g.venue}. ${sources.espn.note}</p></li>
          <li>${sourceLink('records')}<p>${sources.records.note}</p></li>
          ${g.gameSource?`<li><a href="${g.gameSource}">NBA official game page</a><p>Schedule${g.historySource==='game'?' and historical meetings':''}; checked November 3, 2026.</p></li>`:''}
          ${g.historySource==='rankings'?`<li>${sourceLink('rankings')}<p>${sources.rankings.note}</p></li>`:''}
        </ul>
        <p>Editorial picks are manually updated. Schedule changes and new injury reports require a pregame recheck. No final result is available in this snapshot.</p>
        <a href="/methodology/">Our methodology & limitations →</a>
      </section>
    </article>`,
    'Predictions',
    {
      ogType: 'article',
      keywords: g.seoKeywords || siteMeta.keywords,
      publishedAt: g.publishedAt,
      updatedAt: g.updatedAt,
      schemaGraph: [
        breadcrumbSchema([['Overview', '/'], ['Predictions', '/#predictions'], [`${g.away} vs ${g.home}`, `/${path}/`]]),
        sportsEventSchema(g),
        {
          '@type': 'AnalysisNewsArticle',
          '@id': `${siteMeta.url}/${path}/#article`,
          headline: pageTitle,
          description: pageDesc,
          keywords: g.seoKeywords || siteMeta.keywords,
          datePublished: g.publishedAt,
          dateModified: g.updatedAt,
          inLanguage: 'en-PH',
          author: {'@id': `${siteMeta.url}/#organization`},
          publisher: {'@id': `${siteMeta.url}/#organization`},
          about: {'@id': `${siteMeta.url}/${path}/#event`},
          mainEntityOfPage: `${siteMeta.url}/${path}/`
        }
      ]
    }
  );
}

await page(
  'methodology',
  'How We Predict NBA Games & Matchup Methodology',
  'Learn how Pinoy Ball builds accurate 2026-2027 NBA predictions and betting matchup previews using team form, injury availability, pace and win probabilities.',
  `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">Our methodology</span></nav>
    <header class="article-header">
      <p class="eyebrow">OUR METHODOLOGY · EDITORIAL STANDARDS</p>
      <h1>Every prediction should show its reasoning.</h1>
      <p class="lead">Pinoy Ball’s approach to explaining what could happen before an NBA game, and why. We examine team performance, player availability, tactical matchups and game conditions to form a reasoned view.</p>
      <p class="header-sub">A prediction is a judgment under uncertainty. Our responsibility is to make the evidence, assumptions and limitations visible so readers can assess the conclusion for themselves.</p>
    </header>

    <nav class="toc" aria-label="Methodology sections">
      <div class="toc-title">Topics in our methodology</div>
      <ol>
        <li><a href="#approach">Our approach</a></li>
        <li><a href="#data">Current data coverage</a></li>
        <li><a href="#what-we-analyze">What we analyze (6 pillars)</a></li>
        <li><a href="#process">How evidence becomes a prediction</a></li>
        <li><a href="#preview-structure">What every preview should show</a></li>
        <li><a href="#confidence">Confidence & no-pick decisions</a></li>
        <li><a href="#models">Statistical models & win probabilities</a></li>
        <li><a href="#updates">Updates & late-breaking news</a></li>
        <li><a href="#accountability">Results & accountability</a></li>
        <li><a href="#independence">Editorial independence</a></li>
      </ol>
    </nav>

    <section id="approach" class="method-section">
      <span class="topic-tag">01 · CORE FRAMEWORK</span>
      <h2>Our approach</h2>
      <p class="section-intro">We build every matchup preview around three core questions:</p>
      <div class="method-cards">
        <div class="method-card">
          <span class="card-num">Question 1</span>
          <strong>Who has the advantage?</strong>
          <p>Identify the team with the stronger supporting evidence.</p>
        </div>
        <div class="method-card">
          <span class="card-num">Question 2</span>
          <strong>What creates that advantage?</strong>
          <p>Explain the statistics, matchups and conditions that matter.</p>
        </div>
        <div class="method-card">
          <span class="card-num">Question 3</span>
          <strong>What could change the outcome?</strong>
          <p>Present the opposing case, unresolved information and realistic upset scenarios.</p>
        </div>
      </div>
      <p>The depth of each prediction depends on the quality of the available evidence. We distinguish what we have verified, what we infer and what remains unknown.</p>
    </section>

    <section id="data" class="method-section">
      <span class="topic-tag">02 · DATA & VERIFICATION</span>
      <h2>Current data coverage</h2>
      <p class="section-intro">Each edition identifies the games covered, the sources consulted and when the information was retrieved.</p>
      <div class="info-grid">
        <div class="info-item">
          <strong>Fixtures & start times</strong>
          <p>Checked against the official NBA schedule and public ESPN Scoreboard API, converted to Philippine Standard Time (UTC+8).</p>
        </div>
        <div class="info-item">
          <strong>Records & statistics</strong>
          <p>Team win–loss records and performance metrics are attributed directly to their named sources and retrieval dates.</p>
        </div>
        <div class="info-item">
          <strong>Injury & lineup verification</strong>
          <p>Player availability is treated as confirmed only when supported by an official injury report, team announcement or attributed reporting. An unavailable report never implies both teams are healthy.</p>
        </div>
        <div class="info-item">
          <strong>Preliminary assessments</strong>
          <p>When a preview relies only on records, venue and limited historical context, we label it as a <em>preliminary assessment</em> rather than implying a full injury-adjusted analysis.</p>
        </div>
      </div>
    </section>

    <section id="what-we-analyze" class="method-section">
      <span class="topic-tag">03 · SIX ANALYTICAL PILLARS</span>
      <h2>What we analyze</h2>
      <p class="section-intro">When evaluating an NBA matchup, we break the evidence into six distinct basketball topics:</p>

      <div class="pillars-grid">
        <div class="method-subsection">
          <span class="pillar-num">Pillar 1</span>
          <h3>Team performance and recent form</h3>
          <p>We compare season-long performance with recent results to understand how each team is playing:</p>
          <ul>
            <li>Offensive and defensive efficiency per 100 possessions.</li>
            <li>Net rating and scoring margins.</li>
            <li>Shooting efficiency and shot selection.</li>
            <li>Turnover rates, offensive rebounding and free-throw generation.</li>
            <li>Home and road performance, plus recent opponent quality.</li>
          </ul>
          <p class="pillar-note">A winning streak is supporting context, not a complete explanation. We assess whether results reflect repeatable strengths or hot shooting.</p>
        </div>

        <div class="method-subsection">
          <span class="pillar-num">Pillar 2</span>
          <h3>Historical and head-to-head context</h3>
          <p>Previous meetings can reveal matchup patterns, depending on who played and how rosters changed:</p>
          <ul>
            <li>How recent and comparable the previous meetings are.</li>
            <li>Whether key players and coaching schemes remain involved.</li>
            <li>Recurring advantages in scoring, rebounding or coverage.</li>
            <li>Whether injuries or unusual circumstances shaped earlier games.</li>
          </ul>
          <p class="pillar-note">Older head-to-head results receive less weight when roster or tactical changes make them less representative.</p>
        </div>

        <div class="method-subsection">
          <span class="pillar-num">Pillar 3</span>
          <h3>Player availability and rotation depth</h3>
          <p>A missing player changes how a lineup functions. We examine the role affected, not just scoring averages:</p>
          <ul>
            <li>Confirmed absences and questionable statuses.</li>
            <li>Reported minutes restrictions and return-to-play conditions.</li>
            <li>Impact on ball handling, spacing, rim protection and rebounding.</li>
            <li>Replacement quality, bench depth and likely closing lineups.</li>
          </ul>
          <p class="pillar-note">If a key player’s status is unresolved, we explain how the outlook shifts with and without that player.</p>
        </div>

        <div class="method-subsection">
          <span class="pillar-num">Pillar 4</span>
          <h3>Tactical and individual matchups</h3>
          <p>We assess how each team’s strengths interact with the opponent’s specific weaknesses:</p>
          <ul>
            <li>Interior scoring against rim protection.</li>
            <li>Three-point creation against perimeter defense.</li>
            <li>Pick-and-roll offense against likely defensive coverage.</li>
            <li>Ball pressure vs. turnovers, board size and bench minutes.</li>
          </ul>
          <p class="pillar-note">Tactical conclusions are labeled as editorial analysis unless backed by directly attributed reporting or stats.</p>
        </div>

        <div class="method-subsection">
          <span class="pillar-num">Pillar 5</span>
          <h3>Pace, possessions and scoring conditions</h3>
          <p>We examine the tempo and possession battle likely to shape the game:</p>
          <ul>
            <li>Each team’s preferred pace and transition frequency.</li>
            <li>Half-court execution, turnovers and second-chance points.</li>
            <li>Shot distribution and reliance on three-point volume.</li>
            <li>Which lineup is better positioned to dictate tempo.</li>
          </ul>
          <p class="pillar-note">We publish a projected score range only when a stated estimation method and sufficient data support it.</p>
        </div>

        <div class="method-subsection">
          <span class="pillar-num">Pillar 6</span>
          <h3>Rest, travel and game context</h3>
          <p>We account for schedule spots that affect preparation, energy and rotations:</p>
          <ul>
            <li>Back-to-back games and compressed multi-game stretches.</li>
            <li>Rest advantages and recent starter minute loads.</li>
            <li>Travel demands and home-court environment.</li>
            <li>Confirmed rest plans and regular-season or playoff context.</li>
          </ul>
          <p class="pillar-note">Schedule context informs the read, but never automatically determines the pick.</p>
        </div>
      </div>
    </section>

    <section id="process" class="method-section">
      <span class="topic-tag">04 · EDITORIAL WORKFLOW</span>
      <h2>How evidence becomes a prediction</h2>
      <p class="section-intro">Our editorial process follows a consistent eight-step sequence from verification to publication:</p>
      <ol class="step-list">
        <li><strong>Verify the game.</strong> Confirm the teams, venue, date and Philippine start time.</li>
        <li><strong>Establish the performance baseline.</strong> Review available season statistics and recent form.</li>
        <li><strong>Check comparability.</strong> Account for opponent quality, roster changes and sample size where the evidence allows.</li>
        <li><strong>Assess availability.</strong> Review verified injury and lineup information, flagging unresolved statuses.</li>
        <li><strong>Identify matchup advantages.</strong> Explain which statistical or tactical differences could influence the game.</li>
        <li><strong>Test the opposing case.</strong> Identify the strongest reason the preferred team could lose.</li>
        <li><strong>Choose a lean or no pick.</strong> Match the strength of the conclusion to the strength of the evidence.</li>
        <li><strong>Publish the limitations.</strong> State missing information, important assumptions and conditions that could change the assessment.</li>
      </ol>
      <p>Sources establish the underlying facts. Unless explicitly attributed to a documented model, the final selection is our editorial inference.</p>
    </section>

    <section id="preview-structure" class="method-section">
      <span class="topic-tag">05 · PREVIEW ANATOMY</span>
      <h2>What every preview should show</h2>
      <p class="section-intro">Every Pinoy Ball matchup preview is organized into ten transparent components:</p>
      <div class="anatomy-grid">
        <div><strong>1. Game details</strong><span>Teams, venue and Philippine start time.</span></div>
        <div><strong>2. Publication status</strong><span>When the analysis was published and last updated.</span></div>
        <div><strong>3. Prediction</strong><span>A reasoned lean or a no-pick decision.</span></div>
        <div><strong>4. Supporting evidence</strong><span>The most relevant verified facts and their implications.</span></div>
        <div><strong>5. Key matchup</strong><span>The player, lineup or tactical contest likely to matter.</span></div>
        <div><strong>6. Availability status</strong><span>Confirmed news and unresolved lineup questions.</span></div>
        <div><strong>7. Strongest counterargument</strong><span>The clearest case against our selection.</span></div>
        <div><strong>8. Upset scenario</strong><span>A plausible path to victory for the opposing team.</span></div>
        <div><strong>9. Limitations</strong><span>Missing data and factors not accounted for.</span></div>
        <div><strong>10. Sources</strong><span>References and retrieval dates for material claims.</span></div>
      </div>
    </section>

    <section id="confidence" class="method-section">
      <span class="topic-tag">06 · CONFIDENCE TIERS</span>
      <h2>Confidence and no-pick decisions</h2>
      <p class="section-intro">We distinguish confidence in the available evidence from the numerical probability of a team winning:</p>
      <div class="tier-grid">
        <div class="tier-card">
          <span class="pill neutral">Preliminary assessment</span>
          <p>Important information is missing (such as game-day injury reports) or the available evidence is narrow.</p>
        </div>
        <div class="tier-card">
          <span class="pill">Slight lean</span>
          <p>The evidence favors one team, but meaningful uncertainty or strong counterarguments remain.</p>
        </div>
        <div class="tier-card">
          <span class="pill">Stronger lean</span>
          <p>Multiple relevant factors support the same team, with fewer unresolved issues. Remains a qualitative judgment.</p>
        </div>
        <div class="tier-card">
          <span class="pill neutral">No pick</span>
          <p>The evidence is insufficient, conflicting or too dependent on unresolved information to support a useful selection.</p>
        </div>
      </div>
      <p>These labels are qualitative descriptions, not numerical win probabilities, and do not imply measured historical accuracy.</p>
    </section>

    <section id="models" class="method-section">
      <span class="topic-tag">07 · STATISTICAL STANDARDS</span>
      <h2>Statistical models and win probabilities</h2>
      <p class="section-intro">Qualitative editorial previews do not become model-based forecasts simply because they cite statistics.</p>
      <p>We publish numerical win probabilities only when a documented forecasting method has been evaluated. Any model-based feature must explain:</p>
      <ul>
        <li>Its inputs and treatment of missing data.</li>
        <li>When predictions are generated prior to tip-off.</li>
        <li>How it was tested on games outside its development sample.</li>
        <li>How its performance compares with a simple baseline benchmark.</li>
        <li>Whether its probabilities are calibrated over a meaningful sample size.</li>
        <li>Its known limitations and revision history.</li>
      </ul>
      <p>We do not invent confidence percentages or imply that simulations, injury adjustments or opponent-strength adjustments were performed when they were not.</p>
    </section>

    <section id="updates" class="method-section">
      <span class="topic-tag">08 · REVISION POLICY</span>
      <h2>Updates and late-breaking news</h2>
      <p class="section-intro">A prediction reflects the information verified at its publication time.</p>
      <p>When verified pregame news materially changes an assessment, we:</p>
      <ul>
        <li>Timestamp the update clearly on the preview page.</li>
        <li>Identify the new information and its official or attributed source.</li>
        <li>Explain how the update changes the matchup reasoning.</li>
        <li>State explicitly whether the pick or confidence tier changed.</li>
        <li>Preserve the original prediction and full revision history.</li>
      </ul>
    </section>

    <section id="accountability" class="method-section">
      <span class="topic-tag">09 · TRACK RECORD</span>
      <h2>Results and accountability</h2>
      <p class="section-intro">Predictions remain reviewable after the final whistle in our <a href="/archive/">results archive</a>.</p>
      <ul>
        <li><strong>Permanent record:</strong> We preserve the original selection, publication timestamp, any pregame revisions and the verified final score.</li>
        <li><strong>Separate reporting:</strong> Correct picks, incorrect picks, pending games and no-pick decisions are tallied separately. No-pick decisions are never counted as wins or losses.</li>
        <li><strong>Transparent grading:</strong> Any accuracy summary must state the date range, number of graded picks and grading rules. Unsuccessful picks are never deleted.</li>
        <li><strong>Postgame review:</strong> We examine whether the underlying reasoning held up and which assumptions failed, knowing one win does not prove a method, and one loss does not disprove it.</li>
      </ul>
    </section>

    <section id="independence" class="method-section">
      <span class="topic-tag">10 · EDITORIAL ETHICS</span>
      <h2>Editorial independence</h2>
      <p class="section-intro">Pinoy Ball’s predictions are independent editorial judgments.</p>
      <p>Commercial relationships never determine a selected winner or confidence label. Any sponsorship, affiliate arrangement or paid placement will be clearly disclosed alongside the relevant content. If market odds are referenced in the future, they will be timestamped and attributed with a clear separation between market prices and our editorial analysis.</p>
      <p>Our goal is to earn readers’ trust through verifiable evidence, clear basketball reasoning and an honest record of results.</p>
    </section>
  </article>`,
  'Our methodology',
  {
    ogType: 'article',
    keywords: 'how to predict nba games, nba analysis predictions, nba betting tips and predictions, nba odds and predictions, nba point spread predictions, nba over under predictions, nba expert predictions, 2026-2027 nba predictions methodology',
    publishedAt: '2026-11-03T17:00:00+08:00',
    updatedAt: '2026-11-05T16:00:00+08:00',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['Our methodology', '/methodology/']]),
      {
        '@type': 'AboutPage',
        '@id': `${siteMeta.url}/methodology/#webpage`,
        url: `${siteMeta.url}/methodology/`,
        name: 'How We Predict NBA Games (2026-2027) · NBA Matchup Analysis, Betting Context & Prediction Methodology | Pinoy Ball',
        description: 'Learn how Pinoy Ball builds accurate 2026-2027 NBA predictions and betting matchup previews. See our 6-pillar framework for NBA team form, injury availability, pace, point spread context, over/under totals and win probabilities.',
        isPartOf: {'@id': `${siteMeta.url}/#website`},
        mainEntity: {
          '@type': 'Article',
          '@id': `${siteMeta.url}/methodology/#article`,
          headline: 'How We Predict NBA Games (2026-2027) · NBA Matchup Analysis, Betting Context & Prediction Methodology',
          description: 'Learn how Pinoy Ball builds accurate 2026-2027 NBA predictions and betting matchup previews.',
          keywords: 'how to predict nba games, nba analysis predictions, nba betting tips and predictions, 2026-2027 nba predictions',
          datePublished: '2026-11-03T17:00:00+08:00',
          dateModified: '2026-11-05T16:00:00+08:00',
          inLanguage: 'en-PH',
          author: {'@id': `${siteMeta.url}/#organization`},
          publisher: {'@id': `${siteMeta.url}/#organization`}
        }
      }
    ]
  }
);

await page(
  'schedule',
  '2026-27 NBA Schedule (PHT) & Matchup Previews',
  'Live 2026-2027 NBA schedule today and tomorrow in Philippine Standard Time (PHT). Track ongoing NBA matchups, team records, tip-off times and game predictions.',
  `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">NBA Schedule</span></nav>
    ${fullSlateHtml}
  </article>`,
  'NBA Schedule',
  {
    keywords: '2026-2027 nba schedule, nba games today predictions, nba predictions tomorrow games, nba matchups today, nba live predictions, nba schedule philippine time, nba game previews and predictions',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['NBA Schedule', '/schedule/']]),
      {
        '@type': 'CollectionPage',
        '@id': `${siteMeta.url}/schedule/#webpage`,
        url: `${siteMeta.url}/schedule/`,
        name: '2026-27 NBA Schedule (PHT) & Matchup Previews | Pinoy Ball',
        description: 'Live 2026-2027 NBA schedule today and tomorrow in Philippine Standard Time (PHT). Track ongoing NBA matchups, team records, tip-off times and game predictions.',
        isPartOf: {'@id': `${siteMeta.url}/#website`}
      }
    ]
  }
);

await page(
  'archive',
  '2026-27 NBA Prediction Results & Picks Archive',
  'Track our 2026-2027 NBA predictions record and verified matchup results archive. Transparent scorecard of ongoing NBA game picks, winner leans and final scores.',
  `<article class="article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">Prediction results archive</span></nav>
    <div class="archive-head">
      <div>
        <p class="eyebrow">THE SCORECARD</p>
        <h1>Prediction results archive</h1>
      </div>
      <div class="archive-stats" id="archive-stats" aria-live="polite">
        <span class="stats-label">OVERALL PREDICTION</span>
        <strong class="stats-pct" id="archive-win-pct">${archivePct}</strong>
        <span class="stats-wl" id="archive-wl-count">${archiveWins} Wins · ${archiveLosses} ${archiveLosses===1?'Loss':'Losses'}</span>
      </div>
    </div>
    ${archiveSchedule}
  </article>`,
  'Prediction results archive',
  {
    keywords: 'accurate nba predictions, most accurate nba predictions, nba predictions record, 2026-2027 nba picks results, nba win predictions, nba betting predictions tracker, best nba prediction site',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['Prediction results archive', '/archive/']]),
      {
        '@type': 'CollectionPage',
        '@id': `${siteMeta.url}/archive/#webpage`,
        url: `${siteMeta.url}/archive/`,
        name: '2026-27 NBA Prediction Results & Picks Archive | Pinoy Ball',
        description: 'Track our 2026-2027 NBA predictions record and verified matchup results archive. Transparent scorecard of ongoing NBA game picks, winner leans and final scores.',
        isPartOf: {'@id': `${siteMeta.url}/#website`}
      }
    ]
  }
);

await writeFile('dist/games.json', JSON.stringify(games, null, 2));
await writeFile('dist/schedule.json', JSON.stringify(liveSchedule, null, 2));
await mkdir('dist/assets', {recursive: true});
await copyFile('public/assets/pinoyball-logo.png', 'dist/assets/pinoyball-logo.png');
for (const f of ['style.css', 'app.js', 'favicon.ico', 'favicon.png', 'apple-touch-icon.png']) await copyFile(`public/${f}`, `dist/${f}`);

const sitemapRoutes = [
  ['/', '2026-11-05'],
  ['/schedule/', '2026-11-05'],
  ['/methodology/', '2026-11-05'],
  ['/archive/', '2026-11-05'],
  ...games.map(g => [`/predictions/${g.slug}/`, '2026-11-05'])
];

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map(([route, lastmod]) => `  <url>
    <loc>${siteMeta.url}${route}</loc>
    <lastmod>${lastmod}</lastmod>
  </url>`).join('\n')}
</urlset>
`;

await writeFile('dist/sitemap.xml', sitemapXml);
await writeFile('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${siteMeta.url}/sitemap.xml\n`);
await writeFile('dist/404.html', shell({
  title: 'Page not found',
  desc: 'This page could not be found.',
  canonicalPath: '/404.html',
  noindex: true,
  body: '<div class="article"><h1>That page is off the court.</h1><p>The address may be incorrect.</p><a href="/">Return to the overview →</a></div>'
}));

console.log('Built static site in dist/');
