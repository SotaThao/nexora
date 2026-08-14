/**
 * SMS consent (A2P 10DLC / TCPA).
 *
 * DISCLOSURE_VERSION identifies which wording a customer actually agreed to and is stored on every
 * consent event. Changing any of the `smsConsent.*` strings in en.json / vi.json means bumping this
 * — the stored history must keep pointing at the text that was on screen at the time, so past
 * events are never rewritten to match new copy.
 */
export const SMS_CONSENT_DISCLOSURE_VERSION = 'nexora-sms-consent-v1.0'

export const SMS_CONSENT_MODE = {
  /** Booking form: ticking grants, leaving unticked changes nothing. */
  grantOnly: 'grant-only',
  /** Manage-booking page: unticking withdraws. */
  editable: 'editable',
} as const

export type SmsConsentMode = (typeof SMS_CONSENT_MODE)[keyof typeof SMS_CONSENT_MODE]
