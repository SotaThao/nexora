// Step 2 — the name to greet the customer with.
//
// Prefilled for a returning customer, editable, and allowed to stay empty: the order only needs a
// phone number, and forcing a stranger to type their name at the door costs more check-ins than
// the blank field costs the front desk.
import { useTranslation } from '../../../contexts/LanguageContext'

const K = 'components.posDevice.SelfCheckInFlow'

const NAME_MAX_LENGTH = 200

export default function CustomerNameStep({
  value,
  phoneLabel,
  onChange,
  onBack,
  onContinue,
}: {
  value: string
  phoneLabel: string
  onChange: (next: string) => void
  onBack: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation()

  return (
    <div className="mx-auto w-full max-w-md space-y-6 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.nameTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{phoneLabel}</p>
      </div>

      <div>
        <label htmlFor="kiosk-customer-name" className="mb-1 block text-xs font-bold uppercase tracking-wide text-nexoraMuted">
          {t(`${K}.nameLabel`)}
        </label>
        <input
          id="kiosk-customer-name"
          type="text"
          value={value}
          maxLength={NAME_MAX_LENGTH}
          autoComplete="off"
          onChange={(e) => onChange(e.target.value)}
          placeholder={t(`${K}.namePlaceholder`)}
          className="h-14 w-full rounded-lg border border-nexoraBorder bg-white px-4 text-base text-nexoraText outline-none focus:border-nexoraBrand"
        />
        <p className="mt-1 text-xs text-nexoraMuted">{t(`${K}.nameOptionalHint`)}</p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand"
        >
          {t(`${K}.back`)}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="h-14 flex-[2] rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark"
        >
          {t(`${K}.continue`)}
        </button>
      </div>
    </div>
  )
}
