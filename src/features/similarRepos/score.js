/**
 * Pure helpers for the similar-repositories panel: item normalization, the
 * GitHub search query, the heuristic similarity score and the relative
 * percentage the rows display. No DOM and no network here.
 */
import { SIMILAR_REPOS_RESULTS_MAX } from '../../core/constants.js';

/** Shared row shape both providers normalize into. */
function emptyRow() {
  return {
    repo: '',
    description: '',
    language: '',
    stars: 0,
    forks: 0,
    archived: false,
    score: 0,
  };
}

function toCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function toText(value) {
  return typeof value === 'string' ? value : '';
}

/** A GitHub repository documented by the search endpoint. */
export function normalizeGithubItem(hit) {
  if (!hit || typeof hit !== 'object') return emptyRow();
  return {
    repo: toText(hit.full_name),
    description: toText(hit.description),
    language: toText(hit.language),
    stars: toCount(hit.stargazers_count),
    forks: toCount(hit.forks_count),
    archived: hit.archived === true,
    score: 0,
  };
}

/** A SimRepo recommendation (`{ repo, score, meta }`). */
export function normalizeSimrepoItem(item) {
  if (!item || typeof item !== 'object') return emptyRow();
  const meta = item.meta && typeof item.meta === 'object' ? item.meta : {};
  return {
    repo: toText(item.repo),
    description: toText(meta.description),
    language: toText(meta.language),
    stars: toCount(meta.stars_total),
    forks: toCount(meta.forks_count),
    archived: meta.archived === true,
    score: toCount(item.score),
  };
}

/**
 * GitHub search may carry at most five operators. The metadata's first three
 * topics plus its language stay inside that budget; with neither there is no
 * meaningful query, so the caller sends no search request at all.
 */
export function buildSearchQuery(meta) {
  const topics = Array.isArray(meta?.topics) ? meta.topics : [];
  const language = toText(meta?.language);
  const terms = topics.slice(0, 3).map((topic) => `topic:${topic}`);
  if (language) terms.push(`language:${language}`);
  return terms.join(' ');
}

/** Topic overlap (Jaccard), language match and star proximity, weighted. */
export function scoreGithubCandidate(meta, hit) {
  const sourceTopics = new Set(
    (Array.isArray(meta?.topics) ? meta.topics : []).map((topic) => String(topic).toLowerCase()),
  );
  const hitTopics = new Set(
    (Array.isArray(hit?.topics) ? hit.topics : []).map((topic) => String(topic).toLowerCase()),
  );
  let shared = 0;
  for (const topic of hitTopics) if (sourceTopics.has(topic)) shared += 1;
  const union = new Set([...sourceTopics, ...hitTopics]);
  const topicScore = union.size === 0 ? 0 : shared / union.size;

  const languageScore = meta?.language && meta.language === hit?.language ? 1 : 0;

  const sourceStars = toCount(meta?.stars);
  const hitStars = toCount(hit?.stars_total ?? hit?.stargazers_count);
  const starScore = Math.max(
    0,
    1 - Math.min(1, Math.abs(Math.log10(hitStars + 1) - Math.log10(sourceStars + 1)) / 3),
  );

  const score = topicScore * 0.55 + languageScore * 0.25 + starScore * 0.2;
  return Math.min(1, Math.max(0, score));
}

/** Percent of the strongest score in the set, so the first row reads 100%. */
export function relativePercentages(items) {
  const list = Array.isArray(items) ? items : [];
  const max = list.reduce((best, item) => Math.max(best, toCount(item?.score)), 0);
  return list.map((item) => ({
    ...item,
    percent: max > 0 ? Math.round((toCount(item?.score) / max) * 100) : 0,
  }));
}

/** Trim a provider result to the configured page size. */
export function capResults(items, limit) {
  const cap = Math.min(SIMILAR_REPOS_RESULTS_MAX, Math.max(1, Number(limit) || 0));
  return (Array.isArray(items) ? items : []).slice(0, cap);
}
