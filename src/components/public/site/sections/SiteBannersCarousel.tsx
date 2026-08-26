import React, { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { useActiveBanners } from '../../../../data/hooks/useBanners'
import { SitePalette } from '../palettes'

export interface SiteBannersCarouselProps {
  site?: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
  onBookClick?: () => void
  className?: string
}

export interface DisplayBanner {
  id: string
  title: string
  imageUrl: string
  linkUrl?: string
  badgeText?: string
  description?: string
}

const DEFAULT_VIP_BANNERS: DisplayBanner[] = [
  {
    id: 'banner-vlinkpay',
    title: 'VLINKPAY CRYPTO GATEWAY · 0% PROCESSING FEES',
    imageUrl: 'https://bitcoinnailbar-test.vercel.app/assets/banners/vlinkpay_banner.jpg',
    linkUrl: '#',
    badgeText: '✨ NEXORA ADS',
    description: 'Chấp nhận Bitcoin, USDT, Apple Pay & Đồng bộ Clover POS tức thì.'
  },
  {
    id: 'banner-nailbar-promo',
    title: 'DISCOUNT 25% · MONDAY TO WEDNESDAY',
    imageUrl: 'https://bitcoinnailbar-test.vercel.app/assets/banners/nailbar_banner.jpg',
    linkUrl: '#',
    badgeText: '🔥 HOT PROMOTION',
    description: 'Ưu đãi 25% dịch vụ móng nghệ thuật & Thưởng thức cocktail miễn phí.'
  },
  {
    id: 'banner-cryptomap360',
    title: 'CRYPTOMAP360 · VERIFIED CRYPTO MERCHANT',
    imageUrl: 'https://bitcoinnailbar-test.vercel.app/assets/banners/cryptomap360_banner.jpg',
    linkUrl: '#',
    badgeText: '🌐 CRYPTOMAP360 PARTNER',
    description: 'Khám phá và nhận ưu đãi độc quyền dành cho cộng đồng thanh toán Bitcoin.'
  },
  {
    id: 'banner-vip-membership',
    title: 'ELEVATED CIRCLE · VIP MEMBERSHIP CLUB',
    imageUrl: 'https://bitcoinnailbar-test.vercel.app/assets/banners/membership_banner.jpg',
    linkUrl: '#',
    badgeText: '👑 VIP MEMBERSHIP',
    description: 'Tích điểm hoàn tiền đến 15%, ưu tiên đặt chỗ và miễn phí đồ uống VIP Lounge.'
  }
]

export const SiteBannersCarousel: React.FC<SiteBannersCarouselProps> = ({
  site,
  palette,
  isMobileView,
  onBookClick,
  className = ''
}) => {
  const { data: apiBanners } = useActiveBanners()

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
    skipSnaps: false,
    ...(isMobileView
      ? {}
      : {
          breakpoints: {
            '(min-width: 768px)': { slidesToScroll: 2 },
            '(min-width: 1280px)': { slidesToScroll: 2 }
          }
        })
  })

  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi]
  )

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev()
  }, [emblaApi])

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext()
  }, [emblaApi])

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  // Active Autoplay timer (4s) for dynamic promotional rotation
  useEffect(() => {
    if (!emblaApi) return
    const timer = setInterval(() => {
      emblaApi.scrollNext()
    }, 4000)
    return () => clearInterval(timer)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  // Build carousel slides
  const banners: DisplayBanner[] = useMemo(() => {
    // 1. Merchant custom configured promotions if present
    const customPromotions = site?.content?.promotions
    if (customPromotions && customPromotions.length > 0) {
      const activePromos = customPromotions.filter((p) => Boolean(p.imageUrl))
      if (activePromos.length > 0) {
        return activePromos.map((p) => ({
          id: p.id,
          title: p.titleVi || p.titleEn,
          imageUrl: p.imageUrl || '',
          linkUrl: '#',
          badgeText: p.code ? `MÃ: ${p.code}` : (p.discountPercent ? `GIẢM ${p.discountPercent}%` : '🔥 ƯU ĐÃI'),
          description: p.descriptionVi || p.descriptionEn,
        }))
      }
    }

    // 2. Ads Marketing API banners if available from server
    if (apiBanners && apiBanners.length > 0) {
      const formatted = apiBanners.map((b) => {
        const tr = b.translations?.[0]
        const img = (isMobileView && tr?.mobileUrl) ? tr.mobileUrl : (tr?.webUrl || '')
        return {
          id: b.id,
          title: b.title,
          imageUrl: img || DEFAULT_VIP_BANNERS[0].imageUrl,
          linkUrl: b.webActionUrl || '#',
          badgeText: '✨ NEXORA ADS'
        }
      })
      return formatted
    }

    // 3. Default promotional marketing banners
    return DEFAULT_VIP_BANNERS
  }, [site, apiBanners, isMobileView])

  if (banners.length === 0) return null

  return (
    <section className={`w-full py-2 sm:py-3 relative z-10 transition-colors select-none ${className}`}>
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="relative group">
          {/* Embla Viewport */}
          <div className="overflow-hidden rounded-2xl cursor-grab active:cursor-grabbing" ref={emblaRef}>
            <div className="flex -mr-3 sm:-mr-4">
              {banners.map((banner, idx) => (
                <div
                  key={banner.id || idx}
                  className={`nx-banner-slide-item pr-3 sm:pr-4 ${
                    isMobileView || banners.length === 1
                      ? 'flex-[0_0_100%]'
                      : 'flex-[0_0_100%] md:flex-[0_0_50%]'
                  }`}
                >
                  <div
                    onClick={onBookClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        onBookClick?.()
                      }
                    }}
                    className="block w-full rounded-2xl overflow-hidden border shadow-sm hover:shadow-lg transition-all duration-300 relative group/card cursor-pointer aspect-[3/1] bg-slate-900"
                    style={{
                      borderColor: `${palette.borderPrimary}60`,
                      boxShadow: `0 8px 24px -6px ${palette.accentColor}20`
                    }}
                  >
                    <img
                      src={banner.imageUrl}
                      alt={banner.title}
                      className="w-full h-full object-cover object-center rounded-2xl transition-transform duration-700 group-hover/card:scale-102"
                      onError={(e) => {
                        const target = e.currentTarget
                        target.style.display = 'none'
                        if (target.parentElement) {
                          target.parentElement.style.background = `linear-gradient(135deg, ${palette.bgPrimary} 0%, #1e1b4b 100%)`
                        }
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Arrow Buttons (Desktop viewport only, completely hidden on mobile view) */}
          {!isMobileView && (
            <>
              <button
                type="button"
                onClick={scrollPrev}
                aria-label="Previous banner slide"
                className="hidden md:flex absolute -left-2 sm:-left-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 z-20 hover:scale-110 shadow-xl"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={scrollNext}
                aria-label="Next banner slide"
                className="hidden md:flex absolute -right-2 sm:-right-3 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/90 text-white backdrop-blur-md border border-white/20 items-center justify-center opacity-80 hover:opacity-100 transition-all duration-200 z-20 hover:scale-110 shadow-xl"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Navigation Dots Indicator (Identical to Nexora Homepage & Bitcoin Nail Bar) */}
          {scrollSnaps.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2.5 sm:mt-3">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollTo(index)}
                  className={`rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? 'w-6 h-2'
                      : 'w-2 h-2 hover:w-3 opacity-50 hover:opacity-80'
                  }`}
                  style={{
                    backgroundColor: index === selectedIndex ? palette.accentColor : palette.textSecondary
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
