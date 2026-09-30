import type {
  PosSmsSendMode,
  PosSmsTemplateType,
  PosVisitLandingMode,
} from '../constants/posSmsSettings'
import type { PosOrderStatus } from '../constants/posOrderStatus'

export interface PosSmsTextAnalysisApiDto {
  encoding: string
  characterCount: number
  segmentCount: number
}

export interface PosSmsMessageSettingsApiDto {
  enabled: boolean
  sendMode: PosSmsSendMode
  body: string
  isDefaultBody: boolean
  textAnalysis: PosSmsTextAnalysisApiDto
}

export interface PosSmsPhoneApiDto {
  countryCode: string
  phone: string
}

export interface PosSmsSettingsApiDto {
  salonName: string
  welcome: PosSmsMessageSettingsApiDto
  afterCheckout: PosSmsMessageSettingsApiDto
  visitLinkTtlDays: number
  visitLinkTtlDayOptions: number[]
  aiHub: { active: boolean; smsCreditRemaining: number }
  estimateValues: Record<string, string>
  defaultTestPhone: PosSmsPhoneApiDto | null
}

export interface UpdatePosSmsMessageSettingsRequest {
  enabled: boolean
  sendMode: PosSmsSendMode
  body: string
}

export interface SendPosSmsTestRequest {
  type: PosSmsTemplateType
  body: string
  toPhone: string
  toPhoneCountryCode: string
}

export interface PosSmsTestResultApiDto {
  sent: boolean
  errorCode: string | null
  segments: number
}

export interface PosVisitApiDto {
  status: PosOrderStatus
  customerFirstName: string
  orderNumber: string
  services: string[]
  receiptUrl: string | null
  reviewUrl: string | null
  tipUrl: string | null
  feedbackUrl: string | null
  reviewFormPath: string | null
  tipFormPath: string | null
}

export interface PosVisitLandingApiDto {
  businessSlug: string
  businessName: string
  mode: PosVisitLandingMode
  visit: PosVisitApiDto | null
}
