import {
  SmsCampaignAudience,
  SmsCampaignScheduleMode,
  SmsCampaignStatus,
  SmsCreditPackageCode,
} from '../../../../data/merchantVoice/domain'

export const SMS_CAMPAIGN_TK = 'components.dashboard.views.BookingHubView.smsCampaigns'

export const SMS_CAMPAIGN_STATUS_CLASS: Record<SmsCampaignStatus, string> = {
  [SmsCampaignStatus.Draft]: 'is-scheduled',
  [SmsCampaignStatus.Scheduled]: 'is-scheduled',
  [SmsCampaignStatus.Sending]: 'is-scheduled',
  [SmsCampaignStatus.Sent]: 'is-sent',
  [SmsCampaignStatus.PartiallyFailed]: 'is-cancelled',
  [SmsCampaignStatus.Failed]: 'is-cancelled',
  [SmsCampaignStatus.Cancelled]: 'is-cancelled',
  [SmsCampaignStatus.Active]: 'is-active',
  [SmsCampaignStatus.Paused]: 'is-cancelled',
}

export const SMS_CAMPAIGN_STATUS_I18N_KEY: Record<SmsCampaignStatus, string> = {
  [SmsCampaignStatus.Draft]: 'statusDraft',
  [SmsCampaignStatus.Scheduled]: 'statusScheduled',
  [SmsCampaignStatus.Sending]: 'statusSending',
  [SmsCampaignStatus.Sent]: 'statusSent',
  [SmsCampaignStatus.PartiallyFailed]: 'statusPartiallyFailed',
  [SmsCampaignStatus.Failed]: 'statusFailed',
  [SmsCampaignStatus.Cancelled]: 'statusCancelled',
  [SmsCampaignStatus.Active]: 'statusActive',
  [SmsCampaignStatus.Paused]: 'statusPaused',
}

export const SMS_CAMPAIGN_MODE_I18N_KEY: Record<SmsCampaignScheduleMode, string> = {
  [SmsCampaignScheduleMode.SendNow]: 'modeNow',
  [SmsCampaignScheduleMode.Scheduled]: 'modeScheduled',
  [SmsCampaignScheduleMode.Auto]: 'modeAutomated',
}

export const SMS_CAMPAIGN_AUDIENCE_I18N_KEY: Record<SmsCampaignAudience, string> = {
  [SmsCampaignAudience.New]: 'segmentNew',
  [SmsCampaignAudience.Days15]: 'segmentDay15',
  [SmsCampaignAudience.Days30]: 'segmentDay30',
  [SmsCampaignAudience.Days60]: 'segmentDay60',
  [SmsCampaignAudience.Vip]: 'segmentVip',
  [SmsCampaignAudience.Birthday]: 'segmentBirthday',
}

export const SMS_CAMPAIGN_AUDIENCE_SHORT_I18N_KEY: Record<SmsCampaignAudience, string> = {
  [SmsCampaignAudience.New]: 'segmentNewShort',
  [SmsCampaignAudience.Days15]: 'segmentDay15Short',
  [SmsCampaignAudience.Days30]: 'segmentDay30Short',
  [SmsCampaignAudience.Days60]: 'segmentDay60Short',
  [SmsCampaignAudience.Vip]: 'segmentVipShort',
  [SmsCampaignAudience.Birthday]: 'segmentBirthdayShort',
}

export type SmsCampaignSegmentAccent = 'cyan' | 'green' | 'purple' | 'orange' | 'pink' | 'birthday'

export interface SmsCampaignSegmentCard {
  id: SmsCampaignAudience
  accent: SmsCampaignSegmentAccent
  nameKey: string
  shortNameKey: string
  descKey: string
  countLabelKey: string
  badgeKey: string
}

export const SMS_CAMPAIGN_SEGMENT_CARDS: SmsCampaignSegmentCard[] = [
  {
    id: SmsCampaignAudience.New,
    accent: 'cyan',
    nameKey: 'segmentNew',
    shortNameKey: 'segmentNewShort',
    descKey: 'segmentNewDesc',
    countLabelKey: 'countCustomers',
    badgeKey: 'badgeReady',
  },
  {
    id: SmsCampaignAudience.Days15,
    accent: 'green',
    nameKey: 'segmentDay15',
    shortNameKey: 'segmentDay15Short',
    descKey: 'segmentDay15Desc',
    countLabelKey: 'countCustomers',
    badgeKey: 'badgeReady',
  },
  {
    id: SmsCampaignAudience.Days30,
    accent: 'purple',
    nameKey: 'segmentDay30',
    shortNameKey: 'segmentDay30Short',
    descKey: 'segmentDay30Desc',
    countLabelKey: 'countCustomers',
    badgeKey: 'badgeScheduled',
  },
  {
    id: SmsCampaignAudience.Days60,
    accent: 'orange',
    nameKey: 'segmentDay60',
    shortNameKey: 'segmentDay60Short',
    descKey: 'segmentDay60Desc',
    countLabelKey: 'countCustomers',
    badgeKey: 'badgeReady',
  },
  {
    id: SmsCampaignAudience.Vip,
    accent: 'pink',
    nameKey: 'segmentVip',
    shortNameKey: 'segmentVipShort',
    descKey: 'segmentVipDesc',
    countLabelKey: 'countCustomers',
    badgeKey: 'badgeSent',
  },
  {
    id: SmsCampaignAudience.Birthday,
    accent: 'birthday',
    nameKey: 'segmentBirthday',
    shortNameKey: 'segmentBirthdayShort',
    descKey: 'segmentBirthdayDesc',
    countLabelKey: 'countBirthdayMonth',
    badgeKey: 'badgeAuto',
  },
]

export function getAudienceCount(
  summary: {
    new: number
    days15: number
    days30: number
    days60: number
    vip: number
    birthdayThisMonth: number
  } | undefined,
  audience: SmsCampaignAudience,
): number {
  if (!summary) return 0
  if (audience === SmsCampaignAudience.New) return summary.new
  if (audience === SmsCampaignAudience.Days15) return summary.days15
  if (audience === SmsCampaignAudience.Days30) return summary.days30
  if (audience === SmsCampaignAudience.Days60) return summary.days60
  if (audience === SmsCampaignAudience.Vip) return summary.vip
  return summary.birthdayThisMonth
}

/** Fallback local USD/segment estimate when API estimate is not ready yet. */
export const SMS_PRICE_PER_SMS = 0.025

export enum SmsComposerScheduleMode {
  Now = 'now',
  Schedule = 'schedule',
  Auto = 'auto',
}

export const SMS_COMPOSER_MODE_TO_API: Record<SmsComposerScheduleMode, SmsCampaignScheduleMode> = {
  [SmsComposerScheduleMode.Now]: SmsCampaignScheduleMode.SendNow,
  [SmsComposerScheduleMode.Schedule]: SmsCampaignScheduleMode.Scheduled,
  [SmsComposerScheduleMode.Auto]: SmsCampaignScheduleMode.Auto,
}

export const SMS_API_MODE_TO_COMPOSER: Record<SmsCampaignScheduleMode, SmsComposerScheduleMode> = {
  [SmsCampaignScheduleMode.SendNow]: SmsComposerScheduleMode.Now,
  [SmsCampaignScheduleMode.Scheduled]: SmsComposerScheduleMode.Schedule,
  [SmsCampaignScheduleMode.Auto]: SmsComposerScheduleMode.Auto,
}

/** @deprecated Prefer SmsCreditPackageCode */
export enum SmsCreditPackageId {
  Starter = SmsCreditPackageCode.Sms500,
  Growth = SmsCreditPackageCode.Sms1500,
  Business = SmsCreditPackageCode.Sms3000,
  Scale = SmsCreditPackageCode.Sms6000,
}

export enum SmsCreditPaymentId {
  Usdv = 'USDV',
  Usdt = 'USDT',
  Usd = 'USD',
  Btc = 'BTC',
  Vnd = 'VND',
}

export interface SmsCreditPackageMock {
  id: SmsCreditPackageCode
  credits: number
  price: number
  nameKey: string
  noteKey: string
  featured?: boolean
}

export interface SmsCreditPaymentMock {
  id: SmsCreditPaymentId
  label: string
  balance: string
  asset: string
}

export interface SmsCampaignTemplateMock {
  titleKey: string
  textKey: string
}

export const SMS_CREDIT_PACKAGES_MOCK: SmsCreditPackageMock[] = [
  {
    id: SmsCreditPackageCode.Sms500,
    credits: 500,
    price: 25,
    nameKey: 'pkgStarter',
    noteKey: 'pkgStarterNote',
  },
  {
    id: SmsCreditPackageCode.Sms1500,
    credits: 1500,
    price: 60,
    nameKey: 'pkgGrowth',
    noteKey: 'pkgGrowthNote',
  },
  {
    id: SmsCreditPackageCode.Sms3000,
    credits: 3000,
    price: 99,
    nameKey: 'pkgBusiness',
    noteKey: 'pkgBusinessNote',
  },
  {
    id: SmsCreditPackageCode.Sms6000,
    credits: 6000,
    price: 175,
    nameKey: 'pkgScale',
    noteKey: 'pkgScaleNote',
    featured: true,
  },
]

export const SMS_CREDIT_PAYMENTS_MOCK: SmsCreditPaymentMock[] = [
  { id: SmsCreditPaymentId.Usdv, label: 'USDV', balance: '—', asset: '/assets/sms-credits/usdv.png' },
  { id: SmsCreditPaymentId.Usdt, label: 'USDT', balance: '—', asset: '/assets/sms-credits/usdt.png' },
  { id: SmsCreditPaymentId.Usd, label: 'USD', balance: '—', asset: '/assets/sms-credits/usd.png' },
  { id: SmsCreditPaymentId.Btc, label: 'BTC', balance: '—', asset: '/assets/sms-credits/btc.png' },
  { id: SmsCreditPaymentId.Vnd, label: 'VND', balance: '—', asset: '/assets/sms-credits/vnd.png' },
]

export const SMS_COMPOSER_TAG_SAMPLES = {
  '{TenKhach}': 'Linh',
  '{TenTiem}': 'Bitcoin Nail Bar',
  '{Link}': 'nexora.ai/b/x7k2',
  '{SoDT}': '832-786-5576',
} as const

export const SMS_COMPOSER_TAGS = [
  { tag: '{TenKhach}', labelKey: 'tagCustomerName' },
  { tag: '{TenTiem}', labelKey: 'tagShopName' },
  { tag: '{Link}', labelKey: 'tagOfferLink' },
  { tag: '{SoDT}', labelKey: 'tagPhone' },
] as const

export const SMS_LANDING_PAGE_OPTIONS = [
  { value: '', labelKey: 'lpNone' },
  { value: 'comeback', labelKey: 'lpComeback' },
  { value: 'birthday', labelKey: 'lpBirthday' },
] as const

export const SMS_CAMPAIGN_TEMPLATES: Record<SmsCampaignAudience, SmsCampaignTemplateMock[]> = {
  [SmsCampaignAudience.New]: [
    { titleKey: 'tplNew1Title', textKey: 'tplNew1Text' },
    { titleKey: 'tplNew2Title', textKey: 'tplNew2Text' },
  ],
  [SmsCampaignAudience.Days15]: [
    { titleKey: 'tplDay15_1Title', textKey: 'tplDay15_1Text' },
    { titleKey: 'tplDay15_2Title', textKey: 'tplDay15_2Text' },
  ],
  [SmsCampaignAudience.Days30]: [
    { titleKey: 'tplDay30_1Title', textKey: 'tplDay30_1Text' },
    { titleKey: 'tplDay30_2Title', textKey: 'tplDay30_2Text' },
  ],
  [SmsCampaignAudience.Days60]: [
    { titleKey: 'tplDay60_1Title', textKey: 'tplDay60_1Text' },
    { titleKey: 'tplDay60_2Title', textKey: 'tplDay60_2Text' },
  ],
  [SmsCampaignAudience.Vip]: [
    { titleKey: 'tplVip1Title', textKey: 'tplVip1Text' },
    { titleKey: 'tplVip2Title', textKey: 'tplVip2Text' },
  ],
  [SmsCampaignAudience.Birthday]: [
    { titleKey: 'tplBirthday1Title', textKey: 'tplBirthday1Text' },
    { titleKey: 'tplBirthday2Title', textKey: 'tplBirthday2Text' },
  ],
}
