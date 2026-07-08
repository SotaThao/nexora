/** Homepage banner carousel — separate section below header */
import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useActiveBanners } from '../../../data/hooks/useBanners'
import type { Banner, BannerTranslation, HomePageBannerSlide } from '../../../types/domain'

function getTranslation(banner: Banner, lang: string): BannerTranslation | undefined {
  return (
    banner.translations.find((t) => t.languageCode === lang) ||
    banner.translations.find((t) => t.languageCode === 'en') ||
    banner.translations[0]
  )
}

function detectDevice(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web'

  const userAgent = window.navigator.userAgent.toLowerCase()
  const isIOS = /iphone|ipad|ipod/.test(userAgent)
  const isAndroid = /android/.test(userAgent)

  if (isIOS) return 'ios'
  if (isAndroid) return 'android'
  return 'web'
}

function isOpenNewTabTarget(target: string): boolean {
  return target === 'OpenNewTab' || target === 'Open New Tab'
}

export default function HomePageBannerSection() {
  const { t, currentLanguage } = useTranslation()
  const { data: apiBanners } = useActiveBanners()

  const [isMobile] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.innerWidth < 768
  })
  const [isTablet] = useState(() => {
    if (typeof window === 'undefined') return false
    const width = window.innerWidth
    return width >= 768 && width < 1024
  })
  const deviceType = useMemo(() => detectDevice(), [])

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    slidesToScroll: 1,
  })
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const scrollTo = useCallback(
    (index: number) => {
      if (emblaApi) emblaApi.scrollTo(index)
    },
    [emblaApi],
  )

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    const timer = setInterval(() => emblaApi.scrollNext(), 10000)
    return () => clearInterval(timer)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    onSelect()
  }, [emblaApi, onSelect])

  const banners = useMemo<HomePageBannerSlide[]>(() => {
    return (apiBanners ?? [])
      .map((banner) => {
        const translation = getTranslation(banner, currentLanguage)
        if (!translation) return null

        let imageUrl = translation.webUrl
        if (isMobile && translation.mobileUrl) {
          imageUrl = translation.mobileUrl
        } else if (isTablet && translation.tabletUrl) {
          imageUrl = translation.tabletUrl
        }

        if (!imageUrl) return null

        let actionUrl = banner.webActionUrl
        if (deviceType === 'ios' && banner.iosActionUrl) {
          actionUrl = banner.iosActionUrl
        } else if (deviceType === 'android' && banner.androidActionUrl) {
          actionUrl = banner.androidActionUrl
        }

        return {
          id: banner.id,
          image: imageUrl,
          alt: banner.title,
          link: actionUrl || '#',
          target: isOpenNewTabTarget(banner.target) ? '_blank' : '_self',
        }
      })
      .filter((b): b is HomePageBannerSlide => b !== null)
    // isMobile, isTablet, and deviceType are determined once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentLanguage, apiBanners])

  if (!banners.length) {
    return null
  }

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-white via-indigo-50/25 to-slate-50 ds-section">
      <div className="absolute top-0 right-1/3 w-[320px] h-[320px] bg-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[280px] h-[280px] bg-blue/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="relative w-full rounded-xl">
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex -mr-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className="flex-[0_0_100%] lg:flex-[0_0_50%] pr-4"
                >
                  <a
                    href={banner.link}
                    target={banner.target}
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl overflow-hidden ring-1 ring-purple/8 shadow-sm"
                  >
                    <div className="w-full h-[120px] md:h-[200px] flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                      <img
                        src={banner.image}
                        alt={banner.alt}
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {scrollSnaps.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-3">
              {scrollSnaps.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => scrollTo(index)}
                  className={`nx-homepage-banner-dot rounded-full transition-all duration-300 ${
                    index === selectedIndex
                      ? 'w-6 h-2 bg-[#919eab]'
                      : 'w-2.5 h-2 bg-[#cacaca] hover:bg-[#b0b0b0]'
                  }`}
                  aria-label={t('homepage.banner.goToSlide', { index: index + 1 })}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
