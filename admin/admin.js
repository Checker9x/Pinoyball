const NBA_TEAMS = [
  {name: 'Atlanta Hawks', abbr: 'ATL', slug: 'hawks', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/atl.png'},
  {name: 'Boston Celtics', abbr: 'BOS', slug: 'celtics', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bos.png'},
  {name: 'Brooklyn Nets', abbr: 'BKN', slug: 'nets', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/bkn.png'},
  {name: 'Charlotte Hornets', abbr: 'CHA', slug: 'hornets', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/cha.png'},
  {name: 'Chicago Bulls', abbr: 'CHI', slug: 'bulls', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/chi.png'},
  {name: 'Cleveland Cavaliers', abbr: 'CLE', slug: 'cavaliers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/cle.png'},
  {name: 'Dallas Mavericks', abbr: 'DAL', slug: 'mavericks', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/dal.png'},
  {name: 'Denver Nuggets', abbr: 'DEN', slug: 'nuggets', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/den.png'},
  {name: 'Detroit Pistons', abbr: 'DET', slug: 'pistons', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/det.png'},
  {name: 'Golden State Warriors', abbr: 'GS', slug: 'warriors', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/gs.png'},
  {name: 'Houston Rockets', abbr: 'HOU', slug: 'rockets', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/hou.png'},
  {name: 'Indiana Pacers', abbr: 'IND', slug: 'pacers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/ind.png'},
  {name: 'LA Clippers', abbr: 'LAC', slug: 'clippers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/lac.png'},
  {name: 'Los Angeles Lakers', abbr: 'LAL', slug: 'lakers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/lal.png'},
  {name: 'Memphis Grizzlies', abbr: 'MEM', slug: 'grizzlies', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mem.png'},
  {name: 'Miami Heat', abbr: 'MIA', slug: 'heat', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mia.png'},
  {name: 'Milwaukee Bucks', abbr: 'MIL', slug: 'bucks', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/mil.png'},
  {name: 'Minnesota Timberwolves', abbr: 'MIN', slug: 'timberwolves', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/min.png'},
  {name: 'New Orleans Pelicans', abbr: 'NO', slug: 'pelicans', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/no.png'},
  {name: 'New York Knicks', abbr: 'NY', slug: 'knicks', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/ny.png'},
  {name: 'Oklahoma City Thunder', abbr: 'OKC', slug: 'thunder', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/okc.png'},
  {name: 'Orlando Magic', abbr: 'ORL', slug: 'magic', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/orl.png'},
  {name: 'Philadelphia 76ers', abbr: 'PHI', slug: '76ers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phi.png'},
  {name: 'Phoenix Suns', abbr: 'PHX', slug: 'suns', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/phx.png'},
  {name: 'Portland Trail Blazers', abbr: 'POR', slug: 'blazers', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/por.png'},
  {name: 'Sacramento Kings', abbr: 'SAC', slug: 'kings', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/sac.png'},
  {name: 'San Antonio Spurs', abbr: 'SA', slug: 'spurs', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/sa.png'},
  {name: 'Toronto Raptors', abbr: 'TOR', slug: 'raptors', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/tor.png'},
  {name: 'Utah Jazz', abbr: 'UTAH', slug: 'jazz', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/utah.png'},
  {name: 'Washington Wizards', abbr: 'WSH', slug: 'wizards', logo: 'https://a.espncdn.com/i/teamlogos/nba/500/scoreboard/wsh.png'}
];

const ADMIN_BASE = window.location.pathname.startsWith('/admin') ? '/admin' : '';
const LOGIN_URL = `${ADMIN_BASE}/login`;
const PUBLIC_BASE = (window.location.hostname === '127.0.0.1' || window.location.hostname === 'localhost')
  ? 'http://127.0.0.1:4173'
  : window.location.origin;

const teamByName = new Map(NBA_TEAMS.map(t => [t.name, t]));
let gamesState = [];
let dateMatchesState = [];
let selectedMatchMeta = null;
let csrfToken = '';
let isDbConnected = false;
let editingOriginalSlug = null;
let pendingDeleteSlug = null;
let scheduleFetchSeq = 0;

const form = document.getElementById('admin-form');
const awaySelect = document.getElementById('f-away');
const homeSelect = document.getElementById('f-home');
const awayLogoImg = document.getElementById('away-logo-preview');
const homeLogoImg = document.getElementById('home-logo-preview');
const awayRecInput = document.getElementById('f-away-record');
const homeRecInput = document.getElementById('f-home-record');
const phtDateInput = document.getElementById('f-pht-date');
const dateGamesTitle = document.getElementById('date-games-title');
const dateGamesCount = document.getElementById('date-games-count');
const dateGamesGrid = document.getElementById('date-games-grid');
const venueInput = document.getElementById('f-venue');
const slugInput = document.getElementById('f-slug');
const pickSelect = document.getElementById('f-pick');
const assessmentInput = document.getElementById('f-assessment');
const summaryInput = document.getElementById('f-summary');
const reasonsInput = document.getElementById('f-reasons');
const analysisInput = document.getElementById('f-analysis');
const keyMatchupInput = document.getElementById('f-key-matchup');
const counterInput = document.getElementById('f-counterargument');
const upsetInput = document.getElementById('f-upset');
const riskInput = document.getElementById('f-risk');
const historyInput = document.getElementById('f-history');
const availabilityInput = document.getElementById('f-availability');
const faqQuestionInput = document.getElementById('f-faq-q');
const faqAnswerInput = document.getElementById('f-faq-a');
const seoTitleInput = document.getElementById('f-seo-title');
const seoDescInput = document.getElementById('f-seo-desc');
const seoKeywordsInput = document.getElementById('f-seo-keywords');
const seoTitleCount = document.getElementById('seo-title-count');
const seoDescCount = document.getElementById('seo-desc-count');
const serpUrlEl = document.getElementById('serp-preview-url');
const serpTitleEl = document.getElementById('serp-preview-title');
const serpDescEl = document.getElementById('serp-preview-desc');
const archivedCheckbox = document.getElementById('f-archived');
const winnerSelect = document.getElementById('f-winner');
const finalScoreInput = document.getElementById('f-final-score');
const submitBtn = document.getElementById('admin-submit');
const resetBtn = document.getElementById('admin-reset');
const downloadDataBtn = document.getElementById('btn-download-data');
const jumpNewBtn = document.getElementById('btn-jump-new');
const statusBanner = document.getElementById('admin-status');
const tableBody = document.getElementById('admin-games-tbody');
const filterDateInput = document.getElementById('filter-date');
const clearDateFilterBtn = document.getElementById('btn-clear-date-filter');
const upcomingStat = document.getElementById('stat-upcoming');
const archivedStat = document.getElementById('stat-archived');
const winPctStat = document.getElementById('stat-win-pct');
const wlSubStat = document.getElementById('stat-wl-sub');
const userEmailEl = document.getElementById('admin-user-email');
const dbBadgeEl = document.getElementById('admin-db-badge');
const publicSiteLink = document.getElementById('public-site-link');
const logoutForm = document.getElementById('logout-form');
const formHeading = document.getElementById('admin-form-heading');
if (publicSiteLink) publicSiteLink.href = `${PUBLIC_BASE}/`;

const deleteDialog = document.getElementById('delete-dialog');
const deleteDialogTarget = document.getElementById('delete-dialog-matchup');

function normalizeDash(str) {
  return String(str || '').trim().replace(/-/g, '–');
}

function isoToPhtDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d);
}

function phtDateToIsoUtc(dateVal) {
  if (!dateVal) return '';
  return `${dateVal}T04:00:00Z`;
}

function tomorrowPhtDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date(Date.now() + 24 * 3600 * 1000));
}

function getSelectedLevel() {
  const checked = form.querySelector('input[name="level"]:checked');
  return checked ? checked.value : 'Slight lean';
}

function setSelectedLevel(val) {
  const radio = form.querySelector(`input[name="level"][value="${CSS.escape(val)}"]`) || form.querySelector('input[name="level"]');
  if (radio) radio.checked = true;
}

function populateTeamSelects() {
  for (const sel of [awaySelect, homeSelect]) {
    sel.replaceChildren();
    for (const t of NBA_TEAMS) {
      const opt = document.createElement('option');
      opt.value = t.name;
      opt.textContent = `${t.name} (${t.abbr})`;
      sel.append(opt);
    }
  }
  awaySelect.value = 'Boston Celtics';
  homeSelect.value = 'Philadelphia 76ers';
}

function syncTeamDependentOptions(preservePick = true) {
  const awayT = teamByName.get(awaySelect.value) || NBA_TEAMS[0];
  const homeT = teamByName.get(homeSelect.value) || NBA_TEAMS[1];
  if (awayLogoImg) awayLogoImg.src = awayT.logo;
  if (homeLogoImg) homeLogoImg.src = homeT.logo;

  const prevPick = pickSelect.value;
  const level = getSelectedLevel();
  pickSelect.replaceChildren();
  for (const o of [
    {value: homeT.name, label: `${homeT.name} (Home)`},
    {value: awayT.name, label: `${awayT.name} (Away)`},
    {value: 'No pick', label: 'No pick / Pass'}
  ]) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    pickSelect.append(opt);
  }
  if (level === 'No pick') {
    pickSelect.value = 'No pick';
  } else if (preservePick && [homeT.name, awayT.name].includes(prevPick)) {
    pickSelect.value = prevPick;
  } else {
    pickSelect.value = homeT.name;
  }

  const prevWin = winnerSelect.value;
  winnerSelect.replaceChildren();
  for (const o of [
    {value: '', label: 'Pending / Not yet decided'},
    {value: homeT.name, label: `${homeT.name} (Home)`},
    {value: awayT.name, label: `${awayT.name} (Away)`}
  ]) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = o.label;
    winnerSelect.append(opt);
  }
  if ([homeT.name, awayT.name].includes(prevWin)) winnerSelect.value = prevWin;
}

function buildSlugForTeams(awayName, homeName, dateStr) {
  const awayT = teamByName.get(awayName) || NBA_TEAMS[0];
  const homeT = teamByName.get(homeName) || NBA_TEAMS[1];
  const dayPart = dateStr || phtDateInput.value || tomorrowPhtDate();
  return `${awayT.slug}-${homeT.slug}-${dayPart}`;
}

function updateAutoSlug() {
  if (editingOriginalSlug) return;
  slugInput.value = buildSlugForTeams(awaySelect.value, homeSelect.value, phtDateInput.value);
}

function clearEditorialContentFields() {
  summaryInput.value = '';
  reasonsInput.value = '';
  analysisInput.value = '';
  keyMatchupInput.value = '';
  counterInput.value = '';
  upsetInput.value = '';
  riskInput.value = '';
  historyInput.value = '';
  availabilityInput.value = '';
  if (faqQuestionInput) faqQuestionInput.value = '';
  if (faqAnswerInput) faqAnswerInput.value = '';
  seoTitleInput.value = '';
  seoDescInput.value = '';
  seoKeywordsInput.value = '';
  archivedCheckbox.checked = false;
  winnerSelect.value = '';
  finalScoreInput.value = '';
  updateSeoCounters();
  form.querySelectorAll('input, select, textarea').forEach(el => syncAria(el));
}

function applyScheduledMatchup(m, focusSummary = false) {
  const candidateSlug = buildSlugForTeams(m.away, m.home, m.phtDate);
  const existingSaved = gamesState.find(
    g => (m.espnId && g.espnId === m.espnId) || g.slug === candidateSlug
  );
  if (existingSaved) {
    selectedMatchMeta = m;
    loadGameIntoForm(existingSaved, false, false);
    highlightSelectedMatchCard();
    return;
  }

  editingOriginalSlug = null;
  selectedMatchMeta = m;
  formHeading.textContent = `Create Prediction: ${m.away} vs ${m.home}`;
  submitBtn.textContent = 'Save Prediction & Publish';

  if (teamByName.has(m.away)) awaySelect.value = m.away;
  if (teamByName.has(m.home)) homeSelect.value = m.home;
  setSelectedLevel('Slight lean');
  syncTeamDependentOptions(false);

  awayRecInput.value = m.awayRecord || '';
  homeRecInput.value = m.homeRecord || '';
  venueInput.value = m.venue || '';
  assessmentInput.value = '';
  slugInput.value = candidateSlug;

  // Keep every editorial content field 100% empty for manual entry
  clearEditorialContentFields();
  highlightSelectedMatchCard();

  if (focusSummary) {
    summaryInput.focus();
  }
}

function highlightSelectedMatchCard() {
  if (!dateGamesGrid) return;
  const activeSlug = slugInput.value.trim();
  const activeEspnId = selectedMatchMeta?.espnId || '';
  for (const btn of dateGamesGrid.querySelectorAll('.matchup-pick-card')) {
    const isSel = (activeEspnId && btn.dataset.espnId === activeEspnId) || btn.dataset.slug === activeSlug;
    btn.classList.toggle('is-selected', Boolean(isSel));
    btn.setAttribute('aria-pressed', String(Boolean(isSel)));
  }
}

function renderDateMatchupCards(phtDate, matches) {
  if (!dateGamesGrid) return;
  const prettyDate = new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(`${phtDate}T04:00:00Z`));
  if (dateGamesTitle) {
    dateGamesTitle.textContent = `Available Team vs Team Games · ${prettyDate} (PHT)`;
  }

  dateGamesGrid.replaceChildren();
  if (!matches.length) {
    if (dateGamesCount) dateGamesCount.textContent = '0 games scheduled on this PHT date (you can still select teams manually below)';
    return;
  }

  if (dateGamesCount) {
    dateGamesCount.textContent = `${matches.length} game${matches.length === 1 ? '' : 's'} — click a matchup to select it`;
  }

  for (const m of matches) {
    const mSlug = buildSlugForTeams(m.away, m.home, m.phtDate);
    const isAlreadySaved = gamesState.some(g => (m.espnId && g.espnId === m.espnId) || g.slug === mSlug);

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'matchup-pick-card';
    card.dataset.espnId = m.espnId;
    card.dataset.slug = mSlug;
    card.setAttribute('aria-pressed', 'false');

    const top = document.createElement('div');
    top.className = 'mpc-top';
    const timeSpan = document.createElement('span');
    timeSpan.textContent = `${m.phtTime} PHT`;
    top.append(timeSpan);

    if (isAlreadySaved) {
      const savedBadge = document.createElement('span');
      savedBadge.className = 'mpc-saved';
      savedBadge.textContent = '✓ Saved · Edit';
      top.append(savedBadge);
    } else {
      const recSpan = document.createElement('span');
      recSpan.textContent = `${m.awayAbbr} ${m.awayRecord || '0–0'} · ${m.homeAbbr} ${m.homeRecord || '0–0'}`;
      top.append(recSpan);
    }

    const teamsRow = document.createElement('div');
    teamsRow.className = 'mpc-teams';
    if (m.awayLogo) {
      const aImg = document.createElement('img');
      aImg.src = m.awayLogo;
      aImg.alt = '';
      aImg.width = 22;
      aImg.height = 22;
      aImg.className = 'teamlogo';
      teamsRow.append(aImg);
    }
    const aName = document.createElement('span');
    aName.textContent = m.away;
    const vsSpan = document.createElement('span');
    vsSpan.className = 'mpc-vs';
    vsSpan.textContent = 'vs';
    teamsRow.append(aName, vsSpan);

    if (m.homeLogo) {
      const hImg = document.createElement('img');
      hImg.src = m.homeLogo;
      hImg.alt = '';
      hImg.width = 22;
      hImg.height = 22;
      hImg.className = 'teamlogo';
      teamsRow.append(hImg);
    }
    const hName = document.createElement('span');
    hName.textContent = m.home;
    teamsRow.append(hName);

    const venueRow = document.createElement('div');
    venueRow.className = 'mpc-venue';
    venueRow.textContent = m.venue || 'NBA Arena';

    card.append(top, teamsRow, venueRow);
    card.addEventListener('click', () => applyScheduledMatchup(m, true));
    dateGamesGrid.append(card);
  }
  highlightSelectedMatchCard();
}

async function loadAvailableGamesForDate(phtDate, autoSelectFirst = false) {
  if (!phtDate || !/^\d{4}-\d{2}-\d{2}$/.test(phtDate)) return;
  const seq = ++scheduleFetchSeq;
  if (dateGamesCount) dateGamesCount.textContent = 'Loading available NBA games…';
  if (dateGamesGrid) dateGamesGrid.replaceChildren();
  try {
    const res = await fetch(`${ADMIN_BASE}/api/schedule?phtDate=${encodeURIComponent(phtDate)}`);
    if (res.status === 401) {
      window.location.assign(LOGIN_URL);
      return;
    }
    const payload = await res.json();
    if (seq !== scheduleFetchSeq) return;
    dateMatchesState = payload.matches || [];
    renderDateMatchupCards(phtDate, dateMatchesState);
    if (autoSelectFirst && !editingOriginalSlug && dateMatchesState.length > 0) {
      const firstUnsaved = dateMatchesState.find(m => {
        const s = buildSlugForTeams(m.away, m.home, m.phtDate);
        return !gamesState.some(g => g.espnId === m.espnId || g.slug === s);
      }) || dateMatchesState[0];
      applyScheduledMatchup(firstUnsaved, false);
    }
  } catch {
    if (seq !== scheduleFetchSeq) return;
    if (dateGamesCount) dateGamesCount.textContent = 'Could not fetch schedule — select teams manually below.';
  }
}

function updateSeoCounters() {
  const tLen = seoTitleInput.value.length;
  const dLen = seoDescInput.value.length;
  seoTitleCount.textContent = tLen ? `${tLen} chars (${tLen + 13} with " | Pinoy Ball")` : '0 chars';
  seoDescCount.textContent = `${dLen} chars`;

  const awayT = teamByName.get(awaySelect.value) || NBA_TEAMS[0];
  const homeT = teamByName.get(homeSelect.value) || NBA_TEAMS[1];
  const d = phtDateInput.value ? new Date(`${phtDateInput.value}T04:00:00Z`) : new Date();
  const shortDate = new Intl.DateTimeFormat('en-US', {timeZone: 'Asia/Manila', month: 'short', day: 'numeric'}).format(d);
  const fullDefaultTitle = `${awayT.name} vs ${homeT.name} NBA Prediction & Pick (${shortDate})`;
  const autoTitle = fullDefaultTitle.length <= 52 ? fullDefaultTitle : `${awayT.abbr} vs ${homeT.abbr} NBA Prediction & Pick (${shortDate})`;
  const effectiveTitle = `${seoTitleInput.value.trim() || autoTitle} | Pinoy Ball`;
  const effectiveDesc = seoDescInput.value.trim() || summaryInput.value.trim() || `${awayT.name} vs ${homeT.name} NBA prediction, matchup analysis and ${shortDate} Philippine Time (PHT) game preview on Pinoy Ball.`;

  if (serpUrlEl) serpUrlEl.textContent = `https://www.pinoyball.com/predictions/${slugInput.value.trim() || '...'}/`;
  if (serpTitleEl) serpTitleEl.textContent = effectiveTitle;
  if (serpDescEl) serpDescEl.textContent = effectiveDesc;
}

function showStatus(msg, isError = false) {
  statusBanner.hidden = false;
  statusBanner.className = `admin-alert ${isError ? 'is-error' : 'is-ok'}`;
  statusBanner.textContent = msg;
}

function formatPhtDateDisplay(iso) {
  return new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(iso));
}

function renderGamesTable() {
  const upcoming = gamesState.filter(g => !g.archived);
  const archived = gamesState.filter(g => g.archived);
  const graded = archived.filter(g => g.level !== 'No pick' && (g.pick === g.home || g.pick === g.away) && g.winner);
  const wins = graded.filter(g => g.pick === g.winner).length;
  const losses = graded.length - wins;
  const winPct = graded.length ? `${Math.round((wins / graded.length) * 1000) / 10}%` : '0%';

  if (upcomingStat) upcomingStat.textContent = String(upcoming.length);
  if (archivedStat) archivedStat.textContent = String(archived.length);
  if (winPctStat) winPctStat.textContent = winPct;
  if (wlSubStat) wlSubStat.textContent = `${wins} ${wins === 1 ? 'Win' : 'Wins'} · ${losses} ${losses === 1 ? 'Loss' : 'Losses'}`;

  const selectedFilterDate = filterDateInput?.value || '';
  const visibleGames = selectedFilterDate
    ? gamesState.filter(g => isoToPhtDate(g.date) === selectedFilterDate)
    : gamesState;

  tableBody.replaceChildren();
  if (!visibleGames.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.className = 'empty-cell';
    td.textContent = selectedFilterDate
      ? `No predictions found for ${selectedFilterDate}.`
      : 'No predictions saved yet. Pick a date above, click a Team vs Team matchup, and write your prediction.';
    tr.append(td);
    tableBody.append(tr);
    return;
  }

  for (const g of visibleGames) {
    const tr = document.createElement('tr');

    const thMatch = document.createElement('th');
    thMatch.scope = 'row';
    const matchWrap = document.createElement('div');
    matchWrap.className = 'tbl-match';
    const awayImg = document.createElement('img');
    awayImg.src = g.awayLogo;
    awayImg.alt = '';
    awayImg.width = 22;
    awayImg.height = 22;
    awayImg.className = 'teamlogo';
    const homeImg = document.createElement('img');
    homeImg.src = g.homeLogo;
    homeImg.alt = '';
    homeImg.width = 22;
    homeImg.height = 22;
    homeImg.className = 'teamlogo';
    const recLabel = g.awayRecord || g.homeRecord ? ` (${g.awayRecord || '—'} / ${g.homeRecord || '—'})` : '';
    const titleSpan = document.createElement('span');
    titleSpan.textContent = `${g.awayAbbr} vs ${g.homeAbbr}${recLabel}`;
    matchWrap.append(awayImg, homeImg, titleSpan);
    thMatch.append(matchWrap);

    const tdDate = document.createElement('td');
    tdDate.textContent = formatPhtDateDisplay(g.date);

    const tdPick = document.createElement('td');
    tdPick.textContent = `${g.pick} (${g.level})`;

    const tdStatus = document.createElement('td');
    const pill = document.createElement('span');
    pill.className = `pill ${g.archived ? 'neutral' : ''}`;
    pill.textContent = g.archived ? `Archived · ${g.winner || 'Pending'}${g.finalScore ? ` (${g.finalScore})` : ''}` : 'Upcoming';
    tdStatus.append(pill);

    const tdActions = document.createElement('td');
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'tbl-actions';

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'button button-sm btn-secondary';
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => loadGameIntoForm(g, false, true));

    const gradeBtn = document.createElement('button');
    gradeBtn.type = 'button';
    gradeBtn.className = 'button button-sm btn-secondary';
    gradeBtn.textContent = g.archived ? 'Update Result' : 'Move to Archive';
    gradeBtn.addEventListener('click', () => loadGameIntoForm(g, true, true));

    const viewLink = document.createElement('a');
    viewLink.href = `${PUBLIC_BASE}/predictions/${g.slug}/`;
    viewLink.target = '_blank';
    viewLink.rel = 'noopener';
    viewLink.className = 'tbl-link';
    viewLink.textContent = 'View ↗';

    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'button button-sm btn-danger';
    delBtn.textContent = 'Delete';
    delBtn.addEventListener('click', () => promptDeleteGame(g));

    actionsWrap.append(editBtn, gradeBtn, viewLink, delBtn);
    tdActions.append(actionsWrap);

    tr.append(thMatch, tdDate, tdPick, tdStatus, tdActions);
    tableBody.append(tr);
  }
}

function loadGameIntoForm(g, jumpToArchive = false, reloadDateSchedule = true) {
  editingOriginalSlug = g.slug;
  formHeading.textContent = `Editing: ${g.away} vs ${g.home}`;
  submitBtn.textContent = 'Update Prediction & Publish';

  awaySelect.value = g.away;
  homeSelect.value = g.home;
  setSelectedLevel(g.level || 'Slight lean');
  syncTeamDependentOptions(false);

  const gamePhtDate = isoToPhtDate(g.date);
  phtDateInput.value = gamePhtDate;
  slugInput.value = g.slug || '';
  awayRecInput.value = g.awayRecord || '';
  homeRecInput.value = g.homeRecord || '';
  venueInput.value = g.venue || '';
  pickSelect.value = g.pick || homeSelect.value;
  assessmentInput.value = g.assessmentType || '';
  summaryInput.value = g.summary || '';
  reasonsInput.value = Array.isArray(g.reasons) ? g.reasons.join('\n') : '';
  analysisInput.value = g.analysis || '';
  keyMatchupInput.value = g.keyMatchup || '';
  counterInput.value = g.counterargument || '';
  upsetInput.value = g.upsetScenario || '';
  riskInput.value = g.risk || '';
  historyInput.value = g.history || '';
  availabilityInput.value = g.availability || '';
  if (faqQuestionInput) faqQuestionInput.value = g.customFaqQuestion || '';
  if (faqAnswerInput) faqAnswerInput.value = g.customFaqAnswer || '';
  seoTitleInput.value = g.seoTitle || '';
  seoDescInput.value = g.seoDescription || '';
  seoKeywordsInput.value = g.seoKeywords || '';
  archivedCheckbox.checked = Boolean(g.archived);
  winnerSelect.value = g.winner || '';
  finalScoreInput.value = g.finalScore || '';

  updateSeoCounters();
  if (reloadDateSchedule && gamePhtDate) {
    loadAvailableGamesForDate(gamePhtDate, false);
  } else {
    highlightSelectedMatchCard();
  }

  if (jumpToArchive) {
    archivedCheckbox.checked = true;
    document.getElementById('archive-fieldset')?.scrollIntoView({behavior: 'smooth', block: 'center'});
    winnerSelect.focus();
  } else if (reloadDateSchedule) {
    formHeading.scrollIntoView({behavior: 'smooth', block: 'start'});
    summaryInput.focus();
  }
}

function resetFormToNew(reloadSchedule = true) {
  editingOriginalSlug = null;
  selectedMatchMeta = null;
  form.reset();
  formHeading.textContent = 'Create New Matchup Prediction';
  submitBtn.textContent = 'Save Prediction & Publish';
  awaySelect.value = 'Boston Celtics';
  homeSelect.value = 'Philadelphia 76ers';
  phtDateInput.value = tomorrowPhtDate();
  setSelectedLevel('Slight lean');
  syncTeamDependentOptions(false);
  updateAutoSlug();

  awayRecInput.value = '';
  homeRecInput.value = '';
  venueInput.value = '';
  assessmentInput.value = '';
  clearEditorialContentFields();

  if (reloadSchedule) {
    loadAvailableGamesForDate(phtDateInput.value, true);
  }
}

function collectGameFromForm() {
  const awayT = teamByName.get(awaySelect.value) || NBA_TEAMS[0];
  const homeT = teamByName.get(homeSelect.value) || NBA_TEAMS[1];
  const awayRecord = normalizeDash(awayRecInput.value);
  const homeRecord = normalizeDash(homeRecInput.value);
  const nowIso = new Date().toISOString();
  const existing = editingOriginalSlug ? gamesState.find(x => x.slug === editingOriginalSlug) : null;
  const level = getSelectedLevel();
  const pick = level === 'No pick' ? 'No pick' : pickSelect.value;
  const reasons = reasonsInput.value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);

  // Use the real ESPN game start timestamp when a scheduled matchup was selected, otherwise date-only
  const matchesSelectedTeams =
    selectedMatchMeta &&
    selectedMatchMeta.away === awayT.name &&
    selectedMatchMeta.home === homeT.name &&
    selectedMatchMeta.phtDate === phtDateInput.value;

  const finalIsoDate = matchesSelectedTeams
    ? selectedMatchMeta.date
    : (existing && isoToPhtDate(existing.date) === phtDateInput.value ? existing.date : phtDateToIsoUtc(phtDateInput.value));

  const isDateOnly = matchesSelectedTeams
    ? false
    : (existing && isoToPhtDate(existing.date) === phtDateInput.value ? Boolean(existing.dateOnly) : true);

  return {
    slug: slugInput.value.trim(),
    espnId: matchesSelectedTeams ? selectedMatchMeta.espnId : (existing?.espnId || ''),
    date: finalIsoDate,
    dateOnly: isDateOnly,
    publishedAt: existing?.publishedAt || nowIso,
    updatedAt: nowIso,
    league: 'NBA',
    venue: venueInput.value.trim(),
    venueCity: matchesSelectedTeams ? (selectedMatchMeta.venueCity || '') : (existing?.venueCity || ''),
    home: homeT.name,
    homeAbbr: homeT.abbr,
    homeLogo: homeT.logo,
    homeRecord,
    away: awayT.name,
    awayAbbr: awayT.abbr,
    awayLogo: awayT.logo,
    awayRecord,
    pick,
    level,
    assessmentType: assessmentInput.value.trim(),
    record: homeRecord || awayRecord ? `${homeRecord || '—'} / ${awayRecord || '—'}` : '',
    seoTitle: seoTitleInput.value.trim(),
    seoDescription: seoDescInput.value.trim(),
    seoKeywords: seoKeywordsInput.value.trim(),
    summary: summaryInput.value.trim(),
    reasons,
    keyMatchup: keyMatchupInput.value.trim(),
    counterargument: counterInput.value.trim(),
    upsetScenario: upsetInput.value.trim(),
    risk: riskInput.value.trim(),
    availability: availabilityInput.value.trim(),
    limitations: '',
    analysis: analysisInput.value.trim(),
    history: historyInput.value.trim(),
    customFaqQuestion: faqQuestionInput ? faqQuestionInput.value.trim() : '',
    customFaqAnswer: faqAnswerInput ? faqAnswerInput.value.trim() : '',
    historySource: null,
    gameSource: null,
    sourceNote: '',
    archived: Boolean(archivedCheckbox.checked),
    winner: archivedCheckbox.checked ? winnerSelect.value : '',
    finalScore: archivedCheckbox.checked ? normalizeDash(finalScoreInput.value) : ''
  };
}

async function persistSave(game, originalSlug) {
  const res = await fetch(`${ADMIN_BASE}/api/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({game, originalSlug})
  });
  if (res.status === 401) {
    window.location.assign(LOGIN_URL);
    throw new Error('Session expired. Please sign in again.');
  }
  const payload = await res.json();
  if (!res.ok || !payload.ok) throw new Error(payload.error || 'Failed to save prediction.');
  gamesState = payload.games;
  return payload.dbConnected
    ? 'Saved prediction to Vercel Neon Postgres — live on Pinoy Ball!'
    : 'Saved prediction locally and rebuilt the public preview!';
}

async function persistDelete(slug) {
  const res = await fetch(`${ADMIN_BASE}/api/games`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': csrfToken
    },
    body: JSON.stringify({slug})
  });
  if (res.status === 401) {
    window.location.assign(LOGIN_URL);
    throw new Error('Session expired. Please sign in again.');
  }
  const payload = await res.json();
  if (!res.ok || !payload.ok) throw new Error(payload.error || 'Failed to delete prediction.');
  gamesState = payload.games;
  return payload.dbConnected
    ? `Deleted "${slug}" from Vercel Neon Postgres.`
    : `Deleted "${slug}" locally and rebuilt the public preview.`;
}

function promptDeleteGame(game) {
  pendingDeleteSlug = game.slug;
  if (deleteDialogTarget) deleteDialogTarget.textContent = `${game.away} vs ${game.home} (${game.slug})`;
  deleteDialog.showModal();
}

deleteDialog?.addEventListener('close', async () => {
  const choice = deleteDialog.returnValue;
  deleteDialog.returnValue = '';
  if (choice === 'delete' && pendingDeleteSlug) {
    const slugToDelete = pendingDeleteSlug;
    pendingDeleteSlug = null;
    try {
      const msg = await persistDelete(slugToDelete);
      if (editingOriginalSlug === slugToDelete) resetFormToNew(false);
      renderGamesTable();
      renderDateMatchupCards(phtDateInput.value, dateMatchesState);
      showStatus(msg, false);
    } catch (err) {
      showStatus(err.message, true);
    }
  } else {
    pendingDeleteSlug = null;
  }
});

if (!('closedBy' in HTMLDialogElement.prototype)) {
  const outside = (e, dialog) => {
    const r = dialog.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  for (const dialog of document.querySelectorAll('dialog[closedby="any"]')) {
    let pressedOutside = false;
    dialog.addEventListener('pointerdown', e => { pressedOutside = outside(e, dialog); });
    dialog.addEventListener('pointerup', e => { if (pressedOutside && outside(e, dialog)) dialog.close(); });
  }
}

async function downloadDataMjsFile() {
  const res = await fetch(`${ADMIN_BASE}/api/export-data`);
  if (res.status === 401) {
    window.location.assign(LOGIN_URL);
    return;
  }
  const text = await res.text();
  const blob = new Blob([text], {type: 'text/javascript;charset=utf-8'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'data.mjs';
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const linkError = (el, shown) => {
  const errorId = el.dataset?.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '').split(/\s+/).filter(id => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
};

const announcer = document.createElement('div');
announcer.setAttribute('aria-live', 'polite');
announcer.classList.add('visually-hidden');
document.body.append(announcer);
let announceTimer;
let announcedField;

const spokenText = node => {
  const copy = node.cloneNode(true);
  copy.querySelectorAll('[aria-hidden="true"]').forEach(n => n.remove());
  copy.querySelectorAll('[role="img"][aria-label]').forEach(n => n.replaceWith(`${n.getAttribute('aria-label')}: `));
  return copy.textContent.replace(/\s+/g, ' ').trim();
};

const announceError = el => {
  const error = document.getElementById(el.dataset.error);
  if (!error) return;
  const label = el.labels?.[0] ? `${spokenText(el.labels[0])}: ` : '';
  clearTimeout(announceTimer);
  announcer.textContent = '';
  announcedField = el;
  announceTimer = setTimeout(() => { announcer.textContent = label + spokenText(error); }, 500);
};

const flagged = new WeakSet();
const announced = new WeakSet();
const supportsUserInvalid = CSS.supports('selector(:user-invalid)');

function syncAria(el, announce = false) {
  if (!el?.matches?.('input, select, textarea')) return;
  const invalid = supportsUserInvalid ? el.matches(':user-invalid') : el.classList.contains('user-invalid-fallback');
  if (invalid) {
    if (announce && !announced.has(el)) {
      announceError(el);
      announced.add(el);
    }
    el.setAttribute('aria-invalid', 'true');
    linkError(el, true);
    flagged.add(el);
  } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
    el.setAttribute('aria-invalid', 'false');
    linkError(el, false);
    flagged.delete(el);
    announced.delete(el);
    if (announcedField === el) {
      clearTimeout(announceTimer);
      announcer.textContent = '';
    }
  }
}

if (!supportsUserInvalid && form) {
  const dirtyState = new WeakMap();
  const updateFallback = input => {
    const isValid = input.validity.valid;
    input.classList.toggle('user-invalid-fallback', !isValid);
    input.classList.toggle('user-valid-fallback', isValid);
    syncAria(input, !isValid);
  };
  form.addEventListener('blur', e => {
    const input = e.target;
    if (!input.checkValidity) return;
    const st = dirtyState.get(input) || {hasInteracted: false, hasBlurred: false};
    st.hasBlurred = true;
    dirtyState.set(input, st);
    if (st.hasInteracted) updateFallback(input);
  }, true);
  form.addEventListener('input', e => {
    const input = e.target;
    if (!input.checkValidity) return;
    const st = dirtyState.get(input) || {hasInteracted: false, hasBlurred: false};
    st.hasInteracted = true;
    dirtyState.set(input, st);
    if (st.hasBlurred) updateFallback(input);
  });
  form.addEventListener('invalid', e => {
    const input = e.target;
    dirtyState.set(input, {hasInteracted: true, hasBlurred: true});
    updateFallback(input);
  }, true);
}

populateTeamSelects();
resetFormToNew(false);

form?.addEventListener('blur', e => syncAria(e.target, true), true);
form?.addEventListener('input', e => {
  if ([seoTitleInput, seoDescInput, summaryInput, slugInput].includes(e.target)) updateSeoCounters();
  if (e.target.hasAttribute('aria-invalid')) syncAria(e.target);
});
form?.addEventListener('change', e => syncAria(e.target, true), true);
form?.addEventListener('invalid', e => {
  announced.add(e.target);
  syncAria(e.target);
}, true);

awaySelect?.addEventListener('change', () => {
  selectedMatchMeta = null;
  syncTeamDependentOptions(false);
  updateAutoSlug();
  updateSeoCounters();
  highlightSelectedMatchCard();
});
homeSelect?.addEventListener('change', () => {
  selectedMatchMeta = null;
  syncTeamDependentOptions(false);
  updateAutoSlug();
  updateSeoCounters();
  highlightSelectedMatchCard();
});

const onDateChanged = () => {
  editingOriginalSlug = null;
  selectedMatchMeta = null;
  updateAutoSlug();
  updateSeoCounters();
  loadAvailableGamesForDate(phtDateInput.value, true);
};
phtDateInput?.addEventListener('change', onDateChanged);
phtDateInput?.addEventListener('input', onDateChanged);

form?.querySelectorAll('input[name="level"]').forEach(r => {
  r.addEventListener('change', () => syncTeamDependentOptions(true));
});
filterDateInput?.addEventListener('change', renderGamesTable);
clearDateFilterBtn?.addEventListener('click', () => {
  if (filterDateInput) filterDateInput.value = '';
  renderGamesTable();
});

resetBtn?.addEventListener('click', () => resetFormToNew(true));
jumpNewBtn?.addEventListener('click', () => {
  resetFormToNew(true);
  formHeading.scrollIntoView({behavior: 'smooth', block: 'start'});
  phtDateInput.focus();
});
downloadDataBtn?.addEventListener('click', downloadDataMjsFile);

logoutForm?.addEventListener('submit', async e => {
  e.preventDefault();
  await fetch(`${ADMIN_BASE}/api/auth/logout`, {method: 'POST', headers: {'X-CSRF-Token': csrfToken}});
  window.location.assign(LOGIN_URL);
});

form?.addEventListener('submit', async e => {
  e.preventDefault();
  if (!form.checkValidity()) {
    const firstInvalid = form.querySelector(':invalid');
    firstInvalid?.focus();
    return;
  }
  submitBtn.disabled = true;
  try {
    const game = collectGameFromForm();
    const msg = await persistSave(game, editingOriginalSlug);
    editingOriginalSlug = game.slug;
    formHeading.textContent = `Editing: ${game.away} vs ${game.home}`;
    submitBtn.textContent = 'Update Prediction & Publish';
    renderGamesTable();
    renderDateMatchupCards(phtDateInput.value, dateMatchesState);
    showStatus(msg, false);
    statusBanner.scrollIntoView({behavior: 'smooth', block: 'nearest'});
  } catch (err) {
    showStatus(err.message, true);
  } finally {
    submitBtn.disabled = false;
  }
});

function updateDbBadge(connected) {
  isDbConnected = Boolean(connected);
  if (!dbBadgeEl) return;
  if (isDbConnected) {
    dbBadgeEl.classList.remove('is-local');
    dbBadgeEl.textContent = '● Neon Postgres Connected';
  } else {
    dbBadgeEl.classList.add('is-local');
    dbBadgeEl.textContent = '● Local File Mode (Use Vercel /admin or set DATABASE_URL)';
  }
}

async function initDashboard() {
  const sessionRes = await fetch(`${ADMIN_BASE}/api/auth/session`);
  if (!sessionRes.ok) {
    window.location.assign(LOGIN_URL);
    return;
  }
  const session = await sessionRes.json();
  csrfToken = session.csrfToken || '';
  if (userEmailEl) userEmailEl.textContent = session.email;
  updateDbBadge(session.dbConnected);

  const gamesRes = await fetch(`${ADMIN_BASE}/api/games`);
  if (gamesRes.ok) {
    const payload = await gamesRes.json();
    gamesState = payload.games || [];
    if (typeof payload.dbConnected === 'boolean') updateDbBadge(payload.dbConnected);
  }
  renderGamesTable();
  await loadAvailableGamesForDate(phtDateInput.value, true);
}

initDashboard();
