import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const STATUS_STYLES: Record<string, string> = {
  Pending: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  Paid: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Overdue: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  Pending: Clock,
  Paid: CheckCircle2,
  Overdue: AlertCircle,
}

export default function TaxReminderStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Clock
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Pending

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(`taxiq.reminders.status.${status}`) || status}
    </span>
  )
}
