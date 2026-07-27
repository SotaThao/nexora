import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  getPublicBookingSubmitErrorCode,
  useCreatePublicOnlineBooking,
  usePublicBookingPageData,
} from '../../../data/hooks/usePublicVoiceBooking'
import { formatServicePrice } from '../../../data/repositories/publicVoiceBooking'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import {
  getPublicBookingCopy,
  parsePublicBookingLang,
  parsePublicBookingSource,
  PUBLIC_BOOKING_BODY_CLASS,
  PUBLIC_BOOKING_FIELD_ID,
  PUBLIC_BOOKING_ROUTE,
  PUBLIC_BOOKING_STEP,
  PUBLIC_BOOKING_SUBMIT_ERROR_COPY,
  PUBLIC_BOOKING_THEME_COLOR,
  PUBLIC_BOOKING_VALIDATION_ERROR,
} from './constants'
import {
  bookingLocaleFromLang,
  buildCreateBookingBody,
  createDefaultBookingState,
  formatBookingSlot,
  formatCustomerPhoneDisplay,
  getDefaultBookingSlot,
  moneyFromCents,
  parseBookingTime,
  resolveBookingFieldErrors,
  resolveBookingServiceNames,
  validateBookingDraft,
} from './bookingUtils'
import BookingDateTimeFields from './BookingDateTimeFields'
import './public-booking.css'
import PublicBookingSkeleton from './PublicBookingSkeleton'

function ServiceChips({ names, emptyLabel }) {
  if (!names.length) return emptyLabel
  return names.map((name, index) => (
    <span key={`${name}-${index}`} className="service-chip">
      {name}
    </span>
  ))
}

function BookingStatusCard({ title, copy, actionLabel, onAction }) {
  return (
    <section className="step-panel app-card success-card">
      <h2>{title}</h2>
      {copy ? <p>{copy}</p> : null}
      {actionLabel && onAction ? (
        <button className="secondary-button" type="button" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </section>
  )
}

export default function PublicBookingPage() {
  const { businessKey: businessKeyParam } = useParams()
  const businessKey = String(businessKeyParam || '').trim()
  const [searchParams] = useSearchParams()
  const lang = parsePublicBookingLang(
    searchParams.get(PUBLIC_BOOKING_ROUTE.langQuery),
  )
  const srcParam = searchParams.get(PUBLIC_BOOKING_ROUTE.sourceQuery)
  const bookingSource = useMemo(
    () => parsePublicBookingSource(srcParam),
    [srcParam],
  )
  const copy = useMemo(() => getPublicBookingCopy(lang), [lang])
  const locale = useMemo(() => bookingLocaleFromLang(lang), [lang])
  const { showToast } = useNotification()

  const pageQuery = usePublicBookingPageData(businessKey, {
    enabled: Boolean(businessKey),
  })
  const createMutation = useCreatePublicOnlineBooking()

  const defaultSlot = useMemo(() => getDefaultBookingSlot(), [])
  const [state, setState] = useState(() => createDefaultBookingState(defaultSlot))
  const [errors, setErrors] = useState([])
  const [statusMessage, setStatusMessage] = useState('')

  const pageData = pageQuery.data
  const businessName = pageData?.businessName || businessKey
  const catalog = useMemo(
    () => ({
      services: pageData?.services || [],
      staff: pageData?.staff || [],
      operatingHours: pageData?.operatingHours || [],
    }),
    [pageData],
  )
  const phoneParsed = useMemo(
    () => parsePhone(state.customer.phone || PhoneDialCode.US),
    [state.customer.phone],
  )

  useEffect(() => {
    document.title = `${copy.documentTitleSuffix} · ${businessName || copy.documentTitleSuffix}`
    document.body.classList.add(PUBLIC_BOOKING_BODY_CLASS)
    const previousHtmlLang = document.documentElement.lang
    // Force 12-hour clock page-wide while booking is open (SMS schedule uses the same u-hc-h12 tag).
    document.documentElement.lang = `${locale}-u-hc-h12`
    const meta = document.querySelector('meta[name="theme-color"]')
    const previousTheme = meta?.getAttribute('content')
    if (meta) meta.setAttribute('content', PUBLIC_BOOKING_THEME_COLOR)
    return () => {
      document.body.classList.remove(PUBLIC_BOOKING_BODY_CLASS)
      document.documentElement.lang = previousHtmlLang || 'en'
      if (meta && previousTheme != null) meta.setAttribute('content', previousTheme)
    }
  }, [copy, locale, businessName])

  const selectedServices = catalog.services.filter((service) =>
    state.selectedServiceIds.includes(service.id),
  )
  const selectedStaff = catalog.staff.find(
    (staff) => staff.id === state.selectedStaffId,
  )
  const staffName = selectedStaff?.fullName || copy.emDash

  const scrollToFirstError = (errorKeys) => {
    const slotTargetId =
      state.selectedDate && !state.selectedTime
        ? PUBLIC_BOOKING_FIELD_ID.time
        : PUBLIC_BOOKING_FIELD_ID.date
    const targetByError = {
      [PUBLIC_BOOKING_VALIDATION_ERROR.phone]: PUBLIC_BOOKING_FIELD_ID.phone,
      [PUBLIC_BOOKING_VALIDATION_ERROR.name]: PUBLIC_BOOKING_FIELD_ID.name,
      [PUBLIC_BOOKING_VALIDATION_ERROR.services]: PUBLIC_BOOKING_FIELD_ID.services,
      [PUBLIC_BOOKING_VALIDATION_ERROR.staff]: PUBLIC_BOOKING_FIELD_ID.staff,
      [PUBLIC_BOOKING_VALIDATION_ERROR.closedDay]: PUBLIC_BOOKING_FIELD_ID.date,
      [PUBLIC_BOOKING_VALIDATION_ERROR.slot]: slotTargetId,
    }
    const targetId = errorKeys
      .map((key) => targetByError[key])
      .find(Boolean)
    if (!targetId) return
    requestAnimationFrame(() => {
      document.getElementById(targetId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      })
    })
  }

  const updateCustomerPhone = (nextDialCode, nationalRaw) => {
    const formatted = formatNationalNumber(nationalRaw, nextDialCode)
    setState((prev) => ({
      ...prev,
      customer: {
        ...prev.customer,
        phone: `${nextDialCode} ${formatted}`.trim(),
      },
    }))
    setErrors([])
  }

  const chooseService = (id) => {
    setState((prev) => {
      const alreadySelected = prev.selectedServiceIds.includes(id)
      return {
        ...prev,
        selectedServiceIds: alreadySelected
          ? prev.selectedServiceIds.filter((serviceId) => serviceId !== id)
          : [...prev.selectedServiceIds, id],
      }
    })
    setErrors([])
  }

  const chooseStaff = (id) => {
    setState((prev) => ({
      ...prev,
      selectedStaffId: prev.selectedStaffId === id ? '' : id,
    }))
    setErrors([])
  }

  const goToStep = (nextStep) => {
    if (nextStep === PUBLIC_BOOKING_STEP.review) {
      const current = validateBookingDraft(state, catalog, defaultSlot.date)
      if (!current.ok) {
        setErrors(current.errors)
        setState((prev) => ({ ...prev, step: PUBLIC_BOOKING_STEP.form }))
        scrollToFirstError(current.errors)
        return
      }
    }
    setErrors([])
    setState((prev) => ({ ...prev, step: nextStep }))
    window.scrollTo?.({ top: 0, behavior: 'smooth' })
  }

  const resolveSubmitErrorMessage = (error) => {
    const code = getPublicBookingSubmitErrorCode(error)
    const copyKey = PUBLIC_BOOKING_SUBMIT_ERROR_COPY[code]
    return (copyKey && copy[copyKey]) || copy.unexpectedError
  }

  const submitBooking = async () => {
    const validation = validateBookingDraft(state, catalog, defaultSlot.date)
    if (!validation.ok) {
      setErrors(validation.errors)
      setState((prev) => ({ ...prev, step: PUBLIC_BOOKING_STEP.form }))
      scrollToFirstError(validation.errors)
      return
    }

    try {
      const result = await createMutation.mutateAsync({
        businessKey,
        body: buildCreateBookingBody(state, {
          timeZone: pageData?.timeZone,
        }),
        source: bookingSource,
      })
      const selectedNames = catalog.services
        .filter((service) => state.selectedServiceIds.includes(service.id))
        .map((service) => service.name)
      setState((prev) => ({
        ...prev,
        booking: {
          ...result,
          serviceNames: resolveBookingServiceNames(result, selectedNames),
        },
        step: PUBLIC_BOOKING_STEP.success,
      }))
      setStatusMessage(copy.statusSent(result.leadId))
      window.scrollTo?.({ top: 0, behavior: 'smooth' })
    } catch (error) {
      const message = resolveSubmitErrorMessage(error)
      setErrors([])
      showToast(message, 'error')
      setStatusMessage(message)
    }
  }

  const resetBooking = () => {
    setState(createDefaultBookingState(getDefaultBookingSlot()))
    setErrors([])
    setStatusMessage('')
    createMutation.reset()
  }

  const {
    phoneError,
    nameError,
    serviceError,
    staffError,
    dateError,
    timeError,
    reviewError,
  } = resolveBookingFieldErrors(errors, state, copy)

  const booking = state.booking
  const serviceNames = selectedServices.map((service) => service.name)
  const successServiceNames = resolveBookingServiceNames(booking, serviceNames)
  const totalMinutes = selectedServices.reduce(
    (sum, service) => sum + (service.durationMinutes || 0),
    0,
  )
  const totalLabel = moneyFromCents(
    selectedServices.reduce((sum, service) => sum + (service.priceCents || 0), 0),
  )
  const successTotalLabel =
    booking?.servicePrice != null
      ? formatServicePrice(booking.servicePrice)
      : totalLabel

  const renderBrand = () => (
    <header className="brand-card">
      <div className="brand-icon" aria-hidden="true">
        {copy.brandIcon}
      </div>
      <p className="brand-kicker">{copy.brandKicker}</p>
      <h1>{businessName || copy.documentTitleSuffix}</h1>
    </header>
  )

  if (!businessKey) {
    return (
      <div className="public-booking-root" lang={lang}>
        <div className="page-shell">
          {renderBrand()}
          <main id="booking-app">
            <BookingStatusCard
              title={copy.loadErrorTitle}
              copy={copy.missingBusinessKey}
            />
          </main>
        </div>
      </div>
    )
  }

  if (pageQuery.isLoading) {
    return (
      <div className="public-booking-root" lang={lang}>
        <div className="page-shell">
          <PublicBookingSkeleton />
          <p className="screen-reader" role="status" aria-live="polite">
            {copy.loadingTitle}
          </p>
        </div>
      </div>
    )
  }

  if (pageQuery.isError) {
    const message = resolveSubmitErrorMessage(pageQuery.error)
    return (
      <div className="public-booking-root" lang={lang}>
        <div className="page-shell">
          {renderBrand()}
          <main id="booking-app">
            <BookingStatusCard
              title={copy.loadErrorTitle}
              copy={message}
              actionLabel={copy.loadErrorRetry}
              onAction={() => pageQuery.refetch()}
            />
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="public-booking-root" lang={lang}>
      <div className="page-shell">
        {renderBrand()}

        <main id="booking-app">
          {state.step === PUBLIC_BOOKING_STEP.form && (
            <section className="step-panel app-card" data-step-panel="1">
              <div className="card-heading">
                <div>
                  <h2>{copy.step1PhoneHeading}</h2>
                </div>
              </div>

              <div className="customer-fields booking-select-grid has-name" id="customer-fields">
                <div className="booking-select-field" id="booking-phone-field">
                  <span id="booking-phone-label">{copy.phoneLabel}</span>
                  <div
                    className={`booking-datetime-shell phone-input-shell${
                      phoneParsed.nationalNumber ? ' has-value' : ' is-empty'
                    }`}
                  >
                    <CountryCodeSelect
                      value={phoneParsed.countryCode || PhoneDialCode.US}
                      embedded
                      onChange={(nextCode) => {
                        updateCustomerPhone(nextCode, phoneParsed.nationalNumber)
                      }}
                    />
                    <input
                      className="booking-text-input phone-mask-input"
                      id={PUBLIC_BOOKING_FIELD_ID.phone}
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      aria-labelledby="booking-phone-label"
                      aria-describedby="phone-error"
                      placeholder={getNationalPhonePlaceholder(
                        phoneParsed.countryCode || PhoneDialCode.US,
                      )}
                      value={formatNationalNumber(
                        phoneParsed.nationalNumber,
                        phoneParsed.countryCode || PhoneDialCode.US,
                      )}
                      onChange={(event) => {
                        updateCustomerPhone(
                          phoneParsed.countryCode || PhoneDialCode.US,
                          event.target.value,
                        )
                      }}
                    />
                  </div>
                  <p className="field-error" id="phone-error" role="alert">
                    {phoneError}
                  </p>
                </div>

                <div className="booking-select-field" id="booking-name-field">
                  <span id="booking-name-label">{copy.nameLabel}</span>
                  <div
                    className={`booking-datetime-shell${
                      state.customer.name ? ' has-value' : ' is-empty'
                    }`}
                  >
                    <input
                      className="booking-text-input"
                      id={PUBLIC_BOOKING_FIELD_ID.name}
                      type="text"
                      autoComplete="name"
                      aria-labelledby="booking-name-label"
                      aria-describedby="name-error"
                      placeholder={copy.namePlaceholder}
                      value={state.customer.name}
                      onChange={(event) => {
                        setState((prev) => ({
                          ...prev,
                          customer: { ...prev.customer, name: event.target.value },
                        }))
                        setErrors([])
                      }}
                    />
                  </div>
                  <p className="field-error" id="name-error" role="alert">
                    {nameError}
                  </p>
                </div>
              </div>

              <div className="card-heading">
                <div>
                  <h2>{copy.step1ServiceHeading}</h2>
                </div>
              </div>

              {catalog.services.length === 0 ? (
                <p className="section-copy">{copy.emptyServices}</p>
              ) : (
                <div className="service-grid" id={PUBLIC_BOOKING_FIELD_ID.services}>
                  {catalog.services.map((service) => {
                    const selected = state.selectedServiceIds.includes(service.id)
                    return (
                      <button
                        key={service.id}
                        className="choice-card"
                        type="button"
                        data-service-id={service.id}
                        aria-pressed={selected}
                        onClick={() => chooseService(service.id)}
                      >
                        <span className="choice-title">{service.name}</span>
                        <span className="choice-detail">
                          <span>
                            {copy.durationMinutes(service.durationMinutes || 0)}
                          </span>
                          <strong className="choice-price">
                            {moneyFromCents(service.priceCents)}
                          </strong>
                        </span>
                      </button>
                    )
                  })}
                </div>
              )}

              <div className="selection-summary" aria-live="polite">
                <span id="service-count">
                  {selectedServices.length > 0
                    ? copy.serviceCount(selectedServices.length, totalMinutes)
                    : copy.noServiceSelectedAlt}
                </span>
                <strong id="service-total">{totalLabel}</strong>
              </div>
              <p className="field-error" id="service-error" role="alert">
                {serviceError}
              </p>

              <h3 className="section-title">{copy.staffSectionTitle}</h3>
              {catalog.staff.length === 0 ? (
                <p className="section-copy">{copy.emptyStaff}</p>
              ) : (
                <div className="staff-grid" id={PUBLIC_BOOKING_FIELD_ID.staff}>
                  {catalog.staff.map((staff) => {
                    const selected = state.selectedStaffId === staff.id
                    return (
                      <button
                        key={staff.id}
                        className="choice-card staff-card"
                        type="button"
                        data-staff-id={staff.id}
                        aria-pressed={selected}
                        onClick={() => chooseStaff(staff.id)}
                      >
                        <span className="choice-icon" aria-hidden="true">
                          {staff.initials}
                        </span>
                        <span className="choice-title">{staff.fullName}</span>
                        <span className="staff-status">{copy.staffAvailable}</span>
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="field-error" id="staff-error" role="alert">
                {staffError}
              </p>

              <BookingDateTimeFields
                lang={lang}
                dateValue={state.selectedDate}
                timeValue={state.selectedTime}
                minDate={defaultSlot.date}
                dateLabel={copy.dateLabel}
                timeLabel={copy.timeLabel}
                datePlaceholder={copy.datePlaceholder}
                timePlaceholder={copy.timePlaceholder}
                onDateChange={(value) => {
                  setState((prev) => ({
                    ...prev,
                    selectedDate: value,
                  }))
                  setErrors([])
                }}
                onTimeChange={(value) => {
                  setState((prev) => ({
                    ...prev,
                    selectedTime: parseBookingTime(value),
                  }))
                  setErrors([])
                }}
              />
              <p className="field-error" id="date-error" role="alert">
                {dateError}
              </p>
              <p className="field-error" id="time-error" role="alert">
                {timeError}
              </p>

              <div className="sticky-action">
                <button
                  className="primary-button"
                  type="button"
                  data-action="next"
                  data-next-step="2"
                  onClick={() => goToStep(PUBLIC_BOOKING_STEP.review)}
                >
                  {copy.continue}{' '}
                  <span className="button-arrow" aria-hidden="true">
                    {copy.continueArrow}
                  </span>
                </button>
              </div>
            </section>
          )}

          {state.step === PUBLIC_BOOKING_STEP.review && (
            <section className="step-panel app-card" data-step-panel="2">
              <div className="card-heading">
                <div>
                  <h2>{copy.step2Heading}</h2>
                  <p>{copy.step2Copy}</p>
                </div>
              </div>

              <div className="review-summary">
                <dl className="review-list">
                  <div className="review-row">
                    <dt>{copy.reviewName}</dt>
                    <dd>{String(state.customer.name || '').trim() || copy.emDash}</dd>
                  </div>
                  <div className="review-row">
                    <dt>{copy.reviewPhone}</dt>
                    <dd>
                      {formatCustomerPhoneDisplay(state.customer.phone) || copy.emDash}
                    </dd>
                  </div>
                  <div className="review-row">
                    <dt>{copy.reviewServices}</dt>
                    <dd className="review-service-chips">
                      <ServiceChips
                        names={serviceNames}
                        emptyLabel={copy.emDash}
                      />
                    </dd>
                  </div>
                  <div className="review-row">
                    <dt>{copy.reviewStaff}</dt>
                    <dd>{staffName}</dd>
                  </div>
                  <div className="review-row">
                    <dt>{copy.reviewSlot}</dt>
                    <dd>
                      {formatBookingSlot(state.selectedDate, state.selectedTime, locale)}
                    </dd>
                  </div>
                </dl>
                <div className="review-divider" aria-hidden="true" />
                <div className="review-total">
                  <span>{copy.reviewTotal}</span>
                  <strong>{totalLabel}</strong>
                </div>
              </div>

              <label className="form-field" htmlFor="booking-note">
                <span>{copy.noteLabel}</span>
                <textarea
                  className="textarea"
                  id="booking-note"
                  placeholder={copy.notePlaceholder}
                  value={state.note}
                  maxLength={1000}
                  onChange={(event) =>
                    setState((prev) => ({ ...prev, note: event.target.value }))
                  }
                />
              </label>
              <p className="field-error" id="review-error" role="alert">
                {reviewError}
              </p>

              <div className="action-row">
                <button
                  className="secondary-button"
                  type="button"
                  data-action="back"
                  data-back-step="1"
                  disabled={createMutation.isPending}
                  onClick={() => goToStep(PUBLIC_BOOKING_STEP.form)}
                >
                  {copy.backEdit}
                </button>
                <button
                  className="primary-button"
                  type="button"
                  data-action="submit-booking"
                  disabled={createMutation.isPending}
                  onClick={submitBooking}
                >
                  {createMutation.isPending ? copy.submitting : copy.submit}
                </button>
              </div>
            </section>
          )}

          {state.step === PUBLIC_BOOKING_STEP.success && booking && (
            <section
              className="step-panel app-card success-card"
              data-step-panel="3"
            >
              <div className="success-icon" aria-hidden="true">
                {copy.successIcon}
              </div>
              <h2>{copy.successHeading}</h2>
              <p>{copy.successCopy(businessName)}</p>
              <div className="booking-code" aria-live="polite">
                {String(booking.leadId || '').toUpperCase()}
              </div>
              <dl className="success-detail">
                <div>
                  <dt>{copy.reviewSlot}</dt>
                  <dd>
                    {formatBookingSlot(state.selectedDate, state.selectedTime, locale)}
                  </dd>
                </div>
                <div>
                  <dt>{copy.reviewStaff}</dt>
                  <dd>{booking.staffName || copy.emDash}</dd>
                </div>
                <div>
                  <dt>{copy.reviewServices}</dt>
                  <dd className="success-service-chips">
                    <ServiceChips
                      names={successServiceNames}
                      emptyLabel={copy.emDash}
                    />
                  </dd>
                </div>
                <div>
                  <dt>{copy.reviewTotal}</dt>
                  <dd>{successTotalLabel}</dd>
                </div>
              </dl>
              <button
                className="secondary-button"
                type="button"
                data-action="new-booking"
                onClick={resetBooking}
              >
                {copy.newBooking}
              </button>
            </section>
          )}
        </main>

        <p
          className="screen-reader"
          id="booking-status"
          role="status"
          aria-live="polite"
        >
          {statusMessage}
        </p>
      </div>
    </div>
  )
}
