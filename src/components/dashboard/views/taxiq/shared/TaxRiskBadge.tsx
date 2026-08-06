import { AlertTriangle, CheckCircle2, Info } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const RISK_STYLES: Record<string, string> = {
  High: 'bg-rose-50 text-rose-600 border-rose-100/50 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20',
  Medium: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  Low: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
}

const RISK_ICONS: Record<string, typeof CheckCircle2> = {
  High: AlertTriangle,
  Medium: Info,
  Low: CheckCircle2,
}

export default function TaxRiskBadge({ riskLevel }: { riskLevel: string }) {
  const { t } = useTranslation()
  const Icon = RISK_ICONS[riskLevel] ?? Info
  const style = RISK_STYLES[riskLevel] ?? RISK_STYLES.Low

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}>
      <Icon className="h-3 w-3" />
      {t(`taxiq.taxEstimate.riskLevel.${riskLevel}`) || riskLevel}
    </span>
  )
}
