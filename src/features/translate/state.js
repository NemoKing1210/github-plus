import { getTranslateSettings } from '../../core/settings.js';
import { Codes, logError } from '../../core/debug.js';
import { getLocale, t } from '../../i18n/index.js';
import { toArray } from '../../utils/dom.js';
import { showToast } from '../../ui/toast.js';
import { translateSegments } from './api.js';
import { collectBlocks, extractBlock, renderBlockResult } from './blocks.js';
import {
  createButton, createResultBox, ensureChrome, removeChrome, setBarStatus, setButtonState,
} from './inject.js';
import { resolveTargetLang } from './languages.js';
import { missingProviderFields } from './providers/registry.js';
import { findContainers } from './surfaces.js';
import { stripTokens } from './tokens.js';

const states = new Map();

function buttonLabel(status) {
  if (status === 'loading') return t('translate.translating');
  if (status === 'shown' || status === 'partial') return t('translate.showOriginal');
  return t('translate.button');
}

/**
 * Report a status where the control actually lives: the fallback bar when the
 * container has one, otherwise the header-hosted button's own tooltip.
 */
function setStatus(state, text, options) {
  if (state.bar && state.bar.isConnected) {
    setBarStatus(state.container, text, options);
    return;
  }
  if (!state.button) return;
  if (text) state.button.title = text;
  else state.button.removeAttribute('title');
}

function restorePainted(state) {
  (state.painted || []).forEach(({ el, originalHtml, box }) => {
    if (box && box.parentNode) box.remove();
    if (el && originalHtml !== null && originalHtml !== undefined) el.innerHTML = originalHtml;
  });
  state.painted = [];
}

/**
 * `reveal: hover` — show the source while the pointer or focus is inside the
 * container. The translated markup is snapshotted, because `restorePainted`
 * keeps only the source.
 */
function revealOnHover(state) {
  if (state.reveal !== 'hover' || state.display !== 'replace' || state.revealed) return;
  if (state.status !== 'shown' && state.status !== 'partial') return;
  state.revealed = state.painted.map((entry) => ({
    entry,
    html: entry.box ? null : entry.el.innerHTML,
  }));
  restorePainted(state);
  state.signature = state.container.textContent.length;
}

/** Put the translated markup back when the pointer or focus leaves. */
function restoreAfterHover(state) {
  if (!state.revealed) return;
  const revealed = state.revealed;
  state.revealed = null;
  revealed.forEach(({ entry, html }) => {
    if (entry.el && entry.el.isConnected && html !== null) entry.el.innerHTML = html;
    state.painted.push(entry);
  });
  state.signature = state.container.textContent.length;
}

function pruneDetached() {
  // A detached container may share a live page header with its replacement, so
  // dropping the state alone would leave its button stacked in that header.
  Array.from(states.keys()).forEach((container) => {
    if (!container.isConnected) teardownContainer(container);
  });
}

/**
 * Decorate one surface container with the translate control, or return the
 * existing state when the container content did not change. Null when the
 * container has nothing translatable.
 */
export function ensureContainer(container, surface, { button } = {}) {
  if (!container) return null;
  pruneDetached();
  if (!collectBlocks(container).length) return null;

  const existing = states.get(container);
  if (existing) {
    if (existing.signature === container.textContent.length) {
      // A React re-render can drop our control from a page header without
      // touching the container's content, so a dropped button is put back.
      if (!existing.button.isConnected) {
        const header = existing.surface && typeof existing.surface.headerFor === 'function'
          ? existing.surface.headerFor(container)
          : null;
        ensureChrome(container, { header, button: existing.button });
      }
      return existing;
    }
    teardownContainer(container);
  }

  const control = button || createButton(t('translate.button'));
  const header = surface && typeof surface.headerFor === 'function'
    ? surface.headerFor(container)
    : null;
  const { bar } = ensureChrome(container, { header, button: control });
  const state = {
    container,
    surface,
    button: control,
    bar,
    status: 'idle',
    painted: [],
    revealed: null,
    runId: 0,
    signature: container.textContent.length,
  };
  // A caller-supplied control (the preview header action) owns its own handler;
  // binding here too would toggle twice per click.
  if (!button) control.addEventListener('click', () => activate(state));

  const revealHandlers = {
    onEnter: () => revealOnHover(state),
    onLeave: () => restoreAfterHover(state),
  };
  container.addEventListener('pointerenter', revealHandlers.onEnter);
  container.addEventListener('pointerleave', revealHandlers.onLeave);
  container.addEventListener('focusin', revealHandlers.onEnter);
  container.addEventListener('focusout', revealHandlers.onLeave);
  state.revealHandlers = revealHandlers;

  states.set(container, state);
  setButtonState(control, 'idle', { label: t('translate.button') });
  return state;
}

/** The live state for a container, or null. */
export function stateFor(container) {
  return states.get(container) || null;
}

/**
 * Collect the container's blocks and translate them through the configured
 * provider (or an injected `translate`). `focus` is set only by a user
 * gesture, so auto translation never steals focus.
 */
export async function runContainer(state, { translate, focus = false } = {}) {
  if (!state || !state.container || state.status === 'loading') return;

  const blocks = collectBlocks(state.container);
  const rows = [];
  blocks.forEach((el) => {
    const data = extractBlock(el);
    if (data) rows.push({ el, data });
  });
  if (!rows.length) {
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    return;
  }

  const settings = getTranslateSettings();
  if (typeof translate !== 'function') {
    const missing = missingProviderFields(
      settings.provider,
      settings.providerConfig[settings.provider],
    );
    if (missing.length) {
      state.status = 'error';
      setButtonState(state.button, 'idle', { label: t('translate.button') });
      setStatus(state, t('translate.missingConfigDesc'), { error: true });
      showToast({
        type: 'error',
        title: t('translate.missingConfig'),
        message: t('translate.missingConfigDesc'),
        key: 'translate-missing-config',
      });
      return;
    }
  }

  const display = state.display || settings.display || 'replace';
  const target = resolveTargetLang(settings.targetLang, getLocale());
  const runId = state.runId + 1;
  state.runId = runId;
  state.status = 'loading';
  state.display = display;
  state.reveal = settings.reveal === 'hover' ? 'hover' : 'button';
  state.revealed = null;
  state.painted = [];
  state.signature = state.container.textContent.length;

  const segments = [];
  const records = [];
  const recordById = new Map();
  const labelOwner = new Map();

  rows.forEach((row, index) => {
    const blockId = `b${index}`;
    const record = {
      id: blockId,
      el: row.el,
      data: row.data,
      translation: null,
      labelIds: [],
      labels: new Map(),
      painted: false,
      failed: false,
    };
    records.push(record);
    recordById.set(blockId, record);
    segments.push({ id: blockId, text: row.data.source });
    if (!settings.linkLabels) return;
    row.data.tokens.forEach((token, tokenIndex) => {
      if (!token.label) return;
      const labelId = `l${index}_${tokenIndex}`;
      record.labelIds.push({ id: labelId, tokenIndex });
      labelOwner.set(labelId, record);
      segments.push({ id: labelId, text: stripTokens(token.label) });
    });
  });

  const paint = (record) => {
    if (record.painted || record.failed || !record.translation) return;
    record.painted = true;
    const labels = [];
    record.labelIds.forEach(({ id, tokenIndex }) => {
      const value = record.labels.get(id);
      if (typeof value === 'string' && value) labels[tokenIndex] = value;
    });
    const result = renderBlockResult(record.data, record.translation.text, labels);
    // A provider that ate most placeholders would pile every inline element at
    // the end of the block; leave that block in its original language instead.
    if (record.data.tokens.length && result.missing.length > record.data.tokens.length / 2) {
      record.failed = true;
      return;
    }
    const html = result.html;
    if (display === 'below') {
      const box = createResultBox(html);
      const tag = record.el.tagName;
      if (tag === 'LI' || tag === 'TD' || tag === 'TH') record.el.appendChild(box);
      else record.el.insertAdjacentElement('afterend', box);
      state.painted.push({ el: record.el, originalHtml: null, box });
    } else {
      // A list item's own content excludes its nested lists; replacing the
      // inner HTML must not take those lists down with it.
      const nestedLists = record.el.tagName === 'LI'
        ? toArray(record.el.children).filter((child) => child.tagName === 'UL' || child.tagName === 'OL')
        : [];
      const originalHtml = record.el.innerHTML;
      record.el.innerHTML = html;
      nestedLists.forEach((list) => record.el.appendChild(list));
      state.painted.push({ el: record.el, originalHtml, box: null });
    }
  };

  const maybePaint = (record) => {
    if (record.painted || record.failed || !record.translation) return;
    if (record.labelIds.some(({ id }) => !record.labels.has(id))) return;
    paint(record);
  };

  const onProgress = (done, total) => {
    if (state.runId !== runId) return;
    const text = t('translate.progress', { done, total });
    if (state.bar && state.bar.isConnected) {
      setBarStatus(state.container, text);
      return;
    }
    setButtonState(state.button, 'loading', { label: t('translate.translating'), count: text });
  };

  const onResult = (id, result) => {
    if (state.runId !== runId) return;
    const record = recordById.get(id);
    if (record) {
      record.translation = result;
      maybePaint(record);
      return;
    }
    const owner = labelOwner.get(id);
    if (!owner) return;
    owner.labels.set(id, result.text);
    maybePaint(owner);
  };

  setButtonState(state.button, 'loading', { label: t('translate.translating') });
  setStatus(state, t('translate.translating'));

  try {
    await translateSegments(segments, target, { translate, onResult, onProgress });
  } catch {
    // Every segment is reported as failed by the missing results below.
  }
  if (state.runId !== runId) return;

  records.forEach((record) => {
    if (record.translation) paint(record);
  });

  const completed = records.filter((record) => record.translation && !record.failed);
  const failedCount = records.length - completed.length;
  const unchanged = failedCount === 0 && completed.every((record) => (
    stripTokens(record.translation.text) === stripTokens(record.data.source)
  ));

  if (unchanged) {
    restorePainted(state);
    state.status = 'idle';
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setStatus(state, t('translate.sameLanguage'));
    state.signature = state.container.textContent.length;
    return;
  }

  if (failedCount === records.length) {
    state.status = 'error';
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setStatus(state, t('translate.failed'), { error: true });
    logError(Codes.TRANSLATE, 'Translation failed for a container.', {
      surface: state.surface && state.surface.id,
    });
    showToast({
      type: 'error',
      title: t('translate.failed'),
      message: t('translate.failedDesc'),
      key: 'translate-failed',
    });
  } else if (failedCount > 0) {
    state.status = 'partial';
    setButtonState(state.button, 'shown', { label: t('translate.showOriginal') });
    setStatus(state, t('translate.partial'));
  } else {
    state.status = 'shown';
    setButtonState(state.button, 'shown', { label: t('translate.showOriginal') });
    setStatus(state, '');
  }

  state.signature = state.container.textContent.length;
  if (focus && state.button && typeof state.button.focus === 'function') state.button.focus();
}

/**
 * A shared page header outlives a navigation, so its button can still be bound
 * to the container of the file that just left. Resolve the file now under the
 * same header so the click never translates detached content.
 */
function rebindContainer(state) {
  const surface = state.surface;
  const parent = state.button ? state.button.parentElement : null;
  if (!surface || typeof surface.headerFor !== 'function' || !parent) return null;
  if (!Array.isArray(surface.roots) || !Array.isArray(surface.containers)) return null;
  const live = findContainers(surface).find(
    (container) => surface.headerFor(container) === parent,
  );
  return live ? ensureContainer(live, surface) : null;
}

function activate(state) {
  if (state.container && state.container.isConnected) {
    toggleContainer(state);
    return;
  }
  const bound = rebindContainer(state);
  if (bound) runContainer(bound, { focus: true }).catch(() => {});
}

/** Show the original again, or translate when the container is idle. */
export function toggleContainer(state) {
  if (!state) return;
  if (state.status === 'loading') return;
  if (state.status === 'shown' || state.status === 'partial') {
    state.revealed = null;
    restorePainted(state);
    state.status = 'idle';
    state.signature = state.container.textContent.length;
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setStatus(state, '');
    return;
  }
  runContainer(state, { focus: true }).catch(() => {});
}

/** Restore a container, remove its chrome and forget it. */
export function teardownContainer(container) {
  const state = states.get(container);
  if (!state) return;
  state.runId += 1;
  state.revealed = null;
  restorePainted(state);
  if (state.revealHandlers) {
    container.removeEventListener('pointerenter', state.revealHandlers.onEnter);
    container.removeEventListener('pointerleave', state.revealHandlers.onLeave);
    container.removeEventListener('focusin', state.revealHandlers.onEnter);
    container.removeEventListener('focusout', state.revealHandlers.onLeave);
  }
  removeChrome(container, state);
  states.delete(container);
}

/** Restore and forget every decorated container. */
export function teardownAllContainers() {
  Array.from(states.keys()).forEach((container) => teardownContainer(container));
  states.clear();
}

/** Re-apply localized button labels after a language change. */
export function repaintTranslateLabels() {
  states.forEach((state) => {
    const status = state.status === 'shown' || state.status === 'partial'
      ? 'shown'
      : (state.status === 'loading' ? 'loading' : 'idle');
    setButtonState(state.button, status, { label: buttonLabel(state.status) });
  });
}
