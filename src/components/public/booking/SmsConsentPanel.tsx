/**
 * SmsConsentPanel — the SMS opt-in block shown under the phone field on both public booking pages
 * and on the manage-booking page.
 *
 * Deliberately one component for all three surfaces: the disclosure is legal text submitted as
 * evidence for A2P 10DLC registration, so the three screens must never drift apart in wording.
 * Both checkboxes are unchecked on every render and are never pre-checked from stored state on the
 * booking pages — a pre-ticked consent box is not consent.
 */
import { useTranslation } from '../../../contexts/LanguageContext'
import { SMS_CONSENT_MODE, type SmsConsentMode } from '../../../constants/smsConsent'
import en from '../../../locales/en.json'
import vi from '../../../locales/vi.json'

const CONSENT_STRINGS: Record<string, Record<string, string>> = {
  en: en.public.smsConsent,
  vi: vi.public.smsConsent,
}

interface SmsConsentPanelProps {
  transactional: boolean
  marketing: boolean
  onChange: (next: { transactional: boolean; marketing: boolean }) => void
  /**
   * 'grant-only' (booking form): ticking grants; leaving unticked changes nothing.
   * 'editable' (manage page): unticking withdraws.
   */
  mode?: SmsConsentMode
  disabled?: boolean
  /**
   * Forces a language instead of following the app-wide selection. Needed by the AI Hub booking
   * page (`/b/:businessKey`), which drives its own copy from the `?lang=` query parameter rather
   * than LanguageContext — without this the disclosure would render in a different language from
   * the form around it.
   */
  lang?: string
}

export default function SmsConsentPanel({
  transactional,
  marketing,
  onChange,
  mode = SMS_CONSENT_MODE.grantOnly,
  disabled = false,
  lang,
}: SmsConsentPanelProps) {
  const { t: translate } = useTranslation()

  // Both paths read the same locale entries, so the legal wording can never diverge between the
  // two booking pages — which is the reason this panel is a single shared component.
  const forced = lang ? CONSENT_STRINGS[lang] ?? CONSENT_STRINGS.en : null
  const t = (key: string) =>
    forced ? forced[key.replace('public.smsConsent.', '')] : translate(key)

  const options = [
    {
      id: 'sms-consent-transactional',
      checked: transactional,
      title: t('public.smsConsent.transactionalTitle'),
      badge: t('public.smsConsent.transactionalBadge'),
      badgeClass: 'bg-emerald-50 text-emerald-700',
      copy: t('public.smsConsent.transactionalCopy'),
      toggle: () => onChange({ transactional: !transactional, marketing }),
    },
    {
      id: 'sms-consent-marketing',
      checked: marketing,
      title: t('public.smsConsent.marketingTitle'),
      badge: t('public.smsConsent.marketingBadge'),
      badgeClass: 'bg-amber-50 text-amber-700',
      copy: t('public.smsConsent.marketingCopy'),
      toggle: () => onChange({ transactional, marketing: !marketing }),
    },
  ]

  return (
    <section
      aria-labelledby="sms-consent-heading"
      className="rounded-xl border border-nexoraBorder bg-white p-3"
      data-consent-mode={mode}
    >
      <h3 id="sms-consent-heading" className="text-sm font-extrabold text-nexoraText">
        {t('public.smsConsent.heading')}
      </h3>
      <p className="mt-1 text-[11px] leading-relaxed text-nexoraMuted">{t('public.smsConsent.intro')}</p>

      <div className="mt-3 grid grid-cols-1 gap-2">
        {options.map((option) => (
          // The whole label is the tap target, so the row clears the 44pt guideline even though
          // the checkbox itself is smaller.
          <label
            key={option.id}
            htmlFor={option.id}
            className={`flex min-h-[44px] cursor-pointer gap-2.5 rounded-lg border border-nexoraBorder bg-white p-3 focus-within:border-nexoraBrand hover:border-nexoraBrand ${
              disabled ? 'cursor-not-allowed opacity-60' : ''
            }`}
          >
            <input
              id={option.id}
              type="checkbox"
              checked={option.checked}
              disabled={disabled}
              onChange={option.toggle}
              className="mt-0.5 h-4 w-4 shrink-0 accent-nexoraBrand"
            />
            <span className="min-w-0">
              <span className="block text-xs font-extrabold text-nexoraText">
                {option.title}
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-extrabold ${option.badgeClass}`}>
                  {option.badge}
                </span>
              </span>
              <span className="mt-1 block text-[11px] leading-relaxed text-nexoraMuted">{option.copy}</span>
            </span>
          </label>
        ))}
      </div>

      <p className="mt-3 text-[10px] leading-relaxed text-nexoraMuted">
        {t('public.smsConsent.disclosure')}{' '}
        <a
          href="/terms-of-service"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-nexoraBrand underline"
        >
          {t('public.smsConsent.termsLink')}
        </a>{' '}
        {t('public.smsConsent.disclosureAnd')}{' '}
        <a
          href="/privacy-policy"
          target="_blank"
          rel="noopener noreferrer"
          className="font-bold text-nexoraBrand underline"
        >
          {t('public.smsConsent.privacyLink')}
        </a>
        .
      </p>
    </section>
  )
}
