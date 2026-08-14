/**
 * Static customer-facing reference page for the Twilio A2P 10DLC evidence URL (`/sms-consent`).
 *
 * Ports the "Customer-facing reference" card from `nexora-sms-opt-in-developer-handoff.html`
 * (PO handoff, SMS consent v1.0) into a real route so it can be given to a Twilio reviewer as a
 * public URL instead of a screenshot. Deliberately static: no submit, no API calls, no booking is
 * created. Reuses the real `SmsConsentPanel` (not a hand-copied version of the disclosure text) so
 * this reference page can never drift from the wording actually shown on the booking form — see
 * `docs/business/sms-consent/sms-consent-technical.md` §10.
 */
import { useState } from 'react'
import SmsConsentPanel from './booking/SmsConsentPanel'
import { formatNationalNumber, getNationalPhonePlaceholder, PhoneDialCode } from '../CountryCodeSelect'

export default function SmsConsentReferencePage() {
  const [phone, setPhone] = useState('')
  const [consent, setConsent] = useState({ transactional: false, marketing: false })
  const [submitted, setSubmitted] = useState(false)

  return (
    <div className="min-h-dvh bg-[#f4eef3]">
      <header className="flex items-center justify-between gap-5 bg-gradient-to-r from-[#4b203b] via-[#8d3868] to-[#b7648d] px-5 py-4 text-white sm:px-10">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#fff3d9] font-black text-[#4a2039]">
            N
          </div>
          <div>
            <strong className="block text-[13px] tracking-wide">NEXORA TOUCH</strong>
            <span className="block text-xs text-[#f2dce8]">AI Voice + SMS for nail salons</span>
          </div>
        </div>
        <div className="hidden rounded-full border border-white/35 px-3 py-1.5 text-xs sm:block">
          Customer-facing reference · SMS consent v1.0
        </div>
      </header>

      <main className="mx-auto my-8 w-[min(680px,calc(100%-32px))]">
        <section className="overflow-hidden rounded-3xl border border-[#7a4b69]/15 bg-[#fffdfd] shadow-[0_24px_70px_rgba(76,36,64,.14)]">
          <div className="border-b border-[#e8dfe9] px-6 py-6 sm:px-8">
            <p className="mb-2 text-xs font-extrabold uppercase tracking-widest text-[#9f3e71]">
              Customer-facing reference
            </p>
            <h1 className="text-2xl font-bold leading-tight text-[#241c28] sm:text-[32px]">
              Complete your booking
            </h1>
            <p className="mt-3 text-[#6d6372]">
              This is the consent block shown to customers on both booking pages, immediately below
              the phone number and before the Continue button.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8 sm:py-7">
            <div className="mb-5">
              <label htmlFor="sms-consent-reference-phone" className="mb-2 block font-bold text-[#241c28]">
                Mobile phone number
              </label>
              <input
                id="sms-consent-reference-phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(e) => setPhone(formatNationalNumber(e.target.value, PhoneDialCode.US))}
                placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}
                className="min-h-[48px] w-full rounded-xl border border-[#cfc3cc] px-3.5 py-2.5 text-[#241c28] outline-none focus:border-[#9f3e71] focus:ring-4 focus:ring-[#9f3e71]/15"
              />
              <p className="mt-1.5 text-sm text-[#6d6372]">Used by the salon to manage this appointment.</p>
            </div>

            <SmsConsentPanel transactional={consent.transactional} marketing={consent.marketing} onChange={setConsent} lang="en" />

            <button
              type="button"
              onClick={() => setSubmitted(true)}
              className="mt-5 min-h-[50px] w-full rounded-xl bg-gradient-to-br from-[#772451] to-[#9f3e71] font-extrabold text-white shadow-[0_10px_25px_rgba(119,36,81,.22)] transition hover:brightness-105"
            >
              Continue booking
            </button>
            {submitted && (
              <p role="status" className="mt-3 text-center text-sm font-bold text-[#196b4a]">
                Demo only: booking can continue with either, both, or neither consent option selected.
              </p>
            )}
          </div>
        </section>

        <p className="mt-5 text-center text-xs text-[#786b79]">
          Reference artifact for NEXORA TOUCH developers · This page does not submit data or create a booking.
        </p>
      </main>
    </div>
  )
}
