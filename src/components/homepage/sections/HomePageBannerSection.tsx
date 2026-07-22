/** Homepage banner carousel — separate section below header */
import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useActiveBanners } from '../../../data/hooks/useBanners'
import type { Banner, BannerTranslation, HomePageBannerSlide } from '../../../types/domain'

function isValidUrl(url?: string | null): boolean {
  if (!url) return false
  const trimmed = url.trim()
  return (
    trimmed.length > 0 &&
    (trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('/') ||
      trimmed.startsWith('data:'))
  )
}

function getTranslation(banner: Banner, lang: string): BannerTranslation | undefined {
  const langMatch = banner.translations.find((t) => t.languageCode === lang)
  if (
    langMatch &&
    (isValidUrl(langMatch.webUrl) || isValidUrl(langMatch.mobileUrl) || isValidUrl(langMatch.tabletUrl))
  ) {
    return langMatch
  }

  const enMatch = banner.translations.find((t) => t.languageCode === 'en')
  if (
    enMatch &&
    (isValidUrl(enMatch.webUrl) || isValidUrl(enMatch.mobileUrl) || isValidUrl(enMatch.tabletUrl))
  ) {
    return enMatch
  }

  return (
    banner.translations.find(
      (t) => isValidUrl(t.webUrl) || isValidUrl(t.mobileUrl) || isValidUrl(t.tabletUrl)
    ) || banner.translations[0]
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

        let imageUrl: string | null = null
        if (isMobile && isValidUrl(translation.mobileUrl)) {
          imageUrl = translation.mobileUrl
        } else if (isTablet && isValidUrl(translation.tabletUrl)) {
          imageUrl = translation.tabletUrl
        }

        if (!isValidUrl(imageUrl)) {
          if (isValidUrl(translation.webUrl)) {
            imageUrl = translation.webUrl
          } else if (isValidUrl(translation.mobileUrl)) {
            imageUrl = translation.mobileUrl
          } else if (isValidUrl(translation.tabletUrl)) {
            imageUrl = translation.tabletUrl
          }
        }

        if (!isValidUrl(imageUrl)) return null

        let actionUrl = banner.webActionUrl
        if (deviceType === 'ios' && banner.iosActionUrl) {
          actionUrl = banner.iosActionUrl
        } else if (deviceType === 'android' && banner.androidActionUrl) {
          actionUrl = banner.androidActionUrl
        }

        return {
          id: banner.id,
          image: imageUrl!,
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

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-1 pb-1 sm:py-2">
        <div className="relative w-full rounded-xl">
          <div className="overflow-hidden rounded-xl" ref={emblaRef}>
            <div className="flex -mr-4">
              {banners.map((banner) => (
                <div
                  key={banner.id}
                  className={`nx-banner-slide-item pr-4 ${
                    banners.length === 1
                      ? 'flex-[0_0_100%]'
                      : 'flex-[0_0_100%] lg:flex-[0_0_50%]'
                  }`}
                >
                  <a
                    href={banner.link}
                    target={banner.target}
                    rel="noopener noreferrer"
                    className="block w-full rounded-xl overflow-hidden border border-purple/20 shadow-sm hover:border-purple/40 hover:shadow-md transition-all"
                  >
                    <div className="w-full aspect-[3.8/1] sm:aspect-[3/1] flex items-center justify-center bg-white/80 backdrop-blur-[2px]">
                      <img
                        src={banner.image}
                        alt={banner.alt}
                        className="max-h-full max-w-full object-contain"
                        onError={(e) => {
                          const slide = e.currentTarget.closest('.nx-banner-slide-item')
                          if (slide) (slide as HTMLElement).style.display = 'none'
                        }}
                      />
                    </div>
                  </a>
                </div>
              ))}
            </div>
          </div>

          {scrollSnaps.length > 1 && (
            <div className="flex justify-center items-center gap-1.5 mt-2">
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
