// Read-only promotions carousel for check-in (tickets #1724 / #1768).
// Front desk: panel under services (merchant JWT). Kiosk / keypad: strip (device or merchant).
// Banner art is always 3:1 — image upload or studio-style theme card when no image.
import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ChevronLeft, ChevronRight, Tag } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePosPromotions } from '../../../data/hooks/usePosPromotions'
import { useKioskPromotions } from '../../../data/hooks/usePosSelfCheckIn'
import type { PosPromotionApiDto } from '../../../types/repositories'
import {
  formatPromotionStudioSchedule,
  isPromotionInScheduleNow,
} from '../../dashboard/views/pos/posPromotionDisplay'
import PosPromotionBannerArt from '../../dashboard/views/pos/PosPromotionBannerArt'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.CheckInActivePromotionsSection'
const PANEL_AUTOPLAY_MS = 4500
/** Keypad strip — short interval so the row feels continuously moving, still readable. */
const STRIP_AUTOPLAY_MS = 1800

function PromotionsCarousel({
  promotions,
  variant,
}: {
  promotions: PosPromotionApiDto[]
  variant: 'panel' | 'strip'
}) {
  const { t, currentLanguage } = useTranslation()
  const isStrip = variant === 'strip'
  const canLoop = isStrip ? promotions.length > 1 : promotions.length > 2
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: canLoop,
    slidesToScroll: 1,
    duration: isStrip ? 20 : 25,
  })
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const syncNav = useCallback(() => {
    if (!emblaApi) return
    setCanPrev(emblaApi.canScrollPrev())
    setCanNext(emblaApi.canScrollNext())
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return undefined
    const onReInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      syncNav()
    }
    setScrollSnaps(emblaApi.scrollSnapList())
    syncNav()
    emblaApi.on('select', syncNav)
    emblaApi.on('reInit', onReInit)
    return () => {
      emblaApi.off('select', syncNav)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi, syncNav])

  useEffect(() => {
    if (!emblaApi || !canLoop) return undefined
    if (!isStrip && hovered) return undefined
    const intervalMs = isStrip ? STRIP_AUTOPLAY_MS : PANEL_AUTOPLAY_MS
    const timer = window.setInterval(() => emblaApi.scrollNext(), intervalMs)
    return () => window.clearInterval(timer)
  }, [emblaApi, canLoop, hovered, isStrip])

  const scheduleFor = (promotion: PosPromotionApiDto) =>
    formatPromotionStudioSchedule(
      promotion.daysOfWeek,
      promotion.startTime,
      promotion.endTime,
      currentLanguage,
      (day) => t(`${K}.dayShort.${day}`),
    )

  const showNav = !isStrip && promotions.length > 2
  const showDots = scrollSnaps.length > 1

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {showNav ? (
        <div className="mb-2 flex justify-end gap-1.5">
          <button
            type="button"
            onClick={() => emblaApi?.scrollPrev()}
            disabled={!canPrev && !canLoop}
            aria-label={t(`${K}.previous`)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <button
            type="button"
            onClick={() => emblaApi?.scrollNext()}
            disabled={!canNext && !canLoop}
            aria-label={t(`${K}.next`)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder bg-white text-nexoraText hover:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ) : null}

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="-ml-3 flex">
          {promotions.map((promotion, index) => (
            <div
              key={promotion.id}
              className={`min-w-0 shrink-0 grow-0 basis-full pl-3${
                promotions.length >= 2 ? ' sm:basis-1/2' : ''
              }`}
            >
              <article data-promotion-id={promotion.id} className="space-y-1">
                <PosPromotionBannerArt
                  promotion={promotion}
                  index={index}
                  specialOfferFallback={t(`${K}.specialOffer`)}
                />
                {!isStrip ? (
                  <p className="truncate px-0.5 text-[11px] font-medium text-nexoraMuted">
                    {scheduleFor(promotion)}
                  </p>
                ) : null}
              </article>
            </div>
          ))}
        </div>
      </div>

      {showDots ? (
        <div
          className="mt-2.5 flex items-center justify-center gap-1.5"
          role="tablist"
          aria-label={t(`${K}.title`)}
        >
          {scrollSnaps.map((_, index) => {
            const active = index === selectedIndex
            return (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={active}
                aria-label={t(`${K}.dot`, { index: index + 1, total: scrollSnaps.length })}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`h-2 rounded-full transition-all ${
                  active ? 'w-5 bg-nexoraBrand' : 'w-2 bg-nexoraBorder hover:bg-nexoraMuted'
                }`}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function useActivePromotions(source: 'merchant' | 'kiosk', businessId?: string) {
  const merchant = usePosPromotions(source === 'merchant' ? businessId : undefined)
  const kiosk = useKioskPromotions(source === 'kiosk')

  const query = source === 'kiosk' ? kiosk : merchant
  const promotions = query.data ?? []

  const activePromotions = useMemo(
    () =>
      promotions.filter((promotion) => promotion.isActive && isPromotionInScheduleNow(promotion)),
    [promotions],
  )

  return { activePromotions, isLoading: query.isLoading }
}

export default function CheckInActivePromotionsSection({
  source = 'merchant',
  businessId,
  variant = 'panel',
}: {
  source?: 'merchant' | 'kiosk'
  businessId?: string
  /** `panel` = front-desk section card; `strip` = bare carousel above the keypad. */
  variant?: 'panel' | 'strip'
}) {
  const { t } = useTranslation()
  const { activePromotions, isLoading } = useActivePromotions(source, businessId)

  if (isLoading || activePromotions.length === 0) return null

  const carousel = <PromotionsCarousel promotions={activePromotions} variant={variant} />

  if (variant === 'strip') {
    return (
      <div className="mx-auto w-full max-w-3xl" aria-label={t(`${K}.title`)}>
        {carousel}
      </div>
    )
  }

  return (
    <CheckInSectionCard title={t(`${K}.title`)} subtitle={t(`${K}.subtitle`)} icon={Tag}>
      {carousel}
    </CheckInSectionCard>
  )
}
