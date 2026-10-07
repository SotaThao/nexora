import { JobPayType } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import type { PosJobPostingUpsertInput } from '../../../../../types/posRecruitment'
import { getRecruitmentPayLabel, type RecruitmentValidationErrors } from './recruitmentModel'
import {
  RECRUITMENT_COMPENSATION_CHOICES,
  recruitmentCompensationPatch,
  recruitmentCompensationPreview,
  getRecruitmentCompensationChoice,
} from './recruitmentCompensation'

const PROFILE_TK = 'components.dashboard.views.pos.PosStaffProfileView'
const COMPOSER_TK = 'components.dashboard.views.pos.recruitment.composer'
const fieldClass = 'min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft disabled:bg-slate-100 disabled:text-nexoraSubtle'

interface RecruitmentCompensationFieldsProps {
  draft: PosJobPostingUpsertInput
  errors: RecruitmentValidationErrors
  disabled: boolean
  onChange: (patch: Partial<PosJobPostingUpsertInput>) => void
}

export default function RecruitmentCompensationFields({ draft, errors, disabled, onChange }: RecruitmentCompensationFieldsProps) {
  const { t } = useTranslation()
  const choice = getRecruitmentCompensationChoice(draft)
  const currentLabel = getRecruitmentPayLabel(recruitmentCompensationPreview(draft), t)
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="text-xs font-bold text-nexoraText">
          {t(`${COMPOSER_TK}.fields.payType`)}
          <select disabled={disabled} value={choice} onChange={(event) => {
            const selected = RECRUITMENT_COMPENSATION_CHOICES.find((value) => value === event.target.value)
            if (selected) onChange(recruitmentCompensationPatch(draft, selected))
          }} className={`${fieldClass} mt-1.5`}>
            {choice === 'legacy' ? <option disabled value="legacy">{currentLabel}</option> : null}
            {RECRUITMENT_COMPENSATION_CHOICES.map((value) => <option key={value} value={value}>{t(`${PROFILE_TK}.payStructureTypes.${value}`)}</option>)}
          </select>
        </label>
        {draft.payType === JobPayType.Fixed ? (
          <label className="text-xs font-bold text-nexoraText">
            {t(choice === 'WeeklySalary' ? `${PROFILE_TK}.weeklySalaryAmountLabel` : choice === 'AgreedAmount' ? `${PROFILE_TK}.agreedAmountLabel` : `${COMPOSER_TK}.fields.payAmount`)} *
            <input id="recruitment-field-payAmount" type="number" min="0.01" max="100000" step="0.01" disabled={disabled} value={draft.payAmount ?? ''} onChange={(event) => {
              const amount = event.target.value ? Number(event.target.value) : null
              onChange(choice === 'legacy'
                ? { payAmount: amount, payText: null }
                : recruitmentCompensationPatch(draft, choice, amount))
            }} placeholder={t(`${COMPOSER_TK}.placeholders.payAmount`)} className={`${fieldClass} mt-1.5 ${errors.payAmount ? 'border-rose-400' : ''}`} aria-invalid={Boolean(errors.payAmount)} aria-describedby={errors.payAmount ? 'recruitment-pay-amount-error' : undefined} />
            {errors.payAmount ? <span id="recruitment-pay-amount-error" className="mt-1 block text-[11px] font-semibold text-rose-600">{errors.payAmount}</span> : null}
          </label>
        ) : null}
      </div>
      {choice === 'legacy' || draft.payText?.trim() ? <p className="text-xs font-medium text-nexoraMuted">{t(`${COMPOSER_TK}.fields.currentCompensation`, { value: currentLabel })}</p> : null}
    </div>
  )
}
