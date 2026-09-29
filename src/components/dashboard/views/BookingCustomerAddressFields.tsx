import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { geocodeSalonAddress, isGeocodeAddressQueryReady } from './settingsAddressGeocode'
import { getSettingsCountryLabel, SETTINGS_COUNTRY_OPTIONS, type LocationParts } from './settingsLocationDetect'
import { customerStreetFromGeocode, emptyCustomerLocation, formatCustomerAddress, splitCustomerAddress } from './customerAddress'

const TK = 'components.dashboard.views.BookingHubView.customers'
const SETTINGS_TK = 'components.dashboard.views.BookingHubView.settings'

export default function BookingCustomerAddressFields({
  initialAddress,
  disabled,
  error,
  onChange,
}: {
  initialAddress: string
  disabled: boolean
  error?: string
  onChange: (address: string) => void
}) {
  const { t } = useTranslation()
  const errorId = useId()
  const [location, setLocation] = useState(() => splitCustomerAddress(initialAddress))
  const [lookupStatus, setLookupStatus] = useState<'idle' | 'detecting' | 'failed'>('idle')
  const locationRef = useRef(location)
  const disabledRef = useRef(disabled)
  const onChangeRef = useRef(onChange)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  // No lookup on mount or on an unchanged address: opening a form must not rewrite saved data.
  const pendingQueryRef = useRef<string | null>(null)
  disabledRef.current = disabled
  onChangeRef.current = onChange

  const cancelLookup = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = null
    abortRef.current?.abort()
    abortRef.current = null
  }

  useEffect(() => () => cancelLookup(), [])
  useEffect(() => {
    if (disabled) {
      cancelLookup()
      pendingQueryRef.current = null
      setLookupStatus('idle')
    }
  }, [disabled])

  const updateLocation = (next: LocationParts) => {
    locationRef.current = next
    setLocation(next)
    onChangeRef.current(formatCustomerAddress(next))
  }

  const runLookup = async (query: string) => {
    if (disabledRef.current || pendingQueryRef.current !== query || !isGeocodeAddressQueryReady(query)) return
    cancelLookup()
    const controller = new AbortController()
    abortRef.current = controller
    setLookupStatus('detecting')
    try {
      const result = await geocodeSalonAddress(query, controller.signal, { useAddressHints: false })
      if (controller.signal.aborted || disabledRef.current) return
      pendingQueryRef.current = null
      if (!result) {
        setLookupStatus('failed')
        return
      }
      const street = customerStreetFromGeocode(query, result.location)
      if (street === query && query.includes(',')) {
        // An ambiguous full address stays intact instead of appending guessed locality twice.
        setLookupStatus('failed')
        return
      }
      const current = locationRef.current
      const entered = splitCustomerAddress(query)
      updateLocation({
        street,
        city: entered.city || result.location.city || current.city,
        state: entered.state || result.location.state || current.state,
        zip: entered.zip || result.location.zip || current.zip,
        country: entered.country || result.location.country || current.country,
      })
      setLookupStatus('idle')
    } catch {
      if (controller.signal.aborted || disabledRef.current) return
      pendingQueryRef.current = null
      setLookupStatus('failed')
    }
  }

  const changeStreet = (street: string) => {
    cancelLookup()
    setLookupStatus('idle')
    const query = street.trim()
    const isFullAddress = Boolean(splitCustomerAddress(query).city) || query.split(',').length >= 3
    updateLocation(!query
      ? emptyCustomerLocation()
      : { ...(isFullAddress ? emptyCustomerLocation() : locationRef.current), street })
    pendingQueryRef.current = query
    if (isGeocodeAddressQueryReady(query)) {
      timerRef.current = setTimeout(() => void runLookup(query), 700)
    }
  }

  const changePart = (field: keyof LocationParts, value: string) => {
    // A manual correction takes precedence over any in-flight geocoder response.
    cancelLookup()
    pendingQueryRef.current = null
    setLookupStatus('idle')
    updateLocation({ ...locationRef.current, [field]: value })
  }

  return (
    <div className="cust-address-fields cust-field-full" data-ai-hub-field="address" role="group" aria-label={t(`${TK}.fieldAddress`)}>
      <label className="cust-field cust-field-full">
        <span className="cust-field-label">{t(`${TK}.fieldAddress`)}</span>
        <input
          className={`booking-input ${error ? 'has-error' : ''}`}
          type="text"
          value={location.street}
          placeholder={t(`${SETTINGS_TK}.placeholderStreet`)}
          autoComplete="street-address"
          disabled={disabled}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : undefined}
          onChange={(event) => changeStreet(event.target.value)}
          onBlur={() => {
            if (pendingQueryRef.current !== null) void runLookup(pendingQueryRef.current)
          }}
        />
        {error ? <span id={errorId} className="cust-field-error" aria-live="polite">{error}</span> : null}
      </label>
      {([
        { field: 'city', label: 'city', placeholder: 'placeholderCity', autoComplete: 'address-level2' },
        { field: 'state', label: 'state', placeholder: 'placeholderState', autoComplete: 'address-level1' },
        { field: 'zip', label: 'zip', placeholder: 'placeholderZip', autoComplete: 'postal-code' },
      ] as const).map(({ field, label, placeholder, autoComplete }) => (
        <label key={field} className={`cust-field cust-address-${field}`}>
          <span className="cust-field-label">{t(`${SETTINGS_TK}.${label}`)}</span>
          <input
            className="booking-input"
            type="text"
            value={location[field]}
            placeholder={t(`${SETTINGS_TK}.${placeholder}`)}
            autoComplete={autoComplete}
            disabled={disabled}
            onChange={(event) => changePart(field, event.target.value)}
          />
        </label>
      ))}
      <label className="cust-field cust-address-country">
        <span className="cust-field-label">{t(`${TK}.fieldCountry`)}</span>
        <span className="cust-select-shell">
          <select
            className="booking-input cust-select-input"
            value={location.country}
            autoComplete="country"
            disabled={disabled}
            onChange={(event) => changePart('country', event.target.value)}
          >
            <option value="">{t(`${TK}.fieldCountryPlaceholder`)}</option>
            {SETTINGS_COUNTRY_OPTIONS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
            {location.country && !SETTINGS_COUNTRY_OPTIONS.some(({ value }) => value === location.country) ? (
              <option value={location.country}>{getSettingsCountryLabel(location.country)}</option>
            ) : null}
          </select>
          <ChevronDown className="cust-select-chevron" aria-hidden="true" />
        </span>
      </label>
      {lookupStatus !== 'idle' ? (
        <span className="cust-address-status cust-field-full" role="status">
          {t(`${TK}.${lookupStatus === 'detecting' ? 'addressDetecting' : 'addressDetectFailed'}`)}
        </span>
      ) : null}
    </div>
  )
}
