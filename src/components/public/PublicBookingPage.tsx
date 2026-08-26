// PublicBookingPage — POS Booking, public wizard (Tickets 4-5). Anonymous, no login.
// Step 1 ("discovery"): salon branding. Published sites enter a dedicated "services" step;
// merchants without a published site keep the searchable/category-filtered service grid here. Adding
// a service with technicians prompts a picker popup to assign one (or "no preference") —
// per POS-Booking-Business.md's "Workflow: Customer Books Online" steps 1-4. Step 2
// ("datetime"): DateTimeStep. Step 3 ("contact"): name/phone/email. Step 4 ("confirmation"):
// ConfirmationScreen.
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Check, ChevronDown, Loader2, Plus, Search, Users, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { formatNationalNumber, getNationalPhonePlaceholder, isValidPhoneE164, PhoneDialCode } from '../CountryCodeSelect'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../../data/errorCodes'
import { matchesSearchQuery } from '../../utils/bookingSearch'
import { scrollToElementById } from '../../utils/scrollToElement'
import {
  usePublicBookingCustomerLookup,
  usePublicBookingPage,
  useCreatePublicBooking,
} from '../../data/hooks/usePublicBooking'
import { usePublicSiteQuery } from '../../data/hooks/usePublicSite'
import { SiteRenderer } from './site/SiteRenderer'
import { MerchantSiteStatus } from '../../constants/merchantSiteStatus'
import type { PublicSiteDto, PublicSiteRepositoryDto } from '../../constants/merchantSiteStatus'
import type {
  CreatePublicBookingResultApiDto,
  PublicBookingServiceApiDto,
  PublicBookingTechnicianApiDto,
} from '../../types/repositories'
import DateTimeStep from '../booking-public/DateTimeStep'
import ConfirmationScreen from '../booking-public/ConfirmationScreen'
import SmsConsentPanel from './booking/SmsConsentPanel'
import { SMS_CONSENT_DISCLOSURE_VERSION } from '../../constants/smsConsent'

type WizardStep = 'discovery' | 'services' | 'datetime' | 'contact' | 'confirmation'

/** DOM ids used for scroll-to-error on the contact step. */
const CONTACT_FIELD_ID = { name: 'booking-contact-name', phone: 'booking-contact-phone' } as const

interface SelectedLine {
  key: string
  posServiceId: string
  serviceName: string
  unitPrice: number
  durationMinutes: number
  posStaffProfileId?: string
}

function Avatar({ name, photoUrl }: { name: string; photoUrl?: string | null }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-bold text-nexoraText">
      {photoUrl ? <img src={photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" /> : initials}
    </span>
  )
}

interface ServiceCategoryGroup {
  categoryId: string
  categoryName: string
  services: PublicBookingServiceApiDto[]
}

/** Filter by name, then group by category. A service in multiple categories appears once per matching group. */
function groupServicesByCategory(
  services: PublicBookingServiceApiDto[],
  query: string,
  otherCategoryLabel: string,
): ServiceCategoryGroup[] {
  const filtered = services.filter((service) => matchesSearchQuery(service.name, query))
  const groups = new Map<string, ServiceCategoryGroup>()

  for (const service of filtered) {
    const categories = service.categories.length > 0 ? service.categories : [{ id: 'other', name: otherCategoryLabel }]
    for (const category of categories) {
      const group = groups.get(category.id)
      if (group) {
        group.services.push(service)
      } else {
        groups.set(category.id, { categoryId: category.id, categoryName: category.name, services: [service] })
      }
    }
  }

  return Array.from(groups.values())
}

/** Distinct categories across the full catalog (not the search-filtered subset) — chip filter list. */
function getAllServiceCategories(
  services: PublicBookingServiceApiDto[],
  otherCategoryLabel: string,
): { id: string; name: string }[] {
  const seen = new Map<string, string>()
  for (const service of services) {
    const categories = service.categories.length > 0 ? service.categories : [{ id: 'other', name: otherCategoryLabel }]
    for (const category of categories) {
      if (!seen.has(category.id)) seen.set(category.id, category.name)
    }
  }
  return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
}

function ServiceCard({
  service,
  expanded,
  onToggleExpand,
  selected,
  onToggleSelect,
  technicians,
}: {
  service: PublicBookingServiceApiDto
  expanded: boolean
  onToggleExpand: () => void
  selected: boolean
  onToggleSelect: () => void
  technicians: PublicBookingTechnicianApiDto[]
}) {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-[92px] flex-col justify-between gap-2 rounded-2xl border border-nexoraBorder bg-white p-3">
      <button type="button" onClick={onToggleExpand} className="flex-1 text-left">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-nexoraText">{service.name}</p>
        <p className="mt-1 text-xs text-nexoraMuted">
          ${service.price.toFixed(2)} · {service.durationMinutes} {t('public.booking.minutesAbbrev')}
        </p>
      </button>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="text-[10px] font-bold text-nexoraMuted hover:text-nexoraBrand"
        >
          {expanded ? t('public.booking.hideDetails') : t('public.booking.viewDetails')}
        </button>
        <button
          type="button"
          onClick={onToggleSelect}
          aria-label={selected ? t('public.booking.removeFromBooking') : t('public.booking.addToBooking')}
          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
            selected
              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
              : 'bg-nexoraCanvas text-nexoraBrand hover:bg-nexoraBrand hover:text-white'
          }`}
        >
          {selected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
        </button>
      </div>
      {expanded ? (
        <div className="space-y-2 border-t border-nexoraBorder pt-2">
          {service.description ? <p className="text-xs text-nexoraMuted">{service.description}</p> : null}
          <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t('public.booking.availableTechnicians')}
          </p>
          {technicians.length === 0 ? (
            <p className="text-xs text-nexoraMuted">{t('public.booking.noTechniciansForService')}</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {technicians.map((technician) => (
                <div
                  key={technician.id}
                  className="flex items-center gap-2 rounded-full border border-nexoraBorder px-2 py-1"
                >
                  <Avatar name={technician.displayName} photoUrl={technician.photoUrl} />
                  <span className="text-xs font-semibold text-nexoraText">{technician.displayName}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

function BookingSelectionSummary({
  selectedLines,
  techniciansForService,
  onChangeTechnician,
}: {
  selectedLines: SelectedLine[]
  techniciansForService: (serviceId: string) => PublicBookingTechnicianApiDto[]
  onChangeTechnician: (key: string, posStaffProfileId?: string) => void
}) {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)

  if (selectedLines.length === 0) return null

  const totalPrice = selectedLines.reduce((sum, l) => sum + l.unitPrice, 0)
  const totalDuration = selectedLines.reduce((sum, l) => sum + l.durationMinutes, 0)

  return (
    <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas p-3">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between gap-2"
      >
        <span className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
          {t('public.booking.selectedServicesTitle')} ({selectedLines.length})
        </span>
        <span className="flex items-center gap-1 text-[11px] font-bold text-nexoraText">
          ${totalPrice.toFixed(2)} · {totalDuration} {t('public.booking.minutesAbbrev')}
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? 'rotate-180' : ''}`} />
        </span>
      </button>
      {expanded ? (
        <div className="mt-2 space-y-2 border-t border-nexoraBorder pt-2">
          {selectedLines.map((line) => (
            <div key={line.key} className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-white p-2">
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-semibold text-nexoraText">
                  {line.serviceName} — ${line.unitPrice.toFixed(2)}
                </p>
                <select
                  value={line.posStaffProfileId ?? ''}
                  onChange={(e) => onChangeTechnician(line.key, e.target.value || undefined)}
                  className="mt-1 h-8 w-full rounded-lg border border-nexoraBorder bg-white px-2 text-[11px] text-nexoraText outline-none focus:border-nexoraBrand"
                >
                  <option value="">{t('public.booking.unassignedTechnician')}</option>
                  {techniciansForService(line.posServiceId).map((technician) => (
                    <option key={technician.id} value={technician.id}>
                      {technician.displayName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function TechnicianPickerModal({
  service,
  technicians,
  onSelect,
  onClose,
}: {
  service: PublicBookingServiceApiDto
  technicians: PublicBookingTechnicianApiDto[]
  onSelect: (technicianId?: string) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t('public.booking.pickTechnicianTitle')}
            </p>
            <p className="truncate text-sm font-bold text-nexoraText">{service.name}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('public.booking.closeButton')}
            className="shrink-0 text-nexoraMuted hover:text-nexoraText"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex-1 space-y-2 overflow-y-auto">
          <button
            type="button"
            onClick={() => onSelect(undefined)}
            className="flex w-full items-center gap-3 rounded-xl border border-nexoraBorder p-3 text-left hover:border-nexoraBrand"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-nexoraBrand">
              <Users className="h-4 w-4" />
            </span>
            <span className="text-sm font-bold text-nexoraText">{t('public.booking.anyTechnician')}</span>
          </button>
          {technicians.map((technician) => (
            <button
              key={technician.id}
              type="button"
              onClick={() => onSelect(technician.id)}
              className="flex w-full items-center gap-3 rounded-xl border border-nexoraBorder p-3 text-left hover:border-nexoraBrand"
            >
              <Avatar name={technician.displayName} photoUrl={technician.photoUrl} />
              <span className="text-sm font-bold text-nexoraText">{technician.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const WIZARD_STEP_ORDER: WizardStep[] = ['discovery', 'datetime', 'contact']

function StepIndicator({ current }: { current: WizardStep }) {
  const { t } = useTranslation()
  if (current === 'confirmation') return null
  const indicatorStep = current === 'services' ? 'discovery' : current

  const steps: { key: WizardStep; label: string }[] = [
    { key: 'discovery', label: t('public.booking.stepDiscovery') },
    { key: 'datetime', label: t('public.booking.stepDateTime') },
    { key: 'contact', label: t('public.booking.stepContact') },
  ]
  const currentIndex = WIZARD_STEP_ORDER.indexOf(indicatorStep)

  return (
    <div className="mb-4 flex items-center">
      {steps.map((step, index) => (
        <div key={step.key} className="flex flex-1 items-center last:flex-none">
          <div className="flex items-center gap-1.5">
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                index <= currentIndex
                  ? 'bg-nexoraBrand text-white'
                  : 'border border-nexoraBorder bg-white text-nexoraMuted'
              }`}
            >
              {index < currentIndex ? <Check className="h-3 w-3" /> : index + 1}
            </span>
            <span
              className={`hidden text-[10px] font-bold sm:inline ${
                index <= currentIndex ? 'text-nexoraText' : 'text-nexoraMuted'
              }`}
            >
              {step.label}
            </span>
          </div>
          {index < steps.length - 1 ? (
            <div className={`mx-2 h-0.5 flex-1 ${index < currentIndex ? 'bg-nexoraBrand' : 'bg-nexoraBorder'}`} />
          ) : null}
        </div>
      ))}
    </div>
  )
}

function PublicBookingShell({
  businessName,
  logoUrl,
  step,
  children,
}: {
  businessName?: string
  logoUrl?: string | null
  step?: WizardStep
  children: React.ReactNode
}) {
  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-2xl space-y-4">
        {businessName ? (
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : null}
            <h1 className="text-lg font-extrabold text-nexoraText">{businessName}</h1>
          </div>
        ) : null}
        <div className="nexora-card p-4">
          {step ? <StepIndicator current={step} /> : null}
          {children}
        </div>
      </div>
    </div>
  )
}

export default function PublicBookingPage() {
  const { businessSlug } = useParams<{ businessSlug: string }>()
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const { data, isLoading, isError } = usePublicBookingPage(businessSlug)
  const { data: publicSiteResult } = usePublicSiteQuery(businessSlug)
  const publicSite: PublicSiteRepositoryDto | null | undefined = publicSiteResult
  const createBooking = useCreatePublicBooking(businessSlug)
  const hasPublishedSite = publicSite?.status === MerchantSiteStatus.Published

  const publicSiteData = useMemo<PublicSiteDto | null>(() => {
    if (!publicSite) return null

    return {
      ...publicSite,
      businessName: data?.businessName.trim() || publicSite.businessName,
      phone: data?.businessPhone?.trim() || publicSite.phone,
      address: data?.businessAddress?.trim() || publicSite.address,
      services: data?.services.map(service => ({
        id: service.id,
        name: service.name,
        price: service.price,
        durationMinutes: service.durationMinutes,
        description: service.description ?? undefined,
        categoryName: service.categories.map(category => category.name).filter(Boolean).join(', ') || undefined,
      })),
      staffList: data?.technicians.map(technician => ({
        id: technician.id,
        name: technician.displayName,
        avatarUrl: technician.photoUrl,
      })),
      // PublicBookingPageApiDto has no business-hours field. Leaving this absent
      // prevents the renderer model from claiming hours that were never returned.
      businessHours: undefined,
    }
  }, [data, publicSite])

  const [serviceSearchQuery, setServiceSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('all')
  const [expandedServiceId, setExpandedServiceId] = useState<string | null>(null)
  const [technicianPickerService, setTechnicianPickerService] = useState<PublicBookingServiceApiDto | null>(null)
  const [selectedLines, setSelectedLines] = useState<SelectedLine[]>([])
  const [preferredTechnicianId, setPreferredTechnicianId] = useState<string | undefined>()
  const [step, setStep] = useState<WizardStep>('discovery')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  // Transactional starts pre-checked and required — PO decision overriding the earlier opt-in-only
  // design (unticking blocks submit below). Marketing stays unticked/optional; the customer-lookup
  // endpoint deliberately does not expose consent state, so this never reflects a previous booking.
  // Note: a pre-checked box is generally not valid opt-in consent under TCPA and diverges from the
  // "unticked checkbox" evidence Twilio's A2P reviewers expect — see
  // docs/business/sms-consent/sms-consent-technical.md.
  const [smsConsent, setSmsConsent] = useState({ transactional: true, marketing: false })
  const [customerEmail, setCustomerEmail] = useState('')
  const [contactFieldErrors, setContactFieldErrors] = useState<{ name?: string; phone?: string }>({})
  const [bookingResult, setBookingResult] = useState<CreatePublicBookingResultApiDto | null>(null)

  // Returning-customer contact-step prefill (Customer entity unification) — same lookup as
  // the POS Merchant check-in's CustomerHeaderBar, public/anonymous variant.
  const { data: customerLookup } = usePublicBookingCustomerLookup(businessSlug, customerPhone)

  const allServiceCategories = useMemo(
    () => getAllServiceCategories(data?.services ?? [], t('public.booking.otherCategoryLabel')),
    [data?.services, t],
  )

  const groupedServices = useMemo(() => {
    const groups = groupServicesByCategory(data?.services ?? [], serviceSearchQuery, t('public.booking.otherCategoryLabel'))
    return selectedCategoryId === 'all' ? groups : groups.filter((group) => group.categoryId === selectedCategoryId)
  }, [data?.services, serviceSearchQuery, selectedCategoryId, t])

  // Floating cart badge (discovery step only) — tracks whether the selection summary at the
  // bottom of the long service list is currently scrolled into view.
  const summaryRef = useRef<HTMLDivElement | null>(null)
  const [summaryVisible, setSummaryVisible] = useState(true)

  useEffect(() => {
    const el = summaryRef.current
    if ((step !== 'discovery' && step !== 'services') || !el) {
      setSummaryVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setSummaryVisible(entry.isIntersecting), { threshold: 0 })
    observer.observe(el)
    return () => observer.disconnect()
  }, [step, selectedLines.length])

  // Opts this page out of the app-wide brand-purple :focus-visible ring (src/index.css) so a
  // keyboard-focused time slot (DateTimeStep) doesn't look identical to a selected one — same
  // exemption class the /b/:businessKey public booking flow already uses.
  useEffect(() => {
    document.body.classList.add('public-booking-active')
    return () => document.body.classList.remove('public-booking-active')
  }, [])

  useEffect(() => {
    if (publicSite?.businessName) {
      document.title = `${publicSite.businessName} — Đặt Lịch Hẹn & Dịch Vụ Online`
    } else if (data?.businessName) {
      document.title = `${data.businessName} — Book Online`
    }
  }, [publicSite, data])

  if (isLoading) {
    return (
      <PublicBookingShell>
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
        </div>
      </PublicBookingShell>
    )
  }

  if (publicSiteData && hasPublishedSite && step === 'discovery') {
    return (
      <SiteRenderer
        site={publicSiteData}
        onBookClick={() => {
          setStep('services')
        }}
        onSelectService={(serviceName) => {
          const normalizedServiceName = serviceName.trim().toLocaleLowerCase()
          const match = data?.services.find(
            service => service.name.trim().toLocaleLowerCase() === normalizedServiceName,
          )
          if (match) {
            setSelectedLines((previousLines) => {
              if (previousLines.some(line => line.posServiceId === match.id)) return previousLines

              const preferredTechnicianAvailable = preferredTechnicianId
                && data?.technicians.some(
                  technician => technician.id === preferredTechnicianId
                    && technician.serviceIds.includes(match.id),
                )
              return [
                ...previousLines,
                {
                  key: crypto.randomUUID(),
                  posServiceId: match.id,
                  serviceName: match.name,
                  unitPrice: match.price,
                  durationMinutes: match.durationMinutes,
                  posStaffProfileId: preferredTechnicianAvailable ? preferredTechnicianId : undefined,
                },
              ]
            })
          }
          setStep('services')
        }}
        onSelectStaff={(staffName) => {
          const normalizedStaffName = staffName.trim().toLocaleLowerCase()
          const staffMatch = data?.technicians.find(
            technician => technician.displayName.trim().toLocaleLowerCase() === normalizedStaffName,
          )
          if (!staffMatch) {
            showToast(t('errors.voice_tenant_staff_not_found'), 'error')
            setStep('services')
            return
          }

          setPreferredTechnicianId(staffMatch.id)
          const hasIncompatibleSelection = selectedLines.some(
            line => !staffMatch.serviceIds.includes(line.posServiceId),
          )
          setSelectedLines(previousLines => previousLines.map(line => (
            staffMatch.serviceIds.includes(line.posServiceId)
              ? { ...line, posStaffProfileId: staffMatch.id }
              : line
          )))
          if (hasIncompatibleSelection) {
            showToast(t('components.PosOrderWorkspace.SelectTechniciansModal.noStaff'), 'error')
          }
          setStep('services')
        }}
      />
    )
  }

  if (isError || !data) {
    return (
      <PublicBookingShell businessName={publicSite?.businessName}>
        <div className="px-4 py-10 text-center">
          <p className="text-sm font-bold text-nexoraText">{t('public.booking.notFoundTitle')}</p>
          <p className="mt-1 text-xs text-nexoraMuted">{t('public.booking.notFoundDesc')}</p>
          {publicSite && step !== 'discovery' ? (
            <button
              type="button"
              onClick={() => setStep('discovery')}
              className="mt-4 h-10 w-full rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
            >
              {t('public.booking.backButton')}
            </button>
          ) : null}
        </div>
      </PublicBookingShell>
    )
  }

  const techniciansForService = (serviceId: string): PublicBookingTechnicianApiDto[] =>
    data.technicians.filter((technician) => technician.serviceIds.includes(serviceId))

  const isSelected = (serviceId: string) => selectedLines.some((l) => l.posServiceId === serviceId)

  const toggleService = (serviceId: string) => {
    if (isSelected(serviceId)) {
      setSelectedLines((prev) => prev.filter((l) => l.posServiceId !== serviceId))
      return
    }
    const service = data.services.find((s) => s.id === serviceId)
    if (!service) return
    setSelectedLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        posServiceId: service.id,
        serviceName: service.name,
        unitPrice: service.price,
        durationMinutes: service.durationMinutes,
      },
    ])
  }

  // "By Service" tab add click: if the service has technicians to pick from, prompt via
  // popup instead of adding silently with no technician — more visual than the old
  // expand-to-see-avatar-chips flow, and avoids a round trip through the summary dropdown.
  const handleServiceAddClick = (service: PublicBookingServiceApiDto) => {
    if (isSelected(service.id)) {
      toggleService(service.id)
      return
    }
    const preferredTechnicianAvailable = preferredTechnicianId
      && techniciansForService(service.id).some(
        technician => technician.id === preferredTechnicianId,
      )
    if (preferredTechnicianAvailable) {
      addServiceWithTechnician(service.id, preferredTechnicianId)
      return
    }
    if (techniciansForService(service.id).length === 0) {
      toggleService(service.id)
      return
    }
    setTechnicianPickerService(service)
  }

  const handleTechnicianPicked = (technicianId?: string) => {
    if (!technicianPickerService) return
    if (technicianId) {
      addServiceWithTechnician(technicianPickerService.id, technicianId)
    } else {
      toggleService(technicianPickerService.id)
    }
    setTechnicianPickerService(null)
  }

  const setLineTechnician = (key: string, posStaffProfileId?: string) => {
    setSelectedLines((prev) => prev.map((l) => (l.key === key ? { ...l, posStaffProfileId } : l)))
  }

  const addServiceWithTechnician = (serviceId: string, technicianId: string) => {
    const existing = selectedLines.find((l) => l.posServiceId === serviceId)
    if (existing) {
      setLineTechnician(existing.key, technicianId)
      return
    }
    const service = data.services.find((s) => s.id === serviceId)
    if (!service) return
    setSelectedLines((prev) => [
      ...prev,
      {
        key: crypto.randomUUID(),
        posServiceId: service.id,
        serviceName: service.name,
        unitPrice: service.price,
        durationMinutes: service.durationMinutes,
        posStaffProfileId: technicianId,
      },
    ])
  }

  const handleDateTimeContinue = (date: string, time: string) => {
    setSelectedDate(date)
    setSelectedTime(time)
    setStep('contact')
  }

  const reportError = (err: unknown) => {
    showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
  }

  const handleSubmit = () => {
    const name = customerName.trim()
    const phone = customerPhone.trim()

    const errors: { name?: string; phone?: string } = {}
    if (!name) errors.name = t('public.booking.nameRequired')
    if (!phone) errors.phone = t('public.booking.phoneRequired')
    else if (!isValidPhoneE164(phone, PhoneDialCode.US)) errors.phone = t('public.booking.invalidPhone')

    setContactFieldErrors(errors)
    if (errors.name || errors.phone) {
      scrollToElementById(errors.name ? CONTACT_FIELD_ID.name : CONTACT_FIELD_ID.phone)
      return
    }

    const [year, month, day] = selectedDate.split('-').map(Number)
    const [hour, minute] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute)).toISOString()

    createBooking.mutate(
      {
        customerName: name,
        customerPhone: phone,
        customerEmail: customerEmail.trim() || undefined,
        scheduledAt,
        items: selectedLines.map((l) => ({ posServiceId: l.posServiceId, posStaffProfileId: l.posStaffProfileId })),
        transactionalConsent: smsConsent.transactional,
        marketingConsent: smsConsent.marketing,
        disclosureVersion: SMS_CONSENT_DISCLOSURE_VERSION,
        locale: currentLanguage,
        sourceUrl: window.location.href,
      },
      {
        onSuccess: (result) => {
          setBookingResult(result)
          setStep('confirmation')
        },
        onError: reportError,
      },
    )
  }

  if (step === 'confirmation' && bookingResult) {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const [hour, minute] = selectedTime.split(':').map(Number)
    const scheduledAt = new Date(Date.UTC(year, month - 1, day, hour, minute))
    const maxDuration = Math.max(...selectedLines.map((l) => l.durationMinutes))

    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl} step={step}>
        <ConfirmationScreen
          businessName={data.businessName}
          businessAddress={data.businessAddress}
          businessPhone={data.businessPhone}
          status={bookingResult.status}
          scheduledAt={scheduledAt}
          durationMinutes={maxDuration}
          serviceNames={selectedLines.map((l) => l.serviceName)}
          technicianNames={Array.from(
            new Set(
              selectedLines
                .map((l) => data.technicians.find((technician) => technician.id === l.posStaffProfileId)?.displayName)
                .filter((name): name is string => Boolean(name)),
            ),
          )}
          totalPrice={selectedLines.reduce((sum, l) => sum + l.unitPrice, 0)}
          bookingId={bookingResult.bookingId}
          manageToken={bookingResult.manageToken}
          smsOptedOut={!smsConsent.transactional}
          onDone={() => {
            setSelectedLines([])
            setSelectedDate('')
            setSelectedTime('')
            setCustomerName('')
            setCustomerPhone('')
            setCustomerEmail('')
            setSmsConsent({ transactional: true, marketing: false })
            setContactFieldErrors({})
            setBookingResult(null)
            setPreferredTechnicianId(undefined)
            setStep('discovery')
          }}
        />
      </PublicBookingShell>
    )
  }

  if (step === 'datetime') {
    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl} step={step}>
        <div className="space-y-4">
          <BookingSelectionSummary
            selectedLines={selectedLines}
            techniciansForService={techniciansForService}
            onChangeTechnician={setLineTechnician}
          />
          <DateTimeStep
            businessSlug={businessSlug as string}
            items={selectedLines.map((l) => ({ posServiceId: l.posServiceId, posStaffProfileId: l.posStaffProfileId }))}
            onContinue={handleDateTimeContinue}
            onBack={() => setStep(hasPublishedSite ? 'services' : 'discovery')}
          />
        </div>
      </PublicBookingShell>
    )
  }

  if (step === 'contact') {
    return (
      <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl} step={step}>
        <div className="space-y-4">
          <BookingSelectionSummary
            selectedLines={selectedLines}
            techniciansForService={techniciansForService}
            onChangeTechnician={setLineTechnician}
          />
          <h2 className="text-sm font-extrabold text-nexoraText">{t('public.booking.contactTitle')}</h2>
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerName')}
            </label>
            <input
              id={CONTACT_FIELD_ID.name}
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              aria-invalid={Boolean(contactFieldErrors.name)}
              aria-describedby={contactFieldErrors.name ? `${CONTACT_FIELD_ID.name}-error` : undefined}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand ${
                contactFieldErrors.name ? 'border-rose-400' : 'border-nexoraBorder'
              }`}
            />
            {contactFieldErrors.name ? (
              <p id={`${CONTACT_FIELD_ID.name}-error`} role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
                {contactFieldErrors.name}
              </p>
            ) : null}
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerPhone')}
            </label>
            <input
              id={CONTACT_FIELD_ID.phone}
              type="tel"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(formatNationalNumber(e.target.value, PhoneDialCode.US))}
              placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}
              inputMode="numeric"
              autoComplete="tel-national"
              aria-invalid={Boolean(contactFieldErrors.phone)}
              aria-describedby={contactFieldErrors.phone ? `${CONTACT_FIELD_ID.phone}-error` : undefined}
              className={`h-10 w-full rounded-lg border bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand ${
                contactFieldErrors.phone ? 'border-rose-400' : 'border-nexoraBorder'
              }`}
            />
            {contactFieldErrors.phone ? (
              <p id={`${CONTACT_FIELD_ID.phone}-error`} role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
                {contactFieldErrors.phone}
              </p>
            ) : null}
          </div>
          {customerLookup && customerLookup.customerName
          && customerLookup.customerName !== customerName.trim() ? (
            <div className="flex items-center justify-between gap-3 rounded-lg bg-nexoraCanvas px-3 py-2">
              <p className="min-w-0 truncate text-[11px] font-semibold text-nexoraText">
                {t('public.booking.returningCustomerHint', { name: customerLookup.customerName })}
              </p>
              <button
                type="button"
                onClick={() => setCustomerName(customerLookup.customerName)}
                className="flex shrink-0 items-center gap-1 rounded-lg border border-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-nexoraBrand hover:bg-nexoraBrand hover:text-white"
              >
                <Check className="h-3 w-3" />
                {t('public.booking.useName')}
              </button>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-[10px] font-extrabold uppercase text-nexoraMuted">
              {t('public.booking.customerEmail')}
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              className="h-10 w-full rounded-lg border border-nexoraBorder bg-white px-3.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
          <SmsConsentPanel
            transactional={smsConsent.transactional}
            marketing={smsConsent.marketing}
            onChange={setSmsConsent}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep('datetime')}
              className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
            >
              {t('public.booking.backButton')}
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={createBooking.isPending || !smsConsent.transactional}
              className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {createBooking.isPending ? (
                <Loader2 className="mx-auto h-4 w-4 animate-spin" />
              ) : (
                t('public.booking.confirmButton')
              )}
            </button>
          </div>
        </div>
      </PublicBookingShell>
    )
  }

  return (
    <PublicBookingShell businessName={data.businessName} logoUrl={data.logoUrl} step={step}>
      {step === 'services' ? (
        <button
          type="button"
          onClick={() => setStep('discovery')}
          className="mb-4 h-10 w-full rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
        >
          {t('public.booking.backButton')}
        </button>
      ) : null}
      {data.services.length === 0 ? (
        <p className="py-6 text-center text-xs text-nexoraMuted">{t('public.booking.noServices')}</p>
      ) : (
        <div className="space-y-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
              <input
                type="text"
                value={serviceSearchQuery}
                onChange={(e) => setServiceSearchQuery(e.target.value)}
                placeholder={t('public.booking.serviceSearchPlaceholder')}
                aria-label={t('public.booking.serviceSearchPlaceholder')}
                className="h-10 w-full rounded-lg border border-nexoraBorder bg-white pl-9 pr-9 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
              />
              {serviceSearchQuery ? (
                <button
                  type="button"
                  onClick={() => setServiceSearchQuery('')}
                  aria-label={t('public.booking.serviceSearchClearAria')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nexoraMuted hover:text-nexoraText"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>

            {allServiceCategories.length > 1 ? (
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryId('all')}
                  className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                    selectedCategoryId === 'all'
                      ? 'bg-nexoraBrand text-white'
                      : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
                  }`}
                >
                  {t('public.booking.allCategoriesLabel')}
                </button>
                {allServiceCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => setSelectedCategoryId(category.id)}
                    className={`rounded-full px-3.5 py-2 text-xs font-bold transition ${
                      selectedCategoryId === category.id
                        ? 'bg-nexoraBrand text-white'
                        : 'bg-nexoraCanvas text-nexoraMuted hover:text-nexoraText'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            ) : null}

            {groupedServices.length === 0 ? (
              <p className="py-6 text-center text-xs text-nexoraMuted">{t('public.booking.serviceSearchEmpty')}</p>
            ) : (
              groupedServices.map((group) => (
                <div key={group.categoryId} className="space-y-2">
                  {selectedCategoryId === 'all' ? (
                    <h3 className="sticky top-0 bg-nexoraCanvas py-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {group.categoryName}
                    </h3>
                  ) : null}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {group.services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        expanded={expandedServiceId === service.id}
                        onToggleExpand={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)}
                        selected={isSelected(service.id)}
                        onToggleSelect={() => handleServiceAddClick(service)}
                        technicians={techniciansForService(service.id)}
                      />
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
      )}

      {selectedLines.length > 0 ? (
        <div ref={summaryRef} className="mt-4 space-y-2 border-t border-nexoraBorder pt-4">
          <BookingSelectionSummary
            selectedLines={selectedLines}
            techniciansForService={techniciansForService}
            onChangeTechnician={setLineTechnician}
          />
          <button
            type="button"
            onClick={() => setStep('datetime')}
            className="h-10 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t('public.booking.continueButton')}
          </button>
        </div>
      ) : null}

      {selectedLines.length > 0 && !summaryVisible ? (
        <button
          type="button"
          onClick={() => summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
          style={{ bottom: 'max(1rem, env(safe-area-inset-bottom))' }}
          className="fixed inset-x-4 z-20 mx-auto flex h-12 max-w-md items-center justify-between rounded-full bg-nexoraBrand px-5 text-xs font-bold text-white shadow-lg"
        >
          <span>{t('public.booking.floatingCartCount', { count: selectedLines.length })}</span>
          <span>${selectedLines.reduce((sum, l) => sum + l.unitPrice, 0).toFixed(2)}</span>
        </button>
      ) : null}

      {technicianPickerService ? (
        <TechnicianPickerModal
          service={technicianPickerService}
          technicians={techniciansForService(technicianPickerService.id)}
          onSelect={handleTechnicianPicked}
          onClose={() => setTechnicianPickerService(null)}
        />
      ) : null}
    </PublicBookingShell>
  )
}
