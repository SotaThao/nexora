import { AlertCircle, CheckCircle2, Circle, FileWarning, Lock, ShieldAlert } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import Tooltip from '../../../../ui/Tooltip'

const STATUS_STYLES: Record<string, string> = {
  Draft: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  Ready: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  MissingReceipt: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  MissingInfo: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  CPAReview: 'bg-violet-50 text-violet-600 border-violet-100/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  Locked: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
}

const STATUS_ICONS: Record<string, typeof Circle> = {
  Draft: Circle,
  Ready: CheckCircle2,
  MissingReceipt: FileWarning,
  MissingInfo: AlertCircle,
  CPAReview: ShieldAlert,
  Locked: Lock,
}

const STATUS_LABEL_KEYS: Record<string, string> = {
  Draft: 'taxiq.deductionCenter.status.draft',
  Ready: 'taxiq.deductionCenter.status.ready',
  MissingReceipt: 'taxiq.deductionCenter.status.missingReceipt',
  MissingInfo: 'taxiq.deductionCenter.status.missingInfo',
  CPAReview: 'taxiq.deductionCenter.status.cpaReview',
  Locked: 'taxiq.deductionCenter.status.locked',
}

const STATUS_TOOLTIP_KEYS: Record<string, string> = {
  Draft: 'taxiq.deductionCenter.statusTooltips.draft',
  Ready: 'taxiq.deductionCenter.statusTooltips.ready',
  MissingReceipt: 'taxiq.deductionCenter.statusTooltips.missingReceipt',
  MissingInfo: 'taxiq.deductionCenter.statusTooltips.missingInfo',
  CPAReview: 'taxiq.deductionCenter.statusTooltips.cpaReview',
  Locked: 'taxiq.deductionCenter.statusTooltips.locked',
}

export default function DeductionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Circle
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Draft
  const tooltipKey = STATUS_TOOLTIP_KEYS[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(STATUS_LABEL_KEYS[status] ?? status)}
      {tooltipKey && <Tooltip content={t(tooltipKey)} />}
    </span>
  )
}
