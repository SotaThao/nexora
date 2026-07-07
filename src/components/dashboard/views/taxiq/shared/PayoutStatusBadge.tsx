import { AlertCircle, CheckCircle2, Clock, ShieldAlert } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const STATUS_STYLES: Record<string, string> = {
  PendingConfirmation: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  Confirmed: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  DisputeReported: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  CPAReviewRequired: 'bg-violet-50 text-violet-600 border-violet-100/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  PendingConfirmation: Clock,
  Confirmed: CheckCircle2,
  DisputeReported: AlertCircle,
  CPAReviewRequired: ShieldAlert,
}

export default function PayoutStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Clock
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PendingConfirmation

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(`taxiq.payoutCenter.status.${status}`) || status}
    </span>
  )
}
