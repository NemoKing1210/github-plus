/**
 * Stroke icon set for the image viewer: 16×16 glyphs drawn with
 * `currentColor`, round caps and a 1.5px stroke so the toolbar matches the
 * outline icons the settings pages use. The viewer is reusable UI, so its
 * glyphs live here rather than in the settings feature; the context menu's
 * action glyphs share the same drawing style.
 */
function svg(markup) {
  return (
    '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" '
    + `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${markup}</svg>`
  );
}

export const VIEWER_ICONS = {
  close: svg('<path d="M4.25 4.25l7.5 7.5M11.75 4.25l-7.5 7.5"/>'),
  chevronLeft: svg('<path d="M9.75 3.5 5.5 8l4.25 4.5"/>'),
  chevronRight: svg('<path d="M6.25 3.5 10.5 8l-4.25 4.5"/>'),
  zoomIn: svg(
    '<circle cx="7" cy="7" r="4.25"/>'
    + '<path d="m10.3 10.3 3.2 3.2"/>'
    + '<path d="M7 5.1v3.8M5.1 7h3.8"/>',
  ),
  zoomOut: svg(
    '<circle cx="7" cy="7" r="4.25"/>'
    + '<path d="m10.3 10.3 3.2 3.2"/>'
    + '<path d="M5.1 7h3.8"/>',
  ),
  rotate: svg(
    '<path d="M13 8a5 5 0 1 1-1.464-3.536"/>'
    + '<path d="M9.62 3.97 11.54 4.46 11.04 2.55"/>',
  ),
  fit: svg(
    '<path d="M6 2.5H3.6a1.1 1.1 0 0 0-1.1 1.1V6M10 2.5h2.4a1.1 1.1 0 0 1 1.1 1.1V6'
    + 'M6 13.5H3.6a1.1 1.1 0 0 1-1.1-1.1V10M10 13.5h2.4a1.1 1.1 0 0 0 1.1-1.1V10"/>',
  ),
  external: svg(
    '<path d="M9 2.5h4.5V7"/>'
    + '<path d="M13.5 2.5 8 8"/>'
    + '<path d="M12 10V13H3V4h3"/>',
  ),
  download: svg(
    '<path d="M8 2.5v7.5"/>'
    + '<path d="m5 7.25 3 3 3-3"/>'
    + '<path d="M3 13.5h10"/>',
  ),
  help: svg(
    '<circle cx="8" cy="8" r="5.75"/>'
    + '<path d="M6.3 6.1a1.75 1.75 0 0 1 3.4.65c0 1.2-1.7 1.35-1.7 2.65"/>'
    + '<path d="M8 12h.01"/>',
  ),
  imageOff: svg(
    '<rect x="2.75" y="2.75" width="10.5" height="10.5" rx="1.75"/>'
    + '<path d="M3.8 12.2 12.2 3.8"/>',
  ),
};

/** Action glyphs for the context menu, in the viewer's stroke style. */
export const ACTION_ICONS = {
  open: svg(
    '<path d="M9 1.75H4.6A1.6 1.6 0 0 0 3 3.35v9.3a1.6 1.6 0 0 0 1.6 1.6h6.8a1.6 1.6 0 0 0 1.6-1.6V5.25Z"/>'
    + '<path d="M9 1.75v3.5h3.5"/>',
  ),
  external: VIEWER_ICONS.external,
  download: VIEWER_ICONS.download,
  copy: svg(
    '<rect x="5.75" y="5.75" width="7.5" height="7.5" rx="1.25"/>'
    + '<path d="M10.25 3.75v-.5a1.5 1.5 0 0 0-1.5-1.5h-5a1.5 1.5 0 0 0-1.5 1.5v5a1.5 1.5 0 0 0 1.5 1.5h.5"/>',
  ),
  link: svg(
    '<path d="M6.5 9.5 9.5 6.5"/>'
    + '<path d="M7.25 4.25 8.4 3.1a2.55 2.55 0 0 1 3.6 3.6l-1.15 1.15"/>'
    + '<path d="M8.75 11.75 7.6 12.9a2.55 2.55 0 0 1-3.6-3.6l1.15-1.15"/>',
  ),
  path: svg(
    '<path d="M3 3v5a2 2 0 0 0 2 2h6"/>'
    + '<path d="m9 7.5 2.5 2.5L9 12.5"/>',
  ),
  name: svg(
    '<path d="M2.75 2.75h4.5l6 6-4.5 4.5-6-6Z"/>'
    + '<circle cx="5.6" cy="5.6" r=".9"/>',
  ),
  expand: svg('<path d="m4 6 4 4 4-4"/>'),
  collapse: svg('<path d="m4 10 4-4 4 4"/>'),
  eye: svg(
    '<path d="M1.75 8s2.25-3.75 6.25-3.75S14.25 8 14.25 8 12 11.75 8 11.75 1.75 8 1.75 8Z"/>'
    + '<circle cx="8" cy="8" r="1.9"/>',
  ),
  translate: svg(
    '<path d="M1.75 3.25h5M4.25 2v1.25M2.75 6.25c.75 1.5 1.9 2.6 3.4 3.3M6.25 6.25c-.75 1.5-1.9 2.6-3.4 3.3"/>'
    + '<path d="M8.75 13.75 11 7.25l2.25 6.5M9.5 11.75h3.25"/>',
  ),
};

/** Command palette glyphs, reusing the shared ones where the shape is identical. */
export const PALETTE_ICONS = {
  // GitHub's own command-palette Octicon: the header entry sits among GitHub's
  // filled icons, so a stroked glyph would read as foreign chrome.
  palette: '<svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor" aria-hidden="true">'
    + '<path d="m6.354 8.04-4.773 4.773a.75.75 0 1 0 1.061 1.06L7.945 8.57a.75.75 0 0 0 0-1.06L2.642 2.206a.75.75 0 0 0-1.06 1.061L6.353 8.04ZM8.75 11.5a.75.75 0 0 0 0 1.5h5.5a.75.75 0 0 0 0-1.5h-5.5Z"/>'
    + '</svg>',
  search: svg(
    '<circle cx="7" cy="7" r="4.25"/>'
    + '<path d="m10.3 10.3 3.2 3.2"/>',
  ),
  repo: svg(
    '<path d="M3.5 2.5h7.25L13 4.75v8.75H3.5Z"/>'
    + '<path d="M5.75 5.5h4.5M5.75 8h4.5M5.75 10.5h2.75"/>',
  ),
  star: svg(
    '<path d="m8 2.5 1.65 3.45 3.85.5-2.8 2.65.7 3.8L8 11l-3.4 1.9.7-3.8-2.8-2.65 3.85-.5Z"/>',
  ),
  folder: svg('<path d="M2.5 4.5h3.75l1.25 1.5h6v6.5h-11Z"/>'),
  issueOpened: svg(
    '<circle cx="8" cy="8" r="5.5"/>'
    + '<circle cx="8" cy="8" r="1.5" fill="currentColor" stroke="none"/>',
  ),
  pullRequest: svg(
    '<circle cx="4.5" cy="3.5" r="1.5"/>'
    + '<circle cx="4.5" cy="12.5" r="1.5"/>'
    + '<circle cx="11.5" cy="12.5" r="1.5"/>'
    + '<path d="M4.5 5v6"/>'
    + '<path d="M11.5 9.5V7a2 2 0 0 0-2-2H7"/>',
  ),
  file: svg(
    '<path d="M9 2.5H4.5v11h7V6Z"/>'
    + '<path d="M9 2.5V6h2.5"/>',
  ),
  terminal: svg(
    '<path d="m4 5.25 3 2.75-3 2.75"/>'
    + '<path d="M8.75 11h3.25"/>',
  ),
  pin: svg(
    '<path d="M6 2.5h4l-.5 3 2 2v1H4.5v-1l2-2Z"/>'
    + '<path d="M8 9v4.5"/>',
  ),
  more: svg(
    '<circle cx="3.5" cy="8" r="0.9" fill="currentColor" stroke="none"/>'
    + '<circle cx="8" cy="8" r="0.9" fill="currentColor" stroke="none"/>'
    + '<circle cx="12.5" cy="8" r="0.9" fill="currentColor" stroke="none"/>',
  ),
  copy: ACTION_ICONS.copy,
  external: VIEWER_ICONS.external,
  refresh: svg(
    '<path d="M13 8a5 5 0 1 1-1.46-3.54"/>'
    + '<path d="M13 2.5v3h-3"/>',
  ),
  check: svg('<path d="m3.5 8.5 3 3 6-7"/>'),
  gear: svg(
    '<circle cx="8" cy="8" r="2.25"/>'
    + '<path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.8 3.8l1 1M11.2 11.2l1 1M12.2 3.8l-1 1M4.8 11.2l-1 1"/>',
  ),
  trash: svg(
    '<path d="M3 4.5h10"/>'
    + '<path d="M6.5 4.5V3h3v1.5"/>'
    + '<path d="m4.5 4.5.5 8.5h6l.5-8.5"/>',
  ),
  home: svg(
    '<path d="M2.5 7.5 8 2.5l5.5 5"/>'
    + '<path d="M4.5 6.5v7h7v-7"/>',
  ),
  bell: svg(
    '<path d="M4.5 11.5V7a3.5 3.5 0 0 1 7 0v4.5"/>'
    + '<path d="M3 11.5h10"/>'
    + '<path d="M6.75 13a1.25 1.25 0 0 0 2.5 0"/>',
  ),
  comment: svg(
    '<path d="M2.5 3.5h11v7h-6l-3 2.5v-2.5h-2Z"/>',
  ),
  shield: svg(
    '<path d="M8 2.5 13 4v4c0 2.8-2.1 4.7-5 5.5-2.9-.8-5-2.7-5-5.5V4Z"/>',
  ),
  graph: svg(
    '<path d="M2.5 13.5v-4M6.5 13.5v-7M10.5 13.5v-3M14 13.5V4"/>',
  ),
};

/** Similar-repositories panel glyphs, in the same stroke style and scale. */
export const SIMILAR_ICONS = {
  stars: svg(
    '<path d="m8 2.25 1.75 3.55 3.9.57-2.82 2.75.66 3.88L8 11.17l-3.49 1.83.66-3.88L2.35 6.37l3.9-.57Z"/>',
  ),
  forks: svg(
    '<circle cx="4.25" cy="3.5" r="1.5"/>'
    + '<circle cx="11.75" cy="3.5" r="1.5"/>'
    + '<circle cx="8" cy="12.5" r="1.5"/>'
    + '<path d="M4.25 5v1.5a2 2 0 0 0 2 2h3.5a2 2 0 0 0 2-2V5"/>'
    + '<path d="M8 8.5v2.5"/>',
  ),
};
