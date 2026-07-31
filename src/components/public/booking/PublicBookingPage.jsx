import { useEffect, useMemo, useState } from 'react'
import { ChevronDown, FolderOpen, Search, X } from 'lucide-react'
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
  PUBLIC_BOOKING_ANY_STAFF_ID,
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
  formatServiceChoicePrice,
  getDefaultBookingSlot,
  moneyFromCents,
  parseBookingTime,
  readBookingCustomerPrefill,
  resolveBookingFieldErrors,
  resolveBookingServiceNames,
  selectedServiceChipLabel,
  serviceMatchesSearchQuery,
  getServiceNameHighlightParts,
  validateBookingDraft,
} from './bookingUtils'
import BookingDateTimeFields from './BookingDateTimeFields'
import './public-booking.css'
import PublicBookingSkeleton from './PublicBookingSkeleton'

function ServiceNameLabel({ name, query }) {
  const parts = getServiceNameHighlightParts(name, query)
  if (!query.trim()) return name
  return parts.map((part, index) =>
    part.highlight ? (
      <mark key={`${part.text}-${index}`} className="service-search-mark">
        {part.text}
      </mark>
    ) : (
      <span key={`${part.text}-${index}`}>{part.text}</span>
    ),
  )
}

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
  const [state, setState] = useState(() => {
    const initial = createDefaultBookingState(defaultSlot)
    const prefill = readBookingCustomerPrefill(searchParams)
    if (!prefill.phone && !prefill.name) return initial
    return {
      ...initial,
      customer: {
        phone: prefill.phone || initial.customer.phone,
        name: prefill.name || initial.customer.name,
      },
    }
  })
  const [errors, setErrors] = useState([])
  const [statusMessage, setStatusMessage] = useState('')
  const [openCategoryIds, setOpenCategoryIds] = useState(() => new Set())
  const [serviceSearchQuery, setServiceSearchQuery] = useState('')

  const pageData = pageQuery.data
  const businessName = pageData?.businessName || businessKey
  const catalog = useMemo(
    () => ({
      services: pageData?.services || [],
      categories: pageData?.categories || [],
      staff: pageData?.staff || [],
      operatingHours: pageData?.operatingHours || [],
    }),
    [pageData],
  )
  const phoneParsed = useMemo(
    () => parsePhone(state.customer.phone || PhoneDialCode.US),
    [state.customer.phone],
  )

  const serviceCategories = useMemo(() => {
    if (catalog.categories.length > 0) return catalog.categories
    if (catalog.services.length === 0) return []
    return [
      {
        id: 'all-services',
        name: copy.otherCategoryName,
        description: '',
        isSystem: true,
        services: catalog.services,
      },
    ]
  }, [catalog.categories, catalog.services, copy.otherCategoryName])

  // Open only the first category by default when the catalog first loads / changes.
  const categoryIdsKey = serviceCategories.map((category) => category.id).join('|')
  useEffect(() => {
    if (!categoryIdsKey) {
      setOpenCategoryIds(new Set())
      return
    }
    const firstId = categoryIdsKey.split('|')[0]
    setOpenCategoryIds(new Set(firstId ? [firstId] : []))
  }, [categoryIdsKey])

  const serviceSearchNeedle = serviceSearchQuery.trim()
  const matchingServiceIds = useMemo(() => {
    if (!serviceSearchNeedle) return null
    const ids = new Set()
    serviceCategories.forEach((category) => {
      category.services.forEach((service) => {
        if (serviceMatchesSearchQuery(service.name, serviceSearchNeedle)) {
          ids.add(service.id)
        }
      })
    })
    return ids
  }, [serviceCategories, serviceSearchNeedle])

  // While searching, keep categories that contain matches expanded.
  useEffect(() => {
    if (!matchingServiceIds) return
    if (matchingServiceIds.size === 0) return
    setOpenCategoryIds((prev) => {
      const next = new Set(prev)
      serviceCategories.forEach((category) => {
        const hasMatch = category.services.some((service) =>
          matchingServiceIds.has(service.id),
        )
        if (hasMatch) next.add(category.id)
      })
      return next
    })
  }, [matchingServiceIds, serviceCategories])

  const toggleCategory = (categoryId) => {
    setOpenCategoryIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) next.delete(categoryId)
      else next.add(categoryId)
      return next
    })
  }

  // Apply SMS / deep-link prefill when query values change (new preview link).
  const prefillPhoneRaw = searchParams.get(PUBLIC_BOOKING_ROUTE.phoneQuery) || ''
  const prefillNameRaw = searchParams.get(PUBLIC_BOOKING_ROUTE.nameQuery) || ''
  useEffect(() => {
    const prefill = readBookingCustomerPrefill(searchParams)
    if (!prefill.phone && !prefill.name) return
    setState((prev) => ({
      ...prev,
      customer: {
        phone: prefill.phone || prev.customer.phone,
        name: prefill.name || prev.customer.name,
      },
    }))
  }, [prefillPhoneRaw, prefillNameRaw, searchParams])

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

  const selectedServices = state.selectedServiceIds
    .map((id) => catalog.services.find((service) => service.id === id))
    .filter(Boolean)
  const selectedStaff = catalog.staff.find(
    (staff) => staff.id === state.selectedStaffId,
  )
  const staffName =
    state.selectedStaffId === PUBLIC_BOOKING_ANY_STAFF_ID
      ? copy.anyStaffName
      : selectedStaff?.fullName || copy.emDash
  const customerName = String(state.customer.name || '').trim()

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
      selectedStaffId: id,
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
        body: buildCreateBookingBody(state),
        source: bookingSource,
      })
      const selectedNames = state.selectedServiceIds
        .map((id) => catalog.services.find((service) => service.id === id)?.name)
        .filter(Boolean)
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

              <div className="customer-fields" id="customer-fields">
                <label
                  className="form-field"
                  id="booking-phone-field"
                  htmlFor={PUBLIC_BOOKING_FIELD_ID.phone}
                >
                  <span>{copy.phoneLabel}</span>
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
                </label>

                <label
                  className="form-field"
                  id="booking-name-field"
                  htmlFor={PUBLIC_BOOKING_FIELD_ID.name}
                >
                  <span>{copy.nameLabel}</span>
                  <input
                    className="input"
                    id={PUBLIC_BOOKING_FIELD_ID.name}
                    type="text"
                    autoComplete="name"
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
                  <p className="field-error" id="name-error" role="alert">
                    {nameError}
                  </p>
                </label>
              </div>

              <div className="card-heading service-heading-row">
                <div>
                  <h2>{copy.step1ServiceHeading}</h2>
                </div>
                <div className="service-search-field">
                  <Search className="service-search-icon" aria-hidden="true" />
                  <input
                    type="text"
                    className={`service-search-input${serviceSearchQuery ? ' has-clear' : ''}`}
                    value={serviceSearchQuery}
                    placeholder={copy.serviceSearchPlaceholder}
                    aria-label={copy.serviceSearchAria}
                    autoComplete="off"
                    onChange={(event) =>
                      setServiceSearchQuery(event.target.value)
                    }
                  />
                  {serviceSearchQuery ? (
                    <button
                      type="button"
                      className="service-search-clear"
                      aria-label={copy.serviceSearchClearAria}
                      onClick={() => setServiceSearchQuery('')}
                    >
                      <X aria-hidden="true" />
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                className="service-category-list"
                id={PUBLIC_BOOKING_FIELD_ID.services}
                data-service-catalog
                aria-live="polite"
              >
                {serviceCategories.length === 0 ? (
                  <div className="service-catalog-loading">{copy.emptyServices}</div>
                ) : matchingServiceIds && matchingServiceIds.size === 0 ? (
                  <div className="service-catalog-loading">
                    {copy.serviceSearchEmpty}
                  </div>
                ) : (
                  serviceCategories.map((category) => {
                    const isOpen = openCategoryIds.has(category.id)
                    const panelId = `service-category-panel-${category.id}`
                    const categoryHasMatch =
                      !matchingServiceIds ||
                      category.services.some((service) =>
                        matchingServiceIds.has(service.id),
                      )
                    if (matchingServiceIds && !categoryHasMatch) return null
                    return (
                      <div
                        key={category.id}
                        className={`service-category${isOpen ? ' is-open' : ''}${matchingServiceIds && categoryHasMatch ? ' has-search-match' : ''}`}
                        data-service-category={category.id}
                      >
                        <button
                          type="button"
                          className="service-category-toggle"
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                          onClick={() => toggleCategory(category.id)}
                        >
                          <FolderOpen
                            className="service-category-icon"
                            aria-hidden="true"
                          />
                          <span
                            className="service-category-name"
                            data-service-category-name
                          >
                            {category.name}
                          </span>
                          <span
                            className="service-category-count"
                            data-service-category-count
                          >
                            {copy.categoryServiceCount(
                              matchingServiceIds
                                ? category.services.filter((service) =>
                                    matchingServiceIds.has(service.id),
                                  ).length
                                : category.services.length,
                            )}
                          </span>
                          <ChevronDown
                            className="service-category-chevron"
                            aria-hidden="true"
                          />
                        </button>
                        <div
                          className="service-category-body"
                          id={panelId}
                          role="region"
                          aria-hidden={!isOpen}
                        >
                          <div className="service-category-body-inner">
                            <div className="service-grid">
                              {category.services.map((service) => {
                                const selected =
                                  state.selectedServiceIds.includes(service.id)
                                const isMatch =
                                  matchingServiceIds?.has(service.id) === true
                                const isMiss =
                                  Boolean(matchingServiceIds) && !isMatch
                                if (isMiss) return null
                                return (
                                  <button
                                    key={`${category.id}-${service.id}`}
                                    className={`choice-card${isMatch ? ' is-search-match' : ''}`}
                                    type="button"
                                    data-service-id={service.id}
                                    aria-pressed={selected}
                                    tabIndex={isOpen ? 0 : -1}
                                    onClick={() => chooseService(service.id)}
                                  >
                                    <span className="choice-title">
                                      <ServiceNameLabel
                                        name={service.name}
                                        query={serviceSearchNeedle}
                                      />
                                    </span>
                                    <span className="choice-detail">
                                      <span>
                                        {copy.durationMinutes(
                                          service.durationMinutes || 0,
                                        )}
                                      </span>
                                      <strong className="choice-price">
                                        {formatServiceChoicePrice(
                                          service,
                                          copy.contactPrice,
                                        )}
                                      </strong>
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>

              {selectedServices.length > 0 ? (
                <div
                  className="selected-services"
                  id="selected-services"
                  aria-live="polite"
                >
                  <span className="selected-services-label">
                    {copy.selectedServicesLabel}
                  </span>
                  <div
                    className="selected-service-chips"
                    id="selected-service-chips"
                  >
                    {selectedServices.map((service) => {
                      const label = selectedServiceChipLabel(
                        service,
                        copy.otherCategoryName,
                      )
                      return (
                        <button
                          key={service.id}
                          className="selected-service-chip"
                          type="button"
                          data-remove-service-id={service.id}
                          aria-label={copy.removeServiceAria(label)}
                          onClick={() => chooseService(service.id)}
                        >
                          <span>{label}</span>
                          <X aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>
                </div>
              ) : null}

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
              <div className="staff-grid" id={PUBLIC_BOOKING_FIELD_ID.staff}>
                <button
                  className="choice-card staff-card"
                  type="button"
                  data-staff-id={PUBLIC_BOOKING_ANY_STAFF_ID}
                  aria-pressed={
                    state.selectedStaffId === PUBLIC_BOOKING_ANY_STAFF_ID
                  }
                  onClick={() => chooseStaff(PUBLIC_BOOKING_ANY_STAFF_ID)}
                >
                  <span className="choice-icon" aria-hidden="true">
                    ✨
                  </span>
                  <span className="choice-title">{copy.anyStaffName}</span>
                  <span className="staff-status">{copy.anyStaffStatus}</span>
                </button>
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
                  {customerName ? (
                    <div className="review-row" id="review-customer-name-row">
                      <dt>{copy.reviewName}</dt>
                      <dd>{customerName}</dd>
                    </div>
                  ) : null}
                  <div className="review-row">
                    <dt>{copy.reviewPhone}</dt>
                    <dd>
                      {formatCustomerPhoneDisplay(state.customer.phone) ||
                        copy.emDash}
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
                      {formatBookingSlot(
                        state.selectedDate,
                        state.selectedTime,
                        locale,
                      )}
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
                    {formatBookingSlot(
                      state.selectedDate,
                      state.selectedTime,
                      locale,
                    )}
                  </dd>
                </div>
                <div>
                  <dt>{copy.reviewStaff}</dt>
                  <dd>
                    {booking.staffName ||
                      (state.selectedStaffId === PUBLIC_BOOKING_ANY_STAFF_ID
                        ? copy.anyStaffName
                        : copy.emDash)}
                  </dd>
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
