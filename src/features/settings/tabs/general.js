import { TOAST_POSITIONS, TOAST_MAX_DURATION_MS } from '../../../core/constants.js';
import { copyLog, isLoggingEnabled } from '../../../core/logger/index.js';
import { t } from '../../../i18n/index.js';
import { LOCALE_NATIVE_NAMES, SUPPORTED_LOCALES } from '../../../i18n/meta.js';
import { showToast } from '../../../ui/toast.js';
import {
  createButton,
  createField,
  createNumberInput,
  createRow,
  createSection,
  createSelect,
  createSwitchRow,
} from '../controls.js';
import { getDraft } from '../panel.js';

/** General page: interface language, notifications and diagnostics. */
export function renderGeneral(container, draft = getDraft()) {

  const language = createSection({
    title: t('general.language'),
    hint: t('general.languageDesc'),
  });
  const localeOptions = [{ value: 'auto', label: t('common.auto') }];
  for (const locale of SUPPORTED_LOCALES) {
    localeOptions.push({ value: locale, label: LOCALE_NATIVE_NAMES[locale] || locale });
  }
  language.body.appendChild(createField({
    control: createSelect({
      options: localeOptions,
      value: draft.language,
      label: t('general.language'),
      onChange: (value) => {
        draft.language = value;
      },
    }),
  }));

  const toasts = createSection({
    title: t('general.toasts'),
    hint: t('general.toastsDesc'),
  });
  toasts.body.appendChild(createSwitchRow({
    checked: draft.toasts.enabled,
    label: t('toasts.enabled'),
    hint: t('toasts.enabledDesc'),
    onChange: (value) => {
      draft.toasts.enabled = value;
    },
  }));
  const positionOptions = TOAST_POSITIONS.map((position) => ({
    value: position,
    label: t(`toastPos.${position}`),
  }));
  toasts.body.appendChild(createField({
    label: t('toasts.position'),
    hint: t('toasts.positionDesc'),
    control: createSelect({
      options: positionOptions,
      value: draft.toasts.position,
      label: t('toasts.position'),
      onChange: (value) => {
        draft.toasts.position = value;
      },
    }),
  }));
  toasts.body.appendChild(createField({
    label: t('toasts.duration'),
    hint: t('toasts.durationDesc'),
    control: createNumberInput({
      value: Math.round(draft.toasts.duration / 1000),
      min: 0,
      max: TOAST_MAX_DURATION_MS / 1000,
      label: t('toasts.duration'),
      onChange: (seconds) => {
        draft.toasts.duration = seconds * 1000;
      },
    }),
  }));

  const diagnostics = createSection({
    title: t('general.diagnostics'),
    hint: t('general.diagnosticsDesc'),
  });
  diagnostics.body.appendChild(createSwitchRow({
    checked: draft.logging.enabled,
    label: t('logging.enabled'),
    hint: t('logging.enabledDesc'),
    onChange: (value) => {
      draft.logging.enabled = value;
    },
  }));
  const copyButton = createButton(t('logging.copy'), () => {
    copyLog().then((result) => {
      if (result.method === 'clipboard') {
        showToast({ type: 'success', title: t('logging.copied'), message: t('logging.copiedDesc') });
      } else if (result.ok) {
        showToast({ type: 'warning', title: t('logging.printed'), message: t('logging.printedDesc') });
      } else {
        showToast({
          type: 'error',
          title: t('logging.copyFailed'),
          message: t('logging.copyFailedDesc'),
        });
      }
    });
  }, 'gp-button--ghost');
  copyButton.disabled = !isLoggingEnabled();
  diagnostics.body.appendChild(createRow({
    label: t('logging.copy'),
    hint: t('logging.copyDesc'),
    control: copyButton,
  }));

  container.append(language, toasts, diagnostics);
}
