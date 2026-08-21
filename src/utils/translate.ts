import type { TranslationVariables } from '../types/contexts'

/**
 * Resolves a dot-notation key against a locale dictionary and interpolates variables.
 *
 * Extracted from LanguageContext so a screen that must render in one fixed language — the public
 * receipt, which is always English regardless of the viewer's stored preference — can reuse the
 * exact same resolution rules instead of carrying a second copy of them.
 *
 * Returns the key itself when it is missing, which is how the app has always surfaced a bad key.
 */
export function resolveTranslation(
  dictionary: unknown,
  key: string,
  variables: TranslationVariables = {},
): string {
  let value: unknown = dictionary

  for (const part of key.split('.')) {
    if (value && typeof value === 'object' && part in (value as Record<string, unknown>)) {
      value = (value as Record<string, unknown>)[part]
    } else {
      value = key
      break
    }
  }

  if (typeof value === 'string') {
    return Object.entries(variables ?? {}).reduce((acc, [name, raw]) => {
      const replacement = String(raw)
      // Support both {{key}} (i18next-style) and {key} placeholders.
      return acc
        .replace(new RegExp(`{{\\s*${name}\\s*}}`, 'g'), replacement)
        .replace(new RegExp(`{\\s*${name}\\s*}`, 'g'), replacement)
    }, value)
  }

  return String(value)
}
