import {
  SMS_CREDIT_PAYMENTS_MOCK,
  SmsCreditPaymentId,
  type SmsCreditPaymentMock,
} from '../smsCampaigns/constants'

/** Wire/mock ids for Voice minute top-up packages (HTML `VOICE_CREDIT_PACKAGES`). */
export enum VoiceCreditPackageId {
  Voice100 = 'voice-100',
  Voice300 = 'voice-300',
  Voice500 = 'voice-500',
  Voice1000 = 'voice-1000',
}

export interface VoiceCreditPackageMock {
  id: VoiceCreditPackageId
  minutes: number
  price: number
  nameKey: string
  noteKey: string
  featured?: boolean
}

export type VoiceCreditPaymentMock = SmsCreditPaymentMock
export { SmsCreditPaymentId as VoiceCreditPaymentId }

/** Same wallet payment options as SMS buy modal. */
export const VOICE_CREDIT_PAYMENTS_MOCK = SMS_CREDIT_PAYMENTS_MOCK

export const VOICE_CREDIT_PACKAGES_MOCK: VoiceCreditPackageMock[] = [
  {
    id: VoiceCreditPackageId.Voice100,
    minutes: 100,
    price: 19,
    nameKey: 'pkgVoiceMini',
    noteKey: 'pkgVoiceMiniNote',
  },
  {
    id: VoiceCreditPackageId.Voice300,
    minutes: 300,
    price: 49,
    nameKey: 'pkgVoiceStarter',
    noteKey: 'pkgVoiceStarterNote',
  },
  {
    id: VoiceCreditPackageId.Voice500,
    minutes: 500,
    price: 79,
    nameKey: 'pkgVoicePlus',
    noteKey: 'pkgVoicePlusNote',
  },
  {
    id: VoiceCreditPackageId.Voice1000,
    minutes: 1000,
    price: 149,
    nameKey: 'pkgVoicePro',
    noteKey: 'pkgVoiceProNote',
    featured: true,
  },
]

export const VOICE_CREDIT_DEFAULT_PACKAGE_ID = VoiceCreditPackageId.Voice1000
export const VOICE_CREDIT_DEFAULT_PAYMENT_ID = SmsCreditPaymentId.Usdv
