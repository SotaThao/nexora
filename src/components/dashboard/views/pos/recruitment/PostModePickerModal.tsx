import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { SlidersHorizontal, X, Zap } from 'lucide-react'

import { useTranslation } from '../../../../../contexts/LanguageContext'

const TK = 'components.dashboard.views.pos.recruitment.modePicker'

interface PostModePickerModalProps {
  onQuick: () => void
  onAdvanced: () => void
  onClose: () => void
}

export default function PostModePickerModal({ onQuick, onAdvanced, onClose }: PostModePickerModalProps) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDivElement>(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusable = () => Array.from(dialog?.querySelectorAll<HTMLElement>('button:not(:disabled), [href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])
    focusable()[0]?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key !== 'Tab') return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="post-mode-picker-title" className="nexora-modal-card flex w-full max-w-xl flex-col rounded-2xl border border-nexoraBorder bg-white p-5 shadow-2xl sm:p-6" onMouseDown={(event) => event.stopPropagation()}>
        <header className="flex items-center justify-between gap-4">
          <h2 id="post-mode-picker-title" className="text-xl font-black text-nexoraText">{t(`${TK}.title`)}</h2>
          <button type="button" onClick={onClose} aria-label={t(`${TK}.close`)} className="grid min-h-11 min-w-11 place-items-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand"><X className="h-5 w-5" aria-hidden /></button>
        </header>
        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <button type="button" onClick={onQuick} className="min-h-32 rounded-xl border border-nexoraLavender bg-nexoraBrandSoft p-4 text-left hover:border-nexoraBrand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            <Zap className="h-5 w-5 text-nexoraBrand" aria-hidden />
            <strong className="mt-3 block text-base text-nexoraText">{t(`${TK}.quickTitle`)}</strong>
            <span className="mt-1 block text-xs font-medium leading-5 text-nexoraMuted">{t(`${TK}.quickDescription`)}</span>
          </button>
          <button type="button" onClick={onAdvanced} className="min-h-32 rounded-xl border border-nexoraBorder bg-white p-4 text-left hover:border-nexoraBrand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand">
            <SlidersHorizontal className="h-5 w-5 text-nexoraBrand" aria-hidden />
            <strong className="mt-3 block text-base text-nexoraText">{t(`${TK}.advancedTitle`)}</strong>
            <span className="mt-1 block text-xs font-medium leading-5 text-nexoraMuted">{t(`${TK}.advancedDescription`)}</span>
          </button>
        </div>
      </div>
    </div>,
    document.body,
  )
}
