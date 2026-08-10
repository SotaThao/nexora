import { getErrorI18nKey } from '../data/errorCodes'
import { isApiError } from '../types/domain'

type TranslateFn = (key: string, params?: Record<string, string | number>) => string

export function resolveTranslatedApiError(
  t: TranslateFn,
  error: unknown,
  fallbackKey: string,
): string {
  const fallback = t(fallbackKey)
  if (!isApiError(error)) return fallback

  const i18nKey = getErrorI18nKey(error.errorCode)
  const translated = t(i18nKey)
  if (translated !== i18nKey) return translated

  return error.message || fallback
}
