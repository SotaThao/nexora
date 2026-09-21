/**
 * Banner display helpers for the promotions studio — prefer the list DTO's primaryBanner*
 * fields, then fall back to the legacy photoUrl.
 */
import type { PosPromotionApiDto } from '../../../../types/repositories'
import type { PromoArtTheme } from './posPromotionTemplates'

/** Theme id → hex sent as banners[0].colorHex on create/update. */
export const PROMO_THEME_COLOR_HEX: Record<PromoArtTheme, string> = {
  purple: '#4648D8',
  gold: '#84632E',
  rose: '#97546E',
  ocean: '#416791',
  teal: '#326F64',
  sage: '#4C6C43',
  peach: '#92512F',
  slate: '#536174',
}

const HEX_TO_THEME = Object.entries(PROMO_THEME_COLOR_HEX).reduce(
  (acc, [theme, hex]) => {
    acc[hex.toUpperCase()] = theme as PromoArtTheme
    return acc
  },
  {} as Record<string, PromoArtTheme>,
)

export function promotionBannerImageUrl(
  promotion: Pick<PosPromotionApiDto, 'primaryBannerImageUrl' | 'photoUrl'>,
): string | null {
  return promotion.primaryBannerImageUrl || promotion.photoUrl || null
}

export function promotionBannerColorHex(
  promotion: Pick<PosPromotionApiDto, 'primaryBannerColorHex'>,
): string | null {
  const hex = promotion.primaryBannerColorHex?.trim()
  return hex || null
}

export function themeFromColorHex(colorHex: string | null | undefined): PromoArtTheme | null {
  if (!colorHex) return null
  const normalized = colorHex.trim().toUpperCase()
  return HEX_TO_THEME[normalized] ?? null
}

export function colorHexFromTheme(theme: PromoArtTheme): string {
  return PROMO_THEME_COLOR_HEX[theme]
}
