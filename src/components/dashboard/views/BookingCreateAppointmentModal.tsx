import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useCreateMerchantVoiceBooking,
  useMerchantVoiceConfig,
  useMerchantVoiceStaff,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  BookingUiStatus,
  MerchantVoiceStaffStatus,
  mapUiStatusToLeadStatusApi,
  type MerchantVoiceConfigServiceDto,
} from '../../../data/repositories/merchantVoice'
import {
  formatServicePrice,
  toStartTimeApi,
} from '../../../data/repositories/publicVoiceBooking'
import { getApiErrorCode } from '../../../types/domain'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import {
  CalendarKpiIcon,
  CalendarPlusIcon,
  CheckLgIcon,
  ClockIcon,
  SpinnerIcon,
  XLgIcon,
} from './BookingHubIcons'
import BookingHubDatePicker from './BookingHubDatePicker'
import {
  BOOKING_CREATE_NAME_MAX,
  BOOKING_CREATE_NOTE_MAX,
  BOOKING_CREATE_STAFF_PAGE_SIZE,
  BOOKING_CREATE_TIME_STEP_SECONDS,
  BOOKING_CREATE_TK,
  BOOKING_CREATE_UNASSIGNED_STAFF,
  BOOKING_CREATE_DISPLAY_SEPARATOR,
  BookingCreateField,
  BookingCreateVariant,
  getMinBookableClientLocalTime,
  isClientLocalDateBeforeToday,
  isClientLocalSlotPast,
  type BookingCreateCreatedSlot,
  type BookingCreateFieldErrors,
  type BookingCreatePrefill,
} from './bookingCreateConstants'
import {
  BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES,
  BOOKING_CALENDAR_UNASSIGNED_TECH,
  BOOKING_STATUS_FILTER_ORDER,
  BOOKING_STATUS_META,
  BookingAppointmentPanelState,
} from './bookingTodayConstants'
import { formatBookingHubDateDisplay, formatBookingHubTimeDisplay, openNativeDateTimePicker, toLocalDateIso } from './bookingHubFormatters'
import { applyAiHubProgressiveValidation } from './bookingHubDialogValidation'

const TK_TODAY = 'components.dashboard.views.BookingHubView.today'
const TK_HUB = 'components.dashboard.views.BookingHubView'

type Props = {
  open: boolean
  /** `Panel` embeds in the calendar side rail; `Modal` is the centered overlay. */
  variant?: BookingCreateVariant
  prefill: BookingCreatePrefill | null
  locale: string
  onClose: () => void
  onCreated?: (slot: BookingCreateCreatedSlot) => void
}

function ServiceChipSkeleton() {
  return (
    <div className="booking-create-service-skeleton" aria-hidden="true">
      {Array.from({ length: 4 }, (_, index) => (
        <span className="booking-create-skeleton-chip" key={index} />
      ))}
    </div>
  )
}

function StaffSelectSkeleton() {
  return <div className="booking-create-skeleton-select" aria-hidden="true" />
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <span className="booking-create-field-error" role="alert" aria-live="polite">
      {message}
    </span>
  )
}

export default function BookingCreateAppointmentModal({
  open,
  variant = BookingCreateVariant.Modal,
  prefill,
  locale,
  onClose,
  onCreated,
}: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createMutation = useCreateMerchantVoiceBooking()
  const isPanel = variant === BookingCreateVariant.Panel

  const configQuery = useMerchantVoiceConfig({ enabled: open })
  const staffQuery = useMerchantVoiceStaff(
    {
      pageNumber: 1,
      pageSize: BOOKING_CREATE_STAFF_PAGE_SIZE,
      status: MerchantVoiceStaffStatus.Active,
    },
    { enabled: open },
  )

  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState(`${PhoneDialCode.US} `)
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [staffId, setStaffId] = useState<string>(BOOKING_CREATE_UNASSIGNED_STAFF)
  const [status, setStatus] = useState<BookingUiStatus>(BookingUiStatus.New)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [notes, setNotes] = useState('')
  const [fieldErrors, setFieldErrors] = useState<BookingCreateFieldErrors>({})
  const [submitError, setSubmitError] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)

  const phoneParsed = useMemo(() => parsePhone(phone), [phone])
  const localeTag = `${locale}-u-hc-h12`

  const clearFieldError = (field: BookingCreateField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
    setSubmitError('')
  }

  const services = useMemo(() => {
    const rows = configQuery.data?.services ?? []
    return rows.filter((service) => service.isActive !== false && service.id)
  }, [configQuery.data?.services])

  const staffItems = staffQuery.data?.items ?? []

  // Always from the user's machine clock (works for any client timezone).
  const minDate = toLocalDateIso(new Date())
  const minTime = getMinBookableClientLocalTime(date) || undefined

  useEffect(() => {
    if (!open) return
    setCustomerName('')
    setPhone(`${PhoneDialCode.US} `)
    setSelectedServiceIds([])
    setStatus(BookingUiStatus.New)
    setNotes('')
    setFieldErrors({})
    setSubmitError('')

    const now = new Date()
    const today = toLocalDateIso(now)
    const nextDate = String(prefill?.date || '').trim()
    const nextTime = String(prefill?.time || '').trim()
    const dateOk = /^\d{4}-\d{2}-\d{2}$/.test(nextDate) && nextDate >= today
    setDate(dateOk ? nextDate : '')

    const timeOk = /^([01]\d|2[0-3]):([0-5]\d)$/.test(nextTime)
    if (dateOk && timeOk && !isClientLocalSlotPast(nextDate, nextTime, now)) {
      setTime(nextTime)
    } else {
      setTime('')
    }

    const preferredStaffId = String(prefill?.staffId || '').trim()
    const preferredStaffName = String(prefill?.staffName || '').trim()
    if (
      preferredStaffName
      && preferredStaffName !== BOOKING_CALENDAR_UNASSIGNED_TECH
      && !preferredStaffId
    ) {
      setStaffId(BOOKING_CREATE_UNASSIGNED_STAFF)
      return
    }
    setStaffId(preferredStaffId || BOOKING_CREATE_UNASSIGNED_STAFF)
  }, [open, prefill])

  // If user switches date to today while holding a past time, clear it (client-local).
  useEffect(() => {
    if (!open || !date || !time) return
    if (isClientLocalSlotPast(date, time)) setTime('')
  }, [open, date, time])

  useEffect(() => {
    if (!open || staffItems.length === 0) return
    const preferredStaffId = String(prefill?.staffId || '').trim()
    if (preferredStaffId && staffItems.some((item) => item.id === preferredStaffId)) {
      setStaffId(preferredStaffId)
      return
    }
    const preferredStaffName = String(prefill?.staffName || '').trim()
    if (!preferredStaffName || preferredStaffName === BOOKING_CALENDAR_UNASSIGNED_TECH) return
    const match = staffItems.find(
      (item) => item.fullName.trim().toLowerCase() === preferredStaffName.toLowerCase(),
    )
    if (match) setStaffId(match.id)
  }, [open, prefill, staffItems])

  useEffect(() => {
    // Panel rail stays on-page — only the modal overlay locks scroll.
    if (!open || isPanel) return undefined

    const scrollY = window.scrollY
    const { body } = document
    const previous = {
      overflow: body.style.overflow,
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
    }

    // iOS Safari ignores overflow:hidden alone — lock with position:fixed.
    body.style.overflow = 'hidden'
    body.style.position = 'fixed'
    body.style.top = `-${scrollY}px`
    body.style.width = '100%'

    return () => {
      body.style.overflow = previous.overflow
      body.style.position = previous.position
      body.style.top = previous.top
      body.style.width = previous.width
      window.scrollTo(0, scrollY)
    }
  }, [open, isPanel])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !createMutation.isPending) onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, onClose, createMutation.isPending])

  const selectedServices = useMemo(
    () => services.filter((service) => selectedServiceIds.includes(service.id)),
    [services, selectedServiceIds],
  )

  const totalPrice = selectedServices.reduce((sum, service) => sum + (service.price ?? 0), 0)
  const totalDuration = selectedServices.reduce(
    (sum, service) => sum + (service.durationMinutes ?? 0),
    0,
  )

  const toggleService = (service: MerchantVoiceConfigServiceDto) => {
    setSelectedServiceIds((prev) => (
      prev.includes(service.id)
        ? prev.filter((id) => id !== service.id)
        : [...prev, service.id]
    ))
    clearFieldError(BookingCreateField.Services)
  }

  const validateFields = (): BookingCreateFieldErrors => {
    const next: BookingCreateFieldErrors = {}
    const dialCode = phoneParsed.countryCode || PhoneDialCode.US
    const e164 = normalizePhoneE164(phone, dialCode)
    if (!isValidPhoneE164(e164, dialCode)) {
      next[BookingCreateField.Phone] = t(`${BOOKING_CREATE_TK}.errorPhone`)
    }
    if (!customerName.trim()) {
      next[BookingCreateField.Name] = t(`${BOOKING_CREATE_TK}.errorName`)
    }
    if (selectedServiceIds.length === 0) {
      next[BookingCreateField.Services] = t(`${BOOKING_CREATE_TK}.errorServices`)
    }
    if (!date) {
      next[BookingCreateField.Date] = t(`${BOOKING_CREATE_TK}.errorDate`)
    } else if (isClientLocalDateBeforeToday(date)) {
      next[BookingCreateField.Date] = t(`${BOOKING_CREATE_TK}.errorPastDate`)
    }
    if (!toStartTimeApi(time)) {
      next[BookingCreateField.Time] = t(`${BOOKING_CREATE_TK}.errorTime`)
    } else if (date && isClientLocalSlotPast(date, time)) {
      next[BookingCreateField.Time] = t(`${BOOKING_CREATE_TK}.errorPastTime`)
    }
    return next
  }

  const handleSave = async () => {
    const nextErrors = validateFields()
    setSubmitError('')
    if (
      applyAiHubProgressiveValidation({
        allErrors: nextErrors,
        root: dialogRef.current,
        setErrors: setFieldErrors,
        showToast,
        fieldLabels: {
          [BookingCreateField.Phone]: t(`${BOOKING_CREATE_TK}.phoneLabel`),
          [BookingCreateField.Name]: t(`${BOOKING_CREATE_TK}.nameLabel`),
          [BookingCreateField.Services]: t(`${BOOKING_CREATE_TK}.servicesLabel`),
          [BookingCreateField.Date]: t(`${BOOKING_CREATE_TK}.dateLabel`),
          [BookingCreateField.Time]: t(`${BOOKING_CREATE_TK}.timeLabel`),
        },
        hubTk: TK_HUB,
        t,
      })
    ) {
      return
    }
    const dialCode = phoneParsed.countryCode || PhoneDialCode.US
    const body = {
      customerName: customerName.trim(),
      customerPhone: normalizePhoneE164(phone, dialCode),
      serviceIds: selectedServiceIds,
      date,
      startTime: toStartTimeApi(time),
      status: mapUiStatusToLeadStatusApi(status),
      staffId: staffId || null,
      notes: notes.trim() || null,
    }

    try {
      await createMutation.mutateAsync(body)
      const savedName = customerName.trim()
      const whenLabel = [formatBookingHubDateDisplay(date, locale), formatBookingHubTimeDisplay(time, locale)]
        .filter(Boolean)
        .join(BOOKING_CREATE_DISPLAY_SEPARATOR)
      showToast(
        t(`${BOOKING_CREATE_TK}.success`, { name: savedName, when: whenLabel }),
        'success',
      )
      const staffName = staffId
        ? (staffItems.find((item) => item.id === staffId)?.fullName?.trim() || null)
        : (String(prefill?.staffName || '').trim() || null)
      onCreated?.({
        date,
        time,
        staffName: staffName && staffName !== BOOKING_CALENDAR_UNASSIGNED_TECH ? staffName : null,
        customerName: savedName,
        serviceNames: selectedServices.map((service) => service.name).filter(Boolean),
        durationMinutes: totalDuration > 0 ? totalDuration : BOOKING_CALENDAR_DEFAULT_DURATION_MINUTES,
        status,
      })
      onClose()
    } catch (err) {
      const code = getApiErrorCode(err)
      const message = code
        ? t(getErrorI18nKey(code))
        : (err instanceof Error && err.message
          ? err.message
          : t(`${BOOKING_CREATE_TK}.errorGeneric`))
      setSubmitError(message)
      showToast(message, 'error')
    }
  }

  if (!open) return null

  const isServicesLoading = configQuery.isLoading
  const isStaffLoading = staffQuery.isLoading

  const formBody = (
    <>
      <div className="booking-create-body">
        <div className="booking-create-grid">
          <div
            className={`booking-create-field${fieldErrors.phone ? ' has-error' : ''}`}
            data-ai-hub-field={BookingCreateField.Phone}
          >
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.phoneLabel`)}</span>
            <span className="phone-input-shell">
              <CountryCodeSelect
                value={phoneParsed.countryCode}
                embedded
                onChange={(nextCode) => {
                  const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                  setPhone(`${nextCode} ${formatted}`.trim())
                  clearFieldError(BookingCreateField.Phone)
                }}
              />
              <input
                className={`booking-input phone-mask-input${fieldErrors.phone ? ' has-error' : ''}`}
                type="tel"
                value={formatNationalNumber(
                  phoneParsed.nationalNumber,
                  phoneParsed.countryCode,
                )}
                placeholder={getNationalPhonePlaceholder(phoneParsed.countryCode)}
                inputMode="numeric"
                autoComplete="tel-national"
                aria-invalid={Boolean(fieldErrors.phone)}
                onChange={(event) => {
                  const formatted = formatNationalNumber(
                    event.target.value,
                    phoneParsed.countryCode,
                  )
                  setPhone(`${phoneParsed.countryCode} ${formatted}`.trim())
                  clearFieldError(BookingCreateField.Phone)
                }}
              />
            </span>
            <FieldError message={fieldErrors.phone} />
          </div>

          <div
            className={`booking-create-field${fieldErrors.name ? ' has-error' : ''}`}
            data-ai-hub-field={BookingCreateField.Name}
          >
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.nameLabel`)}</span>
            <input
              className={`booking-input${fieldErrors.name ? ' has-error' : ''}`}
              type="text"
              maxLength={BOOKING_CREATE_NAME_MAX}
              value={customerName}
              placeholder={t(`${BOOKING_CREATE_TK}.namePlaceholder`)}
              autoComplete="name"
              aria-invalid={Boolean(fieldErrors.name)}
              onChange={(event) => {
                setCustomerName(event.target.value)
                clearFieldError(BookingCreateField.Name)
              }}
            />
            <FieldError message={fieldErrors.name} />
          </div>

          <div
            className={`booking-create-field is-full${fieldErrors.services ? ' has-error' : ''}`}
            data-ai-hub-field={BookingCreateField.Services}
          >
            <span className="booking-create-label">
              {t(`${BOOKING_CREATE_TK}.servicesLabel`)}
              {' '}
              <span className="booking-create-hint">{t(`${BOOKING_CREATE_TK}.servicesHint`)}</span>
            </span>
            {isServicesLoading ? (
              <ServiceChipSkeleton />
            ) : services.length === 0 ? (
              <div className="booking-create-empty">{t(`${BOOKING_CREATE_TK}.servicesEmpty`)}</div>
            ) : (
              <div
                className="booking-service-chips"
                role="group"
                aria-label={t(`${BOOKING_CREATE_TK}.servicesAria`)}
                aria-invalid={Boolean(fieldErrors.services)}
              >
                {services.map((service) => {
                  const selected = selectedServiceIds.includes(service.id)
                  const duration = service.durationMinutes ?? 0
                  return (
                    <button
                      key={service.id}
                      className={`booking-service-chip-button${selected ? ' is-selected' : ''}`}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleService(service)}
                    >
                      {service.name}
                      {BOOKING_CREATE_DISPLAY_SEPARATOR}
                      {formatServicePrice(service.price)}
                      {BOOKING_CREATE_DISPLAY_SEPARATOR}
                      <span className="booking-service-duration">
                        {t(`${BOOKING_CREATE_TK}.durationMin`, { count: duration })}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
            <div className="booking-service-summary" aria-live="polite">
              <span className="booking-service-summary-item">
                <span className="booking-service-summary-label">
                  {t(`${BOOKING_CREATE_TK}.totalPrice`)}
                </span>
                {' '}
                <strong className="booking-service-summary-value">{formatServicePrice(totalPrice)}</strong>
              </span>
              <span className="booking-service-summary-item">
                <span className="booking-service-summary-label">
                  {t(`${BOOKING_CREATE_TK}.totalTime`)}
                </span>
                {' '}
                <strong className="booking-service-summary-value">
                  {t(`${BOOKING_CREATE_TK}.durationMin`, { count: totalDuration })}
                </strong>
              </span>
            </div>
            <FieldError message={fieldErrors.services} />
          </div>

          <label className="booking-create-field">
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.techLabel`)}</span>
            {isStaffLoading ? (
              <StaffSelectSkeleton />
            ) : (
              <select
                className="booking-select"
                value={staffId}
                onChange={(event) => setStaffId(event.target.value)}
              >
                <option value={BOOKING_CREATE_UNASSIGNED_STAFF}>
                  {t(`${BOOKING_CREATE_TK}.techUnassigned`)}
                </option>
                {staffItems.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.fullName}
                  </option>
                ))}
              </select>
            )}
          </label>

          <label className="booking-create-field">
            <span className="booking-create-label">{t(`${TK_TODAY}.colStatus`)}</span>
            <select
              className="booking-select"
              value={status}
              onChange={(event) => setStatus(event.target.value as BookingUiStatus)}
            >
              {BOOKING_STATUS_FILTER_ORDER.map((option) => (
                <option key={option} value={option}>
                  {t(`${TK_TODAY}.${BOOKING_STATUS_META[option].labelKey}`)}
                </option>
              ))}
            </select>
          </label>

          <div
            className={`booking-create-field${fieldErrors.date ? ' has-error' : ''}`}
            data-ai-hub-field={BookingCreateField.Date}
          >
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.dateLabel`)}</span>
            <BookingHubDatePicker
              className="booking-create-datetime-shell"
              value={date}
              minDate={minDate}
              locale={locale}
              hasError={Boolean(fieldErrors.date)}
              placeholder={t(`${BOOKING_CREATE_TK}.datePlaceholder`)}
              prevMonthAriaLabel={t(`${BOOKING_CREATE_TK}.prevMonth`)}
              nextMonthAriaLabel={t(`${BOOKING_CREATE_TK}.nextMonth`)}
              formatDisplay={formatBookingHubDateDisplay}
              onChange={(next) => {
                setDate(next)
                clearFieldError(BookingCreateField.Date)
              }}
              endAdornment={<CalendarKpiIcon className="booking-create-datetime-icon" />}
            />
            <FieldError message={fieldErrors.date} />
          </div>

          <div
            className={`booking-create-field${fieldErrors.time ? ' has-error' : ''}`}
            data-ai-hub-field={BookingCreateField.Time}
          >
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.timeLabel`)}</span>
            <span
              className={`booking-create-datetime-shell${time ? ' has-value' : ' is-empty'}${fieldErrors.time ? ' has-error' : ''}`}
              lang={localeTag}
            >
              <span className="booking-create-datetime-display" aria-hidden="true">
                {time
                  ? formatBookingHubTimeDisplay(time, locale)
                  : t(`${BOOKING_CREATE_TK}.timePlaceholder`)}
              </span>
              <ClockIcon className="booking-create-datetime-icon" />
              <input
                className={`booking-create-datetime-input${time ? ' has-value' : ' is-empty'}`}
                type="time"
                lang={localeTag}
                step={BOOKING_CREATE_TIME_STEP_SECONDS}
                min={minTime}
                value={time}
                aria-invalid={Boolean(fieldErrors.time)}
                aria-label={t(`${BOOKING_CREATE_TK}.timePlaceholder`)}
                onClick={(event) => {
                  const input = event.currentTarget
                  if (minTime) {
                    input.min = minTime
                    input.setAttribute('min', minTime)
                    if (time && minTime && time < minTime) {
                      setTime(minTime)
                      input.value = minTime
                    }
                  } else {
                    input.removeAttribute('min')
                  }
                  openNativeDateTimePicker(input)
                }}
                onChange={(event) => {
                  const next = event.target.value
                  setTime(minTime && next && next < minTime ? minTime : next)
                  clearFieldError(BookingCreateField.Time)
                }}
              />
            </span>
            <FieldError message={fieldErrors.time} />
          </div>

          <label className="booking-create-field is-full">
            <span className="booking-create-label">{t(`${BOOKING_CREATE_TK}.noteLabel`)}</span>
            <textarea
              className="booking-input"
              maxLength={BOOKING_CREATE_NOTE_MAX}
              value={notes}
              placeholder={t(`${BOOKING_CREATE_TK}.notePlaceholder`)}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
        </div>

        {submitError ? (
          <div className="booking-create-error" role="alert" aria-live="polite">
            {submitError}
          </div>
        ) : null}
      </div>

      <div className="booking-create-actions">
        <button
          className="booking-secondary-button"
          type="button"
          disabled={createMutation.isPending}
          onClick={onClose}
        >
          {t(`${BOOKING_CREATE_TK}.cancel`)}
        </button>
        <button
          className="booking-primary-button"
          type="button"
          disabled={createMutation.isPending || isServicesLoading}
          onClick={() => {
            void handleSave()
          }}
        >
          {createMutation.isPending ? <SpinnerIcon /> : <CheckLgIcon />}
          {createMutation.isPending
            ? t(`${BOOKING_CREATE_TK}.saving`)
            : t(`${BOOKING_CREATE_TK}.save`)}
        </button>
      </div>
    </>
  )

  if (isPanel) {
    return (
      <div
        className="booking-create-modal booking-create-modal--panel"
        data-booking-panel-state={BookingAppointmentPanelState.New}
      >
        <div
          ref={dialogRef}
          className="booking-create-dialog booking-create-dialog--panel"
          role="region"
          aria-labelledby="booking-create-title"
        >
          <div className="booking-create-head">
            <div>
              <div className="booking-create-title" id="booking-create-title">
                <CalendarPlusIcon />
                {' '}
                {t(`${BOOKING_CREATE_TK}.title`)}
              </div>
              <div className="booking-create-sub">{t(`${BOOKING_CREATE_TK}.subtitle`)}</div>
            </div>
            <button
              className="booking-panel-header-close booking-secondary-button icon-only"
              type="button"
              aria-label={t(`${BOOKING_CREATE_TK}.closeAria`)}
              title={t(`${BOOKING_CREATE_TK}.closeAria`)}
              disabled={createMutation.isPending}
              onClick={onClose}
            >
              <XLgIcon />
            </button>
          </div>
          {formBody}
        </div>
      </div>
    )
  }

  return (
    <div
      className="booking-create-modal"
      role="presentation"
      onClick={() => {
        if (!createMutation.isPending) onClose()
      }}
    >
      <div
        ref={dialogRef}
        className="booking-create-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="booking-create-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="booking-create-head">
          <div>
            <div className="booking-create-title" id="booking-create-title">
              <CalendarPlusIcon />
              {' '}
              {t(`${BOOKING_CREATE_TK}.title`)}
            </div>
            <div className="booking-create-sub">{t(`${BOOKING_CREATE_TK}.subtitle`)}</div>
          </div>
          <button
            className="booking-detail-close"
            type="button"
            aria-label={t(`${BOOKING_CREATE_TK}.closeAria`)}
            title={t(`${BOOKING_CREATE_TK}.closeAria`)}
            disabled={createMutation.isPending}
            onClick={onClose}
          >
            <XLgIcon />
          </button>
        </div>
        {formBody}
      </div>
    </div>
  )
}
