import React from 'react'
import { XLgIcon } from './BookingHubIcons'

type BookingKeywordSearchFieldProps = {
  value: string
  onChange: (value: string) => void
  placeholder: string
  clearLabel: string
  inputClassName?: string
}

/**
 * Shared Booking Hub search input with a large clear control
 * (replaces the tiny native `type="search"` cancel button).
 */
export default function BookingKeywordSearchField({
  value,
  onChange,
  placeholder,
  clearLabel,
  inputClassName = 'booking-input booking-input-keyword',
}: BookingKeywordSearchFieldProps) {
  return (
    <span className={`booking-keyword-shell${value ? ' has-value' : ''}`}>
      <input
        className={inputClassName}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      {value ? (
        <button
          className="booking-keyword-clear"
          type="button"
          aria-label={clearLabel}
          title={clearLabel}
          onClick={() => onChange('')}
        >
          <XLgIcon />
        </button>
      ) : null}
    </span>
  )
}
