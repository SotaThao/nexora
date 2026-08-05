// PosOrderWorkspace — POS Merchant Ops: full-page Order Workspace (US-17), replacing the
// old small-modal PosCheckoutModal. Doubles as both Create mode (Check-in step 2, order
// does not exist yet) and Update mode (re-opening an existing order from Order List /
// Waiting List / Turn Board) — one component, no per-mode duplication.
//
// - Create mode: nothing exists on the backend yet, so every add/edit/delete only ever
//   touches local draft state (`lines`). "Check In" (>=1 service line) or "Checkout" (0
//   service lines) sends the whole draft in one bulk CheckInOrderCommand call.
// - Update mode: the order already exists, so every add/edit/delete/Qty-change calls its
//   endpoint immediately (live) — there is no local draft and no separate "Save" button;
//   the row list is always derived directly from the latest `GetOrderDetailQuery` result.
//   The bottom action button is only ever the *next status transition* (Start Service /
//   Checkout) or the final Complete payment.
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Loader2, Package, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../../data/errorCodes'
import {
  useAddOrderProductLine,
  useAddOrderServiceLine,
  useCheckoutProductCatalog,
  useCheckoutServiceCatalog,
  useCompleteOrder,
  useOrderDetail,
  useRemoveOrderProductLine,
  useRemoveOrderServiceLine,
  useSetOrderStaffTipSplit,
  useSetOrderTip,
  useUpdateOrderProductLineQuantity,
} from '../../../../data/hooks/usePosCheckout'
import { useAssignStaffToServiceLine, useCheckInOrder, useStartOrderService } from '../../../../data/hooks/usePosOrders'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import type {
  CheckInOrderItemPayload,
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  CustomerLookupServiceLineApiDto,
  PosCheckoutPaymentMethodType,
} from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CategoryGroupedCatalogPicker from './CategoryGroupedCatalogPicker'
import CustomerHeaderBar from './CustomerHeaderBar'
import PhoneCheckInStep from './PhoneCheckInStep'
import SelectTechniciansModal, { type SelectTechniciansSelection } from './modals/SelectTechniciansModal'

type TipMode = 'fixed10' | 'fixed15' | 'pct18' | 'pct20' | 'custom'
type CatalogTab = 'services' | 'products'

const PAYMENT_METHODS: PosCheckoutPaymentMethodType[] = ['Card', 'Cash', 'GiftCard', 'SplitPay']

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
  businessName,
  orderId,
  onClose,
  onCheckedIn,
  onCompleted,
}: {
  businessId: string
  // Shown on Check-in Step 1's welcome message (PhoneCheckInStep) — omitted falls back to
  // a generic greeting, so callers that don't have it handy (e.g. the Staff dashboard
  // route) don't need to plumb it through just for this.
  businessName?: string
  // null = Create mode (order does not exist yet — customer info is now collected via the
  // 2-step Check-in below: Step 1 phone (PhoneCheckInStep), Step 2 name/email/catalog
  // (CustomerHeaderBar) — not a single continuous form).
  orderId: string | null
  // Update mode only — renders a "Back" button next to the title. Create mode has no use
  // for this: the persistently-mounted Check-in slot is never "closed", only navigated
  // away from via the tab bar, and it already has its own Cancel button in Order Detail.
  onClose?: () => void
  // Create mode, >=1 service line path — order is now Waiting, exit back to the list.
  onCheckedIn?: (newOrderId: string) => void
  onCompleted?: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  // Create mode transitions into "has an order" the moment bulk check-in succeeds on the
  // 0-service (product-only) path, without unmounting/remounting this component.
  const [internalOrderId, setInternalOrderId] = useState<string | null>(null)
  const effectiveOrderId = orderId ?? internalOrderId
  const isCreateMode = effectiveOrderId === null
  // Distinguishes "this mounted instance is the persistently-mounted Check-in tab slot"
  // from "this instance is the ephemeral Update-mode overlay" — unlike isCreateMode (which
  // flips to false mid-flow once internalOrderId is set on the 0-service checkout path),
  // this stays true for this instance's entire lifetime since it's derived from the
  // immutable `orderId` prop. Used to reset the draft back to a blank Step 1 after a
  // successful Check-In/Checkout, since this instance is never unmounted by the parent.
  const isPersistentCreateSlot = orderId === null

  // Check-in Step 1/2 — PO requirement: the phone-entry step must be the same component
  // used later by the (not yet built) customer self-checkin kiosk, so it's a standalone
  // screen (PhoneCheckInStep) shown before the rest of the workspace, not a field inline
  // in CustomerHeaderBar. Only meaningful in Create mode.
  const [checkinStep, setCheckinStep] = useState<'phone' | 'details'>('phone')

  // Phone is mandatory (captured and validated in PhoneCheckInStep before this component
  // ever shows Step 2) — Customer Name is optional (a walk-in may decline to give one).
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')

  const { data: order, isLoading: isOrderLoading } = useOrderDetail(businessId, effectiveOrderId ?? undefined)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const { data: productCatalog = [] } = useCheckoutProductCatalog(businessId)

  const checkInOrder = useCheckInOrder(businessId)
  const addServiceLine = useAddOrderServiceLine(businessId)
  const removeServiceLine = useRemoveOrderServiceLine(businessId)
  const addProductLine = useAddOrderProductLine(businessId)
  const removeProductLine = useRemoveOrderProductLine(businessId)
  const updateProductQuantity = useUpdateOrderProductLineQuantity(businessId)
  const assignStaffToServiceLine = useAssignStaffToServiceLine(businessId)
  const startOrderService = useStartOrderService(businessId)
  const setTip = useSetOrderTip(businessId)
  const setStaffTipSplit = useSetOrderStaffTipSplit(businessId)
  const completeOrder = useCompleteOrder(businessId)

  const [catalogTab, setCatalogTab] = useState<CatalogTab>('services')
  const [draftLines, setDraftLines] = useState<DisplayLine[]>([])
  const [showPaymentSection, setShowPaymentSection] = useState(false)
  const [technicianModal, setTechnicianModal] = useState<{
    posServiceId: string
    serviceName: string
    unitPrice: number
    editingKey?: string
    initialStaffId?: string
    initialNote?: string
  } | null>(null)
  const [tipMode, setTipMode] = useState<TipMode>('fixed15')
  const [customTipInput, setCustomTipInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  // POS iPad redesign, Ticket 6 — "Turn to Customer": front desk flips the iPad around so
  // the customer picks their own tip in private. Deliberately does NOT auto-return after
  // the customer confirms — front desk must explicitly tap "Back to Staff" once they have
  // the device back (brainstorm decision: avoid stray taps landing on the next screen).
  const [customerFacingMode, setCustomerFacingMode] = useState(false)
  // POS iPad redesign, Ticket 6 — receipt delivery is now a single choice (digital-first):
  // Send SMS (using the phone already on file — mandatory since Ticket 2, so always
  // available) or No Receipt. Email option dropped from this screen entirely; physical
  // Print stays as a disabled placeholder button (no printer integration yet).
  const [receiptChoice, setReceiptChoice] = useState<'sms' | 'none'>('sms')
  const [tipSplitInputs, setTipSplitInputs] = useState<Record<string, string>>({})
  const initializedOrderIdRef = useRef<string | null>(null)

  // Only meaningful for the persistent Check-in slot (see isPersistentCreateSlot) — puts
  // it back to a blank Step 1, ready for the next customer. Called after a successful
  // Check-In/Checkout completes this draft's order, and from the Step 2 Cancel button.
  const resetCreateDraft = () => {
    setInternalOrderId(null)
    setCheckinStep('phone')
    setCustomerName('')
    setCustomerPhone('')
    setCustomerEmail('')
    setCatalogTab('services')
    setDraftLines([])
    setShowPaymentSection(false)
    setTechnicianModal(null)
    setTipMode('fixed15')
    setCustomTipInput('')
    setPaymentMethod('Cash')
    setCustomerFacingMode(false)
    setReceiptChoice('sms')
    setTipSplitInputs({})
    initializedOrderIdRef.current = null
  }

  // Update mode has no local draft for the lines themselves — the table is always a live
  // reflection of the latest GetOrderDetailQuery result, since every edit already calls
  // its endpoint immediately (see handlers below).
  const updateModeLines: DisplayLine[] = useMemo(() => {
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

  const visibleLines = isCreateMode ? draftLines : updateModeLines

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
    setReceiptChoice('sms')
    setPaymentMethod('Cash')

    if (order.tipAmount === 0) {
      setTipMode('fixed15')
    } else {
      const subtotal = order.servicesSubtotal
      const pct18 = subtotal > 0 ? round2(subtotal * 0.18) : -1
      const pct20 = subtotal > 0 ? round2(subtotal * 0.2) : -1
      if (order.tipAmount === 10) setTipMode('fixed10')
      else if (order.tipAmount === 15) setTipMode('fixed15')
      else if (order.tipAmount === pct18) setTipMode('pct18')
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
  const draftSubtotal = visibleLines.reduce((sum, l) => sum + lineTotal(l), 0)
  // This is the Check-in screen, so the primary action defaults to "Check In" — including
  // the empty-draft state (the button stays disabled either way until something's added).
  // "Checkout" only replaces it for a product-only draft, where there's no service to wait
  // through and nothing meaningful to check in to Waiting for.
  const isProductOnlyCheckout = !hasServiceLines && visibleLines.length > 0

  const noteLines = visibleLines.filter(
    (l): l is DisplayServiceLine => l.itemType === 'Service' && Boolean(l.note?.trim()),
  )

  const reportError = (err: unknown) => {
    showToast(getErrorMessage(err, t, 'ERROR'), 'error')
  }

  const handleCatalogServiceClick = (service: CheckoutServiceCatalogItemApiDto) => {
    setTechnicianModal({ posServiceId: service.id, serviceName: service.name, unitPrice: service.price })
  }

  const handleCatalogProductClick = (product: CheckoutProductCatalogItemApiDto) => {
    if (isCreateMode) {
      setDraftLines((prev) => {
        const existing = prev.find(
          (l) => l.itemType === 'Product' && l.posProductId === product.id,
        ) as DisplayProductLine | undefined
        if (existing) {
          return prev.map((l) => (l.key === existing.key ? { ...existing, quantity: existing.quantity + 1 } : l))
        }
        const newLine: DisplayProductLine = {
          key: crypto.randomUUID(),
          itemType: 'Product',
          posProductId: product.id,
          productName: product.name,
          unitPrice: product.price,
          quantity: 1,
        }
        return [...prev, newLine]
      })
      return
    }
    if (!effectiveOrderId) return
    // Live — AddOrderProductLineCommand merges Qty server-side if this product already
    // has a line on the order, so no local duplicate-check is needed here.
    addProductLine.mutate(
      { orderId: effectiveOrderId, posProductId: product.id, quantity: 1 },
      { onError: reportError },
    )
  }

  const handleEditServiceLine = (line: DisplayServiceLine) => {
    setTechnicianModal({
      posServiceId: line.posServiceId,
      serviceName: line.serviceName,
      unitPrice: line.unitPrice,
      editingKey: line.existingId ?? line.key,
      initialStaffId: line.posStaffProfileId,
      initialNote: line.note,
    })
  }

  const handleTechnicianConfirm = (selection: SelectTechniciansSelection) => {
    if (!technicianModal) return
    const { editingKey, posServiceId, serviceName, unitPrice } = technicianModal

    if (isCreateMode) {
      setDraftLines((prev) => {
        if (editingKey) {
          return prev.map((l) =>
            l.key === editingKey && l.itemType === 'Service'
              ? { ...l, posStaffProfileId: selection.posStaffProfileId, technicianName: selection.technicianName, note: selection.note }
              : l,
          )
        }
        const newLine: DisplayServiceLine = {
          key: crypto.randomUUID(),
          itemType: 'Service',
          posServiceId,
          serviceName,
          unitPrice,
          posStaffProfileId: selection.posStaffProfileId,
          technicianName: selection.technicianName,
          note: selection.note,
          completedAt: null,
        }
        return [...prev, newLine]
      })
      setTechnicianModal(null)
      return
    }

    if (!effectiveOrderId) {
      setTechnicianModal(null)
      return
    }
    if (editingKey) {
      // editingKey is the real serviceLineId once a line exists server-side (Update mode
      // never carries an un-persisted line — every add already calls the API immediately).
      assignStaffToServiceLine.mutate(
        {
          orderId: effectiveOrderId,
          serviceLineId: editingKey,
          posStaffProfileId: selection.posStaffProfileId,
          note: selection.note,
        },
        { onError: reportError },
      )
    } else {
      addServiceLine.mutate(
        { orderId: effectiveOrderId, posServiceId },
        {
          onSuccess: (newServiceLineId) => {
            assignStaffToServiceLine.mutate(
              {
                orderId: effectiveOrderId,
                serviceLineId: newServiceLineId,
                posStaffProfileId: selection.posStaffProfileId,
                note: selection.note,
              },
              { onError: reportError },
            )
          },
          onError: reportError,
        },
      )
    }
    setTechnicianModal(null)
  }

  const handleDeleteLine = (line: DisplayLine) => {
    if (isCreateMode) {
      setDraftLines((prev) => prev.filter((l) => l.key !== line.key))
      return
    }
    if (!effectiveOrderId || !line.existingId) return
    if (line.itemType === 'Service') {
      removeServiceLine.mutate({ orderId: effectiveOrderId, serviceLineId: line.existingId }, { onError: reportError })
    } else {
      removeProductLine.mutate({ orderId: effectiveOrderId, productLineId: line.existingId }, { onError: reportError })
    }
  }

  // POS iPad redesign — Order Detail stepper replaces the old free-text Qty input (which
  // needed a keyboard draft-then-blur-commit dance). A +/- tap applies immediately since
  // there's no partial/invalid intermediate state to debounce, unlike typed text.
  const applyQuantityDelta = (line: DisplayProductLine, delta: number) => {
    const nextQty = Math.max(1, line.quantity + delta)
    if (nextQty === line.quantity) return

    if (isCreateMode) {
      setDraftLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, quantity: nextQty } : l)))
      return
    }
    if (!effectiveOrderId || !line.existingId) return
    updateProductQuantity.mutate(
      { orderId: effectiveOrderId, productLineId: line.existingId, quantity: nextQty },
      { onError: reportError },
    )
  }

  const buildCheckInItems = (): CheckInOrderItemPayload[] =>
    visibleLines.map((line) =>
      line.itemType === 'Service'
        ? {
            itemType: 'Service',
            id: line.posServiceId,
            posStaffProfileId: line.posStaffProfileId,
            note: line.note,
          }
        : { itemType: 'Product', id: line.posProductId, quantity: line.quantity },
    )

  const buildCustomerDraft = () => ({
    customerName: customerName.trim(),
    customerEmail: customerEmail.trim() || undefined,
    customerPhone: customerPhone.trim(),
  })

  const handleCheckIn = () => {
    checkInOrder.mutate(
      { ...buildCustomerDraft(), items: buildCheckInItems() },
      {
        onSuccess: (newOrderId) => {
          showToast(t('components.dashboard.views.pos.PosOrderWorkspace.checkInSuccess'))
          onCheckedIn?.(newOrderId)
          if (isPersistentCreateSlot) resetCreateDraft()
        },
        onError: reportError,
      },
    )
  }

  // Only ever called for a product-only draft (0 service lines — see the button wiring
  // below), so there's no service to start; go straight to the payment section instead of
  // calling StartOrderService, which now rejects orders with no service lines.
  const handleCheckoutFromCreate = () => {
    checkInOrder.mutate(
      { ...buildCustomerDraft(), items: buildCheckInItems() },
      {
        onSuccess: (newOrderId) => {
          setInternalOrderId(newOrderId)
          setShowPaymentSection(true)
        },
        onError: reportError,
      },
    )
  }

  // "Use last visit" (Ticket 2) — only re-adds lines whose service still exists in
  // today's catalog; a service the salon has since removed is silently skipped rather
  // than adding a line that would fail at Check-in time. Technician is carried over as-is
  // (Next Available/skill-mismatch is re-validated server-side same as any other pick).
  const handleApplyLastVisit = (serviceLines: CustomerLookupServiceLineApiDto[]) => {
    const validLines = serviceLines.filter((line) => serviceCatalog.some((s) => s.id === line.posServiceId))
    if (validLines.length === 0) return
    setDraftLines((prev) => [
      ...prev,
      ...validLines.map((line): DisplayServiceLine => {
        const service = serviceCatalog.find((s) => s.id === line.posServiceId)!
        return {
          key: crypto.randomUUID(),
          itemType: 'Service',
          posServiceId: service.id,
          serviceName: service.name,
          unitPrice: service.price,
          posStaffProfileId: line.posStaffProfileId ?? undefined,
          technicianName: line.technicianName ?? undefined,
          completedAt: null,
        }
      }),
    ])
  }

  const handleStartService = () => {
    if (!effectiveOrderId) return
    startOrderService.mutate(effectiveOrderId, {
      onSuccess: () => showToast(t('components.dashboard.views.pos.PosOrderWorkspace.startServiceSuccess')),
      onError: reportError,
    })
  }

  const handleCheckoutFromUpdate = () => {
    if (!effectiveOrderId) return
    // Only start service first if there's actually a service to serve — a product-only
    // Waiting order has nothing to start (StartOrderService rejects it) and can go straight
    // to payment.
    if (order?.status === PosOrderStatus.Waiting && hasServiceLines) {
      startOrderService.mutate(effectiveOrderId, {
        onSuccess: () => setShowPaymentSection(true),
        onError: reportError,
      })
    } else {
      setShowPaymentSection(true)
    }
  }

  const applyTip = (mode: TipMode, amount: number) => {
    setTipMode(mode)
    if (!effectiveOrderId || amount < 0) return
    setTip.mutate({ orderId: effectiveOrderId, tipAmount: amount }, { onError: reportError })
  }

  const handleCustomTipCommit = () => {
    const parsed = Number(customTipInput)
    if (!Number.isFinite(parsed) || parsed < 0) return
    applyTip('custom', round2(parsed))
  }

  const tipSplitTotal = Object.values(tipSplitInputs).reduce((sum, v) => sum + (Number(v) || 0), 0)
  const isTipSplitBalanced = order ? Math.abs(round2(tipSplitTotal) - order.tipAmount) < 0.01 : false

  const handleSaveTipSplit = () => {
    if (!order || !effectiveOrderId || !isTipSplitBalanced) return
    setStaffTipSplit.mutate(
      {
        orderId: effectiveOrderId,
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
    if (!effectiveOrderId) return
    completeOrder.mutate(
      {
        orderId: effectiveOrderId,
        payload: {
          paymentMethodType: paymentMethod,
          receiptPhone: receiptChoice === 'sms' ? order?.customerPhone ?? undefined : undefined,
        },
      },
      {
        onSuccess: () => {
          showToast(t('components.dashboard.views.pos.PosOrderWorkspace.completeSuccess'))
          onCompleted?.()
          if (isPersistentCreateSlot) resetCreateDraft()
        },
        onError: reportError,
      },
    )
  }

  const isBusy = checkInOrder.isPending || startOrderService.isPending

  return (
    <div className="space-y-4">
      {/* Create mode drops its own heading — the Phone/Name/Email fields (and, on the
          phone step, PhoneCheckInStep's own welcome heading) already show who this order
          is for, so "New Order · New Guest" was pure vertical space with no unique info.
          Update mode keeps its heading since order #/customer name isn't shown anywhere
          else on this screen. */}
      {!isCreateMode ? (
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-base font-semibold leading-tight text-nexoraText">
            {t('components.dashboard.views.pos.PosOrderWorkspace.titleUpdate', {
              orderNumber: order?.orderNumber ?? '',
              customerName: order?.customerName ?? '',
            })}
          </h1>
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              className="flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-posFdBorder px-4 text-sm font-bold text-posFdText hover:border-posFdAccent"
            >
              <ArrowLeft className="h-4 w-4" />
              {t('components.dashboard.views.pos.PosOrderWorkspace.backButton')}
            </button>
          ) : null}
        </div>
      ) : null}

      {isCreateMode && checkinStep === 'phone' ? (
        <PhoneCheckInStep
          businessName={businessName}
          initialDigits={customerPhone}
          onSubmit={(phone) => {
            setCustomerPhone(phone)
            setCheckinStep('details')
          }}
        />
      ) : (
        <>
      {isCreateMode ? (
        <CustomerHeaderBar
          businessId={businessId}
          customerName={customerName}
          customerPhone={customerPhone}
          customerEmail={customerEmail}
          onChangeName={setCustomerName}
          onChangeEmail={setCustomerEmail}
          onChangePhoneNumber={() => setCheckinStep('phone')}
          onApplyLastVisit={handleApplyLastVisit}
        />
      ) : null}

      {!isCreateMode && isOrderLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          <div className="nexora-card space-y-3 p-4 lg:col-span-3">
            <div className="flex gap-1 border-b border-nexoraBorder pb-2">
              <button
                type="button"
                onClick={() => setCatalogTab('services')}
                className={`px-3 py-1.5 text-xs font-bold ${
                  catalogTab === 'services'
                    ? 'border-b-2 border-posFdAccent text-posFdAccent'
                    : 'text-nexoraMuted hover:text-nexoraText'
                }`}
              >
                {t('components.dashboard.views.pos.PosOrderWorkspace.tabServices')}
              </button>
              <button
                type="button"
                onClick={() => setCatalogTab('products')}
                className={`px-3 py-1.5 text-xs font-bold ${
                  catalogTab === 'products'
                    ? 'border-b-2 border-posFdAccent text-posFdAccent'
                    : 'text-nexoraMuted hover:text-nexoraText'
                }`}
              >
                {t('components.dashboard.views.pos.PosOrderWorkspace.tabProducts')}
              </button>
            </div>

            {catalogTab === 'services' ? (
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
            ) : (
              <CategoryGroupedCatalogPicker
                variant="grid"
                items={productCatalog}
                onAdd={(itemId) => {
                  const product = productCatalog.find((p) => p.id === itemId)
                  if (product) handleCatalogProductClick(product)
                }}
                isPending={addProductLine.isPending}
                addLabel={t('components.dashboard.views.pos.PosOrderWorkspace.addButton')}
                emptyLabel={t('components.dashboard.views.pos.PosOrderWorkspace.noProductsInCategory')}
                allCategoryLabel={t('components.dashboard.views.pos.PosOrderWorkspace.allCategories')}
                uncategorizedLabel={t('components.dashboard.views.pos.PosOrderWorkspace.uncategorized')}
                searchPlaceholder={t('components.dashboard.views.pos.PosOrderWorkspace.searchProductsPlaceholder')}
              />
            )}
          </div>

          <div className="space-y-4 lg:col-span-2">
            <div className="space-y-3 rounded-xl border border-posFdBorder bg-posFdSurface p-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-posFdMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
              </h3>

              {visibleLines.length === 0 ? (
                <p className="text-[11px] text-posFdMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}
                </p>
              ) : (
                // Bounded height + internal scroll: a long order scrolls its line items in
                // place, keeping Note/Estimated Total/Start Service/Checkout below always visible.
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {visibleLines.map((line) =>
                    line.itemType === 'Service' ? (
                      <div key={line.key} className="space-y-2 rounded-2xl border border-posFdBorder bg-white p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-posFdLavender/20 text-xs font-bold text-posFdAccentDark">
                            {initials(
                              line.technicianName ?? t('components.dashboard.views.pos.PosOrderWorkspace.nextAvailable'),
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-tight text-posFdText">{line.serviceName}</p>
                            <p className="text-xs leading-tight text-posFdMuted">
                              {line.technicianName ?? t('components.dashboard.views.pos.PosOrderWorkspace.nextAvailable')}
                            </p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-posFdText">
                            ${lineTotal(line).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleEditServiceLine(line)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-posFdMuted hover:bg-posFdCanvas hover:text-posFdAccentDark"
                            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.editLine')}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-posFdMuted hover:bg-posFdDangerBg hover:text-posFdDanger"
                            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.deleteLine')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div key={line.key} className="space-y-2 rounded-2xl border border-posFdBorder bg-white p-3">
                        <div className="flex items-start gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-posFdCanvas text-posFdAccentDark">
                            <Package className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-bold leading-tight text-posFdText">{line.productName}</p>
                            <p className="text-xs leading-tight text-posFdMuted">${line.unitPrice.toFixed(2)} each</p>
                          </div>
                          <span className="shrink-0 text-sm font-bold text-posFdText">
                            ${lineTotal(line).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => applyQuantityDelta(line, -1)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-posFdBorder text-posFdText hover:border-posFdAccent"
                              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.decreaseQty')}
                            >
                              −
                            </button>
                            <span className="w-5 text-center text-sm font-bold text-posFdText">{line.quantity}</span>
                            <button
                              type="button"
                              onClick={() => applyQuantityDelta(line, 1)}
                              className="flex h-9 w-9 items-center justify-center rounded-xl border border-posFdBorder text-posFdText hover:border-posFdAccent"
                              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.increaseQty')}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteLine(line)}
                            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-posFdMuted hover:bg-posFdDangerBg hover:text-posFdDanger"
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
                <div className="rounded-xl bg-posFdCanvas p-3">
                  <h4 className="mb-1 text-[10px] font-black uppercase tracking-wider text-posFdMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.noteTitle')}
                  </h4>
                  <ul className="space-y-0.5 text-[11px] text-posFdText">
                    {noteLines.map((line) => (
                      <li key={line.key}>
                        <span className="font-semibold">{line.serviceName}:</span> {line.note}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {!showPaymentSection ? (
                <div className="flex justify-between border-t border-posFdBorder pt-2 text-xs">
                  <span className="font-black uppercase text-posFdText">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.estimatedTotal')}
                  </span>
                  <span className="font-black text-posFdText">${draftSubtotal.toFixed(2)}</span>
                </div>
              ) : null}
            </div>

            {!isCreateMode && !showPaymentSection ? (
              <div className="flex gap-2">
                {order?.status === PosOrderStatus.Waiting && hasServiceLines ? (
                  <button
                    type="button"
                    onClick={handleStartService}
                    disabled={isBusy}
                    className="h-11 flex-1 rounded-lg border border-posFdBorder text-sm font-bold text-posFdText hover:border-posFdAccent disabled:opacity-60"
                  >
                    {startOrderService.isPending ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      t('components.dashboard.views.pos.PosOrderWorkspace.startServiceButton')
                    )}
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={handleCheckoutFromUpdate}
                  disabled={isBusy}
                  className="h-11 flex-1 rounded-lg bg-posFdAccent text-sm font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
                >
                  {t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')}
                </button>
              </div>
            ) : null}

            {isCreateMode ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetCreateDraft}
                  className="h-11 rounded-lg border border-posFdBorder px-4 text-sm font-bold text-posFdText hover:border-posFdAccent"
                >
                  {t('components.dashboard.views.pos.PosOrderWorkspace.cancelButton')}
                </button>
                <button
                  type="button"
                  onClick={isProductOnlyCheckout ? handleCheckoutFromCreate : handleCheckIn}
                  disabled={isBusy || visibleLines.length === 0}
                  className="h-11 flex-1 rounded-lg bg-posFdAccent text-sm font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
                >
                  {isBusy ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : isProductOnlyCheckout ? (
                    t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')
                  ) : (
                    t('components.dashboard.views.pos.PosOrderWorkspace.checkInButton')
                  )}
                </button>
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
                      className="rounded-lg border border-posFdAccent px-2.5 py-1 text-[10px] font-bold text-posFdAccentDark hover:bg-posFdAccent hover:text-white"
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.turnToCustomerButton')}
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                    <button
                      type="button"
                      onClick={() => applyTip('fixed10', 10)}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'fixed10'
                          ? 'border-posFdAccent bg-posFdAccent text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
                      }`}
                    >
                      $10
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('fixed15', 15)}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'fixed15'
                          ? 'border-posFdAccent bg-posFdAccent text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
                      }`}
                    >
                      $15
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct18', round2(order.servicesSubtotal * 0.18))}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'pct18'
                          ? 'border-posFdAccent bg-posFdAccent text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
                      }`}
                    >
                      18%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct20', round2(order.servicesSubtotal * 0.2))}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'pct20'
                          ? 'border-posFdAccent bg-posFdAccent text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
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
                          tipMode === 'custom' ? 'border-posFdAccent' : 'border-nexoraBorder'
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
                          className="h-9 w-24 rounded-lg border border-nexoraBorder px-2 text-xs text-nexoraText outline-none focus:border-posFdAccent"
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
                        className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-[10px] font-bold text-nexoraText hover:border-posFdAccent disabled:opacity-60"
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
                            ? 'border-posFdAccent bg-posFdAccent text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
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
                            ? 'border-posFdAccent bg-posFdAccent text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
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
                            ? 'border-posFdAccent bg-posFdAccent text-white'
                            : 'border-nexoraBorder text-nexoraText hover:border-posFdAccent'
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
                  disabled={completeOrder.isPending}
                  className="h-11 w-full rounded-lg bg-posFdAccent text-sm font-bold text-white hover:bg-posFdAccentDark disabled:opacity-60"
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
        </div>
      )}
        </>
      )}

      {technicianModal ? (
        <SelectTechniciansModal
          open
          businessId={businessId}
          posServiceId={technicianModal.posServiceId}
          serviceName={technicianModal.serviceName}
          initialStaffId={technicianModal.initialStaffId}
          initialNote={technicianModal.initialNote}
          onConfirm={handleTechnicianConfirm}
          onClose={() => setTechnicianModal(null)}
        />
      ) : null}

      {customerFacingMode && order ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-posFdSurface p-6">
          <div className="flex-1 space-y-6 overflow-y-auto text-center">
            <p className="text-lg font-bold text-posFdText">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingTitle')}
            </p>
            <p className="text-sm text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingSubtitle')}
            </p>
            <div className="mx-auto grid max-w-md grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => applyTip('fixed10', 10)}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'fixed10'
                    ? 'border-posFdAccent bg-posFdAccent text-white'
                    : 'border-posFdBorder text-posFdText'
                }`}
              >
                $10
              </button>
              <button
                type="button"
                onClick={() => applyTip('fixed15', 15)}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'fixed15'
                    ? 'border-posFdAccent bg-posFdAccent text-white'
                    : 'border-posFdBorder text-posFdText'
                }`}
              >
                $15
              </button>
              <button
                type="button"
                onClick={() => applyTip('pct18', round2(order.servicesSubtotal * 0.18))}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'pct18'
                    ? 'border-posFdAccent bg-posFdAccent text-white'
                    : 'border-posFdBorder text-posFdText'
                }`}
              >
                18%
              </button>
              <button
                type="button"
                onClick={() => applyTip('pct20', round2(order.servicesSubtotal * 0.2))}
                className={`h-20 rounded-2xl border-2 text-2xl font-black ${
                  tipMode === 'pct20'
                    ? 'border-posFdAccent bg-posFdAccent text-white'
                    : 'border-posFdBorder text-posFdText'
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
                className={`h-14 w-full rounded-2xl border-2 px-4 text-xl text-posFdText outline-none ${
                  tipMode === 'custom' ? 'border-posFdAccent' : 'border-posFdBorder'
                }`}
              />
            </div>
          </div>

          {/* Deliberately no auto-return here (brainstorm decision) — front desk must
              explicitly tap this once they have the iPad back from the customer. */}
          <button
            type="button"
            onClick={() => setCustomerFacingMode(false)}
            className="h-14 w-full shrink-0 rounded-xl border-2 border-posFdBorder text-base font-bold text-posFdText"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.backToStaffButton')}
          </button>
        </div>
      ) : null}
    </div>
  )
}
