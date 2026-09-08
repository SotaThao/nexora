// Step 2 — the name to greet the customer with.
//
// Prefilled for a returning customer, editable, and required: check-in now needs a name on both
// surfaces, so Continue waits for one rather than letting a guest walk three steps forward and
// find out at the end.
import type { ReactNode } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInStepFrame from '../../checkin/parts/CheckInStepFrame'

const K = 'components.posDevice.SelfCheckInFlow'

const NAME_MAX_LENGTH = 200

export default function CustomerNameStep({
  value,
  phoneLabel,
  onChange,
  onBack,
  onContinue,
  extra,
}: {
  value: string
  phoneLabel: string
  onChange: (next: string) => void
  onBack: () => void
  onContinue: () => void
  // Front desk only — email and "use last visit" sit under the same name field the kiosk shows.
  extra?: ReactNode
}) {
  const { t } = useTranslation()

  return (
    <CheckInStepFrame
      title={t(`${K}.nameTitle`)}
      subtitle={phoneLabel}
      backLabel={t(`${K}.back`)}
      onBack={onBack}
      primaryLabel={t(`${K}.continue`)}
      onPrimary={onContinue}
      primaryDisabled={value.trim() === ''}
    >
      <div>
        <label htmlFor="kiosk-customer-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-nexoraMuted">
          {t(`${K}.nameLabel`)}
          <span className="ml-1 text-[10px] font-semibold normal-case tracking-normal text-nexoraDanger">
            {t('components.checkin.CustomerIdentityCard.requiredLabel')}
          </span>
        </label>
        <input
          id="kiosk-customer-name"
          type="text"
          value={value}
          maxLength={NAME_MAX_LENGTH}
          required
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          placeholder={t(`${K}.namePlaceholder`)}
          className="h-14 w-full rounded-lg border border-nexoraBorder bg-white px-4 text-base text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <p className="mt-1 text-xs text-nexoraMuted">{t(`${K}.nameRequiredHint`)}</p>
      </div>

      {extra}
    </CheckInStepFrame>
  )
}
