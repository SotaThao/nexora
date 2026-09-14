/**
 * SmsConsentPanel — the SMS opt-in block shown under the phone field on both public booking pages
 * and on the manage-booking page.
 *
 * Deliberately one component for all three surfaces: the disclosure is legal text submitted as
 * evidence for A2P 10DLC registration, so the three screens must never drift apart in wording.
 * Both checkboxes are unchecked on every render and are never pre-checked from stored state on the
 * booking pages — a pre-ticked consent box is not consent.
 */
import { Fragment, type ReactNode } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { SMS_CONSENT_MODE, type SmsConsentMode } from '../../../constants/smsConsent'
import en from '../../../locales/en.json'
import vi from '../../../locales/vi.json'
import { resolveTranslation } from '../../../utils/translate'

/** Bold the salon name inside muted consent copy without injecting HTML from the locale. */
function highlightBusinessName(copy: string, businessName?: string): ReactNode {
  const name = businessName?.trim()
  if (!name) return copy

  const parts = copy.split(name)
  if (parts.length === 1) return copy

  return parts.map((part, index) => (
    <Fragment key={`${name}-${index}`}>
      {part}
      {index < parts.length - 1 ? (
        <strong className="font-bold text-nexoraText">{name}</strong>
      ) : null}
    </Fragment>
  ))
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
  /** End business shown as the direct sender in public consent evidence. */
  businessName?: string
}

export default function SmsConsentPanel({
  transactional,
  marketing,
  onChange,
  mode = SMS_CONSENT_MODE.grantOnly,
  disabled = false,
  lang,
  businessName,
}: SmsConsentPanelProps) {
  const { t: translate } = useTranslation()

  // Both paths read the same locale entries, so the legal wording can never diverge between the
  // two booking pages — which is the reason this panel is a single shared component.
  const forcedLocale = lang ? (lang === 'vi' ? vi : en) : null
  const t = (key: string, variables: Record<string, string | number> = {}) =>
    forcedLocale ? resolveTranslation(forcedLocale, key, variables) : translate(key, variables)
  const senderVariables = { businessName: businessName?.trim() ?? '' }

  const options = [
    {
      id: 'sms-consent-transactional',
      checked: transactional,
      title: t('public.smsConsent.transactionalTitle'),
      badge: t('public.smsConsent.transactionalBadge'),
      badgeClass: 'bg-emerald-50 text-emerald-700',
      copy: businessName?.trim()
        ? t('public.smsConsent.transactionalBusinessCopy', senderVariables)
        : t('public.smsConsent.transactionalCopy'),
      toggle: () => onChange({ transactional: !transactional, marketing }),
    },
    {
      id: 'sms-consent-marketing',
      checked: marketing,
      title: t('public.smsConsent.marketingTitle'),
      badge: t('public.smsConsent.marketingBadge'),
      badgeClass: 'bg-amber-50 text-amber-700',
      copy: businessName?.trim()
        ? t('public.smsConsent.marketingBusinessCopy', senderVariables)
        : t('public.smsConsent.marketingCopy'),
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
              <span className="mt-1 block text-[11px] leading-relaxed text-nexoraMuted">
                {highlightBusinessName(option.copy, businessName)}
              </span>
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
