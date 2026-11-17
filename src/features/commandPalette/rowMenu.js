import { PALETTE_ICONS } from '../../ui/icons.js';

/**
 * The command palette's per-row menu. Pure: it builds labels, icons and action
 * ids for a row kind; the palette feature decides what each id does.
 */

function cloneAddress(item) {
  const fullName = item.data?.fullName
    || (item.data?.owner && item.data?.name ? `${item.data.owner}/${item.data.name}` : '');
  return fullName ? `https://github.com/${fullName}.git` : '';
}

function entry(label, icon, actionId, onAction, disabled = false) {
  return { label, icon, disabled, onSelect: () => onAction(actionId) };
}

/**
 * Items for one row, with `null` entries as separators. Every kind offers the
 * favorite toggle, so an existing pin can always be removed where it is shown.
 */
export function rowMenuItems(item, { labels = {}, onAction = () => {}, pinned = false } = {}) {
  const favorite = entry(
    pinned ? labels.unpin : labels.pin,
    PALETTE_ICONS.star,
    'pin',
    onAction,
  );

  if (item.kind === 'repo') {
    return [
      entry(labels.open, PALETTE_ICONS.external, 'open', onAction),
      entry(labels.openNewTab, PALETTE_ICONS.external, 'newTab', onAction),
      entry(labels.copyLink, PALETTE_ICONS.copy, 'copyLink', onAction),
      entry(labels.copyClone, PALETTE_ICONS.copy, 'copyClone', onAction, !cloneAddress(item)),
      null,
      favorite,
    ];
  }
  if (item.kind === 'file') {
    return [
      entry(labels.open, PALETTE_ICONS.external, 'open', onAction),
      entry(labels.openNewTab, PALETTE_ICONS.external, 'newTab', onAction),
      entry(labels.copyPath, PALETTE_ICONS.copy, 'copyPath', onAction),
      entry(labels.copyLink, PALETTE_ICONS.copy, 'copyLink', onAction),
      null,
      favorite,
    ];
  }
  if (item.kind === 'issue') {
    return [
      entry(labels.open, PALETTE_ICONS.external, 'open', onAction),
      entry(labels.openNewTab, PALETTE_ICONS.external, 'newTab', onAction),
      entry(labels.copyLink, PALETTE_ICONS.copy, 'copyLink', onAction),
      entry(labels.copyNumber, PALETTE_ICONS.copy, 'copyNumber', onAction),
      null,
      favorite,
    ];
  }
  return [
    entry(labels.run || labels.open, PALETTE_ICONS.terminal, 'run', onAction),
    null,
    favorite,
  ];
}

export { cloneAddress };
