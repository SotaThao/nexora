import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { calculateEstimate, type EstimateDiscountType, type EstimateLine } from '../../../../../data/repositories/posEstimate'
import { formatUsdAmount, sanitizeDecimalInput } from '../../../../../utils/currencyInput'

const K = 'components.dashboard.views.pos.PosEstimateTab'
const fieldClass = 'h-11 w-full min-w-0 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText focus:border-nexoraBrand focus:outline-none disabled:opacity-60'

export default function EstimateDiscountModal({ lines, initialType, initialInput, disabled, onApply, onClose }: {
  lines: EstimateLine[]
  initialType: EstimateDiscountType
  initialInput: string
  disabled: boolean
  onApply: (type: EstimateDiscountType, input: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [type, setType] = useState(initialType)
  const [input, setInput] = useState(initialInput)
  const dialogRef = useRef<HTMLDivElement>(null)
  const id = useId()
  const totals = calculateEstimate(lines, type, input)

  useEffect(() => {
    const previous = document.activeElement
    dialogRef.current?.focus()
    return () => { if (previous instanceof HTMLElement && previous.isConnected) previous.focus() }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/60 p-4">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${id}-title`}
        tabIndex={-1}
        className="nexora-modal-card w-full max-w-sm outline-none"
        onKeyDown={event => {
          if (event.key === 'Escape' && !disabled) { event.preventDefault(); onClose() }
          if (event.key !== 'Tab') return
          const controls = dialogRef.current?.querySelectorAll<HTMLElement>(':is(button, input, select):not(:disabled)')
          if (!controls?.length) return
          const first = controls[0], last = controls[controls.length - 1]
          if (event.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { event.preventDefault(); last.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
        }}
      >
        <div className="mb-3 flex shrink-0 items-center justify-between gap-3">
          <h3 id={`${id}-title`} className="text-sm font-extrabold text-nexoraText">{t(`${K}.discountTitle`)}</h3>
          <button type="button" aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.discountModalClose')} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-nexoraMuted hover:bg-nexoraCanvas" disabled={disabled} onClick={onClose}><X aria-hidden="true" className="h-4 w-4" /></button>
        </div>
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
          <div className="grid grid-cols-[minmax(0,1fr)_5rem] gap-2">
            <div className="relative min-w-0">
              <select aria-label={t(`${K}.discountType`)} className={`${fieldClass} appearance-none pr-9`} value={type} disabled={disabled} onChange={event => { setType(event.target.value as EstimateDiscountType); setInput('0') }}>
                <option value="percent">{t(`${K}.percentage`)}</option>
                <option value="amount">{t(`${K}.amount`)}</option>
              </select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
            </div>
            <input type="text" inputMode="decimal" placeholder="0" aria-label={t(`${K}.discountValue`)} aria-invalid={!totals.validDiscount} aria-describedby={!totals.validDiscount ? `${id}-error` : undefined} className={fieldClass} value={input} disabled={disabled} onChange={event => setInput(sanitizeDecimalInput(event.target.value))} />
          </div>
          <div className="grid grid-cols-5 gap-1.5">
            {[0, 5, 10, 15, 20].map(value => (
              <button key={value} type="button" aria-pressed={Number(input) === value} disabled={disabled || (type === 'amount' && value > totals.subtotal)} onClick={() => setInput(String(value))} className={`min-h-11 rounded-lg border px-1 text-xs font-bold transition-colors disabled:opacity-50 ${Number(input) === value ? 'border-nexoraBrand bg-nexoraBrand/5 text-nexoraBrandDark' : 'border-nexoraBorder text-nexoraText hover:bg-nexoraCanvas'}`}>
                {type === 'percent' ? `${value}%` : `$${value}`}
              </button>
            ))}
          </div>
          {!totals.validDiscount ? <p id={`${id}-error`} role="alert" className="text-xs text-nexoraDanger">{t(`${K}.invalidDiscount`)}</p> : null}
          <dl className="space-y-2 rounded-xl bg-nexoraCanvas p-3 text-xs">
            <div className="flex justify-between gap-3"><dt className="text-nexoraMuted">{t(`${K}.subtotal`)}</dt><dd className="font-bold text-nexoraText">{formatUsdAmount(totals.subtotal)}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-nexoraMuted">{type === 'percent' && Number(input) > 0 ? t(`${K}.discountWithPercent`, { value: Number(input) }) : t(`${K}.discount`)}</dt><dd className="font-bold text-nexoraDanger">{totals.discount > 0 ? '−' : ''}{formatUsdAmount(totals.discount)}</dd></div>
            <div className="flex justify-between gap-3 border-t border-nexoraBorder pt-2 font-bold text-nexoraText"><dt>{t(`${K}.total`)}</dt><dd>{formatUsdAmount(totals.total)}</dd></div>
          </dl>
        </div>
        <div className="mt-4 flex shrink-0 gap-2">
          <button type="button" disabled={disabled} onClick={onClose} className="min-h-11 flex-1 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas disabled:opacity-50">{t('common.cancel')}</button>
          <button type="button" disabled={disabled || !totals.validDiscount} onClick={() => { if (!disabled && totals.validDiscount) onApply(type, input) }} className="min-h-11 flex-1 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50">{t(`${K}.applyDiscount`)}</button>
        </div>
      </div>
    </div>
  )
}
