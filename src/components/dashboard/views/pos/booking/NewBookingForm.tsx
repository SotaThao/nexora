// NewBookingForm — POS Booking, Staff/Owner creates a booking directly (Ticket 3). Always
// created Confirmed immediately on the backend (bypasses Auto-Confirm, which only gates
// public bookings). Technician per service line is optional. A booking opened from a technician
// calendar column prefers that technician when they can perform the selected service; leaving
// it unassigned remains valid and the Owner can assign one manually later (see
// POS-Booking-Business.md, "Staff/Owner Creates a Booking").
import { useEffect, useState } from 'react'
import { Check, Loader2, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import CountryCodeSelect, {
  formatNationalNumber,
  getNationalPhonePlaceholder,
  normalizePhoneE164,
  PhoneDialCode,
} from '../../../../CountryCodeSelect'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { useCheckoutServiceCatalog } from '../../../../../data/hooks/usePosCheckout'
import { useAssignableStaffForService, useCustomerLookupByPhone } from '../../../../../data/hooks/usePosOrders'
import { useCreateStaffBooking } from '../../../../../data/hooks/usePosBooking'
import IconButton from '../../../../ui/IconButton'
import CategoryGroupedCatalogPicker from '../CategoryGroupedCatalogPicker'
import { randomUuid } from '../../../../../utils/uuid'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'

interface BookingLineDraft {
  key: string
  posServiceId: string
  serviceName: string
  unitPrice: number
  posStaffProfileId?: string
  preferredStaffId?: string | null
  preferredStaffName?: string | null
}

// Per-field validation (replaces the old single "please fill everything" banner) — each
// input gets its own inline message and clears as soon as the user edits that field, so a
// guest with e.g. only a missing email doesn't get told the whole form is incomplete.
enum NewBookingFormField {
  Name = 'name',
  Phone = 'phone',
  Email = 'email',
  Date = 'date',
  Time = 'time',
  Services = 'services',
}

type NewBookingFormErrors = Partial<Record<NewBookingFormField, string>>

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" aria-live="polite" className="mt-1 text-[9px] font-bold text-rose-500 sm:text-[10px]">
      {message}
    </p>
  )
}

// Per-line technician dropdown — a plain <select>, not the walk-in SelectTechniciansModal,
// because a booking has no "Next Available" auto-pick concept: leaving it blank always
// means "unassigned", never "resolve to a free technician at save time".
export function TechnicianSelect({
  businessId,
  posServiceId,
  value,
  onChange,
  unassignedLabel,
  preferredStaffId,
  preferredStaffName,
}: {
  businessId: string
  posServiceId: string
  value?: string
  onChange: (posStaffProfileId?: string) => void
  unassignedLabel: string
  preferredStaffId?: string | null
  preferredStaffName?: string | null
}) {
  const { data: staff = [] } = useAssignableStaffForService(businessId, posServiceId)
  useEffect(() => {
    if (value || (!preferredStaffId && !preferredStaffName)) return
    const matchingStaff = (
      (preferredStaffId
        ? staff.find((member) => member.posStaffProfileId === preferredStaffId)
        : undefined)
      ?? (preferredStaffName
        ? staff.find(
            (member) => member.displayName?.trim().toLocaleLowerCase()
              === preferredStaffName.trim().toLocaleLowerCase(),
          )
        : undefined)
    )
    if (matchingStaff) onChange(matchingStaff.posStaffProfileId)
  }, [onChange, preferredStaffId, preferredStaffName, staff, value])
  return (
    <select
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="h-8 w-full rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
    >
      <option value="">{unassignedLabel}</option>
      {staff.map((s) => (
        <option key={s.posStaffProfileId} value={s.posStaffProfileId}>
          {s.displayName}
        </option>
      ))}
    </select>
  )
}

export default function NewBookingForm({
  open,
  businessId,
  onClose,
  onCreated,
  initialSlot,
}: {
  open: boolean
  businessId: string
  onClose: () => void
  onCreated: (bookingId: string) => void
  initialSlot?: {
    date: string
    time: string
    staffName?: string | null
    posStaffProfileId?: string | null
  } | null
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const createBooking = useCreateStaffBooking(businessId)

  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  // The backend is the only phone parser now, and the dial code is the only way it can know
  // which country the number belongs to — a bare national number defaults to US.
  const [dialCode, setDialCode] = useState<string>(PhoneDialCode.US)
  const [customerEmail, setCustomerEmail] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [lines, setLines] = useState<BookingLineDraft[]>([])
  const [fieldErrors, setFieldErrors] = useState<NewBookingFormErrors>({})
  const [preferredStaffId, setPreferredStaffId] = useState<string | null>(null)
  const [preferredStaffName, setPreferredStaffName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return

    setPreferredStaffId(initialSlot?.posStaffProfileId ?? null)
    setPreferredStaffName(initialSlot?.staffName ?? null)
    if (!initialSlot) return

    setScheduledDate(initialSlot.date)
    setScheduledTime(initialSlot.time)
  }, [open, initialSlot])

  // Returning-customer hint (same lookup as the walk-in check-in's CustomerHeaderBar) —
  // only offers a Name prefill here since the lookup carries no email, and this is a
  // booking (no "last visit services" to reuse the way check-in does).
  const { data: lookup } = useCustomerLookupByPhone(businessId, customerPhone)

  if (!open) return null

  const reportError = (err: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
  }

  const resetForm = () => {
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setScheduledDate('')
    setScheduledTime('')
    setLines([])
    setFieldErrors({})
    setPreferredStaffId(null)
    setPreferredStaffName(null)
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const clearFieldError = (field: NewBookingFormField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const handleAddService = (itemId: string) => {
    const service = serviceCatalog.find((s) => s.id === itemId)
    if (!service) return
    setLines((prev) => [
      ...prev,
      {
        key: randomUuid(),
        posServiceId: service.id,
        serviceName: service.name,
        unitPrice: service.price,
        preferredStaffId,
        preferredStaffName,
      },
    ])
    clearFieldError(NewBookingFormField.Services)
  }

  const handleRemoveLine = (key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key))
  }

  const handleLineStaffChange = (key: string, posStaffProfileId?: string) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, posStaffProfileId } : l)))
  }

  const subtotal = lines.reduce((sum, l) => sum + l.unitPrice, 0)

  const validateFields = (): NewBookingFormErrors => {
    const errors: NewBookingFormErrors = {}
    const name = customerName.trim()
    const phone = customerPhone.trim()
    const email = customerEmail.trim()

    if (!name) errors[NewBookingFormField.Name] = t('components.dashboard.views.pos.NewBookingForm.errorName')
    if (!phone) errors[NewBookingFormField.Phone] = t('components.dashboard.views.pos.NewBookingForm.errorPhone')
    if (email && !EMAIL_PATTERN.test(email)) {
      errors[NewBookingFormField.Email] = t('components.dashboard.views.pos.NewBookingForm.errorEmail')
    }
    if (!scheduledDate) errors[NewBookingFormField.Date] = t('components.dashboard.views.pos.NewBookingForm.errorDate')
    if (!scheduledTime) errors[NewBookingFormField.Time] = t('components.dashboard.views.pos.NewBookingForm.errorTime')
    if (lines.length === 0) {
      errors[NewBookingFormField.Services] = t('components.dashboard.views.pos.NewBookingForm.errorServices')
    }
    return errors
  }

  const handleSubmit = () => {
    const errors = validateFields()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      const serviceError = errors[NewBookingFormField.Services]
      if (serviceError) showToast(serviceError, 'error')
      return
    }

    const name = customerName.trim()
    const phone = customerPhone.trim()

    // Built with Date.UTC (not the local-timezone Date constructor) so the picked
    // wall-clock numbers travel to the backend unshifted — PosBusinessOperatingHour/
    // PosStaffWeeklySchedule are plain TimeOnly values with no timezone concept
    // anywhere in this POS module (see BookingAvailabilityService), so a genuine
    // local-to-UTC conversion here would silently compare against the wrong hour.
    const [year, month, day] = scheduledDate.split('-').map(Number)
    const [hour, minute] = scheduledTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()

    createBooking.mutate(
      {
        customerName: name,
        customerPhone: normalizePhoneE164(phone, dialCode),
        customerEmail: customerEmail.trim() || undefined,
        scheduledAt,
        items: lines.map((l) => ({ posServiceId: l.posServiceId, posStaffProfileId: l.posStaffProfileId })),
      },
      {
        onSuccess: (bookingId) => {
          showToast(t('components.dashboard.views.pos.NewBookingForm.createSuccess'))
          resetForm()
          onCreated(bookingId)
        },
        onError: reportError,
      },
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <div role="dialog" aria-modal="true" aria-labelledby="new-booking-title" className="flex max-h-[min(800px,calc(100dvh-2rem))] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl">
        <div className="flex shrink-0 items-center justify-between border-b border-nexoraBorder bg-nexoraCanvas/70 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-nexoraBrandDark">Booking</p>
            <h2 id="new-booking-title" className="mt-1 text-lg font-extrabold tracking-tight text-nexoraText">
              {t('components.dashboard.views.pos.NewBookingForm.title')}
            </h2>
          </div>
          <IconButton label={t('components.dashboard.views.pos.NewBookingForm.close')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          <section className="pos-new-booking-customer-grid grid grid-cols-1 gap-2 bg-white sm:grid-cols-2 sm:gap-4 lg:grid-cols-[0.8fr_1fr_1fr_1.2fr]">
            <div>
              <label className="text-[9px] font-extrabold uppercase text-nexoraMuted sm:text-[10px]">
                {t('components.dashboard.views.pos.NewBookingForm.customerName')}
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value)
                  clearFieldError(NewBookingFormField.Name)
                }}
                aria-invalid={Boolean(fieldErrors.name)}
                className={`mt-0.5 h-9 w-full rounded-lg border bg-white px-3.5 text-[11px] text-nexoraText outline-none transition-all sm:mt-1 sm:h-10 sm:text-xs ${fieldErrors.name ? 'border-rose-400 focus:border-rose-400' : 'border-nexoraBorder focus:border-nexoraBrand'}`}
              />
              <FieldError message={fieldErrors.name} />
            </div>
            <div>
              <label className="text-[9px] font-extrabold uppercase text-nexoraMuted sm:text-[10px]">
                {t('components.dashboard.views.pos.NewBookingForm.customerPhone')}
              </label>
              <div className={`relative z-20 mt-0.5 flex h-9 overflow-visible rounded-lg border bg-white transition-colors [&_button]:text-[11px] [&_button_span]:text-[11px] sm:mt-1 sm:h-10 sm:[&_button]:text-xs sm:[&_button_span]:text-xs ${fieldErrors.phone ? 'border-rose-400' : 'border-nexoraBorder focus-within:border-nexoraBrand'}`}>
                <CountryCodeSelect
                  embedded
                  showSearch={false}
                  value={dialCode}
                  onChange={(code) => {
                    setDialCode(code)
                    setCustomerPhone(formatNationalNumber(customerPhone, code))
                  }}
                />
                <div className="min-w-0 flex-1">
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(formatNationalNumber(e.target.value, dialCode))
                      clearFieldError(NewBookingFormField.Phone)
                    }}
                    placeholder={getNationalPhonePlaceholder(dialCode)}
                    inputMode="numeric"
                    autoComplete="tel-national"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    className="h-full w-full border-0 bg-transparent px-3.5 text-[11px] text-nexoraText outline-none sm:text-xs"
                  />
                </div>
              </div>
              <FieldError message={fieldErrors.phone} />
            </div>
            <div>
              <label className="text-[9px] font-extrabold uppercase text-nexoraMuted sm:text-[10px]">
                {t('components.dashboard.views.pos.NewBookingForm.customerEmail')}
              </label>
              <input
                type="email"
                value={customerEmail}
                onChange={(e) => {
                  setCustomerEmail(e.target.value)
                  clearFieldError(NewBookingFormField.Email)
                }}
                aria-invalid={Boolean(fieldErrors.email)}
                className={`mt-0.5 h-9 w-full rounded-lg border bg-white px-3.5 text-[11px] text-nexoraText outline-none transition-all sm:mt-1 sm:h-10 sm:text-xs ${fieldErrors.email ? 'border-rose-400 focus:border-rose-400' : 'border-nexoraBorder focus:border-nexoraBrand'}`}
              />
              <FieldError message={fieldErrors.email} />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-extrabold uppercase text-nexoraMuted sm:text-[10px]">
                  {t('components.dashboard.views.pos.NewBookingForm.date')}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => {
                    setScheduledDate(e.target.value)
                    clearFieldError(NewBookingFormField.Date)
                  }}
                  aria-invalid={Boolean(fieldErrors.date)}
                  className={`mt-0.5 h-9 w-full rounded-lg border bg-white px-3.5 text-[11px] text-nexoraText outline-none transition-all sm:mt-1 sm:h-10 sm:text-xs ${fieldErrors.date ? 'border-rose-400 focus:border-rose-400' : 'border-nexoraBorder focus:border-nexoraBrand'}`}
                />
                <FieldError message={fieldErrors.date} />
              </div>
              <div>
                <label className="text-[9px] font-extrabold uppercase text-nexoraMuted sm:text-[10px]">
                  {t('components.dashboard.views.pos.NewBookingForm.time')}
                </label>
                <input
                  type="time"
                  lang={TWELVE_HOUR_INPUT_LANG}
                  value={scheduledTime}
                  onChange={(e) => {
                    setScheduledTime(e.target.value)
                    clearFieldError(NewBookingFormField.Time)
                  }}
                  aria-invalid={Boolean(fieldErrors.time)}
                  className={`mt-0.5 h-9 w-full rounded-lg border bg-white px-3.5 text-[11px] text-nexoraText outline-none transition-all sm:mt-1 sm:h-10 sm:text-xs ${fieldErrors.time ? 'border-rose-400 focus:border-rose-400' : 'border-nexoraBorder focus:border-nexoraBrand'}`}
                />
                <FieldError message={fieldErrors.time} />
              </div>
            </div>
          </section>

          {lookup && lookup.customerName && lookup.customerName !== customerName.trim() ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-nexoraBrand/15 bg-nexoraBrandSoft/50 px-3 py-2.5">
              <p className="min-w-0 truncate text-[11px] font-semibold text-nexoraText">
                {t('components.dashboard.views.pos.NewBookingForm.returningCustomerHint', {
                  name: lookup.customerName.toLocaleUpperCase(),
                })}
              </p>
              <button
                type="button"
                onClick={() => setCustomerName(lookup.customerName)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-nexoraBrand hover:bg-nexoraBrand hover:text-white"
              >
                <Check className="h-3 w-3" />
                {t('components.dashboard.views.pos.NewBookingForm.useName')}
              </button>
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
            <div className="lg:col-span-3">
              <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                {t('components.dashboard.views.pos.NewBookingForm.servicesTitle')}
              </h3>
              <CategoryGroupedCatalogPicker
                items={serviceCatalog}
                onAdd={handleAddService}
                addLabel={t('components.dashboard.views.pos.NewBookingForm.addButton')}
                emptyLabel={t('components.dashboard.views.pos.NewBookingForm.noServicesInCategory')}
                allCategoryLabel={t('components.dashboard.views.pos.NewBookingForm.allCategories')}
                uncategorizedLabel={t('components.dashboard.views.pos.NewBookingForm.uncategorized')}
                searchPlaceholder={t('components.dashboard.views.pos.NewBookingForm.searchServicesPlaceholder')}
              />
              <FieldError message={fieldErrors.services} />
            </div>

            {/* Persistent cart panel — stays visible alongside the catalog on wide screens
                (lg:col-span-2) instead of sitting below it in the same scroll flow, so adding
                services no longer pushes the running total off-screen. Its own line-item list
                is height-bounded with an internal scroll (mirrors PosOrderWorkspace's Order
                Detail panel) rather than growing the whole modal unboundedly. */}
            <div className="lg:col-span-2">
              <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-nexoraBorder bg-nexoraCanvas/60 px-4 py-3">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">{t('components.dashboard.views.pos.NewBookingForm.selectedServicesTitle')}</h3>
                  <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-extrabold text-nexoraBrandDark">{lines.length}</span>
                </div>

                <div className="space-y-2 p-3">

                {lines.length === 0 ? (
                  <p className="text-[11px] text-nexoraMuted">
                    {t('components.dashboard.views.pos.NewBookingForm.noServicesSelected')}
                  </p>
                ) : (
                  <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                    {lines.map((line) => (
                      <div key={line.key} className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas/40 p-2.5">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-nexoraText">
                            {line.serviceName} — ${line.unitPrice.toFixed(2)}
                          </p>
                          <div className="mt-1">
                            <TechnicianSelect
                              businessId={businessId}
                              posServiceId={line.posServiceId}
                              value={line.posStaffProfileId}
                              onChange={(staffId) => handleLineStaffChange(line.key, staffId)}
                              unassignedLabel={t('components.dashboard.views.pos.NewBookingForm.unassigned')}
                              preferredStaffId={line.preferredStaffId}
                              preferredStaffName={line.preferredStaffName}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLine(line.key)}
                          className="rounded-md p-1 text-nexoraMuted hover:text-rose-600"
                          aria-label={t('components.dashboard.views.pos.NewBookingForm.removeLine')}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-between border-t border-nexoraBorder pt-2 text-xs">
                  <span className="font-black uppercase text-nexoraText">
                    {t('components.dashboard.views.pos.NewBookingForm.estimatedTotal')}
                  </span>
                  <span className="font-black text-nexoraText">${subtotal.toFixed(2)}</span>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-nexoraBorder bg-white px-5 py-3 sm:px-6">
          <button
            type="button"
            onClick={handleClose}
            className="h-9 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:border-nexoraBrand hover:bg-nexoraCanvas"
          >
            {t('components.dashboard.views.pos.NewBookingForm.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createBooking.isPending}
            className="h-9 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            {createBooking.isPending ? (
              <Loader2 className="mx-auto h-4 w-4 animate-spin" />
            ) : (
              t('components.dashboard.views.pos.NewBookingForm.createButton')
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
