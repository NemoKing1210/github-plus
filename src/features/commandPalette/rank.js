/**
 * Pure query parsing, fuzzy scoring and grouping for the command palette.
 * No DOM, no i18n: group titles come from the candidates themselves, and the
 * two synthetic group titles from `options.titles`.
 */

const PREFIX_MODES = {
  '>': 'commands',
  '#': 'issues',
  '/': 'files',
  '@': 'repos',
};

const BROWSE_ORDER = ['pages', 'repos', 'starred', 'plus', 'search'];
const SCOPED_BROWSE_ORDER = ['pages', 'files', 'issues', 'plus', 'search'];
// A folder level is about its files, so they lead the empty list there.
const FOLDER_BROWSE_ORDER = ['files', 'pages', 'issues', 'plus', 'search'];
const GROUP_LIMIT = 8;
const BOUNDARY = /[\s/\-_.@:]/;
const WORD_END = /[a-z0-9]/;
const DIACRITICS = /[̀-ͯ]/g;
const LATIN_EXTENDED = /[À-ɏḀ-ỿ]/;

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

function endsWord(text, index) {
  return index >= text.length || !WORD_END.test(text[index]);
}

/**
 * Lowercase and strip Latin diacritics so `cafe` finds `Café`. `map` translates
 * an index in the folded text back to the original string, which keeps the
 * highlight ranges on the title the user sees.
 */
function foldText(text) {
  const lower = String(text ?? '').toLowerCase();
  if (!LATIN_EXTENDED.test(lower)) return { text: lower, map: null };
  let folded = '';
  const map = [];
  for (let index = 0; index < lower.length; index += 1) {
    const piece = lower[index].normalize('NFD').replace(DIACRITICS, '');
    for (let offset = 0; offset < piece.length; offset += 1) map.push(index);
    folded += piece;
  }
  map.push(lower.length);
  return { text: folded, map };
}

function mapRange(map, start, end) {
  if (!map) return [start, end];
  return [map[start] ?? 0, (map[end - 1] ?? start) + 1];
}

function subsequencePositions(needle, haystack, preferBoundary) {
  const positions = [];
  let cursor = 0;
  for (const character of needle) {
    let found = -1;
    if (preferBoundary) {
      for (let index = cursor; index < haystack.length; index += 1) {
        if (haystack[index] === character && isBoundary(haystack, index)) {
          found = index;
          break;
        }
      }
    }
    if (found === -1) found = haystack.indexOf(character, cursor);
    if (found === -1) return null;
    positions.push(found);
    cursor = found + 1;
  }
  return positions;
}

function scorePositions(needle, positions, haystack, map) {
  let gaps = 0;
  let boundaries = 0;
  const ranges = [];
  for (let index = 0; index < positions.length; index += 1) {
    const start = positions[index];
    if (index > 0) gaps += start - positions[index - 1] - 1;
    if (isBoundary(haystack, start)) boundaries += 1;
    const [from, to] = mapRange(map, start, start + 1);
    const last = ranges[ranges.length - 1];
    if (last && from <= last[1]) last[1] = Math.max(last[1], to);
    else ranges.push([from, to]);
  }

  return {
    score: 100 + needle.length * 5 + boundaries * 25 - gaps * 8 - positions[0] * 2,
    ranges,
  };
}

/**
 * Score one folded query against one folded text. An exact substring beats any
 * scattered subsequence; word starts and whole-word hits add a bonus, gaps
 * cost. Returns null when a query character is missing.
 */
function scoreFolded(needle, haystack, map) {
  if (!needle) return { score: 0, ranges: [] };
  if (!haystack) return null;

  const exact = haystack.indexOf(needle);
  if (exact !== -1) {
    const end = exact + needle.length;
    let score = 1000 + needle.length * 10;
    if (exact === 0) score += 100;
    else if (isBoundary(haystack, exact)) score += 60;
    if (endsWord(haystack, end)) score += 40;
    score += Math.max(0, 50 - haystack.length);
    return { score, ranges: [mapRange(map, exact, end)] };
  }

  const greedy = subsequencePositions(needle, haystack, false);
  if (!greedy) return null;
  // A second pass prefers word starts, so `gt` reads as the initials of
  // `git-status` rather than landing inside the first word.
  const aligned = subsequencePositions(needle, haystack, true);
  const plain = scorePositions(needle, greedy, haystack, map);
  if (!aligned) return plain;
  const preferred = scorePositions(needle, aligned, haystack, map);
  return preferred.score > plain.score ? preferred : plain;
}

/** Score one query against one text, with diacritics folded on both sides. */
export function scoreText(query, text) {
  const needle = foldText(query).text;
  const haystack = foldText(text);
  return scoreFolded(needle, haystack.text, haystack.map);
}

function modeAllows(candidate, mode) {
  if (mode === 'commands') return candidate.kind === 'command';
  if (mode === 'issues') return candidate.kind === 'issue';
  if (mode === 'files') return candidate.kind === 'file';
  if (mode === 'repos') return candidate.kind === 'repo';
  return true;
}

function candidateRepo(candidate) {
  return candidate?.data?.fullName || candidate?.data?.repo || '';
}

function inScope(candidate, scope) {
  if (!scope?.repo) return true;
  if (candidate.kind === 'command') return true;
  if (candidateRepo(candidate) !== scope.repo) return false;
  if (!scope.dir || candidate.kind !== 'file') return true;
  const path = candidate.data?.path || '';
  return path === scope.dir || path.startsWith(`${scope.dir}/`);
}

function browseOrder(options) {
  if (options.browseOrder) return options.browseOrder;
  if (options.scope?.dir) return FOLDER_BROWSE_ORDER;
  return options.scope?.repo ? SCOPED_BROWSE_ORDER : BROWSE_ORDER;
}

const foldedFieldCache = new WeakMap();

function foldedFields(fields) {
  if (!Array.isArray(fields)) return [];
  let cached = foldedFieldCache.get(fields);
  if (!cached) {
    cached = fields.map((field) => ({
      weight: field.weight ?? 1,
      folded: foldText(field.text),
    }));
    foldedFieldCache.set(fields, cached);
  }
  return cached;
}

function bestFieldScore(foldedTerm, fields) {
  let best = null;
  for (const field of foldedFields(fields)) {
    const result = scoreFolded(foldedTerm, field.folded.text, field.folded.map);
    if (!result) continue;
    const score = result.score * field.weight;
    if (best === null || score > best) best = score;
  }
  return best;
}

function highlightRanges(title, foldedTerms) {
  const folded = foldText(title);
  const ranges = [];
  for (const term of foldedTerms) {
    const result = scoreFolded(term, folded.text, folded.map);
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

function emptyQuery(candidates, options, titles, mode = 'all') {
  const byKey = new Map(candidates.map((candidate) => [candidate.key, candidate]));
  const allowed = new Set(
    candidates.filter((candidate) => modeAllows(candidate, mode)).map((candidate) => candidate.key),
  );
  const seen = new Set();
  const take = (keys) => {
    const items = [];
    for (const key of keys) {
      if (seen.has(key) || !allowed.has(key)) continue;
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
  const inFolder = Boolean(options.scope?.dir);
  for (const candidate of candidates) {
    if (seen.has(candidate.key) || !allowed.has(candidate.key)) continue;
    // GitHub lists no files or issues until a prefix or a query asks for them,
    // except inside a folder level, whose whole point is its files.
    if (!inFolder && mode !== 'files' && (candidate.kind === 'file' || candidate.groupId === 'files')) continue;
    if (mode !== 'issues' && (candidate.kind === 'issue' || candidate.groupId === 'issues')) continue;
    if (options.scope?.repo && mode === 'all' && candidate.groupId === 'plus') continue;
    if (!structural.has(candidate.groupId)) structural.set(candidate.groupId, []);
    structural.get(candidate.groupId).push(candidate);
  }
  const order = browseOrder(options);
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
  const favorites = new Set([...(options.pinnedKeys || []), ...(options.recentKeys || [])]);
  const all = (Array.isArray(candidates) ? candidates : [])
    .filter((candidate) => favorites.has(candidate.key) || inScope(candidate, options.scope));
  const titles = options.titles || { pinned: 'Pinned', recent: 'Recent' };

  if (!parsed.text) return emptyQuery(all, options, titles, parsed.mode);

  const terms = parsed.text.split(/\s+/).filter(Boolean).map((term) => foldText(term).text);
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
    const relevance = total;
    if (pinned.has(candidate.key)) total += 1000;
    else if (recent.has(candidate.key)) total += 100;
    scored.push({
      ...candidate,
      score: total,
      relevance,
      highlight: highlightRanges(candidate.title, terms),
    });
  }

  const byScore = (left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    return (left.sortKey ?? 0) - (right.sortKey ?? 0);
  };

  let promoted = null;
  if (parsed.mode === 'all') {
    for (const item of scored) {
      if (item.groupId === 'search') continue;
      if (!promoted || item.relevance > promoted.relevance) promoted = item;
    }
    if (promoted && !(promoted.relevance > 0)) promoted = null;
  }
  const isPromoted = (item) => Boolean(promoted) && item.key === promoted.key;
  const pinnedItems = scored.filter((item) => pinned.has(item.key) && !isPromoted(item)).sort(byScore);
  const rest = scored.filter((item) => !pinned.has(item.key) && !isPromoted(item));

  const groupCaps = options.groupCaps || { command: 8, file: 12, repo: 15 };
  const byGroup = new Map();
  for (const item of rest) {
    if (!byGroup.has(item.groupId)) byGroup.set(item.groupId, []);
    byGroup.get(item.groupId).push(item);
  }

  const order = browseOrder(options);
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
  const withTop = promoted
    ? [{ id: 'top', title: titles.top || 'Top result', items: [promoted] }, ...capped]
    : capped;
  return { groups: withTop.filter((group) => group.items.length), total: scored.length };
}
