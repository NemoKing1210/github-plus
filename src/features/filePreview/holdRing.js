import { el } from '../../utils/dom.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** r = 100 / 2π, so the progress circle's dasharray is exactly 100. */
function circle(className) {
  const node = document.createElementNS(SVG_NS, 'circle');
  node.setAttribute('class', className);
  node.setAttribute('cx', '18');
  node.setAttribute('cy', '18');
  node.setAttribute('r', '15.9155');
  return node;
}

function buildRing() {
  const node = el('div', 'gp-hold-ring');
  node.hidden = true;
  node.setAttribute('aria-hidden', 'true');
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 36 36');
  svg.append(circle('gp-hold-ring__track'), circle('gp-hold-ring__fill'));
  node.appendChild(svg);
  return node;
}

let ring = null;

/**
 * Mount the ring host into the current `<body>`, before the feature attaches
 * its body observers. Showing and hiding the ring then only flips `hidden`:
 * a new body child would read as an app-shell swap, and the resulting
 * re-apply would tear the long-press listener down mid-gesture.
 */
export function mountHoldRing() {
  if (!document.body) return;
  if (!ring) ring = buildRing();
  if (ring.parentNode !== document.body) document.body.appendChild(ring);
}

/**
 * Show the ring at a pointer position and start its fill. A hidden element
 * cancels its CSS animation, so the next show restarts it from the first frame.
 * @param {number} x viewport coordinate
 * @param {number} y viewport coordinate
 * @param {number} durationMs the configured hold time
 */
export function showHoldRing(x, y, durationMs) {
  mountHoldRing();
  if (!ring) return;
  ring.style.left = `${x}px`;
  ring.style.top = `${y}px`;
  ring.style.setProperty('--gp-hold-duration', `${durationMs}ms`);
  ring.hidden = false;
}

/** Hide the ring, whether the press completed or was cancelled. */
export function hideHoldRing() {
  if (ring) ring.hidden = true;
}
