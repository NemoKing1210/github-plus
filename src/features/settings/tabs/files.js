import { t } from '../../../i18n/index.js';
import { createSection, createSwitch, createSwitchRow } from '../controls.js';
import { getDraft } from '../panel.js';

/**
 * Files page: master switch plus the two independent additions to a file row
 * (the size label and the download button).
 */
export function renderFiles(container) {
  const draft = getDraft();

  const behavior = createSection({
    title: t('files.enabled'),
    hint: t('files.enabledDesc'),
    action: createSwitch({
      checked: draft.fileMeta.enabled,
      label: t('files.enabled'),
      onChange: (value) => {
        draft.fileMeta.enabled = value;
      },
    }),
    withBody: false,
  });

  const display = createSection({
    title: t('files.display'),
    hint: t('files.displayDesc'),
  });
  display.body.append(
    createSwitchRow({
      checked: draft.fileMeta.sizes,
      label: t('files.size'),
      hint: t('files.sizeDesc'),
      onChange: (value) => {
        draft.fileMeta.sizes = value;
      },
    }),
    createSwitchRow({
      checked: draft.fileMeta.download,
      label: t('files.download'),
      hint: t('files.downloadDesc'),
      onChange: (value) => {
        draft.fileMeta.download = value;
      },
    }),
  );

  container.append(behavior, display);
}
