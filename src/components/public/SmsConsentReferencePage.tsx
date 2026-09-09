import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SMS_CONSENT_DISCLOSURE_VERSION } from '../../constants/smsConsent'
import { useTranslation } from '../../contexts/LanguageContext'
import { usePublicSmsConsentBusiness } from '../../data/hooks/usePublicSmsConsentBusiness'
import smsConsentLocalRepository from '../../data/repositories/smsConsentLocal'
import SmsConsentPanel from './booking/SmsConsentPanel'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../CountryCodeSelect'

const HOME_REDIRECT_SECONDS = 10

export default function SmsConsentReferencePage() {
  const { businessSlug } = useParams<{ businessSlug?: string }>()
  const navigate = useNavigate()
  const isBusinessPage = Boolean(businessSlug)
  const businessQuery = usePublicSmsConsentBusiness(businessSlug)
  const { t, currentLanguage } = useTranslation()

  const [dialCode, setDialCode] = useState<string>(PhoneDialCode.US)
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState({ transactional: false, marketing: false })
  const [submitted, setSubmitted] = useState(false)
  const [phoneError, setPhoneError] = useState(false)
  const [redirectSeconds, setRedirectSeconds] = useState<number | null>(null)

  useEffect(() => {
    if (!businessSlug) return

    setSubmitted(false)
    setRedirectSeconds(null)
    const saved = smsConsentLocalRepository.load(businessSlug)
    if (!saved) {
      setDialCode(PhoneDialCode.US)
      setPhone('')
      setConsent({ transactional: false, marketing: false })
      return
    }

    const parsedPhone = parsePhone(saved.phoneE164)
    setDialCode(parsedPhone.countryCode)
    setPhone(formatNationalNumber(parsedPhone.nationalNumber, parsedPhone.countryCode))
    setConsent({ transactional: saved.transactional, marketing: saved.marketing })
  }, [businessSlug])

  useEffect(() => {
    if (redirectSeconds === null) return
    if (redirectSeconds === 0) {
      navigate('/', { replace: true })
      return
    }

    const timer = window.setTimeout(() => {
      setRedirectSeconds((current) => current === null ? null : current - 1)
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [navigate, redirectSeconds])

  if (isBusinessPage && businessQuery.isPending) {
    return <StatusPage title={t('public.smsConsent.loading')} />
  }

  if (isBusinessPage && (businessQuery.isError || !businessQuery.data)) {
    return (
      <StatusPage
        title={t('public.smsConsent.unavailableTitle')}
        description={t('public.smsConsent.unavailableCopy')}
      />
    )
  }

  const business = businessQuery.data
  const businessName = business?.businessName ?? 'NEXORA TOUCH'

  const handlePhoneChange = (value: string) => {
    setPhone(formatNationalNumber(value, dialCode))
    setPhoneError(false)
    setSubmitted(false)
    setRedirectSeconds(null)
  }

  const handleDialCodeChange = (value: string) => {
    setDialCode(value)
    setPhone(formatNationalNumber(phone, value))
    setPhoneError(false)
    setSubmitted(false)
    setRedirectSeconds(null)
  }

  const handleConsentChange = (nextConsent: { transactional: boolean; marketing: boolean }) => {
    setConsent(nextConsent)
    setSubmitted(false)
    setRedirectSeconds(null)
  }

  const handleSubmit = () => {
    if (!businessSlug) {
      setSubmitted(true)
      return
    }

    if (!isValidPhoneE164(phone, dialCode)) {
      setPhoneError(true)
      setSubmitted(false)
      return
    }

    smsConsentLocalRepository.save({
      schemaVersion: 1,
      businessSlug,
      phoneE164: normalizePhoneE164(phone, dialCode),
      transactional: consent.transactional,
      marketing: consent.marketing,
      disclosureVersion: SMS_CONSENT_DISCLOSURE_VERSION,
      savedAt: new Date().toISOString(),
    })
    setPhoneError(false)
    setSubmitted(true)
    setRedirectSeconds(HOME_REDIRECT_SECONDS)
  }

  return (
    <div className="min-h-dvh bg-[#f4eef3]">
      {isBusinessPage && submitted && redirectSeconds !== null && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-x-4 top-4 z-[99999] mx-auto max-w-md rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-center shadow-xl"
        >
          <p className="text-sm font-bold text-emerald-800">
            {t('public.smsConsent.saveLocalSuccess', { businessName })}
          </p>
          <p className="mt-1 text-xs font-semibold text-emerald-700">
            {t('public.smsConsent.redirectCountdown', { seconds: redirectSeconds })}
          </p>
        </div>
      )}

      <header className="flex items-center justify-between gap-5 bg-gradient-to-r from-[#4b203b] via-[#8d3868] to-[#b7648d] px-5 py-4 text-white sm:px-10">
        <div className="flex items-center gap-3">
          {business?.logoUrl ? (
            <img
              src={business.logoUrl}
              alt={t('public.smsConsent.logoAlt', { businessName })}
              width={36}
              height={36}
              className="h-9 w-9 shrink-0 rounded-xl bg-white object-cover"
            />
          ) : (
            <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff3d9] font-black text-[#4a2039]">
              {businessName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-[13px] font-bold tracking-wide">{businessName}</h1>
            <span className="block text-xs text-[#f2dce8]">
              {isBusinessPage ? t('public.smsConsent.poweredBy') : 'AI Voice + SMS for nail salons'}
            </span>
          </div>
        </div>
        {!isBusinessPage && (
          <div className="hidden rounded-full border border-white/35 px-3 py-1.5 text-xs sm:block">
            Customer-facing reference · SMS consent v1.0
          </div>
        )}
      </header>

      <main className="mx-auto mt-8 w-[min(680px,calc(100%-32px))] pb-10 sm:pb-14">
        <section className="overflow-hidden rounded-3xl border border-[#7a4b69]/15 bg-[#fffdfd] shadow-[0_24px_70px_rgba(76,36,64,.14)]">
          <div className="border-b border-[#e8dfe9] px-6 py-6 sm:px-8">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#9f3e71]">
              {isBusinessPage ? t('public.smsConsent.pageTitle') : 'Customer-facing reference'}
            </p>
            <h2 className="text-2xl font-bold leading-tight text-[#241c28] sm:whitespace-nowrap sm:text-[26px]">
              {isBusinessPage ? t('public.smsConsent.manageTitle') : 'Complete your booking'}
            </h2>
            <p className="mt-3 text-[#6d6372]">
              {isBusinessPage
                ? t('public.smsConsent.pageIntro', { businessName })
                : 'This is the consent block shown to customers on both booking pages, immediately below the phone number and before the Continue button.'}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="mb-5">
              <label htmlFor="sms-consent-reference-phone" className="mb-2 block font-bold text-[#241c28]">
                {t('public.smsConsent.phoneLabel')}
              </label>
              <div className="flex h-12 w-full items-stretch rounded-xl border border-[#cfc3cc] bg-white focus-within:border-[#9f3e71] focus-within:ring-4 focus-within:ring-[#9f3e71]/15">
                <CountryCodeSelect value={dialCode} onChange={handleDialCodeChange} embedded />
                <input
                  id="sms-consent-reference-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel-national"
                  value={phone}
                  onChange={(event) => handlePhoneChange(event.target.value)}
                  placeholder={getNationalPhonePlaceholder(dialCode)}
                  aria-invalid={phoneError}
                  aria-describedby={phoneError ? 'sms-consent-phone-error' : undefined}
                  className="h-full min-w-0 flex-1 rounded-r-xl bg-white px-3.5 py-2.5 text-[#241c28] outline-none autofill:bg-white"
                />
              </div>
              {phoneError ? (
                <p id="sms-consent-phone-error" role="alert" className="mt-1.5 text-sm font-medium text-red-600">
                  {t('public.smsConsent.phoneInvalid')}
                </p>
              ) : (
                <p className="mt-1.5 text-sm text-[#6d6372]">
                  {isBusinessPage
                    ? t('public.smsConsent.phoneHelp', { businessName })
                    : 'Used by the salon to manage this appointment.'}
                </p>
              )}
            </div>

            <SmsConsentPanel
              transactional={consent.transactional}
              marketing={consent.marketing}
              onChange={handleConsentChange}
              lang={currentLanguage}
              businessName={isBusinessPage ? businessName : undefined}
            />

            <button
              type="button"
              onClick={handleSubmit}
              className="mt-5 min-h-[50px] w-full rounded-xl bg-gradient-to-br from-[#772451] to-[#9f3e71] font-extrabold text-white shadow-[0_10px_25px_rgba(119,36,81,.22)] transition hover:brightness-105"
            >
              {isBusinessPage ? t('public.smsConsent.savePreferences') : 'Continue booking'}
            </button>
            {submitted && !isBusinessPage && (
              <p role="status" className="mt-3 text-center text-sm font-bold text-[#196b4a]">
                Demo only: booking can continue with either, both, or neither consent option selected.
              </p>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-[#786b79]">
          {isBusinessPage ? (
            <>
              {t('public.smsConsent.localStorageNotice')} · {t('public.smsConsent.poweredBy')}
            </>
          ) : (
            'Reference artifact for NEXORA TOUCH developers · This page does not submit data or create a booking.'
          )}
        </p>
      </main>
    </div>
  )
}

function StatusPage({ title, description }: { title: string; description?: string }) {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#f4eef3] px-4">
      <section className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-[0_24px_70px_rgba(76,36,64,.14)]">
        <h1 className="text-2xl font-bold text-[#241c28]">{title}</h1>
        {description && <p className="mt-3 text-[#6d6372]">{description}</p>}
      </section>
    </main>
  )
}
