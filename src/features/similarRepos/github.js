/**
 * The default GitHub provider. It reads the repository's own metadata, builds
 * a search from its topics and primary language, and ranks the hits with the
 * heuristic in `score.js`. No third party is contacted; with a verified token
 * from the command palette the search runs under 5 000 requests an hour and
 * may see private repositories the token can reach.
 */
import { GITHUB_API_URL, SIMILAR_REPOS_TIMEOUT_MS } from '../../core/constants.js';
import { request as transportRequest } from '../../utils/http.js';
import {
  buildSearchQuery,
  normalizeGithubItem,
  relativePercentages,
  scoreGithubCandidate,
} from './score.js';
import { ApiError, networkError, resetFromHeaders } from './errors.js';

/** GitHub's documented version header for the REST API. */
const API_VERSION = '2022-11-28';

function apiHeaders(token) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': API_VERSION,
  };
  const trimmed = typeof token === 'string' ? token.trim() : '';
  if (trimmed) headers.Authorization = `Bearer ${trimmed}`;
  return headers;
}

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function checkStatus(response) {
  if (response.status === 401) {
    throw new ApiError('invalid', 'the token was rejected', { status: 401 });
  }
  if (response.status === 403 || response.status === 429) {
    throw new ApiError('rate-limited', 'GitHub rate limit reached', {
      resetAt: resetFromHeaders(response.headers),
      status: response.status,
    });
  }
  if (response.status === 404) {
    throw new ApiError('private', 'repository not readable', { status: 404 });
  }
}

/**
 * @returns {Promise<{ items: object[], hasMore: boolean }>}
 */
export async function fetchGithub({
  repo,
  page = 1,
  limit = 5,
  token = '',
  signal,
  request = transportRequest,
}) {
  const headers = apiHeaders(token);
  const call = async (url) => {
    try {
      const response = await request({ url, headers, timeout: SIMILAR_REPOS_TIMEOUT_MS, signal });
      checkStatus(response);
      if (response.status < 200 || response.status >= 300) {
        throw new ApiError('invalid', `unexpected response (HTTP ${response.status})`, {
          status: response.status,
        });
      }
      const body = parseBody(response.text);
      if (!body) {
        throw new ApiError('invalid', 'GitHub returned a non-JSON body', {
          status: response.status,
        });
      }
      return body;
    } catch (error) {
      if (error instanceof ApiError || error?.name === 'AbortError') throw error;
      throw networkError(error);
    }
  };

  // Only the first page carries a search; further pages keep the same ranked
  // set, so the panel simply stops offering "View more" past it.
  if (page > 1) return { items: [], hasMore: false };

  const meta = await call(`${GITHUB_API_URL}/repos/${repo}`);
  const query = buildSearchQuery({
    topics: meta.topics,
    language: meta.language,
  });
  if (!query) return { items: [], hasMore: false };

  const perPage = Math.min(100, Math.max(1, Number(limit) || 5) + 1);
  const search = await call(
    `${GITHUB_API_URL}/search/repositories?q=${encodeURIComponent(query)}&sort=stars&per_page=${perPage}`,
  );

  const sourceMeta = {
    topics: meta.topics,
    language: meta.language,
    stars: meta.stargazers_count,
  };
  const self = String(meta.full_name || repo).toLowerCase();
  const hits = (Array.isArray(search.items) ? search.items : [])
    .filter((hit) => hit && String(hit.full_name || '').toLowerCase() !== self)
    .map((hit) => ({
      ...normalizeGithubItem(hit),
      score: scoreGithubCandidate(sourceMeta, {
        topics: hit.topics,
        language: hit.language,
        stars_total: hit.stargazers_count,
      }),
    }))
    .sort((left, right) => right.score - left.score);

  const rows = relativePercentages(hits);
  return { items: rows.slice(0, Math.min(100, Math.max(1, Number(limit) || 5))), hasMore: false };
}
