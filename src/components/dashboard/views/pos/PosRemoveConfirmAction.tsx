import { useEffect, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'

export default function PosRemoveConfirmAction({
  onConfirm,
  disabled = false,
  testId,
}: {
  onConfirm: () => void
  disabled?: boolean
  testId?: string
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  const removeButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)
  const restoreRemoveFocusRef = useRef(false)
  const baseClass = 'h-7 shrink-0 rounded-lg border px-2 text-[10px] font-bold disabled:cursor-not-allowed disabled:opacity-60'

  useEffect(() => {
    if (confirming) {
      confirmButtonRef.current?.focus()
      return
    }
    if (restoreRemoveFocusRef.current) {
      restoreRemoveFocusRef.current = false
      removeButtonRef.current?.focus()
    }
  }, [confirming])

  if (!confirming) {
    return (
      <button
        ref={removeButtonRef}
        type="button"
        data-testid={testId}
        onClick={() => setConfirming(true)}
        disabled={disabled}
        className={`${baseClass} border-rose-200 text-rose-600 hover:bg-rose-50`}
      >
        {t('components.dashboard.views.pos.PosOrderWorkspace.removeLine')}
      </button>
    )
  }

  return (
    <span className="inline-flex shrink-0 items-center gap-1" role="group" aria-live="polite">
      <button
        ref={confirmButtonRef}
        type="button"
        onClick={onConfirm}
        disabled={disabled}
        className={`${baseClass} border-rose-600 bg-rose-600 text-white hover:bg-rose-700`}
      >
        {t('components.dashboard.views.pos.PosOrderWorkspace.confirmRemove')}
      </button>
      <button
        type="button"
        onClick={() => {
          restoreRemoveFocusRef.current = true
          setConfirming(false)
        }}
        disabled={disabled}
        className={`${baseClass} border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand`}
      >
        {t('components.dashboard.views.pos.PosOrderWorkspace.cancelRemove')}
      </button>
    </span>
  )
}
