import crypto from 'node:crypto';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  hasDatabaseUrl,
  listPredictions,
  upsertPrediction,
  deletePrediction
} from '../src/db.mjs';
import {
  SESSION_TTL_MS,
  ADMIN_SECURITY_HEADERS,
  safeEqual,
  getAdminSecretConfig,
  signAdminToken,
  verifySessionFromCookieHeader,
  buildSessionSetCookie,
  buildClearSessionCookie,
  formatDataMjsSource,
  fetchEspnScheduleForPhtDate
} from '../src/admin-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const adminDir = path.resolve(__dirname, '../admin');

const MIME_BY_EXT = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

function jsonResponse(status, payload, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...ADMIN_SECURITY_HEADERS,
      ...extraHeaders
    }
  });
}

function redirectResponse(location) {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      ...ADMIN_SECURITY_HEADERS
    }
  });
}

function resolveAdminPath(url) {
  const explicit = url.searchParams.get('adminPath');
  if (explicit) {
    return explicit.startsWith('/') ? explicit : `/${explicit}`;
  }
  const raw = decodeURIComponent(url.pathname);
  if (raw === '/admin' || raw === '/admin/') return '/';
  if (raw.startsWith('/admin/')) return raw.slice('/admin'.length);
  return raw || '/';
}

function isHttpsRequest(request, url) {
  const proto = request.headers.get('x-forwarded-proto') || url.protocol.replace(':', '');
  return proto === 'https';
}

async function handleRequest(request) {
  try {
    const url = new URL(request.url);
    const adminPath = resolveAdminPath(url);
    const isSecure = isHttpsRequest(request, url);
    const session = verifySessionFromCookieHeader(request.headers.get('cookie') || '');

    // Static admin assets (/admin/assets/admin.css, login.js, admin.js)
    if (
      request.method === 'GET' &&
      (adminPath === '/assets/admin.css' || adminPath === '/assets/login.js' || adminPath === '/assets/admin.js')
    ) {
      if (adminPath === '/assets/admin.js' && !session) {
        return new Response('Unauthorized', {
          status: 401,
          headers: {'Content-Type': 'text/plain; charset=utf-8', ...ADMIN_SECURITY_HEADERS}
        });
      }
      const fileName = path.basename(adminPath);
      const body = await readFile(path.join(adminDir, fileName), 'utf8');
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type': MIME_BY_EXT[path.extname(fileName)] || 'text/plain; charset=utf-8',
          ...ADMIN_SECURITY_HEADERS
        }
      });
    }

    // Auth endpoints
    if (adminPath === '/api/auth/login' && request.method === 'POST') {
      const {expectedEmail, expectedPassword, secret} = getAdminSecretConfig();
      const body = await request.json().catch(() => ({}));
      const emailMatch = safeEqual(String(body.email || '').trim().toLowerCase(), expectedEmail.trim().toLowerCase());
      const passMatch = safeEqual(String(body.password || ''), expectedPassword);
      if (!emailMatch || !passMatch) {
        return jsonResponse(401, {ok: false, error: 'Invalid admin email or password.'});
      }
      const csrfToken = crypto.randomBytes(24).toString('hex');
      const token = signAdminToken(
        {
          email: expectedEmail,
          csrfToken,
          expiresAt: Date.now() + SESSION_TTL_MS
        },
        secret
      );
      return jsonResponse(
        200,
        {ok: true},
        {'Set-Cookie': buildSessionSetCookie(token, isSecure)}
      );
    }

    if (adminPath === '/api/auth/logout' && request.method === 'POST') {
      return jsonResponse(
        200,
        {ok: true},
        {'Set-Cookie': buildClearSessionCookie(isSecure)}
      );
    }

    if (adminPath === '/api/auth/session' && request.method === 'GET') {
      if (!session) return jsonResponse(401, {ok: false});
      return jsonResponse(200, {
        ok: true,
        email: session.email,
        csrfToken: session.csrfToken,
        dbConnected: hasDatabaseUrl(),
        storage: hasDatabaseUrl() ? 'neon-postgres' : 'unconfigured'
      });
    }

    // Login screen
    if (adminPath === '/login' && request.method === 'GET') {
      if (session) return redirectResponse('/admin/');
      const html = await readFile(path.join(adminDir, 'login.html'), 'utf8');
      return new Response(html, {
        status: 200,
        headers: {'Content-Type': 'text/html; charset=utf-8', ...ADMIN_SECURITY_HEADERS}
      });
    }

    // Protected Admin API routes
    if (adminPath.startsWith('/api/')) {
      if (!session) return jsonResponse(401, {ok: false, error: 'Authentication required.'});
      if (request.method !== 'GET') {
        const headerCsrf = request.headers.get('x-csrf-token') || '';
        if (!safeEqual(headerCsrf, session.csrfToken)) {
          return jsonResponse(403, {ok: false, error: 'Invalid CSRF token. Reload the page and try again.'});
        }
      }

      if (adminPath === '/api/schedule' && request.method === 'GET') {
        const phtDate = url.searchParams.get('phtDate') || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(phtDate)) {
          return jsonResponse(400, {ok: false, error: 'Invalid phtDate parameter.'});
        }
        const matches = await fetchEspnScheduleForPhtDate(phtDate);
        return jsonResponse(200, {ok: true, phtDate, matches});
      }

      if (!hasDatabaseUrl()) {
        return jsonResponse(503, {
          ok: false,
          error: 'Neon Postgres DATABASE_URL is not configured on this environment.'
        });
      }

      if (adminPath === '/api/games' && request.method === 'GET') {
        const games = await listPredictions();
        return jsonResponse(200, {ok: true, games, dbConnected: true, storage: 'neon-postgres'});
      }

      if (adminPath === '/api/games' && request.method === 'POST') {
        const body = await request.json().catch(() => ({}));
        const game = body.game;
        const originalSlug = body.originalSlug || game?.slug;
        if (!game || !game.slug || !game.date || !game.home || !game.away) {
          return jsonResponse(400, {ok: false, error: 'Missing required fields (date, slug, away, home).'});
        }
        const saved = await upsertPrediction(game, originalSlug);
        return jsonResponse(200, {ok: true, games: saved, dbConnected: true, storage: 'neon-postgres'});
      }

      if (adminPath === '/api/games' && request.method === 'DELETE') {
        const body = await request.json().catch(() => ({}));
        if (!body?.slug) return jsonResponse(400, {ok: false, error: 'Missing game slug.'});
        const saved = await deletePrediction(body.slug);
        return jsonResponse(200, {ok: true, games: saved, dbConnected: true, storage: 'neon-postgres'});
      }

      if (adminPath === '/api/export-data' && request.method === 'GET') {
        const games = await listPredictions();
        return new Response(formatDataMjsSource(games), {
          status: 200,
          headers: {
            'Content-Type': 'text/javascript; charset=utf-8',
            ...ADMIN_SECURITY_HEADERS
          }
        });
      }

      return jsonResponse(404, {ok: false, error: 'Unknown admin API endpoint.'});
    }

    // Logged-in dashboard view
    if ((adminPath === '/' || adminPath === '') && request.method === 'GET') {
      if (!session) return redirectResponse('/admin/login');
      const html = await readFile(path.join(adminDir, 'index.html'), 'utf8');
      return new Response(html, {
        status: 200,
        headers: {'Content-Type': 'text/html; charset=utf-8', ...ADMIN_SECURITY_HEADERS}
      });
    }

    return redirectResponse(session ? '/admin/' : '/admin/login');
  } catch (err) {
    console.error('[api/admin] Admin handler error:', err);
    return jsonResponse(500, {ok: false, error: err.message || 'Server error'});
  }
}

export async function GET(request) {
  return handleRequest(request);
}

export async function POST(request) {
  return handleRequest(request);
}

export async function DELETE(request) {
  return handleRequest(request);
}
