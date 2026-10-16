import { ZOOM_OPTIONS } from '../../../core/constants.js';
import { listSources } from '../../../gallery/sources.js';
import { t } from '../../../i18n/index.js';
import { el } from '../../../utils/dom.js';
import {
  createField,
  createSection,
  createSelect,
  createSwitchCell,
  createSwitchRow,
} from '../controls.js';
import { getDraft } from '../panel.js';

/**
 * Gallery page: master switch, the markdown surfaces the gallery watches
 * (built from the source registry, so a new source shows up here for free),
 * and the viewer behavior.
 */
export function renderGallery(container) {
  const draft = getDraft();

  const behavior = createSection({ title: t('gallery.behavior') });
  behavior.body.appendChild(createSwitchRow({
    checked: draft.gallery.enabled,
    label: t('gallery.enabled'),
    hint: t('gallery.enabledDesc'),
    onChange: (value) => {
      draft.gallery.enabled = value;
    },
  }));

  const sources = createSection({
    title: t('gallery.sources'),
    hint: t('gallery.sourcesDesc'),
  });
  const grid = el('div', 'gp-grid');
  for (const source of listSources()) {
    grid.appendChild(createSwitchCell({
      checked: draft.gallery.sources[source.id] !== false,
      label: t(source.labelKey),
      hint: source.hintKey ? t(source.hintKey) : '',
      onChange: (value) => {
        draft.gallery.sources[source.id] = value;
      },
    }));
  }
  sources.body.appendChild(grid);

  const viewer = createSection({ title: t('gallery.viewer') });
  viewer.body.append(
    createSwitchRow({
      checked: draft.gallery.skipBadges,
      label: t('gallery.skipBadges'),
      hint: t('gallery.skipBadgesDesc'),
      onChange: (value) => {
        draft.gallery.skipBadges = value;
      },
    }),
    createSwitchRow({
      checked: draft.gallery.upgradeFullSize,
      label: t('gallery.upgradeFullSize'),
      hint: t('gallery.upgradeFullSizeDesc'),
      onChange: (value) => {
        draft.gallery.upgradeFullSize = value;
      },
    }),
    createSwitchRow({
      checked: draft.gallery.thumbnails,
      label: t('gallery.thumbnails'),
      hint: t('gallery.thumbnailsDesc'),
      onChange: (value) => {
        draft.gallery.thumbnails = value;
      },
    }),
    createSwitchRow({
      checked: draft.gallery.loop,
      label: t('gallery.loop'),
      hint: t('gallery.loopDesc'),
      onChange: (value) => {
        draft.gallery.loop = value;
      },
    }),
    createField({
      label: t('gallery.maxZoom'),
      hint: t('gallery.maxZoomDesc'),
      control: createSelect({
        options: ZOOM_OPTIONS.map((zoom) => ({ value: String(zoom), label: `${zoom}×` })),
        value: String(draft.gallery.maxZoom),
        label: t('gallery.maxZoom'),
        onChange: (value) => {
          draft.gallery.maxZoom = Number(value);
        },
      }),
    }),
  );

  container.append(behavior, sources, viewer);
}
