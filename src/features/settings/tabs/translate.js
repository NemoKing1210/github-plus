import { TRANSLATE_CACHE_HOURS_MAX, TRANSLATE_TARGET_LANGUAGES } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { formatSize } from '../../../utils/size.js';
import { showToast } from '../../../ui/toast.js';
import { clearCache, getCacheUsageStats } from '../../translate/cache.js';
import { targetLanguageLabel } from '../../translate/languages.js';
import { TRANSLATION_PROVIDERS } from '../../translate/providers/registry.js';
import { listSurfaces } from '../../translate/surfaces.js';
import {
  createButton, createField, createHint, createMeter, createNumberInput, createRow, createSection,
  createSelect, createSwitch, createSwitchRow, createTextInput,
} from '../controls.js';
import { getDraft } from '../panel.js';

function renderMainCard(draft) {
  const translate = draft.translate;
  const card = createSection({
    title: t('translate.enabled'),
    hint: t('translate.enabledDesc'),
    action: createSwitch({
      checked: translate.enabled,
      label: t('translate.enabled'),
      onChange: (checked) => { translate.enabled = checked; },
    }),
  });

  card.body.appendChild(createField({
    label: t('translate.targetLang'),
    hint: t('translate.targetLangDesc'),
    control: createSelect({
      value: translate.targetLang,
      label: t('translate.targetLang'),
      options: [
        { value: 'auto', label: t('translate.langAuto') },
        ...TRANSLATE_TARGET_LANGUAGES.map((language) => ({
          value: language.code,
          label: targetLanguageLabel(language.code),
        })),
      ],
      onChange: (value) => { translate.targetLang = value; },
    }),
  }));

  card.body.appendChild(createField({
    label: t('translate.mode'),
    hint: t('translate.modeDesc'),
    control: createSelect({
      value: translate.mode,
      label: t('translate.mode'),
      options: [
        { value: 'button', label: t('translate.modeButton') },
        { value: 'auto', label: t('translate.modeAuto') },
      ],
      onChange: (value) => { translate.mode = value; },
    }),
  }));

  const revealRow = createRow({
    label: t('translate.reveal'),
    hint: t('translate.revealDesc'),
    control: createSelect({
      value: translate.reveal,
      label: t('translate.reveal'),
      options: [
        { value: 'button', label: t('translate.revealButton') },
        { value: 'hover', label: t('translate.revealHover') },
      ],
      onChange: (value) => { translate.reveal = value; },
    }),
  });

  const displayRow = createRow({
    label: t('translate.display'),
    hint: t('translate.displayDesc'),
    control: createSelect({
      value: translate.display,
      label: t('translate.display'),
      options: [
        { value: 'replace', label: t('translate.displayReplace') },
        { value: 'below', label: t('translate.displayBelow') },
      ],
      onChange: (value) => {
        translate.display = value;
        syncVisibility();
      },
    }),
  });

  const syncVisibility = () => {
    revealRow.hidden = translate.display !== 'replace';
  };
  syncVisibility();

  card.body.appendChild(displayRow);
  card.body.appendChild(revealRow);
  card.body.appendChild(createSwitchRow({
    label: t('translate.linkLabels'),
    hint: t('translate.linkLabelsDesc'),
    checked: translate.linkLabels,
    onChange: (checked) => { translate.linkLabels = checked; },
  }));
  card.body.appendChild(createHint(t('translate.privacy')));
  return card;
}

function renderPlacesCard(draft) {
  const translate = draft.translate;
  const card = createSection({
    title: t('translate.surfaces'),
    hint: t('translate.surfacesDesc'),
  });
  listSurfaces().forEach((surface) => {
    card.body.appendChild(createSwitchRow({
      label: t(surface.labelKey),
      hint: surface.hintKey ? t(surface.hintKey) : '',
      checked: translate.surfaces[surface.id] !== false,
      onChange: (checked) => { translate.surfaces[surface.id] = checked; },
    }));
  });
  return card;
}

function renderProviderCard(draft) {
  const translate = draft.translate;
  const card = createSection({
    title: t('translate.provider'),
    hint: t('translate.providerDesc'),
  });
  const blocks = new Map();

  const syncProviders = () => {
    blocks.forEach((block, id) => { block.hidden = id !== translate.provider; });
  };

  card.body.appendChild(createField({
    label: t('translate.provider'),
    control: createSelect({
      value: translate.provider,
      label: t('translate.provider'),
      options: TRANSLATION_PROVIDERS.map((provider) => ({
        value: provider.id,
        label: provider.name,
      })),
      onChange: (value) => {
        translate.provider = value;
        syncProviders();
      },
    }),
  }));

  TRANSLATION_PROVIDERS.forEach((provider) => {
    if (!translate.providerConfig[provider.id]) translate.providerConfig[provider.id] = {};
    const config = translate.providerConfig[provider.id];
    const block = el('div', 'gp-provider-fields');
    block.dataset.provider = provider.id;

    provider.fields.forEach((field) => {
      if (field.type === 'select') {
        block.appendChild(createField({
          label: t(field.labelKey),
          control: createSelect({
            value: config[field.key] ?? field.default,
            label: t(field.labelKey),
            options: field.options.map((option) => ({
              value: option.value,
              label: t(option.labelKey),
            })),
            onChange: (value) => { config[field.key] = value; },
          }),
        }));
        return;
      }
      block.appendChild(createField({
        label: t(field.labelKey),
        control: createTextInput({
          value: config[field.key] ?? field.default,
          type: field.type,
          label: t(field.labelKey),
          onChange: (value) => { config[field.key] = value; },
        }),
      }));
    });

    block.appendChild(createHint(t(provider.hintKey)));
    blocks.set(provider.id, block);
    card.body.appendChild(block);
  });

  syncProviders();
  return card;
}

function renderCacheCard(draft) {
  const translate = draft.translate;
  const card = createSection({
    title: t('translate.cache'),
    hint: t('translate.cacheDesc'),
  });
  const usage = el('p', 'gp-hint');
  const meter = createMeter();
  const paintUsage = () => {
    const stats = getCacheUsageStats();
    usage.textContent = stats.entryCount
      ? t('translate.cacheUsage', {
        count: stats.entryCount,
        size: formatSize(stats.usedBytes),
        limit: formatSize(stats.limitBytes),
      })
      : t('translate.cacheEmpty');
    meter.style.setProperty('--gp-meter-fill', `${stats.pct}%`);
  };
  paintUsage();
  const usageField = el('div', 'gp-field');
  usageField.append(usage, meter);
  card.body.appendChild(usageField);
  card.body.appendChild(createField({
    label: t('translate.cacheHours'),
    hint: t('translate.cacheHoursDesc'),
    control: createNumberInput({
      value: translate.cacheHours,
      min: 0,
      max: TRANSLATE_CACHE_HOURS_MAX,
      label: t('translate.cacheHours'),
      onChange: (value) => { translate.cacheHours = value; },
    }),
  }));
  card.body.appendChild(createRow({
    control: createButton(t('translate.clearCache'), () => {
      clearCache();
      paintUsage();
      showToast({ type: 'success', title: t('translate.cacheCleared') });
    }),
  }));
  return card;
}

/** Render the Translation settings page into the panel body. */
export function renderTranslate(container, draft = getDraft()) {
  container.appendChild(renderMainCard(draft));
  container.appendChild(renderPlacesCard(draft));
  container.appendChild(renderProviderCard(draft));
  container.appendChild(renderCacheCard(draft));
}
