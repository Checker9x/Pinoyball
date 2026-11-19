import http from 'node:http';
import crypto from 'node:crypto';
import {readFile, writeFile} from 'node:fs/promises';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import path from 'node:path';
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
  sortGamesChronologically,
  formatDataMjsSource,
  fetchEspnScheduleForPhtDate
} from '../src/admin-core.mjs';

const execFileAsync = promisify(execFile);
const adminDir = path.resolve('admin');
const dataFilePath = path.resolve('src/data.mjs');

async function loadLocalDataGames() {
  const mod = await import(`file://${dataFilePath}?t=${Date.now()}-${Math.random()}`);
  return mod.games || [];
}

async function syncDataFileAndBuild(games) {
  const sorted = sortGamesChronologically(games);
  await writeFile(dataFilePath, formatDataMjsSource(sorted), 'utf8');
  await execFileAsync(process.execPath, [path.resolve('scripts/build.mjs')]);
  return sorted;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.setEncoding('utf8');
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 2_000_000) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, status, payload, extraHeaders = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    ...ADMIN_SECURITY_HEADERS,
    ...extraHeaders
  });
  res.end(JSON.stringify(payload));
}

const mime = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8'
};

http.createServer(async (req, res) => {
  try {
    const urlObj = new URL(req.url, 'http://127.0.0.1:4174');
    const rawPathname = decodeURIComponent(urlObj.pathname);
    const pathname = rawPathname === '/admin' || rawPathname === '/admin/'
      ? '/'
      : rawPathname.startsWith('/admin/')
        ? rawPathname.slice('/admin'.length)
        : rawPathname;

    const session = verifySessionFromCookieHeader(req.headers.cookie || '');

    if (pathname === '/assets/admin.css' || pathname === '/assets/login.js' || pathname === '/assets/admin.js') {
      if (pathname === '/assets/admin.js' && !session) {
        res.writeHead(401, {'Content-Type': 'text/plain; charset=utf-8', ...ADMIN_SECURITY_HEADERS});
        return res.end('Unauthorized');
      }
      const fileName = path.basename(pathname);
      const body = await readFile(path.join(adminDir, fileName));
      res.writeHead(200, {'Content-Type': mime[path.extname(fileName)], ...ADMIN_SECURITY_HEADERS});
      return res.end(body);
    }

    if (pathname === '/api/auth/login' && req.method === 'POST') {
      const {expectedEmail, expectedPassword, secret} = getAdminSecretConfig();
      const body = await readJsonBody(req);
      const emailMatch = safeEqual(String(body.email || '').trim().toLowerCase(), expectedEmail.trim().toLowerCase());
      const passMatch = safeEqual(String(body.password || ''), expectedPassword);
      if (!emailMatch || !passMatch) {
        return sendJson(res, 401, {ok: false, error: 'Invalid admin email or password.'});
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
      return sendJson(res, 200, {ok: true}, {'Set-Cookie': buildSessionSetCookie(token, false)});
    }

    if (pathname === '/api/auth/logout' && req.method === 'POST') {
      return sendJson(res, 200, {ok: true}, {'Set-Cookie': buildClearSessionCookie(false)});
    }

    if (pathname === '/api/auth/session' && req.method === 'GET') {
      if (!session) return sendJson(res, 401, {ok: false});
      return sendJson(res, 200, {
        ok: true,
        email: session.email,
        csrfToken: session.csrfToken,
        dbConnected: hasDatabaseUrl(),
        storage: hasDatabaseUrl() ? 'neon-postgres' : 'local-file'
      });
    }

    if (pathname === '/login') {
      if (session) {
        res.writeHead(302, {Location: '/', ...ADMIN_SECURITY_HEADERS});
        return res.end();
      }
      const html = await readFile(path.join(adminDir, 'login.html'));
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', ...ADMIN_SECURITY_HEADERS});
      return res.end(html);
    }

    if (pathname.startsWith('/api/')) {
      if (!session) return sendJson(res, 401, {ok: false, error: 'Authentication required.'});
      if (req.method !== 'GET') {
        const headerCsrf = req.headers['x-csrf-token'] || '';
        if (!safeEqual(headerCsrf, session.csrfToken)) {
          return sendJson(res, 403, {ok: false, error: 'Invalid CSRF token. Reload the page and try again.'});
        }
      }

      if (pathname === '/api/schedule' && req.method === 'GET') {
        const phtDate = urlObj.searchParams.get('phtDate') || '';
        if (!/^\d{4}-\d{2}-\d{2}$/.test(phtDate)) {
          return sendJson(res, 400, {ok: false, error: 'Invalid phtDate parameter.'});
        }
        const matches = await fetchEspnScheduleForPhtDate(phtDate);
        return sendJson(res, 200, {ok: true, phtDate, matches});
      }

      if (pathname === '/api/games' && req.method === 'GET') {
        if (hasDatabaseUrl()) {
          const games = await listPredictions();
          return sendJson(res, 200, {ok: true, games, dbConnected: true, storage: 'neon-postgres'});
        }
        const games = await loadLocalDataGames();
        return sendJson(res, 200, {ok: true, games, dbConnected: false, storage: 'local-file'});
      }

      if (pathname === '/api/games' && req.method === 'POST') {
        const body = await readJsonBody(req);
        const game = body.game;
        const originalSlug = body.originalSlug || game?.slug;
        if (!game || !game.slug || !game.date || !game.home || !game.away) {
          return sendJson(res, 400, {ok: false, error: 'Missing required fields (date, slug, away, home).'});
        }
        if (hasDatabaseUrl()) {
          const saved = await upsertPrediction(game, originalSlug);
          await syncDataFileAndBuild(saved);
          return sendJson(res, 200, {ok: true, games: saved, dbConnected: true, storage: 'neon-postgres'});
        }
        const current = await loadLocalDataGames();
        const filtered = current.filter(g => g.slug !== originalSlug && g.slug !== game.slug);
        filtered.push(game);
        const saved = await syncDataFileAndBuild(filtered);
        return sendJson(res, 200, {ok: true, games: saved, dbConnected: false, storage: 'local-file'});
      }

      if (pathname === '/api/games' && req.method === 'DELETE') {
        const body = await readJsonBody(req);
        if (!body?.slug) return sendJson(res, 400, {ok: false, error: 'Missing game slug.'});
        if (hasDatabaseUrl()) {
          const saved = await deletePrediction(body.slug);
          await syncDataFileAndBuild(saved);
          return sendJson(res, 200, {ok: true, games: saved, dbConnected: true, storage: 'neon-postgres'});
        }
        const current = await loadLocalDataGames();
        const filtered = current.filter(g => g.slug !== body.slug);
        const saved = await syncDataFileAndBuild(filtered);
        return sendJson(res, 200, {ok: true, games: saved, dbConnected: false, storage: 'local-file'});
      }

      if (pathname === '/api/export-data' && req.method === 'GET') {
        const games = hasDatabaseUrl() ? await listPredictions() : await loadLocalDataGames();
        res.writeHead(200, {'Content-Type': 'text/javascript; charset=utf-8', ...ADMIN_SECURITY_HEADERS});
        return res.end(formatDataMjsSource(games));
      }

      return sendJson(res, 404, {ok: false, error: 'Unknown endpoint'});
    }

    if (pathname === '/') {
      if (!session) {
        res.writeHead(302, {Location: '/login', ...ADMIN_SECURITY_HEADERS});
        return res.end();
      }
      const html = await readFile(path.join(adminDir, 'index.html'));
      res.writeHead(200, {'Content-Type': 'text/html; charset=utf-8', ...ADMIN_SECURITY_HEADERS});
      return res.end(html);
    }

    res.writeHead(302, {Location: session ? '/' : '/login', ...ADMIN_SECURITY_HEADERS});
    res.end();
  } catch (err) {
    console.error('[admin-server] Request error:', err);
    sendJson(res, 500, {ok: false, error: err.message || 'Server error'});
  }
}).listen(4174, '127.0.0.1', () => {
  console.log(
    `Private Pinoy Ball Admin Portal: http://127.0.0.1:4174/login (${hasDatabaseUrl() ? 'Neon Postgres connected' : 'local file mode'})`
  );
});
