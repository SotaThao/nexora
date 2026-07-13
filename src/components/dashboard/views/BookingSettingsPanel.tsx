import React, { useEffect, useMemo, useState } from 'react'
import CountryCodeSelect, { formatNationalNumber, normalizePhoneForApi, parsePhone } from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import {
  useMerchantVoiceConfig,
  useUpdateMerchantVoiceConfig,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  mapConfigLanguageToUiLanguage,
  mapUiLanguageToConfigLanguage,
  MerchantVoiceConfigLanguage,
  MerchantVoiceDayOfWeek,
  MerchantVoiceUiLanguage,
  normalizeMerchantVoiceDayOfWeek,
} from '../../../data/repositories/merchantVoice'
import { getApiErrorCode } from '../../../types/domain'
import { loadSpeechVoices, speakBookingPreview, stopBookingPreview } from '../../../utils/bookingVoicePreview'
import {
  ClockHistoryIcon,
  CurrencyDollarIcon,
  LightningIcon,
  PlusIcon,
  ShopIcon,
  SpinnerIcon,
  StarsIcon,
} from './BookingHubIcons'
import { BookingSettingsSkeleton } from './BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'

const TK = 'components.dashboard.views.BookingHubView.settings'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
type DayKey = (typeof DAY_KEYS)[number]
type Language = MerchantVoiceUiLanguage
type Tone = 'tone-violet' | 'tone-cyan' | 'tone-rose' | 'tone-sky' | 'tone-amber' | 'tone-emerald'

const DAY_KEY_TO_API: Record<DayKey, MerchantVoiceDayOfWeek> = {
  mon: MerchantVoiceDayOfWeek.Monday,
  tue: MerchantVoiceDayOfWeek.Tuesday,
  wed: MerchantVoiceDayOfWeek.Wednesday,
  thu: MerchantVoiceDayOfWeek.Thursday,
  fri: MerchantVoiceDayOfWeek.Friday,
  sat: MerchantVoiceDayOfWeek.Saturday,
  sun: MerchantVoiceDayOfWeek.Sunday,
}

const API_DAY_TO_DAY_KEY: Partial<Record<MerchantVoiceDayOfWeek, DayKey>> = {
  [MerchantVoiceDayOfWeek.Monday]: 'mon',
  [MerchantVoiceDayOfWeek.Tuesday]: 'tue',
  [MerchantVoiceDayOfWeek.Wednesday]: 'wed',
  [MerchantVoiceDayOfWeek.Thursday]: 'thu',
  [MerchantVoiceDayOfWeek.Friday]: 'fri',
  [MerchantVoiceDayOfWeek.Saturday]: 'sat',
  [MerchantVoiceDayOfWeek.Sunday]: 'sun',
}

interface HourRow {
  open: boolean
  openTime: string
  closeTime: string
}

interface ServiceRow {
  id: string
  icon: string
  tone: Tone
  name: string
  price: number
  duration: number
}

const INITIAL_HOURS: Record<DayKey, HourRow> = {
  mon: { open: true, openTime: '07:00', closeTime: '21:00' },
  tue: { open: true, openTime: '07:00', closeTime: '21:00' },
  wed: { open: true, openTime: '07:00', closeTime: '21:00' },
  thu: { open: true, openTime: '07:00', closeTime: '21:00' },
  fri: { open: true, openTime: '07:00', closeTime: '21:00' },
  sat: { open: false, openTime: '10:00', closeTime: '16:00' },
  sun: { open: false, openTime: '09:00', closeTime: '19:00' },
}

const INITIAL_SERVICES: ServiceRow[] = [
  { id: 'gel-manicure', icon: '💅', tone: 'tone-violet', name: 'Gel Manicure', price: 35, duration: 60 },
  { id: 'classic-manicure', icon: '🖐️', tone: 'tone-cyan', name: 'Classic Manicure', price: 22, duration: 45 },
  { id: 'full-set-acrylic', icon: '💎', tone: 'tone-rose', name: 'Full Set Acrylic', price: 45, duration: 90 },
  { id: 'dip-powder', icon: '✨', tone: 'tone-sky', name: 'Dip Powder', price: 40, duration: 75 },
  { id: 'fill-in', icon: '🔁', tone: 'tone-amber', name: 'Fill-In', price: 32, duration: 60 },
  { id: 'classic-pedicure', icon: '🦶', tone: 'tone-emerald', name: 'Classic Pedicure', price: 30, duration: 50 },
  { id: 'deluxe-pedicure', icon: '👑', tone: 'tone-violet', name: 'Deluxe Pedicure', price: 50, duration: 70 },
  { id: 'pedicure-gel-combo', icon: '🧴', tone: 'tone-cyan', name: 'Pedicure + Gel Combo', price: 65, duration: 105 },
  { id: 'kid-mani-pedi', icon: '🧸', tone: 'tone-amber', name: 'Kid Mani-Pedi', price: 25, duration: 40 },
  { id: 'nail-art', icon: '🎨', tone: 'tone-rose', name: 'Nail Art (per nail)', price: 5, duration: 10 },
]

const SUGGEST_SERVICES = [
  { name: 'Gel-X Extension', price: 55, duration: 90 },
  { name: 'Polish Change', price: 15, duration: 20 },
  { name: 'French Tips', price: 10, duration: 15 },
  { name: 'Chrome / Mirror', price: 15, duration: 20 },
  { name: 'Cat Eye Gel', price: 50, duration: 75 },
  { name: 'Soak-Off Removal', price: 10, duration: 20 },
  { name: 'Eyebrow Wax', price: 12, duration: 15 },
  { name: 'Lash Fill', price: 45, duration: 60 },
]

function openTimePicker(input: HTMLInputElement | null) {
  if (!input || input.disabled) return
  input.focus()
  if (typeof input.showPicker === 'function') {
    try {
      input.showPicker()
    } catch {
      // Browser may block showPicker without direct user gesture on some inputs.
    }
  }
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

function ChevronIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14" className={collapsed ? 'is-collapsed' : ''}>
      <path d="m4 10 4-4 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function SettingsCollapseButton({
  collapsed,
  expandLabel,
  collapseLabel,
  onClick,
}: {
  collapsed: boolean
  expandLabel: string
  collapseLabel: string
  onClick: () => void
}) {
  return (
    <button
      className="settings-collapse-button"
      type="button"
      aria-expanded={!collapsed}
      aria-label={collapsed ? expandLabel : collapseLabel}
      onClick={onClick}
    >
      <ChevronIcon collapsed={collapsed} />
    </button>
  )
}

function SettingsCard({
  cardId,
  collapsed,
  onToggle,
  title,
  subtitle,
  children,
}: {
  cardId: string
  collapsed: boolean
  onToggle: (id: string) => void
  title: React.ReactNode
  subtitle: string
  children: React.ReactNode
}) {
  const { t } = useTranslation()

  return (
    <article className={`settings-card ${collapsed ? 'is-collapsed' : ''}`} data-settings-card={cardId}>
      <div className="settings-card-head">
        <div>
          <div className="settings-card-title">{title}</div>
          <div className="settings-card-sub">{subtitle}</div>
        </div>
        <SettingsCollapseButton
          collapsed={collapsed}
          expandLabel={t(`${TK}.expandSection`)}
          collapseLabel={t(`${TK}.collapseSection`)}
          onClick={() => onToggle(cardId)}
        />
      </div>
      {children}
    </article>
  )
}

export default function BookingSettingsPanel() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const voiceEnabled = useBookingHubVoiceEnabled()
  const { data: configData, isLoading: isConfigLoading } = useMerchantVoiceConfig({ enabled: voiceEnabled })
  const updateConfigMutation = useUpdateMerchantVoiceConfig()
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({})
  const [hours, setHours] = useState(INITIAL_HOURS)
  const [services, setServices] = useState(INITIAL_SERVICES)
  const [suggestOpen, setSuggestOpen] = useState(false)
  const [usedSuggests, setUsedSuggests] = useState<Set<string>>(() => new Set())
  const [pressingSuggest, setPressingSuggest] = useState<string | null>(null)
  const [highlightServiceId, setHighlightServiceId] = useState<string | null>(null)
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [language, setLanguage] = useState<Language>(MerchantVoiceUiLanguage.En)
  const [greeting, setGreeting] = useState(() => t(`${TK}.greetingEn`))
  const [salonName, setSalonName] = useState('')
  const [salonPhone, setSalonPhone] = useState('')
  const [aiPhone, setAiPhone] = useState('')
  const [bookingNotifyPhone, setBookingNotifyPhone] = useState('')
  const [address, setAddress] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [statusMessage, setStatusMessage] = useState('')
  const [formErrors, setFormErrors] = useState<{
    salonName?: string
    salonPhone?: string
    bookingNotifyPhone?: string
    address?: string
    greeting?: string
  }>({})
  const [hoursErrorByDay, setHoursErrorByDay] = useState<Record<DayKey, string>>({
    mon: '',
    tue: '',
    wed: '',
    thu: '',
    fri: '',
    sat: '',
    sun: '',
  })

  const isCollapsed = (cardId: string) => collapsedCards[cardId] === true
  const salonPhoneParsed = useMemo(() => parsePhone(salonPhone), [salonPhone])
  const bookingNotifyPhoneParsed = useMemo(() => parsePhone(bookingNotifyPhone), [bookingNotifyPhone])

  const toggleCard = (cardId: string) => {
    setCollapsedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }))
  }

  const setStatus = (message: string) => setStatusMessage(message)

  const formatVietnamDisplay = (rawNational: string) => {
    const digits = rawNational.replace(/\D/g, '')
    const hasTrunkZero = digits.startsWith('0')
    const clipped = digits.slice(0, hasTrunkZero ? 10 : 9)

    if (hasTrunkZero) {
      if (clipped.length <= 4) return clipped
      if (clipped.length <= 7) return `${clipped.slice(0, 4)}-${clipped.slice(4)}`
      return `${clipped.slice(0, 4)}-${clipped.slice(4, 7)}-${clipped.slice(7, 10)}`
    }

    if (clipped.length <= 3) return clipped
    if (clipped.length <= 6) return `${clipped.slice(0, 3)}-${clipped.slice(3)}`
    return `${clipped.slice(0, 3)}-${clipped.slice(3, 6)}-${clipped.slice(6, 9)}`
  }

  const formatPhoneInput = (raw: string, fallbackRaw?: string) => {
    const input = raw.trim()
    if (!input) return ''

    const hasExplicitCountryCode = input.startsWith('+')
    const digitsOnly = input.replace(/\D/g, '')
    const isVnLocalWithTrunk = /^0\d{8,10}$/.test(digitsOnly)
    const parsed = parsePhone(input)
    const fallbackParsed = fallbackRaw?.trim() ? parsePhone(fallbackRaw.trim()) : null
    const inferredCountryCode = hasExplicitCountryCode
      ? parsed.countryCode
      : (
        fallbackParsed?.countryCode
        || (isVnLocalWithTrunk ? '+84' : '+1')
      )

    // Keep local VN trunk prefix "0" in UI formatting (e.g. 0385... -> 0385 478 857).
    const nationalSource = (!hasExplicitCountryCode && isVnLocalWithTrunk)
      ? digitsOnly
      : parsed.nationalNumber
    const national = inferredCountryCode === '+84'
      ? formatVietnamDisplay(nationalSource)
      : formatNationalNumber(nationalSource, inferredCountryCode)
    if (!national) return input
    return hasExplicitCountryCode ? `${inferredCountryCode} ${national}`.trim() : national
  }

  const validateHours = (hoursState: Record<DayKey, HourRow>) => {
    const nextErrors: Record<DayKey, string> = {
      mon: '',
      tue: '',
      wed: '',
      thu: '',
      fri: '',
      sat: '',
      sun: '',
    }

    DAY_KEYS.forEach((day) => {
      const row = hoursState[day]
      if (!row.open) return
      if (!row.openTime || !row.closeTime) {
        nextErrors[day] = t(`${TK}.hourRequired`)
        return
      }
      if (row.openTime >= row.closeTime) {
        nextErrors[day] = t(`${TK}.hourInvalid`)
      }
    })

    setHoursErrorByDay(nextErrors)
    return DAY_KEYS.every((day) => !nextErrors[day])
  }

  const toggleHour = (day: DayKey) => {
    setHours((prev) => {
      const nextOpen = !prev[day].open
      setStatus(t(`${TK}.hourUpdated`, { day: t(`${TK}.days.${day}`) }))
      return { ...prev, [day]: { ...prev[day], open: nextOpen } }
    })
    setHoursErrorByDay((prev) => ({ ...prev, [day]: '' }))
  }

  const updateHourTime = (day: DayKey, field: 'openTime' | 'closeTime', value: string) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
    setStatus(t(`${TK}.hourTimeUpdated`, { day: t(`${TK}.days.${day}`) }))
    setHoursErrorByDay((prev) => ({ ...prev, [day]: '' }))
  }

  useEffect(() => {
    loadSpeechVoices()
  }, [])

  useEffect(() => {
    if (!configData) return

    setSalonName(configData.name || '')
    setSalonPhone(formatPhoneInput(configData.forwardPhoneNumber || ''))
    setAiPhone(formatPhoneInput(configData.aiPhoneNumber || ''))
    setBookingNotifyPhone(formatPhoneInput(configData.bookingNotifyPhone || ''))
    setAddress(configData.address || '')
    setGoogleReviewUrl(configData.googleReviewUrl || '')
    const resolvedLang = mapConfigLanguageToUiLanguage(configData.language)
    setLanguage(resolvedLang)
    setGreeting(configData.welcomeGreeting || t(`${TK}.greeting${resolvedLang === MerchantVoiceUiLanguage.Vi ? 'Vi' : 'En'}`))

    const nextHours = { ...INITIAL_HOURS }
    configData.operatingHours.forEach((item) => {
      const apiDay = normalizeMerchantVoiceDayOfWeek(item.dayOfWeek)
      if (apiDay === null) return
      const key = API_DAY_TO_DAY_KEY[apiDay]
      if (!key) return
      nextHours[key] = {
        open: Boolean(item.isOpen),
        openTime: item.openTime?.slice(0, 5) || '',
        closeTime: item.closeTime?.slice(0, 5) || '',
      }
    })
    setHours(nextHours)

    const nextServices = (configData.services || []).map((service, index) => ({
      id: service.id || `service-${index}`,
      icon: service.icon || '✨',
      tone: INITIAL_SERVICES[index % INITIAL_SERVICES.length]?.tone || 'tone-violet',
      name: service.name || '',
      price: Number(service.price ?? 0),
      duration: Number(service.durationMinutes ?? 0),
    }))
    setServices(nextServices)
  }, [configData, t])

  useEffect(() => () => {
    stopBookingPreview()
  }, [])

  const addService = (
    name: string,
    price: number,
    duration: number,
    options?: { highlight?: boolean; icon?: string; tone?: Tone },
  ) => {
    const id = `service-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    setServices((prev) => [
      ...prev,
      {
        id,
        icon: options?.icon ?? '✨',
        tone: options?.tone ?? 'tone-violet',
        name,
        price,
        duration,
      },
    ])
    if (options?.highlight) {
      setHighlightServiceId(id)
      window.setTimeout(() => setHighlightServiceId((current) => (current === id ? null : current)), 1400)
    }
    setStatus(t(`${TK}.serviceAdded`, { name }))
    return id
  }

  const handleSuggestAdd = (item: (typeof SUGGEST_SERVICES)[number]) => {
    setPressingSuggest(item.name)
    window.setTimeout(() => setPressingSuggest(null), 220)

    const exists = services.some((service) => service.name.toLowerCase() === item.name.toLowerCase())
    if (!exists) {
      addService(item.name, item.price, item.duration, { highlight: true })
    } else {
      setStatus(t(`${TK}.suggestAlreadyInList`, { name: item.name }))
    }

    setUsedSuggests((prev) => new Set(prev).add(item.name))
  }

  const removeService = (id: string) => {
    setServices((prev) => prev.filter((service) => service.id !== id))
  }

  const updateService = (id: string, field: 'name' | 'price' | 'duration', value: string) => {
    setServices((prev) => prev.map((service) => {
      if (service.id !== id) return service
      if (field === 'name') return { ...service, name: value }
      if (field === 'price') return { ...service, price: Number(value) || 0 }
      return { ...service, duration: Number(value) || 0 }
    }))
  }

  const handleSuggestToggle = () => {
    setSuggestOpen((prev) => {
      const next = !prev
      setStatus(next ? t(`${TK}.suggestOpened`) : t(`${TK}.suggestHidden`))
      return next
    })
  }

  const handleAddManual = () => {
    addService(t(`${TK}.newServiceName`), 30, 45, { highlight: true })
  }

  const handleLanguageSelect = (next: Language) => {
    setLanguage(next)
    setGreeting(t(`${TK}.greeting${next === MerchantVoiceUiLanguage.Vi ? 'Vi' : 'En'}`))
    setStatus(t(`${TK}.languageSelected`, { language: t(`${TK}.languageLabels.${next}`) }))
  }

  const handlePreview = async () => {
    if (isPreviewPlaying) {
      stopBookingPreview()
      setIsPreviewPlaying(false)
      setStatus(t(`${TK}.previewStopped`))
      return
    }

    const text = greeting.trim() || t(`${TK}.greetingEn`)

    try {
      await speakBookingPreview({
        text,
        language,
        onStart: () => {
          setIsPreviewPlaying(true)
          setStatus(t(`${TK}.previewPlaying`))
        },
        onEnd: () => {
          setIsPreviewPlaying(false)
          setStatus(t(`${TK}.previewDone`))
        },
        onError: () => {
          setIsPreviewPlaying(false)
          setStatus(t(`${TK}.previewFailed`))
        },
      })
    } catch (error) {
      setIsPreviewPlaying(false)
      if (error instanceof Error && error.message === 'speech-not-supported') {
        setStatus(t(`${TK}.previewNotSupported`))
        return
      }
      setStatus(t(`${TK}.previewFailed`))
    }
  }
  const handleSave = async () => {
    const requiredMessage = t('components.dashboard.views.BookingHubView.team.requiredField')
    const nextErrors: {
      salonName?: string
      salonPhone?: string
      bookingNotifyPhone?: string
      address?: string
      greeting?: string
    } = {}
    if (!salonName.trim()) nextErrors.salonName = requiredMessage
    if (!salonPhone.trim()) nextErrors.salonPhone = requiredMessage
    if (!bookingNotifyPhone.trim()) nextErrors.bookingNotifyPhone = requiredMessage
    if (!address.trim()) nextErrors.address = requiredMessage
    if (!greeting.trim()) nextErrors.greeting = requiredMessage

    if (Object.keys(nextErrors).length > 0) {
      setFormErrors(nextErrors)
      showToast(t(`${TK}.saveValidationError`), 'error')
      return
    }

    const validHours = validateHours(hours)
    if (!validHours) {
      showToast(t(`${TK}.hourValidationSummary`), 'error')
      return
    }

    try {
      const salonPhonePayload = normalizePhoneForApi(salonPhone, parsePhone(salonPhone).countryCode)
      const bookingNotifyPhonePayload = normalizePhoneForApi(
        bookingNotifyPhone,
        parsePhone(bookingNotifyPhone).countryCode,
      )

      await updateConfigMutation.mutateAsync({
        name: salonName.trim(),
        forwardPhoneNumber: salonPhonePayload,
        bookingNotifyPhone: bookingNotifyPhonePayload,
        address: address.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
        language: mapUiLanguageToConfigLanguage(language),
        welcomeGreeting: greeting.trim(),
        operatingHours: DAY_KEYS.map((day) => {
          const row = hours[day]
          if (!row.open) {
            return {
              dayOfWeek: DAY_KEY_TO_API[day],
              isOpen: false,
            }
          }
          return {
            dayOfWeek: DAY_KEY_TO_API[day],
            isOpen: true,
            openTime: `${row.openTime}:00`,
            closeTime: `${row.closeTime}:00`,
          }
        }),
        services: services.map((service) => ({
          ...(service.id && !service.id.startsWith('service-') ? { id: service.id } : {}),
          name: service.name.trim(),
          price: Number.isFinite(service.price) ? service.price : 0,
          durationMinutes: Number.isFinite(service.duration) ? service.duration : 0,
          note: null,
          icon: service.icon?.trim() || null,
          isActive: true,
        })),
      })
      setStatus(t(`${TK}.saveSuccess`))
      setFormErrors({})
      showToast(t(`${TK}.saveSuccess`), 'success')
    } catch (error) {
      const message = t(getErrorI18nKey(getApiErrorCode(error)))
      setStatus(message)
      showToast(message, 'error')
    }
  }

  if (isConfigLoading) {
    return <BookingSettingsSkeleton />
  }

  return (
    <div className="settings-shell">
      <div className="settings-hero is-compact">
        <div className="settings-eyebrow">{t(`${TK}.eyebrow`)}</div>
        <h2 className="settings-title">{t(`${TK}.oneSourceTitle`)}</h2>
        <p className="settings-desc">{t(`${TK}.oneSourceDesc`)}</p>
        <div className="settings-sync-grid">
          <div className="settings-sync-pill"><strong>AI Voice</strong>{t(`${TK}.syncVoice`)}</div>
          <div className="settings-sync-pill"><strong>SMS</strong>{t(`${TK}.syncSms`)}</div>
          <div className="settings-sync-pill"><strong>Landing Page</strong>{t(`${TK}.syncLanding`)}</div>
          <div className="settings-sync-pill"><strong>Schema</strong>{t(`${TK}.syncSchema`)}</div>
          <div className="settings-sync-pill"><strong>Booking</strong>{t(`${TK}.syncBooking`)}</div>
        </div>
      </div>

      <div className="settings-grid">
        <SettingsCard
          cardId="salon"
          collapsed={isCollapsed('salon')}
          onToggle={toggleCard}
          title={<><span className="settings-card-title-icon"><ShopIcon /></span>{t(`${TK}.salonInfoTitle`)}</>}
          subtitle={t(`${TK}.salonInfoSub`)}
        >
          <div className="settings-field-grid settings-business-grid">
            <label className="settings-field">
              <span className="settings-label">{t(`${TK}.salonName`)}</span>
              <input
                className="settings-input"
                type="text"
                value={salonName}
                aria-invalid={Boolean(formErrors.salonName)}
                onChange={(event) => {
                  setSalonName(event.target.value)
                  if (formErrors.salonName) setFormErrors((prev) => ({ ...prev, salonName: undefined }))
                }}
              />
              <span className="settings-field-error-slot">{formErrors.salonName ? <span className="settings-field-error">{formErrors.salonName}</span> : null}</span>
            </label>
            <label className="settings-field">
              <span className="settings-label">{t(`${TK}.salonPhone`)}</span>
              <span className="phone-input-shell">
                <CountryCodeSelect
                  value={salonPhoneParsed.countryCode}
                  embedded
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(salonPhoneParsed.nationalNumber, nextCode)
                    setSalonPhone(`${nextCode} ${formatted}`.trim())
                    if (formErrors.salonPhone) setFormErrors((prev) => ({ ...prev, salonPhone: undefined }))
                  }}
                />
                <input
                  className="settings-input phone-mask-input"
                  type="tel"
                  value={formatNationalNumber(salonPhoneParsed.nationalNumber, salonPhoneParsed.countryCode)}
                  aria-invalid={Boolean(formErrors.salonPhone)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  onChange={(event) => {
                    const formatted = formatNationalNumber(event.target.value, salonPhoneParsed.countryCode)
                    setSalonPhone(`${salonPhoneParsed.countryCode} ${formatted}`.trim())
                    if (formErrors.salonPhone) setFormErrors((prev) => ({ ...prev, salonPhone: undefined }))
                  }}
                />
              </span>
              <span className="settings-field-error-slot">{formErrors.salonPhone ? <span className="settings-field-error">{formErrors.salonPhone}</span> : null}</span>
              <span className="settings-help">{t(`${TK}.salonPhoneHelp`)}</span>
            </label>
            <label className="settings-field">
              <span className="settings-label">{t(`${TK}.aiLine`)}</span>
              <input className="settings-input settings-input-ai" type="text" value={aiPhone} readOnly />
              <span className="settings-help">{t(`${TK}.aiLineHelp`)}</span>
            </label>
            <label className="settings-field">
              <span className="settings-label">{t(`${TK}.bookingNotifyPhone`)}</span>
              <span className="phone-input-shell">
                <CountryCodeSelect
                  value={bookingNotifyPhoneParsed.countryCode}
                  embedded
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(bookingNotifyPhoneParsed.nationalNumber, nextCode)
                    setBookingNotifyPhone(`${nextCode} ${formatted}`.trim())
                    if (formErrors.bookingNotifyPhone) setFormErrors((prev) => ({ ...prev, bookingNotifyPhone: undefined }))
                  }}
                />
                <input
                  className="settings-input phone-mask-input"
                  type="tel"
                  value={formatNationalNumber(bookingNotifyPhoneParsed.nationalNumber, bookingNotifyPhoneParsed.countryCode)}
                  aria-invalid={Boolean(formErrors.bookingNotifyPhone)}
                  inputMode="numeric"
                  autoComplete="tel-national"
                  onChange={(event) => {
                    const formatted = formatNationalNumber(event.target.value, bookingNotifyPhoneParsed.countryCode)
                    setBookingNotifyPhone(`${bookingNotifyPhoneParsed.countryCode} ${formatted}`.trim())
                    if (formErrors.bookingNotifyPhone) setFormErrors((prev) => ({ ...prev, bookingNotifyPhone: undefined }))
                  }}
                />
              </span>
              <span className="settings-field-error-slot">{formErrors.bookingNotifyPhone ? <span className="settings-field-error">{formErrors.bookingNotifyPhone}</span> : null}</span>
              <span className="settings-help">{t(`${TK}.bookingNotifyHelp`)}</span>
            </label>
            <label className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.address`)}</span>
              <input
                className="settings-input"
                type="text"
                value={address}
                aria-invalid={Boolean(formErrors.address)}
                onChange={(event) => {
                  setAddress(event.target.value)
                  if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined }))
                }}
              />
              <span className="settings-field-error-slot">{formErrors.address ? <span className="settings-field-error">{formErrors.address}</span> : null}</span>
            </label>
            <label className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.googleReviewLink`)}</span>
              <input className="settings-input" type="text" value={googleReviewUrl} onChange={(event) => setGoogleReviewUrl(event.target.value)} />
            </label>
          </div>
        </SettingsCard>

        <SettingsCard
          cardId="hours"
          collapsed={isCollapsed('hours')}
          onToggle={toggleCard}
          title={<><span className="settings-card-title-icon"><ClockHistoryIcon /></span>{t(`${TK}.hoursTitle`)}</>}
          subtitle={t(`${TK}.hoursSub`)}
        >
          <div className="settings-hours">
            {DAY_KEYS.map((day) => {
              const row = hours[day]
              const rowError = hoursErrorByDay[day]
              return (
                <div className={`settings-hour-row ${row.open ? '' : 'is-closed'}`} key={day}>
                  <label className="settings-hour-toggle">
                    <input type="checkbox" checked={row.open} onChange={() => toggleHour(day)} />
                    <span>{t(`${TK}.days.${day}`)}</span>
                  </label>
                  <div
                    className="settings-time-box"
                    onClick={(event) => {
                      const input = event.currentTarget.querySelector('input')
                      if (input instanceof HTMLInputElement) openTimePicker(input)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openTimePicker(event.currentTarget.querySelector('input'))
                      }
                    }}
                    role="button"
                    tabIndex={row.open ? 0 : -1}
                    aria-label={t(`${TK}.openTimeAria`, { day: t(`${TK}.days.${day}`) })}
                  >
                    <input
                      className="settings-hour-input"
                      type="time"
                      value={row.openTime}
                      disabled={!row.open}
                      aria-invalid={Boolean(rowError)}
                      aria-label={t(`${TK}.openTimeAria`, { day: t(`${TK}.days.${day}`) })}
                      onChange={(event) => updateHourTime(day, 'openTime', event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    <ClockIcon />
                  </div>
                  <span className="settings-hour-to">{t(`${TK}.hoursTo`)}</span>
                  <div
                    className="settings-time-box"
                    onClick={(event) => {
                      const input = event.currentTarget.querySelector('input')
                      if (input instanceof HTMLInputElement) openTimePicker(input)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openTimePicker(event.currentTarget.querySelector('input'))
                      }
                    }}
                    role="button"
                    tabIndex={row.open ? 0 : -1}
                    aria-label={t(`${TK}.closeTimeAria`, { day: t(`${TK}.days.${day}`) })}
                  >
                    <input
                      className="settings-hour-input"
                      type="time"
                      value={row.closeTime}
                      disabled={!row.open}
                      aria-invalid={Boolean(rowError)}
                      aria-label={t(`${TK}.closeTimeAria`, { day: t(`${TK}.days.${day}`) })}
                      onChange={(event) => updateHourTime(day, 'closeTime', event.target.value)}
                      onClick={(event) => event.stopPropagation()}
                    />
                    <ClockIcon />
                  </div>
                  {rowError ? <span className="settings-hour-error">{rowError}</span> : null}
                </div>
              )
            })}
          </div>
        </SettingsCard>
      </div>

      <div className="settings-two-grid">
        <SettingsCard
          cardId="services"
          collapsed={isCollapsed('services')}
          onToggle={toggleCard}
          title={<><span className="settings-card-title-icon"><CurrencyDollarIcon /></span>{t(`${TK}.servicesTitle`)}</>}
          subtitle={t(`${TK}.servicesSub`)}
        >
          <div className="settings-actions">
            <button
              className={`booking-secondary-button settings-action-button ${suggestOpen ? 'is-active' : ''}`}
              type="button"
              onClick={handleSuggestToggle}
            >
              <LightningIcon className="settings-action-icon" /> {t(`${TK}.suggestServices`)}
            </button>
            <button className="booking-primary-button settings-action-button" type="button" onClick={handleAddManual}>
              <PlusIcon className="settings-action-icon" /> {t(`${TK}.addManually`)}
            </button>
          </div>

          {suggestOpen && (
            <div className="settings-service-panel is-visible">
              <div className="settings-service-panel-title">{t(`${TK}.suggestPanelTitle`)}</div>
              <div className="settings-service-suggest-grid">
                {SUGGEST_SERVICES.map((item) => {
                  const isAdded = usedSuggests.has(item.name)
                  const isPressing = pressingSuggest === item.name
                  if (isAdded) return null
                  return (
                    <button
                      key={item.name}
                      className={`settings-service-suggest ${isPressing ? 'is-pressing' : ''}`}
                      type="button"
                      onClick={() => handleSuggestAdd(item)}
                    >
                      <span className="settings-service-suggest-plus" aria-hidden="true">+</span>
                      {item.name}
                      <span>${item.price}</span>
                    </button>
                  )
                })}
              </div>
              {usedSuggests.size > 0 && usedSuggests.size < SUGGEST_SERVICES.length ? (
                <div className="settings-suggest-hint">{t(`${TK}.suggestTapHint`)}</div>
              ) : null}
              {usedSuggests.size === SUGGEST_SERVICES.length ? (
                <div className="settings-suggest-complete">{t(`${TK}.suggestAllAdded`)}</div>
              ) : null}
            </div>
          )}

          <div className="settings-service-note-bar">{t(`${TK}.serviceNoteBar`)}</div>

          <div className="settings-service-list settings-service-body">
            <div className="settings-service-header" aria-hidden="true">
              <span />
              <span>{t(`${TK}.serviceColumn`)}</span>
              <span>{t(`${TK}.priceColumn`)}</span>
              <span>{t(`${TK}.durationColumn`)}</span>
              <span />
            </div>
            {services.length === 0 ? (
              <div className="settings-service-empty">
                <p>{t(`${TK}.servicesEmpty`)}</p>
                <button className="booking-primary-button settings-action-button" type="button" onClick={handleAddManual}>
                  <PlusIcon className="settings-action-icon" /> {t(`${TK}.servicesEmptyCta`)}
                </button>
              </div>
            ) : null}
            {services.map((service) => (
              <div
                className={`settings-service-row ${highlightServiceId === service.id ? 'is-highlight' : ''}`}
                key={service.id}
              >
                <div className="settings-service-edit-grid">
                  <span className={`settings-service-visual ${service.tone}`} aria-hidden="true">{service.icon}</span>
                  <label className="settings-service-field settings-service-field-name">
                    <span className="settings-service-field-label">{t(`${TK}.serviceColumn`)}</span>
                    <input
                      className="settings-service-input"
                      type="text"
                      value={service.name}
                      aria-label={t(`${TK}.serviceNameAria`)}
                      onChange={(event) => updateService(service.id, 'name', event.target.value)}
                    />
                  </label>
                  <div className="settings-service-metrics">
                    <label className="settings-service-field settings-service-field-price">
                      <span className="settings-service-field-label">{t(`${TK}.priceColumn`)}</span>
                      <div className="settings-service-input-wrap">
                        <span className="settings-service-prefix">$</span>
                        <input
                          className="settings-service-input price"
                          type="number"
                          inputMode="decimal"
                          value={service.price}
                          aria-label={t(`${TK}.servicePriceAria`)}
                          onChange={(event) => updateService(service.id, 'price', event.target.value)}
                        />
                      </div>
                    </label>
                    <label className="settings-service-field settings-service-field-duration">
                      <span className="settings-service-field-label">{t(`${TK}.durationColumn`)}</span>
                      <div className="settings-service-input-wrap">
                        <input
                          className="settings-service-input duration"
                          type="number"
                          inputMode="numeric"
                          value={service.duration}
                          aria-label={t(`${TK}.serviceDurationAria`)}
                          onChange={(event) => updateService(service.id, 'duration', event.target.value)}
                        />
                        <span className="settings-service-suffix">min</span>
                      </div>
                    </label>
                  </div>
                  <button
                    className="settings-service-remove"
                    type="button"
                    aria-label={t(`${TK}.removeService`)}
                    onClick={() => removeService(service.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </SettingsCard>

        <SettingsCard
          cardId="voice"
          collapsed={isCollapsed('voice')}
          onToggle={toggleCard}
          title={
            <>
              <span className="settings-ai-title-icon" aria-hidden="true">
                AI<StarsIcon className="settings-ai-spark" />
              </span>
              {t(`${TK}.voiceTitle`)}
            </>
          }
          subtitle={t(`${TK}.voiceSub`)}
        >
          <div className="settings-field-grid">
            <div className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.aiLanguage`)}</span>
              <div className="settings-language-grid" role="group" aria-label={t(`${TK}.aiLanguage`)}>
                {([MerchantVoiceUiLanguage.Vi, MerchantVoiceUiLanguage.En] as const).map((lang) => (
                  <button
                    key={lang}
                    className={`settings-language-card ${language === lang ? 'is-active' : ''}`}
                    type="button"
                    aria-pressed={language === lang}
                    onClick={() => handleLanguageSelect(lang)}
                  >
                    {lang === MerchantVoiceUiLanguage.Vi ? '🇻🇳 VI' : '🇺🇸 EN'}
                  </button>
                ))}
              </div>
              <div className="settings-language-status">{t(`${TK}.languageStatus.${language}`)}</div>
            </div>
            <label className="settings-field settings-span-full">
              <span className="settings-label">{t(`${TK}.greetingScript`)}</span>
              <textarea
                className="settings-textarea"
                value={greeting}
                aria-invalid={Boolean(formErrors.greeting)}
                onChange={(event) => {
                  setGreeting(event.target.value)
                  if (formErrors.greeting) setFormErrors((prev) => ({ ...prev, greeting: undefined }))
                }}
              />
              <span className="settings-field-error-slot">{formErrors.greeting ? <span className="settings-field-error">{formErrors.greeting}</span> : null}</span>
            </label>
          </div>
          <button
            className={`booking-secondary-button settings-preview-button ${isPreviewPlaying ? 'is-playing' : ''}`}
            type="button"
            aria-pressed={isPreviewPlaying}
            onClick={handlePreview}
          >
            {isPreviewPlaying ? t(`${TK}.previewVoiceStop`) : t(`${TK}.previewVoice`)}
          </button>
        </SettingsCard>
      </div>

      <div className="settings-save-bar">
        <div>
          <div className="settings-save-copy">{t(`${TK}.saveCopy`)}</div>
          {statusMessage ? <div className="settings-status">{statusMessage}</div> : null}
        </div>
        <button
          className="booking-primary-button"
          type="button"
          disabled={updateConfigMutation.isPending}
          onClick={handleSave}
        >
          {updateConfigMutation.isPending ? <SpinnerIcon className="booking-inline-spinner" /> : null}
          {t(`${TK}.saveButton`)}
        </button>
      </div>
    </div>
  )
}
