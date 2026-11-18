import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import { TYPE_ORDER } from '../../commitBadges/parse.js';
import { createHint, createSection, createSwitch, createSwitchRow } from '../controls.js';
import { getDraft } from '../panel.js';

/** Commit badges: the master switch, its two refinements and a type legend. */
export function renderCommits(container, draft = getDraft()) {
  const current = draft.commitBadges;

  const section = createSection({
    title: t('commitBadges.enabled'),
    hint: t('commitBadges.enabledDesc'),
    action: createSwitch({
      checked: current.enabled,
      label: t('commitBadges.enabled'),
      onChange: (value) => { current.enabled = value; },
    }),
  });

  section.body.append(
    createSwitchRow({
      checked: current.unknownTypes,
      label: t('commitBadges.unknownTypes'),
      hint: t('commitBadges.unknownTypesDesc'),
      onChange: (value) => { current.unknownTypes = value; },
    }),
    createSwitchRow({
      checked: current.breaking,
      label: t('commitBadges.breaking'),
      hint: t('commitBadges.breakingDesc'),
      onChange: (value) => { current.breaking = value; },
    }),
    createHint(t('commitBadges.legend')),
  );

  const legend = el('div', 'gp-commit-legend');
  legend.setAttribute('aria-hidden', 'true');
  for (const id of TYPE_ORDER) {
    const item = el('span', 'gp-commit-legend__item');
    const chip = el('span', 'gp-commit-chip');
    chip.appendChild(el('span', `gp-commit-type gp-commit-type--${id}`, id));
    item.appendChild(chip);
    legend.appendChild(item);
  }
  section.body.appendChild(legend);

  container.appendChild(section);
}
