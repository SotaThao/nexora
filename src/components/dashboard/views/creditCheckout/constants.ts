import { SMS_CAMPAIGN_TK } from '../smsCampaigns/constants'
import {
  formatSmsCreditPrice,
  getSmsCreditNumberLocale,
  SMS_CREDIT_PACKAGE_SELECTED_MARK,
} from '../smsCampaigns/constants'
import { SubscriptionPackageType } from '../../../../data/repositories/subscriptionPayments'

/** Shared i18n root for AI Hub → Plans → Credits (Voice minutes top-up). */
export const BOOKING_PLANS_CREDITS_TK =
  'components.dashboard.views.BookingHubView.plans.credits' as const

/** Card method label lives under SMS campaigns; both top-up modals reuse it. */
export const CREDIT_TOP_UP_CARD_COPY_TK = SMS_CAMPAIGN_TK

export const CREDIT_PACKAGE_SELECTED_MARK = SMS_CREDIT_PACKAGE_SELECTED_MARK

export const formatCreditPrice = formatSmsCreditPrice
export const getCreditNumberLocale = getSmsCreditNumberLocale

/** Keys under `copyTk` that differ between SMS vs Voice top-up modals. */
export type CreditTopUpCopyKeys = {
  title: string
  subtitle: string
  closeAria: string
  choosePackage: string
  packageUnits: string
  invoicePackage: string
}

export type CreditTopUpSuccessUnitsParam = 'credits' | 'minutes'

export type CreditTopUpModalConfig = {
  packageType: SubscriptionPackageType
  copyTk: string
  /** i18n namespace for `cardMethodLabel` (Stripe / card row). */
  cardCopyTk: string
  copyKeys: CreditTopUpCopyKeys
  successUnitsParam: CreditTopUpSuccessUnitsParam
  /** Prefixed onto dialog title / description element ids. */
  domIdPrefix: string
  /** Optional `data-*` on the overlay (e.g. voice modal marker). */
  overlayDataAttr?: string
  /** Invoice package line shows `{name} · {units}` when true. */
  invoiceShowsPackageName: boolean
}

export const SMS_CREDIT_TOP_UP_CONFIG: CreditTopUpModalConfig = {
  packageType: SubscriptionPackageType.VoiceSms,
  copyTk: SMS_CAMPAIGN_TK,
  cardCopyTk: CREDIT_TOP_UP_CARD_COPY_TK,
  copyKeys: {
    title: 'buyModalTitle',
    subtitle: 'buyModalSubtitle',
    closeAria: 'closeBuyModal',
    choosePackage: 'choosePackage',
    packageUnits: 'packageCredits',
    invoicePackage: 'invoicePackage',
  },
  successUnitsParam: 'credits',
  domIdPrefix: 'sms-credit',
  invoiceShowsPackageName: false,
}

export const VOICE_CREDIT_TOP_UP_CONFIG: CreditTopUpModalConfig = {
  packageType: SubscriptionPackageType.VoiceCallMinutes,
  copyTk: BOOKING_PLANS_CREDITS_TK,
  cardCopyTk: CREDIT_TOP_UP_CARD_COPY_TK,
  copyKeys: {
    title: 'buyVoiceModalTitle',
    subtitle: 'buyVoiceModalSubtitle',
    closeAria: 'closeBuyVoiceModal',
    choosePackage: 'chooseVoicePackage',
    packageUnits: 'packageMinutes',
    invoicePackage: 'invoiceVoicePackage',
  },
  successUnitsParam: 'minutes',
  domIdPrefix: 'voice-credit',
  overlayDataAttr: 'data-voice-credit-modal',
  invoiceShowsPackageName: true,
}
