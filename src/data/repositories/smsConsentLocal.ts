import type { LocalSmsConsentRecord } from '../../types/repositories'
import { storage } from '../../utils/storage'

interface SmsConsentStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): unknown
  removeItem(key: string): unknown
}

const normalizeBusinessSlug = (businessSlug: string) => businessSlug.trim().toLowerCase()

const storageKey = (businessSlug: string) => {
  const slug = normalizeBusinessSlug(businessSlug)
  if (!slug) throw new Error('smsConsentLocalRepository: businessSlug is required')
  return `sms_consent:${slug}`
}

const isLocalSmsConsentRecord = (
  value: unknown,
  businessSlug: string,
): value is LocalSmsConsentRecord => {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<LocalSmsConsentRecord>
  return record.schemaVersion === 1
    && record.businessSlug === businessSlug
    && typeof record.phoneE164 === 'string'
    && record.phoneE164.length > 0
    && typeof record.transactional === 'boolean'
    && typeof record.marketing === 'boolean'
    && typeof record.disclosureVersion === 'string'
    && typeof record.savedAt === 'string'
}

export function createSmsConsentLocalRepository(store: SmsConsentStore = storage) {
  return {
    load(businessSlug: string): LocalSmsConsentRecord | null {
      const slug = normalizeBusinessSlug(businessSlug)
      const key = storageKey(slug)
      const raw = store.getItem(key)
      if (raw === null) return null

      try {
        const parsed: unknown = JSON.parse(raw)
        if (isLocalSmsConsentRecord(parsed, slug)) return parsed
      } catch {
        // Invalid browser state is discarded below.
      }

      store.removeItem(key)
      return null
    },
    save(record: LocalSmsConsentRecord) {
      const businessSlug = normalizeBusinessSlug(record.businessSlug)
      const normalizedRecord: LocalSmsConsentRecord = { ...record, businessSlug }
      store.setItem(storageKey(businessSlug), JSON.stringify(normalizedRecord))
    },
    remove(businessSlug: string) {
      store.removeItem(storageKey(businessSlug))
    },
  }
}

export const smsConsentLocalRepository = createSmsConsentLocalRepository()
export default smsConsentLocalRepository
