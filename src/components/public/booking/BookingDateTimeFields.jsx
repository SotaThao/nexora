import {
  bookingLocaleFromLang,
  formatBookingDateDisplay,
  formatBookingTimeDisplay,
  openDateTimePicker,
} from './bookingUtils'
import { PUBLIC_BOOKING_FIELD_ID } from './constants'

/**
 * Date + time fields — same UX as SMS Create Campaign → Send schedule:
 * locale display overlay (12-hour clock) + native input opens via showPicker().
 */
export default function BookingDateTimeFields({
  lang,
  dateValue,
  timeValue,
  minDate,
  dateLabel,
  timeLabel,
  datePlaceholder,
  timePlaceholder,
  onDateChange,
  onTimeChange,
}) {
  const locale = bookingLocaleFromLang(lang)
  // Force 12-hour clock cycle (hc-h12), same as campaign schedule controls.
  const localeTag = `${locale}-u-hc-h12`

  return (
    <div className="booking-select-grid">
      <div className="booking-select-field">
        <span id="booking-date-label">{dateLabel}</span>
        <div
          className={`booking-datetime-shell${dateValue ? ' has-value' : ' is-empty'}`}
          lang={localeTag}
        >
          <span className="booking-datetime-display" aria-hidden="true">
            {dateValue
              ? formatBookingDateDisplay(dateValue, locale)
              : datePlaceholder}
          </span>
          <input
            className={`booking-datetime-input${dateValue ? ' has-value' : ' is-empty'}`}
            id={PUBLIC_BOOKING_FIELD_ID.date}
            type="date"
            lang={localeTag}
            data-booking-date-select
            aria-labelledby="booking-date-label"
            min={minDate}
            value={dateValue || ''}
            onClick={(event) => openDateTimePicker(event.currentTarget)}
            onChange={(event) => onDateChange(event.target.value)}
          />
        </div>
      </div>

      <div className="booking-select-field">
        <span id="booking-time-label">{timeLabel}</span>
        <div
          className={`booking-datetime-shell${timeValue ? ' has-value' : ' is-empty'}`}
          lang={localeTag}
        >
          <span className="booking-datetime-display" aria-hidden="true">
            {timeValue
              ? formatBookingTimeDisplay(timeValue, locale)
              : timePlaceholder}
          </span>
          <input
            className={`booking-datetime-input${timeValue ? ' has-value' : ' is-empty'}`}
            id={PUBLIC_BOOKING_FIELD_ID.time}
            type="time"
            lang={localeTag}
            step={60}
            data-booking-time-select
            aria-labelledby="booking-time-label"
            value={timeValue || ''}
            onClick={(event) => openDateTimePicker(event.currentTarget)}
            onChange={(event) => onTimeChange(event.target.value)}
          />
        </div>
      </div>
    </div>
  )
}
