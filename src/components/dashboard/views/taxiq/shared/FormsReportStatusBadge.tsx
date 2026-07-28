import { AlertTriangle, Archive, CheckCircle2, FileEdit } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  NeedsReview: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  Ready: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Archived: 'bg-slate-50 text-slate-500 border-slate-100/50 dark:bg-white/5 dark:text-slate-500 dark:border-white/10',
}

const STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  Draft: FileEdit,
  NeedsReview: AlertTriangle,
  Ready: CheckCircle2,
  Archived: Archive,
}

export default function FormsReportStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? FileEdit
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Draft

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}>
      <Icon className="h-3 w-3" />
      {t(`taxiq.formsReports.status.${status}`) || status}
    </span>
  )
}
