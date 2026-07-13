import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useActiveBanners } from '../../../data/hooks/useBanners'
import type { Banner } from '../../../types/domain'

function getTranslation(banner: Banner, lang: string) {
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

export default function ActiveBannersCarousel({ fallbackAlt = 'VLINKPAY promo' }: { fallbackAlt?: string }) {
  const { currentLanguage } = useTranslation()
  const { data: apiBanners } = useActiveBanners()
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

  const banners = useMemo(() => {
    const isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false
    const isTablet = typeof window !== 'undefined' ? (window.innerWidth >= 768 && window.innerWidth < 1024) : false

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
      .filter((b) => b !== null)
  }, [currentLanguage, apiBanners, deviceType])

  if (banners.length === 0) {
    return (
      <div className="overflow-hidden rounded-lg border border-[#EEE9FF] bg-white shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
        <img
          src="/assets/images/vlinkpay-promo-banner.png"
          alt={fallbackAlt}
          className="aspect-[3.25/1] w-full object-cover"
        />
      </div>
    )
  }

  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-[#EEE9FF] bg-white shadow-[0_8px_18px_rgba(70,72,212,0.08)]">
      <div className="overflow-hidden rounded-lg" ref={emblaRef}>
        <div className="flex">
          {banners.map((banner) => (
            <div key={banner.id} className="min-w-0 flex-[0_0_100%]">
              <a
                href={banner.link}
                target={banner.target}
                rel="noopener noreferrer"
                className="block w-full overflow-hidden"
              >
                <div className="flex aspect-[3.25/1] w-full items-center justify-center bg-[#071025]">
                  <img
                    src={banner.image}
                    alt={banner.alt}
                    className="h-full w-full object-cover"
                  />
                </div>
              </a>
            </div>
          ))}
        </div>
      </div>

      {scrollSnaps.length > 1 && (
        <div className="absolute bottom-3 left-0 right-0 z-10 flex items-center justify-center gap-1.5">
          {scrollSnaps.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => scrollTo(index)}
              className={`rounded-full transition-all duration-300 ${
                index === selectedIndex
                  ? 'h-2 w-6 bg-white'
                  : 'h-2 w-2 bg-white/40 hover:bg-white/60'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
