import { Banknote, CalendarClock, PiggyBank, ShieldAlert } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'

const SUGGESTION_STYLES: Record<string, string> = {
  DeductNow: 'bg-emerald-50 text-emerald-600 border-emerald-100/50 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20',
  Depreciate: 'bg-sky-50 text-sky-600 border-sky-100/50 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20',
  Section179Candidate: 'bg-amber-50 text-amber-600 border-amber-100/50 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20',
  CPAReview: 'bg-violet-50 text-violet-600 border-violet-100/50 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/20',
}

const SUGGESTION_ICONS: Record<string, typeof Banknote> = {
  DeductNow: Banknote,
  Depreciate: CalendarClock,
  Section179Candidate: PiggyBank,
  CPAReview: ShieldAlert,
}

const SUGGESTION_LABEL_KEYS: Record<string, string> = {
  DeductNow: 'taxiq.assetsTracker.equipment.aiSuggestion.deductNow',
  Depreciate: 'taxiq.assetsTracker.equipment.aiSuggestion.depreciate',
  Section179Candidate: 'taxiq.assetsTracker.equipment.aiSuggestion.section179Candidate',
  CPAReview: 'taxiq.assetsTracker.equipment.aiSuggestion.cpaReview',
}

const SUGGESTION_EXPLANATION_KEYS: Record<string, string> = {
  DeductNow: 'taxiq.assetsTracker.equipment.aiSuggestion.deductNowExplanation',
  Depreciate: 'taxiq.assetsTracker.equipment.aiSuggestion.depreciateExplanation',
  Section179Candidate: 'taxiq.assetsTracker.equipment.aiSuggestion.section179CandidateExplanation',
  CPAReview: 'taxiq.assetsTracker.equipment.aiSuggestion.cpaReviewExplanation',
}

export function EquipmentAiSuggestionBadge({ suggestion }: { suggestion: string }) {
  const { t } = useTranslation()
  const Icon = SUGGESTION_ICONS[suggestion] ?? ShieldAlert
  const style = SUGGESTION_STYLES[suggestion] ?? SUGGESTION_STYLES.CPAReview

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${style}`}
    >
      <Icon className="h-3 w-3" />
      {t(SUGGESTION_LABEL_KEYS[suggestion] ?? suggestion)}
    </span>
  )
}

export function equipmentAiSuggestionExplanationKey(suggestion: string): string {
  return SUGGESTION_EXPLANATION_KEYS[suggestion] ?? 'taxiq.assetsTracker.equipment.aiSuggestion.cpaReviewExplanation'
}
