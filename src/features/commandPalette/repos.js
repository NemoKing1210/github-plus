/**
 * Repository data for the command palette: normalization of GitHub's payloads,
 * merging the owned and starred sources, ranking candidates, and the cached
 * load that keeps both sources current.
 */

import { t } from '../../i18n/index.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { formatCount } from './format.js';
import { fetchRepoSource } from './api.js';
import {
  isFresh, isRateBlocked, persistRateLimit, readCacheRecord, readPaletteState, writeCacheRecord,
} from './store.js';

const log = createLogger('command-palette');
const MAX_ITEMS = 1000;
// Repository rows take the owner's avatar in the icon slot; 32px covers the
// 16px slot on a 2x display.
const AVATAR_PX = 32;

/**
 * Owner avatar for a repository row: the API's canonical URL when the payload
 * carries one, else GitHub's own `<login>.png` route.
 */
function avatarFor(owner, apiUrl) {
  if (typeof apiUrl === 'string' && apiUrl.startsWith('https://avatars.githubusercontent.com/')) {
    return `${apiUrl}${apiUrl.includes('?') ? '&' : '?'}s=${AVATAR_PX}`;
  }
  return owner ? `https://github.com/${encodeURIComponent(owner)}.png?size=${AVATAR_PX}` : '';
}

const SOURCES = [
  { id: 'repos', setting: 'repositories' },
  { id: 'starred', setting: 'starred' },
];

/** Map a repository payload onto the fields the palette renders and ranks. */
export function normalizeRepo(raw, starredAt = null) {
  return {
    fullName: raw?.full_name || '',
    owner: raw?.owner?.login || '',
    ownerType: raw?.owner?.type || '',
    avatar: avatarFor(raw?.owner?.login || '', raw?.owner?.avatar_url || ''),
    name: raw?.name || '',
    description: typeof raw?.description === 'string' ? raw.description : '',
    private: raw?.private === true,
    fork: raw?.fork === true,
    archived: raw?.archived === true,
    stars: Number(raw?.stargazers_count) || 0,
    forks: Number(raw?.forks_count) || 0,
    language: typeof raw?.language === 'string' ? raw.language : '',
    pushedAt: raw?.pushed_at || '',
    updatedAt: raw?.updated_at || '',
    starredAt: starredAt || '',
    starred: Boolean(starredAt),
  };
}

/** Accept a normalized repo, a raw payload or a starred wrapper from the API. */
function toRepo(item, starredAt = null) {
  if (!item) return null;
  const stamp = item.starred_at || starredAt || null;
  if (item.fullName && !item.repo) {
    return {
      ...item,
      starred: Boolean(item.starred || stamp),
      starredAt: item.starredAt || stamp || '',
    };
  }
  return normalizeRepo(item.repo || item, stamp);
}

function sourceItems(source) {
  const pages = Array.isArray(source?.pages) ? source.pages : [];
  const items = [];
  for (const page of pages) {
    for (const item of Array.isArray(page.items) ? page.items : []) items.push(item);
  }
  return items;
}

/** Owned repositories in first-seen order, flagged when starred; starred-only follow. */
export function mergeRepoSources(myItems, starredItems) {
  const starred = (starredItems || []).map((item) => toRepo(item)).filter(Boolean);
  const starredByKey = new Map();
  for (const repo of starred) {
    if (repo.fullName && !starredByKey.has(repo.fullName)) starredByKey.set(repo.fullName, repo);
  }

  const repos = [];
  const seen = new Set();
  for (const item of myItems || []) {
    const repo = toRepo(item);
    if (!repo?.fullName || seen.has(repo.fullName)) continue;
    seen.add(repo.fullName);
    const starredCopy = starredByKey.get(repo.fullName);
    repos.push({
      ...repo,
      starred: Boolean(starredCopy || repo.starred),
      starredAt: repo.starredAt || starredCopy?.starredAt || '',
    });
  }

  const starredOnly = starred.filter((repo) => repo.fullName && !seen.has(repo.fullName));
  return { repos, starred: starredOnly };
}

function metaFor(repo) {
  const parts = [];
  if (repo.language) parts.push(repo.language);
  if (repo.stars) parts.push(`★ ${formatCount(repo.stars)}`);
  if (!parts.length && repo.private) parts.push(t('palette.badge.private'));
  return parts.join(' · ');
}

function sortKeyFor(repo, groupId) {
  const stamp = Date.parse(groupId === 'starred'
    ? repo.starredAt || repo.pushedAt
    : repo.pushedAt || repo.starredAt);
  return Number.isFinite(stamp) ? -stamp : 0;
}

function badgesFor(repo) {
  const badges = [];
  if (repo.private) badges.push('private');
  if (repo.fork) badges.push('fork');
  if (repo.archived) badges.push('archived');
  if (repo.starred) badges.push('starred');
  return badges;
}

function buildRepoCandidate(repo, groupId, groupTitle) {
  return {
    key: `repo:${repo.fullName}`,
    kind: 'repo',
    // Tab drills into the repository, and Enter opens it: the two hints a
    // repository row carries in GitHub's own palette.
    scopeable: true,
    hint: t('palette.hint.jump'),
    groupId,
    groupTitle,
    title: repo.name || repo.fullName,
    titleMuted: repo.owner ? `${repo.owner} /` : '',
    // A record cached before the avatar field existed still gets one from its
    // owner login, so an update does not leave half the rows with a glyph.
    avatar: repo.avatar || avatarFor(repo.owner, ''),
    meta: metaFor(repo),
    rankFields: [
      { text: repo.name, weight: 3 },
      { text: repo.fullName, weight: 2 },
      { text: repo.owner, weight: 1.5 },
      { text: repo.description, weight: 0.6 },
    ],
    sortKey: sortKeyFor(repo, groupId),
    badges: badgesFor(repo),
    // The normalized repo has no address of its own; selection navigates by
    // `data.url`, so a row without one closes the palette and goes nowhere.
    data: {
      ...repo,
      url: repo.fullName
        ? `https://github.com/${repo.fullName.split('/').map(encodeURIComponent).join('/')}`
        : '',
    },
  };
}

function isVisible(repo, settings) {
  if (!repo.fullName) return false;
  if (settings.hideForks && repo.fork) return false;
  if (settings.hideArchived && repo.archived) return false;
  return true;
}

/** Candidate rows for both repository groups, honoring the source toggles and filters. */
export function repoCandidates(state) {
  const settings = state?.settings || {};
  const toggles = settings.sources || {};
  const sources = state?.cache?.sources;
  if (!sources) return [];

  const showRepos = toggles.repositories !== false;
  const showStarred = toggles.starred !== false;
  if (!showRepos && !showStarred) return [];

  const merged = mergeRepoSources(
    showRepos ? sourceItems(sources.repos) : [],
    showStarred ? sourceItems(sources.starred) : [],
  );
  const candidates = [];
  if (showRepos) {
    for (const repo of merged.repos) {
      if (isVisible(repo, settings)) candidates.push(buildRepoCandidate(repo, 'repos', t('palette.group.repos')));
    }
  }
  if (showStarred) {
    for (const repo of merged.starred) {
      if (isVisible(repo, settings)) candidates.push(buildRepoCandidate(repo, 'starred', t('palette.group.starred')));
    }
  }
  return candidates;
}

function normalizePages(pages) {
  const output = [];
  let total = 0;
  for (const page of pages || []) {
    const items = [];
    for (const item of Array.isArray(page.items) ? page.items : []) {
      if (total >= MAX_ITEMS) break;
      const repo = toRepo(item);
      if (repo) {
        items.push(repo);
        total += 1;
      }
    }
    output.push({ ...page, items });
    if (total >= MAX_ITEMS) break;
  }
  return output;
}

function enabledSources(settings) {
  const toggles = settings.sources || {};
  return SOURCES.filter((source) => toggles[source.setting] !== false);
}

async function load({ force, signal }) {
  const stamp = generation;
  const state = readPaletteState();
  const settings = state.settings;
  if (!state.identity) return { status: 'anonymous' };

  const enabled = enabledSources(settings);
  if (!enabled.length) return { status: 'cached' };

  const record = state.record;
  const sameIdentity = Boolean(record && record.login === state.identity);
  const cachedSources = sameIdentity ? record.sources || {} : {};
  const now = Date.now();

  if (!force) {
    const allFresh = enabled.every((source) => isFresh(cachedSources[source.id], settings.cacheHours, now));
    if (allFresh) return { status: 'cached' };
    if (isRateBlocked(state.cache, now)) return { status: 'cached' };
  }

  // The `/user/*` routes need authentication: without a token the palette reads
  // the signed-in account's public lists instead.
  const login = settings.token ? '' : state.context.login || '';
  const results = await Promise.allSettled(enabled.map((source) => fetchRepoSource({
    source: source.id,
    token: settings.token,
    login,
    cachedPages: cachedSources[source.id]?.pages || [],
    signal,
  })));
  if (stamp !== generation) return { status: 'discarded' };

  const sources = { ...cachedSources };
  let rateLimit = sameIdentity ? record.rateLimit || null : null;
  let updated = false;
  let firstError = null;

  results.forEach((result, index) => {
    const source = enabled[index];
    if (result.status === 'fulfilled') {
      sources[source.id] = {
        pages: normalizePages(result.value.pages),
        fetchedAt: Date.now(),
        complete: result.value.complete,
      };
      if (result.value.rateLimit) rateLimit = result.value.rateLimit;
      updated = true;
      return;
    }
    firstError = firstError || result.reason;
    if (result.reason?.rateLimit) rateLimit = result.reason.rateLimit;
    log.error(Codes.PALETTE_LOAD, 'palette repository source failed', {
      source: source.id,
      error: result.reason,
    });
  });

  if (!updated) {
    persistRateLimit(state, rateLimit);
    return { status: 'error', error: firstError };
  }

  // A tree load can finish while these requests are in flight; take the disk
  // record again so its trees survive this write.
  const latest = readCacheRecord();
  const latestSameIdentity = Boolean(latest && latest.login === state.identity);
  writeCacheRecord({
    version: 1,
    login: state.identity,
    tokenLogin: state.tokenLogin,
    tokenFingerprint: state.fingerprint,
    sources,
    trees: latestSameIdentity ? latest.trees || {} : {},
    issues: latestSameIdentity ? latest.issues || {} : {},
    rateLimit: rateLimit || (latestSameIdentity ? latest.rateLimit || null : null),
  });
  return { status: 'updated' };
}

let inflight = null;
let generation = 0;

/**
 * Load both repository sources once per call, revalidating cached pages.
 * Concurrent callers share the in-flight load; a forced refresh starts its own.
 */
export function ensureRepositories({ force = false, signal } = {}) {
  if (inflight && !force) return inflight;
  const promise = load({ force, signal }).finally(() => {
    if (inflight === promise) inflight = null;
  });
  inflight = promise;
  return promise;
}

/** Drop an in-flight load so a cleared cache is not refilled by it. */
export function forgetRepositories() {
  generation += 1;
  inflight = null;
}
