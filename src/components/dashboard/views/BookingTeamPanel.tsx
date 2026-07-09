import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { EyeIcon } from './BookingHubIcons'

const TK = 'components.dashboard.views.BookingHubView.team'

const ALL_SERVICES = ['Gel', 'Full Set', 'Dip', 'Pedicure', 'Nail Art', 'Acrylic', 'Waxing', 'Eyelash']
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

const INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'kim',
    name: 'Kim Nguyễn',
    phone: '832-555-0161',
    email: 'kim@nexoratouch.com',
    services: ['Gel', 'Full Set', 'Dip'],
    schedule: 'mon=09:00-18:00;tue=09:00-18:00;wed=09:00-18:00;thu=10:00-19:00;fri=09:00-18:00',
    customers: 3,
    avatar: 'K',
    smsEnabled: true,
  },
  {
    id: 'lan',
    name: 'Lan Trần',
    phone: '713-555-0192',
    email: 'lan.tran@nexoratouch.com',
    services: ['Pedicure', 'Gel', 'Nail Art'],
    schedule: 'tue=10:00-19:00;wed=10:00-19:00;thu=10:00-19:00;fri=10:00-19:00;sat=09:00-16:00',
    customers: 2,
    avatar: 'L',
    avatarStyle: { background: 'linear-gradient(135deg, var(--brand-cyan), var(--nexora-electric))' },
    smsEnabled: true,
  },
  {
    id: 'mai',
    name: 'Mai Phạm',
    phone: '281-555-0138',
    email: 'mai.pham@nexoratouch.com',
    services: ['Acrylic', 'Dip', 'Pedicure'],
    schedule: 'mon=11:00-20:00;wed=11:00-20:00;fri=11:00-20:00;sat=10:00-17:00;sun=10:00-15:00',
    customers: 2,
    avatar: 'M',
    avatarStyle: { background: 'linear-gradient(135deg, #f472b6, var(--nexora-violet))' },
    smsEnabled: true,
  },
]

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
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<ModalMode>('edit')
  const [selectedId, setSelectedId] = useState(INITIAL_TEAM_MEMBERS[0].id)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftServices, setDraftServices] = useState<string[]>([])
  const [draftSchedule, setDraftSchedule] = useState<WeeklySchedule>(emptySchedule())
  const comboboxRef = useRef<HTMLDivElement>(null)

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) => (
      member.name.toLowerCase().includes(q)
      || member.email.toLowerCase().includes(q)
      || member.phone.includes(q)
    ))
  }, [members, searchQuery])

  const fillDraftFromMember = (member: TeamMember | undefined, mode: ModalMode) => {
    if (mode === 'create' || !member) {
      setDraftName('')
      setDraftPhone('')
      setDraftEmail('')
      setDraftServices([])
      setDraftSchedule(emptySchedule())
      return
    }
    setDraftName(member.name)
    setDraftPhone(member.phone)
    setDraftEmail(member.email)
    setDraftServices([...member.services])
    setDraftSchedule(parseSchedule(member.schedule))
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
    setSearchQuery(mode === 'detail' ? '' : (target?.name ?? ''))
    setComboboxOpen(false)
    fillDraftFromMember(target, mode === 'create' ? 'create' : 'edit')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setComboboxOpen(false)
    setSearchQuery('')
  }

  const selectMember = (member: TeamMember) => {
    setModalMode('edit')
    setSelectedId(member.id)
    fillDraftFromMember(member, 'edit')
    setComboboxOpen(false)
    setSearchQuery(member.name)
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
  }

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
  }

  const updateScheduleTime = (day: DayKey, field: 'start' | 'end', value: string) => {
    setDraftSchedule((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }))
  }

  const toggleSms = (id: string) => {
    setMembers((prev) => prev.map((member) => (
      member.id === id ? { ...member, smsEnabled: !member.smsEnabled } : member
    )))
  }

  const saveModal = () => {
    const payload = {
      name: draftName.trim() || t(`${TK}.newTech`),
      phone: draftPhone.trim() || t(`${TK}.noPhone`),
      email: draftEmail.trim(),
      services: draftServices.length ? draftServices : ['Gel'],
      schedule: serializeSchedule(draftSchedule),
    }

    if (modalMode === 'create') {
      const id = `tech-${Date.now()}`
      const avatar = payload.name.charAt(0).toUpperCase() || 'T'
      setMembers((prev) => [...prev, {
        id,
        ...payload,
        avatar,
        customers: 0,
        smsEnabled: true,
      }])
      setSelectedId(id)
    } else {
      setMembers((prev) => prev.map((member) => (
        member.id === selectedId
          ? {
            ...member,
            name: payload.name,
            phone: payload.phone,
            email: payload.email,
            services: payload.services,
            schedule: payload.schedule,
            avatar: payload.name.charAt(0).toUpperCase() || member.avatar,
          }
          : member
      )))
    }

    closeModal()
  }

  const modalTitle = modalMode === 'create'
    ? t(`${TK}.modalTitleCreate`)
    : t(`${TK}.modalTitleEdit`)

  const modalSub = modalMode === 'create'
    ? t(`${TK}.modalSubCreate`)
    : t(`${TK}.modalSubEdit`, { name: draftName || t(`${TK}.selectedTech`) })

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

  return (
    <div className="booking-sub-panel is-active">
      <div className="tech-intro">
        <div className="tech-intro-text">{t(`${TK}.intro`)}</div>
        <button className="booking-primary-button" type="button" onClick={() => openModal()}>
          <PlusIcon />
          <span>{t(`${TK}.addTech`)}</span>
        </button>
      </div>

      <div className="tech-grid">
        {members.map((member) => (
          <article className="tech-card" key={member.id} data-tech-id={member.id}>
            <div className="tech-top">
              <div className="tech-avatar" style={member.avatarStyle}>{member.avatar}</div>
              <div className="tech-profile">
                <div className="tech-name">{member.name}</div>
                <div className="tech-phone">{member.phone}</div>
              </div>
              <button
                className={`toggle-pill ${member.smsEnabled ? 'is-on' : ''}`}
                type="button"
                aria-label={t(`${TK}.toggleSms`, { name: member.name })}
                aria-pressed={member.smsEnabled}
                onClick={() => toggleSms(member.id)}
              />
            </div>
            <div className="tech-services">
              {member.services.map((service) => (
                <span className="badge badge-plan" key={service}>{service}</span>
              ))}
            </div>
            <div className="tech-card-footer">
              <div className="tech-stats">
                <div className="tech-stat">
                  <strong>{member.customers}</strong>
                  <span>{t(`${TK}.clientsToday`)}</span>
                </div>
              </div>
              <div className="tech-card-actions">
                <button
                  className="booking-secondary-button icon-only"
                  type="button"
                  aria-label={t(`${TK}.viewDetails`)}
                  title={t(`${TK}.viewDetails`)}
                  onClick={() => openModal(member.id, 'detail')}
                >
                  <EyeIcon />
                  <span className="sr-only">{t(`${TK}.viewDetails`)}</span>
                </button>
              </div>
            </div>
          </article>
        ))}
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
                        <div className="tech-choice-grid" role="listbox" aria-label={t(`${TK}.techList`)}>
                          {filteredMembers.map((member) => (
                            <button
                              key={member.id}
                              className={`tech-choice-card ${modalMode !== 'create' && selectedId === member.id ? 'is-active' : ''}`}
                              type="button"
                              role="option"
                              aria-selected={modalMode !== 'create' && selectedId === member.id}
                              onClick={() => selectMember(member)}
                            >
                              <span className="tech-avatar" style={member.avatarStyle}>{member.avatar}</span>
                              <span>
                                <span className="tech-choice-name">{member.name}</span>
                                <span className="tech-choice-meta">{member.email} · {member.phone}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                        {filteredMembers.length === 0 ? (
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
                <div className="tech-modal-grid">
                  <label className="settings-field">
                    <span className="settings-label">{t(`${TK}.techName`)}</span>
                    <input
                      className="settings-input"
                      type="text"
                      value={draftName}
                      placeholder={t(`${TK}.placeholderTechName`)}
                      onChange={(event) => setDraftName(event.target.value)}
                    />
                  </label>
                  <label className="settings-field">
                    <span className="settings-label">{t(`${TK}.phone`)}</span>
                    <span className="phone-input-shell">
                      <select className="phone-country-select" aria-label={t(`${TK}.countryCode`)}>
                        <option value="+1">+1</option>
                      </select>
                      <input
                        className="settings-input phone-mask-input"
                        type="tel"
                        value={draftPhone}
                        placeholder={t(`${TK}.placeholderPhoneMask`)}
                        inputMode="numeric"
                        autoComplete="tel-national"
                        onChange={(event) => setDraftPhone(event.target.value)}
                      />
                    </span>
                  </label>
                  <label className="settings-field">
                    <span className="settings-label">{t(`${TK}.email`)}</span>
                    <input
                      className="settings-input"
                      type="email"
                      value={draftEmail}
                      placeholder={t(`${TK}.placeholderEmail`)}
                      onChange={(event) => setDraftEmail(event.target.value)}
                    />
                  </label>
                  <div className="settings-field">
                    <span className="settings-label">{t(`${TK}.services`)}</span>
                    <div className="tech-service-checks">
                      {ALL_SERVICES.map((service) => (
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
                  </div>
                </div>
              </div>

              <div className="tech-modal-section" data-tech-schedule-section>
                <div className="tech-modal-section-title">
                  <CalendarWeekIcon />
                  <span>{t(`${TK}.weeklySchedule`)}</span>
                </div>
                <div className="tech-schedule">
                  {DAY_KEYS.map((day) => (
                    <div
                      key={day}
                      className={`tech-schedule-row ${draftSchedule[day].dayOff ? 'is-day-off' : ''}`}
                    >
                      <span className="tech-schedule-day">{t(`${TK}.days.${day}`)}</span>
                      <label className="tech-schedule-off">
                        <input
                          className="tech-schedule-toggle"
                          type="checkbox"
                          checked={draftSchedule[day].dayOff}
                          onChange={(event) => toggleDayOff(day, event.target.checked)}
                        />
                        {t(`${TK}.dayOff`)}
                      </label>
                      <span className="tech-schedule-time">
                        <input
                          type="time"
                          value={draftSchedule[day].start}
                          disabled={draftSchedule[day].dayOff}
                          onChange={(event) => updateScheduleTime(day, 'start', event.target.value)}
                        />
                        <span>{t(`${TK}.scheduleTo`)}</span>
                        <input
                          type="time"
                          value={draftSchedule[day].end}
                          disabled={draftSchedule[day].dayOff}
                          onChange={(event) => updateScheduleTime(day, 'end', event.target.value)}
                        />
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="tech-modal-actions">
              <button className="booking-secondary-button" type="button" onClick={closeModal}>
                {t(`${TK}.close`)}
              </button>
              <button className="booking-primary-button" type="button" onClick={saveModal}>
                <CheckIcon />
                <span>{t(`${TK}.saveTech`)}</span>
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
