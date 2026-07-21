// PosFrontDeskView — POS Merchant Ops: Check-in / Order List / Waiting List / Turn Board
// (US-12/US-13/US-14, refactored to Order in US-026, restructured into 4 tabs + full-page
// Order Workspace in US-17).
// Shared between the Owner dashboard (POS > Front Desk) and the Staff dashboard
// (My Salons > a business the Staff has the Operations permission for) — same
// component, no per-shell duplication. `canManageOperations` (from usePosAccess)
// decides whether the actionable UI renders at all; the caller (Owner vs Staff
// route wrapper) is responsible for only linking here when access is expected.
import { useState, type FormEvent } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { formatNationalNumber, getNationalPhonePlaceholder, PhoneDialCode } from '../../../CountryCodeSelect'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { qk } from '../../../../data/queryKeys'
import { usePosAccess } from '../../../../data/hooks/usePosAccess'
import {
  useAssignStaffToServiceLine,
  useCancelOrder,
  useOrderList,
  useStartOrderService,
  useWaitlist,
} from '../../../../data/hooks/usePosOrders'
import { useTurnBoard } from '../../../../data/hooks/usePosTurnBoard'
import { useAddOrderServiceLine, useCheckoutServiceCatalog } from '../../../../data/hooks/usePosCheckout'
import type { TurnBoardStationApiDto } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import PosOrderWorkspace from './PosOrderWorkspace'
import PosCompletedOrdersPanel from './PosCompletedOrdersPanel'

type FrontDeskTab = 'checkin' | 'orderlist' | 'waitlist' | 'turnboard' | 'completed'

type WorkspaceState =
  | { mode: 'create'; customerDraft: { customerName: string; customerEmail?: string; customerPhone?: string } }
  | { mode: 'update'; orderId: string }

const WAIT_WARNING_MINUTES = 15

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

export default function PosFrontDeskView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const queryClient = useQueryClient()
  const { data: access, isLoading: isAccessLoading } = usePosAccess(businessId)
  const { data: waitlist = [], isLoading: isWaitlistLoading } = useWaitlist(businessId)
  const { data: orderList = [], isLoading: isOrderListLoading } = useOrderList(businessId)
  const { data: turnBoard = [], isLoading: isTurnBoardLoading } = useTurnBoard(businessId)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const cancelOrder = useCancelOrder(businessId)
  const addOrderServiceLine = useAddOrderServiceLine(businessId)
  const assignStaffToServiceLine = useAssignStaffToServiceLine(businessId)
  const startOrderService = useStartOrderService(businessId)

  const [activeTab, setActiveTab] = useState<FrontDeskTab>('checkin')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [nameError, setNameError] = useState('')
  const [assignStaffSelection, setAssignStaffSelection] = useState<Record<string, string>>({})
  const [assignServiceSelection, setAssignServiceSelection] = useState<Record<string, string>>({})
  const [assigningOrderId, setAssigningOrderId] = useState<string | null>(null)
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null)

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

  // Leaving the Order Workspace (Close/Checked-in/Completed) always refreshes every
  // list this screen shows — most individual actions already invalidate the right cache
  // via their own mutation hooks, but this is a direct guarantee independent of exactly
  // which actions fired while the workspace was open.
  const refreshFrontDeskLists = () => {
    queryClient.invalidateQueries({ queryKey: qk.merchantPosWaitlist(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosOrderList(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosTurnBoard(businessId) })
    queryClient.invalidateQueries({ queryKey: qk.merchantPosCompletedOrders(businessId) })
  }

  if (workspace) {
    return (
      <PosOrderWorkspace
        businessId={businessId}
        orderId={workspace.mode === 'update' ? workspace.orderId : null}
        customerDraft={workspace.mode === 'create' ? workspace.customerDraft : undefined}
        onClose={() => {
          setWorkspace(null)
          refreshFrontDeskLists()
        }}
        onCheckedIn={() => {
          setWorkspace(null)
          setActiveTab('waitlist')
          refreshFrontDeskLists()
        }}
        onCompleted={() => {
          setWorkspace(null)
          refreshFrontDeskLists()
        }}
      />
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
    setWorkspace({
      mode: 'create',
      customerDraft: {
        customerName: name,
        customerEmail: customerEmail.trim() || undefined,
        customerPhone: customerPhone.trim() || undefined,
      },
    })
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
  }

  const handleCancel = async (orderId: string, name: string) => {
    const confirmed = await showConfirm(
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelBody', { name }),
      t('components.dashboard.views.pos.PosFrontDeskView.confirmCancelTitle'),
    )
    if (!confirmed) return
    try {
      await cancelOrder.mutateAsync(orderId)
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    }
  }

  // Turn Board's "Empty" station quick-assign is unchanged by US-17 — still 3 sequential
  // calls (add the first service line, assign it to a staff member or auto-pick, then
  // explicitly start service) since the check-in form no longer collects services itself.
  const handleAssignAndStart = async (orderId: string, posStaffProfileId?: string) => {
    const posServiceId = assignServiceSelection[orderId] ?? serviceCatalog[0]?.id
    if (!posServiceId) {
      showToast(t('components.dashboard.views.pos.PosFrontDeskView.noServiceAvailable'), 'error')
      return
    }
    setAssigningOrderId(orderId)
    try {
      const serviceLineId = await addOrderServiceLine.mutateAsync({ orderId, posServiceId })
      await assignStaffToServiceLine.mutateAsync({ orderId, serviceLineId, posStaffProfileId })
      await startOrderService.mutateAsync(orderId)
      showToast(t('components.dashboard.views.pos.PosFrontDeskView.assigned'))
    } catch (err: unknown) {
      showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
    } finally {
      setAssigningOrderId(null)
    }
  }

  const tabs: { id: FrontDeskTab; labelKey: string; badge?: number }[] = [
    { id: 'checkin', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.checkin' },
    {
      id: 'orderlist',
      labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.orderlist',
      badge: orderList.length,
    },
    {
      id: 'waitlist',
      labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.waitlist',
      badge: waitlist.length,
    },
    { id: 'turnboard', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.turnboard' },
    { id: 'completed', labelKey: 'components.dashboard.views.pos.PosFrontDeskView.tabs.completed' },
  ]

  const renderServiceSelect = (orderId: string) => (
    <select
      value={assignServiceSelection[orderId] ?? serviceCatalog[0]?.id ?? ''}
      onChange={(e) => setAssignServiceSelection((prev) => ({ ...prev, [orderId]: e.target.value }))}
      className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
    >
      {serviceCatalog.map((service) => (
        <option key={service.id} value={service.id}>
          {service.name} — ${service.price.toFixed(2)}
        </option>
      ))}
    </select>
  )

  const renderStationCard = (station: TurnBoardStationApiDto) => {
    const selectedOrderId = assignStaffSelection[station.posStaffProfileId] ?? waitlist[0]?.id ?? ''
    const isAssigningThisStation = assigningOrderId === selectedOrderId

    return (
      <div key={station.posStaffProfileId} className="nexora-card space-y-3 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-bold text-nexoraText">
            {station.photoUrl ? (
              <img src={station.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              getInitials(station.displayName)
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-nexoraText">{station.displayName}</p>
            <p className="text-[11px] font-extrabold uppercase text-nexoraMuted">
              {t(`components.dashboard.views.pos.PosFrontDeskView.stationStatus.${station.currentStatus}`)}
            </p>
          </div>
        </div>

        {station.currentStatus === 'InService' && (
          <div className="space-y-2 rounded-lg bg-nexoraCanvas p-3">
            <p className="truncate text-xs font-bold text-nexoraText">{station.currentCustomerName}</p>
            {station.currentPrimaryServiceName ? (
              <p className="truncate text-[11px] text-nexoraMuted">{station.currentPrimaryServiceName}</p>
            ) : null}
            {station.assignedAt ? (
              <p className="text-[11px] text-nexoraMuted">
                {t('components.dashboard.views.pos.PosFrontDeskView.servingSince', {
                  time: formatTime(station.assignedAt),
                })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={() => station.currentOrderId && setWorkspace({ mode: 'update', orderId: station.currentOrderId })}
              className="h-9 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {t('components.dashboard.views.pos.PosFrontDeskView.checkoutButton')}
            </button>
          </div>
        )}

        {station.currentStatus === 'Empty' && (
          <div className="space-y-2">
            {waitlist.length > 0 ? (
              <>
                <select
                  value={selectedOrderId}
                  onChange={(e) =>
                    setAssignStaffSelection((prev) => ({ ...prev, [station.posStaffProfileId]: e.target.value }))
                  }
                  className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                >
                  {waitlist.map((order) => (
                    <option key={order.id} value={order.id}>
                      #{order.orderNumber} — {order.customerName}
                    </option>
                  ))}
                </select>
                {renderServiceSelect(selectedOrderId)}
                <button
                  type="button"
                  onClick={() => handleAssignAndStart(selectedOrderId, station.posStaffProfileId)}
                  disabled={isAssigningThisStation || serviceCatalog.length === 0}
                  className="h-9 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {isAssigningThisStation ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t('components.dashboard.views.pos.PosFrontDeskView.assignGuestButton')
                  )}
                </button>
              </>
            ) : (
              <p className="text-[11px] text-nexoraMuted">
                {t('components.dashboard.views.pos.PosFrontDeskView.waitlistEmpty')}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

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
        <div className="nexora-card max-w-md p-6">
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
                onChange={(e) => setCustomerPhone(formatNationalNumber(e.target.value, PhoneDialCode.US))}
                placeholder={getNationalPhonePlaceholder(PhoneDialCode.US)}
                inputMode="numeric"
                autoComplete="tel-national"
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
              className="h-10 w-full rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
            >
              {t('components.dashboard.views.pos.PosFrontDeskView.checkInButton')}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'orderlist' && (
        isOrderListLoading ? (
          <div className="nexora-card p-6">
            <SkeletonList count={3} lines={1} />
          </div>
        ) : orderList.length === 0 ? (
          <div className="nexora-card p-6 text-center text-xs text-nexoraMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.orderListEmpty')}
          </div>
        ) : (
          <div className="nexora-card overflow-x-auto p-4">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnOrder')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnGuest')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnStatus')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnTechnician')}</th>
                  <th className="pb-2 pr-3">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnServices')}</th>
                  <th className="pb-2 text-right">{t('components.dashboard.views.pos.PosFrontDeskView.orderListColumnElapsed')}</th>
                </tr>
              </thead>
              <tbody>
                {orderList.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setWorkspace({ mode: 'update', orderId: order.id })}
                    className="cursor-pointer border-t border-nexoraBorder hover:bg-nexoraCanvas"
                  >
                    <td className="py-2 pr-3 font-mono font-bold text-nexoraMuted">#{order.orderNumber}</td>
                    <td className="py-2 pr-3 font-bold text-nexoraText">{order.customerName}</td>
                    <td className="py-2 pr-3 text-nexoraMuted">{order.status}</td>
                    <td className="py-2 pr-3 text-nexoraMuted">
                      {order.technicianNames.length > 0 ? order.technicianNames.join(', ') : '—'}
                    </td>
                    <td className="py-2 pr-3 text-nexoraMuted">
                      {order.serviceNames.length > 0 ? order.serviceNames.join(', ') : '—'}
                    </td>
                    <td className="py-2 text-right text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosFrontDeskView.waitMinutes', { minutes: order.elapsedMinutes })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}

      {activeTab === 'waitlist' && (
        <div className="nexora-card p-6">
          <h3 className="mb-3 text-xs font-black uppercase tracking-wider text-nexoraText">
            {t('components.dashboard.views.pos.PosFrontDeskView.waitlistTitle')}
          </h3>
          {isWaitlistLoading ? (
            <SkeletonList count={3} lines={1} />
          ) : waitlist.length === 0 ? (
            <p className="text-xs text-nexoraMuted">{t('components.dashboard.views.pos.PosFrontDeskView.waitlistEmpty')}</p>
          ) : (
            <ul className="space-y-2">
              {waitlist.map((order) => {
                const isLongWait = order.waitMinutes >= WAIT_WARNING_MINUTES
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => setWorkspace({ mode: 'update', orderId: order.id })}
                      className="flex w-full items-center justify-between gap-3 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 text-left shadow-sm hover:border-nexoraBrand"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11px] font-bold text-nexoraMuted">#{order.orderNumber}</span>
                          <span className="truncate text-sm font-bold text-nexoraText">{order.customerName}</span>
                        </div>
                        <p className="truncate text-[11px] text-nexoraMuted">
                          {order.serviceNames.length > 0
                            ? order.serviceNames.join(', ')
                            : t('components.dashboard.views.pos.PosFrontDeskView.noServiceYet')}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 text-[11px] font-extrabold ${isLongWait ? 'text-rose-600' : 'text-nexoraMuted'}`}
                      >
                        {t('components.dashboard.views.pos.PosFrontDeskView.waitMinutes', { minutes: order.waitMinutes })}
                      </span>
                    </button>
                    <div className="mt-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleCancel(order.id, order.customerName)}
                        disabled={cancelOrder.isPending}
                        className="shrink-0 rounded-lg border border-nexoraBorder px-2.5 py-1 text-[10px] font-bold text-nexoraMuted hover:border-rose-300 hover:text-rose-600 disabled:opacity-60"
                      >
                        {t('components.dashboard.views.pos.PosFrontDeskView.cancelButton')}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      )}

      {activeTab === 'turnboard' && (
        isTurnBoardLoading ? (
          <div className="nexora-card p-6">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : turnBoard.length === 0 ? (
          <div className="nexora-card p-6 text-center text-xs text-nexoraMuted">
            {t('components.dashboard.views.pos.PosFrontDeskView.turnBoardEmpty')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {turnBoard.map(renderStationCard)}
          </div>
        )
      )}

      {activeTab === 'completed' && <PosCompletedOrdersPanel businessId={businessId} />}
    </div>
  )
}
