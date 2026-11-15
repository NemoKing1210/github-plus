import { ICON_BODIES, ICON_VIEWBOXES } from './iconSet.generated.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
/** Marker on a native GitHub icon that we hid, so it can be restored. */
const NATIVE_CLASS = 'gp-fi-native';
let renderCount = 0;

/**
 * Prefix every id the icon defines (and its `url(#…)` / `href="#…"`
 * references) so a repeated icon never duplicates an id in the page and never
 * collides with GitHub's own ids. Kotlin, Maven and the CSS folder icon use
 * gradients/`<use>` and would otherwise repeat `id="a"`.
 */
function scopeIds(body, prefix) {
  return body
    .replace(/\sid="([^"]+)"/g, (_, id) => ` id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${prefix}${id})`)
    .replace(/\bhref="#([^"]+)"/g, (_, id) => `href="#${prefix}${id}"`);
}

/** Build the injected icon element for an icon id (falls back to the file glyph). */
export function renderIcon(id) {
  const key = ICON_BODIES[id] ? id : 'file';
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', ICON_VIEWBOXES[key] || '0 0 16 16');
  svg.setAttribute('class', 'gp-fi');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = scopeIds(ICON_BODIES[key], `gp-fi-${(renderCount += 1)}-`);
  return svg;
}

/**
 * Place our icon right before the native icon (or the filename when the row
 * has no icon) and hide the native one with an inline style, so no stylesheet
 * rule ever targets GitHub's markup.
 */
export function placeIcon(icon, nativeIcon, nameNode) {
  const parent = nativeIcon?.parentNode || nameNode?.parentNode;
  const before = nativeIcon || nameNode;
  if (!parent || !before) return false;
  parent.insertBefore(icon, before);
  if (nativeIcon) {
    nativeIcon.style.setProperty('display', 'none', 'important');
    nativeIcon.classList.add(NATIVE_CLASS);
  }
  return true;
}

/** Remove every injected icon and reveal every native icon again. */
export function clearIcons() {
  const icons = document.querySelectorAll('svg.gp-fi');
  for (let i = 0; i < icons.length; i += 1) icons[i].remove();
  const natives = document.querySelectorAll(`.${NATIVE_CLASS}`);
  for (let i = 0; i < natives.length; i += 1) {
    natives[i].style.removeProperty('display');
    natives[i].classList.remove(NATIVE_CLASS);
  }
}
