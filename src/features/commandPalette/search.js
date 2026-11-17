import { parseQuery, rankCandidates } from './rank.js';
import { searchCommands } from './commands.js';

/**
 * Resolve one query against the palette's candidates. A query that matches
 * nothing becomes a GitHub search for the same text instead of a dead end.
 */
export function searchPalette(state, query) {
  const parsed = parseQuery(query);

  if (parsed.mode === 'search') {
    const items = parsed.text ? searchCommands(parsed.text) : [];
    return { groups: items.length ? [{ id: 'search', title: items[0].groupTitle, items }] : [], total: items.length };
  }

  const result = rankCandidates(state.candidates, query, {
    pinnedKeys: state.pinnedKeys,
    recentKeys: state.recentKeys,
    maxResults: state.settings.maxResults,
  });
  if (result.total === 0 && parsed.text) {
    const items = searchCommands(parsed.text);
    return { groups: [{ id: 'search', title: items[0].groupTitle, items }], total: 1 };
  }
  return result;
}
