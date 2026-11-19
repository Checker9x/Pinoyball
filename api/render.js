import {games as staticGames, nbaSchedule} from '../src/data.mjs';
import {hasDatabaseUrl, listPredictions} from '../src/db.mjs';
import {
  renderHomeHtml,
  renderHomeMarkdown,
  renderArchiveHtml,
  renderArchiveMarkdown,
  renderScheduleHtml,
  renderScheduleMarkdown,
  renderMethodologyHtml,
  renderMethodologyMarkdown,
  renderAboutHtml,
  renderAboutMarkdown,
  renderContactHtml,
  renderContactMarkdown,
  renderPrivacyHtml,
  renderPrivacyMarkdown,
  renderPredictionHtml,
  renderPredictionMarkdown,
  renderNotFoundHtml,
  renderNotFoundMarkdown,
  renderSitemapXml,
  renderLlmsTxt,
  renderLlmsFullTxt,
  renderRobotsTxt
} from '../src/render.mjs';

const PUBLIC_CACHE = 'public, max-age=0, s-maxage=1, stale-while-revalidate=30';
const INDEXABLE_ROBOTS = 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

function prefersMarkdown(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return false;
  const htmlIdx = accept.indexOf('text/html');
  const mdIdx = accept.indexOf('text/markdown');
  return htmlIdx === -1 || mdIdx < htmlIdx;
}

function pageResponse({wantMd, htmlFn, mdFn, status = 200, indexable = true, cacheControl = PUBLIC_CACHE}) {
  const body = wantMd ? mdFn() : htmlFn();
  return new Response(body, {
    status,
    headers: {
      'Content-Type': wantMd ? 'text/markdown; charset=utf-8' : 'text/html; charset=utf-8',
      'Cache-Control': cacheControl,
      'X-Robots-Tag': indexable ? INDEXABLE_ROBOTS : 'noindex, nofollow',
      Vary: 'Accept'
    }
  });
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const route = url.searchParams.get('route') || 'home';
    const slug = (url.searchParams.get('slug') || '').trim();
    const reqPath = url.searchParams.get('reqPath') || url.pathname;
    const wantMd = prefersMarkdown(request);

    // Static-context pages that don't require a DB round-trip unless dynamic
    if (route === 'robots') {
      return new Response(renderRobotsTxt(), {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE
        }
      });
    }

    if (route === 'methodology') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderMethodologyHtml(),
        mdFn: () => renderMethodologyMarkdown()
      });
    }

    if (route === 'about') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderAboutHtml(),
        mdFn: () => renderAboutMarkdown()
      });
    }

    if (route === 'contact') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderContactHtml(),
        mdFn: () => renderContactMarkdown()
      });
    }

    if (route === 'privacy') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderPrivacyHtml(),
        mdFn: () => renderPrivacyMarkdown()
      });
    }

    const nowPht = new Date();

    if (route === 'schedule') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderScheduleHtml(nbaSchedule, nowPht),
        mdFn: () => renderScheduleMarkdown()
      });
    }

    if (route === 'not-found') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderNotFoundHtml(),
        mdFn: () => renderNotFoundMarkdown(reqPath),
        status: 404,
        indexable: false,
        cacheControl: 'no-store'
      });
    }

    const games = hasDatabaseUrl() ? await listPredictions() : staticGames;

    if (route === 'home') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderHomeHtml(games, nowPht),
        mdFn: () => renderHomeMarkdown(games)
      });
    }

    if (route === 'archive') {
      return pageResponse({
        wantMd,
        htmlFn: () => renderArchiveHtml(games),
        mdFn: () => renderArchiveMarkdown(games)
      });
    }

    if (route === 'prediction') {
      const found = games.find(g => g.slug === slug);
      if (!found) {
        return pageResponse({
          wantMd,
          htmlFn: () => renderNotFoundHtml(),
          mdFn: () => renderNotFoundMarkdown(`/predictions/${slug}/`),
          status: 404,
          indexable: false,
          cacheControl: 'no-store'
        });
      }
      return pageResponse({
        wantMd,
        htmlFn: () => renderPredictionHtml(found, games),
        mdFn: () => renderPredictionMarkdown(found)
      });
    }

    if (route === 'prediction-md') {
      const found = games.find(g => g.slug === slug);
      if (!found) {
        return new Response(renderNotFoundMarkdown(`/predictions/${slug}/index.md`), {
          status: 404,
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Cache-Control': 'no-store',
            'X-Robots-Tag': 'noindex, nofollow',
            Vary: 'Accept'
          }
        });
      }
      return new Response(renderPredictionMarkdown(found), {
        status: 200,
        headers: {
          'Content-Type': 'text/markdown; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE,
          'X-Robots-Tag': INDEXABLE_ROBOTS,
          Vary: 'Accept'
        }
      });
    }

    if (route === 'sitemap') {
      return new Response(renderSitemapXml(games, nowPht), {
        status: 200,
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': PUBLIC_CACHE,
          'X-Robots-Tag': 'noindex'
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

    return pageResponse({
      wantMd,
      htmlFn: () => renderNotFoundHtml(),
      mdFn: () => renderNotFoundMarkdown(reqPath),
      status: 404,
      indexable: false,
      cacheControl: 'no-store'
    });
  } catch (err) {
    console.error('[api/render] Error rendering public route:', err);
    return new Response('Internal Server Error', {
      status: 500,
      headers: {'Content-Type': 'text/plain; charset=utf-8'}
    });
  }
}
