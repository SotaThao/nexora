// BeepMessageModal — optional text sent along with a beep notification. Shared by every beep entry
// point (Time Clock roster and the Turn Board station cards) so both ask for the same message.
//
// Suggestion chips just fill the textarea; nothing is sent until Send is pressed, so front desk
// can tap a suggestion and still edit it before it goes out.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import { tk } from './timeClockI18n'

const MESSAGE_MAX_LENGTH = 200

const SUGGESTION_KEYS = [
  'beepSuggestionCustomerWaiting',
  'beepSuggestionFrontDesk',
  'beepSuggestionYourTurn',
  'beepSuggestionClockIn',
  'beepSuggestionShiftStarted',
]

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

  if (!open) return null

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
              {SUGGESTION_KEYS.map((key) => {
                const text = t(tk(key))
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => onChangeMessage(text)}
                    className="rounded-full border border-nexoraBorder px-3.5 py-2 text-[11px] font-bold text-nexoraMuted hover:border-nexoraBrand hover:text-nexoraBrandDark"
                  >
                    {text}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t(tk('beepModalMessageLabel'))}
            </label>
            <textarea
              value={message}
              onChange={(e) => onChangeMessage(e.target.value)}
              maxLength={MESSAGE_MAX_LENGTH}
              rows={3}
              placeholder={t(tk('beepModalPlaceholder'))}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
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
