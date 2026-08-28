// "Nice to meet you!" — who this check-in is for.
//
// The phone number is shown rather than assumed: a mistyped digit is the most common way a
// check-in goes wrong, and the guest cannot spot it if the number they entered is never displayed
// back. Change number returns to the keypad with the digits still there.
import { Phone, UserRound } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.CustomerIdentityCard'

const NAME_MAX_LENGTH = 200

export default function CustomerIdentityCard({
  phone,
  customerName,
  onChangeName,
  onChangePhone,
  smsConsent,
  onChangeSmsConsent,
  businessName,
}: {
  phone: string
  customerName: string
  onChangeName: (next: string) => void
  onChangePhone: () => void
  smsConsent: boolean
  onChangeSmsConsent: (next: boolean) => void
  businessName: string
}) {
  const { t } = useTranslation()

  return (
    <CheckInSectionCard
      title={t(`${K}.title`)}
      subtitle={t(`${K}.subtitle`)}
      icon={UserRound}
      relaxed
    >
      <div className="flex items-center justify-between gap-3 rounded-xl bg-nexoraCanvas px-3 py-2.5">
        <span className="flex min-w-0 items-center gap-2">
          <Phone className="h-4 w-4 shrink-0 text-nexoraBrand" />
          <span className="truncate text-sm font-bold text-nexoraText">{phone}</span>
        </span>
        <button
          type="button"
          onClick={onChangePhone}
          className="shrink-0 text-xs font-black uppercase tracking-wide text-nexoraBrand hover:text-nexoraBrandDark"
        >
          {t(`${K}.changePhone`)}
        </button>
      </div>

      <div>
        <label
          htmlFor="checkin-customer-name"
          className="mb-1 block text-[11px] font-black uppercase tracking-wide text-nexoraMuted"
        >
          {t(`${K}.nameLabel`)}
          {' '}
          <span className="text-[10px] font-semibold normal-case tracking-normal text-nexoraMuted">
            ({t(`${K}.requiredLabel`)})
          </span>
        </label>
        <input
          id="checkin-customer-name"
          type="text"
          value={customerName}
          maxLength={NAME_MAX_LENGTH}
          required
          autoComplete="off"
          onChange={(e) => onChangeName(e.target.value)}
          placeholder={t(`${K}.namePlaceholder`)}
          className="h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
        />
      </div>

      {/* Pre-ticked and required to continue. Recorded here as a deliberate product decision taken
          with the TCPA risk on the table — see the check-in spec's business rules — not as an
          oversight to be quietly "fixed" by unticking it. */}
      <label className="flex cursor-pointer items-start gap-2.5">
        <input
          type="checkbox"
          checked={smsConsent}
          onChange={(e) => onChangeSmsConsent(e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-nexoraBrand"
        />
        <span className="text-xs leading-snug text-nexoraMuted">
          {t(`${K}.smsConsent`, { businessName })}
        </span>
      </label>
    </CheckInSectionCard>
  )
}
