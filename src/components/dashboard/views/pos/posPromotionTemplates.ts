/**
 * Starter templates for the Promotions studio — illustrative only; choosing one opens the
 * create form pre-filled and does not publish. Day names match PosPromotionApiDto (full English).
 * Prefer GET /merchant/pos/promotion-templates via `templateFromApi`; keep this list as offline fallback.
 */
import { PosServiceDiscountType } from '../../../../constants/posDiscount'
import type { PosPromotionTemplateApiDto } from '../../../../types/repositories'
import { formatPromotionArtSaving, type PosWeekDay } from './posPromotionDisplay'

export type PromoArtTheme =
  | 'purple'
  | 'gold'
  | 'rose'
  | 'ocean'
  | 'teal'
  | 'sage'
  | 'peach'
  | 'slate'

export type PosPromotionDraft = {
  name: string
  badgeLabel: string
  description: string
  discountType: PosServiceDiscountType
  discountValue: number
  daysOfWeek: PosWeekDay[]
  /** 'HH:mm' for the time input. */
  startTime: string
  endTime: string
  theme: PromoArtTheme
  /** API template code when started from a studio template. */
  templateCode?: string | null
}

type Localized = { en: string; vi: string }

export type PosPromotionTemplate = {
  id: string
  symbol: string
  theme: PromoArtTheme
  purpose: Localized
  offer: Localized
  hint: Localized
  draft: Omit<PosPromotionDraft, 'theme'> & { theme?: PromoArtTheme }
}

const ALL_DAYS: PosWeekDay[] = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
]

export const POS_PROMOTION_TEMPLATES: readonly PosPromotionTemplate[] = [
  {
    id: 'upgrade',
    symbol: '✨',
    theme: 'purple',
    purpose: { en: 'Sell more services', vi: 'Bán thêm dịch vụ' },
    offer: { en: '20% off add-ons', vi: 'Giảm 20% phần add-on' },
    hint: { en: 'Choose the add-ons and discount.', vi: 'Sửa dịch vụ bổ sung và mức giảm.' },
    draft: {
      name: 'Add-On Upgrade · Sample',
      badgeLabel: 'UPGRADE',
      description:
        '20% off nail art or a foot massage with a main service. Applies to the add-on only, not the whole ticket. Confirm eligible services before use.',
      discountType: PosServiceDiscountType.Percent,
      discountValue: 20,
      daysOfWeek: [...ALL_DAYS],
      startTime: '00:00',
      endTime: '23:59',
    },
  },
  {
    id: 'weekday',
    symbol: '☀︎',
    theme: 'gold',
    purpose: { en: 'Fill quiet hours', vi: 'Lấp giờ vắng' },
    offer: { en: '15% off · Tue–Thu', vi: 'Giảm 15% · Thứ 3–5' },
    hint: { en: 'Adjust days, hours and services.', vi: 'Sửa ngày, khung giờ và dịch vụ.' },
    draft: {
      name: 'Weekday Glow · Sample',
      badgeLabel: 'HAPPY HOURS',
      description:
        '15% off Classic Pedicure, Tuesday–Thursday, 10 AM–2 PM. Excludes tips and tax; cannot be combined with other offers. Review these sample terms before use.',
      discountType: PosServiceDiscountType.Percent,
      discountValue: 15,
      daysOfWeek: ['Tuesday', 'Wednesday', 'Thursday'],
      startTime: '10:00',
      endTime: '14:00',
    },
  },
  {
    id: 'rebook',
    symbol: '📅',
    theme: 'rose',
    purpose: { en: 'Bring customers back', vi: 'Khách quay lại' },
    offer: { en: '$5 off the next visit', vi: 'Giảm $5 lần ghé sau' },
    hint: { en: 'Set the rebooking conditions.', vi: 'Sửa điều kiện đặt lại lịch.' },
    draft: {
      name: 'Rebook & Save · Sample',
      badgeLabel: 'REBOOK',
      description:
        'Save $5 on the next visit when the customer books before leaving. Confirm a qualifying appointment before applying this offer.',
      discountType: PosServiceDiscountType.Amount,
      discountValue: 5,
      daysOfWeek: [...ALL_DAYS],
      startTime: '00:00',
      endTime: '23:59',
    },
  },
  {
    id: 'welcome',
    symbol: '🎉',
    theme: 'ocean',
    purpose: { en: 'Welcome new guests', vi: 'Đón khách mới' },
    offer: { en: '10% off the first visit', vi: 'Giảm 10% lần đầu' },
    hint: { en: 'Choose services and first-visit terms.', vi: 'Sửa dịch vụ và điều kiện khách mới.' },
    draft: {
      name: 'New Guest Offer · Sample',
      badgeLabel: 'FIRST VISIT',
      description:
        '10% off Classic Pedicure on the first visit. Cannot be combined; excludes tax and tips. Verify first-visit eligibility and adjust services and terms before use.',
      discountType: PosServiceDiscountType.Percent,
      discountValue: 10,
      daysOfWeek: [...ALL_DAYS],
      startTime: '00:00',
      endTime: '23:59',
    },
  },
  {
    id: 'food',
    symbol: '🍝',
    theme: 'peach',
    purpose: { en: 'Lunch offers', vi: 'Ưu đãi bữa trưa' },
    offer: { en: '$3 off a lunch combo', vi: 'Giảm $3 combo trưa' },
    hint: { en: 'Adjust the combo and available hours.', vi: 'Sửa combo và thời gian áp dụng.' },
    draft: {
      name: 'Lunch Combo · Sample',
      badgeLabel: 'LUNCH',
      description:
        'Save $3 on a main dish and drink combo, Monday–Friday, 11 AM–2 PM. Cannot be combined; excludes delivery fees. Choose the eligible combo before use.',
      discountType: PosServiceDiscountType.Amount,
      discountValue: 3,
      daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '11:00',
      endTime: '14:00',
    },
  },
  {
    id: 'retail',
    symbol: '🛍️',
    theme: 'sage',
    purpose: { en: 'Promote products', vi: 'Khuyến mãi sản phẩm' },
    offer: { en: '15% off a gift set', vi: 'Giảm 15% bộ quà tặng' },
    hint: { en: 'Choose products and purchase terms.', vi: 'Sửa sản phẩm và điều kiện mua.' },
    draft: {
      name: 'Gift Set Offer · Sample',
      badgeLabel: 'GIFT SET',
      description:
        '15% off selected gift sets. Does not apply storewide; cannot be combined and excludes tax. Confirm eligible products and availability before use.',
      discountType: PosServiceDiscountType.Percent,
      discountValue: 15,
      daysOfWeek: [...ALL_DAYS],
      startTime: '00:00',
      endTime: '23:59',
    },
  },
]

const THEMES: PromoArtTheme[] = ['purple', 'gold', 'rose', 'ocean', 'teal', 'sage', 'peach', 'slate']
const TEMPLATE_SYMBOLS = ['✨', '☀︎', '📅', '🎉', '🍝', '🛍️', '💫', '🏷️'] as const

export function promoArtThemeForIndex(index: number): PromoArtTheme {
  return THEMES[index % THEMES.length]
}

function asWeekDays(days: string[]): PosWeekDay[] {
  const allowed = new Set<string>([
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ])
  return days.filter((day): day is PosWeekDay => allowed.has(day))
}

/** Map a studio-metadata template from the API into the card + draft shape the page already uses. */
export function templateFromApi(
  dto: PosPromotionTemplateApiDto,
  index: number,
): PosPromotionTemplate {
  const discountType =
    dto.discountType === PosServiceDiscountType.Amount
      ? PosServiceDiscountType.Amount
      : PosServiceDiscountType.Percent
  const offerText = formatPromotionArtSaving(discountType, dto.discountValue)
  const theme = promoArtThemeForIndex(index)

  return {
    id: dto.code || `api-template-${index}`,
    symbol: TEMPLATE_SYMBOLS[index % TEMPLATE_SYMBOLS.length],
    theme,
    purpose: { en: dto.name, vi: dto.name },
    offer: { en: offerText, vi: offerText },
    hint: {
      en: dto.description || 'Adjust the rate, days and hours before publishing.',
      vi: dto.description || 'Sửa mức giảm, ngày và khung giờ trước khi đăng.',
    },
    draft: {
      name: dto.name,
      badgeLabel: dto.badgeLabel,
      description: dto.description,
      discountType,
      discountValue: dto.discountValue,
      daysOfWeek: asWeekDays(dto.daysOfWeek),
      startTime: dto.startTime.slice(0, 5) || '10:00',
      endTime: dto.endTime.slice(0, 5) || '14:00',
      theme,
      templateCode: dto.code,
    },
  }
}

export function localizeTemplateText(value: Localized, language: string): string {
  return language === 'vi' ? value.vi : value.en
}

/** Build a create-form draft from a template, localized for the current UI language. */
export function draftFromTemplate(template: PosPromotionTemplate, language: string): PosPromotionDraft {
  // API-sourced templates already carry copy + templateCode on the draft.
  if (template.draft.templateCode) {
    return {
      name: template.draft.name,
      badgeLabel: template.draft.badgeLabel,
      description: template.draft.description,
      discountType: template.draft.discountType,
      discountValue: template.draft.discountValue,
      daysOfWeek: [...template.draft.daysOfWeek],
      startTime: template.draft.startTime,
      endTime: template.draft.endTime,
      theme: template.theme,
      templateCode: template.draft.templateCode,
    }
  }

  const vi = language === 'vi'
  const byId: Record<string, { name: string; badge: string; description: string }> = {
    upgrade: {
      name: vi ? 'Add-On Upgrade · Mẫu hướng dẫn' : 'Add-On Upgrade · Sample',
      badge: 'UPGRADE',
      description: vi
        ? 'Giảm 20% giá phần nail art hoặc massage chân khi mua cùng dịch vụ chính. Không giảm giá toàn bộ hóa đơn; xác định dịch vụ áp dụng trước khi dùng.'
        : template.draft.description,
    },
    weekday: {
      name: vi ? 'Weekday Glow · Mẫu hướng dẫn' : 'Weekday Glow · Sample',
      badge: vi ? 'GIỜ VÀNG' : 'HAPPY HOURS',
      description: vi
        ? 'Giảm 15% cho Classic Pedicure từ thứ Ba đến thứ Năm, 10:00–14:00. Không áp dụng tip, thuế hoặc cộng dồn ưu đãi. Điều kiện mẫu cần kiểm tra lại trước khi dùng.'
        : template.draft.description,
    },
    rebook: {
      name: vi ? 'Rebook & Save · Mẫu hướng dẫn' : 'Rebook & Save · Sample',
      badge: vi ? 'ĐẶT LẠI LỊCH' : 'REBOOK',
      description: vi
        ? 'Giảm $5 cho lần ghé kế tiếp nếu đặt lịch trước khi rời tiệm. Xác minh lịch hẹn đủ điều kiện trước khi áp dụng.'
        : template.draft.description,
    },
    welcome: {
      name: vi ? 'Chào khách mới · Mẫu' : 'New Guest Offer · Sample',
      badge: vi ? 'LẦN ĐẦU' : 'FIRST VISIT',
      description: vi
        ? 'Giảm 10% cho Classic Pedicure ở lần sử dụng đầu tiên. Không cộng dồn; không gồm thuế và tip. Xác minh khách mới. Sửa dịch vụ và điều kiện trước khi dùng.'
        : template.draft.description,
    },
    food: {
      name: vi ? 'Combo bữa trưa · Mẫu' : 'Lunch Combo · Sample',
      badge: 'LUNCH',
      description: vi
        ? 'Giảm $3 khi mua combo món chính và đồ uống, thứ Hai–thứ Sáu 11:00–14:00. Không cộng dồn, không gồm phí giao hàng. Sửa combo áp dụng trước khi dùng.'
        : template.draft.description,
    },
    retail: {
      name: vi ? 'Bộ quà tặng · Mẫu' : 'Gift Set Offer · Sample',
      badge: 'GIFT SET',
      description: vi
        ? 'Giảm 15% bộ quà tặng được chọn. Không áp dụng toàn bộ cửa hàng; không cộng dồn, không gồm thuế. Xác định sản phẩm áp dụng và tồn kho trước khi dùng.'
        : template.draft.description,
    },
  }
  const localized = byId[template.id] ?? {
    name: template.draft.name,
    badge: template.draft.badgeLabel,
    description: template.draft.description,
  }

  return {
    name: localized.name,
    badgeLabel: localized.badge,
    description: localized.description,
    discountType: template.draft.discountType,
    discountValue: template.draft.discountValue,
    daysOfWeek: [...template.draft.daysOfWeek],
    startTime: template.draft.startTime,
    endTime: template.draft.endTime,
    theme: template.theme,
    templateCode: template.id,
  }
}
