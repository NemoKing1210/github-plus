/**
 * The translation providers the settings can choose from. Field definitions
 * drive the provider form on the settings page, and their keys are also the
 * whitelist the settings normalizer keeps.
 */

export const TRANSLATION_PROVIDERS = [
  {
    id: 'google',
    name: 'Google',
    hintKey: 'translate.providerHintGoogle',
    fields: [],
  },
  {
    id: 'deepl',
    name: 'DeepL',
    hintKey: 'translate.providerHintDeepl',
    fields: [
      {
        key: 'apiKey',
        type: 'password',
        labelKey: 'translate.providerFieldApiKey',
        required: true,
        default: '',
      },
      {
        key: 'plan',
        type: 'select',
        labelKey: 'translate.providerFieldDeeplPlan',
        default: 'free',
        options: [
          { value: 'free', labelKey: 'translate.providerDeeplPlanFree' },
          { value: 'pro', labelKey: 'translate.providerDeeplPlanPro' },
        ],
      },
    ],
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    hintKey: 'translate.providerHintMicrosoft',
    fields: [
      {
        key: 'apiKey',
        type: 'password',
        labelKey: 'translate.providerFieldApiKey',
        required: true,
        default: '',
      },
      {
        key: 'region',
        type: 'text',
        labelKey: 'translate.providerFieldRegion',
        required: true,
        default: 'global',
      },
    ],
  },
  {
    id: 'yandex',
    name: 'Yandex',
    hintKey: 'translate.providerHintYandex',
    fields: [
      {
        key: 'apiKey',
        type: 'password',
        labelKey: 'translate.providerFieldApiKey',
        required: true,
        default: '',
      },
      {
        key: 'folderId',
        type: 'text',
        labelKey: 'translate.providerFieldFolderId',
        required: true,
        default: '',
      },
    ],
  },
  {
    id: 'openai',
    name: 'OpenAI',
    hintKey: 'translate.providerHintOpenai',
    fields: [
      {
        key: 'apiKey',
        type: 'password',
        labelKey: 'translate.providerFieldApiKey',
        required: true,
        default: '',
      },
      {
        key: 'model',
        type: 'text',
        labelKey: 'translate.providerFieldModel',
        required: true,
        default: 'gpt-4o-mini',
      },
      {
        key: 'baseUrl',
        type: 'url',
        labelKey: 'translate.providerFieldBaseUrl',
        required: true,
        default: 'https://api.openai.com/v1',
      },
    ],
  },
  {
    id: 'libretranslate',
    name: 'LibreTranslate',
    hintKey: 'translate.providerHintLibre',
    fields: [
      {
        key: 'apiUrl',
        type: 'url',
        labelKey: 'translate.providerFieldApiUrl',
        required: true,
        default: 'https://libretranslate.com',
      },
      {
        key: 'apiKey',
        type: 'password',
        labelKey: 'translate.providerFieldApiKeyOptional',
        required: false,
        default: '',
      },
    ],
  },
];

export const PROVIDER_IDS = TRANSLATION_PROVIDERS.map((provider) => provider.id);

/** Provider definition by id, or null. */
export function getProvider(id) {
  return TRANSLATION_PROVIDERS.find((provider) => provider.id === id) || null;
}

/** Whether the id is one of the offerable providers. */
export function isKnownProvider(id) {
  return PROVIDER_IDS.indexOf(id) !== -1;
}

/** Required fields that carry no value for this provider, in field order. */
export function missingProviderFields(id, config) {
  const provider = getProvider(id);
  if (!provider) return [];
  const values = config && typeof config === 'object' ? config : {};
  return provider.fields
    .filter((field) => field.required)
    .filter((field) => !String(values[field.key] ?? '').trim())
    .map((field) => field.key);
}
