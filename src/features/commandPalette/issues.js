/**
 * Issue and pull-request data for the command palette: the current
 * repository's open items, cached by ETag and addressable as rows.
 */

import { getLocale, t } from '../../i18n/index.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { fetchIssuesPage } from './api.js';
import { relativeTime } from './format.js';
import {
  isFresh, isRateBlocked, persistRateLimit, readCacheRecord, readPaletteState, writeCacheRecord,
} from './store.js';

const log = createLogger('command-palette');
const PER_PAGE = 100;
const MAX_PAGES_TOKEN = 3;
const MAX_PAGES_ANON = 1;
const KEEP_REPOS = 5;
const RECORD_MAX_BYTES = 300 * 1024;
const inflight = new Map();
let generation = 0;

export function issueKey(repo) {
  return repo || '';
}

/** The cache stores this shape only, never GitHub's raw item. */
export function normalizeIssue(raw, repo) {
  return {
    number: Number(raw?.number) || 0,
    title: typeof raw?.title === 'string' ? raw.title : '',
    url: typeof raw?.html_url === 'string' ? raw.html_url : '',
    author: raw?.user?.login || '',
    updatedAt: typeof raw?.updated_at === 'string' ? raw.updated_at : '',
    kindLabel: raw?.pull_request ? 'pullRequest' : 'issue',
    comments: Number(raw?.comments) || 0,
    repo,
  };
}

function buildIssueCandidate(item, repo) {
  const isPr = item.kindLabel === 'pullRequest';
  const stamp = Date.parse(item.updatedAt);
  return {
    key: `issue:${repo}#${item.number}`,
    kind: 'issue',
    groupId: 'issues',
    groupTitle: t('palette.group.issues'),
    icon: isPr ? 'pullRequest' : 'issueOpened',
    title: `#${item.number} ${item.title}`.trim(),
    titleMuted: '',
    meta: [relativeTime(item.updatedAt, { locale: getLocale() }), item.author].filter(Boolean).join(' · '),
    rankFields: [
      { text: item.title, weight: 4 },
      { text: `#${item.number}`, weight: 2 },
      { text: item.author, weight: 1 },
    ],
    sortKey: Number.isFinite(stamp) ? -stamp : 0,
    badges: [item.kindLabel],
    data: {
      run: { type: 'navigate', url: item.url },
      number: item.number,
      repo,
      url: item.url,
      author: item.author,
      updatedAt: item.updatedAt,
      kindLabel: item.kindLabel,
      comments: item.comments || 0,
      state: 'open',
    },
  };
}

/** Open issues and pull requests of the requested repository, or the page's own. */
export function issueCandidates(state, { repo } = {}) {
  if (state?.settings?.sources?.issues === false) return [];
  const targetRepo = repo || state?.context?.repo;
  if (!targetRepo) return [];
  const record = state?.cache?.issues?.[issueKey(targetRepo)];
  const items = Array.isArray(record?.items) ? record.items : [];
  return items.map((item) => buildIssueCandidate(item, targetRepo));
}

function persistIssues(state, repo, record, rateLimit) {
  // A repository or tree load can finish while these requests are in flight;
  // the disk record is read again so their data survives this write.
  const latest = readCacheRecord();
  const sameIdentity = Boolean(latest && latest.login === state.identity);
  const issues = { ...(sameIdentity ? latest.issues || {} : {}) };

  if (JSON.stringify(record).length <= RECORD_MAX_BYTES) issues[repo] = record;
  else delete issues[repo];

  const kept = {};
  const newest = Object.entries(issues)
    .sort((left, right) => (right[1].fetchedAt || 0) - (left[1].fetchedAt || 0))
    .slice(0, KEEP_REPOS);
  for (const [id, entry] of newest) kept[id] = entry;

  writeCacheRecord({
    version: 1,
    login: state.identity,
    tokenLogin: state.tokenLogin,
    tokenFingerprint: state.fingerprint,
    sources: sameIdentity ? latest.sources || {} : {},
    trees: sameIdentity ? latest.trees || {} : {},
    issues: kept,
    rateLimit: rateLimit || (sameIdentity ? latest.rateLimit || null : null),
  });
}

async function loadIssues(state, { repo, force, signal }) {
  const key = issueKey(repo);
  const existing = state.cache?.issues?.[key] || null;
  const now = Date.now();
  const stamp = generation;

  if (!force) {
    if (isFresh(existing, state.settings.cacheHours, now)) return { status: 'cached' };
    if (isRateBlocked(state.cache, now)) return { status: 'cached' };
  }

  const [owner, name] = String(repo).split('/');
  if (!owner || !name) return { status: 'unavailable' };

  try {
    const first = await fetchIssuesPage({
      owner,
      repo: name,
      token: state.settings.token,
      cached: existing,
      signal,
    });
    if (stamp !== generation) return { status: 'discarded' };
    if (first.notModified) {
      if (!existing) throw new Error('GitHub returned 304 without a cached issue list');
      const refreshed = {
        ...existing,
        fetchedAt: Date.now(),
        etag: first.etag || existing.etag || null,
      };
      persistIssues(state, key, refreshed, first.rateLimit);
      return { status: 'updated' };
    }

    const items = [];
    const add = (rawItems) => {
      for (const raw of Array.isArray(rawItems) ? rawItems : []) {
        items.push(normalizeIssue(raw, repo));
      }
    };
    add(first.items);

    let rateLimit = first.rateLimit;
    let complete = (first.items || []).length < PER_PAGE;
    const maxPages = state.settings.token ? MAX_PAGES_TOKEN : MAX_PAGES_ANON;
    for (let page = 2; page <= maxPages && !complete; page += 1) {
      const next = await fetchIssuesPage({
        owner, repo: name, page, token: state.settings.token, signal,
      });
      if (next.rateLimit) rateLimit = next.rateLimit;
      add(next.items);
      complete = (next.items || []).length < PER_PAGE;
    }

    const record = { etag: first.etag || null, items, fetchedAt: Date.now() };
    if (stamp !== generation) return { status: 'discarded' };
    persistIssues(state, key, record, rateLimit);
    return { status: 'updated' };
  } catch (error) {
    log.error(Codes.PALETTE_LOAD, 'palette issue list failed', { source: 'issues', repo, error });
    persistRateLimit(state, error?.rateLimit);
    return { status: 'error', error };
  }
}

/**
 * Load the requested repository's issues once, revalidating the cached copy.
 * Concurrent callers for the same repository and token share the load.
 */
export function ensureIssues({ repo, force = false, signal } = {}) {
  const state = readPaletteState();
  const targetRepo = repo || state.context.repo;
  if (!targetRepo) return Promise.resolve({ status: 'unavailable' });
  if (state.settings.sources.issues === false) return Promise.resolve({ status: 'disabled' });
  if (!state.identity) return Promise.resolve({ status: 'anonymous' });

  const key = `${issueKey(targetRepo)}|${state.fingerprint}`;
  const running = inflight.get(key);
  if (running && !force) return running;
  const promise = loadIssues(state, { repo: targetRepo, force, signal }).finally(() => {
    if (inflight.get(key) === promise) inflight.delete(key);
  });
  inflight.set(key, promise);
  return promise;
}

/**
 * Drop in-flight issue loads, so a cleared cache is not refilled by them. The
 * generation bump makes a load that already reached GitHub discard its result.
 */
export function forgetIssues() {
  generation += 1;
  inflight.clear();
}
