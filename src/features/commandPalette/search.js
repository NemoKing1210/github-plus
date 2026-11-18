import { t } from '../../i18n/index.js';
import { parseQuery, rankCandidates } from './rank.js';
import { searchCommands } from './commands.js';

/**
 * Resolve one query against the palette's candidates and keep the GitHub
 * search handoff as the last row of every typed query, so a search is never a
 * dead end even when other results match.
 */
export function searchPalette(state, query, titles) {
  const parsed = parseQuery(query);
  const result = rankCandidates(state.candidates, query, {
    pinnedKeys: state.pinnedKeys,
    recentKeys: state.recentKeys,
    maxResults: state.settings.maxResults,
    titles,
    scope: state.scope || null,
  });
  if (!parsed.text) return result;

  const fallback = searchCommands(parsed.text, {
    scope: state.scope || null,
    mode: parsed.mode,
  });
  if (!fallback.length) return result;

  return {
    groups: [
      ...result.groups,
      {
        id: 'search',
        title: t('palette.group.search'),
        items: fallback,
      },
    ],
    total: result.total + 1,
  };
}
