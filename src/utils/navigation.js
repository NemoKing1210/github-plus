/**
 * GitHub navigation watcher.
 *
 * GitHub swaps page content without a full reload (Turbo, plus classic
 * pushState navigation on older surfaces), so features that depend on the
 * current URL subscribe here instead of patching history themselves.
 * Listeners run after the new content is in the DOM.
 */
const listeners = new Set();
let installed = false;

function notify() {
  for (const fn of [...listeners]) {
    try {
      fn(location.href);
    } catch {
      /* one bad listener never breaks navigation */
    }
  }
}

function install() {
  if (installed) return;
  installed = true;
  for (const method of ['pushState', 'replaceState']) {
    try {
      const original = history[method];
      if (typeof original !== 'function' || original.__gpWrapped) continue;
      const wrapped = function (...args) {
        const result = original.apply(this, args);
        notify();
        return result;
      };
      wrapped.__gpWrapped = true;
      history[method] = wrapped;
    } catch {
      /* history is not patchable here */
    }
  }
  window.addEventListener('popstate', notify);
  window.addEventListener('hashchange', notify);
  // Turbo renders the new page after these fire; pjax is the legacy event.
  document.addEventListener('turbo:load', notify);
  document.addEventListener('turbo:render', notify);
  document.addEventListener('pjax:end', notify);
}

/** Subscribe to page URL changes. Returns an unsubscribe function. */
export function watchNavigation(fn) {
  install();
  listeners.add(fn);
  return () => listeners.delete(fn);
}
