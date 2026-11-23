import {
  SIMILAR_REPOS_CACHE_HOURS_MAX,
  SIMILAR_REPOS_RESULTS_MAX,
  SIMILAR_REPOS_RESULTS_MIN,
} from '../../../core/constants.js';
import { t } from '../../../i18n/index.js';
import {
  createField,
  createHint,
  createNumberInput,
  createSection,
  createSelect,
  createSwitch,
} from '../controls.js';
import { getDraft } from '../panel.js';

function providerHint(provider) {
  return provider === 'simrepo'
    ? t('similarRepos.providerSimrepoHint')
    : t('similarRepos.providerGithubHint');
}

/**
 * Discovery page: one card for the similar-repositories panel. The privacy
 * hint follows the selected provider, so a third-party source is never chosen
 * without its disclosure on screen.
 */
export function renderDiscovery(container, draft = getDraft()) {
  const card = createSection({
    title: t('similarRepos.enabled'),
    hint: t('similarRepos.enabledDesc'),
    action: createSwitch({
      checked: draft.similarRepos.enabled,
      label: t('similarRepos.enabled'),
      onChange: (value) => {
        draft.similarRepos.enabled = value;
      },
    }),
  });

  const hint = createHint(providerHint(draft.similarRepos.provider));

  card.body.append(
    createField({
      label: t('similarRepos.provider'),
      hint: t('similarRepos.providerDesc'),
      control: createSelect({
        label: t('similarRepos.provider'),
        value: draft.similarRepos.provider,
        options: [
          { value: 'github', label: t('similarRepos.providerGithub') },
          { value: 'simrepo', label: t('similarRepos.providerSimrepo') },
        ],
        onChange: (value) => {
          draft.similarRepos.provider = value;
          hint.textContent = providerHint(value);
        },
      }),
    }),
    hint,
    createField({
      label: t('similarRepos.results'),
      hint: t('similarRepos.resultsDesc'),
      control: createNumberInput({
        value: draft.similarRepos.results,
        min: SIMILAR_REPOS_RESULTS_MIN,
        max: SIMILAR_REPOS_RESULTS_MAX,
        step: 1,
        label: t('similarRepos.results'),
        onChange: (value) => {
          draft.similarRepos.results = value;
        },
      }),
    }),
    createField({
      label: t('similarRepos.cacheHours'),
      hint: t('similarRepos.cacheHoursDesc'),
      control: createNumberInput({
        value: draft.similarRepos.cacheHours,
        min: 0,
        max: SIMILAR_REPOS_CACHE_HOURS_MAX,
        step: 1,
        label: t('similarRepos.cacheHours'),
        onChange: (value) => {
          draft.similarRepos.cacheHours = value;
        },
      }),
    }),
  );

  container.append(card, createHint(t('similarRepos.privacy')));
}
