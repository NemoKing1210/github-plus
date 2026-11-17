/**
 * Repository data for the command palette: normalization of GitHub's payloads,
 * merging the owned and starred sources, ranking candidates, and the cached
 * load that keeps both sources current.
 */

import { t } from '../../i18n/index.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { fetchRepoSource } from './api.js';
import {
  isFresh, isRateBlocked, readCacheRecord, readPaletteState, writeCacheRecord,
} from './store.js';

const log = createLogger('command-palette');
const MAX_ITEMS = 1000;

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
    name: raw?.name || '',
    description: typeof raw?.description === 'string' ? raw.description : '',
    private: raw?.private === true,
    fork: raw?.fork === true,
    archived: raw?.archived === true,
    stars: Number(raw?.stargazers_count) || 0,
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
  if (repo.stars) parts.push(`★ ${repo.stars}`);
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
    groupId,
    groupTitle,
    title: repo.name || repo.fullName,
    titleMuted: repo.owner ? `${repo.owner} /` : '',
    meta: metaFor(repo),
    rankFields: [
      { text: repo.name, weight: 3 },
      { text: repo.fullName, weight: 2 },
      { text: repo.owner, weight: 1.5 },
      { text: repo.description, weight: 0.6 },
    ],
    sortKey: sortKeyFor(repo, groupId),
    badges: badgesFor(repo),
    data: repo,
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

  const results = await Promise.allSettled(enabled.map((source) => fetchRepoSource({
    source: source.id,
    token: settings.token,
    cachedPages: cachedSources[source.id]?.pages || [],
    signal,
  })));

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

  if (!updated) return { status: 'error', error: firstError };

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
    rateLimit: rateLimit || (latestSameIdentity ? latest.rateLimit || null : null),
  });
  return { status: 'updated' };
}

let inflight = null;

/**
 * Load both repository sources once per call, revalidating cached pages.
 * Concurrent callers share the in-flight load.
 */
export function ensureRepositories({ force = false, signal } = {}) {
  if (inflight) return inflight;
  inflight = load({ force, signal }).finally(() => {
    inflight = null;
  });
  return inflight;
}
