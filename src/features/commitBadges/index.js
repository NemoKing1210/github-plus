import { on } from '../../core/bus.js';
import { Codes, createLogger } from '../../core/logger/index.js';
import { getCommitBadgesSettings } from '../../core/settings.js';
import { debounce } from '../../utils/dom.js';
import { watchNavigation } from '../../utils/navigation.js';
import { clearCommitBadges, decorateTitle, hasCommitBadge } from './inject.js';
import { parseCommitSubject } from './parse.js';
import { SURFACES } from './surfaces.js';

const log = createLogger('commit-badges');

/**
 * Commit badges: a Conventional Commit type and scope rendered as one
 * two-tone token at the start of a commit subject.
 *
 * The decoration is inline, inside GitHub's own title element, so the page
 * keeps its text, its copy behavior and its translation blocks. One
 * MutationObserver per known surface container (never the document) plus the
 * shared bounded settle wait catch rows React renders or recycles.
 */
const RESCAN_MS = 100;
const SHELL_MS = 200;
/** Bounded window for a commit list that mounts after the navigation shell. */
const SETTLE_MS = 250;
const SETTLE_TRIES = 20;

/** Title element -> its `textContent` at decoration time. */
let decorated = new WeakMap();
/** Surface container -> observer. */
const observers = new Map();
/** Surface ids whose selector already failed, so a broken surface logs once. */
const reported = new Set();
let bodyObserver = null;
let observedBody = null;
let shellObserver = null;
let settleTimer = null;
let noSurfaceReported = false;

function processTitle(title, settings) {
  const current = title.textContent;
  // A re-render can drop our spans while putting the same text back, so the
  // signature alone does not prove the badge survived: only an unchanged text
  // with the badge still in the DOM is current.
  if (decorated.get(title) === current && hasCommitBadge(title)) return;

  // A recycled row can change its subject while our wrapper is still in the
  // DOM; unwrap first so the parse sees the plain text, never our markup.
  if (hasCommitBadge(title)) clearCommitBadges(title);

  const parsed = parseCommitSubject(title.textContent);
  if (!parsed || (!parsed.known && !settings.unknownTypes)) {
    decorated.set(title, current);
    return;
  }
  decorateTitle(title, parsed, { breaking: settings.breaking });
  decorated.set(title, current);
}

function processContainer(container, surface) {
  if (surface.skip?.(container)) return;
  const settings = getCommitBadgesSettings();
  if (!settings.enabled) return;

  let rows;
  try {
    rows = surface.rows ? container.querySelectorAll(surface.rows) : [container];
  } catch (error) {
    if (!reported.has(surface.id)) {
      reported.add(surface.id);
      log.warn(Codes.COMMIT_BADGES, 'commit-badge surface has an invalid selector', {
        surface: surface.id,
        error,
      });
    }
    return;
  }

  for (let i = 0; i < rows.length; i += 1) {
    let title = null;
    try {
      title = surface.titleFor(rows[i]);
    } catch {
      title = null;
    }
    if (!title || !title.isConnected) continue;
    processTitle(title, settings);
  }
}

function attach(container, surface) {
  const observer = new MutationObserver(debounce(() => processContainer(container, surface), RESCAN_MS));
  observer.observe(container, { childList: true, subtree: true, characterData: true });
  observers.set(container, observer);
  processContainer(container, surface);
}

function stopSettle() {
  if (settleTimer === null) return;
  clearInterval(settleTimer);
  settleTimer = null;
}

function syncSurfaces() {
  if (!getCommitBadgesSettings().enabled) return 0;
  for (const [container, observer] of observers) {
    if (!container.isConnected) {
      observer.disconnect();
      observers.delete(container);
    }
  }
  let matched = 0;
  for (let s = 0; s < SURFACES.length; s += 1) {
    const surface = SURFACES[s];
    for (let c = 0; c < surface.containers.length; c += 1) {
      const found = document.querySelectorAll(surface.containers[c]);
      for (let i = 0; i < found.length; i += 1) {
        matched += 1;
        if (!observers.has(found[i])) attach(found[i], surface);
      }
    }
  }
  if (matched) noSurfaceReported = false;
  return matched;
}

/**
 * GitHub mounts the commit list after the navigation shell, so a navigation
 * event can fire before the surface exists. Retry the registry query for a
 * bounded time and stop as soon as a surface is attached.
 */
function settleSurfaces() {
  stopSettle();
  let tries = 0;
  settleTimer = setInterval(() => {
    tries += 1;
    if (!getCommitBadgesSettings().enabled || syncSurfaces() > 0) {
      stopSettle();
      return;
    }
    if (tries >= SETTLE_TRIES) {
      stopSettle();
      if (!noSurfaceReported) {
        noSurfaceReported = true;
        log.info('no commit-title surface on this page');
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
  bodyObserver = new MutationObserver(debounce(applyCommitBadgesSettings, SHELL_MS));
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
      applyCommitBadgesSettings();
    }, SHELL_MS),
  );
  shellObserver.observe(document.documentElement, { childList: true });
}

function teardown() {
  stopSettle();
  for (const observer of observers.values()) observer.disconnect();
  observers.clear();
  reported.clear();
  clearCommitBadges(document);
  decorated = new WeakMap();
}

/** Apply the current settings: watch the surfaces, or tear everything down. */
export function applyCommitBadgesSettings() {
  observeShell();
  teardown();
  if (!getCommitBadgesSettings().enabled) return;
  if (syncSurfaces() === 0) settleSurfaces();
}

/** Boot the commit-badges feature (idempotent). */
export function initCommitBadgesFeature() {
  on('settings:commitBadges', applyCommitBadgesSettings);
  on('translate:restored', (payload) => {
    if (!getCommitBadgesSettings().enabled) clearCommitBadges(payload?.container || document);
  });
  watchNavigation(applyCommitBadgesSettings);
  observeBody();
  applyCommitBadgesSettings();
}
