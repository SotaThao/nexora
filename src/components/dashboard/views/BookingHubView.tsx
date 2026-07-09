import React, { useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import BookingTeamPanel from './BookingTeamPanel'
import BookingPlansPanel from './BookingPlansPanel'
import BookingSettingsPanel from './BookingSettingsPanel'
import {
  CalendarTabIcon,
  SlidersTabIcon,
  TagsTabIcon,
} from './BookingHubIcons'
import './booking-hub.css'

const KPI_ACCENT_CYAN = { '--kpi-accent': 'var(--brand-cyan)' } as React.CSSProperties
const KPI_ACCENT_SUCCESS = { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties
const KPI_ACCENT_RED = { '--kpi-accent': '#ef4444' } as React.CSSProperties

const TK = 'components.dashboard.views.BookingHubView'

const SOURCE_KEY_MAP: Record<string, string> = {
  Voice: 'sources.voice',
  'Landing Page': 'sources.landingPage',
  SMS: 'sources.sms',
  QR: 'sources.qr',
}

const INITIAL_BOOKINGS = [
  {
    time: '9:00',
    name: 'Kim Phan',
    source: 'Voice',
    sourceClass: 'booking-source-voice',
    detail: 'Pedicure $35 · Tho: Lan T.',
    status: 'done',
  },
  {
    time: '10:30',
    name: 'Sophie Tran',
    source: 'Landing Page',
    sourceClass: 'booking-source-lp',
    detail: 'Gel Manicure $35 · Tho: Kim N.',
    status: 'done',
  },
  {
    time: '1:00',
    name: 'Mai Nguyen',
    source: 'Voice',
    sourceClass: 'booking-source-voice',
    detail: 'Gel Full Set $45 · Tho: Kim N.',
    request: true,
    status: 'pending',
  },
  {
    time: '2:30',
    name: 'Jennifer S.',
    source: 'SMS',
    sourceClass: 'booking-source-sms',
    detail: 'Full Set Acrylic $45 · Tho: Mai P.',
    status: 'pending',
  },
  {
    time: '4:00',
    name: 'Tina Vo',
    source: 'Landing Page',
    sourceClass: 'booking-source-lp',
    detail: 'Dip Powder $40 · Tho: Lan T.',
    status: 'pending',
  },
  {
    time: '5:30',
    name: 'Anna Le',
    source: 'QR',
    sourceClass: 'booking-source-qr',
    detail: 'Pedicure + Gel $70 · Tho: Mai P.',
    request: true,
    status: 'pending',
  },
]

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 2v4" />
      <path d="M16 2v4" />
      <rect width="18" height="18" x="3" y="4" rx="2" />
      <path d="M3 10h18" />
      <path d="M8 14h.01" />
      <path d="M12 14h.01" />
      <path d="M16 14h.01" />
    </svg>
  )
}

function TeamIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  )
}

export default function BookingHubView() {
  const { t } = useTranslation()
  const [activeMainTab, setActiveMainTab] = useState<'booking' | 'plans' | 'settings'>('booking')
  const [activeSubtab, setActiveSubtab] = useState('today')
  const [bookings, setBookings] = useState(INITIAL_BOOKINGS)
  const stats = useMemo(() => {
    const total = bookings.length
    const done = bookings.filter((item) => item.status === 'done').length
    const noShow = bookings.filter((item) => item.status === 'noshow').length
    return { total, done, noShow }
  }, [bookings])
  const handleBookingActionClick = (name: string, status: 'done' | 'noshow') => {
    setBookings((prev) => prev.map((item) => {
      if (item.name !== name || item.status !== 'pending') return item
      return { ...item, status }
    }))
  }

  return (
    <section className="booking-hub-view">
      <div className="page-heading">
        <h1 className="page-title">{t(`${TK}.title`)}</h1>
        <p className="page-description">{t(`${TK}.description`)}</p>
        <div className="page-tabs" role="tablist" aria-label={t(`${TK}.ariaSections`)}>
          <button
            className={`page-tab ${activeMainTab === 'booking' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'booking'}
            onClick={() => setActiveMainTab('booking')}
          >
            <span className="page-tab-icon"><CalendarTabIcon /></span>
            <span>{t(`${TK}.tabs.booking`)}</span>
          </button>
          <button
            className={`page-tab ${activeMainTab === 'plans' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'plans'}
            onClick={() => setActiveMainTab('plans')}
          >
            <span className="page-tab-icon"><TagsTabIcon /></span>
            <span>{t(`${TK}.tabs.plans`)}</span>
          </button>
          <button
            className={`page-tab ${activeMainTab === 'settings' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'settings'}
            onClick={() => setActiveMainTab('settings')}
          >
            <span className="page-tab-icon"><SlidersTabIcon /></span>
            <span>{t(`${TK}.tabs.settings`)}</span>
          </button>
        </div>
      </div>

      {activeMainTab === 'booking' && (
      <section className="tab-panel is-active" aria-label={t(`${TK}.ariaPanel`)}>
        <div className="booking-toolbar">
          <div className="booking-subtabs" role="tablist" aria-label={t(`${TK}.ariaViews`)}>
            <button
              className={`booking-subtab ${activeSubtab === 'today' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveSubtab('today')}
            >
              <span className="booking-subtab-icon"><CalendarIcon /></span>
              <span>{t(`${TK}.schedule.today`)}</span>
            </button>
            <button
              className={`booking-subtab ${activeSubtab === 'team' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveSubtab('team')}
            >
              <span className="booking-subtab-icon"><TeamIcon /></span>
              <span>{t(`${TK}.schedule.team`)}</span>
            </button>
          </div>
          <div className="sync-note">{t(`${TK}.schedule.syncNote`)}</div>
        </div>

        {activeSubtab === 'today' ? (
          <div className="booking-sub-panel is-active">
            <div className="overview-kpis">
              <article className="overview-card kpi-card" style={KPI_ACCENT_CYAN}>
                <div className="kpi-top">
                  <div className="kpi-icon"><CalendarIcon /></div>
                  <span className="badge booking-source-voice">/v1/bookings</span>
                </div>
                <div className="kpi-label">{t(`${TK}.kpi.todayBookings`)}</div>
                <div className="kpi-value">{stats.total}</div>
                <div className="kpi-trend">{t(`${TK}.kpi.channels`)}</div>
              </article>
              <article className="overview-card kpi-card" style={KPI_ACCENT_SUCCESS}>
                <div className="kpi-top">
                  <div className="kpi-icon"><CheckIcon /></div>
                  <span className="badge badge-success">{t(`${TK}.kpi.smsFired`)}</span>
                </div>
                <div className="kpi-label">{t(`${TK}.kpi.completed`)}</div>
                <div className="kpi-value">{stats.done}</div>
                <div className="kpi-trend">{t(`${TK}.kpi.reviewTipPromo`)}</div>
              </article>
              <article className="overview-card kpi-card" style={KPI_ACCENT_RED}>
                <div className="kpi-top">
                  <div className="kpi-icon"><XIcon /></div>
                  <span className="badge badge-warning">{t(`${TK}.kpi.skipped`)}</span>
                </div>
                <div className="kpi-label">{t(`${TK}.kpi.noShow`)}</div>
                <div className="kpi-value">{stats.noShow}</div>
                <div className="kpi-trend">{t(`${TK}.kpi.noReviewSent`)}</div>
              </article>
            </div>

            <div className="booking-grid">
              <article className="overview-card overview-card-pad">
                <div className="booking-daybar">
                  <div className="booking-date">
                    <span className="booking-action-icon"><CalendarIcon /></span>
                    <span>{t(`${TK}.booking.dateLabel`)}</span>
                  </div>
                  <button className="booking-secondary-button booking-hidden-action" type="button" aria-hidden="true" tabIndex={-1}>
                    {t(`${TK}.booking.addBooking`)}
                  </button>
                </div>

                <div className="booking-list">
                  {bookings.map((item) => (
                    <div
                      key={`${item.time}-${item.name}`}
                      className={`booking-item ${item.status === 'done' ? 'is-done' : ''} ${item.status === 'noshow' ? 'is-noshow' : ''}`}
                    >
                      <div className="booking-time">{item.time}</div>
                      <div>
                        <div className="booking-name-row">
                          {item.name}{' '}
                          <span className={`badge ${item.sourceClass}`}>
                            {t(`${TK}.${SOURCE_KEY_MAP[item.source]}`)}
                          </span>
                          {item.request ? <span className="badge badge-warning">{t(`${TK}.booking.request`)}</span> : null}
                        </div>
                        <div className="booking-detail">{item.detail}</div>
                      </div>
                      <div className="booking-actions">
                        {item.status === 'done' ? (
                          <span className="badge badge-success booking-status">
                            {t(`${TK}.booking.smsScheduled`)}
                          </span>
                        ) : item.status === 'noshow' ? (
                          <span className="badge badge-warning booking-status">{t(`${TK}.booking.noShow`)}</span>
                        ) : (
                          <>
                            <button className="booking-mini-button primary" type="button" onClick={() => handleBookingActionClick(item.name, 'done')}>
                              {t(`${TK}.booking.done`)}
                            </button>
                            <button className="booking-mini-button" type="button" onClick={() => handleBookingActionClick(item.name, 'noshow')}>{t(`${TK}.booking.noShow`)}</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        ) : (
          <BookingTeamPanel />
        )}
      </section>
      )}

      {activeMainTab === 'plans' && (
        <section className="tab-panel is-active" aria-label={t(`${TK}.ariaPlansPanel`)}>
          <BookingPlansPanel />
        </section>
      )}

      {activeMainTab === 'settings' && (
        <section className="tab-panel is-active" aria-label={t(`${TK}.ariaSettingsPanel`)}>
          <BookingSettingsPanel />
        </section>
      )}
    </section>
  )
}
