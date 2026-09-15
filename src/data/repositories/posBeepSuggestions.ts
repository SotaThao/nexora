/**
 * posBeepSuggestionsRepository — the quick messages this device's front desk saved for reuse on a
 * beep, on top of the five built-in ones the modal reads from the locale.
 *
 * Like `posPrinterSettings.ts`, and unlike every other repository here, it talks to `storage`
 * rather than `httpClient`: there is no beep-suggestion endpoint, and the wording that earns a
 * chip is the wording of the iPad it is typed on (see the comment on
 * `POS_BEEP_SUGGESTIONS_STORAGE_KEY`). No `businessId` param, for the same reason.
 *
 * Also deliberately synchronous — device storage is not async, and wrapping it in promises would
 * be ceremony with no payoff.
 *
 * This is the only place that parses, de-duplicates or caps the stored list (the per-message trim
 * is shared with the modal via `normalizeBeepSuggestion` in `constants/posStaffBeep.ts`, so both
 * sides agree on what counts as the same message). Components read it through
 * `usePosBeepSuggestions`, which keeps the "no storage access from components" boundary intact and
 * keeps normalization in one testable place, since anything stored here may have been written by
 * an older build or hand-edited in devtools.
 */
import {
  beepSuggestionKey,
  normalizeBeepSuggestion,
  POS_BEEP_SAVED_SUGGESTIONS_MAX,
  POS_BEEP_SUGGESTIONS_STORAGE_KEY,
} from '../../constants/posStaffBeep'
import { storage } from '../../utils/storage'
import { logger } from '../../utils/logger'

/** The slice of `storage` this repository needs — injectable so tests do not lean on jsdom. */
export interface PosBeepSuggestionStore {
  getItem: (key: string) => string | null
  setItem: (key: string, value: string) => void
  removeItem: (key: string) => void
}

/**
 * Newest first — the message the front desk just saved is the one it is most likely to reuse, and
 * it stays visible without scrolling the chip row.
 */
export function normalizeBeepSuggestions(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const entry of value) {
    const text = normalizeBeepSuggestion(entry)
    if (!text) continue
    const key = beepSuggestionKey(text)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(text)
    if (out.length >= POS_BEEP_SAVED_SUGGESTIONS_MAX) break
  }
  return out
}

export function createPosBeepSuggestionsRepository(
  store: PosBeepSuggestionStore = storage,
) {
  function read(): string[] {
    const raw = store.getItem(POS_BEEP_SUGGESTIONS_STORAGE_KEY)
    if (raw === null) return []
    try {
      return normalizeBeepSuggestions(JSON.parse(raw))
    } catch (error) {
      logger.error('[posBeepSuggestions] could not parse stored value, ignoring it', error)
      return []
    }
  }

  function write(next: string[]): string[] {
    try {
      store.setItem(POS_BEEP_SUGGESTIONS_STORAGE_KEY, JSON.stringify(next))
    } catch (error) {
      // Private browsing and a full quota both throw here. Losing a quick message is survivable;
      // taking the beep modal down with it is not — the beep itself still sends.
      logger.error('[posBeepSuggestions] could not persist value', error)
    }
    return next
  }

  return {
    getSuggestions(): string[] {
      return read()
    },

    /**
     * Saves one message and returns the whole list, so the caller seeds its cache with what was
     * actually written rather than with what it asked for. Re-saving an existing message moves it
     * back to the front instead of duplicating it; an empty one is a no-op.
     */
    addSuggestion(text: string): string[] {
      const normalized = normalizeBeepSuggestion(text)
      if (!normalized) return read()
      const key = beepSuggestionKey(normalized)
      const kept = read().filter((entry) => beepSuggestionKey(entry) !== key)
      return write(normalizeBeepSuggestions([normalized, ...kept]))
    },

    removeSuggestion(text: string): string[] {
      const key = beepSuggestionKey(text)
      const next = read().filter((entry) => beepSuggestionKey(entry) !== key)
      if (next.length === 0) {
        try {
          store.removeItem(POS_BEEP_SUGGESTIONS_STORAGE_KEY)
        } catch (error) {
          logger.error('[posBeepSuggestions] could not clear stored value', error)
        }
        return next
      }
      return write(next)
    },
  }
}

export const posBeepSuggestionsRepository = createPosBeepSuggestionsRepository()
export default posBeepSuggestionsRepository
