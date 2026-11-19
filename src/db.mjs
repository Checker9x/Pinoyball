import {readFileSync} from 'node:fs';
import path from 'node:path';
import {neon} from '@neondatabase/serverless';

let _envLoaded = false;

export function loadLocalEnv() {
  if (_envLoaded) return;
  _envLoaded = true;
  for (const fileName of ['.env.local', '.env']) {
    try {
      const raw = readFileSync(path.resolve(fileName), 'utf8');
      for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq > 0) {
          const key = trimmed.slice(0, eq).trim();
          const val = trimmed.slice(eq + 1).trim().replace(/^['"]|['"]$/g, '');
          if (val && !process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {
      // Optional local env files (not present in serverless runtime)
    }
  }
}

export function getDatabaseConnectionString() {
  loadLocalEnv();
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
  return url.startsWith('postgres') ? url : '';
}

export function hasDatabaseUrl() {
  return Boolean(getDatabaseConnectionString());
}

let _sql = null;
let _sqlUrl = '';

export function getSql() {
  const connStr = getDatabaseConnectionString();
  if (!connStr) {
    throw new Error('DATABASE_URL is not configured.');
  }
  if (!_sql || _sqlUrl !== connStr) {
    _sql = neon(connStr);
    _sqlUrl = connStr;
  }
  return _sql;
}

let _schemaReady = false;

export async function ensureSchema() {
  if (_schemaReady) return;
  const sql = getSql();
  await sql`
    CREATE TABLE IF NOT EXISTS predictions (
      slug TEXT PRIMARY KEY,
      espn_id TEXT NOT NULL DEFAULT '',
      game_date TIMESTAMPTZ NOT NULL,
      date_only BOOLEAN NOT NULL DEFAULT FALSE,
      league TEXT NOT NULL DEFAULT 'NBA',
      away TEXT NOT NULL,
      away_abbr TEXT NOT NULL,
      home TEXT NOT NULL,
      home_abbr TEXT NOT NULL,
      pick TEXT NOT NULL,
      level TEXT NOT NULL,
      archived BOOLEAN NOT NULL DEFAULT FALSE,
      winner TEXT NOT NULL DEFAULT '',
      final_score TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL DEFAULT '',
      payload JSONB NOT NULL,
      published_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_predictions_game_date
    ON predictions (game_date ASC, slug ASC)
  `;
  await sql`
    CREATE INDEX IF NOT EXISTS idx_predictions_archived_date
    ON predictions (archived, game_date ASC)
  `;
  _schemaReady = true;
}

function rowToGame(row) {
  const base = typeof row.payload === 'string' ? JSON.parse(row.payload) : {...(row.payload || {})};
  base.slug = row.slug || base.slug;
  base.espnId = row.espn_id ?? base.espnId ?? '';
  base.dateOnly = Boolean(row.date_only ?? base.dateOnly);
  base.archived = Boolean(row.archived ?? base.archived);
  base.winner = row.winner ?? base.winner ?? '';
  base.finalScore = row.final_score ?? base.finalScore ?? '';
  if (!base.date && row.game_date) {
    base.date = new Date(row.game_date).toISOString();
  }
  return base;
}

export async function listPredictions() {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT slug, espn_id, game_date, date_only, archived, winner, final_score, payload
    FROM predictions
    ORDER BY game_date ASC, slug ASC
  `;
  return rows.map(rowToGame);
}

export async function getPredictionBySlug(slug) {
  await ensureSchema();
  const sql = getSql();
  const rows = await sql`
    SELECT slug, espn_id, game_date, date_only, archived, winner, final_score, payload
    FROM predictions
    WHERE slug = ${slug}
    LIMIT 1
  `;
  return rows.length ? rowToGame(rows[0]) : null;
}

export async function upsertPrediction(game, originalSlug = null) {
  await ensureSchema();
  const sql = getSql();
  const nowIso = new Date().toISOString();
  const normalized = {
    ...game,
    publishedAt: game.publishedAt || nowIso,
    updatedAt: game.updatedAt || nowIso
  };

  if (originalSlug && originalSlug !== normalized.slug) {
    await sql`DELETE FROM predictions WHERE slug = ${originalSlug}`;
  }

  await sql`
    INSERT INTO predictions (
      slug, espn_id, game_date, date_only, league,
      away, away_abbr, home, home_abbr,
      pick, level, archived, winner, final_score, summary,
      payload, published_at, updated_at
    ) VALUES (
      ${normalized.slug},
      ${normalized.espnId || ''},
      ${normalized.date},
      ${Boolean(normalized.dateOnly)},
      ${normalized.league || 'NBA'},
      ${normalized.away},
      ${normalized.awayAbbr || ''},
      ${normalized.home},
      ${normalized.homeAbbr || ''},
      ${normalized.pick},
      ${normalized.level},
      ${Boolean(normalized.archived)},
      ${normalized.winner || ''},
      ${normalized.finalScore || ''},
      ${normalized.summary || ''},
      ${JSON.stringify(normalized)}::jsonb,
      ${normalized.publishedAt},
      ${normalized.updatedAt}
    )
    ON CONFLICT (slug) DO UPDATE SET
      espn_id = EXCLUDED.espn_id,
      game_date = EXCLUDED.game_date,
      date_only = EXCLUDED.date_only,
      league = EXCLUDED.league,
      away = EXCLUDED.away,
      away_abbr = EXCLUDED.away_abbr,
      home = EXCLUDED.home,
      home_abbr = EXCLUDED.home_abbr,
      pick = EXCLUDED.pick,
      level = EXCLUDED.level,
      archived = EXCLUDED.archived,
      winner = EXCLUDED.winner,
      final_score = EXCLUDED.final_score,
      summary = EXCLUDED.summary,
      payload = EXCLUDED.payload,
      updated_at = EXCLUDED.updated_at
  `;

  return listPredictions();
}

export async function deletePrediction(slug) {
  await ensureSchema();
  const sql = getSql();
  await sql`DELETE FROM predictions WHERE slug = ${slug}`;
  return listPredictions();
}
