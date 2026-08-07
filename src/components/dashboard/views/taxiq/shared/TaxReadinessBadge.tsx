import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const STATUS_STYLES: Record<string, string> = {
  Ready: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  NeedsAttention: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  NotStarted: 'bg-slate-50 text-slate-500 border-slate-100/50 dark:bg-white/5 dark:text-slate-500 dark:border-white/10',
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  Ready: CheckCircle2,
  NeedsAttention: AlertTriangle,
  NotStarted: Circle,
}

export default function TaxReadinessBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Circle
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.NotStarted

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}>
      <Icon className="h-3 w-3" />
      {t(`taxiq.taxEstimate.readinessStatus.${status}`) || status}
    </span>
  )
}
