import { useEffect, useState } from 'react'
import { Check, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import useBodyScrollLock from '../../../hooks/useBodyScrollLock'
import useVisualViewportRect from '../../../hooks/useVisualViewportRect'
import {
  WORK_ORDER_COMPLETE_MODAL,
  WORK_ORDER_COMPLETION_NOTE_MAX_LENGTH,
  WORK_ORDER_COMPLETION_SUGGESTION_I18N,
  WORK_ORDER_KEYBOARD,
  WORK_ORDERS_I18N,
  WORK_ORDERS_LAYOUT_CLASS,
  workOrderCompletionChipClass,
} from './constants'
import {
  composeWorkOrderCompletionNote,
  toggleWorkOrderSuggestion,
  workOrderViewportOverlayStyle,
} from './workOrderTickets'

interface WorkOrderCompleteServiceModalProps {
  customerName: string
  isPending: boolean
  onConfirm: (note: string | null) => void
  onClose: () => void
}

export default function WorkOrderCompleteServiceModal({
  customerName,
  isPending,
  onConfirm,
  onClose,
}: WorkOrderCompleteServiceModalProps) {
  const { t } = useTranslation()
  const viewport = useVisualViewportRect()
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [additionalNote, setAdditionalNote] = useState('')

  useBodyScrollLock(true)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== WORK_ORDER_KEYBOARD.escape || isPending) return
      onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isPending, onClose])

  const overlayStyle = workOrderViewportOverlayStyle(viewport)
  const cardStyle = viewport ? { maxHeight: WORK_ORDER_COMPLETE_MODAL.cardMaxHeight } : undefined

  const completionNote = composeWorkOrderCompletionNote(selectedSuggestions, additionalNote)
  const canConfirm = !isPending && completionNote != null

  const handleConfirm = () => {
    if (!canConfirm || !completionNote) return
    onConfirm(completionNote)
  }

  return (
    <div style={overlayStyle} className={WORK_ORDERS_LAYOUT_CLASS.modalOverlay}>
      <div
        style={cardStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={WORK_ORDER_COMPLETE_MODAL.titleId}
        className={WORK_ORDERS_LAYOUT_CLASS.modalCard}
      >
        <div className={WORK_ORDERS_LAYOUT_CLASS.modalHeader}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.grow}>
            <p className={WORK_ORDERS_LAYOUT_CLASS.modalKicker}>{customerName}</p>
            <h2 id={WORK_ORDER_COMPLETE_MODAL.titleId} className={WORK_ORDERS_LAYOUT_CLASS.modalTitle}>
              {t(WORK_ORDERS_I18N.completeServiceTitle)}
            </h2>
          </div>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalClose}
            aria-label={t(WORK_ORDERS_I18N.closeCompleteModal)}
            disabled={isPending}
            onClick={onClose}
          >
            <X className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
          </button>
        </div>

        <div className={WORK_ORDERS_LAYOUT_CLASS.modalBody}>
          <div className={WORK_ORDERS_LAYOUT_CLASS.modalHero}>
            <span className={WORK_ORDERS_LAYOUT_CLASS.modalHeroIcon}>
              <Check className={WORK_ORDERS_LAYOUT_CLASS.iconMd} aria-hidden="true" />
            </span>
            <p className={WORK_ORDERS_LAYOUT_CLASS.modalHeroTitle}>
              {t(WORK_ORDERS_I18N.completeReadyTitle)}
            </p>
            <p className={WORK_ORDERS_LAYOUT_CLASS.modalHeroBody}>
              {t(WORK_ORDERS_I18N.completeReadyBody)}
            </p>
            <p className={WORK_ORDERS_LAYOUT_CLASS.modalHeroBody}>
              {t(WORK_ORDERS_I18N.completeClosesTicket)}
            </p>
          </div>

          <div>
            <p className={WORK_ORDERS_LAYOUT_CLASS.modalSectionTitle}>
              {t(WORK_ORDERS_I18N.suggestedNotes)}
            </p>
            <div className={WORK_ORDERS_LAYOUT_CLASS.modalChipRow}>
              {WORK_ORDER_COMPLETION_SUGGESTION_I18N.map((key) => {
                const label = t(key)
                const isActive = selectedSuggestions.includes(label)
                return (
                  <button
                    key={key}
                    type="button"
                    disabled={isPending}
                    aria-pressed={isActive}
                    className={workOrderCompletionChipClass(isActive)}
                    onClick={() => setSelectedSuggestions((current) => toggleWorkOrderSuggestion(current, label))}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <div className={WORK_ORDERS_LAYOUT_CLASS.modalNoteHead}>
              <p className={WORK_ORDERS_LAYOUT_CLASS.modalSectionTitle}>
                {t(WORK_ORDERS_I18N.additionalNote)}
              </p>
              <span className={WORK_ORDERS_LAYOUT_CLASS.modalOptional}>
                {t(WORK_ORDERS_I18N.optional)}
              </span>
            </div>
            <textarea
              value={additionalNote}
              rows={WORK_ORDER_COMPLETE_MODAL.textareaRows}
              maxLength={WORK_ORDER_COMPLETION_NOTE_MAX_LENGTH}
              disabled={isPending}
              placeholder={t(WORK_ORDERS_I18N.additionalNotePlaceholder)}
              className={WORK_ORDERS_LAYOUT_CLASS.modalTextarea}
              onChange={(event) => setAdditionalNote(event.target.value)}
            />
          </div>
        </div>

        <div className={WORK_ORDERS_LAYOUT_CLASS.modalFooter}>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalCancel}
            disabled={isPending}
            onClick={onClose}
          >
            {t(WORK_ORDERS_I18N.cancel)}
          </button>
          <button
            type="button"
            className={WORK_ORDERS_LAYOUT_CLASS.modalConfirm}
            disabled={!canConfirm}
            onClick={handleConfirm}
          >
            <span className={WORK_ORDERS_LAYOUT_CLASS.modalConfirmIcon}>
              <Check className={WORK_ORDERS_LAYOUT_CLASS.iconSm} aria-hidden="true" />
            </span>
            {t(WORK_ORDERS_I18N.confirmCompletion)}
          </button>
        </div>
      </div>
    </div>
  )
}
