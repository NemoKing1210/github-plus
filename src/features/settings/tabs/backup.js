import { normalizeImportedSettings } from '../../../core/settings.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { showToast } from '../../../ui/toast.js';
import { createButton, createSection, createTextarea } from '../controls.js';
import { applyExternalSettings, getDraft } from '../panel.js';

function serialize(payload) {
  return JSON.stringify(payload, null, 2);
}

function downloadBackup(payload) {
  const blob = new Blob([serialize(payload)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = el('a');
  link.href = url;
  link.download = `github-plus-settings-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function copyBackup(payload) {
  await navigator.clipboard.writeText(serialize(payload));
  showToast({ type: 'success', title: t('toast.copied'), message: t('toast.copiedDesc') });
}

/** Backup page: export the panel draft, import a JSON payload back. */
export function renderBackup(container) {
  const draft = getDraft();

  const exportSection = createSection({
    title: t('backup.export'),
    hint: t('backup.exportDesc'),
  });
  const exportRow = el('div', 'gp-row');
  const exportActions = el('div', 'gp-row__control');
  exportActions.append(
    createButton(t('backup.exportFile'), () => downloadBackup(draft)),
    createButton(t('backup.exportClipboard'), () => {
      copyBackup(draft).catch(() => showToast({
        type: 'error',
        title: t('toast.importFailed'),
        message: t('toast.importFailedDesc'),
      }));
    }, 'gp-button--ghost'),
  );
  exportRow.appendChild(exportActions);
  exportSection.body.appendChild(exportRow);

  const importSection = createSection({
    title: t('backup.import'),
    hint: t('backup.importDesc'),
  });
  let text = '';
  const status = el('p', 'gp-hint', '');
  const textarea = createTextarea({
    placeholder: t('backup.importPlaceholder'),
    label: t('backup.import'),
    onInput: (value) => {
      text = value;
      status.textContent = '';
    },
  });
  const importRow = el('div', 'gp-row');
  importRow.appendChild(createButton(t('backup.importButton'), () => {
    let payload = null;
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
    const next = payload === null ? null : normalizeImportedSettings(payload);
    if (!next) {
      status.textContent = t('backup.invalid');
      return;
    }
    applyExternalSettings(next);
    textarea.value = '';
    text = '';
    status.textContent = '';
    showToast({
      type: 'success',
      title: t('toast.imported'),
      message: t('toast.importedDesc'),
    });
  }, 'gp-button--primary'));
  importSection.body.append(textarea, status, importRow);

  container.append(exportSection, importSection);
}
