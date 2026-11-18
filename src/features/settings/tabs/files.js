import {
  AGE_BUCKET_COUNT,
  PREVIEW_LONG_PRESS_MAX_MS,
  PREVIEW_LONG_PRESS_MIN_MS,
} from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import {
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSwitch,
  createSwitchRow,
} from '../controls.js';
import { getDraft } from '../panel.js';

/** Preview of the sequential scale the ages feature paints on GitHub's file list. */
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

function iconsCard(draft) {
  const card = createSection({
    title: t('icons.enabled'),
    hint: t('icons.enabledDesc'),
    action: createSwitch({
      checked: draft.fileIcons.enabled,
      label: t('icons.enabled'),
      onChange: (value) => {
        draft.fileIcons.enabled = value;
      },
    }),
  });
  card.body.append(
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
  return card;
}

function agesCard(draft) {
  const card = createSection({
    title: t('ages.enabled'),
    hint: t('ages.enabledDesc'),
    action: createSwitch({
      checked: draft.fileAges.enabled,
      label: t('ages.enabled'),
      onChange: (value) => {
        draft.fileAges.enabled = value;
      },
    }),
  });
  card.body.append(
    createSwitchRow({
      checked: draft.fileAges.folders,
      label: t('ages.folders'),
      hint: t('ages.foldersDesc'),
      onChange: (value) => {
        draft.fileAges.folders = value;
      },
    }),
    createLegend(),
  );
  return card;
}

function treeCard(draft) {
  return createSection({
    title: t('folderTree.title'),
    hint: t('folderTree.enabledDesc'),
    action: createSwitch({
      checked: draft.folderTree.enabled,
      label: t('folderTree.title'),
      onChange: (value) => {
        draft.folderTree.enabled = value;
      },
    }),
    withBody: false,
  });
}

function sizesCard(draft) {
  const card = createSection({
    title: t('files.enabled'),
    hint: t('files.enabledDesc'),
    action: createSwitch({
      checked: draft.fileMeta.enabled,
      label: t('files.enabled'),
      onChange: (value) => {
        draft.fileMeta.enabled = value;
      },
    }),
  });
  card.body.append(
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
  return card;
}

function previewCard(draft) {
  const card = createSection({
    title: t('preview.enabled'),
    hint: t('preview.enabledDesc'),
    action: createSwitch({
      checked: draft.filePreview.enabled,
      label: t('preview.enabled'),
      onChange: (value) => {
        draft.filePreview.enabled = value;
      },
    }),
  });
  card.body.append(
    createSwitchRow({
      checked: draft.filePreview.rowButton,
      label: t('preview.rowButton'),
      hint: t('preview.rowButtonDesc'),
      onChange: (value) => {
        draft.filePreview.rowButton = value;
      },
    }),
    createSwitchRow({
      checked: draft.filePreview.longPress,
      label: t('preview.longPress'),
      hint: t('preview.longPressDesc'),
      onChange: (value) => {
        draft.filePreview.longPress = value;
      },
    }),
    createField({
      label: t('preview.longPressMs'),
      hint: t('preview.longPressMsDesc', {
        min: PREVIEW_LONG_PRESS_MIN_MS,
        max: PREVIEW_LONG_PRESS_MAX_MS,
      }),
      control: createNumberInput({
        value: draft.filePreview.longPressMs,
        min: PREVIEW_LONG_PRESS_MIN_MS,
        max: PREVIEW_LONG_PRESS_MAX_MS,
        step: 50,
        label: t('preview.longPressMs'),
        onChange: (ms) => {
          draft.filePreview.longPressMs = ms;
        },
      }),
    }),
    createSwitchRow({
      checked: draft.filePreview.longPressRing,
      label: t('preview.longPressRing'),
      hint: t('preview.longPressRingDesc'),
      onChange: (value) => {
        draft.filePreview.longPressRing = value;
      },
    }),
  );
  return card;
}

function menuCard(draft) {
  return createSection({
    title: t('fileMenu.title'),
    hint: t('fileMenu.enabledDesc'),
    action: createSwitch({
      checked: draft.fileMenu.enabled,
      label: t('fileMenu.title'),
      onChange: (value) => {
        draft.fileMenu.enabled = value;
      },
    }),
    withBody: false,
  });
}

/**
 * Files page: one card per file enhancement, each with its own master switch
 * in the card header and its scope toggles in the body. The features stay
 * independent, so the page itself has no switch.
 */
export function renderFiles(container) {
  const draft = getDraft();
  container.append(
    iconsCard(draft),
    agesCard(draft),
    treeCard(draft),
    sizesCard(draft),
    menuCard(draft),
    previewCard(draft),
    createHint(t('icons.credit')),
  );
}
