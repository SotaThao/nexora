import React, { useEffect, useMemo, useRef, useState } from 'react'
import CountryCodeSelect, { formatNationalNumber, parsePhone } from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getApiErrorCode } from '../../../types/domain'
import {
  useCreateMerchantVoiceStaff,
  useMerchantVoiceBusinessStaff,
  useMerchantVoiceConfig,
  useMerchantVoiceStaffById,
  useMerchantVoiceStaff,
  useToggleMerchantVoiceStaffStatus,
  useUpdateMerchantVoiceStaff,
} from '../../../data/hooks/useMerchantVoiceBookings'
import {
  isStaffStatusActive,
  mapDayOfWeekToApiName,
  mapStaffStatusToActivityApi,
  MerchantVoiceDayOfWeek,
  MerchantVoiceStaffStatus,
  normalizeMerchantVoiceDayOfWeek,
  type MerchantVoiceStaffDto,
} from '../../../data/repositories/merchantVoice'
import Pagination from '../../ui/Pagination'
import { usePagination } from '../../../hooks/usePagination'
import { BOOKING_HUB_PAGE_SIZE } from '../../../constants/pagination'
import { EyeIcon, SpinnerIcon } from './BookingHubIcons'
import {
  BookingTeamGridSkeleton,
  BookingTechModalProfileSkeleton,
  BookingTechScheduleSkeleton,
  BookingTechServicesSkeleton,
  BookingTechStaffListSkeleton,
} from './BookingHubSkeletons'
import { useBookingHubVoiceEnabled } from './BookingHubVoiceContext'

const TK = 'components.dashboard.views.BookingHubView.team'

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

type DayKey = typeof DAY_KEYS[number]
type ModalMode = 'create' | 'edit' | 'detail'

interface DaySchedule {
  dayOff: boolean
  start: string
  end: string
}

type WeeklySchedule = Record<DayKey, DaySchedule>

interface TeamMember {
  id: string
  name: string
  phone: string
  email: string
  services: string[]
  schedule: string
  customers: number
  avatar: string
  avatarStyle?: React.CSSProperties
  smsEnabled: boolean
}

interface BusinessStaffOption {
  id: string
  name: string
  phone: string
  email: string
  position: string
  isAlreadyAdded: boolean
  avatar: string
  avatarStyle?: React.CSSProperties
}

const INITIAL_TEAM_MEMBERS: TeamMember[] = []

const DAY_KEY_TO_API_DAY: Record<DayKey, MerchantVoiceDayOfWeek> = {
  sun: MerchantVoiceDayOfWeek.Sunday,
  mon: MerchantVoiceDayOfWeek.Monday,
  tue: MerchantVoiceDayOfWeek.Tuesday,
  wed: MerchantVoiceDayOfWeek.Wednesday,
  thu: MerchantVoiceDayOfWeek.Thursday,
  fri: MerchantVoiceDayOfWeek.Friday,
  sat: MerchantVoiceDayOfWeek.Saturday,
}

const API_DAY_TO_DAY_KEY: Record<MerchantVoiceDayOfWeek, DayKey> = {
  [MerchantVoiceDayOfWeek.Sunday]: 'sun',
  [MerchantVoiceDayOfWeek.Monday]: 'mon',
  [MerchantVoiceDayOfWeek.Tuesday]: 'tue',
  [MerchantVoiceDayOfWeek.Wednesday]: 'wed',
  [MerchantVoiceDayOfWeek.Thursday]: 'thu',
  [MerchantVoiceDayOfWeek.Friday]: 'fri',
  [MerchantVoiceDayOfWeek.Saturday]: 'sat',
}

function normalizeDayKey(dayOfWeek: number | string | undefined | null): DayKey | null {
  const day = normalizeMerchantVoiceDayOfWeek(dayOfWeek)
  if (day === null) return null
  return API_DAY_TO_DAY_KEY[day] ?? null
}

function normalizeScheduleTime(value: string | null | undefined): string {
  if (!value) return ''
  const trimmed = value.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return trimmed.slice(0, 5)

  const hour = Number(match[1])
  const minute = match[2]
  if (hour < 0 || hour > 23) return trimmed.slice(0, 5)
  return `${String(hour).padStart(2, '0')}:${minute}`
}

function schedulesToWeeklySchedule(schedules: MerchantVoiceStaffDto['schedules'] | undefined): WeeklySchedule {
  const schedule = emptySchedule()

  DAY_KEYS.forEach((key) => {
    schedule[key] = { dayOff: true, start: '', end: '' }
  })

  for (const item of schedules ?? []) {
    const day = normalizeDayKey(item.dayOfWeek)
    if (!day) continue

    if (item.isDayOff) {
      schedule[day] = { dayOff: true, start: '', end: '' }
      continue
    }

    schedule[day] = {
      dayOff: false,
      start: normalizeScheduleTime(item.startTime),
      end: normalizeScheduleTime(item.endTime),
    }
  }

  return schedule
}

function emptySchedule(): WeeklySchedule {
  return DAY_KEYS.reduce((acc, key) => {
    acc[key] = { dayOff: false, start: '', end: '' }
    return acc
  }, {} as WeeklySchedule)
}

function parseSchedule(raw?: string): WeeklySchedule {
  const schedule = emptySchedule()
  if (!raw) {
    return DAY_KEYS.reduce((acc, key) => {
      acc[key] = { dayOff: true, start: '', end: '' }
      return acc
    }, {} as WeeklySchedule)
  }

  DAY_KEYS.forEach((key) => {
    schedule[key] = { dayOff: true, start: '', end: '' }
  })

  raw.split(';').forEach((part) => {
    const [dayPart, times] = part.split('=')
    if (!dayPart || !times || !DAY_KEYS.includes(dayPart as DayKey)) return
    const [start, end] = times.split('-')
    schedule[dayPart as DayKey] = {
      dayOff: false,
      start: start || '',
      end: end || '',
    }
  })

  return schedule
}

function serializeSchedule(schedule: WeeklySchedule) {
  return DAY_KEYS
    .filter((key) => !schedule[key].dayOff && schedule[key].start && schedule[key].end)
    .map((key) => `${key}=${schedule[key].start}-${schedule[key].end}`)
    .join(';')
}

function formatSkills(skills: string | null | undefined): string[] {
  if (!skills) return []
  const parsed = skills.split(',').map((item) => item.trim()).filter(Boolean)
  return parsed
}

function scheduleToString(staff: MerchantVoiceStaffDto) {
  return (staff.schedules || [])
    .filter((item) => !item.isDayOff && item.startTime && item.endTime)
    .map((item) => {
      const day = normalizeDayKey(item.dayOfWeek)
      if (!day) return null
      const start = normalizeScheduleTime(item.startTime)
      const end = normalizeScheduleTime(item.endTime)
      if (!start || !end) return null
      return `${day}=${start}-${end}`
    })
    .filter(Boolean)
    .join(';')
}

function toTeamMember(staff: MerchantVoiceStaffDto): TeamMember {
  const first = staff.fullName?.trim()?.charAt(0)?.toUpperCase() || 'T'
  return {
    id: staff.id,
    name: staff.fullName || 'Unnamed staff',
    phone: staff.phoneNumber || '',
    email: staff.email || '',
    services: formatSkills(staff.skills),
    schedule: scheduleToString(staff),
    customers: 0,
    avatar: first,
    smsEnabled: isStaffStatusActive(staff.status),
  }
}

function formatPhoneDisplay(phone: string | null | undefined): string {
  const raw = phone?.trim()
  if (!raw) return '—'
  const parsed = parsePhone(raw)
  const national = formatNationalNumber(parsed.nationalNumber, parsed.countryCode)
  if (!national) return raw
  return `${parsed.countryCode} ${national}`.trim()
}


function isScheduleRowMissingTime(row: DaySchedule): boolean {
  if (row.dayOff) return false
  return !row.start || !row.end
}

function getScheduleRowError(
  row: DaySchedule,
  requiredMessage: string,
  invalidMessage: string,
): string | null {
  if (row.dayOff) return null
  if (!row.start || !row.end) return requiredMessage
  if (row.end <= row.start) return invalidMessage
  return null
}

function hasScheduleValidationError(
  schedule: WeeklySchedule,
  requiredMessage: string,
  invalidMessage: string,
): boolean {
  return DAY_KEYS.some((day) => (
    getScheduleRowError(schedule[day], requiredMessage, invalidMessage) !== null
  ))
}

function isScheduleRowInvalid(row: DaySchedule): boolean {
  if (row.dayOff || !row.start || !row.end) return false
  return row.end <= row.start
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13">
      <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M10.5 10.5 14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function ChevronDownIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function PersonPlusIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="16" height="16">
      <circle cx="6.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M2.5 13c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M12 4v4M10 6h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  )
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13">
      <circle cx="5.5" cy="5" r="2.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M1.5 13c0-2 1.8-3.6 4-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <circle cx="11" cy="6" r="1.8" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8.5 13c.2-1.8 1.6-3.2 3.5-3.2 1 0 1.9.4 2.5 1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function PersonCardIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13">
      <rect x="2" y="3" width="12" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="6" cy="7" r="1.6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M4 11c.4-1.2 1.3-2 2.5-2h1c1.2 0 2.1.8 2.5 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function CalendarWeekIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13">
      <rect x="2" y="3" width="12" height="11" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M2 6.5h12M5 1.5v2.5M11 1.5v2.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      <path d="M5 9h1.5M7.75 9H9.25M10.75 9h1.5M5 11.5h1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  )
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
      <path d="m4 4 8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="13" height="13">
      <path d="m3.5 8.5 3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function BookingTeamPanel() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const voiceEnabled = useBookingHubVoiceEnabled()
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('edit')
  const [selectedId, setSelectedId] = useState('')
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftServices, setDraftServices] = useState<string[]>([])
  const [draftSchedule, setDraftSchedule] = useState<WeeklySchedule>(emptySchedule())
  const [formErrors, setFormErrors] = useState<{
    name?: string
    phone?: string
    email?: string
    services?: string
  }>({})
  const [showScheduleValidation, setShowScheduleValidation] = useState(false)
  const comboboxRef = useRef<HTMLDivElement>(null)
  const checkAllServicesRef = useRef<HTMLInputElement>(null)
  const { pageNumber, pageSize, setPage } = usePagination({ pageSize: BOOKING_HUB_PAGE_SIZE })
  const { data: staffResponse, isLoading: isStaffLoading, isFetching: isStaffFetching } = useMerchantVoiceStaff({
    pageNumber,
    pageSize,
  }, { enabled: voiceEnabled })
  const { data: businessStaffResponse, isLoading: isBusinessStaffLoading } = useMerchantVoiceBusinessStaff(
    { searchTerm: debouncedSearchQuery },
    { enabled: voiceEnabled && modalOpen },
  )
  const { data: configResponse, isLoading: isConfigLoading } = useMerchantVoiceConfig({
    enabled: voiceEnabled && modalOpen,
  })
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS)
  const createStaffMutation = useCreateMerchantVoiceStaff()
  const updateStaffMutation = useUpdateMerchantVoiceStaff()
  const toggleStaffStatusMutation = useToggleMerchantVoiceStaffStatus()
  const [pendingToggleIds, setPendingToggleIds] = useState<Record<string, boolean>>({})
  const { data: staffDetail, isLoading: isStaffDetailLoading } = useMerchantVoiceStaffById(selectedId, {
    enabled: voiceEnabled && modalOpen && !!selectedId && modalMode !== 'create',
  })

  const businessStaffOptions = useMemo<BusinessStaffOption[]>(() => (
    (businessStaffResponse ?? []).map((staff) => ({
      id: staff.id,
      name: staff.fullName || '',
      phone: staff.phoneNumber || '',
      email: staff.email || '',
      position: staff.position || '',
      isAlreadyAdded: staff.isAlreadyAdded,
      avatar: (staff.fullName?.trim()?.charAt(0)?.toUpperCase()) || 'T',
    }))
  ), [businessStaffResponse])

  const filteredBusinessStaff = businessStaffOptions

  const serviceOptions = useMemo(() => {
    const apiServices = configResponse?.services ?? []
    const activeSorted = [...apiServices]
      .filter((service) => service.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((service) => service.name.trim())
      .filter(Boolean)
    return Array.from(new Set(activeSorted))
  }, [configResponse?.services])

  const draftPhoneParsed = useMemo(
    () => parsePhone(draftPhone),
    [draftPhone],
  )

  const scheduleRequiredMessage = t(`${TK}.scheduleRequiredTime`)
  const scheduleInvalidMessage = t(`${TK}.scheduleInvalidTime`)

  const fillDraftFromMember = (
    member: TeamMember | undefined,
    mode: ModalMode,
    scheduleOverride?: WeeklySchedule,
  ) => {
    if (mode === 'create' || !member) {
      setDraftName('')
      setDraftPhone('')
      setDraftEmail('')
      setDraftServices([])
      setDraftSchedule(emptySchedule())
      setFormErrors({})
      setShowScheduleValidation(false)
      return
    }
    setDraftName(member.name)
    setDraftPhone(member.phone)
    setDraftEmail(member.email)
    setDraftServices([...member.services])
    setDraftSchedule(scheduleOverride ?? parseSchedule(member.schedule))
    setFormErrors({})
    setShowScheduleValidation(false)
  }

  const openModal = (memberId?: string, mode: ModalMode = 'create') => {
    if (!memberId) {
      setModalMode('create')
      setSelectedId('')
      setSearchQuery('')
      setComboboxOpen(false)
      fillDraftFromMember(undefined, 'create')
      setModalOpen(true)
      return
    }

    const target = members.find((member) => member.id === memberId)
    setModalMode(mode)
    setSelectedId(memberId)
    setSearchQuery('')
    setComboboxOpen(false)
    fillDraftFromMember(target, mode === 'create' ? 'create' : 'edit')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setComboboxOpen(false)
    setSearchQuery('')
    setShowScheduleValidation(false)
  }

  const selectBusinessStaff = (staff: BusinessStaffOption) => {
    if (staff.isAlreadyAdded) return

    const matchedMember = members.find((member) => (
      member.id === staff.id
      || (staff.phone && member.phone === staff.phone)
      || (staff.name && member.name === staff.name)
    ))
    if (matchedMember) {
      setModalMode('edit')
      setSelectedId(matchedMember.id)
      fillDraftFromMember(matchedMember, 'edit')
      setComboboxOpen(false)
      setSearchQuery('')
      return
    }

    setModalMode('create')
    setSelectedId(staff.id)
    setDraftName(staff.name)
    setDraftPhone(staff.phone)
    setDraftEmail(staff.email)
    setDraftServices([])
    setDraftSchedule(emptySchedule())
    setComboboxOpen(false)
    setSearchQuery('')
  }

  const startCreate = () => {
    setModalMode('create')
    setSelectedId('')
    fillDraftFromMember(undefined, 'create')
    setComboboxOpen(false)
    setSearchQuery('')
  }

  const toggleService = (service: string) => {
    setDraftServices((prev) => (
      prev.includes(service) ? prev.filter((item) => item !== service) : [...prev, service]
    ))
    setFormErrors((prev) => ({ ...prev, services: '' }))
  }

  const allServicesSelected = useMemo(() => (
    serviceOptions.length > 0
    && serviceOptions.every((service) => draftServices.includes(service))
  ), [draftServices, serviceOptions])

  const someServicesSelected = draftServices.length > 0 && !allServicesSelected

  const toggleAllServices = () => {
    setDraftServices(allServicesSelected ? [] : [...serviceOptions])
    setFormErrors((prev) => ({ ...prev, services: '' }))
  }

  useEffect(() => {
    if (checkAllServicesRef.current) {
      checkAllServicesRef.current.indeterminate = someServicesSelected
    }
  }, [someServicesSelected, allServicesSelected])

  const toggleDayOff = (day: DayKey, dayOff: boolean) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        dayOff,
        start: dayOff ? '' : prev[day].start,
        end: dayOff ? '' : prev[day].end,
      },
    }))
    setShowScheduleValidation(false)
  }

  const updateScheduleTime = (day: DayKey, field: 'start' | 'end', value: string) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
    setShowScheduleValidation(false)
  }

  const toggleSms = async (id: string) => {
    const previous = members.find((member) => member.id === id)
    if (!previous || pendingToggleIds[id]) return

    setMembers((prev) => prev.map((member) => (
      member.id === id ? { ...member, smsEnabled: !member.smsEnabled } : member
    )))
    setPendingToggleIds((prev) => ({ ...prev, [id]: true }))

    try {
      const nextStatus = await toggleStaffStatusMutation.mutateAsync(id)
      const isEnabled = isStaffStatusActive(nextStatus)
      setMembers((prev) => prev.map((member) => (
        member.id === id ? { ...member, smsEnabled: isEnabled } : member
      )))
      showToast(t(`${TK}.toggleStaffSuccess`), 'success')
    } catch (error) {
      setMembers((prev) => prev.map((member) => (
        member.id === id ? { ...member, smsEnabled: previous.smsEnabled } : member
      )))
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
    } finally {
      setPendingToggleIds((prev) => ({ ...prev, [id]: false }))
    }
  }

  const saveModal = () => {
    const nextErrors: {
      name?: string
      phone?: string
      email?: string
      services?: string
    } = {}
    const trimmedName = draftName.trim()
    const normalizedPhone = `${draftPhoneParsed.countryCode} ${formatNationalNumber(draftPhoneParsed.nationalNumber, draftPhoneParsed.countryCode)}`.trim()
    const trimmedEmail = draftEmail.trim()

    if (!trimmedName) nextErrors.name = t(`${TK}.requiredField`)
    if (!draftPhoneParsed.nationalNumber.trim()) {
      nextErrors.phone = t(`${TK}.requiredField`)
    }
    if (!trimmedEmail) {
      nextErrors.email = t(`${TK}.requiredField`)
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = t(`${TK}.invalidEmail`)
    }
    if (!draftServices.length) nextErrors.services = t(`${TK}.requiredField`)

    const scheduleInvalid = hasScheduleValidationError(
      draftSchedule,
      scheduleRequiredMessage,
      scheduleInvalidMessage,
    )

    setFormErrors(nextErrors)
    setShowScheduleValidation(scheduleInvalid)

    if (Object.keys(nextErrors).length > 0 || scheduleInvalid) {
      if (scheduleInvalid) {
        window.requestAnimationFrame(() => {
          document.querySelector('[data-tech-schedule-section]')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          })
        })
      }
      return
    }

    const payload = {
      name: trimmedName,
      phone: normalizedPhone,
      email: trimmedEmail,
      services: draftServices,
      schedule: serializeSchedule(draftSchedule),
    }

    if (modalMode === 'create') {
      const schedules = DAY_KEYS.map((day) => {
        const row = draftSchedule[day]
        if (row.dayOff) {
          return {
            dayOfWeek: DAY_KEY_TO_API_DAY[day],
            isDayOff: true,
            startTime: null,
            endTime: null,
          }
        }
        return {
          dayOfWeek: DAY_KEY_TO_API_DAY[day],
          isDayOff: false,
          startTime: row.start ? `${row.start}:00` : null,
          endTime: row.end ? `${row.end}:00` : null,
        }
      })

      createStaffMutation.mutate({
        fullName: payload.name,
        phoneNumber: payload.phone,
        email: payload.email || null,
        skills: payload.services.join(', '),
        schedules,
      }, {
        onSuccess: (created) => {
          setSelectedId(created.id)
          showToast(t(`${TK}.saveSuccess`), 'success')
          closeModal()
        },
        onError: (error) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
        },
      })
      return
    }

    if (!selectedId) return

    const editingMember = members.find((member) => member.id === selectedId)
    const schedules = DAY_KEYS.map((day) => {
      const row = draftSchedule[day]
      if (row.dayOff) {
        return {
          dayOfWeek: mapDayOfWeekToApiName(DAY_KEY_TO_API_DAY[day]),
          isDayOff: true,
          startTime: null,
          endTime: null,
        }
      }
      return {
        dayOfWeek: mapDayOfWeekToApiName(DAY_KEY_TO_API_DAY[day]),
        isDayOff: false,
        startTime: row.start ? `${row.start}:00` : null,
        endTime: row.end ? `${row.end}:00` : null,
      }
    })

    updateStaffMutation.mutate({
      id: selectedId,
      fullName: payload.name,
      phoneNumber: payload.phone,
      email: payload.email,
      skills: payload.services.join(', '),
      status: mapStaffStatusToActivityApi(
        editingMember?.smsEnabled ? MerchantVoiceStaffStatus.Active : MerchantVoiceStaffStatus.Inactive,
      ),
      schedules,
    }, {
      onSuccess: () => {
        showToast(t(`${TK}.saveSuccess`), 'success')
        closeModal()
      },
      onError: (error) => {
        showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
      },
    })
  }

  const modalTitle = modalMode === 'create'
    ? t(`${TK}.modalTitleCreate`)
    : t(`${TK}.modalTitleEdit`)

  const modalSub = modalMode === 'create'
    ? t(`${TK}.modalSubCreate`)
    : t(`${TK}.modalSubEdit`, { name: draftName || t(`${TK}.selectedTech`) })

  const hasScheduleError = useMemo(
    () => hasScheduleValidationError(draftSchedule, scheduleRequiredMessage, scheduleInvalidMessage),
    [draftSchedule, scheduleInvalidMessage, scheduleRequiredMessage],
  )

  useEffect(() => {
    const mapped = (staffResponse?.items ?? []).map(toTeamMember)
    setMembers(mapped)
    setSelectedId((prev) => prev || mapped[0]?.id || '')
  }, [staffResponse?.items])

  useEffect(() => {
    if (!staffDetail || modalMode === 'create') return
    fillDraftFromMember(
      toTeamMember(staffDetail),
      'edit',
      schedulesToWeeklySchedule(staffDetail.schedules),
    )
  }, [staffDetail, modalMode])

  useEffect(() => {
    if (!modalOpen) {
      document.body.style.overflow = ''
      return undefined
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [modalOpen])

  useEffect(() => {
    if (!comboboxOpen) return undefined

    const handlePointerDown = (event: MouseEvent) => {
      if (!comboboxRef.current?.contains(event.target as Node)) {
        setComboboxOpen(false)
      }
    }

    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [comboboxOpen])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery.trim())
    }, 350)
    return () => window.clearTimeout(timeoutId)
  }, [searchQuery])

  return (
    <div className="booking-sub-panel is-active" aria-busy={isStaffLoading}>
      <div className="tech-intro">
        <div className="tech-intro-text">{t(`${TK}.intro`)}</div>
        <button className="booking-primary-button" type="button" onClick={() => openModal()}>
          <PlusIcon />
          <span>{t(`${TK}.addTech`)}</span>
        </button>
      </div>

      <div className="booking-grid">
        <article className="overview-card overview-card-pad">
          <div className="tech-grid">
            {isStaffLoading ? (
              <BookingTeamGridSkeleton count={3} />
            ) : null}
            {!isStaffLoading && members.length === 0 ? (
              <div className="tech-grid-empty">
                <div className="tech-grid-empty-icon" aria-hidden="true">
                  <PeopleIcon />
                </div>
                <div className="tech-grid-empty-title">{t(`${TK}.emptyTitle`)}</div>
                <p className="tech-grid-empty-description">{t(`${TK}.emptyDescription`)}</p>
                <button className="booking-primary-button" type="button" onClick={() => openModal()}>
                  <PlusIcon />
                  <span>{t(`${TK}.emptyCta`)}</span>
                </button>
              </div>
            ) : null}
            {!isStaffLoading ? members.map((member) => (
              <article
                className="tech-card tech-card-interactive"
                key={member.id}
                data-tech-id={member.id}
                onClick={() => openModal(member.id, 'edit')}
              >
                <div className="tech-top">
                  <div className="tech-avatar" style={member.avatarStyle}>{member.avatar}</div>
                  <div className="tech-profile">
                    <div className="tech-name">{member.name}</div>
                    <div className="tech-phone">{formatPhoneDisplay(member.phone)}</div>
                  </div>
                  <div
                    className="tech-top-actions"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                  >
                    <button
                      className="booking-secondary-button icon-only tech-view-button"
                      type="button"
                      aria-label={t(`${TK}.viewDetails`)}
                      title={t(`${TK}.viewDetails`)}
                      onClick={() => openModal(member.id, 'edit')}
                    >
                      <EyeIcon />
                      <span className="sr-only">{t(`${TK}.viewDetails`)}</span>
                    </button>
                    <button
                      className={`toggle-pill ${member.smsEnabled ? 'is-on' : ''}`}
                      type="button"
                      aria-label={t(`${TK}.toggleSms`, { name: member.name })}
                      aria-pressed={member.smsEnabled}
                      disabled={pendingToggleIds[member.id]}
                      onClick={() => toggleSms(member.id)}
                    />
                  </div>
                </div>
                <div className="tech-services">
                  {member.services.map((service) => (
                    <span className="badge badge-plan" key={service}>{service}</span>
                  ))}
                </div>
              </article>
            )) : null}
          </div>

          {!isStaffLoading && (staffResponse?.totalCount ?? 0) > 0 ? (
            <Pagination
              pageNumber={pageNumber}
              pageSize={pageSize}
              totalPages={staffResponse?.totalPages ?? 1}
              totalCount={staffResponse?.totalCount ?? 0}
              hasNextPage={staffResponse?.hasNextPage}
              hasPreviousPage={staffResponse?.hasPreviousPage}
              onPageChange={setPage}
              isLoading={isStaffFetching}
            />
          ) : null}
        </article>
      </div>

      {modalOpen ? (
        <div
          className="tech-modal"
          data-tech-mode={modalMode}
          role="presentation"
          onClick={closeModal}
        >
          <div
            className="tech-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="tech-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="tech-modal-head">
              <div className="tech-modal-heading">
                <span className="tech-title-mark"><PersonPlusIcon /></span>
                <div>
                  <div className="tech-modal-title" id="tech-modal-title">
                    {modalTitle}
                  </div>
                  <div className="tech-modal-sub">{modalSub}</div>
                </div>
              </div>
              <button className="tech-modal-close" type="button" aria-label={t(`${TK}.close`)} onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <div className="tech-modal-body">
              <div className="tech-modal-section" data-tech-picker-section>
                <div className="tech-modal-section-title">
                  <PeopleIcon />
                  <span>{t(`${TK}.selectFromList`)}</span>
                </div>
                <div className="tech-select-row">
                  <div className={`tech-combobox ${comboboxOpen ? 'is-open' : ''}`} ref={comboboxRef}>
                    <label className="tech-search">
                      <span className="tech-search-icon"><SearchIcon /></span>
                      <input
                        type="search"
                        role="combobox"
                        aria-expanded={comboboxOpen}
                        aria-controls="tech-select-menu"
                        placeholder={t(`${TK}.searchPlaceholder`)}
                        autoComplete="off"
                        value={searchQuery}
                        onChange={(event) => {
                          setSearchQuery(event.target.value)
                          setComboboxOpen(true)
                        }}
                        onFocus={() => setComboboxOpen(true)}
                      />
                      <span className="tech-select-chevron"><ChevronDownIcon /></span>
                    </label>
                    {comboboxOpen ? (
                      <div className="tech-select-menu" id="tech-select-menu">
                        {isBusinessStaffLoading ? (
                          <BookingTechStaffListSkeleton count={3} />
                        ) : (
                        <div className="tech-choice-grid" role="listbox" aria-label={t(`${TK}.techList`)}>
                          {filteredBusinessStaff.map((member) => (
                            <button
                              key={member.id}
                              className={`tech-choice-card ${selectedId === member.id ? 'is-active' : ''} ${member.isAlreadyAdded ? 'is-disabled' : ''}`}
                              type="button"
                              role="option"
                              aria-selected={selectedId === member.id}
                              aria-disabled={member.isAlreadyAdded}
                              disabled={member.isAlreadyAdded}
                              onClick={() => selectBusinessStaff(member)}
                            >
                              <span className="tech-avatar" style={member.avatarStyle}>{member.avatar}</span>
                              <span>
                                <span className="tech-choice-name">
                                  {member.name}
                                  {member.isAlreadyAdded ? (
                                    <span className="tech-choice-badge">{t(`${TK}.alreadyAdded`)}</span>
                                  ) : null}
                                </span>
                                <span className="tech-choice-meta">
                                  {member.position || member.email || '—'} · {formatPhoneDisplay(member.phone)}
                                </span>
                              </span>
                            </button>
                          ))}
                        </div>
                        )}
                        {!isBusinessStaffLoading && filteredBusinessStaff.length === 0 ? (
                          <div className="tech-empty is-visible">
                            {t(`${TK}.noMatch`)}
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                  <button
                    className={`booking-secondary-button tech-create-button ${modalMode === 'create' ? 'is-active' : ''}`}
                    type="button"
                    onClick={startCreate}
                  >
                    <PlusIcon />
                    <span>{t(`${TK}.createNew`)}</span>
                  </button>
                </div>
              </div>

              <div className="tech-modal-section">
                <div className="tech-modal-section-title">
                  <PersonCardIcon />
                  <span>{t(`${TK}.profileDetails`)}</span>
                </div>
                {modalMode !== 'create' && isStaffDetailLoading ? (
                  <BookingTechModalProfileSkeleton />
                ) : (
                <div className="tech-modal-grid">
                  <div className="settings-field">
                    <span className="settings-label">{t(`${TK}.techName`)}</span>
                    <input
                      className="settings-input"
                      type="text"
                      value={draftName}
                      aria-invalid={Boolean(formErrors.name)}
                      placeholder={t(`${TK}.placeholderTechName`)}
                      onChange={(event) => {
                        setDraftName(event.target.value)
                        setFormErrors((prev) => ({ ...prev, name: '' }))
                      }}
                    />
                    <span className="field-error-slot" aria-live="polite">
                      {formErrors.name ? <span className="field-error">{formErrors.name}</span> : null}
                    </span>
                  </div>
                  <div className="settings-field">
                    <span className="settings-label">{t(`${TK}.phone`)}</span>
                    <span className="phone-input-shell">
                      <CountryCodeSelect
                        value={draftPhoneParsed.countryCode}
                        embedded
                        onChange={(nextCode) => {
                          const formatted = formatNationalNumber(draftPhoneParsed.nationalNumber, nextCode)
                          setDraftPhone(`${nextCode} ${formatted}`.trim())
                          setFormErrors((prev) => ({ ...prev, phone: '' }))
                        }}
                      />
                      <input
                        className="settings-input phone-mask-input"
                        type="tel"
                        value={formatNationalNumber(draftPhoneParsed.nationalNumber, draftPhoneParsed.countryCode)}
                        aria-invalid={Boolean(formErrors.phone)}
                        placeholder={t(`${TK}.placeholderPhoneMask`)}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        onChange={(event) => {
                          const formatted = formatNationalNumber(event.target.value, draftPhoneParsed.countryCode)
                          setDraftPhone(`${draftPhoneParsed.countryCode} ${formatted}`.trim())
                          setFormErrors((prev) => ({ ...prev, phone: '' }))
                        }}
                      />
                    </span>
                    <span className="field-error-slot" aria-live="polite">
                      {formErrors.phone ? <span className="field-error">{formErrors.phone}</span> : null}
                    </span>
                  </div>
                  <div className="settings-field">
                    <span className="settings-label">{t(`${TK}.email`)}</span>
                    <input
                      className="settings-input"
                      type="email"
                      value={draftEmail}
                      aria-invalid={Boolean(formErrors.email)}
                      placeholder={t(`${TK}.placeholderEmail`)}
                      onChange={(event) => {
                        setDraftEmail(event.target.value)
                        setFormErrors((prev) => ({ ...prev, email: '' }))
                      }}
                    />
                    <span className="field-error-slot" aria-live="polite">
                      {formErrors.email ? <span className="field-error">{formErrors.email}</span> : null}
                    </span>
                  </div>
                  <div className="settings-field">
                    <div className="tech-services-field-head">
                      <span className="settings-label">{t(`${TK}.services`)}</span>
                      {!isConfigLoading && serviceOptions.length > 0 ? (
                        <label className="tech-service-check-all-toggle">
                          <input
                            ref={checkAllServicesRef}
                            type="checkbox"
                            checked={allServicesSelected}
                            onChange={toggleAllServices}
                          />
                          <span>{t(`${TK}.checkAllServices`)}</span>
                        </label>
                      ) : null}
                    </div>
                    {isConfigLoading ? (
                      <BookingTechServicesSkeleton count={4} />
                    ) : serviceOptions.length > 0 ? (
                      <div className="tech-service-checks">
                        {serviceOptions.map((service) => (
                          <label className="tech-service-check" key={service}>
                            <input
                              type="checkbox"
                              checked={draftServices.includes(service)}
                              onChange={() => toggleService(service)}
                            />
                            {service}
                          </label>
                        ))}
                      </div>
                    ) : (
                      <div className="tech-service-empty">{t(`${TK}.servicesEmpty`)}</div>
                    )}
                    <span className="field-error-slot" aria-live="polite">
                      {formErrors.services ? <span className="field-error">{formErrors.services}</span> : null}
                    </span>
                  </div>
                </div>
                )}
              </div>

              <div className="tech-modal-section" data-tech-schedule-section>
                <div className="tech-modal-section-title">
                  <CalendarWeekIcon />
                  <span>{t(`${TK}.weeklySchedule`)}</span>
                </div>
                {modalMode !== 'create' && isStaffDetailLoading ? (
                  <BookingTechScheduleSkeleton />
                ) : (
                <>
                <div className="tech-schedule">
                  {DAY_KEYS.map((day) => {
                    const row = draftSchedule[day]
                    const rowError = getScheduleRowError(row, scheduleRequiredMessage, scheduleInvalidMessage)
                    const showRowError = showScheduleValidation && !!rowError
                    const rowMissingTime = isScheduleRowMissingTime(row)
                    return (
                    <div
                      key={day}
                      className={`tech-schedule-row ${row.dayOff ? 'is-day-off' : ''} ${showRowError ? 'has-error' : ''}`}
                      role="button"
                      tabIndex={0}
                      onClick={() => toggleDayOff(day, !row.dayOff)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          toggleDayOff(day, !row.dayOff)
                        }
                      }}
                    >
                      <span className="tech-schedule-day">{t(`${TK}.days.${day}`)}</span>
                      <label className="tech-schedule-off">
                        <input
                          className="tech-schedule-toggle"
                          type="checkbox"
                          checked={row.dayOff}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => toggleDayOff(day, event.target.checked)}
                        />
                        {t(`${TK}.dayOff`)}
                      </label>
                      <span className="tech-schedule-time" lang="en-US-u-hc-h12">
                        <input
                          type="time"
                          value={row.start}
                          lang="en-US-u-hc-h12"
                          step={60}
                          disabled={row.dayOff}
                          aria-invalid={showRowError && (rowMissingTime || isScheduleRowInvalid(row))}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateScheduleTime(day, 'start', event.target.value)}
                        />
                        <span>{t(`${TK}.scheduleTo`)}</span>
                        <input
                          type="time"
                          value={row.end}
                          lang="en-US-u-hc-h12"
                          step={60}
                          disabled={row.dayOff}
                          aria-invalid={showRowError && (rowMissingTime || isScheduleRowInvalid(row))}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => updateScheduleTime(day, 'end', event.target.value)}
                        />
                      </span>
                      {showRowError ? (
                        <span className="tech-schedule-row-error">
                          {rowError}
                        </span>
                      ) : null}
                    </div>
                    )
                  })}
                </div>
                {showScheduleValidation && hasScheduleError ? (
                  <div className="tech-schedule-error">{t(`${TK}.scheduleValidationSummary`)}</div>
                ) : null}
                </>
                )}
              </div>
            </div>

            <div className="tech-modal-actions">
              <button className="booking-secondary-button" type="button" onClick={closeModal}>
                {t(`${TK}.close`)}
              </button>
              <button
                className="booking-primary-button"
                type="button"
                disabled={createStaffMutation.isPending || updateStaffMutation.isPending}
                onClick={saveModal}
              >
                {(createStaffMutation.isPending || updateStaffMutation.isPending)
                  ? <SpinnerIcon className="booking-inline-spinner" />
                  : <CheckIcon />}
                <span>{t(`${TK}.saveTech`)}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
