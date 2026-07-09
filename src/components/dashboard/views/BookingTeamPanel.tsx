import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'

const TK = 'components.dashboard.views.BookingHubView.team'

const ALL_SERVICES = ['Gel', 'Full Set', 'Dip', 'Pedicure', 'Nail Art', 'Acrylic', 'Waxing', 'Eyelash']

interface TeamMember {
  id: string
  name: string
  phone: string
  email: string
  services: string[]
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
    customers: 2,
    avatar: 'M',
    avatarStyle: { background: 'linear-gradient(135deg, #f472b6, var(--nexora-violet))' },
    smsEnabled: true,
  },
]

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
  const defaultSmsNote = t(`${TK}.defaultSmsNote`)
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_TEAM_MEMBERS)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'edit' | 'create'>('edit')
  const [selectedId, setSelectedId] = useState(INITIAL_TEAM_MEMBERS[0].id)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [draftName, setDraftName] = useState('')
  const [draftPhone, setDraftPhone] = useState('')
  const [draftEmail, setDraftEmail] = useState('')
  const [draftServices, setDraftServices] = useState<string[]>([])
  const [draftNote, setDraftNote] = useState(defaultSmsNote)
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

  const fillDraftFromMember = (member: TeamMember | undefined, mode: 'edit' | 'create') => {
    if (mode === 'create' || !member) {
      setDraftName('')
      setDraftPhone('')
      setDraftEmail('')
      setDraftServices([])
      setDraftNote(defaultSmsNote)
      return
    }
    setDraftName(member.name)
    setDraftPhone(member.phone)
    setDraftEmail(member.email)
    setDraftServices([...member.services])
    setDraftNote(defaultSmsNote)
  }

  const openModal = () => {
    const first = members[0]
    setModalMode('edit')
    setSelectedId(first?.id ?? '')
    setSearchQuery('')
    setComboboxOpen(false)
    fillDraftFromMember(first, 'edit')
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
            avatar: payload.name.charAt(0).toUpperCase() || member.avatar,
          }
          : member
      )))
    }

    closeModal()
  }

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
        <button className="booking-primary-button" type="button" onClick={openModal}>
          <PlusIcon />
          <span>{t(`${TK}.addTech`)}</span>
        </button>
      </div>

      <div className="tech-grid">
        {members.map((member) => (
          <article className="tech-card" key={member.id} data-tech-id={member.id}>
            <div className="tech-top">
              <div className="tech-avatar" style={member.avatarStyle}>{member.avatar}</div>
              <div className="tech-copy">
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
            <div className="tech-stats">
              <div className="tech-stat">
                <strong>{member.customers}</strong>
                <span>{t(`${TK}.clientsToday`)}</span>
              </div>
            </div>
          </article>
        ))}
      </div>

      {modalOpen ? (
        <div className="tech-modal" role="presentation" onClick={closeModal}>
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
                    {t(`${TK}.modalTitle`)}
                  </div>
                  <div className="tech-modal-sub">{t(`${TK}.modalSub`)}</div>
                </div>
              </div>
              <button className="tech-modal-close" type="button" aria-label={t(`${TK}.close`)} onClick={closeModal}>
                <CloseIcon />
              </button>
            </div>

            <div className="tech-modal-body">
              <div className="tech-modal-section">
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
                              className={`tech-choice-card ${modalMode === 'edit' && selectedId === member.id ? 'is-active' : ''}`}
                              type="button"
                              role="option"
                              aria-selected={modalMode === 'edit' && selectedId === member.id}
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
                  <button className="booking-secondary-button tech-create-button" type="button" onClick={startCreate}>
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
                    <input
                      className="settings-input"
                      type="tel"
                      value={draftPhone}
                      placeholder={t(`${TK}.placeholderPhone`)}
                      onChange={(event) => setDraftPhone(event.target.value)}
                    />
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
                  <label className="settings-field">
                    <span className="settings-label">{t(`${TK}.smsNote`)}</span>
                    <textarea
                      className="settings-textarea"
                      value={draftNote}
                      placeholder={t(`${TK}.placeholderSmsNote`)}
                      onChange={(event) => setDraftNote(event.target.value)}
                    />
                  </label>
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
