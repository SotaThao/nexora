/**
 * Shared promotion banner art — matches the studio create/preview card.
 * Ticket #1768: image when uploaded, otherwise themed text art; always 3:1.
 */
import {
  promotionBannerColorHex,
  promotionBannerImageUrl,
  themeFromColorHex,
  PROMO_THEME_COLOR_HEX,
} from './posPromotionBanner'
import { formatPromotionArtSaving } from './posPromotionDisplay'
import { promoArtThemeForIndex, type PromoArtTheme } from './posPromotionTemplates'
import type { PosPromotionApiDto } from '../../../../types/repositories'

const THEME_GRADIENT: Record<PromoArtTheme, string> = {
  purple: 'linear-gradient(115deg, #eeeefe, #f7f6fc)',
  gold: 'linear-gradient(115deg, #fbf2df, #faf7ef)',
  rose: 'linear-gradient(115deg, #faebf0, #fbf5f6)',
  teal: 'linear-gradient(115deg, #e7f4f0, #f4f9f7)',
  ocean: 'linear-gradient(115deg, #eaf0fa, #f5f8fc)',
  sage: 'linear-gradient(115deg, #eaf2e9, #f5f8f1)',
  peach: 'linear-gradient(115deg, #fff0e8, #fff8f3)',
  slate: 'linear-gradient(115deg, #edf0f4, #f7f8fa)',
}

export type PromotionBannerSource = Pick<
  PosPromotionApiDto,
  | 'name'
  | 'badgeLabel'
  | 'discountType'
  | 'discountValue'
  | 'primaryBannerImageUrl'
  | 'photoUrl'
  | 'primaryBannerColorHex'
>

export default function PosPromotionBannerArt({
  promotion,
  index = 0,
  specialOfferFallback,
  savingLabel,
  imageLayout = 'banner',
  className = '',
}: {
  promotion: PromotionBannerSource
  index?: number
  specialOfferFallback: string
  savingLabel?: string
  imageLayout?: 'banner' | 'detail'
  className?: string
}) {
  const imageUrl = promotionBannerImageUrl(promotion)
  const colorHex = promotionBannerColorHex(promotion)
  const matchedTheme = themeFromColorHex(colorHex)
  const theme = matchedTheme ?? (colorHex ? null : promoArtThemeForIndex(index))
  const artSaving = savingLabel ?? formatPromotionArtSaving(promotion.discountType, promotion.discountValue)

  if (imageUrl) {
    return (
      <div
        className={`${imageLayout === 'detail' ? 'w-full overflow-hidden rounded-xl bg-nexoraSurfaceMuted' : 'promo-art image-art aspect-[3/1] w-full overflow-hidden rounded-xl border border-nexoraBorder bg-[#edf0f6]'} ${className}`}
        data-promotion-banner="image"
      >
        <img
          src={imageUrl}
          alt={imageLayout === 'detail' ? promotion.name || specialOfferFallback : ''}
          width={600}
          height={200}
          className={imageLayout === 'detail' ? 'h-auto max-h-[55dvh] w-full object-contain' : 'h-full w-full object-contain'}
          loading={imageLayout === 'detail' ? 'eager' : 'lazy'}
        />
      </div>
    )
  }

  const background = theme
    ? THEME_GRADIENT[theme]
    : colorHex
      ? `linear-gradient(115deg, ${colorHex}22, ${colorHex}0d)`
      : THEME_GRADIENT.purple
  const color = theme ? PROMO_THEME_COLOR_HEX[theme] : colorHex || PROMO_THEME_COLOR_HEX.purple

  return (
    <div
      className={`promo-art${theme ? ` theme-${theme}` : ''} flex aspect-[3/1] w-full flex-col justify-center gap-1 overflow-hidden rounded-xl border border-nexoraBorder px-3 py-2.5 sm:gap-1.5 sm:px-4 sm:py-3 ${className}`}
      style={{ background, color }}
      data-promotion-banner="theme"
    >
      <span className="art-badge inline-flex w-fit max-w-full truncate rounded-md bg-white/85 px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-nexoraText sm:text-[10px]">
        {promotion.badgeLabel || specialOfferFallback}
      </span>
      <h3 className="line-clamp-2 text-sm font-black leading-tight text-nexoraText sm:text-base">
        {promotion.name || '—'}
      </h3>
      <strong className="art-saving block text-sm font-black leading-none sm:text-base">{artSaving}</strong>
    </div>
  )
}
