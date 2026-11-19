import crypto from 'node:crypto';
import {siteMeta, sources, espnScoreboardUrl, nbaSchedule, cryptoTips} from './data.mjs';
import {loadLocalEnv, hasDatabaseUrl, listPredictions} from './db.mjs';

export const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

export const ADMIN_SECURITY_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, private',
  'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet, noimageindex'
};

export function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function parseCookieHeader(cookieHeader = '') {
  const map = {};
  for (const part of String(cookieHeader || '').split(';')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      try {
        map[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        map[part.slice(0, eq).trim()] = part.slice(eq + 1).trim();
      }
    }
  }
  return map;
}

export function getAdminSecretConfig() {
  loadLocalEnv();
  const expectedEmail = process.env.ADMIN_EMAIL || 'admin@pinoyball.com';
  const expectedPassword = process.env.ADMIN_PASSWORD || 'PinoyBall2026!Admin';
  const secret = crypto
    .createHash('sha256')
    .update(`pinoyball:${expectedEmail}:${expectedPassword}`)
    .digest();
  return {expectedEmail, expectedPassword, secret};
}

export function signAdminToken(payloadObj, secret) {
  const payloadB64 = Buffer.from(JSON.stringify(payloadObj), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  return `${payloadB64}.${sig}`;
}

export function verifySessionFromCookieHeader(cookieHeader = '') {
  const rawToken = parseCookieHeader(cookieHeader).pb_admin_sid;
  if (!rawToken || !rawToken.includes('.')) return null;
  const [payloadB64, sig] = rawToken.split('.');
  const {secret} = getAdminSecretConfig();
  const expectedSig = crypto.createHmac('sha256', secret).update(payloadB64).digest('base64url');
  if (!safeEqual(sig, expectedSig)) return null;
  try {
    const data = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'));
    if (!data?.expiresAt || Date.now() > data.expiresAt) return null;
    return data;
  } catch {
    return null;
  }
}

export function buildSessionSetCookie(token, isSecure = false) {
  const flags = [
    `pb_admin_sid=${encodeURIComponent(token)}`,
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    `Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}`
  ];
  if (isSecure) flags.push('Secure');
  return flags.join('; ');
}

export function buildClearSessionCookie(isSecure = false) {
  const flags = [
    'pb_admin_sid=',
    'HttpOnly',
    'SameSite=Strict',
    'Path=/',
    'Max-Age=0'
  ];
  if (isSecure) flags.push('Secure');
  return flags.join('; ');
}

export function sortGamesChronologically(games) {
  return [...games].sort(
    (a, b) => String(a.date).localeCompare(String(b.date)) || String(a.slug).localeCompare(String(b.slug))
  );
}

export function formatDataMjsSource(games) {
  const sorted = sortGamesChronologically(games);
  return (
    `export const siteMeta = ${JSON.stringify(siteMeta, null, 2)};\n\n` +
    `export const sources = ${JSON.stringify(sources, null, 2)};\n\n` +
    `export const espnScoreboardUrl = ${JSON.stringify(espnScoreboardUrl)};\n\n` +
    `export const games = ${JSON.stringify(sorted, null, 2)};\n\n` +
    `export const nbaSchedule = ${JSON.stringify(nbaSchedule, null, 2)};\n\n` +
    `export const cryptoTips = ${JSON.stringify(cryptoTips, null, 2)};\n`
  );
}

export async function fetchEspnScheduleForPhtDate(phtDate) {
  const d0 = new Date(`${phtDate}T00:00:00Z`);
  const prevEt = new Date(d0.getTime() - 86400000).toISOString().slice(0, 10).replaceAll('-', '');
  const sameEt = phtDate.replaceAll('-', '');
  const [r1, r2] = await Promise.all([
    fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${prevEt}`)
      .then(r => (r.ok ? r.json() : {events: []}))
      .catch(() => ({events: []})),
    fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard?dates=${sameEt}`)
      .then(r => (r.ok ? r.json() : {events: []}))
      .catch(() => ({events: []}))
  ]);
  const seen = new Set();
  const matches = [];
  for (const ev of [...(r1.events || []), ...(r2.events || [])]) {
    const id = String(ev.id);
    if (seen.has(id)) continue;
    seen.add(id);
    const isoDate = ev.date?.length === 17 ? ev.date.replace('Z', ':00Z') : ev.date;
    const evPhtDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Manila',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(new Date(isoDate));
    if (evPhtDay !== phtDate) continue;
    const comp = ev.competitions?.[0] || {};
    const away = comp.competitors?.find(c => c.homeAway === 'away') || {};
    const home = comp.competitors?.find(c => c.homeAway === 'home') || {};
    const venueName = comp.venue?.fullName || '';
    const city = comp.venue?.address?.city || '';
    const state = comp.venue?.address?.state || '';
    const phtTime = new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      hour: 'numeric',
      minute: '2-digit'
    }).format(new Date(isoDate));
    matches.push({
      espnId: id,
      date: isoDate,
      phtDate: evPhtDay,
      phtTime,
      status: ev.status?.type?.shortDetail || ev.status?.type?.description || 'Scheduled',
      completed: Boolean(ev.status?.type?.completed || ev.status?.type?.state === 'post'),
      venue: [venueName, city].filter(Boolean).join(', '),
      venueCity: [city, state].filter(Boolean).join(', '),
      away: away.team?.displayName || '',
      awayAbbr: away.team?.abbreviation || '',
      awayLogo: away.team?.logo || '',
      awayRecord: (away.records?.[0]?.summary || '').replace(/-/g, '–'),
      home: home.team?.displayName || '',
      homeAbbr: home.team?.abbreviation || '',
      homeLogo: home.team?.logo || '',
      homeRecord: (home.records?.[0]?.summary || '').replace(/-/g, '–')
    });
  }
  matches.sort((a, b) => String(a.date).localeCompare(String(b.date)));
  return matches;
}

export async function listStoredGames(fallbackLoader = null) {
  if (hasDatabaseUrl()) {
    const games = await listPredictions();
    return {games, dbConnected: true, storage: 'neon-postgres'};
  }
  const games = fallbackLoader ? await fallbackLoader() : [];
  return {games, dbConnected: false, storage: 'local-file'};
}
