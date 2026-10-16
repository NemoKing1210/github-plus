/**
 * Small DOM helpers shared by all features.
 */
export function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/** Append a node and return it, for terse DOM building. */
export function append(parent, node) {
  parent.appendChild(node);
  return node;
}

/** Debounce helper. */
export function debounce(fn, delay) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Iterate a DOM collection (NodeList, HTMLCollection, `addedNodes`) or any
 * array-like by index. DOM collections are not iterable in every engine a
 * userscript runs in, so `for...of` over them can throw "… is not
 * iterable" — iterate DOM collections with `eachNode`, never `for...of`.
 */
export function eachNode(collection, callback) {
  if (!collection) return;
  for (let index = 0; index < collection.length; index += 1) callback(collection[index], index);
}

/**
 * Copy a DOM collection (NodeList, HTMLCollection, `childNodes`) or any
 * array-like into a plain array. Also needed where collections are not
 * iterable, so `[...collection]` would throw.
 */
export function toArray(collection) {
  const items = [];
  if (!collection) return items;
  for (let index = 0; index < collection.length; index += 1) items.push(collection[index]);
  return items;
}

/** Whether the element belongs to GitHub Plus UI (never a page content node). */
export function isOwnUi(node) {
  return (
    node instanceof Element
    && !!node.closest('.gp-panel-overlay, .gp-confirm-overlay, .gp-toasts, .gp-settings-btn, .gp-viewer-overlay')
  );
}
