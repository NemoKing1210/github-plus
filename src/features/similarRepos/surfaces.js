/**
 * Where the panel lives. GitHub's sidebar is resolved through the section
 * headings it prints (Releases, Contributors, Languages) rather than a hashed
 * class, with `.Layout-sidebar` as the fallback; a layout that matches neither
 * turns the feature into a no-op instead of guessing at a container.
 */

/** Heading text a repository sidebar section carries, with an optional count. */
export const SIDEBAR_HEADING =
  /^(Releases|Contributors|Languages)(?:\s*[\d,.kKmM+]+(?:\s*\([\d,.kKmM+]+\))?)?$/;

/** Regions whose headings are page content, never the sidebar. */
const EXCLUDED = 'article, [itemprop="text"], #readme, [data-testid="readme"], nav, header, footer, .gp-similar';

const PUBLIC_META = 'meta[name="octolytics-dimension-repository_public"]';

function headingInSidebar(heading) {
  if (heading.closest(EXCLUDED)) return false;
  const text = (heading.textContent || '').replace(/\s+/g, ' ').trim();
  return SIDEBAR_HEADING.test(text);
}

/** The nearest ancestor of `node` that contains every heading, never the page. */
function sharedAncestor(headings) {
  let candidate = headings[0]?.parentElement;
  while (candidate && !candidate.matches('main, body, html')) {
    if (headings.every((heading) => candidate.contains(heading))) return candidate;
    candidate = candidate.parentElement;
  }
  return null;
}

/**
 * Resolve the repository sidebar.
 * @returns {{ container: Element } | null}
 */
export function resolveSidebar() {
  const headings = Array.from(document.querySelectorAll('h2')).filter(headingInSidebar);
  if (headings.length >= 2) {
    const container = sharedAncestor(headings);
    if (container) return { container };
  }
  if (headings.length === 1) {
    const container = headings[0].parentElement?.parentElement;
    if (container && !container.matches('main, body, html')) return { container };
  }
  const fallback = document.querySelector('.Layout-sidebar');
  return fallback ? { container: fallback } : null;
}

/**
 * A repository is readable only when GitHub positively marks it public. A
 * private/internal label or a missing marker reads as not public, so no
 * request is ever sent for a repository whose visibility is unknown.
 */
export function isPublicRepo() {
  const meta = document.querySelector(PUBLIC_META);
  return Boolean(meta) && meta.getAttribute('content') === 'true';
}

/** The repository the page shows, `owner/name`, or null outside a repository. */
export function currentRepo() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length < 2) return null;
  if (['login', 'signup', 'settings', 'notifications', 'search', 'explore'].includes(parts[0])) {
    return null;
  }
  return `${parts[0]}/${parts[1]}`;
}
