import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  BroadcastIcon,
  CalendarKpiIcon,
  CheckKpiIcon,
  CheckLgIcon,
  ClockIcon,
  EyeIcon,
  GridIcon,
  JournalIcon,
  PersonWorkspaceIcon,
  SendIcon,
  StarsIcon,
  TableIcon,
  XLgIcon,
  XKpiIcon,
} from './BookingHubIcons'

const TK = 'components.dashboard.views.BookingHubView'
const TODAY_ISO = '2026-07-09'

const KPI_ACCENT_ELECTRIC = { '--kpi-accent': 'var(--nexora-electric)' } as React.CSSProperties
const KPI_ACCENT_SUCCESS = { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties
const KPI_ACCENT_RED = { '--kpi-accent': '#ef4444' } as React.CSSProperties

const SOURCE_KEY_MAP: Record<string, string> = {
  Voice: 'sources.voice',
  'Landing Page': 'sources.landingPage',
  SMS: 'sources.sms',
  QR: 'sources.qr',
}

type BookingStatus = 'done' | 'sms-sent' | 'new' | 'noshow'
type BookingSource = 'Voice' | 'Landing Page' | 'SMS' | 'QR'
type SearchField = 'name' | 'phone' | 'email' | 'service'
type ViewMode = 'table' | 'card'

interface BookingItem {
  id: string
  name: string
  phone: string
  phoneDisplay: string
  email: string
  services: string[]
  tech: string
  date: string
  timeMain: string
  timeDate: string
  source: BookingSource
  sourceClass: string
  request?: boolean
  status: BookingStatus
  note: string
}

const INITIAL_BOOKINGS: BookingItem[] = [
  {
    id: 'booking-kim-phan',
    name: 'Kim Phan',
    phone: '7135550148',
    phoneDisplay: '(713) 555-0148',
    email: 'kim.phan@example.com',
    services: ['Pedicure', 'Gel Polish'],
    tech: 'Lan T.',
    date: '2026-07-09',
    timeMain: 'Today 9:00 AM',
    timeDate: 'July 9, 2026',
    source: 'Voice',
    sourceClass: 'booking-source-voice',
    status: 'done',
    note: 'Prefers warm water and extra heel care. Customer confirmed arrival by phone and asked to keep the same chair as last visit.',
  },
  {
    id: 'booking-sophie-tran',
    name: 'Sophie Tran',
    phone: '2815550196',
    phoneDisplay: '(281) 555-0196',
    email: 'sophie.tran@example.com',
    services: ['Gel Manicure', 'Nail Art'],
    tech: 'Kim N.',
    date: '2026-07-09',
    timeMain: 'Today 10:30 AM',
    timeDate: 'July 9, 2026',
    source: 'Landing Page',
    sourceClass: 'booking-source-lp',
    status: 'sms-sent',
    note: 'Booked from landing page after seeing the gel manicure promo. Customer wants a neutral pink base with one simple accent nail.',
  },
  {
    id: 'booking-mai-nguyen',
    name: 'Mai Nguyen',
    phone: '8325550164',
    phoneDisplay: '(832) 555-0164',
    email: 'mai.nguyen@example.com',
    services: ['Gel Full Set', 'Removal'],
    tech: 'Linda',
    date: '2026-07-09',
    timeMain: 'Today 1:00 PM',
    timeDate: 'July 9, 2026',
    source: 'Voice',
    sourceClass: 'booking-source-voice',
    request: true,
    status: 'new',
    note: 'Customer initially requested Elio but he was unavailable; booked with Linda instead. Phone: 14182188221. Please confirm almond shape and light pink finish before start time.',
  },
  {
    id: 'booking-jennifer-s',
    name: 'Jennifer S.',
    phone: '7135550127',
    phoneDisplay: '(713) 555-0127',
    email: 'jennifer.s@example.com',
    services: ['Full Set Acrylic', 'French Tip'],
    tech: 'Mai P.',
    date: '2026-07-09',
    timeMain: 'Today 2:00 PM',
    timeDate: 'July 9, 2026',
    source: 'SMS',
    sourceClass: 'booking-source-sms',
    status: 'new',
    note: 'Customer asked for a quiet corner and extra time for acrylic removal. She may bring a reference photo for the French tip shape.',
  },
  {
    id: 'booking-tina-vo',
    name: 'Tina Vo',
    phone: '3465550188',
    phoneDisplay: '(346) 555-0188',
    email: 'tina.vo@example.com',
    services: ['Dip Powder', 'Chrome Design'],
    tech: 'Lan T.',
    date: '2026-07-17',
    timeMain: 'Next Friday 4:00 PM',
    timeDate: 'July 17, 2026',
    source: 'Landing Page',
    sourceClass: 'booking-source-lp',
    status: 'new',
    note: 'Requested chrome design but has not picked a color yet. Send reminder SMS the morning of the appointment.',
  },
  {
    id: 'booking-anna-le',
    name: 'Anna Le',
    phone: '2815550119',
    phoneDisplay: '(281) 555-0119',
    email: 'anna.le@example.com',
    services: ['Pedicure', 'Gel Polish'],
    tech: 'Mai P.',
    date: '2026-07-17',
    timeMain: 'Next Friday 5:30 PM',
    timeDate: 'July 17, 2026',
    source: 'QR',
    sourceClass: 'booking-source-qr',
    request: true,
    status: 'new',
    note: 'QR booking request came in after hours. Customer prefers an evening slot and asked to be notified if an earlier opening appears.',
  },
]

function rowClassForStatus(status: BookingStatus) {
  if (status === 'done') return 'is-done'
  if (status === 'sms-sent') return 'is-sms-sent'
  if (status === 'noshow') return 'is-noshow'
  return 'is-new'
}

function statusBadgeClass(status: BookingStatus) {
  if (status === 'done') return 'booking-status-done'
  if (status === 'sms-sent') return 'booking-status-sms'
  if (status === 'noshow') return 'booking-status-noshow'
  return 'booking-status-new'
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <rect width="18" height="18" x="3" y="4" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 10h18" stroke="currentColor" strokeWidth="2" />
    </svg>
  )
}

function BookingActions({
  booking,
  onAction,
  t,
}: {
  booking: BookingItem
  onAction: (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => void
  t: (key: string) => string
}) {
  const viewBtn = (
    <button
      className="booking-mini-button icon-only"
      type="button"
      aria-label={t(`${TK}.today.view`)}
      title={t(`${TK}.today.view`)}
      onClick={() => onAction(booking.id, 'detail')}
    >
      <EyeIcon />
      <span className="sr-only">{t(`${TK}.today.view`)}</span>
    </button>
  )

  if (booking.status === 'done' || booking.status === 'noshow') {
    return <div className="booking-actions">{viewBtn}</div>
  }

  if (booking.status === 'sms-sent') {
    return (
      <div className="booking-actions">
        <button
          className="booking-mini-button icon-only primary booking-done-action"
          type="button"
          aria-label={t(`${TK}.today.done`)}
          title={t(`${TK}.today.done`)}
          onClick={() => onAction(booking.id, 'done')}
        >
          <CheckLgIcon />
          <span className="sr-only">{t(`${TK}.today.done`)}</span>
        </button>
        <button
          className="booking-mini-button icon-only booking-noshow-action"
          type="button"
          aria-label={t(`${TK}.today.noShow`)}
          title={t(`${TK}.today.noShow`)}
          onClick={() => onAction(booking.id, 'noshow')}
        >
          <XLgIcon />
          <span className="sr-only">{t(`${TK}.today.noShow`)}</span>
        </button>
        {viewBtn}
      </div>
    )
  }

  return (
    <div className="booking-actions">
      <button
        className="booking-mini-button icon-only primary booking-sms-action"
        type="button"
        aria-label={t(`${TK}.today.sendSms`)}
        title={t(`${TK}.today.sendSms`)}
        onClick={() => onAction(booking.id, 'send-sms')}
      >
        <SendIcon />
        <span className="sr-only">{t(`${TK}.today.sendSms`)}</span>
      </button>
      <button
        className="booking-mini-button icon-only booking-noshow-action"
        type="button"
        aria-label={t(`${TK}.today.noShow`)}
        title={t(`${TK}.today.noShow`)}
        onClick={() => onAction(booking.id, 'noshow')}
      >
        <XLgIcon />
        <span className="sr-only">{t(`${TK}.today.noShow`)}</span>
      </button>
      {viewBtn}
    </div>
  )
}

export default function BookingTodayPanel() {
  const { t } = useTranslation()
  const [bookings, setBookings] = useState<BookingItem[]>(INITIAL_BOOKINGS)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [searchField, setSearchField] = useState<SearchField>('name')
  const [searchKeyword, setSearchKeyword] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [detailBooking, setDetailBooking] = useState<BookingItem | null>(null)

  const filteredBookings = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase()
    return bookings.filter((booking) => {
      if (dateFrom && booking.date < dateFrom) return false
      if (dateTo && booking.date > dateTo) return false
      if (!keyword) return true

      if (searchField === 'name') return booking.name.toLowerCase().includes(keyword)
      if (searchField === 'phone') return booking.phone.includes(keyword.replace(/\D/g, ''))
      if (searchField === 'email') return booking.email.toLowerCase().includes(keyword)
      return booking.services.some((service) => service.toLowerCase().includes(keyword))
    })
  }, [bookings, dateFrom, dateTo, searchField, searchKeyword])

  const stats = useMemo(() => {
    const todayCount = bookings.filter((item) => item.date === TODAY_ISO).length
    const done = bookings.filter((item) => item.status === 'done').length
    const noShow = bookings.filter((item) => item.status === 'noshow').length
    return { todayCount, done, noShow }
  }, [bookings])

  const handleAction = (id: string, action: 'send-sms' | 'done' | 'noshow' | 'detail') => {
    if (action === 'detail') {
      const booking = bookings.find((item) => item.id === id)
      if (booking) setDetailBooking(booking)
      return
    }

    setBookings((prev) => prev.map((item) => {
      if (item.id !== id) return item
      if (action === 'send-sms' && item.status === 'new') return { ...item, status: 'sms-sent' as const }
      if (action === 'done' && item.status === 'sms-sent') return { ...item, status: 'done' as const }
      if (action === 'noshow' && (item.status === 'new' || item.status === 'sms-sent')) {
        return { ...item, status: 'noshow' as const }
      }
      return item
    }))

    if (detailBooking?.id === id) {
      setDetailBooking((prev) => {
        if (!prev || prev.id !== id) return prev
        if (action === 'send-sms') return { ...prev, status: 'sms-sent' }
        if (action === 'done') return { ...prev, status: 'done' }
        if (action === 'noshow') return { ...prev, status: 'noshow' }
        return prev
      })
    }
  }

  const clearFilters = () => {
    setSearchField('name')
    setSearchKeyword('')
    setDateFrom('')
    setDateTo('')
  }

  const statusLabel = (status: BookingStatus) => {
    if (status === 'done') return t(`${TK}.today.statusDone`)
    if (status === 'sms-sent') return t(`${TK}.today.statusSms`)
    if (status === 'noshow') return t(`${TK}.today.statusNoShow`)
    return t(`${TK}.today.statusNew`)
  }

  useEffect(() => {
    if (!detailBooking) {
      document.body.style.overflow = ''
      return undefined
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [detailBooking])

  return (
    <div className="booking-sub-panel is-active">
      <div className="overview-kpis">
        <article className="overview-card kpi-card" style={KPI_ACCENT_ELECTRIC}>
          <div className="kpi-top">
            <div className="kpi-icon"><CalendarKpiIcon /></div>
            <span className="badge booking-status booking-status-new">{t(`${TK}.today.badgeNew`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpi.todayBookings`)}</div>
          <div className="kpi-value">{stats.todayCount}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiTodayTrend`)}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_SUCCESS}>
          <div className="kpi-top">
            <div className="kpi-icon"><CheckKpiIcon /></div>
            <span className="badge booking-status booking-status-done">{t(`${TK}.today.badgeSmsActive`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.kpi.completed`)}</div>
          <div className="kpi-value">{stats.done}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiDoneTrend`)}</div>
        </article>

        <article className="overview-card kpi-card" style={KPI_ACCENT_RED}>
          <div className="kpi-top">
            <div className="kpi-icon"><XKpiIcon /></div>
            <span className="badge booking-status booking-status-noshow">{t(`${TK}.today.badgeNoShow`)}</span>
          </div>
          <div className="kpi-label">{t(`${TK}.today.kpiNoReview`)}</div>
          <div className="kpi-value">{stats.noShow}</div>
          <div className="kpi-trend">{t(`${TK}.today.kpiNoShowTrend`)}</div>
        </article>
      </div>

      <div className="booking-grid">
        <article className="overview-card overview-card-pad">
          <div className="booking-daybar">
            <div className="booking-date">
              <span className="booking-action-icon"><CalendarIcon /></span>
              <span>{t(`${TK}.today.overviewTitle`)}</span>
            </div>
            <div className="booking-view-switch" role="group" aria-label={t(`${TK}.today.viewMode`)}>
              <button
                className={`booking-view-button ${viewMode === 'table' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={viewMode === 'table'}
                onClick={() => setViewMode('table')}
              >
                <TableIcon />
                <span>{t(`${TK}.today.tableView`)}</span>
              </button>
              <button
                className={`booking-view-button ${viewMode === 'card' ? 'is-active' : ''}`}
                type="button"
                aria-pressed={viewMode === 'card'}
                onClick={() => setViewMode('card')}
              >
                <GridIcon />
                <span>{t(`${TK}.today.cardView`)}</span>
              </button>
            </div>
          </div>

          <div className="booking-controls" aria-label={t(`${TK}.today.filters`)}>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.searchBy`)}</span>
              <select
                className="booking-select"
                value={searchField}
                onChange={(event) => setSearchField(event.target.value as SearchField)}
              >
                <option value="name">{t(`${TK}.today.searchName`)}</option>
                <option value="phone">{t(`${TK}.today.searchPhone`)}</option>
                <option value="email">{t(`${TK}.today.searchEmail`)}</option>
                <option value="service">{t(`${TK}.today.searchService`)}</option>
              </select>
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.keyword`)}</span>
              <input
                className="booking-input"
                type="search"
                placeholder={t(`${TK}.today.keywordPlaceholder`)}
                value={searchKeyword}
                onChange={(event) => setSearchKeyword(event.target.value)}
              />
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.dateFrom`)}</span>
              <input
                className="booking-input"
                type="date"
                value={dateFrom}
                onChange={(event) => setDateFrom(event.target.value)}
              />
            </label>
            <label className="booking-control-field">
              <span className="booking-control-label">{t(`${TK}.today.dateTo`)}</span>
              <input
                className="booking-input"
                type="date"
                value={dateTo}
                onChange={(event) => setDateTo(event.target.value)}
              />
            </label>
            <button className="booking-mini-button booking-clear-button" type="button" onClick={clearFilters}>
              {t(`${TK}.today.clear`)}
            </button>
          </div>

          {viewMode === 'table' ? (
            <div className="booking-table-wrap">
              <table className="booking-table">
                <thead>
                  <tr>
                    <th scope="col">{t(`${TK}.today.colCustomer`)}</th>
                    <th scope="col">{t(`${TK}.today.colService`)}</th>
                    <th scope="col">{t(`${TK}.today.colTech`)}</th>
                    <th scope="col">{t(`${TK}.today.colTime`)}</th>
                    <th scope="col">{t(`${TK}.today.colStatus`)}</th>
                    <th scope="col">{t(`${TK}.today.colAction`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBookings.map((booking) => (
                    <tr
                      key={booking.id}
                      className={`booking-table-row ${rowClassForStatus(booking.status)}`}
                    >
                      <td>
                        <div className="booking-customer">
                          <div className="booking-customer-name">
                            {booking.name}{' '}
                            <span className={`badge ${booking.sourceClass}`}>
                              {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
                            </span>
                            {booking.request ? (
                              <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
                            ) : null}
                          </div>
                          <div className="booking-customer-meta">
                            {booking.phoneDisplay} · {booking.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="booking-service">
                          <div className="booking-service-list">
                            {booking.services.map((service) => (
                              <span className="booking-service-chip" key={service}>{service}</span>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="booking-tech">
                          <span className="booking-tech-name">{booking.tech}</span>
                        </div>
                      </td>
                      <td>
                        <div className="booking-time-block">
                          <div className="booking-time-main">{booking.timeMain}</div>
                          <div className="booking-time-date">{booking.timeDate}</div>
                        </div>
                      </td>
                      <td className="booking-status-cell">
                        <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
                          {statusLabel(booking.status)}
                        </span>
                      </td>
                      <td>
                        <BookingActions booking={booking} onAction={handleAction} t={t} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="booking-card-panel">
              <div className="booking-card-list">
                {filteredBookings.map((booking) => (
                  <article className="booking-appointment-card" key={booking.id}>
                    <div className="booking-card-top">
                      <div>
                        <div className="booking-card-name">
                          {booking.name}{' '}
                          <span className={`badge ${booking.sourceClass}`}>
                            {t(`${TK}.${SOURCE_KEY_MAP[booking.source]}`)}
                          </span>
                          {booking.request ? (
                            <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span>
                          ) : null}
                        </div>
                        <div className="booking-card-contact">
                          {booking.phoneDisplay} · {booking.email}
                        </div>
                      </div>
                      <span className={`badge booking-status ${statusBadgeClass(booking.status)}`}>
                        {statusLabel(booking.status)}
                      </span>
                    </div>
                    <div className="booking-card-info-list">
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colService`)}</span>
                        <span className="booking-card-value">
                          <span className="booking-service-list">
                            {booking.services.map((service) => (
                              <span className="booking-service-chip" key={service}>{service}</span>
                            ))}
                          </span>
                        </span>
                      </div>
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colTech`)}</span>
                        <span className="booking-card-value">{booking.tech}</span>
                      </div>
                      <div className="booking-card-info-row">
                        <span className="booking-card-label">{t(`${TK}.today.colTime`)}</span>
                        <span className="booking-card-value">{booking.timeMain} · {booking.timeDate}</span>
                      </div>
                    </div>
                    <div className="booking-card-actions">
                      <BookingActions booking={booking} onAction={handleAction} t={t} />
                    </div>
                  </article>
                ))}
              </div>
            </div>
          )}

          {filteredBookings.length === 0 ? (
            <div className="booking-empty">{t(`${TK}.today.empty`)}</div>
          ) : null}
        </article>
      </div>

      {detailBooking ? (
        <div
          className="booking-detail-modal"
          role="presentation"
          onClick={() => setDetailBooking(null)}
        >
          <div
            className="booking-detail-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="booking-detail-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="booking-detail-head">
              <div>
                <div className="booking-detail-title" id="booking-detail-title">
                  {t(`${TK}.today.detailTitle`)}
                </div>
                <div className="booking-detail-sub">{t(`${TK}.today.detailSub`)}</div>
              </div>
              <button
                className="booking-detail-close"
                type="button"
                aria-label={t(`${TK}.today.closeDetail`)}
                onClick={() => setDetailBooking(null)}
              >
                <XLgIcon />
              </button>
            </div>
            <div className="booking-detail-body">
              <div className="booking-detail-hero">
                <div className="booking-detail-avatar">{getInitials(detailBooking.name)}</div>
                <div>
                  <div className="booking-detail-name">{detailBooking.name}</div>
                  <div className="booking-detail-hero-sub">
                    <span>{detailBooking.phoneDisplay}</span>
                    <span>{detailBooking.email}</span>
                  </div>
                </div>
                <div className={`booking-detail-status-pill booking-status ${statusBadgeClass(detailBooking.status)}`}>
                  {statusLabel(detailBooking.status)}
                </div>
              </div>

              <div className="booking-detail-section">
                <div className="booking-detail-section-title">
                  <StarsIcon />
                  <span>{t(`${TK}.today.detailServices`)}</span>
                </div>
                <div className="booking-detail-service-chips">
                  {detailBooking.services.map((service) => (
                    <span className="booking-service-chip" key={service}>{service}</span>
                  ))}
                </div>
              </div>

              <div className="booking-detail-info-grid">
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><PersonWorkspaceIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colTech`)}</div>
                    <div className="booking-detail-value">{detailBooking.tech}</div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><ClockIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.colTime`)}</div>
                    <div className="booking-detail-value">
                      {detailBooking.timeMain} · {detailBooking.timeDate}
                    </div>
                  </div>
                </div>
                <div className="booking-detail-info-item">
                  <span className="booking-detail-info-icon"><BroadcastIcon /></span>
                  <div>
                    <div className="booking-detail-label">{t(`${TK}.today.detailSource`)}</div>
                    <div className="booking-detail-value booking-source-list">
                      <span className={`badge ${detailBooking.sourceClass}`}>
                        {t(`${TK}.${SOURCE_KEY_MAP[detailBooking.source]}`)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="booking-detail-note-card">
                <div className="booking-detail-section-title">
                  <JournalIcon />
                  <span>{t(`${TK}.today.detailNote`)}</span>
                </div>
                <div className="booking-detail-note">{detailBooking.note}</div>
              </div>
            </div>
            <div className="booking-detail-actions">
              <button className="booking-secondary-button" type="button" onClick={() => setDetailBooking(null)}>
                {t(`${TK}.today.closeDetail`)}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
