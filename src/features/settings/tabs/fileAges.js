import { AGE_BUCKET_COUNT } from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { createSection, createSwitch, createSwitchRow } from '../controls.js';
import { getDraft } from '../panel.js';

/** Preview of the sequential scale the feature paints on GitHub's file list. */
function createLegend() {
  const legend = el('div', 'gp-age-legend');
  const scale = el('span', 'gp-age-legend__scale');
  scale.setAttribute('aria-hidden', 'true');
  for (let bucket = 1; bucket <= AGE_BUCKET_COUNT; bucket += 1) {
    scale.appendChild(el('span', `gp-age-legend__sample gp-age--${bucket}`, 'Aa'));
  }
  legend.append(el('span', 'gp-age-legend__label', t('ages.older')), scale);
  legend.appendChild(el('span', 'gp-age-legend__label', t('ages.newer')));
  return legend;
}

/**
 * File ages page: master switch, folder scope and the scale preview. The
 * bucket thresholds themselves are fixed, so there is nothing else to tune.
 */
export function renderFileAges(container) {
  const draft = getDraft();

  const behavior = createSection({
    title: t('ages.enabled'),
    hint: t('ages.enabledDesc'),
    action: createSwitch({
      checked: draft.fileAges.enabled,
      label: t('ages.enabled'),
      onChange: (value) => {
        draft.fileAges.enabled = value;
      },
    }),
    withBody: false,
  });

  const scope = createSection({
    title: t('ages.scope'),
    hint: t('ages.scopeDesc'),
  });
  scope.body.appendChild(createSwitchRow({
    checked: draft.fileAges.folders,
    label: t('ages.folders'),
    hint: t('ages.foldersDesc'),
    onChange: (value) => {
      draft.fileAges.folders = value;
    },
  }));

  const legend = createSection({
    title: t('ages.legend'),
    hint: t('ages.legendDesc'),
  });
  legend.body.appendChild(createLegend());

  container.append(behavior, scope, legend);
}
