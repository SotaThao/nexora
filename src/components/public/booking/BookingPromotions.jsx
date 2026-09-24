import { useCallback, useEffect, useState } from 'react'
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
 */
export default function BookingPromotions({ promotions, copy, locale }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'start',
    duration: SCROLL_DURATION,
  })
  const [scrollSnaps, setScrollSnaps] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [hovered, setHovered] = useState(false)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

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
  }, [emblaApi, onSelect, promotions.length])

  // Settle-based autoplay — wait for animation to finish, dwell, then advance.
  // Avoids setInterval firing mid-tween (stutter / lag).
  useEffect(() => {
    if (!emblaApi || promotions.length < 2 || hovered) return undefined

    let timeoutId
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
  }, [emblaApi, promotions.length, hovered])

  if (!promotions.length) return null

  const dotCount = Math.max(scrollSnaps.length, promotions.length)
  const showDots = promotions.length > 1

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
                aria-label={copy.promotionSlideAria(index + 1, promotions.length)}
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
