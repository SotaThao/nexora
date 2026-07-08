import { CheckCircle, Clock, Hourglass } from 'lucide-react'
import { PaymentStatus, type PaymentStatusValue } from '../../../types/domain'
import {
  DIRECT_PAYMENT_STATUS_ORDER,
  getDirectPaymentStatusDescKey,
  getDirectPaymentStatusLabelKey,
} from '../../../utils/directPaymentStatus'

type StatusTone = 'initiated' | 'confirmed' | 'completed'

function resolveTone(status: PaymentStatusValue): StatusTone {
  if (status === PaymentStatus.Confirmed) return 'confirmed'
  if (status === PaymentStatus.Completed) return 'completed'
  return 'initiated'
}

const TONE_CLASS: Record<StatusTone, string> = {
  initiated: 'border-amber-100 bg-amber-50 text-amber-700',
  confirmed: 'border-violet-100 bg-violet-50 text-violet-700',
  completed: 'border-emerald-100 bg-emerald-50 text-emerald-700',
}

export function DirectPaymentStatusBadge({
  status,
  t,
  className = '',
  size = 'sm',
  variant = 'merchant',
}: {
  status: PaymentStatusValue
  t: (key: string) => string
  className?: string
  size?: 'sm' | 'md'
  variant?: 'merchant' | 'staff'
}) {
  const tone = resolveTone(status)
  const Icon = tone === 'completed' ? CheckCircle : tone === 'confirmed' ? Hourglass : Clock
  const padding = size === 'md' ? 'px-2.5 py-0.5' : 'px-2 py-0.5'
  const textSize = size === 'md' ? 'text-[10px]' : 'text-[10px]'

  return (
    <span
      title={t(getDirectPaymentStatusDescKey(status, variant))}
      className={`inline-flex max-w-full items-center gap-1 rounded-full border font-bold ${padding} ${textSize} ${TONE_CLASS[tone]} ${className}`}
    >
      <Icon className="h-3 w-3 shrink-0" />
      <span className="truncate">{t(getDirectPaymentStatusLabelKey(status, variant))}</span>
    </span>
  )
}

export function DirectPaymentStatusLegend({
  t,
  variant = 'merchant',
}: {
  t: (key: string) => string
  variant?: 'merchant' | 'staff'
}) {
  const prefix = variant === 'staff' ? 'staff_payments' : 'merchant_payments'
  const confirmedActionKey =
    variant === 'staff'
      ? 'staff_payments.status_confirmed_staff_action'
      : 'merchant_payments.status_confirmed_merchant_action'

  return (
    <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/50 p-3 sm:p-4">
      <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
        {t(`${prefix}.status_flow_title`)}
      </p>
      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DIRECT_PAYMENT_STATUS_ORDER.map((status) => (
          <div
            key={status}
            className="rounded-lg border border-nexoraBorder/70 bg-white px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <DirectPaymentStatusBadge status={status} t={t} variant={variant} />
            </div>
            <p className="mt-1.5 text-[11px] leading-relaxed text-nexoraMuted">
              {status === PaymentStatus.Confirmed
                ? t(confirmedActionKey)
                : t(getDirectPaymentStatusDescKey(status, variant))}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
