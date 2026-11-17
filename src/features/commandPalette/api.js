import { request } from '../../utils/http.js';
import { rateLimitFromHeaders } from './store.js';

const API = 'https://api.github.com';
const PER_PAGE = 100;
const MAX_PAGES_TOKEN = 10;
const MAX_PAGES_ANON = 2;
const REPO_ACCEPT = 'application/vnd.github+json';
const STARRED_ACCEPT = 'application/vnd.github.star+json';

export function userUrl() {
  return `${API}/user`;
}

export function reposUrl({ login = '', page = 1 } = {}) {
  const perPage = `sort=pushed&direction=desc&per_page=${PER_PAGE}&page=${page}`;
  if (login) return `${API}/users/${encodeURIComponent(login)}/repos?${perPage}`;
  return `${API}/user/repos?affiliation=owner,collaborator,organization_member&${perPage}`;
}

export function starredUrl({ login = '', page = 1 } = {}) {
  const base = login ? `${API}/users/${encodeURIComponent(login)}/starred` : `${API}/user/starred`;
  return `${base}?sort=created&direction=desc&per_page=${PER_PAGE}&page=${page}`;
}

export function treeUrl({ owner, repo, ref }) {
  return `${API}/repos/${owner}/${repo}/git/trees/${encodeURIComponent(ref)}?recursive=1`;
}

function headersFor(token, accept, extra) {
  const headers = { Accept: accept, 'X-GitHub-Api-Version': '2022-11-28' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return { ...headers, ...extra };
}

async function call(url, { token = '', signal, accept = REPO_ACCEPT, headers: extra } = {}) {
  const response = await request({ url, headers: headersFor(token, accept, extra), signal });
  return { ...response, rateLimit: rateLimitFromHeaders(response.headers) };
}

function httpError(response) {
  const error = new Error(`GitHub request failed with status ${response.status}`);
  error.status = response.status;
  error.headers = response.headers;
  error.rateLimit = response.rateLimit;
  return error;
}

function conditionalHeaders(cached) {
  return cached?.etag ? { 'If-None-Match': cached.etag } : {};
}

function isOk(status) {
  return status >= 200 && status < 300;
}

/** The verified token's account, used to key the cache to one identity. */
export async function fetchUser({ token = '', signal } = {}) {
  const response = await call(userUrl(), { token, signal });
  if (!isOk(response.status)) throw httpError(response);
  const payload = JSON.parse(response.text || '{}');
  return { login: payload.login || null, avatarUrl: payload.avatar_url || '' };
}

async function fetchStarredPage(url, page, { token, signal, cached }) {
  const extra = conditionalHeaders(cached);
  const response = await call(url, { token, signal, accept: STARRED_ACCEPT, headers: extra });
  if (page === 1 && (response.status === 415 || response.status === 404)) {
    return call(url, { token, signal, headers: extra });
  }
  return response;
}

/**
 * Fetch the pages of a repository or starred list until one comes back short.
 * Cached pages are revalidated with their ETag, so a 304 costs one request and
 * keeps the items it already has.
 */
export async function fetchRepoSource({ source, token = '', login = '', cachedPages = [], signal } = {}) {
  const maxPages = token ? MAX_PAGES_TOKEN : MAX_PAGES_ANON;
  const pages = [];
  let rateLimit = null;
  let complete = false;
  for (let index = 0; index < maxPages; index += 1) {
    const page = index + 1;
    const cached = cachedPages[index] || null;
    const url = source === 'starred'
      ? starredUrl({ login, page })
      : reposUrl({ login, page });
    const response = source === 'starred'
      ? await fetchStarredPage(url, page, { token, signal, cached })
      : await call(url, { token, signal, headers: conditionalHeaders(cached) });
    if (response.rateLimit) rateLimit = response.rateLimit;
    if (response.status === 304) {
      if (!cached) throw httpError(response);
      pages.push({ ...cached, notModified: true });
      continue;
    }
    if (!isOk(response.status)) throw httpError(response);
    const items = JSON.parse(response.text || '[]');
    pages.push({ etag: response.headers.etag || null, items });
    if (items.length < PER_PAGE) {
      complete = true;
      break;
    }
  }
  return { pages, complete, rateLimit };
}

/** One recursive tree page, revalidated with an ETag when one is cached. */
export async function fetchTreePage({ owner, repo, ref, token = '', cached = null, signal }) {
  const response = await call(treeUrl({ owner, repo, ref }), {
    token,
    signal,
    headers: conditionalHeaders(cached),
  });
  if (response.status === 304) {
    return { notModified: true, payload: null, etag: cached?.etag ?? null, rateLimit: response.rateLimit };
  }
  if (!isOk(response.status)) throw httpError(response);
  return {
    notModified: false,
    payload: JSON.parse(response.text || '{}'),
    etag: response.headers.etag || null,
    rateLimit: response.rateLimit,
  };
}
