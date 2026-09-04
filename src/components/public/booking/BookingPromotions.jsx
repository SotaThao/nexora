import { useCallback, useEffect, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import {
  formatPromotionDays,
  formatPromotionRate,
} from '../../dashboard/views/pos/posPromotionDisplay'
import { formatBookingTimeDisplay } from './bookingUtils'

const AUTOPLAY_MS = 4000

/**
 * Offers advertised above the booking form, from the booking page API's `promotions`.
 *
 * The day run and the rate come from the shared POS helpers, so an offer reads the same here as
 * it does at the counter and in the Owner's promotion list. The clock times deliberately do not:
 * the POS helper renders a staff-facing "02:00 pm", while everything else this customer sees on
 * this page (appointment time, review, confirmation) uses the page's own US-style "2:00 PM".
 */
export default function BookingPromotions({ promotions, copy, locale }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' })
  const [scrollSnaps, setScrollSnaps] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  const onSelect = useCallback(() => {
    if (!emblaApi) return
    setSelectedIndex(emblaApi.selectedScrollSnap())
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return undefined
    setScrollSnaps(emblaApi.scrollSnapList())
    emblaApi.on('select', onSelect)
    emblaApi.on('reInit', onSelect)
    onSelect()
    return () => {
      emblaApi.off('select', onSelect)
      emblaApi.off('reInit', onSelect)
    }
  }, [emblaApi, onSelect])

  useEffect(() => {
    if (!emblaApi || promotions.length < 2) return undefined
    const timer = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS)
    return () => clearInterval(timer)
  }, [emblaApi, promotions.length])

  if (!promotions.length) return null

  return (
    <section className="promotion-section" aria-label={copy.promotionsHeading}>
      <div className="promotion-viewport" ref={emblaRef}>
        <div className="promotion-list">
          {promotions.map((promotion, index) => {
            const days = formatPromotionDays(
              promotion.daysOfWeek,
              (day) => copy.dayShort[day] || day,
            )
            const window =
              promotion.startTime && promotion.endTime
                ? `${formatBookingTimeDisplay(promotion.startTime, locale)}–${formatBookingTimeDisplay(promotion.endTime, locale)}`
                : ''
            const schedule = [days || copy.promotionAllWeek, window]
              .filter(Boolean)
              .join(' · ')
            return (
              <article
                className="promotion-card"
                key={promotion.id}
                data-promotion-id={promotion.id}
                aria-label={copy.promotionSlideAria(index + 1, promotions.length)}
              >
                <div className="promotion-copy">
                  <div className="promotion-title-row">
                    {promotion.badgeLabel ? (
                      <span className="promotion-badge">{promotion.badgeLabel}</span>
                    ) : null}
                    <h3>{promotion.name}</h3>
                  </div>
                  <p>{schedule}</p>
                </div>
                <div className="promotion-highlight">
                  <strong>
                    {copy.promotionRateOff(
                      formatPromotionRate(promotion.discountType, promotion.discountValue),
                    )}
                  </strong>
                </div>
              </article>
            )
          })}
        </div>
      </div>

      {scrollSnaps.length > 1 ? (
        <div className="promotion-pagination">
          {scrollSnaps.map((_, index) => (
            <button
              className={`promotion-bullet${index === selectedIndex ? ' is-active' : ''}`}
              key={index}
              type="button"
              aria-label={copy.promotionSlideAria(index + 1, scrollSnaps.length)}
              aria-current={index === selectedIndex}
              onClick={() => emblaApi?.scrollTo(index)}
            />
          ))}
        </div>
      ) : null}
    </section>
  )
}
