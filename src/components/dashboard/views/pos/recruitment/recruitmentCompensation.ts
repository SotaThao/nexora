import { JobPayType, JobPayUnit } from '../../../../../constants/posRecruitment'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import { formatUsdAmount } from '../../../../../utils/currencyInput'

type Compensation = Pick<PosJobPostingUpsertInput, 'payType' | 'payAmount' | 'payUnit' | 'payText'>

export const RECRUITMENT_COMPENSATION_CHOICES = ['Commission', 'WeeklySalary', 'AgreedAmount'] as const
export type RecruitmentCompensationChoice = typeof RECRUITMENT_COMPENSATION_CHOICES[number]

export function getRecruitmentCompensationChoice(draft: Compensation): RecruitmentCompensationChoice | 'legacy' {
  if (draft.payType === JobPayType.Commission) return 'Commission'
  if (draft.payType === JobPayType.Fixed && draft.payUnit === JobPayUnit.Week) return 'WeeklySalary'
  if (draft.payType === JobPayType.Fixed && draft.payUnit === null) return 'AgreedAmount'
  return 'legacy'
}

// Display only: preserve the stored null unit and any existing custom pay text.
export function recruitmentCompensationPreview<T extends Compensation>(draft: T): T {
  if (draft.payType !== JobPayType.Fixed || draft.payUnit !== null || draft.payText?.trim()
    || draft.payAmount === null || !Number.isFinite(draft.payAmount) || draft.payAmount <= 0) return draft
  return { ...draft, payText: formatUsdAmount(draft.payAmount) }
}

export function recruitmentCompensationPatch(
  draft: Compensation,
  choice: RecruitmentCompensationChoice,
  amount = draft.payType === JobPayType.Fixed ? draft.payAmount : null,
): Compensation {
  const next: Compensation = {
    payType: choice === 'Commission' ? JobPayType.Commission : JobPayType.Fixed,
    payAmount: choice === 'Commission' ? null : amount,
    payUnit: choice === 'WeeklySalary' ? JobPayUnit.Week : null,
    payText: null,
  }
  return recruitmentCompensationPreview(next)
}
