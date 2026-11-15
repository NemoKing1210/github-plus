/**
 * Stroke icon set for the image viewer: 16×16 glyphs drawn with
 * `currentColor`, round caps and a 1.5px stroke so the toolbar matches the
 * outline icons the settings pages use. The viewer is reusable UI, so its
 * glyphs live here rather than in the settings feature.
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
