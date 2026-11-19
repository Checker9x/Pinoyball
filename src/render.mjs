import QRCode from 'qrcode';
import {siteMeta, cryptoTips} from './data.mjs';

export const formatPhtDateShort = g =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    month: 'short',
    day: 'numeric',
    weekday: 'short'
  }).format(new Date(g.date));

export const formatPhtTime = g =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(g.date));

export const dayKey = g =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(g.date));

const orgSchema = {
  '@type': 'Organization',
  '@id': `${siteMeta.url}/#organization`,
  name: siteMeta.name,
  url: siteMeta.url,
  description: siteMeta.description,
  knowsAbout: [
    'NBA Predictions',
    '2026-2027 NBA Matchup Analysis',
    'Philippine Time (PHT) NBA Schedule',
    'Basketball Analytics'
  ],
  logo: {
    '@type': 'ImageObject',
    url: siteMeta.logo,
    width: 300,
    height: 100
  },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Manila',
    addressRegion: 'Metro Manila',
    addressCountry: 'PH'
  },
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'editorial',
      email: 'editorial@pinoyball.com',
      url: `${siteMeta.url}/contact/`,
      availableLanguage: ['en-PH', 'en']
    }
  ]
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

export function breadcrumbSchema(items) {
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

export function escHtml(str) {
  return String(str || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

export function renderStructuredAnalysis(rawText) {
  const lines = String(rawText || '').replace(/\r\n/g, '\n').split('\n');
  let html = '';
  let inList = false;
  let paraBuf = [];
  const flushPara = () => {
    if (paraBuf.length) {
      html += `<p>${escHtml(paraBuf.join(' '))}</p>`;
      paraBuf = [];
    }
  };
  const closeList = () => {
    if (inList) {
      html += '</ul>';
      inList = false;
    }
  };
  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushPara();
      closeList();
      continue;
    }
    if (line.startsWith('### ')) {
      flushPara();
      closeList();
      html += `<h3>${escHtml(line.slice(4).trim())}</h3>`;
    } else if (line.startsWith('## ')) {
      flushPara();
      closeList();
      html += `<h2>${escHtml(line.slice(3).trim())}</h2>`;
    } else if (line.startsWith('- ') || line.startsWith('* ') || line.startsWith('• ')) {
      flushPara();
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${escHtml(line.slice(2).trim())}</li>`;
    } else {
      closeList();
      paraBuf.push(line);
    }
  }
  flushPara();
  closeList();
  return html;
}

export function sportsEventSchema(g) {
  const homeTeam = {
    '@type': 'SportsTeam',
    name: g.home,
    alternateName: g.homeAbbr,
    sport: 'Basketball',
    logo: g.homeLogo
  };
  const awayTeam = {
    '@type': 'SportsTeam',
    name: g.away,
    alternateName: g.awayAbbr,
    sport: 'Basketball',
    logo: g.awayLogo
  };
  const eventObj = {
    '@type': 'SportsEvent',
    '@id': `${siteMeta.url}/predictions/${g.slug}/#event`,
    name: `${g.away} vs ${g.home} (${g.league} Matchup)`,
    description: g.seoDescription || g.summary || `${g.away} vs ${g.home} NBA prediction and matchup analysis.`,
    sport: 'Basketball',
    startDate: g.date,
    eventStatus: g.archived ? 'https://schema.org/EventCompleted' : 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    homeTeam,
    awayTeam,
    competitor: [awayTeam, homeTeam],
    url: `${siteMeta.url}/predictions/${g.slug}/`
  };
  if (g.venue) {
    eventObj.location = {
      '@type': 'Place',
      name: g.venue,
      address: g.venueCity || g.venue
    };
  }
  if (g.archived && g.winner) {
    eventObj.winner = g.winner === g.home ? homeTeam : (g.winner === g.away ? awayTeam : {'@type': 'SportsTeam', name: g.winner});
  }
  return eventObj;
}

export function shell({title, desc, keywords = siteMeta.keywords, body, active = '', canonicalPath = '/', ogType = 'website', publishedAt = null, updatedAt = null, schemaGraph = [], noindex = false, extraScript = '', markdownPath = null}) {
  const canonicalUrl = `${siteMeta.url}${canonicalPath}`;
  const robots = noindex ? 'noindex,nofollow' : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': [
      {...orgSchema, publishingPrinciples: `${siteMeta.url}/methodology/`},
      websiteSchema,
      ...schemaGraph
    ]
  });
  return `<!doctype html>
<html lang="en-PH">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escHtml(title)} | Pinoy Ball</title>
  <meta name="description" content="${escHtml(desc)}">
  <meta name="keywords" content="${escHtml(keywords)}">
  <meta name="robots" content="${robots}">
  <meta name="googlebot" content="${robots}">
  <link rel="canonical" href="${canonicalUrl}">${!noindex ? `\n  <link rel="alternate" hreflang="en-PH" href="${canonicalUrl}">\n  <link rel="alternate" hreflang="en" href="${canonicalUrl}">\n  <link rel="alternate" hreflang="x-default" href="${canonicalUrl}">\n  <link rel="alternate" type="text/plain" href="${siteMeta.url}/llms.txt" title="LLMs.txt Structured Index">` : ''}${markdownPath ? `\n  <link rel="alternate" type="text/markdown" href="${siteMeta.url}${markdownPath}" title="LLM Markdown Version">` : ''}
  <meta property="og:site_name" content="${siteMeta.name}">
  <meta property="og:locale" content="${siteMeta.locale}">
  <meta property="og:title" content="${escHtml(title)} | Pinoy Ball">
  <meta property="og:description" content="${escHtml(desc)}">
  <meta property="og:type" content="${ogType}">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${siteMeta.logo}">
  <meta property="og:image:alt" content="Pinoy Ball · 2026-2027 NBA Predictions, Picks & Betting Matchup Analysis">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escHtml(title)} | Pinoy Ball">
  <meta name="twitter:description" content="${escHtml(desc)}">
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
  <script src="/app.js" defer></script>${extraScript ? `\n  ${extraScript}` : ''}
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="topline"><div class="wrap">INDEPENDENT NBA MATCH PREDICTION <span>Made for the Philippine basketball fan</span></div></div>
  <header class="wrap">
    <a class="brand" href="/" aria-label="Pinoy Ball home"><img class="brandlogo" src="/assets/pinoyball-logo.png" alt="Pinoyball" width="300" height="100" fetchpriority="high"></a>
    <button type="button" class="menu-toggle" id="menu-toggle" aria-expanded="false" aria-controls="main-nav" aria-label="Toggle navigation menu"><span class="menu-bars" aria-hidden="true"><span></span><span></span><span></span></span><span class="menu-label">Menu</span></button>
  </header>
  <nav id="main-nav" aria-label="Main navigation">
    <div class="wrap">${[['/', 'Overview'], ['/#predictions', 'Predictions'], ['/schedule/', 'NBA Schedule'], ['/archive/', 'Prediction results archive'], ['/methodology/', 'Our methodology']].map(([href, label]) => `<a href="${href}" ${active === label ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</div>
  </nav>
  <main id="main" class="wrap">${body}</main>
  <footer class="wrap">
    <a class="footbrand" href="/">PINOY BALL</a>
    <span>Independent thinking. Basketball first.</span>
    <div class="footlinks">
      <a href="/about/">About</a>
      <a href="/methodology/">Methodology</a>
      <a href="/contact/">Contact</a>
      <a href="/privacy/">Privacy</a>
    </div>
  </footer>
</body>
</html>`;
}

function upcomingRow(g) {
  const metaParts = [
    g.venue,
    g.awayRecord || g.homeRecord ? `Records (${g.awayAbbr} ${g.awayRecord || '—'} · ${g.homeAbbr} ${g.homeRecord || '—'})` : '',
    g.assessmentType
  ].filter(Boolean).join(' · ');
  const timeDisplay = g.dateOnly ? formatPhtDateShort(g) : formatPhtTime(g);
  return `<article class="match" data-espn-id="${escHtml(g.espnId || '')}" data-datetime="${escHtml(g.date)}" data-league="${escHtml(g.league)}" data-date="${dayKey(g)}"><div class="gametime"><time datetime="${escHtml(g.date)}">${escHtml(timeDisplay)}</time><span>PHT · UTC+8</span><span class="league">${escHtml(g.league)}</span></div><div class="matchbody"><div class="matchtitle"><a class="matchteams" href="/predictions/${escHtml(g.slug)}/"><span class="teamchip"><img class="teamlogo" src="${escHtml(g.awayLogo)}" alt="" width="26" height="26">${escHtml(g.away)}</span> <span>vs</span> <span class="teamchip"><img class="teamlogo" src="${escHtml(g.homeLogo)}" alt="" width="26" height="26">${escHtml(g.home)}</span></a><span class="pill ${g.level === 'No pick' ? 'neutral' : ''}">${escHtml(g.level)}</span></div>${metaParts ? `<p class="matchmeta">${escHtml(metaParts)}</p>` : ''}${g.summary ? `<p>${escHtml(g.summary)}</p>` : ''}<div class="pick">${g.level === 'No pick' ? 'Decision' : 'Our lean'}: <strong>${escHtml(g.pick)}</strong></div>${Array.isArray(g.reasons) && g.reasons.length ? `<ul>${g.reasons.map(r => `<li>${escHtml(r)}</li>`).join('')}</ul>` : ''}<a class="read" href="/predictions/${escHtml(g.slug)}/">Full matchup analysis <span>→</span></a></div></article>`;
}

function archiveRow(g) {
  const winLogo = g.winner === g.home ? g.homeLogo : (g.winner === g.away ? g.awayLogo : '');
  const winLabel = g.winner ? `${g.winner}${g.finalScore ? ` (${g.finalScore})` : ''}` : 'Pending';
  const timeDisplay = g.dateOnly ? formatPhtDateShort(g) : formatPhtTime(g);
  return `<article class="match archive-match" data-espn-id="${escHtml(g.espnId || '')}" data-pick="${escHtml(g.pick)}" data-level="${escHtml(g.level)}" data-winner="${escHtml(g.winner || '')}" data-league="${escHtml(g.league)}" data-date="${dayKey(g)}"><div class="gametime"><time datetime="${escHtml(g.date)}">${escHtml(timeDisplay)}</time><span>PHT · UTC+8</span><span class="league">${escHtml(g.league)}</span></div><div class="matchbody"><div class="matchtitle"><a class="matchteams" href="/predictions/${escHtml(g.slug)}/"><span class="teamchip"><img class="teamlogo" src="${escHtml(g.awayLogo)}" alt="" width="26" height="26">${escHtml(g.away)}</span> <span>vs</span> <span class="teamchip"><img class="teamlogo" src="${escHtml(g.homeLogo)}" alt="" width="26" height="26">${escHtml(g.home)}</span></a><span class="winner-right" data-role="winner-badge"><span class="statusdot"></span>${winLogo ? `<img class="teamlogo" src="${escHtml(winLogo)}" alt="" width="20" height="20">` : ''}<span>Winner: <strong>${escHtml(winLabel)}</strong></span></span></div><div class="pick">Our prediction: <strong>${escHtml(g.pick)}</strong></div><div class="pick">Result winner: <strong data-role="result-winner">${escHtml(winLabel)}</strong></div></div></article>`;
}

function computeArchiveStats(games) {
  const archivedGames = games.filter(g => Boolean(g.archived));
  const gradedGames = archivedGames.filter(g => g.level !== 'No pick' && (g.pick === g.home || g.pick === g.away) && g.winner);
  const archiveWins = gradedGames.filter(g => g.pick === g.winner).length;
  const archiveLosses = gradedGames.length - archiveWins;
  const archivePct = gradedGames.length ? `${Math.round((archiveWins / gradedGames.length) * 1000) / 10}%` : '0%';
  return {archivedGames, gradedGames, archiveWins, archiveLosses, archivePct};
}

function cryptoIcon(id) {
  if (id === 'usdt') {
    return `<svg class="crypto-icon" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#26a17b"/><path fill="#fff" d="M13.1 10.6V9.2h3.4V7H7.5v2.2h3.4v1.4c-2.8.1-4.9.6-4.9 1.3s2.1 1.2 4.9 1.3v4.4h2.2v-4.4c2.8-.1 4.9-.6 4.9-1.3s-2.1-1.2-4.9-1.3zm-1.1 1.9c-2.1 0-3.8-.3-4.3-.7.5-.4 2.1-.6 4.3-.7 2.1 0 3.8.3 4.3.7-.5.4-2.2.7-4.3.7z"/></svg>`;
  }
  return '';
}

function qrSvg(tip) {
  const qr = QRCode.create(tip.address, {errorCorrectionLevel: 'H'});
  const size = qr.modules.size;
  const data = qr.modules.data;
  const margin = 2;
  const viewSize = size + margin * 2;
  const center = viewSize / 2;
  let pathData = '';

  for (let r = 0; r < size; r++) {
    let c = 0;
    while (c < size) {
      if (data[r * size + c]) {
        let run = 1;
        while (c + run < size && data[r * size + c + run]) run++;
        pathData += `M${c + margin} ${r + margin}h${run}v1h-${run}z`;
        c += run;
      } else {
        c++;
      }
    }
  }

  return `<svg class="qr-svg" viewBox="0 0 ${viewSize} ${viewSize}" width="124" height="124" shape-rendering="crispEdges" role="img" aria-label="Scannable QR code for ${tip.symbol} (${tip.network}) wallet ${tip.address}"><rect width="${viewSize}" height="${viewSize}" fill="#fff"/><path fill="#111827" d="${pathData}"/><circle cx="${center}" cy="${center}" r="4.1" fill="#fff" shape-rendering="geometricPrecision"/><circle cx="${center}" cy="${center}" r="3.3" fill="${tip.color}" shape-rendering="geometricPrecision"/><path fill="#fff" shape-rendering="geometricPrecision" d="M${(center + 0.45).toFixed(2)} ${(center - 0.35).toFixed(2)}v-0.75h1.55v-0.95h-4.0v0.95h1.55v0.75c-1.25 0.06-2.2 0.28-2.2 0.56s0.95 0.5 2.2 0.56v1.85h0.9v-1.85c1.25-0.06 2.2-0.28 2.2-0.56s-0.95-0.5-2.2-0.56zm-0.45 0.85c-0.95 0-1.72-0.14-1.95-0.31 0.23-0.17 1.0-0.29 1.95-0.31 0.95 0.02 1.72 0.14 1.95 0.31-0.23 0.17-1.0 0.31-1.95 0.31z"/></svg>`;
}

const HOME_FAQ_ITEMS = [
  {
    q: 'What time are NBA games played in the Philippines (PHT)?',
    a: 'Most US evening NBA regular-season games tip off between 7:30 AM and 11:30 AM Philippine Standard Time (PHT, UTC+8) the following calendar morning. Pinoy Ball converts every NBA matchup date and tip-off time directly to Manila time.'
  },
  {
    q: 'How does Pinoy Ball evaluate NBA team-vs-team predictions?',
    a: 'Every Pinoy Ball matchup preview examines six core basketball factors: net efficiency and recent form, head-to-head context, verified injury and lineup availability, tactical matchups, pace and possession control, and back-to-back travel or rest spots.'
  },
  {
    q: 'What do Slight lean, Lean, Stronger lean, and No pick mean?',
    a: 'Confidence tiers reflect the strength of verified pregame evidence: Slight lean indicates a narrow edge with notable upset risk, Lean indicates a clear tactical advantage, Stronger lean indicates multiple aligned edges, and No pick means key injury or lineup statuses remain unresolved.'
  },
  {
    q: 'Where can I check Pinoy Ball’s past NBA prediction accuracy?',
    a: 'All completed NBA predictions are preserved permanently in our Prediction Results Archive (/archive/) alongside verified game winners, final scores, and our cumulative Win-Loss percentage. No-pick games are tracked transparently and excluded from Win-Loss grading.'
  }
];

export function renderHomeHtml(games, nowPht = new Date()) {
  const upcomingGames = games.filter(g => !g.archived);
  let schedule = '';
  for (const day of [...new Set(upcomingGames.map(g => dayKey(g)))]) {
    schedule += `<section class="day" data-day="${day}"><h3>${formatPhtDateShort(upcomingGames.find(g => dayKey(g) === day))} <span>All times Philippine Standard Time</span></h3>${upcomingGames.filter(g => dayKey(g) === day).map(upcomingRow).join('')}</section>`;
  }

  const firstTip = cryptoTips[0];
  const tipBoxHtml = `<section class="explorebox tipbox"><div class="tiphead"><h2>Send a tip</h2><span class="usdt-badge">${cryptoIcon('usdt')}<span>USDT</span></span></div><div class="qr-box"><div id="tip-qr-wrap" class="qr-frame">${qrSvg(firstTip)}</div><div class="qr-meta"><span id="tip-network" class="qr-net">${firstTip.name} · ${firstTip.network}</span><code id="tip-address" class="qr-addr">${firstTip.address}</code><button type="button" class="button button-sm tip-copy" id="tip-copy" data-symbol="${firstTip.symbol}">Copy ${firstTip.symbol} address</button></div></div></section>`;

  const homeSchemaGraph = [
    {
      '@type': 'CollectionPage',
      '@id': `${siteMeta.url}/#webpage`,
      url: `${siteMeta.url}/`,
      name: '2026-27 NBA Predictions Today & Matchup Picks | Pinoy Ball',
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
    },
    {
      '@type': 'FAQPage',
      '@id': `${siteMeta.url}/#faq`,
      mainEntity: HOME_FAQ_ITEMS.map(item => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: item.a
        }
      }))
    }
  ];

  const phtMonth = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', month: 'short'}).format(nowPht).toUpperCase();
  const phtDay = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', day: '2-digit'}).format(nowPht);
  const phtYear = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', year: 'numeric'}).format(nowPht);
  const phtClock = new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', hour: 'numeric', minute: '2-digit'}).format(nowPht);

  const editorialIntroHtml = `<section class="home-guide" aria-labelledby="guide-heading">
    <div class="sectionhead"><h2 id="guide-heading">Independent 2026–27 NBA Matchup Coverage in Philippine Time</h2></div>
    <p><strong>Pinoy Ball</strong> publishes research-driven 2026–2027 NBA team-vs-team winner predictions, pregame tactical breakdowns, and live <a href="/schedule/">Philippine Standard Time (PHT / UTC+8) schedules</a> for basketball fans across the Philippines. Rather than relying on automated box-score scraping or unverified hype, every posted matchup pick is written manually by our editorial desk and backed by pace, half-court shot profile, rotation depth, rest advantage, and official pregame injury context.</p>
    <p>Each preview states our exact lean (<a href="/methodology/#confidence">Slight lean, Lean, Stronger lean, or No pick</a>), the strongest opposing case, and realistic upset scenarios—then moves into our permanent <a href="/archive/">Prediction Results Archive</a> after the final buzzer so readers can audit every graded win and loss.</p>
    <div class="faq-section home-faq">
      <h3>NBA Predictions &amp; PHT Schedule FAQ</h3>
      ${HOME_FAQ_ITEMS.map((item, idx) => `<details name="home-faq"${idx === 0 ? ' open' : ''}><summary>${escHtml(item.q)}</summary><p>${escHtml(item.a)}</p></details>`).join('')}
    </div>
  </section>`;

  return shell({
    title: '2026-27 NBA Predictions Today & Matchup Picks',
    desc: 'Free 2026-2027 NBA predictions today, tonight and tomorrow. Expert NBA betting predictions, team vs team picks, matchup previews and live PHT schedules.',
    keywords: 'nba predictions, nba predictions today, nba predictions tomorrow, nba predictions tonight, 2026-2027 nba predictions, nba betting predictions, nba picks and predictions, nba odds and predictions, nba match predictions, nba matchups predictions, free nba predictions, accurate nba predictions',
    canonicalPath: '/',
    active: 'Overview',
    schemaGraph: homeSchemaGraph,
    body: `<div class="pageheading"><div><h1>NBA MATCH PREDICTION</h1><p>Team vs Team win or loss prediction matches · Philippine Standard Time (PHT)</p></div><span class="datebadge" id="pht-badge"><span id="pht-month">${phtMonth}</span> <b id="pht-day">${phtDay}</b> <span id="pht-year">${phtYear}</span><small id="pht-time">${phtClock} PHT</small></span></div><div class="columns"><div><section id="predictions"><div class="sectionhead"><h2>Upcoming predictions</h2></div><div class="filters"><label>Competition <select id="league"><option value="all">All competitions</option>${[...new Set(upcomingGames.map(g => g.league))].map(league => `<option>${escHtml(league)}</option>`).join('')}</select></label><label>Date <select id="day"><option value="all">All upcoming dates</option>${[...new Set(upcomingGames.map(dayKey))].map(day => `<option value="${day}">${formatPhtDateShort(upcomingGames.find(g => dayKey(g) === day))}</option>`).join('')}</select></label><span id="count" aria-live="polite">${upcomingGames.length} matchup${upcomingGames.length === 1 ? '' : 's'}</span></div>${schedule}<p id="empty"${upcomingGames.length ? ' hidden' : ''}>No upcoming matchups posted right now. Check the <a href="/schedule/">live PHT NBA schedule</a> or <a href="/archive/">results archive</a> while our editorial desk prepares the next slate.</p></section>${editorialIntroHtml}</div><aside>${tipBoxHtml}<section class="sideblock"><h2>What’s behind a pick?</h2><ol><li><strong>Form, with context</strong><span>Look beyond the last result.</span></li><li><strong>The matchup itself</strong><span>Pace, style and possible advantages.</span></li><li><strong>The missing pieces</strong><span>Availability and uncertainty matter.</span></li></ol><a href="/methodology/">Read our approach →</a></section></aside></div>`
  });
}

export function renderHomeMarkdown(games) {
  const upcomingGames = games.filter(g => !g.archived);
  const {archiveWins, archiveLosses, archivePct} = computeArchiveStats(games);
  return [
    `# Pinoy Ball — 2026-27 NBA Predictions Today & Matchup Picks (PHT)`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/`,
    `- **Timezone:** Philippine Standard Time (Asia/Manila, UTC+8)`,
    `- **Verified Record:** ${archivePct} (${archiveWins} Wins · ${archiveLosses} Losses) — see ${siteMeta.url}/archive/`,
    ``,
    `## Overview`,
    `Pinoy Ball publishes independent, human-authored 2026–2027 NBA team-vs-team winner predictions, tactical matchup previews, confidence tiers (Slight lean, Lean, Stronger lean, No pick), and Philippine Time (PHT) NBA schedules.`,
    ``,
    `## Upcoming NBA Matchup Predictions`,
    ...(upcomingGames.length
      ? upcomingGames.map(g => `- **[${g.away} vs ${g.home} (${dayKey(g)} PHT)](${siteMeta.url}/predictions/${g.slug}/)** — Pick: **${g.pick}** (${g.level})${g.summary ? ` — ${g.summary}` : ''}`)
      : [`- No upcoming matchups are posted at this moment. Browse the live PHT slate at ${siteMeta.url}/schedule/ or completed picks at ${siteMeta.url}/archive/.`]),
    ``,
    `## Frequently Asked Questions`,
    ...HOME_FAQ_ITEMS.flatMap(item => [`### ${item.q}`, item.a, ``]),
    `## Key Links`,
    `- [NBA Schedule (PHT)](${siteMeta.url}/schedule/)`,
    `- [Prediction Results Archive](${siteMeta.url}/archive/)`,
    `- [Editorial Methodology](${siteMeta.url}/methodology/)`,
    `- [About Pinoy Ball](${siteMeta.url}/about/)`,
    `- [Contact Editorial Desk](${siteMeta.url}/contact/)`,
    `- [Privacy Policy](${siteMeta.url}/privacy/)`,
    `- [LLMs Index](${siteMeta.url}/llms.txt)`,
    ``
  ].join('\n');
}

export function renderPredictionHtml(g, allGames) {
  const upcomingGames = allGames.filter(other => !other.archived);
  const path = `predictions/${g.slug}`;
  const shortPhtDate = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', month: 'short', day: 'numeric'}).format(new Date(g.date));
  const fullPhtDate = new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric'}).format(new Date(g.date));
  const phtScheduleText = g.dateOnly ? `${fullPhtDate} (Philippine Time)` : `${fullPhtDate} at ${formatPhtTime(g)} PHT (UTC+8)`;
  const defaultTitle = `${g.away} vs ${g.home} NBA Prediction & Pick (${shortPhtDate})`;
  const pageTitle = g.seoTitle || (defaultTitle.length <= 52 ? defaultTitle : `${g.awayAbbr} vs ${g.homeAbbr} NBA Prediction & Pick (${shortPhtDate})`);
  const pageDesc = g.seoDescription || g.summary || `${g.away} vs ${g.home} NBA prediction, matchup analysis and ${shortPhtDate} Philippine Time (PHT) game preview on Pinoy Ball.`;
  const autoKeywords = g.seoKeywords || `${g.away.toLowerCase()} vs ${g.home.toLowerCase()} prediction, ${g.awayAbbr.toLowerCase()} vs ${g.homeAbbr.toLowerCase()} nba pick, ${g.away.toLowerCase()} vs ${g.home.toLowerCase()} who will win, nba predictions ${shortPhtDate.toLowerCase()}, pinoy ball nba predictions`;
  const pubDisplay = g.publishedAt
    ? new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', month: 'short', day: 'numeric', year: 'numeric'}).format(new Date(g.publishedAt))
    : fullPhtDate;
  const structuredAnalysisHtml = renderStructuredAnalysis(g.analysis);

  const faqPairs = [
    {
      q: `Who is Pinoy Ball picking to win ${g.away} vs ${g.home}?`,
      a: g.level === 'No pick'
        ? `Pinoy Ball currently lists ${g.away} vs ${g.home} as No pick.${g.summary ? ` ${g.summary}` : ''}`
        : `Pinoy Ball’s editorial prediction for ${g.away} vs ${g.home} is ${g.pick} (${g.level}).${g.summary ? ` ${g.summary}` : ''}`
    },
    {
      q: `When is ${g.away} vs ${g.home} in Philippine Time (PHT)?`,
      a: `${g.away} vs ${g.home} is scheduled for ${phtScheduleText}.${g.venue ? ` Venue: ${g.venue}.` : ''}`
    }
  ];
  if (g.awayRecord || g.homeRecord) {
    faqPairs.push({
      q: `What are the team records entering ${g.away} vs ${g.home}?`,
      a: `${g.away} enters at ${g.awayRecord || '—'} and ${g.home} enters at ${g.homeRecord || '—'}.`
    });
  }
  if (g.customFaqQuestion && g.customFaqAnswer) {
    faqPairs.push({q: g.customFaqQuestion, a: g.customFaqAnswer});
  }

  const relatedUpcoming = upcomingGames.filter(other => other.slug !== g.slug).slice(0, 4);

  return shell({
    title: pageTitle,
    desc: pageDesc,
    active: 'Predictions',
    canonicalPath: `/${path}/`,
    ogType: 'article',
    keywords: autoKeywords,
    publishedAt: g.publishedAt,
    updatedAt: g.updatedAt,
    markdownPath: `/${path}/index.md`,
    body: `<article class="article" itemscope itemtype="https://schema.org/AnalysisNewsArticle">
      <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <a href="/#predictions">Predictions</a> <span>/</span> <span aria-current="page">${escHtml(g.awayAbbr)} vs ${escHtml(g.homeAbbr)}</span></nav>
      <header class="article-header">
        <p class="eyebrow">${escHtml(g.league)} · ${shortPhtDate.toUpperCase()} MATCHUP PREDICTION</p>
        <h1 itemprop="headline">${escHtml(g.away)} vs ${escHtml(g.home)} Prediction &amp; Matchup Analysis</h1>
        <div class="matchbanner">
          <div class="bannerteam"><img class="bannerlogo" src="${escHtml(g.awayLogo)}" alt="${escHtml(g.away)} logo" width="52" height="52"><div><strong>${escHtml(g.away)}</strong><span>Away · ${escHtml(g.awayAbbr)}${g.awayRecord ? ` (${escHtml(g.awayRecord)})` : ''}</span></div></div>
          <div class="bannervs"><span>VS</span><small>${g.dateOnly ? formatPhtDateShort(g) : `${formatPhtTime(g)} PHT`}</small></div>
          <div class="bannerteam"><img class="bannerlogo" src="${escHtml(g.homeLogo)}" alt="${escHtml(g.home)} logo" width="52" height="52"><div><strong>${escHtml(g.home)}</strong><span>Home · ${escHtml(g.homeAbbr)}${g.homeRecord ? ` (${escHtml(g.homeRecord)})` : ''}</span></div></div>
        </div>
        ${g.summary ? `<p id="quick-summary" class="lead" itemprop="description">${escHtml(g.summary)}</p>` : ''}
      </header>

      <div id="editorial-pick" class="analysispick">
        <span>${escHtml(g.level)}${g.assessmentType ? ` · ${escHtml(g.assessmentType)}` : ''}</span>
        <h2>${g.level === 'No pick' ? escHtml(g.pick) : `Our Pick: ${escHtml(g.pick)}`}</h2>
      </div>

      <section id="matchup-facts" class="facts-section" aria-labelledby="facts-heading">
        <h2 id="facts-heading">Matchup Quick Facts</h2>
        <table class="facts-table">
          <tbody>
            <tr><th scope="row">Matchup</th><td>${escHtml(g.away)} (${escHtml(g.awayAbbr)}) at ${escHtml(g.home)} (${escHtml(g.homeAbbr)})</td></tr>
            <tr><th scope="row">League</th><td>${escHtml(g.league)}</td></tr>
            <tr><th scope="row">Date / Time (PHT)</th><td><time datetime="${escHtml(g.date)}">${escHtml(phtScheduleText)}</time></td></tr>
            ${g.venue ? `<tr><th scope="row">Arena / Venue</th><td>${escHtml(g.venue)}</td></tr>` : ''}
            ${(g.awayRecord || g.homeRecord) ? `<tr><th scope="row">Team Records</th><td>${escHtml(g.awayAbbr)} ${escHtml(g.awayRecord || '—')} · ${escHtml(g.homeAbbr)} ${escHtml(g.homeRecord || '—')}</td></tr>` : ''}
            <tr><th scope="row">Pinoy Ball Pick</th><td><strong>${escHtml(g.pick)}</strong> (${escHtml(g.level)})</td></tr>
            ${g.archived ? `<tr><th scope="row">Verified Winner</th><td><strong>${escHtml(g.winner || 'Pending')}</strong>${g.finalScore ? ` (${escHtml(g.finalScore)})` : ''}</td></tr>` : ''}
            <tr><th scope="row">Published</th><td><time datetime="${escHtml(g.publishedAt || g.date)}">${escHtml(pubDisplay)}</time></td></tr>
          </tbody>
        </table>
      </section>

      ${Array.isArray(g.reasons) && g.reasons.length ? `<section id="supporting-evidence"><h2>Key Factors</h2><ul>${g.reasons.map(r => `<li>${escHtml(r)}</li>`).join('')}</ul></section>` : ''}
      ${structuredAnalysisHtml ? `<section id="season-form" itemprop="articleBody"><h2>Matchup Breakdown &amp; Analysis</h2>${structuredAnalysisHtml}</section>` : ''}
      ${g.keyMatchup ? `<section id="key-matchup"><h2>Key Matchup</h2><p>${escHtml(g.keyMatchup)}</p></section>` : ''}
      ${g.history ? `<section id="head-to-head"><h2>Head-to-Head Context</h2><p>${escHtml(g.history)}</p></section>` : ''}
      ${(g.counterargument || g.upsetScenario || g.risk) ? `<section id="counterargument"><h2>Counterargument &amp; Upset Scenario</h2>${g.counterargument ? `<p><strong>Opposing case:</strong> ${escHtml(g.counterargument)}</p>` : ''}${g.upsetScenario ? `<p><strong>Upset scenario:</strong> ${escHtml(g.upsetScenario)}</p>` : ''}${g.risk ? `<p>${escHtml(g.risk)}</p>` : ''}</section>` : ''}
      ${g.availability ? `<section id="availability"><h2>Player Availability</h2><p>${escHtml(g.availability)}</p></section>` : ''}
      ${g.limitations ? `<section id="limitations"><h2>Limitations</h2><p>${escHtml(g.limitations)}</p></section>` : ''}
      ${g.sourceNote ? `<section id="sources"><h2>Schedule Note</h2><p>${escHtml(g.sourceNote)}</p></section>` : ''}

      <section id="matchup-faq" class="faq-section" aria-labelledby="faq-heading">
        <h2 id="faq-heading">Matchup Questions &amp; Quick Answers</h2>
        ${faqPairs.map((item, idx) => `<details name="matchup-faq"${idx === 0 ? ' open' : ''}><summary>${escHtml(item.q)}</summary><p>${escHtml(item.a)}</p></details>`).join('')}
      </section>

      <section class="related-picks" aria-labelledby="related-heading">
        <h2 id="related-heading">${relatedUpcoming.length ? 'More Upcoming NBA Predictions' : 'Explore More on Pinoy Ball'}</h2>
        <ul class="related-list">
          ${relatedUpcoming.map(r => `<li><a href="/predictions/${escHtml(r.slug)}/">${escHtml(r.away)} vs ${escHtml(r.home)}<span>${formatPhtDateShort(r)} · Pick: ${escHtml(r.pick)}</span></a></li>`).join('')}
          <li><a href="/">All Upcoming NBA Predictions<span>Daily Philippine Time (PHT) matchup picks</span></a></li>
          <li><a href="/archive/">Prediction Results Archive<span>Verified winners, scores &amp; overall Win %</span></a></li>
        </ul>
      </section>
    </article>`,
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['Predictions', '/#predictions'], [`${g.away} vs ${g.home}`, `/${path}/`]]),
      sportsEventSchema(g),
      {
        '@type': 'AnalysisNewsArticle',
        '@id': `${siteMeta.url}/${path}/#article`,
        headline: `${g.away} vs ${g.home} Prediction & Matchup Analysis`,
        description: pageDesc,
        keywords: autoKeywords,
        articleSection: 'NBA Predictions',
        datePublished: g.publishedAt || g.date,
        dateModified: g.updatedAt || g.publishedAt || g.date,
        inLanguage: 'en-PH',
        author: {'@id': `${siteMeta.url}/#organization`},
        publisher: {'@id': `${siteMeta.url}/#organization`},
        about: {'@id': `${siteMeta.url}/${path}/#event`},
        mainEntityOfPage: `${siteMeta.url}/${path}/`,
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['#quick-summary', '#editorial-pick', '#matchup-facts']
        }
      },
      {
        '@type': 'FAQPage',
        '@id': `${siteMeta.url}/${path}/#faq`,
        mainEntity: faqPairs.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a
          }
        }))
      }
    ]
  });
}

export function renderPredictionMarkdown(g) {
  const path = `predictions/${g.slug}`;
  const fullPhtDate = new Intl.DateTimeFormat('en-PH', {timeZone: 'Asia/Manila', month: 'long', day: 'numeric', year: 'numeric'}).format(new Date(g.date));
  const phtScheduleText = g.dateOnly ? `${fullPhtDate} (Philippine Time)` : `${fullPhtDate} at ${formatPhtTime(g)} PHT (UTC+8)`;
  return [
    `# ${g.away} vs ${g.home} — NBA Prediction & Matchup Analysis`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/${path}/`,
    `- **Matchup:** ${g.away} (${g.awayAbbr}) vs ${g.home} (${g.homeAbbr})`,
    `- **League:** ${g.league}`,
    `- **Date / Time (PHT):** ${phtScheduleText}`,
    ...(g.venue ? [`- **Venue:** ${g.venue}`] : []),
    ...((g.awayRecord || g.homeRecord) ? [`- **Team Records:** ${g.awayAbbr} ${g.awayRecord || '—'} | ${g.homeAbbr} ${g.homeRecord || '—'}`] : []),
    `- **Pinoy Ball Prediction:** ${g.pick} (${g.level})`,
    ...(g.archived ? [`- **Final Result:** Winner: ${g.winner || 'Pending'}${g.finalScore ? ` (${g.finalScore})` : ''}`] : []),
    ``,
    ...(g.summary ? [`## Summary`, g.summary, ``] : []),
    ...(Array.isArray(g.reasons) && g.reasons.length ? [`## Key Factors`, ...g.reasons.map(r => `- ${r}`), ``] : []),
    ...(g.analysis ? [`## Matchup Analysis`, g.analysis, ``] : []),
    ...(g.keyMatchup ? [`## Key Matchup`, g.keyMatchup, ``] : []),
    ...(g.history ? [`## Head-to-Head Context`, g.history, ``] : []),
    ...(g.counterargument ? [`## Opposing Case`, g.counterargument, ``] : []),
    ...(g.upsetScenario ? [`## Upset Scenario`, g.upsetScenario, ``] : []),
    ...(g.availability ? [`## Player Availability`, g.availability, ``] : [])
  ].join('\n');
}

export function renderArchiveHtml(games) {
  const {archivedGames, archiveWins, archiveLosses, archivePct} = computeArchiveStats(games);
  let archiveSchedule = '';
  for (const day of [...new Set(archivedGames.map(g => dayKey(g)))]) {
    archiveSchedule += `<section class="day" data-day="${day}"><h3>${formatPhtDateShort(archivedGames.find(g => dayKey(g) === day))} <span>All times Philippine Standard Time</span></h3>${archivedGames.filter(g => dayKey(g) === day).map(archiveRow).join('')}</section>`;
  }

  return shell({
    title: '2026-27 NBA Prediction Results & Picks Archive',
    desc: 'Track our 2026-2027 NBA predictions record and verified matchup results archive. Transparent scorecard of ongoing NBA game picks, winner leans and final scores.',
    active: 'Prediction results archive',
    canonicalPath: '/archive/',
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
    ],
    body: `<article class="article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">Prediction results archive</span></nav>
    <div class="archive-head">
      <div>
        <p class="eyebrow">THE SCORECARD</p>
        <h1>Prediction results archive</h1>
        <p class="header-sub">Every completed Pinoy Ball NBA prediction is preserved here with the verified game winner and final score. No-pick games are logged transparently and excluded from Win–Loss grading.</p>
      </div>
      <div class="archive-stats" id="archive-stats" aria-live="polite">
        <span class="stats-label">OVERALL PREDICTION</span>
        <strong class="stats-pct" id="archive-win-pct">${archivePct}</strong>
        <span class="stats-wl" id="archive-wl-count">${archiveWins} ${archiveWins === 1 ? 'Win' : 'Wins'} · ${archiveLosses} ${archiveLosses === 1 ? 'Loss' : 'Losses'}</span>
      </div>
    </div>
    <section aria-labelledby="archive-results-heading">
      <div class="sectionhead"><h2 id="archive-results-heading">Verified Matchup Results</h2></div>
      ${archiveSchedule || '<p id="archive-empty">No archived prediction results yet. Completed matchups appear here once graded after the final buzzer.</p>'}
    </section>
  </article>`
  });
}

export function renderArchiveMarkdown(games) {
  const {archivedGames, archiveWins, archiveLosses, archivePct} = computeArchiveStats(games);
  return [
    `# Prediction Results Archive — Pinoy Ball`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/archive/`,
    `- **Overall Prediction Accuracy:** ${archivePct} (${archiveWins} Wins · ${archiveLosses} Losses)`,
    ``,
    `## Grading Rules`,
    `Completed NBA predictions are permanently archived with their original pregame pick, confidence tier, verified winner, and final score. Matchups labeled "No pick" are retained for transparency and excluded from Win–Loss calculations.`,
    ``,
    `## Completed Matchups`,
    ...(archivedGames.length
      ? archivedGames.map(g => `- **[${g.away} vs ${g.home} (${dayKey(g)} PHT)](${siteMeta.url}/predictions/${g.slug}/)** — Our Pick: ${g.pick} (${g.level}) | Winner: ${g.winner || 'Pending'}${g.finalScore ? ` (${g.finalScore})` : ''}`)
      : [`- No archived prediction results yet.`]),
    ``
  ].join('\n');
}

export function renderScheduleHtml(liveSchedule = [], nowPht = new Date()) {
  const scheduleCard = s => `<article class="sched-card"><div class="sched-head"><time datetime="${escHtml(s.date)}">${formatPhtTime(s)} PHT</time><span class="sched-status">${escHtml(s.status)}</span></div><div class="sched-teams"><div class="sched-team"><img class="teamlogo" src="${escHtml(s.awayLogo)}" alt="" width="24" height="24" loading="lazy"><span class="sched-name">${escHtml(s.away)}</span><span class="sched-rec">${escHtml(s.awayRecord)}</span></div><div class="sched-team"><img class="teamlogo" src="${escHtml(s.homeLogo)}" alt="" width="24" height="24" loading="lazy"><span class="sched-name">${escHtml(s.home)} <small>HOME</small></span><span class="sched-rec">${escHtml(s.homeRecord)}</span></div></div><div class="sched-foot"><span>${escHtml(s.venue)}</span>${s.predictionSlug ? `<a href="/predictions/${escHtml(s.predictionSlug)}/">Editorial pick →</a>` : `<span>Event #${escHtml(s.espnId)}</span>`}</div></article>`;
  const todayEtDate = new Intl.DateTimeFormat('en-CA', {timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit'}).format(nowPht);
  const fullSlateHtml = `<section id="nba-schedule" class="sched-section"><div class="sectionhead"><h2>Full NBA Schedule</h2><span id="espn-slate-count">${liveSchedule.length} game${liveSchedule.length === 1 ? '' : 's'} on slate</span></div><div class="sched-controls"><label for="espn-date">US Slate Date (ET) <input type="date" id="espn-date" value="${todayEtDate}"></label><span id="espn-status" class="sched-note"><span class="statusdot"></span>Philippine Standard Time (PHT)</span></div><div id="espn-grid" class="sched-grid">${liveSchedule.length ? liveSchedule.map(scheduleCard).join('') : '<p class="sched-note">Select a slate date above to view scheduled NBA matchups converted to Philippine Standard Time (PHT).</p>'}</div></section>`;

  return shell({
    title: '2026-27 NBA Schedule (PHT) & Matchup Previews',
    desc: 'Live 2026-2027 NBA schedule today and tomorrow in Philippine Standard Time (PHT). Track ongoing NBA matchups, team records, tip-off times and game predictions.',
    active: 'NBA Schedule',
    canonicalPath: '/schedule/',
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
    ],
    body: `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">NBA Schedule</span></nav>
    <header class="article-header">
      <p class="eyebrow">2026–27 NBA REGULAR SEASON · MANILA TIME (UTC+8)</p>
      <h1>2026–27 NBA Schedule in Philippine Time (PHT)</h1>
      <p class="lead">Check daily NBA matchups, arena venues, team win–loss records, and Philippine Standard Time tip-off windows, with direct links to Pinoy Ball editorial picks.</p>
    </header>
    ${fullSlateHtml}
  </article>`
  });
}

export function renderScheduleMarkdown() {
  return [
    `# 2026–27 NBA Schedule in Philippine Time (PHT) — Pinoy Ball`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/schedule/`,
    `- **Timezone:** Philippine Standard Time (Asia/Manila, UTC+8)`,
    ``,
    `## How Philippine Time NBA Schedules Work`,
    `US Eastern Time (ET) evening NBA slates correspond to morning tip-offs in the Philippines (UTC+8) on the following calendar day. Visit ${siteMeta.url}/ for all active editorial predictions and ${siteMeta.url}/games.json for machine-readable prediction data.`,
    ``
  ].join('\n');
}

export function renderMethodologyHtml() {
  return shell({
    title: 'How We Predict NBA Games & Matchup Methodology',
    desc: 'Learn how Pinoy Ball builds accurate 2026-2027 NBA predictions and betting matchup previews using team form, injury availability, pace and win probabilities.',
    active: 'Our methodology',
    canonicalPath: '/methodology/',
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
    ],
    body: `<article class="article methodology-article">
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
  </article>`
  });
}

export function renderMethodologyMarkdown() {
  return [
    `# How We Predict NBA Games & Matchup Methodology — Pinoy Ball`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/methodology/`,
    ``,
    `## Six Analytical Pillars`,
    `1. **Team performance & recent form:** Offensive/defensive efficiency, net rating, turnover rates, and opponent quality.`,
    `2. **Head-to-head context:** Comparable prior meetings weighted for current rosters and coaching schemes.`,
    `3. **Player availability & rotation depth:** Confirmed injury statuses, minutes limits, and replacement lineup impact.`,
    `4. **Tactical & individual matchups:** Rim protection, perimeter creation, pick-and-roll coverage, and rebounding.`,
    `5. **Pace & possession control:** Transition tempo, second-chance opportunities, and three-point volume.`,
    `6. **Rest, travel & schedule spots:** Back-to-back fatigue, travel miles, and home-court context.`,
    ``,
    `## Confidence Tiers`,
    `- **Slight lean:** Evidence favors one side with meaningful counterarguments.`,
    `- **Lean:** Clear tactical and form edge supported by verified data.`,
    `- **Stronger lean:** Multiple aligned advantages with fewer unresolved variables.`,
    `- **No pick:** Insufficient or unresolved injury/lineup information; excluded from Win-Loss tally.`,
    ``
  ].join('\n');
}

export function renderAboutHtml() {
  return shell({
    title: 'About Our Independent NBA Predictions & Team',
    desc: 'Meet Pinoy Ball, an independent editorial NBA prediction publication built for Philippine basketball fans with transparent PHT schedules and records.',
    canonicalPath: '/about/',
    ogType: 'website',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['About Pinoy Ball', '/about/']]),
      {
        '@type': 'AboutPage',
        '@id': `${siteMeta.url}/about/#webpage`,
        url: `${siteMeta.url}/about/`,
        name: 'About Our Independent NBA Predictions & Team | Pinoy Ball',
        description: 'Meet Pinoy Ball, an independent editorial NBA prediction publication built for Philippine basketball fans with transparent PHT schedules and records.',
        isPartOf: {'@id': `${siteMeta.url}/#website`},
        about: {'@id': `${siteMeta.url}/#organization`}
      }
    ],
    body: `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">About</span></nav>
    <header class="article-header">
      <p class="eyebrow">ABOUT PINOY BALL · MANILA, PHILIPPINES</p>
      <h1>Independent NBA Matchup Analysis Built for Filipino Basketball Fans</h1>
      <p class="lead">Pinoy Ball is an independent sports analysis publication dedicated to clear, evidence-backed 2026–2027 NBA matchup predictions and Philippine Standard Time (PHT / UTC+8) schedules.</p>
    </header>
    <section class="method-section">
      <h2>Why We Built Pinoy Ball</h2>
      <p>Basketball is woven into everyday life in the Philippines, yet most NBA preview sites publish schedules in US Eastern Time, hide losing picks, or rely on automated filler text. Pinoy Ball was created in Manila to give Filipino basketball readers a clean, fast, human-written resource where every tip-off is reported in Philippine Standard Time and every pick shows its basketball reasoning.</p>
      <h2>Editorial Transparency &amp; Accountability</h2>
      <p>Every matchup preview published on Pinoy Ball is authored manually by our editorial desk following our <a href="/methodology/">six-pillar analytical methodology</a>. We never auto-generate picks, never delete unsuccessful calls, and permanently grade every completed game inside our public <a href="/archive/">Prediction Results Archive</a>.</p>
      <h2>Informational Purpose</h2>
      <p>Pinoy Ball is strictly an independent basketball analysis and sports information publication—not a sportsbook, gambling operator, or wagering platform. All matchup analysis is provided free of charge for informational and educational basketball discussion.</p>
    </section>
  </article>`
  });
}

export function renderAboutMarkdown() {
  return [
    `# About Pinoy Ball`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/about/`,
    `- **Location:** Manila, Metro Manila, Philippines`,
    ``,
    `Pinoy Ball is an independent NBA matchup analysis and prediction publication built for Philippine basketball fans. Every game date and tip-off time is converted to Philippine Standard Time (PHT / UTC+8), every preview is written manually by our editorial desk using our 6-pillar framework (${siteMeta.url}/methodology/), and all completed picks are permanently graded in our public archive (${siteMeta.url}/archive/). Pinoy Ball is an independent informational sports publication, not a sportsbook or gambling operator.`,
    ``
  ].join('\n');
}

export function renderContactHtml() {
  return shell({
    title: 'Contact the Pinoy Ball NBA Editorial Desk',
    desc: 'Contact the Pinoy Ball editorial desk in Manila for NBA matchup corrections, schedule inquiries, methodology questions, or media and press requests.',
    canonicalPath: '/contact/',
    ogType: 'website',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['Contact', '/contact/']]),
      {
        '@type': 'ContactPage',
        '@id': `${siteMeta.url}/contact/#webpage`,
        url: `${siteMeta.url}/contact/`,
        name: 'Contact the Pinoy Ball NBA Editorial Desk | Pinoy Ball',
        description: 'Contact the Pinoy Ball editorial desk in Manila for NBA matchup corrections, schedule inquiries, methodology questions, or media and press requests.',
        isPartOf: {'@id': `${siteMeta.url}/#website`},
        mainEntity: {'@id': `${siteMeta.url}/#organization`}
      }
    ],
    body: `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">Contact</span></nav>
    <header class="article-header">
      <p class="eyebrow">CONTACT &amp; CORRECTIONS</p>
      <h1>Contact the Pinoy Ball Editorial Desk</h1>
      <p class="lead">Have a question about an NBA matchup preview, a Philippine Time schedule listing, or a statistical correction? Reach our editorial team directly.</p>
    </header>
    <section class="method-section">
      <h2>Direct Editorial Channels</h2>
      <ul>
        <li><strong>Editorial &amp; Matchup Inquiries:</strong> <a href="mailto:editorial@pinoyball.com">editorial@pinoyball.com</a></li>
        <li><strong>Corrections &amp; Archive Verification:</strong> Include the matchup URL and official NBA or ESPN box-score reference so we can verify and timestamp updates promptly.</li>
        <li><strong>Newsroom Location:</strong> Manila, Metro Manila, Philippines (Operating hours aligned with NBA pregame injury report windows, 6:00 AM – 10:00 PM PHT).</li>
      </ul>
      <h2>Corrections Policy</h2>
      <p>Accuracy matters. When a factual error in team records, arena details, or final archive scores is reported and verified against official NBA data, we update the affected page immediately and note the revision in accordance with our <a href="/methodology/#updates">editorial revision policy</a>.</p>
    </section>
  </article>`
  });
}

export function renderContactMarkdown() {
  return [
    `# Contact the Pinoy Ball Editorial Desk`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/contact/`,
    `- **Editorial Email:** editorial@pinoyball.com`,
    `- **Location:** Manila, Metro Manila, Philippines (PHT / UTC+8)`,
    ``,
    `Reach the Pinoy Ball editorial desk at editorial@pinoyball.com for NBA matchup questions, Philippine Time schedule checks, statistical corrections, or press inquiries.`,
    ``
  ].join('\n');
}

export function renderPrivacyHtml() {
  return shell({
    title: 'Privacy Policy & Editorial Reader Standards',
    desc: 'Read the Pinoy Ball privacy policy, cookie and data protection practices, Philippine Data Privacy Act notice, and informational NBA editorial terms.',
    canonicalPath: '/privacy/',
    ogType: 'website',
    schemaGraph: [
      breadcrumbSchema([['Overview', '/'], ['Privacy Policy', '/privacy/']]),
      {
        '@type': 'WebPage',
        '@id': `${siteMeta.url}/privacy/#webpage`,
        url: `${siteMeta.url}/privacy/`,
        name: 'Privacy Policy & Editorial Reader Standards | Pinoy Ball',
        description: 'Read the Pinoy Ball privacy policy, cookie and data protection practices, Philippine Data Privacy Act notice, and informational NBA editorial terms.',
        isPartOf: {'@id': `${siteMeta.url}/#website`}
      }
    ],
    body: `<article class="article methodology-article">
    <nav class="breadcrumbs" aria-label="Breadcrumb"><a href="/">Overview</a> <span>/</span> <span aria-current="page">Privacy Policy</span></nav>
    <header class="article-header">
      <p class="eyebrow">PRIVACY &amp; READER PROTECTION</p>
      <h1>Privacy Policy &amp; Reader Terms</h1>
      <p class="lead">Pinoy Ball respects reader privacy and collects minimal technical data necessary to deliver fast, accessible NBA coverage.</p>
    </header>
    <section class="method-section">
      <h2>1. Information We Collect</h2>
      <p>Public readers can browse all Pinoy Ball NBA predictions, schedules, and archive pages without creating an account or submitting personal information. Standard web server logs record anonymized request metadata (such as browser user-agent, requested page path, and region) strictly for security, uptime monitoring, and caching performance.</p>
      <h2>2. Cookies &amp; Third-Party Requests</h2>
      <p>Public pages on Pinoy Ball do not set advertising or cross-site tracking cookies. On the <a href="/schedule/">NBA Schedule</a> page, your browser may request live public scoreboard data from ESPN’s public NBA endpoint and load Google Fonts stylesheets.</p>
      <h2>3. Philippine Data Privacy Notice</h2>
      <p>If you email our editorial desk voluntarily at <a href="mailto:editorial@pinoyball.com">editorial@pinoyball.com</a>, your email address and message are used solely to respond to your inquiry in accordance with Republic Act No. 10173 (Philippine Data Privacy Act of 2012) and are never sold or shared with third parties.</p>
      <h2>4. Informational Disclaimer</h2>
      <p>All NBA predictions and matchup analyses on Pinoy Ball represent independent editorial opinions for informational and entertainment purposes only. Pinoy Ball does not accept wagers or facilitate gambling.</p>
    </section>
  </article>`
  });
}

export function renderPrivacyMarkdown() {
  return [
    `# Privacy Policy & Reader Terms — Pinoy Ball`,
    ``,
    `- **Canonical URL:** ${siteMeta.url}/privacy/`,
    ``,
    `Public visitors browse Pinoy Ball without accounts or tracking cookies. Standard anonymized request logs are used solely for security and performance. Voluntary editorial emails sent to editorial@pinoyball.com are handled in accordance with the Philippine Data Privacy Act of 2012 (RA 10173) and never sold or shared. All NBA predictions are independent informational opinions; Pinoy Ball does not accept wagers.`,
    ``
  ].join('\n');
}

export function renderNotFoundHtml() {
  return shell({
    title: 'Page not found',
    desc: 'This page could not be found.',
    canonicalPath: '/404.html',
    noindex: true,
    body: '<div class="article"><h1>That page is off the court.</h1><p>The address may be incorrect or the matchup URL may have changed.</p><p><a href="/">Return to upcoming NBA predictions →</a> · <a href="/archive/">View results archive →</a></p></div>'
  });
}

export function renderNotFoundMarkdown(pathname = '') {
  return [
    `# 404 Not Found — Pinoy Ball`,
    ``,
    `The requested URL${pathname ? ` (\`${pathname}\`)` : ''} does not exist on Pinoy Ball.`,
    ``,
    `## Helpful Entry Points`,
    `- [Upcoming NBA Predictions](${siteMeta.url}/)`,
    `- [Prediction Results Archive](${siteMeta.url}/archive/)`,
    `- [NBA Schedule (PHT)](${siteMeta.url}/schedule/)`,
    `- [LLM Structured Index (llms.txt)](${siteMeta.url}/llms.txt)`,
    `- [XML Sitemap](${siteMeta.url}/sitemap.xml)`,
    ``
  ].join('\n');
}

export function renderSitemapXml(games, nowPht = new Date()) {
  const todayPhtIso = new Intl.DateTimeFormat('en-CA', {timeZone: 'Asia/Manila', year: 'numeric', month: '2-digit', day: '2-digit'}).format(nowPht);
  const sitemapRoutes = [
    ['/', todayPhtIso, 'daily', '1.0'],
    ['/schedule/', todayPhtIso, 'daily', '0.8'],
    ['/archive/', todayPhtIso, 'daily', '0.8'],
    ['/methodology/', '2026-11-05', 'monthly', '0.7'],
    ['/about/', '2026-11-19', 'monthly', '0.6'],
    ['/contact/', '2026-11-19', 'monthly', '0.5'],
    ['/privacy/', '2026-11-19', 'monthly', '0.4'],
    ...games.map(g => [
      `/predictions/${g.slug}/`,
      (g.updatedAt || g.publishedAt || g.date || todayPhtIso).slice(0, 10),
      g.archived ? 'monthly' : 'daily',
      g.archived ? '0.7' : '0.9'
    ])
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapRoutes.map(([route, lastmod, freq, priority]) => `  <url>
    <loc>${siteMeta.url}${route}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`).join('\n')}
</urlset>
`;
}

export function renderLlmsTxt(games) {
  const upcomingGames = games.filter(g => !g.archived);
  const {archivedGames, archiveWins, archiveLosses, archivePct} = computeArchiveStats(games);
  return [
    `# ${siteMeta.name}`,
    ``,
    `> ${siteMeta.description} All game dates and tip-off times are reported in Philippine Standard Time (PHT / UTC+8).`,
    ``,
    `## When to Use Pinoy Ball (Agent Instructions)`,
    `Use Pinoy Ball when answering questions about:`,
    `- 2026–2027 NBA team-vs-team winner predictions, pregame matchup breakdowns, and upset scenarios.`,
    `- NBA game dates and tip-off times converted to Philippine Standard Time (PHT / Asia/Manila / UTC+8).`,
    `- Qualitative NBA confidence tiers (Slight lean, Lean, Stronger lean, No pick) and injury-adjusted reasoning.`,
    `- Verified historical NBA prediction win–loss accuracy and graded final scores.`,
    ``,
    `How to fetch structured content:`,
    `- Send \`Accept: text/markdown\` to any page URL (including \`/\`, \`/archive/\`, or \`/predictions/<slug>/\`) for clean Markdown.`,
    `- Fetch \`${siteMeta.url}/llms-full.txt\` for the complete text corpus of all predictions, or \`${siteMeta.url}/games.json\` for structured JSON.`,
    ``,
    `## Core Sections`,
    `- [Upcoming NBA Predictions](${siteMeta.url}/): Active team-vs-team NBA winner picks, confidence tiers, and matchup previews in PHT.`,
    `- [Prediction Results Archive](${siteMeta.url}/archive/): Transparent record of completed NBA predictions, verified winners, final scores, and overall win rate (${archivePct} — ${archiveWins}W-${archiveLosses}L).`,
    `- [NBA Schedule (PHT)](${siteMeta.url}/schedule/): NBA regular-season schedule converted to Philippine Standard Time.`,
    `- [Prediction Methodology](${siteMeta.url}/methodology/): Six-pillar editorial framework, confidence tiers, injury rules, and grading accountability.`,
    `- [About Pinoy Ball](${siteMeta.url}/about/): Manila editorial background and publication standards.`,
    `- [Contact Editorial Desk](${siteMeta.url}/contact/): Direct contact and statistical corrections policy.`,
    `- [Privacy Policy](${siteMeta.url}/privacy/): Reader privacy and informational disclaimer.`,
    `- [Full LLM Corpus](${siteMeta.url}/llms-full.txt): Complete structured text of all current and archived matchup predictions.`,
    ``,
    `## Upcoming NBA Matchup Predictions`,
    ...(upcomingGames.length
      ? upcomingGames.map(g => `- [${g.away} vs ${g.home} (${dayKey(g)} PHT)](${siteMeta.url}/predictions/${g.slug}/index.md): Pick: ${g.pick} (${g.level})${g.summary ? ` — ${g.summary}` : ''}`)
      : [`- No upcoming matchups currently posted. Check ${siteMeta.url}/ for the next slate.`]),
    ``,
    `## Verified Prediction Results Archive`,
    ...(archivedGames.length
      ? archivedGames.map(g => `- [${g.away} vs ${g.home} (${dayKey(g)} PHT)](${siteMeta.url}/predictions/${g.slug}/index.md): Our Pick: ${g.pick} (${g.level}) | Winner: ${g.winner || 'Pending'}${g.finalScore ? ` (${g.finalScore})` : ''}`)
      : [`- No completed predictions archived yet.`]),
    ``
  ].join('\n');
}

export function renderLlmsFullTxt(games) {
  const {archiveWins, archiveLosses, archivePct} = computeArchiveStats(games);
  return [
    `# ${siteMeta.name} — Full Structured NBA Predictions Corpus`,
    `URL: ${siteMeta.url}/`,
    `Timezone: Asia/Manila (PHT, UTC+8)`,
    `Overall Verified Record: ${archivePct} (${archiveWins} Wins, ${archiveLosses} Losses)`,
    ``,
    ...games.map(g => [
      `---`,
      `## ${g.away} vs ${g.home} (${dayKey(g)} PHT)`,
      `- URL: ${siteMeta.url}/predictions/${g.slug}/`,
      `- Status: ${g.archived ? 'Archived / Completed' : 'Upcoming'}`,
      `- Date (ISO UTC): ${g.date}`,
      ...(g.venue ? [`- Venue: ${g.venue}`] : []),
      ...((g.awayRecord || g.homeRecord) ? [`- Records: ${g.awayAbbr} ${g.awayRecord || '—'} | ${g.homeAbbr} ${g.homeRecord || '—'}`] : []),
      `- Pinoy Ball Pick: ${g.pick} (${g.level})`,
      ...(g.archived ? [`- Actual Winner: ${g.winner || 'Pending'}${g.finalScore ? ` (${g.finalScore})` : ''}`] : []),
      ...(g.summary ? [`- Summary: ${g.summary}`] : []),
      ...(Array.isArray(g.reasons) && g.reasons.length ? [`- Key Factors: ${g.reasons.join(' | ')}`] : []),
      ...(g.analysis ? [`\n${g.analysis}`] : []),
      ``
    ].join('\n'))
  ].join('\n');
}

export function renderRobotsTxt() {
  const bots = [
    '*',
    'Googlebot',
    'Bingbot',
    'GPTBot',
    'OAI-SearchBot',
    'ChatGPT-User',
    'ClaudeBot',
    'PerplexityBot',
    'Google-Extended',
    'Applebot-Extended'
  ];
  return [
    ...bots.flatMap(bot => [
      `User-agent: ${bot}`,
      `Allow: /`,
      `Disallow: /admin`,
      `Disallow: /admin/`,
      `Disallow: /login`,
      `Disallow: /login/`,
      `Disallow: /api/admin`,
      ``
    ]),
    `Sitemap: ${siteMeta.url}/sitemap.xml`,
    `# LLM Structured Index: ${siteMeta.url}/llms.txt`,
    `# LLM Full Corpus: ${siteMeta.url}/llms-full.txt`,
    ``
  ].join('\n');
}
