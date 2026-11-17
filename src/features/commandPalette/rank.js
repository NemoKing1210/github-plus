/**
 * Pure query parsing, fuzzy scoring and grouping for the command palette.
 * No DOM, no i18n: group titles come from the candidates themselves, and the
 * two synthetic group titles from `options.titles`.
 */

const PREFIX_MODES = {
  '>': 'commands',
  '@': 'repos',
  '#': 'files',
  '?': 'search',
};

const BROWSE_ORDER = ['repository', 'github', 'plus', 'repos', 'starred', 'search'];
const GROUP_LIMIT = 8;
const BOUNDARY = /[\s/\-_.@:]/;

/** Split the first-character prefix from the search text. */
export function parseQuery(input) {
  const raw = String(input ?? '').trim();
  const mode = PREFIX_MODES[raw[0]] || 'all';
  return {
    mode,
    text: mode === 'all' ? raw : raw.slice(1).trim(),
  };
}

function isBoundary(text, index) {
  return index === 0 || BOUNDARY.test(text[index - 1]);
}

/**
 * Score one query against one text. An exact substring beats any scattered
 * subsequence; boundaries add a bonus and gaps cost. Returns null when a
 * query character is missing.
 */
export function scoreText(query, text) {
  const needle = String(query ?? '').toLowerCase();
  const haystack = String(text ?? '').toLowerCase();
  if (!needle) return { score: 0, ranges: [] };
  if (!haystack) return null;

  const exact = haystack.indexOf(needle);
  if (exact !== -1) {
    let score = 1000 + needle.length * 10;
    if (exact === 0) score += 100;
    else if (isBoundary(haystack, exact)) score += 60;
    score += Math.max(0, 50 - haystack.length);
    return { score, ranges: [[exact, exact + needle.length]] };
  }

  const positions = [];
  let cursor = 0;
  for (const character of needle) {
    const found = haystack.indexOf(character, cursor);
    if (found === -1) return null;
    positions.push(found);
    cursor = found + 1;
  }

  let gaps = 0;
  const ranges = [];
  for (let index = 0; index < positions.length; index += 1) {
    const start = positions[index];
    if (index > 0) gaps += start - positions[index - 1] - 1;
    const last = ranges[ranges.length - 1];
    if (last && last[1] === start) last[1] = start + 1;
    else ranges.push([start, start + 1]);
  }

  return {
    score: 100 + needle.length * 5 - gaps * 8 - positions[0],
    ranges,
  };
}

function modeAllows(candidate, mode) {
  if (mode === 'commands') return candidate.kind === 'command';
  if (mode === 'repos') return candidate.kind === 'repo';
  if (mode === 'files') return candidate.kind === 'file';
  if (mode === 'search') return candidate.kind === 'command' && candidate.groupId === 'search';
  return true;
}

function bestFieldScore(term, fields) {
  let best = null;
  for (const field of fields || []) {
    const result = scoreText(term, field.text);
    if (!result) continue;
    const score = result.score * (field.weight ?? 1);
    if (best === null || score > best) best = score;
  }
  return best;
}

function highlightRanges(title, terms) {
  const ranges = [];
  for (const term of terms) {
    const result = scoreText(term, title);
    if (result) ranges.push(...result.ranges);
  }
  return ranges.sort((left, right) => left[0] - right[0]);
}

function buildGroup(candidate, items) {
  return { id: candidate.groupId, title: candidate.groupTitle, items };
}

function applyTotalCap(groups, maxResults) {
  if (!groups.length) return groups;
  if (maxResults <= 0) return [];
  if (groups.length >= maxResults) {
    return groups.slice(0, maxResults).map((group) => ({ ...group, items: group.items.slice(0, 1) }));
  }

  const counts = groups.map(() => 1);
  let remaining = maxResults - groups.length;
  while (remaining > 0) {
    let filled = false;
    for (let index = 0; index < groups.length && remaining > 0; index += 1) {
      if (counts[index] >= groups[index].items.length) continue;
      counts[index] += 1;
      remaining -= 1;
      filled = true;
    }
    if (!filled) break;
  }

  return groups.map((group, index) => ({ ...group, items: group.items.slice(0, counts[index]) }));
}

function emptyQuery(candidates, options, titles) {
  const byKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const seen = new Set();
  const take = (keys) => {
    const items = [];
    for (const key of keys) {
      if (seen.has(key)) continue;
      const candidate = byKey.get(key);
      if (!candidate) continue;
      seen.add(key);
      items.push(candidate);
    }
    return items;
  };

  const pinned = take(options.pinnedKeys || []).slice(0, GROUP_LIMIT);
  const recent = take(options.recentKeys || []).slice(0, GROUP_LIMIT);
  const groups = [];
  if (pinned.length) groups.push({ id: 'pinned', title: titles.pinned, items: pinned });
  if (recent.length) groups.push({ id: 'recent', title: titles.recent, items: recent });

  const structural = new Map();
  for (const candidate of candidates) {
    if (seen.has(candidate.key) || candidate.kind === 'file' || candidate.groupId === 'files') continue;
    if (!structural.has(candidate.groupId)) structural.set(candidate.groupId, []);
    structural.get(candidate.groupId).push(candidate);
  }
  const order = options.browseOrder || BROWSE_ORDER;
  const rankOf = (id) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  for (const id of [...structural.keys()].sort((left, right) => rankOf(left) - rankOf(right))) {
    const items = structural.get(id).slice(0, GROUP_LIMIT);
    if (items.length) groups.push(buildGroup(items[0], items));
  }

  return {
    groups,
    total: groups.reduce((sum, group) => sum + group.items.length, 0),
  };
}

/**
 * Mark the candidates that are pinned (favorites), adding the badge once.
 * Rows keep their identity otherwise, so a caller can render the star from
 * `pinned` and the extra badge from `badges`.
 */
export function markPinned(candidates, pinnedKeys) {
  const pinned = new Set(pinnedKeys || []);
  return (Array.isArray(candidates) ? candidates : []).map((candidate) => {
    if (!pinned.has(candidate.key)) return candidate;
    const badges = candidate.badges || [];
    return {
      ...candidate,
      pinned: true,
      badges: badges.includes('pinned') ? badges : [...badges, 'pinned'],
    };
  });
}

/**
 * Rank candidates for a query. The query is parsed for its prefix mode; the
 * result keeps only non-empty groups, sorted by their best score. Pinned
 * candidates form their own first group and never appear in another group.
 */
export function rankCandidates(candidates, rawQuery, options = {}) {
  const parsed = parseQuery(rawQuery);
  const all = Array.isArray(candidates) ? candidates : [];
  const titles = options.titles || { pinned: 'Pinned', recent: 'Recent' };

  if (!parsed.text) return emptyQuery(all, options, titles);

  const terms = parsed.text.split(/\s+/).filter(Boolean);
  const pinned = new Set(options.pinnedKeys || []);
  const recent = new Set(options.recentKeys || []);
  const scored = [];

  for (const candidate of all) {
    if (!modeAllows(candidate, parsed.mode)) continue;
    let total = 0;
    let matched = true;
    for (const term of terms) {
      const best = bestFieldScore(term, candidate.rankFields);
      if (best === null) {
        matched = false;
        break;
      }
      total += best;
    }
    if (!matched) continue;
    if (pinned.has(candidate.key)) total += 1000;
    else if (recent.has(candidate.key)) total += 100;
    scored.push({
      ...candidate,
      score: total,
      highlight: highlightRanges(candidate.title, terms),
    });
  }

  const byScore = (left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (left.sortKey ?? 0) - (right.sortKey ?? 0);
  };
  const pinnedItems = scored.filter((item) => pinned.has(item.key)).sort(byScore);
  const rest = scored.filter((item) => !pinned.has(item.key));

  const groupCaps = options.groupCaps || { command: 8, file: 12, repo: 15 };
  const byGroup = new Map();
  for (const item of rest) {
    if (!byGroup.has(item.groupId)) byGroup.set(item.groupId, []);
    byGroup.get(item.groupId).push(item);
  }

  const order = options.browseOrder || BROWSE_ORDER;
  const rankOf = (id) => {
    const index = order.indexOf(id);
    return index === -1 ? order.length : index;
  };
  const rankGroup = (id) => {
    const cap = groupCaps[all.find((candidate) => candidate.groupId === id)?.kind] ?? 15;
    return cap;
  };

  const groups = [...byGroup.entries()].map(([id, items]) => {
    items.sort(byScore);
    return { ...buildGroup(items[0], items.slice(0, rankGroup(id))) };
  });

  groups.sort((left, right) => {
    const leftScore = left.items[0]?.score ?? 0;
    const rightScore = right.items[0]?.score ?? 0;
    if (rightScore !== leftScore) return rightScore - leftScore;
    return rankOf(left.id) - rankOf(right.id);
  });

  const pinnedGroup = pinnedItems.length
    ? { id: 'pinned', title: titles.pinned, items: pinnedItems.slice(0, GROUP_LIMIT) }
    : null;
  const capped = applyTotalCap(pinnedGroup ? [pinnedGroup, ...groups] : groups, options.maxResults ?? 30);
  return { groups: capped.filter((group) => group.items.length), total: scored.length };
}
