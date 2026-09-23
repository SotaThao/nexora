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
  formatPromotionArtSaving,
  formatPromotionStudioSchedule,
  isPromotionInScheduleNow,
} from '../../dashboard/views/pos/posPromotionDisplay'
import { promotionBannerImageUrl } from '../../dashboard/views/pos/posPromotionBanner'
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
  // Strip (keypad / pair): always one full-width banner — half-width twin cards are too cramped
  // for name + rate + schedule. Panel (under services): ~2 cards from sm when there are 2+.
  const slideBasis =
    isStrip || promotions.length < 2 ? 'basis-full' : 'basis-full sm:basis-1/2'
  const useSlideGap = !isStrip && promotions.length >= 2

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
        <div className={useSlideGap ? '-ml-3 flex' : 'flex'}>
          {promotions.map((promotion, index) => {
            const hasImage = Boolean(promotionBannerImageUrl(promotion))
            const artSaving = formatPromotionArtSaving(
              promotion.discountType,
              promotion.discountValue,
            )
            const schedule = scheduleFor(promotion)
            return (
              <div
                key={promotion.id}
                className={`min-w-0 shrink-0 grow-0 ${slideBasis}${useSlideGap ? ' pl-3' : ''}`}
              >
                <article data-promotion-id={promotion.id} className="space-y-1.5">
                  <PosPromotionBannerArt
                    promotion={promotion}
                    index={index}
                    specialOfferFallback={t(`${K}.specialOffer`)}
                  />
                  {/* Image covers are picture-only — name / rate / schedule live under the art.
                      Theme art already paints badge + name + rate; still show description + hours. */}
                  <div className="space-y-0.5 px-0.5">
                    {hasImage ? (
                      <>
                        <p className="truncate text-sm font-black leading-tight text-nexoraText">
                          {promotion.name || '—'}
                        </p>
                        {artSaving ? (
                          <p className="text-sm font-black leading-none text-nexoraBrand">
                            {artSaving}
                          </p>
                        ) : null}
                      </>
                    ) : null}
                    {promotion.description ? (
                      <p className="line-clamp-2 text-[11px] leading-snug text-nexoraMuted">
                        {promotion.description}
                      </p>
                    ) : null}
                    {schedule ? (
                      <p className="truncate text-[11px] font-medium text-nexoraMuted">{schedule}</p>
                    ) : null}
                  </div>
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
    () =>
      queryPromotions.filter((promotion) => promotion.isActive && isPromotionInScheduleNow(promotion)),
    [queryPromotions],
  )

  return { activePromotions, isLoading }
}

export default function CheckInActivePromotionsSection({
  source = 'merchant',
  businessId,
  promotions,
  variant = 'panel',
  className = '',
}: {
  source?: 'merchant' | 'kiosk' | 'inline'
  businessId?: string
  /** Door-QR / page payload — skips network fetch when `source="inline"`. */
  promotions?: PosPromotionApiDto[]
  /** `panel` = front-desk section card; `strip` = bare carousel above the keypad. */
  variant?: 'panel' | 'strip'
  /** Optional width override (e.g. pair form uses `max-w-md` to match the card below). */
  className?: string
}) {
  const { t } = useTranslation()
  const { activePromotions, isLoading } = useActivePromotions(source, businessId, promotions)

  if (isLoading || activePromotions.length === 0) return null

  const carousel = <PromotionsCarousel promotions={activePromotions} variant={variant} />

  if (variant === 'strip') {
    // One full-width banner in the strip; width matches keypad / pair card.
    return (
      <div
        className={`mx-auto w-full ${className || 'max-w-sm'}`}
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
