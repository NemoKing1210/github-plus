import { getTranslateSettings } from '../../core/settings.js';
import { Codes, logError } from '../../core/debug.js';
import { getLocale, t } from '../../i18n/index.js';
import { showToast } from '../../ui/toast.js';
import { translateSegments } from './api.js';
import { collectBlocks, extractBlock, renderBlockHtml } from './blocks.js';
import {
  createButton, createResultBox, ensureChrome, removeChrome, setBarStatus, setButtonState,
} from './inject.js';
import { resolveTargetLang } from './languages.js';
import { stripTokens } from './tokens.js';

const states = new Map();

function buttonLabel(status) {
  if (status === 'loading') return t('translate.translating');
  if (status === 'shown' || status === 'partial') return t('translate.showOriginal');
  return t('translate.button');
}

function restorePainted(state) {
  (state.painted || []).forEach(({ el, originalHtml, box }) => {
    if (box && box.parentNode) box.remove();
    if (el && originalHtml !== null && originalHtml !== undefined) el.innerHTML = originalHtml;
  });
  state.painted = [];
}

function pruneDetached() {
  states.forEach((state, container) => {
    if (!container.isConnected) states.delete(container);
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
    if (existing.signature === container.textContent.length) return existing;
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
    runId: 0,
    signature: container.textContent.length,
  };
  control.addEventListener('click', () => toggleContainer(state));
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
 * provider (or an injected `translate`).
 */
export async function runContainer(state, { translate } = {}) {
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
  const display = state.display || settings.display || 'replace';
  const target = resolveTargetLang(settings.targetLang, getLocale());
  const runId = state.runId + 1;
  state.runId = runId;
  state.status = 'loading';
  state.display = display;
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
      detected: null,
      labelIds: [],
      labels: new Map(),
      painted: false,
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
      segments.push({ id: labelId, text: token.label });
    });
  });

  const paint = (record) => {
    if (record.painted || !record.translation) return;
    record.painted = true;
    const labels = [];
    record.labelIds.forEach(({ id, tokenIndex }) => {
      const value = record.labels.get(id);
      if (typeof value === 'string' && value) labels[tokenIndex] = value;
    });
    const html = renderBlockHtml(record.data, record.translation.text, labels);
    if (display === 'below') {
      const box = createResultBox(html);
      const tag = record.el.tagName;
      if (tag === 'LI' || tag === 'TD' || tag === 'TH') record.el.appendChild(box);
      else record.el.insertAdjacentElement('afterend', box);
      state.painted.push({ el: record.el, originalHtml: null, box });
    } else {
      const originalHtml = record.el.innerHTML;
      record.el.innerHTML = html;
      state.painted.push({ el: record.el, originalHtml, box: null });
    }
  };

  const maybePaint = (record) => {
    if (record.painted || !record.translation) return;
    if (record.labelIds.some(({ id }) => !record.labels.has(id))) return;
    paint(record);
  };

  const onResult = (id, result) => {
    if (state.runId !== runId) return;
    const record = recordById.get(id);
    if (record) {
      record.translation = result;
      record.detected = result.detectedSourceLang || record.detected;
      maybePaint(record);
      return;
    }
    const owner = labelOwner.get(id);
    if (!owner) return;
    owner.labels.set(id, result.text);
    maybePaint(owner);
  };

  setButtonState(state.button, 'loading', { label: t('translate.translating') });
  setBarStatus(state.container, t('translate.translating'));

  try {
    await translateSegments(segments, target, { translate, onResult });
  } catch {
    // Every segment is reported as failed by the missing results below.
  }
  if (state.runId !== runId) return;

  records.forEach((record) => {
    if (record.translation) paint(record);
  });

  const failedCount = records.filter((record) => !record.translation).length;
  const unchanged = failedCount === 0 && records.every((record) => (
    record.translation
    && stripTokens(record.translation.text) === stripTokens(record.data.source)
  ));

  if (unchanged) {
    restorePainted(state);
    state.status = 'idle';
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setBarStatus(state.container, t('translate.sameLanguage'));
    state.signature = state.container.textContent.length;
    return;
  }

  if (failedCount === records.length) {
    state.status = 'error';
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setBarStatus(state.container, t('translate.failed'));
    logError(Codes.TRANSLATE_FAILED, 'Translation failed for a container.', {
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
    setBarStatus(state.container, t('translate.partial'));
  } else {
    state.status = 'shown';
    setButtonState(state.button, 'shown', { label: t('translate.showOriginal') });
    const detected = records.find((record) => record.detected);
    setBarStatus(
      state.container,
      detected ? t('translate.detected', { lang: detected.detected }) : '',
    );
  }

  state.signature = state.container.textContent.length;
  if (state.button && typeof state.button.focus === 'function') state.button.focus();
}

/** Show the original again, or translate when the container is idle. */
export function toggleContainer(state) {
  if (!state) return;
  if (state.status === 'loading') return;
  if (state.status === 'shown' || state.status === 'partial') {
    restorePainted(state);
    state.status = 'idle';
    state.signature = state.container.textContent.length;
    setButtonState(state.button, 'idle', { label: t('translate.button') });
    setBarStatus(state.container, '');
    return;
  }
  runContainer(state).catch(() => {});
}

/** Restore a container, remove its chrome and forget it. */
export function teardownContainer(container) {
  const state = states.get(container);
  if (!state) return;
  restorePainted(state);
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
