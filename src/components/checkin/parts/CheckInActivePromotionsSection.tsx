// Read-only promotions carousel for check-in (tickets #1724 / #1768).
// Front desk: panel under services (merchant JWT). Kiosk / keypad: strip (device or merchant).
// Banner art is always 3:1 — image upload or studio-style theme card when no image.
// Under each banner: schedule only (description / caption hidden on public surfaces).
import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { Tag } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { usePosPromotions } from '../../../data/hooks/usePosPromotions'
import { useKioskPromotions } from '../../../data/hooks/usePosSelfCheckIn'
import type { PosPromotionApiDto } from '../../../types/repositories'
import { formatPromotionStudioSchedule } from '../../dashboard/views/pos/posPromotionDisplay'
import PromotionBannerDetails from '../../dashboard/views/pos/PromotionBannerDetails'
import CheckInSectionCard from './CheckInSectionCard'

const K = 'components.checkin.CheckInActivePromotionsSection'
/** Dwell time between slides — long enough to read badge / name / schedule. */
const PANEL_AUTOPLAY_MS = 5500
const STRIP_AUTOPLAY_MS = 5500
/**
 * Embla scroll attraction duration (not ms). Higher = slower, smoother.
 * Keep mid-range so autoplay never stacks a new scroll before the previous settles.
 */
const SCROLL_DURATION = 35

function PromotionsCarousel({
  promotions,
  variant,
  twoUpOnDesktop,
}: {
  promotions: PosPromotionApiDto[]
  variant: 'panel' | 'strip'
  twoUpOnDesktop: boolean
}) {
  const { t, currentLanguage } = useTranslation()
  const isStrip = variant === 'strip'
  const canLoop = isStrip && !twoUpOnDesktop ? promotions.length > 1 : promotions.length > 2
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    loop: canLoop,
    slidesToScroll: 1,
    duration: SCROLL_DURATION,
  })
  const [hovered, setHovered] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([])

  const syncSelection = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return undefined
    const onReInit = () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      syncSelection()
    }
    setScrollSnaps(emblaApi.scrollSnapList())
    syncSelection()
    emblaApi.on('select', syncSelection)
    emblaApi.on('reInit', onReInit)
    return () => {
      emblaApi.off('select', syncSelection)
      emblaApi.off('reInit', onReInit)
    }
  }, [emblaApi, syncSelection])

  // Settle-based autoplay: wait for the scroll animation to finish, then dwell,
  // then advance. Avoids setInterval stacking mid-tween (the laggy stutter).
  useEffect(() => {
    if (!emblaApi || !canLoop || hovered || detailsOpen) return undefined

    const intervalMs = isStrip ? STRIP_AUTOPLAY_MS : PANEL_AUTOPLAY_MS
    let timeoutId: number | undefined
    let cancelled = false

    const clear = () => {
      if (timeoutId === undefined) return
      window.clearTimeout(timeoutId)
      timeoutId = undefined
    }

    const scheduleNext = () => {
      clear()
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        emblaApi.scrollNext()
      }, intervalMs)
    }

    const onSettle = () => {
      if (cancelled) return
      scheduleNext()
    }

    const onPointerDown = () => {
      clear()
    }

    scheduleNext()
    emblaApi.on('settle', onSettle)
    emblaApi.on('pointerDown', onPointerDown)

    return () => {
      cancelled = true
      clear()
      emblaApi.off('settle', onSettle)
      emblaApi.off('pointerDown', onPointerDown)
    }
  }, [emblaApi, canLoop, hovered, isStrip, detailsOpen])

  const scheduleFor = (promotion: PosPromotionApiDto) =>
    formatPromotionStudioSchedule(
      promotion.daysOfWeek,
      promotion.startTime,
      promotion.endTime,
      currentLanguage,
      (day) => t(`${K}.dayShort.${day}`),
    )

  const showDots = scrollSnaps.length > 1
  // Keep keypad strips single-column; the full-width form footer can show two on desktop.
  const slideBasis =
    promotions.length < 2 ? 'basis-full' : twoUpOnDesktop
      ? 'basis-full lg:basis-1/2'
      : isStrip ? 'basis-full' : 'basis-full sm:basis-1/2'
  const useSlideGap = (!isStrip || twoUpOnDesktop) && promotions.length >= 2

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="overflow-hidden" ref={emblaRef}>
        <div className={useSlideGap ? '-ml-4 flex' : 'flex'}>
          {promotions.map((promotion, index) => {
            const schedule = scheduleFor(promotion)
            return (
              <div
                key={promotion.id}
                className={`min-w-0 shrink-0 grow-0 ${slideBasis}${useSlideGap ? ' pl-4' : ''}`}
              >
                <article data-promotion-id={promotion.id} className="space-y-1.5">
                  <PromotionBannerDetails
                    promotion={promotion}
                    index={index}
                    specialOfferFallback={t(`${K}.specialOffer`)}
                    schedule={schedule}
                    scheduleLabel={t(`${K}.scheduleLabel`)}
                    detailsLabel={t(`${K}.viewDetails`)}
                    closeLabel={t(`${K}.closeDetails`)}
                    onOpenChange={setDetailsOpen}
                  />
                  {/* Image covers are picture-only — name / rate live on theme art.
                      Under the banner we only show the schedule (no description).
                      Strip sits on the dark keypad gradient — light copy + soft backdrop for contrast. */}
                  {schedule ? (
                    <div
                      className={
                        isStrip
                          ? 'rounded-lg bg-black/45 px-2.5 py-2 backdrop-blur-[2px]'
                          : 'px-0.5'
                      }
                    >
                      <p
                        className={`whitespace-normal break-words font-semibold leading-snug ${
                          isStrip
                            ? 'text-xs text-white'
                            : 'text-xs text-nexoraText/70'
                        }`}
                      >
                        {schedule}
                      </p>
                    </div>
                  ) : null}
                </article>
              </div>
            )
          })}
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
                  active
                    ? 'w-5 bg-nexoraBrand'
                    : 'w-2 bg-nexoraBrand/35 hover:bg-nexoraBrand/55'
                }`}
              />
            )
          })}
        </div>
      ) : null}
    </div>
  )
}

function useActivePromotions(
  source: 'merchant' | 'kiosk' | 'inline',
  businessId?: string,
  inlinePromotions?: PosPromotionApiDto[],
) {
  const merchant = usePosPromotions(source === 'merchant' ? businessId : undefined)
  const kiosk = useKioskPromotions(source === 'kiosk')

  const queryPromotions =
    source === 'inline' ? (inlinePromotions ?? []) : (source === 'kiosk' ? kiosk : merchant).data ?? []
  const isLoading = source === 'inline' ? false : source === 'kiosk' ? kiosk.isLoading : merchant.isLoading

  const activePromotions = useMemo(
    () => queryPromotions.filter((promotion) => promotion.isActive),
    [queryPromotions],
  )

  return { activePromotions, isLoading }
}

export default function CheckInActivePromotionsSection({
  source = 'merchant',
  businessId,
  promotions,
  variant = 'panel',
  twoUpOnDesktop = false,
  className = '',
}: {
  source?: 'merchant' | 'kiosk' | 'inline'
  businessId?: string
  /** Door-QR / page payload — skips network fetch when `source="inline"`. */
  promotions?: PosPromotionApiDto[]
  /** `panel` = front-desk section card; `strip` = bare carousel above the keypad. */
  variant?: 'panel' | 'strip'
  /** Full-width form footer: one slide on phone, two on desktop. */
  twoUpOnDesktop?: boolean
  /** Optional width override (e.g. pair form uses `max-w-md` to match the card below). */
  className?: string
}) {
  const { t } = useTranslation()
  const { activePromotions, isLoading } = useActivePromotions(source, businessId, promotions)

  if (isLoading || activePromotions.length === 0) return null

  const carousel = <PromotionsCarousel promotions={activePromotions} variant={variant} twoUpOnDesktop={twoUpOnDesktop} />

  if (variant === 'strip') {
    return (
      <div
        className={`mx-auto w-full ${className || (twoUpOnDesktop ? 'max-w-none' : 'max-w-sm')}`}
        aria-label={t(`${K}.title`)}
      >
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
