// PosFrontDeskView — POS Merchant Ops: Check-in queue / Turn Board / Checkout (US-12).
// Shared between the Owner dashboard (POS > Front Desk) and the Staff dashboard
// (My Salons > a business the Staff has the Operations permission for) — same
// component, no per-shell duplication. `canManageOperations` (from usePosAccess)
// decides whether the actionable UI renders at all; the caller (Owner vs Staff
// route wrapper) is responsible for only linking here when access is expected.
//
// Turn Board and Checkout tabs are "coming soon" placeholders — their backend
// (US-13/US-14) doesn't exist yet. Check-in queue is the only functional tab.
import { useState, type FormEvent } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { usePosAccess } from '../../../../data/hooks/usePosAccess'
import { useCancelTicket, useCheckInTicket, useWaitlist } from '../../../../data/hooks/usePosTickets'
import { SkeletonList } from '../../../ui/skeleton'

type FrontDeskTab = 'checkin' | 'turnboard' | 'checkout'

const WAIT_WARNING_MINUTES = 15

function ComingSoonPanel({ title }: { title: string }) {
  return (
    <div className="nexora-card p-6 text-center text-xs text-nexoraMuted">{title}</div>
  )
}

export default function PosFrontDeskView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const { data: access, isLoading: isAccessLoading } = usePosAccess(businessId)
  const { data: waitlist = [], isLoading: isWaitlistLoading } = useWaitlist(businessId)
  const checkInTicket = useCheckInTicket(businessId)
  const cancelTicket = useCancelTicket(businessId)

  const [activeTab, setActiveTab] = useState<FrontDeskTab>('checkin')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [nameError, setNameError] = useState('')

  if (isAccessLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }

  if (access?.canManageOperations === false) {
    return (
      <div className="nexora-card p-6 text-xs text-nexoraMuted">
        {t('components.dashboard.views.pos.PosFrontDeskView.noAccess')}
      </div>
    )
  }

  const handleCheckIn = (e: FormEvent) => {
    e.preventDefault()
    const name = customerName.trim()
    if (!name) {
      setNameError('required')
      return
    }
    setNameError('')
    checkInTicket.mutate(
      {
        customerName: name,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      },
      {
        onSuccess: () => {
          setCustomerName('')
          setCustomerEmail('')
          setCustomerPhone('')
          showToast(t('components.dashboard.views.pos.PosFrontDeskView.checkedIn'))
        },
        onError: (err: unknown) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
        },
      },
    )
  }

  const handleCancel = async (ticketId: string, name: string) => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelBody', { name }),
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelTitle'),
    )
    if (!confirmed) return
    try {
      await cancelTicket.mutateAsync(ticketId)
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  const tabs: { id: FrontDeskTab; labelKey: string; badge?: number }[] = [
    {
      id: 'checkin',
      labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.checkin',
      badge: waitlist.length,
    },
    { id: 'turnboard', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.turnboard' },
    { id: 'checkout', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.checkout' },
  ]

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-base font-semibold leading-tight text-nexoraText">
          {t('dashboard.menu.pos_board')}
        </h1>
        <p className="text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosFrontDeskView.description')}
        </p>
      </section>

      <div className="flex gap-1 border-b border-nexoraBorder">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-2 text-xs font-bold ${
              activeTab === tab.id
                ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
                : 'text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t(tab.labelKey)}
            {typeof tab.badge === 'number' ? ` (${tab.badge})` : ''}
          </button>
        ))}
      </div>

      {activeTab === 'checkin' && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="nexora-card p-6 md:col-span-1">
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-nexoraText">
              {t('components.dashboard.views.pos.PosFrontDeskView.checkInFormTitle')}
            </h3>
            <form onSubmit={handleCheckIn} noValidate className="space-y-3">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosFrontDeskView.customerName')}
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value)
                    if (nameError) setNameError('')
                  }}
                  aria-invalid={Boolean(nameError)}
                  className={`mt-1 h-10 w-full rounded-lg border bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none transition-all ${
                    nameError
                      ? 'border-rose-500 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                      : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'
                  }`}
                />
                {nameError ? (
                  <p role="alert" className="mt-1 text-[10px] font-bold text-rose-500">
                    {t('components.dashboard.views.pos.PosFrontDeskView.customerNameRequired')}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosFrontDeskView.customerPhone')}
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none transition-all focus:border-nexoraBrand focus:bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosFrontDeskView.customerEmail')}
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="mt-1 h-10 w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3.5 text-xs text-nexoraText outline-none transition-all focus:border-nexoraBrand focus:bg-white"
                />
              </div>
              <button
                type="submit"
                disabled={checkInTicket.isPending}
                className="h-10 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
              >
                {checkInTicket.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t('components.dashboard.views.pos.PosFrontDeskView.checkInButton')
                )}
              </button>
            </form>
          </div>

          <div className="nexora-card p-6 md:col-span-2">
            <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-nexoraText">
              {t('components.dashboard.views.pos.PosFrontDeskView.waitlistTitle')}
            </h3>
            {isWaitlistLoading ? (
              <SkeletonList count={3} lines={1} />
            ) : waitlist.length === 0 ? (
              <p className="text-xs text-nexoraMuted">
                {t('components.dashboard.views.pos.PosFrontDeskView.waitlistEmpty')}
              </p>
            ) : (
              <ul className="space-y-2">
                {waitlist.map((ticket) => {
                  const isLongWait = ticket.waitMinutes >= WAIT_WARNING_MINUTES
                  return (
                    <li
                      key={ticket.id}
                      className="flex items-center justify-between gap-3 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-nexoraMuted">
                            #{ticket.ticketNumber}
                          </span>
                          <span className="truncate text-sm font-bold text-nexoraText">
                            {ticket.customerName}
                          </span>
                        </div>
                        {ticket.serviceNames.length > 0 ? (
                          <p className="truncate text-[11px] text-nexoraMuted">
                            {ticket.serviceNames.join(', ')}
                          </p>
                        ) : null}
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-extrabold ${
                          isLongWait ? 'text-rose-600' : 'text-nexoraMuted'
                        }`}
                      >
                        {t('components.dashboard.views.pos.PosFrontDeskView.waitMinutes', {
                          minutes: ticket.waitMinutes,
                        })}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCancel(ticket.id, ticket.customerName)}
                        disabled={cancelTicket.isPending}
                        className="shrink-0 rounded-lg border border-nexoraBorder px-2.5 py-1.5 text-[10px] font-bold text-nexoraMuted hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
                      >
                        {t('components.dashboard.views.pos.PosFrontDeskView.cancelButton')}
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      )}

      {activeTab === 'turnboard' && (
        <ComingSoonPanel title={t('components.dashboard.views.pos.PosFrontDeskView.turnBoardComingSoon')} />
      )}
      {activeTab === 'checkout' && (
        <ComingSoonPanel title={t('components.dashboard.views.pos.PosFrontDeskView.checkoutComingSoon')} />
      )}
    </div>
  )
}
