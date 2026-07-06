import { Check, Clock, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PayoutStatus } from '../../../data/payoutConstants'
import { getPayoutStatusI18nKey } from '../../../utils/payoutDisplay'

const STATUS_STYLE: Record<number, string> = {
  [PayoutStatus.Draft]: 'bg-slate-100 text-slate-600 border-slate-200',
  [PayoutStatus.Pending]: 'bg-amber-50 text-amber-700 border-amber-200',
  [PayoutStatus.Confirmed]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  [PayoutStatus.Cancelled]: 'bg-red-50 text-red-600 border-red-200',
}

const STATUS_ICON: Record<number, typeof Clock> = {
  [PayoutStatus.Pending]: Clock,
  [PayoutStatus.Confirmed]: Check,
  [PayoutStatus.Cancelled]: X,
}

export default function PayoutStatusBadge({
  status,
  audience = 'merchant',
  className = '',
}: {
  status: number
  audience?: 'merchant' | 'staff'
  className?: string
}) {
  const { t } = useTranslation()
  const Icon = STATUS_ICON[status]
  const style = STATUS_STYLE[status] ?? STATUS_STYLE[PayoutStatus.Pending]

  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style} ${className}`.trim()}>
      {Icon ? <Icon className="h-3 w-3" /> : null}
      {t(getPayoutStatusI18nKey(status, audience))}
    </span>
  )
}
