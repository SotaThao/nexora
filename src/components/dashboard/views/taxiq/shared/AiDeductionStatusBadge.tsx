import { CheckCircle2, MinusCircle, ShieldAlert, XCircle } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import Tooltip from '../../../../ui/Tooltip'

const AI_STATUS_STYLES: Record<string, string> = {
  Deductible: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  PartiallyDeductible: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  NeedsCPAReview: 'bg-violet-50 text-violet-600 border-violet-100/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
  NotDeductible: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
}

const AI_STATUS_ICONS: Record<string, typeof CheckCircle2> = {
  Deductible: CheckCircle2,
  PartiallyDeductible: MinusCircle,
  NeedsCPAReview: ShieldAlert,
  NotDeductible: XCircle,
}

const AI_STATUS_LABEL_KEYS: Record<string, string> = {
  Deductible: 'taxiq.deductionCenter.aiStatus.deductible',
  PartiallyDeductible: 'taxiq.deductionCenter.aiStatus.partiallyDeductible',
  NeedsCPAReview: 'taxiq.deductionCenter.aiStatus.needsCpaReview',
  NotDeductible: 'taxiq.deductionCenter.aiStatus.notDeductible',
}

const AI_STATUS_TOOLTIP_KEYS: Record<string, string> = {
  Deductible: 'taxiq.deductionCenter.aiStatusTooltips.deductible',
  PartiallyDeductible: 'taxiq.deductionCenter.aiStatusTooltips.partiallyDeductible',
  NeedsCPAReview: 'taxiq.deductionCenter.aiStatusTooltips.needsCpaReview',
  NotDeductible: 'taxiq.deductionCenter.aiStatusTooltips.notDeductible',
}

export default function AiDeductionStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const Icon = AI_STATUS_ICONS[status] ?? CheckCircle2
  const style = AI_STATUS_STYLES[status] ?? AI_STATUS_STYLES.Deductible
  const tooltipKey = AI_STATUS_TOOLTIP_KEYS[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(AI_STATUS_LABEL_KEYS[status] ?? status)}
      {tooltipKey && <Tooltip content={t(tooltipKey)} />}
    </span>
  )
}
