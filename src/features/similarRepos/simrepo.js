/**
 * The opt-in SimRepo provider. It sends the public repository name to a third
 * party, so the settings card says so and the provider is never the default.
 * Anonymous lookups are IP rate-limited and only the first page is open unless
 * the visitor has starred SimRepo, which the endpoint answers as typed errors.
 */
import { SIMILAR_REPOS_SIMREPO_URL, SIMILAR_REPOS_TIMEOUT_MS } from '../../core/constants.js';
import { request as transportRequest } from '../../utils/http.js';
import { normalizeSimrepoItem, relativePercentages } from './score.js';
import { ApiError, networkError, resetFromHeaders } from './errors.js';

/** SimRepo returns three recommendations per page. */
const SIMREPO_PAGE_SIZE = 3;

function parseBody(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * @returns {Promise<{ items: object[], hasMore: boolean }>}
 */
export async function fetchSimrepo({
  repo,
  page = 1,
  limit,
  signal,
  request = transportRequest,
}) {
  const url = `${SIMILAR_REPOS_SIMREPO_URL}?repo=${encodeURIComponent(repo)}&page=${page}`;
  let response;
  try {
    response = await request({
      url,
      headers: { Accept: 'application/json' },
      timeout: SIMILAR_REPOS_TIMEOUT_MS,
      signal,
    });
  } catch (error) {
    throw networkError(error);
  }

  const body = parseBody(response.text);
  if (response.status === 404) {
    throw new ApiError('not-in-dataset', 'repository is not in the dataset', { status: 404 });
  }
  if (response.status === 400 && (page > 1 || /star/i.test(response.text))) {
    throw new ApiError('star-required', 'further pages need a star', { status: 400 });
  }
  if (response.status === 429 || response.status === 403) {
    throw new ApiError('rate-limited', 'lookup limit reached', {
      resetAt: resetFromHeaders(response.headers),
      status: response.status,
    });
  }
  if (response.status < 200 || response.status >= 300 || !body) {
    throw new ApiError('invalid', `unexpected response (HTTP ${response.status})`, {
      status: response.status,
    });
  }

  const repos = Array.isArray(body.repos) ? body.repos : [];
  const rows = relativePercentages(repos.map(normalizeSimrepoItem));
  const items = rows.slice(0, Math.max(1, limit || rows.length));
  return { items, hasMore: repos.length >= SIMREPO_PAGE_SIZE };
}
