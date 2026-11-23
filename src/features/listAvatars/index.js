import { on } from '../../core/bus.js';
import { createLogger } from '../../core/logger/index.js';
import { getListAvatarsSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { clearAvatars, placeAvatar } from './inject.js';
import { CONTAINER_SELECTOR, resolveRowAuthor } from './surfaces.js';

const log = createLogger('list-avatars');

/**
 * Author avatars in the Issues and Pull Requests lists.
 *
 * Both lists share GitHub's React list view, so one container selector covers
 * them. The avatar is inserted into the row's own metadata line, which keeps
 * the page text and GitHub's filter controls untouched; one MutationObserver
 * per known container (never the document) plus the shared bounded settle wait
 * catch rows React renders or recycles.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a list that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/** List container -> observer. */
const observers = new Map();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;
let noSurfaceReported = false;

function processContainer(container) {
  if (!getListAvatarsSettings().enabled) return;
  const rows = container.children;
  for (let i = 0; i < rows.length; i += 1) {
    const author = resolveRowAuthor(rows[i]);
    if (author) placeAvatar(author.node, author.login);
  }
}

function attach(container) {
  const observer = new MutationObserver(debounce(() => processContainer(container), RESCAN_MS));
  // A recycled row can change only the author control's address in place, so
  // the login's two sources are watched alongside the row structure.
  observer.observe(container, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['href', 'data-hovercard-url'],
  });
  observers.set(container, observer);
  processContainer(container);
}

function stopSettle() {
  if (settleTimer === null) return;
  clearInterval(settleTimer);
  settleTimer = null;
}

function syncSurfaces() {
  if (!getListAvatarsSettings().enabled) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  const found = document.querySelectorAll(CONTAINER_SELECTOR);
  for (let i = 0; i < found.length; i += 1) {
    if (!observers.has(found[i])) attach(found[i]);
  }
  if (found.length) noSurfaceReported = false;
  return found.length;
}

/**
 * GitHub mounts the list after the navigation shell, so a navigation event can
 * fire before the container exists. Retry the query for a bounded time and
 * stop as soon as a list is attached.
 */
function settleSurfaces() {
  stopSettle();
  let tries = 0;
  settleTimer = setInterval(() => {
    tries += 1;
    if (!getListAvatarsSettings().enabled || syncSurfaces() > 0) {
      stopSettle();
      return;
    }
    if (tries >= SETTLE_TRIES) {
      stopSettle();
      if (!noSurfaceReported) {
        noSurfaceReported = true;
        log.info('no issue or pull-request list on this page');
      }
    }
  }, SETTLE_MS);
}

/** Watch the current body; a replaced body leaves the previous observer dead. */
function observeBody() {
  if (typeof MutationObserver !== 'function') return;
  const body = document.body;
  if (!body || (bodyObserver && observedBody === body)) return;
  if (bodyObserver) bodyObserver.disconnect();
  observedBody = body;
  bodyObserver = new MutationObserver(debounce(applyListAvatarsSettings, SHELL_MS));
  bodyObserver.observe(body, { childList: true });
}

/** Watch the navigation shell for an app-shell swap, direct children only. */
function observeShell() {
  observeBody();
  if (shellObserver || typeof MutationObserver !== 'function') return;
  if (!document.documentElement) return;
  shellObserver = new MutationObserver(
    debounce(() => {
      if (observedBody === document.body) return;
      observeBody();
      applyListAvatarsSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

function teardown() {
  stopSettle();
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  clearAvatars(document);
}

/** Apply the current settings: watch the lists, or tear everything down. */
export function applyListAvatarsSettings() {
  observeShell();
  teardown();
  if (!getListAvatarsSettings().enabled) return;
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the list-avatars feature (idempotent). */
export function initListAvatarsFeature() {
  on('settings:listAvatars', applyListAvatarsSettings);
  watchNavigation(applyListAvatarsSettings);
  observeBody();
  applyListAvatarsSettings();
}
