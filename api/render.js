import {games as staticGames} from '../src/data.mjs';
import {hasDatabaseUrl, listPredictions} from '../src/db.mjs';
import {
  renderHomeHtml,
  renderArchiveHtml,
  renderPredictionHtml,
  renderPredictionMarkdown,
  renderNotFoundHtml,
  renderSitemapXml,
  renderLlmsTxt,
  renderLlmsFullTxt
} from '../src/render.mjs';

const PUBLIC_CACHE = 'public, max-age=0, s-maxage=1, stale-while-revalidate=30';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const route = url.searchParams.get('route') || 'home';
    const slug = (url.searchParams.get('slug') || '').trim();

    const games = hasDatabaseUrl() ? await listPredictions() : staticGames;
    const nowPht = new Date();

    if (route === 'home') {
      return new Response(renderHomeHtml(games, nowPht), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'archive') {
      return new Response(renderArchiveHtml(games), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'prediction') {
      const found = games.find(g => g.slug === slug);
      if (!found) {
        return new Response(renderNotFoundHtml(), {
          status: 404,
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }
      return new Response(renderPredictionHtml(found, games), {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'prediction-md') {
      const found = games.find(g => g.slug === slug);
      if (!found) {
        return new Response('# 404 Not Found\n', {
          status: 404,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'no-store'
          }
        });
      }
      return new Response(renderPredictionMarkdown(found), {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'sitemap') {
      return new Response(renderSitemapXml(games, nowPht), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'llms') {
      return new Response(renderLlmsTxt(games), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'llms-full') {
      return new Response(renderLlmsFullTxt(games), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'games-json') {
      return new Response(JSON.stringify(games, null, 2), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    return new Response(renderNotFoundHtml(), {
      status: 404,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    console.error('[api/render] Error rendering public route:', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
  }
}
