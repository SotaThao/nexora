// PosOrderWorkspace — POS Merchant Ops: full-page Order Workspace (US-17), replacing the
// old small-modal PosCheckoutModal. Opened on an order that already exists, from Order
// List / Waiting List / Turn Board.
//
// Every add/edit/delete/Qty-change calls its endpoint immediately (live) — there is no
// local draft and no separate "Save" button; the row list is always derived directly from
// the latest `GetOrderDetailQuery` result. The bottom action button is only ever the *next
// status transition* (Start Service / Checkout) or the final Complete payment.
//
// Creating an order is no longer done here: the Check-in tab renders the shared check-in
// page (PosCheckInTab / CheckInSurface), the same one the customer kiosk runs.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Package, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../../data/errorCodes'
import {
  useAddOrderServiceLine,
  useCheckoutServiceCatalog,
  useCompleteOrder,
  useOrderDetail,
  useRemoveOrderProductLine,
  useRemoveOrderServiceLine,
  useUpdateOrderServiceLine,
  useSetOrderStaffTipSplit,
  useSetOrderTip,
  useUpdateOrderProductLineQuantity,
} from '../../../../data/hooks/usePosCheckout'
import {
  useAssignStaffToServiceLine,
  useStartOrderService,
} from '../../../../data/hooks/usePosOrders'
import { useCheckInTechnicians } from '../../../../data/hooks/usePosCheckIn'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import type {
  CheckoutServiceCatalogItemApiDto,
  PosCheckoutPaymentMethodType,
} from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CategoryGroupedCatalogPicker from './CategoryGroupedCatalogPicker'
import ChangeServiceModal from './modals/ChangeServiceModal'
import ChangeTechnicianModal from './modals/ChangeTechnicianModal'

type TipMode = 'noTip' | 'fixed10' | 'fixed15' | 'pct10' | 'pct20' | 'custom'

const PAYMENT_METHODS: PosCheckoutPaymentMethodType[] = ['Card', 'Cash', 'GiftCard', 'SplitPay']

// Percentage-based tip modes are a live % of servicesSubtotal, not a one-time snapshot —
// see the tip-percentage recompute effect below, which re-applies this whenever the
// subtotal changes (e.g. a service gets added/removed) so Payment Summary never shows a
// tip that was only correct for a subtotal that no longer exists.
const TIP_PERCENT_BY_MODE: Partial<Record<TipMode, number>> = {
  pct10: 0.1,
  pct20: 0.2,
}

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

interface DisplayServiceLine {
  key: string
  // Set for a line that already exists server-side (always set in Update mode, never set
  // for a not-yet-checked-in Create-mode draft line).
  existingId?: string
  itemType: 'Service'
  posServiceId: string
  serviceName: string
  unitPrice: number
  posStaffProfileId?: string
  technicianName?: string
  note?: string
  completedAt?: string | null
}

interface DisplayProductLine {
  key: string
  existingId?: string
  itemType: 'Product'
  posProductId: string
  productName: string
  unitPrice: number
  quantity: number
}

type DisplayLine = DisplayServiceLine | DisplayProductLine

function lineTotal(line: DisplayLine): number {
  return line.itemType === 'Service' ? line.unitPrice : line.unitPrice * line.quantity
}

export default function PosOrderWorkspace({
  businessId,
  orderId,
  onClose,
  onCompleted,
}: {
  businessId: string
  orderId: string
  // Renders a "Back" button next to the title.
  onClose?: () => void
  onCompleted?: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const { data: order, isLoading: isOrderLoading } = useOrderDetail(businessId, orderId)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  // One query for every technician plus the services each can perform, rather than the drawer's
  // per-service query: with the picker inline, several lines can ask the same question at once.
  // Same population either way — both endpoints require an Active staff link and an Active POS
  // profile, and both mark busy from an InService line.
  const { data: allTechnicians = [], isPending: areTechniciansPending } = useCheckInTechnicians(businessId)

  const addServiceLine = useAddOrderServiceLine(businessId)
  const removeServiceLine = useRemoveOrderServiceLine(businessId)
  const updateServiceLine = useUpdateOrderServiceLine(businessId)
  const removeProductLine = useRemoveOrderProductLine(businessId)
  const updateProductQuantity = useUpdateOrderProductLineQuantity(businessId)
  const assignStaffToServiceLine = useAssignStaffToServiceLine(businessId)
  const startOrderService = useStartOrderService(businessId)
  const setTip = useSetOrderTip(businessId)
  const setStaffTipSplit = useSetOrderStaffTipSplit(businessId)
  const completeOrder = useCompleteOrder(businessId)

  const [showPaymentSection, setShowPaymentSection] = useState(false)
  // The line whose technician is being picked. Carries the values the popup needs to open and the
  // ones the save has to send back unchanged, so it never reaches into the list again.
  const [technicianTarget, setTechnicianTarget] = useState<{
    serviceLineId: string
    serviceName: string
    posServiceId: string
    posStaffProfileId?: string
    note?: string
  } | null>(null)
  const [noteDraft, setNoteDraft] = useState('')
  // The line whose service is being swapped. Held as id + name so the popup can title itself
  // without reaching back into the list.
  const [changeServiceTarget, setChangeServiceTarget] = useState<{
    serviceLineId: string
    serviceName: string
    posServiceId: string
  } | null>(null)
  const [tipMode, setTipMode] = useState<TipMode>('noTip')
  const [customTipInput, setCustomTipInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  // POS iPad redesign, Ticket 6 — "Turn to Customer": front desk flips the iPad around so
  // the customer picks their own tip in private. Deliberately does NOT auto-return after
  // the customer confirms — front desk must explicitly tap "Back to Staff" once they have
  // the device back (brainstorm decision: avoid stray taps landing on the next screen).
  const [customerFacingMode, setCustomerFacingMode] = useState(false)
  // POS iPad redesign, Ticket 6 — receipt delivery is a single choice: Send SMS (using the phone
  // already on file — mandatory since Ticket 2, so always available) or No Receipt. Email option
  // dropped from this screen entirely; physical Print stays as a disabled placeholder button (no
  // printer integration yet).
  //
  // Defaults to No Receipt: a receipt costs an SMS and most walk-ins do not ask for one, so it is
  // opted into per checkout rather than sent unless someone remembers to turn it off.
  const [receiptChoice, setReceiptChoice] = useState<'sms' | 'none'>('none')
  const [tipSplitInputs, setTipSplitInputs] = useState<Record<string, string>>({})
  const initializedOrderIdRef = useRef<string | null>(null)

  // No local draft for the lines — the table is always a live reflection of the latest
  // GetOrderDetailQuery result, since every edit already calls its endpoint immediately
  // (see handlers below).
  const visibleLines: DisplayLine[] = useMemo(() => {
    if (!order) return []
    return [
      ...order.serviceLines.map((l): DisplayServiceLine => ({
        key: l.id,
        existingId: l.id,
        itemType: 'Service',
        posServiceId: l.posServiceId,
        serviceName: l.serviceName,
        unitPrice: l.unitPrice,
        posStaffProfileId: l.assignedPosStaffProfileId ?? undefined,
        technicianName: l.technicianName ?? undefined,
        note: l.note ?? undefined,
        completedAt: l.completedAt,
      })),
      ...order.productLines.map((l): DisplayProductLine => ({
        key: l.id,
        existingId: l.id,
        itemType: 'Product',
        posProductId: '',
        productName: l.productName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
    ]
  }, [order])

  // Initializes local UI-only state (tip mode, receipt fields, payment-section visibility)
  // from the server exactly once per order id — later refetches (from this cashier's own
  // live edits or another tab) must not reset what the user is currently doing with tip/
  // payment-method inputs mid-checkout.
  useEffect(() => {
    if (!order || initializedOrderIdRef.current === order.id) return
    initializedOrderIdRef.current = order.id

    // A product-only order (zero service lines) never transitions through InService — it
    // completes straight from Waiting (see CompleteOrderCommand) — so treat Waiting the same
    // as InService for payment-section visibility when there's nothing to serve.
    setShowPaymentSection(
      order.status === PosOrderStatus.InService ||
        order.status === PosOrderStatus.Completed ||
        (order.status === PosOrderStatus.Waiting && order.serviceLines.length === 0),
    )
    setReceiptChoice('none')
    setPaymentMethod('Cash')

    if (order.tipAmount === 0) {
      setTipMode('noTip')
    } else {
      const subtotal = order.servicesSubtotal
      const pct10 = subtotal > 0 ? round2(subtotal * TIP_PERCENT_BY_MODE.pct10!) : -1
      const pct20 = subtotal > 0 ? round2(subtotal * TIP_PERCENT_BY_MODE.pct20!) : -1
      if (order.tipAmount === 10) setTipMode('fixed10')
      else if (order.tipAmount === 15) setTipMode('fixed15')
      else if (order.tipAmount === pct10) setTipMode('pct10')
      else if (order.tipAmount === pct20) setTipMode('pct20')
      else setTipMode('custom')
      setCustomTipInput(String(order.tipAmount))
    }
  }, [order])

  useEffect(() => {
    if (!order) return
    setTipSplitInputs(
      Object.fromEntries(order.staffTipShares.map((share) => [share.posStaffProfileId, String(share.tipAmount)])),
    )
  }, [order])

  const hasServiceLines = visibleLines.some((l) => l.itemType === 'Service')
  // "First available" leaves a line unassigned on purpose — a person on the floor decides who
  // takes it. StartOrderService and CompleteOrder both refuse an order in that state, so the two
  // buttons are disabled rather than left to fail with a red toast at the worst moment.
  const hasUnassignedServiceLine = visibleLines.some(
    (l) => l.itemType === 'Service' && !l.posStaffProfileId,
  )
  const draftSubtotal = visibleLines.reduce((sum, l) => sum + lineTotal(l), 0)

  // AssignStaffToServiceLine only accepts a Waiting or InService order, so a closed ticket shows
  // its technicians as text instead of offering a picker every tap of which would fail.
  const canEditLines =
    order?.status === PosOrderStatus.Waiting || order?.status === PosOrderStatus.InService

  // Never offer someone the service is not assigned to — the rule the per-service endpoint applied
  // server-side, now applied to the one list this screen holds.
  const techniciansForService = (posServiceId: string) =>
    allTechnicians.filter((tech) => tech.serviceIds.includes(posServiceId))

  const noteLines = visibleLines.filter(
    (l): l is DisplayServiceLine => l.itemType === 'Service' && Boolean(l.note?.trim()),
  )

  const reportError = (err: unknown) => {
    showToast(getErrorMessage(err, t, 'ERROR'), 'error')
  }

  // The line is added unassigned and its picker opens on the new row, so the technician question
  // is still asked immediately — it just no longer blocks the catalog behind an overlay. Leaving it
  // unanswered is a valid state ("First available"); Start Service is what refuses to proceed.
  const handleCatalogServiceClick = (service: CheckoutServiceCatalogItemApiDto) => {
    addServiceLine.mutate(
      { orderId, posServiceId: service.id, unitPrice: service.price, serviceName: service.name },
      {
        onSuccess: (newServiceLineId) => {
          setTechnicianTarget({
            serviceLineId: newServiceLineId,
            serviceName: service.name,
            posServiceId: service.id,
          })
          setNoteDraft('')
        },
        onError: reportError,
      },
    )
  }

  const openTechnicianModal = (line: DisplayServiceLine) => {
    if (!line.existingId) return
    setTechnicianTarget({
      serviceLineId: line.existingId,
      serviceName: line.serviceName,
      posServiceId: line.posServiceId,
      posStaffProfileId: line.posStaffProfileId,
      note: line.note,
    })
    setNoteDraft(line.note ?? '')
  }

  // One call, so the line keeps its technician, its note and its position. Deleting and re-adding
  // — what the front desk had to do before — lost all three and cost two steps.
  const handleChangeService = (posServiceId: string) => {
    const target = changeServiceTarget
    setChangeServiceTarget(null)
    if (!target || posServiceId === target.posServiceId) return

    const service = serviceCatalog.find((s) => s.id === posServiceId)
    if (!service) return
    updateServiceLine.mutate(
      {
        orderId,
        serviceLineId: target.serviceLineId,
        posServiceId,
        unitPrice: service.price,
        serviceName: service.name,
      },
      { onError: reportError },
    )
  }

  // AssignStaffToServiceLine overwrites Note unconditionally, so both values travel together on
  // every call — sending only the technician would silently wipe the note.
  const saveServiceLine = (serviceLineId: string, posStaffProfileId: string | undefined, note: string) => {
    assignStaffToServiceLine.mutate(
      {
        orderId,
        serviceLineId,
        posStaffProfileId,
        note: note.trim() || undefined,
      },
      { onError: reportError },
    )
  }

  const handleSelectTechnician = (posStaffProfileId: string | null) => {
    const target = technicianTarget
    setTechnicianTarget(null)
    if (!target) return
    saveServiceLine(target.serviceLineId, posStaffProfileId ?? undefined, noteDraft)
  }

  // Closing without picking anyone still keeps a note the operator typed — it is saved against
  // whoever the line already had, since the endpoint writes both fields together.
  const handleCloseTechnicianModal = () => {
    const target = technicianTarget
    setTechnicianTarget(null)
    if (!target || noteDraft.trim() === (target.note ?? '').trim()) return
    saveServiceLine(target.serviceLineId, target.posStaffProfileId, noteDraft)
  }

  const handleDeleteLine = (line: DisplayLine) => {
    if (!line.existingId) return
    if (line.itemType === 'Service') {
      removeServiceLine.mutate({ orderId, serviceLineId: line.existingId }, { onError: reportError })
    } else {
      removeProductLine.mutate({ orderId, productLineId: line.existingId }, { onError: reportError })
    }
  }

  // POS iPad redesign — Order Detail stepper replaces the old free-text Qty input (which
  // needed a keyboard draft-then-blur-commit dance). A +/- tap applies immediately since
  // there's no partial/invalid intermediate state to debounce, unlike typed text.
  const applyQuantityDelta = (line: DisplayProductLine, delta: number) => {
    const nextQty = Math.max(1, line.quantity + delta)
    if (nextQty === line.quantity) return

    if (!line.existingId) return
    updateProductQuantity.mutate(
      { orderId, productLineId: line.existingId, quantity: nextQty },
      { onError: reportError },
    )
  }

  const handleStartService = () => {
    startOrderService.mutate(orderId, {
      onSuccess: () => showToast(t('components.dashboard.views.pos.PosOrderWorkspace.startServiceSuccess')),
      onError: reportError,
    })
  }

  const handleCheckoutFromUpdate = () => {
    // Only start service first if there's actually a service to serve — a product-only
    // Waiting order has nothing to start (StartOrderService rejects it) and can go straight
    // to payment.
    if (order?.status === PosOrderStatus.Waiting && hasServiceLines) {
      startOrderService.mutate(orderId, {
        onSuccess: () => setShowPaymentSection(true),
        onError: reportError,
      })
    } else {
      setShowPaymentSection(true)
    }
  }

  const applyTip = (mode: TipMode, amount: number) => {
    setTipMode(mode)
    if (amount < 0) return
    setTip.mutate({ orderId, tipAmount: amount }, { onError: reportError })
  }

  const handleCustomTipCommit = () => {
    const parsed = Number(customTipInput)
    if (!Number.isFinite(parsed) || parsed < 0) return
    applyTip('custom', round2(parsed))
  }

  // A percentage tip mode (pct10/pct20) is a live % of servicesSubtotal, not a one-time
  // dollar snapshot — without this, adding/removing a service after picking e.g. 10%
  // leaves the old dollar amount on the order, so Payment Summary's Tip/Total silently
  // stop matching the selected percentage. Re-applies the percentage server-side whenever
  // the subtotal it's based on changes; a no-op once the persisted tip already matches.
  useEffect(() => {
    const percent = TIP_PERCENT_BY_MODE[tipMode]
    if (percent === undefined || !order) return
    const expectedTip = round2(order.servicesSubtotal * percent)
    if (Math.abs(expectedTip - order.tipAmount) < 0.005) return
    setTip.mutate({ orderId, tipAmount: expectedTip }, { onError: reportError })
    // Only the subtotal driving the % (and the mode itself) should retrigger this — order.
    // tipAmount is deliberately excluded, since this effect is what changes it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.servicesSubtotal, tipMode, orderId])

  const tipSplitTotal = Object.values(tipSplitInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
  const isTipSplitBalanced = order ? Math.abs(round2(tipSplitTotal) - order.tipAmount) < 0.01 : false

  const handleSaveTipSplit = () => {
    if (!order || !isTipSplitBalanced) return
    setStaffTipSplit.mutate(
      {
        orderId,
        payload: {
          shares: Object.entries(tipSplitInputs).map(([posStaffProfileId, amount]) => ({
            posStaffProfileId,
            tipAmount: round2(Number(amount) || 0),
          })),
        },
      },
      { onError: reportError },
    )
  }

  const handleComplete = () => {
    completeOrder.mutate(
      {
        orderId,
        payload: {
          paymentMethodType: paymentMethod,
          receiptPhone: receiptChoice === 'sms' ? order?.customerPhone ?? undefined : undefined,
        },
      },
      {
        onSuccess: () => {
          showToast(t('components.dashboard.views.pos.PosOrderWorkspace.completeSuccess'))
          onCompleted?.()
        },
        onError: reportError,
      },
    )
  }

  const isBusy = startOrderService.isPending

  // Services only. The Products tab is hidden rather than deleted — the picker, the
  // AddOrderProductLine endpoint and the Products catalog screen all stay, so retail selling is one
  // JSX block away from coming back. Nothing sells products anywhere while it is hidden: check-in
  // dropped them with the one-page redesign, and this was the last surface.
  const catalogPanel = (
          <div className="nexora-card space-y-3 p-4 lg:col-span-3">
            <h3 className="border-b border-nexoraBorder pb-2 text-xs font-black uppercase tracking-wider text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.tabServices')}
            </h3>

            <CategoryGroupedCatalogPicker
              variant="grid"
              items={serviceCatalog}
              onAdd={(itemId) => {
                const service = serviceCatalog.find((s) => s.id === itemId)
                if (service) handleCatalogServiceClick(service)
              }}
              addLabel={t('components.dashboard.views.pos.PosOrderWorkspace.addButton')}
              emptyLabel={t('components.dashboard.views.pos.PosOrderWorkspace.noServicesInCategory')}
              allCategoryLabel={t('components.dashboard.views.pos.PosOrderWorkspace.allCategories')}
              uncategorizedLabel={t('components.dashboard.views.pos.PosOrderWorkspace.uncategorized')}
              searchPlaceholder={t('components.dashboard.views.pos.PosOrderWorkspace.searchServicesPlaceholder')}
            />
          </div>
  )

  const orderPanel = (
          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-3 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
              </h3>

              {visibleLines.length === 0 ? (
                <p className="text-[11px] text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}
                </p>
              ) : (
                // Bounded height + internal scroll: a long order scrolls its line items in
                // place, keeping Note/Estimated Total/Start Service/Checkout below always visible.
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {visibleLines.map((line) =>
                    line.itemType === 'Service' ? (
                      (() => {
                        const technicianLabel =
                          line.technicianName ??
                          t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel')
                        // A service that is already done keeps its name as text: the work was
                        // performed and may already count toward commission, so the backend refuses
                        // to swap it. Its technician stays editable.
                        const canChangeService = canEditLines && !line.completedAt && !!line.existingId
                        return (
                      <div key={line.key} className="space-y-2 rounded-2xl border border-nexoraBorder bg-white p-2.5">
                        <div className="flex items-start gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraLavender/20 text-xs font-bold text-nexoraBrandDark">
                            {initials(technicianLabel)}
                          </div>
                          <div className="min-w-0 flex-1 space-y-1">
                            {/* Opens a popup, so this carries a pencil rather than the technician
                                field's caret — the two controls sit on top of each other and must
                                not look like they do the same thing. */}
                            {canChangeService ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setChangeServiceTarget({
                                    serviceLineId: line.existingId as string,
                                    serviceName: line.serviceName,
                                    posServiceId: line.posServiceId,
                                  })
                                }
                                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.changeService')}
                                className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-nexoraBorder px-2.5 text-sm font-bold text-nexoraText hover:border-nexoraBrand"
                              >
                                <span className="truncate">{line.serviceName}</span>
                                <Pencil className="h-3.5 w-3.5 shrink-0 text-nexoraMuted" />
                              </button>
                            ) : (
                              <p className="text-sm font-bold leading-tight text-nexoraText">{line.serviceName}</p>
                            )}
                            {/* Styled as a field rather than plain text: the technician is the one
                                thing on this row an operator changes, and the ticket-list feedback
                                was that an unlabelled tap target is a rule nobody gets told. A
                                closed ticket shows the same value as text — the backend refuses
                                edits there, so there is nothing to offer. */}
                            {canEditLines ? (
                              <button
                                type="button"
                                onClick={() => openTechnicianModal(line)}
                                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.changeTechnician')}
                                className="flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-nexoraBorder px-2.5 text-xs font-bold text-nexoraText hover:border-nexoraBrand"
                              >
                                <span className="truncate">{technicianLabel}</span>
                                <Pencil className="h-3.5 w-3.5 shrink-0 text-nexoraMuted" />
                              </button>
                            ) : (
                              <p className="text-xs leading-tight text-nexoraMuted">{technicianLabel}</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <span className="text-sm font-bold text-nexoraText">${lineTotal(line).toFixed(2)}</span>
                            <button
                              type="button"
                              onClick={() => handleDeleteLine(line)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl text-nexoraMuted hover:bg-red-50 hover:text-nexoraDanger"
                              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.deleteLine')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                      </div>
                        )
                      })()
                    ) : (
                      <div key={line.key} className="space-y-2 rounded-2xl border border-nexoraBorder bg-white p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-nexoraBrandDark">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-tight text-nexoraText">{line.productName}</p>
                            <p className="text-xs leading-tight text-nexoraMuted">${line.unitPrice.toFixed(2)} each</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-nexoraText">
                            ${lineTotal(line).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => applyQuantityDelta(line, -1)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
                              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.decreaseQty')}
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-nexoraText">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => applyQuantityDelta(line, 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
                              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.increaseQty')}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-nexoraMuted hover:bg-red-50 hover:text-nexoraDanger"
                            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.deleteLine')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              )}

              {noteLines.length > 0 ? (
                <div className="rounded-xl bg-nexoraCanvas p-3">
                  <h4 className="mb-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.noteTitle')}
                  </h4>
                  <ul className="space-y-0.5 text-[11px] text-nexoraText">
                    {noteLines.map((line) => (
                      <li key={line.key}>
                        <span className="font-semibold">{line.serviceName}:</span> {line.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!showPaymentSection ? (
                <div className="flex justify-between border-t border-nexoraBorder pt-2 text-xs">
                  <span className="font-black uppercase text-nexoraText">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.estimatedTotal')}
                  </span>
                  <span className="font-black text-nexoraText">${draftSubtotal.toFixed(2)}</span>
                </div>
              ) : null}
            </div>

            {!showPaymentSection ? (
              <div className="flex gap-2">
                {order?.status === PosOrderStatus.Waiting && hasServiceLines ? (
                  <button
                    type="button"
                    onClick={handleStartService}
                    disabled={isBusy || hasUnassignedServiceLine}
                    title={
                      hasUnassignedServiceLine
                        ? t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst')
                        : undefined
                    }
                    className="h-11 flex-1 rounded-lg border border-nexoraBorder text-sm font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
                  >
                    {startOrderService.isPending ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      t('components.dashboard.views.pos.PosOrderWorkspace.startServiceButton')
                    )}
                  </button>
                ) : null}
                {/* Checkout is the next step only once service is under way — a Waiting order's
                    next step is Start Service, and offering both made the order of operations
                    look optional. */}
                {order?.status === PosOrderStatus.InService ? (
                  <button
                    type="button"
                    onClick={handleCheckoutFromUpdate}
                    disabled={isBusy}
                    className="h-11 flex-1 rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')}
                  </button>
                ) : null}
              </div>
            ) : null}

            {showPaymentSection && order ? (
              <>
                <div className="nexora-card space-y-3 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.tipTitle')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCustomerFacingMode(true)}
                      className="rounded-lg border border-nexoraBrand px-2.5 py-1 text-[10px] font-bold text-nexoraBrandDark hover:bg-nexoraBrand hover:text-white"
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.turnToCustomerButton')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                    <button
                      type="button"
                      onClick={() => applyTip('noTip', 0)}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'noTip'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.noTipButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('fixed10', 10)}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'fixed10'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      $10
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('fixed15', 15)}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'fixed15'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      $15
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct10', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct10!))}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'pct10'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct20', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct20!))}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'pct20'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      20%
                    </button>
                    <div className="col-span-3 flex items-center gap-1 sm:col-span-1">
                      <span className="text-xs font-bold text-nexoraMuted">$</span>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={customTipInput}
                        onChange={(e) => setCustomTipInput(e.target.value)}
                        onFocus={() => setTipMode('custom')}
                        onBlur={handleCustomTipCommit}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleCustomTipCommit()
                          }
                        }}
                        placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.customTipPlaceholder')}
                        className={`h-9 w-full rounded-lg border px-2 text-xs text-nexoraText outline-none ${
                          tipMode === 'custom' ? 'border-nexoraBrand' : 'border-nexoraBorder'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {order.staffTipShares.length > 1 ? (
                  <div className="nexora-card space-y-2 p-4">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.tipSplitTitle')}
                    </h3>
                    {order.staffTipShares.map((share) => (
                      <div key={share.posStaffProfileId} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 truncate font-semibold text-nexoraText">{share.technicianName}</span>
                        <span className="text-xs font-bold text-nexoraMuted">$</span>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={tipSplitInputs[share.posStaffProfileId] ?? ''}
                          onChange={(e) =>
                            setTipSplitInputs((prev) => ({ ...prev, [share.posStaffProfileId]: e.target.value }))
                          }
                          className="h-9 w-24 rounded-lg border border-nexoraBorder px-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                        />
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-2">
                      {!isTipSplitBalanced ? (
                        <p className="text-[10px] font-bold text-rose-600">
                          {t('components.dashboard.views.pos.PosOrderWorkspace.tipSplitMismatch', {
                            total: round2(tipSplitTotal).toFixed(2),
                            expected: order.tipAmount.toFixed(2),
                          })}
                        </p>
                      ) : (
                        <span />
                      )}
                      <button
                        type="button"
                        onClick={handleSaveTipSplit}
                        disabled={!isTipSplitBalanced || setStaffTipSplit.isPending}
                        className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.saveTipSplitButton')}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="nexora-card space-y-3 p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.paymentMethodTitle')}
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {PAYMENT_METHODS.map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={`h-9 rounded-lg border text-xs font-bold ${
                          paymentMethod === method
                            ? 'border-nexoraBrand bg-nexoraBrand text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                        }`}
                      >
                        {t(`components.dashboard.views.pos.PosOrderWorkspace.paymentMethod.${method}`)}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.receiptTitle')}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={() => setReceiptChoice('sms')}
                        disabled={!order?.customerPhone}
                        className={`flex h-14 flex-col items-center justify-center gap-0.5 rounded-lg border text-xs font-bold disabled:cursor-not-allowed disabled:opacity-40 ${
                          receiptChoice === 'sms'
                            ? 'border-nexoraBrand bg-nexoraBrand text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                        }`}
                      >
                        <span>{t('components.dashboard.views.pos.PosOrderWorkspace.receiptSendSms')}</span>
                        {order?.customerPhone ? (
                          <span className={`text-[9px] font-normal ${receiptChoice === 'sms' ? 'text-white/80' : 'text-nexoraMuted'}`}>
                            {order.customerPhone}
                          </span>
                        ) : null}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptChoice('none')}
                        className={`h-14 rounded-lg border text-xs font-bold ${
                          receiptChoice === 'none'
                            ? 'border-nexoraBrand bg-nexoraBrand text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                        }`}
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptNone')}
                      </button>
                      <button
                        type="button"
                        disabled
                        title={t('components.dashboard.views.pos.PosOrderWorkspace.receiptPrintComingSoon')}
                        className="h-14 cursor-not-allowed rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraMuted opacity-40"
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptPrint')}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="nexora-card space-y-1 p-4">
                  <h3 className="mb-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.summaryTitle')}
                  </h3>
                  <dl className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryServices')}</dt>
                      <dd className="font-semibold text-nexoraText">${order.servicesSubtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryProducts')}</dt>
                      <dd className="font-semibold text-nexoraText">${order.productsSubtotal.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip')}</dt>
                      <dd className="font-semibold text-nexoraText">${order.tipAmount.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount')}</dt>
                      <dd className="font-semibold text-nexoraText">
                        {order.discountAmount === 0 ? '$0.00' : `-$${Math.abs(order.discountAmount).toFixed(2)}`}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summarySalesTax')}</dt>
                      <dd className="font-semibold text-nexoraText">${order.salesTaxAmount.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-nexoraBorder pt-1.5">
                      <dt className="font-black uppercase text-nexoraText">
                        {t('components.dashboard.views.pos.PosOrderWorkspace.summaryTotal')}
                      </dt>
                      <dd className="font-black text-nexoraText">${order.total.toFixed(2)}</dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={completeOrder.isPending || hasUnassignedServiceLine}
                  title={
                    hasUnassignedServiceLine
                      ? t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst')
                      : undefined
                  }
                  className="h-11 w-full rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {completeOrder.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t('components.dashboard.views.pos.PosOrderWorkspace.completeButton', { amount: order.total.toFixed(2) })
                  )}
                </button>
              </>
            ) : null}
          </div>
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">
          {t('components.dashboard.views.pos.PosOrderWorkspace.titleUpdate', {
            orderNumber: order?.orderNumber ?? '',
            customerName: order?.customerName ?? '',
          })}
        </h1>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 text-sm font-bold text-nexoraText hover:border-nexoraBrand"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('components.dashboard.views.pos.PosOrderWorkspace.backButton')}
          </button>
        ) : null}
      </div>

      {isOrderLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {catalogPanel}
          {orderPanel}
        </div>
      )}

      <ChangeTechnicianModal
        open={technicianTarget !== null}
        serviceName={technicianTarget?.serviceName ?? ''}
        technicians={techniciansForService(technicianTarget?.posServiceId ?? '')}
        isLoading={areTechniciansPending}
        selectedStaffId={technicianTarget?.posStaffProfileId ?? null}
        note={noteDraft}
        onChangeNote={setNoteDraft}
        onSelect={handleSelectTechnician}
        onClose={handleCloseTechnicianModal}
      />

      <ChangeServiceModal
        open={changeServiceTarget !== null}
        serviceName={changeServiceTarget?.serviceName ?? ''}
        services={serviceCatalog}
        onSelect={handleChangeService}
        onClose={() => setChangeServiceTarget(null)}
      />

      {customerFacingMode && order ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-nexoraSurface p-6">
          <div className="flex-1 space-y-6 overflow-y-auto text-center">
            <p className="text-lg font-bold text-nexoraText">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingTitle')}
            </p>
            <p className="text-sm text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingSubtitle')}
            </p>
            <div className="mx-auto grid max-w-md grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => applyTip('noTip', 0)}
                className={`h-20 rounded-2xl border-2 text-lg font-black ${
                  tipMode === 'noTip'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                {t('components.dashboard.views.pos.PosOrderWorkspace.noTipButton')}
              </button>
              <button
                type="button"
                onClick={() => applyTip('fixed10', 10)}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'fixed10'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                $10
              </button>
              <button
                type="button"
                onClick={() => applyTip('fixed15', 15)}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'fixed15'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                $15
              </button>
              <button
                type="button"
                onClick={() => applyTip('pct10', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct10!))}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'pct10'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                10%
              </button>
              <button
                type="button"
                onClick={() => applyTip('pct20', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct20!))}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'pct20'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                20%
              </button>
            </div>
            <div className="mx-auto flex max-w-md items-center gap-2">
              <span className="text-lg font-bold text-nexoraMuted">$</span>
              <input
                type="number"
                min={0}
                step="0.01"
                value={customTipInput}
                onChange={(e) => setCustomTipInput(e.target.value)}
                onFocus={() => setTipMode('custom')}
                onBlur={handleCustomTipCommit}
                placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.customTipPlaceholder')}
                className={`h-14 w-full rounded-2xl border-2 px-4 text-xl text-nexoraText outline-none ${
                  tipMode === 'custom' ? 'border-nexoraBrand' : 'border-nexoraBorder'
                }`}
              />
            </div>
          </div>

          {/* Deliberately no auto-return here (brainstorm decision) — front desk must
              explicitly tap this once they have the iPad back from the customer. */}
          <button
            type="button"
            onClick={() => setCustomerFacingMode(false)}
            className="h-14 w-full shrink-0 rounded-xl border-2 border-nexoraBorder text-base font-bold text-nexoraText"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.backToStaffButton')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
