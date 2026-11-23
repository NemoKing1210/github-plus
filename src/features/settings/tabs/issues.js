import { t } from '../../../i18n/index.js';
import { createSection, createSwitch } from '../controls.js';
import { getDraft } from '../panel.js';

/** Author avatars in the issue and pull-request lists, one master switch. */
export function renderIssues(container, draft = getDraft()) {
  const card = createSection({
    title: t('listAvatars.enabled'),
    hint: t('listAvatars.enabledDesc'),
    action: createSwitch({
      checked: draft.listAvatars.enabled,
      label: t('listAvatars.enabled'),
      onChange: (value) => {
        draft.listAvatars.enabled = value;
      },
    }),
    withBody: false,
  });
  container.appendChild(card);
}
