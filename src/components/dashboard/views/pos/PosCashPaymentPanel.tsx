import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  formatUsdAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../../utils/currencyInput'

export function cashAmountReceived(value: string): number {
  const parsed = parseDirectPaymentAmountInput(value)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0
}

export function isCashPaymentCovered(value: string, total: number): boolean {
  return value.trim() !== '' && cashAmountReceived(value) >= total
}

export default function PosCashPaymentPanel({
  total,
  value,
  onChange,
  disabled = false,
}: {
  total: number
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}) {
  const { t } = useTranslation()
  const received = cashAmountReceived(value)
  const covered = isCashPaymentCovered(value, total)
  const difference = Math.abs(received - total)
  const hasReceivedAmount = value.trim() !== ''

  return (
    <div className="flex items-center gap-2 rounded-xl border border-nexoraBorder/70 bg-nexoraCanvas/40 p-3">
      <label htmlFor="pos-cash-received" className="shrink-0 text-[10px] font-semibold text-nexoraMuted">
        {t('components.dashboard.views.pos.PosOrderWorkspace.cashReceived')}
      </label>
      <span className="relative block w-[120px] min-w-0 shrink">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-nexoraMuted">$</span>
          <input
            id="pos-cash-received"
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(event) => onChange(
              sanitizeDirectPaymentAmountInput(event.target.value, Number.MAX_SAFE_INTEGER),
            )}
            disabled={disabled}
            placeholder="0.00"
            className="h-8 w-full rounded-lg border border-nexoraBorder bg-white pl-7 pr-3 text-sm font-semibold text-nexoraText outline-none focus:border-nexoraBrand disabled:opacity-60"
          />
      </span>
      {hasReceivedAmount ? (
        <div className="ml-auto flex min-w-0 items-center gap-1.5 text-right" aria-live="polite">
          <span className={`whitespace-nowrap text-[10px] font-semibold ${covered ? 'text-nexoraMuted' : 'text-rose-600'}`}>
            {t(`components.dashboard.views.pos.PosOrderWorkspace.${covered ? 'changeDue' : 'amountRemaining'}`)}
          </span>
          <span className={`whitespace-nowrap text-sm font-bold ${covered ? 'text-nexoraText' : 'text-rose-600'}`}>
            {formatUsdAmount(difference)}
          </span>
        </div>
      ) : null}
    </div>
  )
}
