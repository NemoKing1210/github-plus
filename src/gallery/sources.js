/**
 * Gallery source registry.
 *
 * A source teaches the gallery where a page keeps images and how to turn the
 * rendered markup into viewer items. Everything the gallery does is driven by
 * this registry, so a new location (a diff view, an issue timeline, a
 * project board, …) is added by registering one source — no changes to the
 * gallery itself.
 *
 * @typedef {Object} GalleryItem
 * @property {HTMLImageElement} node  rendered image element (identity for click lookup)
 * @property {string} src             URL currently rendered by the page
 * @property {string} [alt]           alt text
 * @property {string} [title]         tooltip text
 * @property {string} [href]          URL of the link wrapping the image, if any
 * @property {string} [canonical]     original URL when `src` is a proxy address
 *
 * @typedef {Object} GallerySource
 * @property {string} id              stable id, also the settings switch key
 * @property {string} labelKey        i18n key of the settings label
 * @property {string} hintKey         i18n key of the settings hint
 * @property {string} [containerSelector] container holding one gallery set
 * @property {string} cursorSelector  selector(s) that get the zoom-in cursor
 * @property {(container: Element) => GalleryItem[]} collect
 * @property {(item: GalleryItem) => string} [resolveFull] best full-size URL, '' when unknown
 * @property {(node: Element) => Element | null} [match] container lookup override
 */

const sources = new Map();

/** Register a gallery source. Later registrations with the same id replace it. */
export function registerSource(source) {
  if (!source || typeof source.id !== 'string' || !source.id) {
    throw new TypeError('gallery source needs a string id');
  }
  if (typeof source.collect !== 'function') {
    throw new TypeError(`gallery source "${source.id}" needs a collect(container) function`);
  }
  sources.set(source.id, source);
  return source;
}

/** Every registered source, in registration order. */
export function listSources() {
  const list = [];
  sources.forEach((source) => list.push(source));
  return list;
}
