import { AlertTriangle, CheckCircle2, Clock, FileEdit, Send } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const STATUS_STYLES: Record<string, string> = {
  NotReady: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  Ready: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  NeedsReview: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  CopyDelivered: 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  EFileQueued: 'bg-violet-50 text-violet-600 border-violet-100/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
}

const STATUS_ICONS: Record<string, typeof Clock> = {
  NotReady: FileEdit,
  Ready: CheckCircle2,
  NeedsReview: AlertTriangle,
  CopyDelivered: Send,
  EFileQueued: Clock,
}

export default function Form1099NecStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Clock
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.NotReady

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}>
      <Icon className="h-3 w-3" />
      {t(`taxiq.form1099nec.status.${status}`) || status}
    </span>
  )
}
