import type { LocalSmsConsentRecord } from '../../types/repositories'
import { storage } from '../../utils/storage'

interface SmsConsentStore {
  getItem(key: string): string | null
  setItem(key: string, value: string): unknown
  removeItem(key: string): unknown
}

const normalizeBusinessSlug = (businessSlug: string) => businessSlug.trim().toLowerCase()
const normalizePhoneE164 = (phoneE164: string) => phoneE164.trim()

const legacyStorageKey = (businessSlug: string) => {
  const slug = normalizeBusinessSlug(businessSlug)
  if (!slug) throw new Error('smsConsentLocalRepository: businessSlug is required')
  return `sms_consent:${slug}`
}

const storageKey = (businessSlug: string, phoneE164: string) => {
  const phone = normalizePhoneE164(phoneE164)
  if (!phone) throw new Error('smsConsentLocalRepository: phoneE164 is required')
  return `${legacyStorageKey(businessSlug)}:${phone}`
}

const isLocalSmsConsentRecord = (
  value: unknown,
  businessSlug: string,
  phoneE164: string,
): value is LocalSmsConsentRecord => {
  if (!value || typeof value !== 'object') return false
  const record = value as Partial<LocalSmsConsentRecord>
  return record.schemaVersion === 1
    && record.businessSlug === businessSlug
    && record.phoneE164 === phoneE164
    && typeof record.transactional === 'boolean'
    && typeof record.marketing === 'boolean'
    && typeof record.disclosureVersion === 'string'
    && typeof record.savedAt === 'string'
}

export function createSmsConsentLocalRepository(store: SmsConsentStore = storage) {
  return {
    load(businessSlug: string, phoneE164: string): LocalSmsConsentRecord | null {
      const slug = normalizeBusinessSlug(businessSlug)
      const phone = normalizePhoneE164(phoneE164)
      const key = storageKey(slug, phone)
      const raw = store.getItem(key)
      if (raw !== null) {
        try {
          const parsed: unknown = JSON.parse(raw)
          if (isLocalSmsConsentRecord(parsed, slug, phone)) return parsed
        } catch {
          // Invalid browser state is discarded below.
        }

        store.removeItem(key)
        return null
      }

      const legacyKey = legacyStorageKey(slug)
      const legacyRaw = store.getItem(legacyKey)
      if (legacyRaw === null) return null

      try {
        const legacyParsed = JSON.parse(legacyRaw) as Partial<LocalSmsConsentRecord>
        if (!isLocalSmsConsentRecord(legacyParsed, slug, phone)) return null

        store.setItem(key, JSON.stringify(legacyParsed))
        store.removeItem(legacyKey)
        return legacyParsed
      } catch {
        store.removeItem(legacyKey)
      }

      return null
    },
    save(record: LocalSmsConsentRecord) {
      const businessSlug = normalizeBusinessSlug(record.businessSlug)
      const phoneE164 = normalizePhoneE164(record.phoneE164)
      const normalizedRecord: LocalSmsConsentRecord = { ...record, businessSlug, phoneE164 }
      store.setItem(storageKey(businessSlug, phoneE164), JSON.stringify(normalizedRecord))
    },
    remove(businessSlug: string, phoneE164: string) {
      store.removeItem(storageKey(businessSlug, phoneE164))
    },
  }
}

export const smsConsentLocalRepository = createSmsConsentLocalRepository()
export default smsConsentLocalRepository
