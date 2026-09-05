import { useEffect, useRef } from 'react'
import { formatServiceChoicePrice } from './bookingUtils'

/**
 * Service details dialog — opened from a service card's "View details" action.
 * The body text is the service `note` from the booking page API; cards without one never
 * render the action, so this only ever opens with something to show.
 */
export default function ServiceDescriptionModal({ service, copy, onClose }) {
  const closeButtonRef = useRef(null)

  useEffect(() => {
    if (!service) return undefined
    closeButtonRef.current?.focus()
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.classList.add('service-description-open')
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.classList.remove('service-description-open')
    }
  }, [service, onClose])

  if (!service) return null

  const durationMinutes = Number(service.durationMinutes || 0)

  return (
    <div className="service-description-modal" id="service-description-modal">
      <div className="service-description-backdrop" onClick={onClose} />
      <section
        className="service-description-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-description-title"
      >
        <div className="service-description-dialog-head">
          <div>
            <p className="service-description-eyebrow">
              {copy.serviceDescriptionEyebrow}
            </p>
            <h2 id="service-description-title">{service.name}</h2>
          </div>
          <button
            className="service-description-close"
            type="button"
            ref={closeButtonRef}
            aria-label={copy.serviceDescriptionCloseAria}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div
          className="service-description-meta"
          aria-label={copy.serviceDescriptionEyebrow}
        >
          <span>
            <small>{copy.serviceDescriptionPriceLabel}</small>
            <strong>
              {formatServiceChoicePrice(service, copy.contactPrice)}
            </strong>
          </span>
          {durationMinutes > 0 ? (
            <span>
              <small>{copy.serviceDescriptionDurationLabel}</small>
              <strong>{copy.durationMinutes(durationMinutes)}</strong>
            </span>
          ) : null}
        </div>

        <p className="service-description-content">{service.note}</p>

        <button className="secondary-button" type="button" onClick={onClose}>
          {copy.serviceDescriptionClose}
        </button>
      </section>
    </div>
  )
}
