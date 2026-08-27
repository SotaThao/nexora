import React from 'react'
import { Tag, Calendar } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface PromotionsSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  isMobileView?: boolean
}

export const PromotionsSection: React.FC<PromotionsSectionProps> = ({ site, palette, onBookClick, isMobileView }) => {
  const promotions = site.content.promotions || []
  const templateId = site.templateId || MerchantSiteTemplateId.Classic

  // Auto-hide expired promotions
  const activePromos = promotions.filter((promo) => {
    if (!promo.endDate) return true
    try {
      return new Date(promo.endDate).getTime() >= Date.now()
    } catch {
      return true
    }
  })

  if (activePromos.length === 0) return null

  return (
    <section
      id="promotions"
      className={`border-y transition-colors scroll-mt-16 sm:scroll-mt-20 ${isMobileView ? 'py-8 px-4' : 'py-14 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center ${isMobileView ? 'mb-6' : 'mb-10'}`}>
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2"
            style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Ưu Đãi Đặc Biệt</span>
          </div>
          <h2 className={`font-bold ${isMobileView ? 'text-xl' : 'text-2xl'}`} style={{ color: palette.textPrimary }}>
            Chương Trình Khuyến Mãi
          </h2>
        </div>

        <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 md:gap-6'}`}>
          {activePromos.map((promo) => {
            // 1. MINIMALIST CLEAN (Dotted Coupon Card)
            if (templateId === MerchantSiteTemplateId.Minimal) {
              return (
                <div
                  key={promo.id}
                  className="rounded-2xl border-2 border-dashed p-5 relative overflow-hidden flex flex-col justify-between transition-all hover:border-solid hover:shadow-md"
                  style={{
                    backgroundColor: palette.bgSurface,
                    borderColor: palette.borderPrimary
                  }}
                >
                  <div className="space-y-2">
                    {promo.code && (
                      <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider"
                        style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
                      >
                        VOUCHER: {promo.code}
                      </div>
                    )}
                    <h3 className="font-bold text-sm sm:text-base leading-snug" style={{ color: palette.textPrimary }}>
                      {promo.titleVi || promo.titleEn}
                    </h3>
                    <p className="text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
                      {promo.descriptionVi || promo.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between mt-4" style={{ borderColor: palette.borderPrimary }}>
                    {promo.endDate && (
                      <span className="text-[10px] flex items-center gap-1 opacity-75" style={{ color: palette.textSecondary }}>
                        <Calendar className="w-3 h-3" />
                        HSD: {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onBookClick}
                      className="text-xs font-bold underline ml-auto transition-opacity hover:opacity-80"
                      style={{ color: palette.accentColor }}
                    >
                      Áp dụng ngay →
                    </button>
                  </div>
                </div>
              )
            }

            // 2. MODERN CHIC, BOLD & CLASSIC (Rich Photo Voucher Banner Cards)
            return (
              <div
                key={promo.id}
                className="rounded-3xl border shadow-sm relative overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-1 hover:shadow-xl group"
                style={{
                  backgroundColor: palette.bgSurface,
                  borderColor: palette.borderPrimary
                }}
              >
                {promo.imageUrl && (
                  <div className="relative w-full h-36 overflow-hidden">
                    <img
                      src={promo.imageUrl}
                      alt={promo.titleVi || promo.titleEn}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                    {promo.code && (
                      <div className="absolute bottom-3 left-3">
                        <span
                          className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold tracking-wider shadow-md"
                          style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
                        >
                          MÃ: {promo.code}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {!promo.imageUrl && promo.code && (
                      <span
                        className="inline-block px-3 py-1 rounded-lg text-xs font-mono font-bold tracking-wider mb-3 shadow-xs"
                        style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
                      >
                        MÃ: {promo.code}
                      </span>
                    )}
                    <h3
                      className={`font-bold text-base sm:text-lg mb-2 leading-snug ${
                        templateId === MerchantSiteTemplateId.Bold ? 'uppercase tracking-tight' : ''
                      }`}
                      style={{ color: palette.textPrimary }}
                    >
                      {promo.titleVi || promo.titleEn}
                    </h3>
                    <p className="text-xs leading-relaxed mb-4" style={{ color: palette.textSecondary }}>
                      {promo.descriptionVi || promo.descriptionEn}
                    </p>
                  </div>

                  <div className="pt-4 border-t flex items-center justify-between mt-auto" style={{ borderColor: palette.borderPrimary }}>
                    {promo.endDate && (
                      <span className="text-[11px] flex items-center gap-1 opacity-75" style={{ color: palette.textSecondary }}>
                        <Calendar className="w-3 h-3" />
                        HSD: {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={onBookClick}
                      className={`text-xs font-bold transition-all hover:translate-x-0.5 ml-auto flex items-center gap-1 ${
                        templateId === MerchantSiteTemplateId.Bold ? 'uppercase tracking-wider' : ''
                      }`}
                      style={{ color: palette.accentColor }}
                    >
                      <span>Áp dụng ngay</span>
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
