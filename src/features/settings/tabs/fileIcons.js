import { t } from '../../../i18n/index.js';
import { createHint, createSection, createSwitch, createSwitchRow } from '../controls.js';
import { getDraft } from '../panel.js';

/**
 * File icons page: master switch plus the two matching toggles. The icon set
 * itself is fixed (a curated Material Icon Theme slice), so there is nothing
 * else to configure.
 */
export function renderFileIcons(container) {
  const draft = getDraft();

  const behavior = createSection({
    title: t('icons.enabled'),
    hint: t('icons.enabledDesc'),
    action: createSwitch({
      checked: draft.fileIcons.enabled,
      label: t('icons.enabled'),
      onChange: (value) => {
        draft.fileIcons.enabled = value;
      },
    }),
    withBody: false,
  });

  const matching = createSection({
    title: t('icons.matching'),
    hint: t('icons.matchingDesc'),
  });
  matching.body.append(
    createSwitchRow({
      checked: draft.fileIcons.folders,
      label: t('icons.folders'),
      hint: t('icons.foldersDesc'),
      onChange: (value) => {
        draft.fileIcons.folders = value;
      },
    }),
    createSwitchRow({
      checked: draft.fileIcons.specialNames,
      label: t('icons.specialNames'),
      hint: t('icons.specialNamesDesc'),
      onChange: (value) => {
        draft.fileIcons.specialNames = value;
      },
    }),
  );

  container.append(behavior, matching, createHint(t('icons.credit')));
}
