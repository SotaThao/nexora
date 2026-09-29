import { useCallback, useEffect, useMemo, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import {
  formatPromotionDays,
} from '../../dashboard/views/pos/posPromotionDisplay'
import PosPromotionBannerArt from '../../dashboard/views/pos/PosPromotionBannerArt'
import { formatBookingTimeDisplay } from './bookingUtils'

/** Dwell between slides — long enough to read the offer before it advances. */
const AUTOPLAY_MS = 5500
/** Embla attraction duration (not ms). Mid-range = smooth without stacking scrolls. */
const SCROLL_DURATION = 35

/**
 * Offers advertised above the booking form, from the booking page API's `promotions`.
 *
 * Ticket #1768: banner is always 3:1 — uploaded image when the API provides one, otherwise the
 * same themed studio art (badge / name / rate) used when creating a promotion. Schedule stays
 * under the art so the ratio is not distorted.
 *
 * Spacing: desktop shows 2 cards via slide `margin-inline-end` (not flex `gap`). Embla loop
 * clones copy margins, so last→first never collapses no matter how many promotions exist.
 */
export default function BookingPromotions({ promotions, copy, locale }) {
  const count = promotions.length
  // Desktop shows 2-up: loop only when there is more than one viewport of cards.
  // (1–2 cards: no loop — avoids a seam with nothing to scroll to.)
  const canLoop = count > 2
  const canScroll = count > 1

  const emblaOptions = useMemo(
    () => ({
      align: 'start',
      loop: canLoop,
      slidesToScroll: 1,
      duration: SCROLL_DURATION,
      watchDrag: canScroll,
      // Without loop, trim end snaps so the last pair still keeps card margins.
      containScroll: canLoop ? false : 'trimSnaps',
    }),
    [canLoop, canScroll],
  )

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions)
  const [scrollSnaps, setScrollSnaps] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  // Re-init whenever the merchant adds/removes promotions so slide sizes + loop stay correct.
  useEffect(() => {
    if (!emblaApi) return
    emblaApi.reInit(emblaOptions)
  }, [emblaApi, emblaOptions, count])

  useEffect(() => {
    if (!emblaApi) return undefined
    const syncSnaps = () => {
      setScrollSnaps(emblaApi.scrollSnapList())
      setSelectedIndex(emblaApi.selectedScrollSnap())
    }
    syncSnaps()
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', syncSnaps)
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', syncSnaps)
    }
  }, [emblaApi, onSelect])

  // Settle-based autoplay — wait for animation to finish, dwell, then advance.
  // Works with or without loop (wraps to start when scrollNext is exhausted).
  useEffect(() => {
    if (!emblaApi || !canScroll || hovered) return undefined

    let timeoutId
    let cancelled = false

    const clear = () => {
      if (timeoutId === undefined) return
      window.clearTimeout(timeoutId)
      timeoutId = undefined
    }

    const advance = () => {
      if (emblaApi.canScrollNext()) {
        emblaApi.scrollNext()
        return
      }
      emblaApi.scrollTo(0)
    }

    const scheduleNext = () => {
      clear()
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        advance()
      }, AUTOPLAY_MS)
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
  }, [emblaApi, canScroll, hovered])

  if (!count) return null

  const dotCount = Math.max(scrollSnaps.length, count)
  const showDots = canScroll

  return (
    <section
      className="promotion-section"
      aria-label={copy.promotionsHeading}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="promotion-viewport" ref={emblaRef}>
        <div className="promotion-list">
          {promotions.map((promotion, index) => {
            const days = formatPromotionDays(
              promotion.daysOfWeek,
              (day) => copy.dayShort[day] || day,
            )
            const timeWindow =
              promotion.startTime && promotion.endTime
                ? `${formatBookingTimeDisplay(promotion.startTime, locale)}–${formatBookingTimeDisplay(promotion.endTime, locale)}`
                : ''
            const schedule = [days || copy.promotionAllWeek, timeWindow]
              .filter(Boolean)
              .join(' · ')
            const imageUrl =
              promotion.primaryBannerImageUrl || promotion.photoUrl || null
            return (
              <article
                className="promotion-banner-slide"
                key={promotion.id}
                data-promotion-id={promotion.id}
                aria-label={copy.promotionSlideAria(index + 1, count)}
              >
                <PosPromotionBannerArt
                  promotion={{
                    name: promotion.name,
                    badgeLabel: promotion.badgeLabel,
                    discountType: promotion.discountType,
                    discountValue: promotion.discountValue,
                    primaryBannerImageUrl: imageUrl,
                    photoUrl: promotion.photoUrl || null,
                    primaryBannerColorHex: promotion.primaryBannerColorHex || null,
                  }}
                  index={index}
                  specialOfferFallback={copy.specialOffer || 'SPECIAL OFFER'}
                />
                {schedule ? <p className="promotion-banner-schedule">{schedule}</p> : null}
              </article>
            )
          })}
        </div>
      </div>

      {showDots ? (
        <div className="promotion-pagination">
          {Array.from({ length: dotCount }, (_, index) => (
            <button
              className={`promotion-bullet${index === selectedIndex ? ' is-active' : ''}`}
              key={index}
              type="button"
              aria-label={copy.promotionSlideAria(index + 1, dotCount)}
              aria-current={index === selectedIndex ? 'true' : undefined}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
