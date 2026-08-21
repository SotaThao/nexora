export const QR_CODES_TK = 'components.dashboard.views.BookingHubView.qrCodes'

/** postMessage type from QR preview/kiosk iframe → host toast. */
export const QR_PREVIEW_TOAST_MESSAGE = 'nexora-qr-toast' as const

/** Allowed tags for guide / consent / tip copy (matches HTML rich text). */
export const QR_RICH_TEXT_TAGS = ['strong', 'br', 'span'] as const
export const QR_RICH_TEXT_ATTR = ['class'] as const

/**
 * Same stack as `index.html` / Tailwind `font-sans` — guest preview iframes
 * must load this themselves (srcdoc does not inherit the host stylesheet).
 */
export const QR_APP_FONT_FAMILY = 'Inter, sans-serif'
export const QR_APP_FONT_STYLESHEET =
  'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'

export const QR_BUSINESS_SLUG = 'btcnailbar'
export const QR_LINK_HOST = 'nexora.ai'
export const QR_BUSINESS_DISPLAY_NAME = 'Bitcoin Nail Bar'
export const QR_BUSINESS_PHONE = '832-786-5576'

export enum QrLeadStatus {
  SmsSent = 'sms_sent',
  CodeUsed = 'code_used',
}

export const QR_LEAD_STATUS_CLASS: Record<QrLeadStatus, string> = {
  [QrLeadStatus.SmsSent]: 'call-answered',
  [QrLeadStatus.CodeUsed]: 'call-booked',
}

export const QR_LEAD_STATUS_I18N_KEY: Record<QrLeadStatus, string> = {
  [QrLeadStatus.SmsSent]: 'statusSmsSent',
  [QrLeadStatus.CodeUsed]: 'statusCodeUsed',
}

export type QrPromoMock = {
  id: string
  labelVi: string
  labelEn: string
  codePrefix: string
}

export type QrLeadMock = {
  id: string
  timeVi: string
  timeEn: string
  name: string
  phone: string
  code: string
  status: QrLeadStatus
  /** Clock time only, e.g. "3:20 PM" — formatted via i18n when shown. */
  usedAt?: string
}

/** Mock promos — matches HTML `QR_PROMOS`. */
export const QR_PROMOS_MOCK: QrPromoMock[] = [
  {
    id: 'promo20',
    labelVi: '💅 Giảm 20% toàn bộ dịch vụ',
    labelEn: '💅 20% Off All Services',
    codePrefix: 'NAIL20',
  },
  {
    id: 'freeart',
    labelVi: '🎨 Free nail art khi làm full set',
    labelEn: '🎨 Free Nail Art with Full Set',
    codePrefix: 'FREEART',
  },
  {
    id: 'combo25',
    labelVi: '✨ Combo mani + pedi giảm 25%',
    labelEn: '✨ Mani + Pedi Combo — 25% Off',
    codePrefix: 'COMBO25',
  },
  {
    id: 'refer10',
    labelVi: '👯 Giới thiệu bạn — cả 2 giảm $10',
    labelEn: '👯 Refer a Friend — $10 Off for Both',
    codePrefix: 'REF10',
  },
  {
    id: 'gel15',
    labelVi: '💎 Gel-X giảm 15% lần đầu',
    labelEn: '💎 15% Off Gel-X First Visit',
    codePrefix: 'GELX15',
  },
]

/** Mock leads — matches HTML `QR_LEADS` (bilingual time labels). */
export const QR_LEADS_MOCK: QrLeadMock[] = [
  {
    id: 'lead-1',
    timeVi: 'Hôm nay 3:20 Chiều',
    timeEn: 'Today 3:20 PM',
    name: 'Hằng Phạm',
    phone: '(281) 774-3358',
    code: 'NAIL20-8Q2F',
    status: QrLeadStatus.CodeUsed,
  },
  {
    id: 'lead-2',
    timeVi: 'Hôm nay 12:41 Chiều',
    timeEn: 'Today 12:41 PM',
    name: 'Kelly Trương',
    phone: '(832) 615-0442',
    code: 'NAIL20-3XKD',
    status: QrLeadStatus.SmsSent,
  },
  {
    id: 'lead-3',
    timeVi: 'Hôm qua 5:05 Chiều',
    timeEn: 'Yesterday 5:05 PM',
    name: 'Sarah Johnson',
    phone: '(713) 225-7809',
    code: 'NAIL20-9BM1',
    status: QrLeadStatus.CodeUsed,
  },
  {
    id: 'lead-4',
    timeVi: 'Hôm qua 1:30 Chiều',
    timeEn: 'Yesterday 1:30 PM',
    name: 'Vy Lâm',
    phone: '(346) 887-2210',
    code: 'NAIL20-Kk7P',
    status: QrLeadStatus.SmsSent,
  },
]

export const QR_FORM_DEFAULT_SLUG = 'qr-thang7'
export const QR_FORM_DEFAULT_PROMO_ID = QR_PROMOS_MOCK[0].id

export function getQrPromoLabel(promo: QrPromoMock, language: string): string {
  return language === 'en' ? promo.labelEn : promo.labelVi
}

export function getQrLeadTime(lead: QrLeadMock, language: string): string {
  return language === 'en' ? lead.timeEn : lead.timeVi
}

export function buildQrPublicPath(slug: string): string {
  const safe = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || 'qr'
  return `${QR_LINK_HOST}/${QR_BUSINESS_SLUG}/qr/${safe}`
}

export function buildQrAbsoluteUrl(slug: string): string {
  return `https://${buildQrPublicPath(slug)}`
}
