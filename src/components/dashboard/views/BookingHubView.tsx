import React, { useMemo, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import './booking-hub.css'

const KPI_ACCENT_CYAN = { '--kpi-accent': 'var(--brand-cyan)' } as React.CSSProperties
const KPI_ACCENT_SUCCESS = { '--kpi-accent': 'var(--nexora-success)' } as React.CSSProperties
const KPI_ACCENT_RED = { '--kpi-accent': '#ef4444' } as React.CSSProperties

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

const TEAM_MEMBERS = [
  { name: 'Kim Nguyen', phone: '832-555-0161', services: ['Gel', 'Full Set', 'Dip'], customers: 3, avatar: 'K' },
  { name: 'Lan Tran', phone: '713-555-0192', services: ['Pedicure', 'Gel', 'Nail Art'], customers: 2, avatar: 'L' },
  { name: 'Mai Pham', phone: '281-555-0138', services: ['Acrylic', 'Dip', 'Pedicure'], customers: 2, avatar: 'M' },
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
  const { currentLanguage } = useTranslation()
  const isVi = currentLanguage === 'vi'
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
        <h1 className="page-title">Booking Book</h1>
        <p className="page-description">
          {isVi
            ? 'Quan ly lich hen, cuoc hen va lich khach trong workspace nay.'
            : 'Manage salon bookings, appointments, and client scheduling from this workspace.'}
        </p>
        <div className="page-tabs" role="tablist" aria-label="Booking Book sections">
          <button
            className={`page-tab ${activeMainTab === 'booking' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'booking'}
            onClick={() => setActiveMainTab('booking')}
          >
            <span className="page-tab-icon"><CalendarIcon /></span>
            <span>Booking Book</span>
          </button>
          <button
            className={`page-tab ${activeMainTab === 'plans' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'plans'}
            onClick={() => setActiveMainTab('plans')}
          >
            <span className="page-tab-icon"><TeamIcon /></span>
            <span>{isVi ? 'Goi dich vu' : 'Service plans'}</span>
          </button>
          <button
            className={`page-tab ${activeMainTab === 'settings' ? 'is-active' : ''}`}
            type="button"
            role="tab"
            aria-selected={activeMainTab === 'settings'}
            onClick={() => setActiveMainTab('settings')}
          >
            <span className="page-tab-icon"><CheckIcon /></span>
            <span>{isVi ? 'Cau hinh tiem' : 'Salon settings'}</span>
          </button>
        </div>
      </div>

      {activeMainTab === 'booking' && (
      <section className="tab-panel is-active" aria-label="Booking Book panel">
        <div className="booking-toolbar">
          <div className="booking-subtabs" role="tablist" aria-label="Booking Book views">
            <button
              className={`booking-subtab ${activeSubtab === 'today' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveSubtab('today')}
            >
              <span className="booking-subtab-icon"><CalendarIcon /></span>
              <span>{isVi ? 'Lich hom nay' : 'Today schedule'}</span>
            </button>
            <button
              className={`booking-subtab ${activeSubtab === 'team' ? 'is-active' : ''}`}
              type="button"
              onClick={() => setActiveSubtab('team')}
            >
              <span className="booking-subtab-icon"><TeamIcon /></span>
              <span>{isVi ? 'Doi tho' : 'Team'}</span>
            </button>
          </div>
          <div className="sync-note">{isVi ? 'Moi kenh deu ve chung mot so' : 'Every channel lands in one book'}</div>
        </div>

        {activeSubtab === 'today' ? (
          <div className="booking-sub-panel is-active">
            <div className="overview-kpis">
              <article className="overview-card kpi-card" style={KPI_ACCENT_CYAN}>
                <div className="kpi-top">
                  <div className="kpi-icon"><CalendarIcon /></div>
                  <span className="badge booking-source-voice">/v1/bookings</span>
                </div>
                <div className="kpi-label">{isVi ? 'Hen Hom Nay' : 'Today Bookings'}</div>
                <div className="kpi-value">{stats.total}</div>
                <div className="kpi-trend">Voice · Landing Page · SMS · QR</div>
              </article>
              <article className="overview-card kpi-card" style={KPI_ACCENT_SUCCESS}>
                <div className="kpi-top">
                  <div className="kpi-icon"><CheckIcon /></div>
                  <span className="badge badge-success">SMS fired</span>
                </div>
                <div className="kpi-label">{isVi ? 'Da Xong' : 'Completed'}</div>
                <div className="kpi-value">{stats.done}</div>
                <div className="kpi-trend">Review + tip + promo scheduled</div>
              </article>
              <article className="overview-card kpi-card" style={KPI_ACCENT_RED}>
                <div className="kpi-top">
                  <div className="kpi-icon"><XIcon /></div>
                  <span className="badge badge-warning">Skipped</span>
                </div>
                <div className="kpi-label">{isVi ? 'No-show' : 'No-show'}</div>
                <div className="kpi-value">{stats.noShow}</div>
                <div className="kpi-trend">No review request sent</div>
              </article>
            </div>

            <div className="booking-grid">
              <article className="overview-card overview-card-pad">
                <div className="booking-daybar">
                  <div className="booking-date">
                    <span className="booking-action-icon"><CalendarIcon /></span>
                    <span>{isVi ? 'Thu 6, 3 Thang 7' : 'Fri, July 3'}</span>
                  </div>
                  <button className="booking-secondary-button booking-hidden-action" type="button" aria-hidden="true" tabIndex={-1}>
                    {isVi ? '+ Them Hen' : '+ Add booking'}
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
                          {item.name} <span className={`badge ${item.sourceClass}`}>{item.source}</span>
                          {item.request ? <span className="badge badge-warning">{isVi ? 'Yeu cau' : 'Request'}</span> : null}
                        </div>
                        <div className="booking-detail">{item.detail}</div>
                      </div>
                      <div className="booking-actions">
                        {item.status === 'done' ? (
                          <span className="badge badge-success booking-status">
                            {isVi ? 'SMS da len lich' : 'SMS scheduled'}
                          </span>
                        ) : item.status === 'noshow' ? (
                          <span className="badge badge-warning booking-status">No-show</span>
                        ) : (
                          <>
                            <button className="booking-mini-button primary" type="button" onClick={() => handleBookingActionClick(item.name, 'done')}>
                              {isVi ? '✓ Xong' : '✓ Done'}
                            </button>
                            <button className="booking-mini-button" type="button" onClick={() => handleBookingActionClick(item.name, 'noshow')}>No-show</button>
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
          <div className="booking-sub-panel is-active">
            <div className="tech-intro">
              <div className="tech-intro-text">
                Profile tho dung chung cho SMS bao khach, QR tip, Review va Reward.
              </div>
              <button className="booking-primary-button" type="button">{isVi ? 'Them Tho' : 'Add Tech'}</button>
            </div>
            <div className="tech-grid">
              {TEAM_MEMBERS.map((member) => (
                <article className="tech-card" key={member.name}>
                  <div className="tech-top">
                    <div className="tech-avatar">{member.avatar}</div>
                    <div className="tech-copy">
                      <div className="tech-name">{member.name}</div>
                      <div className="tech-phone">{member.phone}</div>
                    </div>
                    <button className="toggle-pill is-on" type="button" aria-label={`Toggle ${member.name}`} />
                  </div>
                  <div className="tech-services">
                    {member.services.map((service) => (
                      <span className="badge badge-plan" key={service}>{service}</span>
                    ))}
                  </div>
                  <div className="tech-stats">
                    <div className="tech-stat">
                      <strong>{member.customers}</strong>
                      <span>{isVi ? 'Khach hom nay' : 'Clients today'}</span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
      )}

      {activeMainTab === 'plans' && (
        <section className="tab-panel is-active" aria-label="Service plans panel">
          <div className="plans-stack">
            <div className="plans-hero">
              {isVi
                ? 'Founding Salon Offer - chi con 7 suat Founding · Khoa gia 12 thang'
                : 'Founding Salon Offer - only 7 spots left · Price lock for 12 months'}
            </div>

            <div className="plans-grid">
              <article className="service-plan-card">
                <div className="plan-rec" aria-hidden="true" />
                <div className="service-plan-name">Starter</div>
                <div className="service-plan-price">$99<span>/mo</span></div>
                <div className="service-plan-cross">$149/mo</div>
                <div className="plan-features">
                  <div className="plan-feature"><span className="plan-check">✓</span><span>AI Voice 24/7</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>Missed-call SMS</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>500 min · 500 SMS</span></div>
                  <div className="plan-feature"><span className="plan-check muted">—</span><span>Dashboard trong Pro</span></div>
                </div>
                <button className="plan-select-button" type="button">{isVi ? 'Chon Starter' : 'Select Starter'}</button>
              </article>

              <article className="service-plan-card is-recommended">
                <div className="plan-rec">{isVi ? 'Khuyen dung' : 'Recommended'}</div>
                <div className="service-plan-name">Pro</div>
                <div className="service-plan-price">$199<span>/mo</span></div>
                <div className="service-plan-cross">$299/mo</div>
                <div className="plan-features">
                  <div className="plan-feature"><span className="plan-check">✓</span><span>AI Voice + SMS Campaigns</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>Owner Dashboard</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>Auto Google Review</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>1,000 min · 1,000 SMS</span></div>
                  <div className="plan-aio">AIO ENGINE - Review Velocity + 30 FAQ + Schema + AI Visibility</div>
                </div>
                <button className="plan-select-button is-primary" type="button">{isVi ? 'Bat Dau Free 14 Ngay' : 'Start 14-day free trial'}</button>
              </article>

              <article className="service-plan-card">
                <div className="plan-rec" aria-hidden="true" />
                <div className="service-plan-name">Elite</div>
                <div className="service-plan-price">$349<span>/mo</span></div>
                <div className="service-plan-cross">$499/mo</div>
                <div className="plan-features">
                  <div className="plan-feature"><span className="plan-check">✓</span><span>Tat ca trong Pro</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>Staff Dashboard + TAX IQ</span></div>
                  <div className="plan-feature"><span className="plan-check">✓</span><span>2,000 min · 2,000 SMS · 3 so</span></div>
                </div>
                <button className="plan-select-button" type="button">{isVi ? 'Chon Elite' : 'Select Elite'}</button>
              </article>
            </div>

            <article className="roi-panel">
              <div className="card-heading">
                <h2 className="card-title">ROI Calculator</h2>
                <span className="card-meta">Plan value</span>
              </div>
              <div className="roi-grid">
                <div className="roi-metric is-loss"><div className="roi-value">$3,200</div><div className="roi-label">Dang mat/thang</div></div>
                <div className="roi-metric is-cost"><div className="roi-value">$199</div><div className="roi-label">Chi phi NEXORA</div></div>
                <div className="roi-metric is-gain"><div className="roi-value">+$2,200</div><div className="roi-label">Revenue them/thang</div></div>
              </div>
              <div className="business-sub roi-summary">ROI: <strong>16x</strong> · Hoan von trong <strong>3 ngay</strong></div>
            </article>

            <article className="guarantee-panel">
              <div className="card-heading">
                <h2 className="card-title">{isVi ? 'Khong rui ro voi ban' : 'Risk-free for you'}</h2>
                <span className="card-meta">Pilot terms</span>
              </div>
              <div className="guarantee-grid">
                <div>✓ 14 ngay pilot mien phi</div>
                <div>✓ Khong can the tin dung</div>
                <div>✓ Setup trong 24 gio</div>
                <div>✓ Cancel bat cu luc nao</div>
              </div>
            </article>
          </div>
        </section>
      )}

      {activeMainTab === 'settings' && (
        <section className="tab-panel is-active" aria-label="Salon settings panel">
          <div className="settings-shell">
            <div className="settings-hero is-compact">
              <div className="settings-eyebrow">{isVi ? '⚙️ Cau Hinh Tiem' : '⚙️ Salon Settings'}</div>
              <h2 className="settings-title">{isVi ? 'Mot Nguon Du Lieu' : 'One Source of Truth'}</h2>
              <p className="settings-desc">
                {isVi
                  ? 'Nhap mot lan: AI Voice doc gia, SMS lay ten tiem, landing page tu dien dich vu, Schema tu sinh, Booking Book tu dong bo.'
                  : 'Enter data once: AI Voice, SMS, landing page, schema and Booking Book all stay in sync.'}
              </p>
              <div className="settings-sync-grid">
                <div className="settings-sync-pill"><strong>AI Voice</strong>Bao gia & gio mo cua</div>
                <div className="settings-sync-pill"><strong>SMS</strong>Ten tiem & offer</div>
                <div className="settings-sync-pill"><strong>Landing Page</strong>Dich vu & voucher</div>
                <div className="settings-sync-pill"><strong>Schema</strong>FAQ & local data</div>
                <div className="settings-sync-pill"><strong>Booking</strong>Thoi luong & tho</div>
              </div>
            </div>

            <div className="settings-grid">
              <article className="settings-card">
                <div className="settings-card-head">
                  <div>
                    <div className="settings-card-title">{isVi ? '🏪 Thong Tin Tiem' : '🏪 Salon Information'}</div>
                    <div className="settings-card-sub">{isVi ? 'Du lieu nen cho AI Voice, SMS, landing page va review request.' : 'Core data for AI Voice, SMS, landing page and review request.'}</div>
                  </div>
                </div>
                <div className="settings-field-grid settings-business-grid">
                  <label className="settings-field"><span className="settings-label">{isVi ? 'Ten tiem' : 'Salon name'}</span><input className="settings-input" type="text" value="Bitcoin Nail Bar" readOnly /></label>
                  <label className="settings-field"><span className="settings-label">{isVi ? 'So dien thoai tiem' : 'Salon phone'}</span><input className="settings-input" type="text" value="346-802-4906" readOnly /></label>
                  <label className="settings-field"><span className="settings-label">{isVi ? 'So AI tra loi' : 'AI line'}</span><input className="settings-input" type="text" value="832-786-5576" readOnly /></label>
                  <label className="settings-field"><span className="settings-label">{isVi ? 'So nhan thong bao booking' : 'Booking notification number'}</span><input className="settings-input" type="text" value="832-xxx-xxxx" readOnly /></label>
                </div>
              </article>

              <article className="settings-card">
                <div className="settings-card-head">
                  <div>
                    <div className="settings-card-title">{isVi ? '🕒 Gio mo cua' : '🕒 Operating Hours'}</div>
                    <div className="settings-card-sub">{isVi ? 'Thiet lap gio lam viec theo tung ngay.' : 'Set working hours for each day.'}</div>
                  </div>
                </div>
                <div className="settings-hours">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                    <div className={`settings-hour-row ${idx >= 5 ? 'is-closed' : ''}`} key={day}>
                      <span className="settings-hour-day">{day}</span>
                      <div className="settings-time-box"><input className="settings-hour-input" value="7:00 AM" readOnly /></div>
                      <span className="settings-hour-to">to</span>
                      <div className="settings-time-box"><input className="settings-hour-input" value="9:00 PM" readOnly /></div>
                    </div>
                  ))}
                </div>
              </article>
            </div>

            <div className="settings-two-grid">
              <article className="settings-card">
                <div className="settings-card-head">
                  <div>
                    <div className="settings-card-title">{isVi ? '💵 Dich Vu & Gia' : '💵 Services & Pricing'}</div>
                    <div className="settings-card-sub">{isVi ? 'Thoi luong quyet dinh gio gui SMS review va chu ky promo touch-up.' : 'Duration controls review SMS timing and promo touch-up cycle.'}</div>
                  </div>
                </div>
                <div className="settings-actions">
                  <button className="booking-secondary-button" type="button">{isVi ? '📷 Chup Menu' : '📷 Scan menu'}</button>
                  <button className="booking-secondary-button" type="button">{isVi ? '⚡ Goi Y Nganh' : '⚡ Suggest services'}</button>
                  <button className="booking-primary-button" type="button">{isVi ? '＋ Tu Nhap' : '＋ Add manually'}</button>
                </div>
                <div className="settings-service-list">
                  {[
                    ['💅', 'Gel Manicure', '$35', '60 min'],
                    ['💎', 'Full Set Acrylic', '$45', '90 min'],
                    ['🦶', 'Classic Pedicure', '$30', '50 min'],
                    ['✨', 'Dip Powder', '$40', '75 min'],
                  ].map(([icon, name, price, duration]) => (
                    <div className="settings-service-row" key={name}>
                      <span className="settings-service-visual">{icon}</span>
                      <span className="settings-service-name">{name}</span>
                      <span className="settings-service-meta">{price}</span>
                      <span className="settings-service-meta">{duration}</span>
                    </div>
                  ))}
                </div>
              </article>

              <article className="settings-card">
                <div className="settings-card-head">
                  <div>
                    <div className="settings-card-title">AI ✨ Voice</div>
                    <div className="settings-card-sub">{isVi ? 'Cau hinh ngon ngu va cau chao AI doc khi bat may.' : 'Configure AI language and greeting script.'}</div>
                  </div>
                </div>
                <div className="settings-field-grid">
                  <div className="settings-field">
                    <span className="settings-label">{isVi ? 'NGON NGU AI' : 'AI LANGUAGE'}</span>
                    <div className="settings-language-grid">
                      <button className="settings-language-card is-active" type="button">🇻🇳 + 🇺🇸 Auto</button>
                      <button className="settings-language-card" type="button">🇻🇳 VI</button>
                      <button className="settings-language-card" type="button">🇺🇸 EN</button>
                    </div>
                  </div>
                  <label className="settings-field">
                    <span className="settings-label">{isVi ? 'Cau chao' : 'Greeting script'}</span>
                    <textarea className="settings-textarea" readOnly value="Xin chao! Cam on ban da goi Bitcoin Nail Bar. Toi la tro ly AI, toi co the giup ban dat lich, xem gia, hoac tra loi cau hoi." />
                  </label>
                </div>
                <button className="booking-secondary-button" type="button">{isVi ? '🔊 Nghe Thu' : '🔊 Preview voice'}</button>
              </article>
            </div>

            <div className="settings-save-bar">
              <div className="settings-save-copy">{isVi ? '💾 Luu mot lan, moi module cap nhat ngay: AI Voice, SMS, landing page, Schema va Booking Book.' : '💾 Save once and all modules update instantly: AI Voice, SMS, landing page, Schema and Booking Book.'}</div>
              <button className="booking-primary-button" type="button">{isVi ? 'Luu Cau Hinh' : 'Save configuration'}</button>
            </div>
          </div>
        </section>
      )}
    </section>
  )
}
