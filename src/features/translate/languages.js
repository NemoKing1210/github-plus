import { TRANSLATE_TARGET_LANGUAGES } from '../../core/constants.js';

/** Target languages offered by the translation settings. */
export const TARGET_LANGUAGES = TRANSLATE_TARGET_LANGUAGES;

const CODES = new Set(TARGET_LANGUAGES.map((lang) => lang.code));

/** UI locales that do not use their own code as a translation target. */
const LOCALE_TARGET = {
  'pt-BR': 'pt',
};

/**
 * Resolve the configured preference to a provider-neutral target code.
 * `auto` follows the active UI locale and falls back to English.
 * @param {string} preference
 * @param {string} locale
 * @returns {string}
 */
export function resolveTargetLang(preference, locale) {
  if (preference && preference !== 'auto') return preference;
  const mapped = LOCALE_TARGET[locale] || locale;
  return CODES.has(mapped) ? mapped : 'en';
}

/** Native name with its flag for a target code, or the code itself. */
export function targetLanguageLabel(code) {
  const row = TARGET_LANGUAGES.find((lang) => lang.code === code);
  return row ? `${row.flag} ${row.name}` : code;
}
