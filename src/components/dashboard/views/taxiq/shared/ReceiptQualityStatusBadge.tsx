import { AlertCircle, CheckCircle2, Clock } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { ReceiptQualityStatus } from '../../../../../data/repositories/taxiqReceipts'

const STATUS_STYLES: Record<ReceiptQualityStatus, string> = {
  Pending: 'bg-slate-50 text-slate-600 border-slate-100/50 dark:bg-white/5 dark:text-slate-400 dark:border-white/10',
  Valid: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  NeedsMoreInfo: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
}

const STATUS_ICONS: Record<ReceiptQualityStatus, typeof Clock> = {
  Pending: Clock,
  Valid: CheckCircle2,
  NeedsMoreInfo: AlertCircle,
}

const STATUS_LABEL_KEYS: Record<ReceiptQualityStatus, string> = {
  Pending: 'taxiq.receiptVault.quality.pending',
  Valid: 'taxiq.receiptVault.quality.valid',
  NeedsMoreInfo: 'taxiq.receiptVault.quality.needsMoreInfo',
}

export default function ReceiptQualityStatusBadge({ status }: { status: ReceiptQualityStatus }) {
  const { t } = useTranslation()
  const Icon = STATUS_ICONS[status] ?? Clock
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.Pending

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(STATUS_LABEL_KEYS[status] ?? status)}
    </span>
  )
}
