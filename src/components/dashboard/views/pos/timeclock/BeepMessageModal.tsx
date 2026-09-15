// BeepMessageModal — optional text sent along with a beep notification. Shared by every beep entry
// point (Time Clock roster and the Turn Board station cards) so both ask for the same message.
//
// Suggestion chips just fill the textarea; nothing is sent until Send is pressed, so front desk
// can tap a suggestion and still edit it before it goes out.
//
// Two kinds of chip sit in that row: the five built-in ones, which come from the locale and follow
// the interface language, and the ones this front desk saved itself, which are the salon's own
// wording ("Room 3 is ready") and are kept verbatim on this device. Saving is what makes the
// second kind reusable on the next beep — see `usePosBeepSuggestions`.
import { Plus, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  beepSuggestionKey,
  normalizeBeepSuggestion,
  POS_BEEP_MESSAGE_MAX_LENGTH,
  POS_BEEP_SAVED_SUGGESTIONS_MAX,
} from '../../../../../constants/posStaffBeep'
import {
  usePosBeepSuggestions,
  useRemovePosBeepSuggestion,
  useSavePosBeepSuggestion,
} from '../../../../../data/hooks/usePosBeepSuggestions'
import IconButton from '../../../../ui/IconButton'
import { tk } from './timeClockI18n'

const SUGGESTION_KEYS = [
  'beepSuggestionCustomerWaiting',
  'beepSuggestionFrontDesk',
  'beepSuggestionYourTurn',
  'beepSuggestionClockIn',
  'beepSuggestionShiftStarted',
]

const CHIP_BASE = 'rounded-full border text-[11px] font-bold transition-colors'

export default function BeepMessageModal({
  open,
  staffName,
  message,
  isPending,
  onChangeMessage,
  onSend,
  onClose,
}: {
  open: boolean
  staffName: string
  message: string
  isPending: boolean
  onChangeMessage: (message: string) => void
  onSend: () => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  // Hooks stay above the early return — `open` flips while this component is mounted.
  const savedSuggestions = usePosBeepSuggestions()
  const saveSuggestion = useSavePosBeepSuggestion()
  const removeSuggestion = useRemovePosBeepSuggestion()

  if (!open) return null

  const saved = savedSuggestions.data ?? []
  const builtIns = SUGGESTION_KEYS.map((key) => t(tk(key)))

  // What Save would actually store, so the duplicate and empty checks below judge the same string
  // the repository will write rather than the raw textarea value.
  const pending = normalizeBeepSuggestion(message)
  const existingKeys = new Set([...builtIns, ...saved].map(beepSuggestionKey))
  const isDuplicate = pending !== '' && existingKeys.has(beepSuggestionKey(pending))
  const isAtCap = saved.length >= POS_BEEP_SAVED_SUGGESTIONS_MAX
  const isSuggestionBusy = saveSuggestion.isPending || removeSuggestion.isPending
  const canSave = pending !== '' && !isDuplicate && !isAtCap && !isSuggestionBusy

  // Only ever explains a Save the operator just tried to make — an empty textarea says nothing.
  const saveHint = pending === '' || canSave
    ? ''
    : isDuplicate
      ? t(tk('beepModalSuggestionExists'))
      : isAtCap
        ? t(tk('beepModalSuggestionLimit'), { count: POS_BEEP_SAVED_SUGGESTIONS_MAX })
        : ''

  const handleSave = () => {
    if (!canSave) return
    // Fire-and-forget: the chip appears from the seeded cache, and a storage failure is logged in
    // the repository rather than blocking the beep the operator actually came here to send.
    saveSuggestion.mutate(pending)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(tk('beepModalTitle'), { name: staffName })}
          </h2>
          <IconButton label={t(tk('beepModalClose'))} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1.5 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t(tk('beepModalSuggestionsLabel'))}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {builtIns.map((text, index) => (
                <button
                  key={SUGGESTION_KEYS[index]}
                  type="button"
                  onClick={() => onChangeMessage(text)}
                  className={`${CHIP_BASE} border-nexoraBorder px-3.5 py-2 text-nexoraMuted hover:border-nexoraBrand hover:text-nexoraBrandDark`}
                >
                  {text}
                </button>
              ))}

              {/* Saved chips carry the brand tint so it is obvious which ones this device owns —
                  and therefore which ones the remove button can take away. */}
              {saved.map((text) => (
                <span
                  key={text}
                  className={`${CHIP_BASE} inline-flex max-w-full items-stretch border-nexoraBrand/20 bg-nexoraBrandSoft/60`}
                >
                  <button
                    type="button"
                    onClick={() => onChangeMessage(text)}
                    title={text}
                    className="min-w-0 max-w-[14rem] truncate rounded-l-full py-2 pl-3.5 pr-1 text-left text-nexoraBrandDark hover:text-nexoraBrand"
                  >
                    {text}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSuggestion.mutate(text)}
                    disabled={isSuggestionBusy}
                    aria-label={t(tk('beepModalRemoveSuggestion'), { message: text })}
                    title={t(tk('beepModalRemoveSuggestion'), { message: text })}
                    className="flex w-8 shrink-0 items-center justify-center rounded-r-full text-nexoraSubtle hover:text-nexoraDanger disabled:opacity-60"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div>
            {/* Wraps rather than truncates: at 375px the label and the Save button do not fit on
                one line, and a clipped "Save as quick message" is worse than a second line. */}
            <div className="mb-1 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
              <label className="block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                {t(tk('beepModalMessageLabel'))}
              </label>
              <button
                type="button"
                onClick={handleSave}
                disabled={!canSave}
                className="flex shrink-0 items-center gap-1 rounded-full border border-nexoraBrand/20 bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-nexoraBrand hover:border-nexoraBrand hover:bg-nexoraBrandSoft disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Plus className="h-3 w-3" />
                {t(tk('beepModalSaveSuggestion'))}
              </button>
            </div>
            <textarea
              value={message}
              onChange={(e) => onChangeMessage(e.target.value)}
              maxLength={POS_BEEP_MESSAGE_MAX_LENGTH}
              rows={3}
              placeholder={t(tk('beepModalPlaceholder'))}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
            {saveHint ? (
              <p className="mt-1 text-[10px] font-bold text-nexoraSubtle">{saveHint}</p>
            ) : null}
          </div>
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="flex h-11 items-center rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:border-nexoraBrand hover:text-nexoraBrandDark disabled:opacity-60"
          >
            {t(tk('beepModalCancel'))}
          </button>
          <button
            type="button"
            onClick={onSend}
            disabled={isPending}
            className="flex h-11 items-center rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {t(tk('beepModalSend'))}
          </button>
        </div>
      </div>
    </div>
  )
}
