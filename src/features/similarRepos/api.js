/**
 * Provider dispatcher. Both providers resolve `{ items, hasMore }` and throw a
 * typed `ApiError`; the lifecycle maps the code to a panel state.
 */
import { SIMILAR_REPOS_PROVIDERS } from '../../core/constants.js';
import { fetchGithub } from './github.js';
import { fetchSimrepo } from './simrepo.js';
import { ApiError, isAbort } from './errors.js';

export { ApiError, isAbort };

/**
 * @param {{ provider: string, repo: string, page?: number, limit?: number,
 *   token?: string, signal?: AbortSignal, request?: Function }} options
 */
export async function fetchSimilar(options) {
  const provider = options?.provider;
  if (!SIMILAR_REPOS_PROVIDERS.includes(provider)) {
    throw new ApiError('invalid', `unknown provider: ${provider}`);
  }
  try {
    return provider === 'simrepo'
      ? await fetchSimrepo(options)
      : await fetchGithub(options);
  } catch (error) {
    if (error instanceof ApiError || isAbort(error)) throw error;
    throw new ApiError('network', error?.message || 'Network request failed');
  }
}
