import React, { useEffect, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'

const TK = 'components.dashboard.views.BookingHubView.plans.trial'

const SERVICE_CHIPS = [
  'Gel Manicure',
  'Acrylic Full Set',
  'Dip Powder',
  'Pedicure',
  'Pedi + Gel',
  'Nail Art',
  'Waxing',
  'Eyelash',
  'Facial',
]

const DEFAULT_ACTIVE_SERVICES = new Set(['Gel Manicure', 'Acrylic Full Set', 'Pedicure'])

const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const DEFAULT_ACTIVE_DAYS = new Set(['mon', 'tue', 'wed', 'thu', 'fri', 'sat'])

const OPEN_TIMES = ['8:00 AM', '9:00 AM', '9:30 AM', '10:00 AM']
const CLOSE_TIMES = ['6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']

function CloseIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
      <path d="m4 4 8 8M12 4 4 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <path d="m3.5 8.5 3 3 6-6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function GiftIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="12" height="12">
      <rect x="2.5" y="6" width="11" height="8" rx="1.2" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 6V14M2.5 6h11M5.5 6C4.5 6 3.5 5.2 3.5 4.2S4.3 2.5 5.5 2.5 7.5 3.5 7.5 4.5M10.5 6c1 0 2-.8 2-1.8S11.7 2.5 10.5 2.5 8.5 3.5 8.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  )
}

function RocketIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="none" aria-hidden="true" width="14" height="14">
      <path d="M8 13.5s3.5-1.5 3.5-5V4.5L8 2.5 4.5 4.5v4c0 3.5 3.5 5 3.5 5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
      <circle cx="8" cy="7" r="1.2" fill="currentColor" />
    </svg>
  )
}

interface BookingTrialModalProps {
  open: boolean
  onClose: () => void
}

export default function BookingTrialModal({ open, onClose }: BookingTrialModalProps) {
  const { t } = useTranslation()
  const [step, setStep] = useState<'form' | 'email'>('form')
  const [salon, setSalon] = useState('Bitcoin Nail Bar')
  const [owner, setOwner] = useState('Brian Nguyen')
  const [phone, setPhone] = useState('346-802-4906')
  const [email, setEmail] = useState('chi.mai@gmail.com')
  const [city, setCity] = useState('Houston, TX')
  const [referral, setReferral] = useState('')
  const [openTime, setOpenTime] = useState('9:30 AM')
  const [closeTime, setCloseTime] = useState('7:00 PM')
  const [painPoint, setPainPoint] = useState('')
  const [activeServices, setActiveServices] = useState<Set<string>>(() => new Set(DEFAULT_ACTIVE_SERVICES))
  const [activeDays, setActiveDays] = useState<Set<string>>(() => new Set(DEFAULT_ACTIVE_DAYS))
  const [emailStatus, setEmailStatus] = useState<'default' | 'activated'>('default')

  const resetForm = () => {
    setStep('form')
    setEmailStatus('default')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  const toggleChip = (set: Set<string>, value: string, setter: (next: Set<string>) => void) => {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  const handleSubmit = () => {
    const emailValue = email.trim()
    if (!emailValue || !emailValue.includes('@')) return
    setStep('email')
  }

  const handleActivate = () => {
    setEmailStatus('activated')
  }

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return undefined
    }
    document.body.style.overflow = 'hidden'
    setStep('form')
    setEmailStatus('default')
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  if (!open) return null

  return (
    <div className="trial-modal" role="dialog" aria-modal="true" aria-labelledby="trial-modal-title" onClick={handleClose}>
      <div className="trial-dialog" onClick={(event) => event.stopPropagation()}>
        <button className="trial-close" type="button" aria-label={t(`${TK}.close`)} onClick={handleClose}>
          <CloseIcon />
        </button>

        {step === 'form' ? (
          <div className="trial-step">
            <div className="trial-head">
              <div className="trial-brand"><GiftIcon /> {t(`${TK}.brandBadge`)}</div>
              <h2 className="trial-title" id="trial-modal-title">
                {t(`${TK}.titleLead`)}
                <strong>{t(`${TK}.titleHighlight`)}</strong>
              </h2>
              <p className="trial-subtitle">{t(`${TK}.subtitle`)}</p>
            </div>

            <div className="trial-benefits">
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitSetup`)}</div>
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitCancel`)}</div>
              <div className="trial-benefit"><CheckIcon /> {t(`${TK}.benefitVietnamese`)}</div>
            </div>

            <div className="trial-body">
              <div className="trial-grid">
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-salon">{t(`${TK}.salonLabel`)} <span>*</span></label>
                  <input className="trial-input" id="trial-salon" type="text" value={salon} placeholder={t(`${TK}.salonPlaceholder`)} onChange={(e) => setSalon(e.target.value)} />
                </div>
                <div className="trial-field">
                  <label className="trial-label" htmlFor="trial-owner">{t(`${TK}.ownerLabel`)} <span>*</span></label>
                  <input className="trial-input" id="trial-owner" type="text" value={owner} placeholder={t(`${TK}.ownerPlaceholder`)} onChange={(e) => setOwner(e.target.value)} />
                </div>
                <div className="trial-field">
                  <label className="trial-label" htmlFor="trial-phone">{t(`${TK}.phoneLabel`)} <span>*</span></label>
                  <input className="trial-input" id="trial-phone" type="tel" value={phone} placeholder={t(`${TK}.phonePlaceholder`)} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-email">{t(`${TK}.emailLabel`)} <span>*</span></label>
                  <input className="trial-input" id="trial-email" type="email" value={email} placeholder={t(`${TK}.emailPlaceholder`)} onChange={(e) => setEmail(e.target.value)} />
                  <div className="trial-note">{t(`${TK}.emailNote`)}</div>
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-city">
                    {t(`${TK}.cityLabel`)} <span className="trial-optional">{t(`${TK}.optional`)}</span>
                  </label>
                  <input className="trial-input" id="trial-city" type="text" value={city} placeholder={t(`${TK}.cityPlaceholder`)} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div className="trial-field trial-span-2">
                  <div className="trial-label">
                    {t(`${TK}.servicesLabel`)} <span>*</span>{' '}
                    <span className="trial-optional">{t(`${TK}.tapToSelect`)}</span>
                  </div>
                  <div className="trial-chip-list">
                    {SERVICE_CHIPS.map((chip) => (
                      <button
                        key={chip}
                        className={`trial-chip ${activeServices.has(chip) ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => toggleChip(activeServices, chip, setActiveServices)}
                      >
                        {chip}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="trial-field trial-span-2">
                  <div className="trial-label">{t(`${TK}.openDaysLabel`)}</div>
                  <div className="trial-day-list">
                    {DAY_KEYS.map((day) => (
                      <button
                        key={day}
                        className={`trial-day ${activeDays.has(day) ? 'is-active' : ''}`}
                        type="button"
                        onClick={() => toggleChip(activeDays, day, setActiveDays)}
                      >
                        {t(`${TK}.days.${day}`)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="trial-field trial-span-2">
                  <div className="trial-label">{t(`${TK}.hoursLabel`)}</div>
                  <div className="trial-time-row">
                    <select className="trial-select" aria-label={t(`${TK}.openTimeLabel`)} value={openTime} onChange={(e) => setOpenTime(e.target.value)}>
                      {OPEN_TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                    <span className="trial-time-separator">→</span>
                    <select className="trial-select" aria-label={t(`${TK}.closeTimeLabel`)} value={closeTime} onChange={(e) => setCloseTime(e.target.value)}>
                      {CLOSE_TIMES.map((time) => <option key={time} value={time}>{time}</option>)}
                    </select>
                  </div>
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-pain">
                    {t(`${TK}.painLabel`)}{' '}
                    <span className="trial-optional">{t(`${TK}.painHint`)}</span>
                  </label>
                  <select className="trial-select" id="trial-pain" value={painPoint} onChange={(e) => setPainPoint(e.target.value)}>
                    <option value="">{t(`${TK}.painDefault`)}</option>
                    <option value="missed">{t(`${TK}.painMissed`)}</option>
                    <option value="retention">{t(`${TK}.painRetention`)}</option>
                    <option value="reviews">{t(`${TK}.painReviews`)}</option>
                    <option value="manual">{t(`${TK}.painManual`)}</option>
                    <option value="sms">{t(`${TK}.painSms`)}</option>
                  </select>
                </div>
                <div className="trial-field trial-span-2">
                  <label className="trial-label" htmlFor="trial-ref">
                    {t(`${TK}.referralLabel`)} <span className="trial-optional">{t(`${TK}.optional`)}</span>
                  </label>
                  <input
                    className="trial-input trial-input-uppercase"
                    id="trial-ref"
                    type="text"
                    value={referral}
                    placeholder={t(`${TK}.referralPlaceholder`)}
                    onChange={(e) => setReferral(e.target.value.toUpperCase())}
                  />
                  <div className="trial-credit"><GiftIcon /> {t(`${TK}.referralCredit`)}</div>
                </div>
              </div>

              <button className="trial-submit" type="button" onClick={handleSubmit}>
                <RocketIcon />
                {t(`${TK}.submit`)}
              </button>
              <div className="trial-footer">{t(`${TK}.footer`)}</div>
            </div>

            <div className="trial-contact">
              {t(`${TK}.contactLine`)}
              <br />
              <strong>832-979-5559</strong> ({t(`${TK}.contactTry`)}) ·{' '}
              <a href="https://nexoratouch.com" target="_blank" rel="noreferrer">nexoratouch.com</a>
            </div>
          </div>
        ) : (
          <div className="trial-step">
            <div className="trial-head">
              <div className="trial-brand">NEXORA TOUCH</div>
              <h2 className="trial-title">{t(`${TK}.emailTitle`)}</h2>
              <p className="trial-subtitle">
                {t(`${TK}.emailSubtitlePrefix`)}{' '}
                <strong className="trial-email-highlight">{email}</strong>.{' '}
                {t(`${TK}.emailSubtitleSuffix`)}
              </p>
            </div>

            <div className="trial-body">
              <div className="trial-email-preview">
                <div className="trial-email-from">
                  <span className="trial-email-avatar">N</span>
                  <div>
                    <div className="trial-email-sender">NEXORA TOUCH</div>
                    <div className="trial-email-meta">no-reply@nexoratouch.com · {t(`${TK}.emailNow`)}</div>
                  </div>
                </div>
                <div className="trial-email-subject">{t(`${TK}.emailPreviewSubject`)}</div>
                <div className="trial-email-body">{t(`${TK}.emailPreviewBody`)}</div>
              </div>

              <button className="trial-submit trial-submit-spaced" type="button" onClick={handleActivate}>
                {t(`${TK}.activate`)}
              </button>
              <div className="trial-footer">
                {emailStatus === 'activated' ? (
                  <span className="trial-status-success">{t(`${TK}.activatedStatus`)}</span>
                ) : (
                  t(`${TK}.emailStatus`)
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
