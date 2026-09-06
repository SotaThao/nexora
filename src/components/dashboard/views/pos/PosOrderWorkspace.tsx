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
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Loader2, Package, X, Printer, ClipboardCheck } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../../data/errorCodes'
import {
  useAddOrderCustomServiceLine,
  useAddOrderServiceLine,
  useCheckoutServiceCatalog,
  useCompleteOrder,
  useOrderDetail,
  useRemoveOrderProductLine,
  useRemoveOrderServiceLine,
  useAddOrderServiceAddOnLine,
  useRemoveOrderServiceAddOnLine,
  useServiceLineAddOnOptions,
  useSetOrderServiceLineDiscount,
  useUpdateOrderServiceLine,
  useEligiblePromotions,
  useSetOrderDiscount,
  useSetOrderNote,
  useSetOrderStaffTipSplit,
  useSetOrderTip,
  useUpdateOrderProductLineQuantity,
} from '../../../../data/hooks/usePosCheckout'
import {
  useAssignStaffToServiceLine,
  useMarkServiceLineDone,
  useStartOrderService,
  useStartServiceLine,
} from '../../../../data/hooks/usePosOrders'
import { useOrderSettings } from '../../../../data/hooks/usePosOrderSettings'
import ServiceLineMismatchWarningModal, {
  type ServiceLineMismatchKind,
} from './modals/ServiceLineMismatchWarningModal'
import { useCheckInTechnicians } from '../../../../data/hooks/usePosCheckIn'
import { usePosNextTurnBalance } from '../../../../data/hooks/usePosNextTurnBalance'
import { useTimeClockRoster } from '../../../../data/hooks/usePosTimeClock'
import { usePublicBusinessPaymentMethods } from '../../../../data/hooks/usePublicTouch'
import { SHOW_SERVICE_ADD_ONS } from '../../../../constants/posFeatureVisibility'
import { PosOrderStatus } from '../../../../constants/posOrderStatus'
import {
  PosOrderItemStatus,
  isLineAtOrPast,
  posOrderItemStatusLabelKey,
} from '../../../../constants/posOrderItemStatus'
import { isLineBusySurface, TicketBusySurface } from '../../../../constants/posTicketAction'
import {
  formatUsdAmount,
  formatUsdInputAmount,
  parseDirectPaymentAmountInput,
  sanitizeDirectPaymentAmountInput,
} from '../../../../utils/currencyInput'
import { isPersistedLineId } from '../../../../utils/uuid'
import type {
  CheckoutServiceCatalogItemApiDto,
  OrderServiceAddOnLineApiDto,
  PosCheckoutPaymentMethodType,
  SetOrderServiceLineDiscountPayload,
  ServiceLineAddOnOptionApiDto,
  SetOrderDiscountPayload,
  CompleteOrderResultApiDto,
} from '../../../../types/repositories'
import { Skeleton, SkeletonList, SkeletonListItem } from '../../../ui/skeleton'
import { formatCustomerPhone } from './customer/customerFormatters'
import CategoryGroupedCatalogPicker from './CategoryGroupedCatalogPicker'
import TicketActionSkeletonOverlay, { TICKET_SKELETON_ROW_COUNT } from './TicketActionSkeletonOverlay'
import ChangeServiceModal from './modals/ChangeServiceModal'
import CustomServiceModal from './modals/CustomServiceModal'
import type { CustomServiceSubmit, CustomServiceTarget } from './modals/CustomServiceModal'
import ServiceAddOnPickerModal from './modals/ServiceAddOnPickerModal'
import OrderDiscountSection from './OrderDiscountSection'
import ServiceDiscountModal, {
  type ServiceDiscountSubmit,
  type ServiceDiscountTarget,
} from './modals/ServiceDiscountModal'
import ChangeTechnicianModal from './modals/ChangeTechnicianModal'
import { formatPosDateTime } from './posDateTime'
import { useTicketActionLock } from './useTicketActionLock'
import PosPaymentMethodSelector from './PosPaymentMethodSelector'
import {
  getPosCheckoutPaymentMethodLabel,
  PosCheckoutPaymentMethod,
} from '../../../../constants/posCheckoutPaymentMethod'
import PosCashPaymentPanel, { isCashPaymentCovered } from './PosCashPaymentPanel'
import PosReceivePaymentPanel from './PosReceivePaymentPanel'
import PosRemoveConfirmAction from './PosRemoveConfirmAction'
import PosCheckoutSuccessView, { type PosCheckoutReceiptItem } from './PosCheckoutSuccessView'
import PosReceiptPrintPreview from './PosReceiptPrintPreview'
import { buildPosTicketDocument } from './receipt/posTicketDocument'
import PosTicketPrintPreview, { type PosTicketPrintGroup } from './PosTicketPrintPreview'
import { buildPosReceiptDocument, resolveReceiptCopies } from './receipt/posReceiptDocument'
import {
  resolveProductsGroupLabel,
  resolvePosReceiptLabels,
  resolvePosReceiptTotalsLabels,
  resolveUnassignedTechnicianLabel,
} from './receipt/posReceiptLabels'
import { usePosReceiptPrint } from './receipt/usePosReceiptPrint'
import type { PosReceiptDocument } from '../../../../types/domain'
import { PosFrontDeskTab } from '../../../../constants/posFrontDesk'
import { DASHBOARD_MENU_ID } from '../../constants'
import { DEFAULT_POS_RECEIPT_SETTINGS, PosPrintTransport } from '../../../../constants/posPrinter'
import { usePosReceiptSettings } from '../../../../data/hooks/usePosPrinterSettings'
import { getLocalDayWindow } from './timeclock/timeClockDay'
import { selectNextTurnTechnician } from './posNextTurn'
import type { PosReceiptMode } from './posWorkspaceUrl'
import { todayIso as reportTodayIso } from './report/posReportPeriod'

type TipMode = 'noTip' | 'fixed10' | 'fixed15' | 'pct10' | 'pct20' | 'custom'
export type PosOrderWorkspaceMode = 'edit' | 'checkout' | 'success'

// Percentage-based tip modes are a live % of servicesSubtotal, not a one-time snapshot —
// see the tip-percentage recompute effect below, which re-applies this whenever the
// subtotal changes (e.g. a service gets added/removed) so Payment Summary never shows a
// tip that was only correct for a subtotal that no longer exists.
const TIP_PERCENT_BY_MODE: Partial<Record<TipMode, number>> = {
  pct10: 0.1,
  pct20: 0.2,
}

const CORE_CHECKOUT_PAYMENT_METHODS = new Set<PosCheckoutPaymentMethodType>([
  PosCheckoutPaymentMethod.Cash,
  PosCheckoutPaymentMethod.Card,
  PosCheckoutPaymentMethod.GiftCard,
  PosCheckoutPaymentMethod.SplitPay,
])

// Keep the existing change-service flow available from Ticket Detail.
const SHOW_CHANGE_SERVICE_ACTION = true

function round2(value: number) {
  return Math.round(value * 100) / 100
}

function formatCompactUsdAmount(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatEnteredDiscountValue(
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  discountAmount: number,
) {
  if (discountType === 'Percent' && discountValue != null) return `${discountValue}%`
  return formatCompactUsdAmount(discountValue ?? discountAmount)
}

function formatDiscountPriceBadge(
  discountType: string | null | undefined,
  discountValue: number | null | undefined,
  discountAmount: number,
) {
  return `(-${formatEnteredDiscountValue(discountType, discountValue, discountAmount)})`
}

// Badge palette per line status. Unassigned is deliberately the loudest of the "not done" states:
// it is the only one the front desk must act on before the ticket can be paid.
const LINE_STATUS_BADGE_CLASS: Record<string, string> = {
  [PosOrderItemStatus.Unassigned]: 'bg-rose-100 text-rose-700',
  [PosOrderItemStatus.PendingAcceptance]: 'bg-amber-100 text-amber-700',
  [PosOrderItemStatus.Assigned]: 'bg-sky-100 text-sky-700',
  [PosOrderItemStatus.Started]: 'bg-indigo-100 text-indigo-700',
  [PosOrderItemStatus.Completed]: 'bg-emerald-100 text-emerald-700',
}

type LineStatusActionKind = 'start' | 'complete'

interface DisplayServiceLine {
  key: string
  // Set for a line that already exists server-side (always set in Update mode, never set
  // for a not-yet-checked-in Create-mode draft line).
  existingId?: string
  itemType: 'Service'
  // Null on a custom (off-menu) line: no catalog service backs it, so nothing qualifies a
  // technician against it and it can never own an add-on.
  posServiceId: string | null
  serviceName: string
  unitPrice: number
  posStaffProfileId?: string
  technicianName?: string
  note?: string
  // See PosOrderItemStatus. Only a parent service line carries one; add-ons follow this line.
  lineStatus: string
  startedAt?: string | null
  completedAt?: string | null
  // Discount stays alongside the original price rather than replacing it: unitPrice/lineTotal are
  // what commission and the tip split are measured on, discountAmount is what the customer saves.
  discountType?: string | null
  discountValue?: number | null
  discountAmount: number
  discountBearer?: string | null
  staffDiscountShare: number
  discountNote?: string | null
  canAssignDiscountToStaff: boolean
  // Extras sold against this service. Rendered nested under it and never as their own ticket row:
  // an add-on has no technician of its own and cannot exist without this line.
  addOns: OrderServiceAddOnLineApiDto[]
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

// What the customer is charged for the line — the only figure that belongs in a total.
function lineTotalAfterDiscount(line: DisplayLine): number {
  return line.itemType === 'Service' ? line.unitPrice - line.discountAmount : line.unitPrice * line.quantity
}

// Who a service added to an open ticket goes to, before anyone picks. One rule for both the menu
// and the off-menu path: a ticket with exactly one technician on it is unambiguous, so the new line
// joins them; anything else is a guess. It used to assign the first of several technicians —
// skipping the qualification check entirely, since `length > 1` short-circuited it — which handed
// commission to whoever happened to be first on the ticket unless the front desk noticed.
function resolveNewLineTechnicianAssignment(
  assignedTechnicianIds: string[],
  canPerform: (staffId: string) => boolean,
): string | null {
  if (assignedTechnicianIds.length !== 1) return null
  const soleAssignedId = assignedTechnicianIds[0]
  return canPerform(soleAssignedId) ? soleAssignedId : null
}

function lineTechnicianDisplay(
  line: DisplayServiceLine,
  pendingTechnician: { lineId: string; displayName: string | null } | null,
) {
  const displayedName =
    pendingTechnician?.lineId === line.existingId ? pendingTechnician.displayName : line.technicianName
  return {
    isFirstAvailable: !displayedName,
    technicianName: displayedName,
  }
}

// Add-ons are charged on top of their service, so the ticket total has to pick them up here —
// they are not rows of their own in visibleLines.
function addOnsTotalAfterDiscount(line: DisplayLine): number {
  if (line.itemType !== 'Service') return 0
  return line.addOns.reduce((sum, addOn) => sum + addOn.lineTotalAfterDiscount, 0)
}

/** Where a PassPRNT callback comes back to. Query-free by design — see passprntTransport. */
const POS_FRONT_DESK_ROUTE_PATH = `/dashboard/${DASHBOARD_MENU_ID.pos}`

export default function PosOrderWorkspace({
  businessId,
  orderId,
  mode = 'edit',
  successReceiptMode,
  onClose,
  onCompleted,
  onPaymentCompleted,
  businessName,
  businessLogoUrl,
  businessAddress,
  businessPhone,
  businessTimeZone,
  canViewReport = false,
  receiptPrintTab = PosFrontDeskTab.CheckoutCustomer,
  printFallbackOrderId = null,
  onPrintFallbackHandled,
}: {
  businessId: string
  orderId: string
  // Edit is operational order maintenance. Checkout is the only entry mode that reveals
  // tip, payment method, receipt and payment summary immediately.
  mode?: PosOrderWorkspaceMode
  successReceiptMode?: PosReceiptMode
  // Renders a "Back" button next to the title.
  onClose?: () => void
  onCompleted?: () => void
  onPaymentCompleted?: (orderId: string, receiptMode: PosReceiptMode) => void
  businessName?: string
  businessLogoUrl?: string | null
  businessAddress?: string
  businessPhone?: string
  businessTimeZone?: string
  canViewReport?: boolean
  // Which Front Desk tab to return to after a PassPRNT round trip. Printing leaves the app, so
  // the callback lands on a fresh mount and has to be told where the operator was.
  receiptPrintTab?: string
  // Order whose PassPRNT print just failed. The preview opens on it so the operator can fall
  // back to the browser dialog without going anywhere.
  printFallbackOrderId?: string | null
  onPrintFallbackHandled?: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  // Device-local receipt options (what to print, how many copies). Read here rather than at
  // print time so the document is already shaped correctly for the preview the operator sees.
  const { data: receiptSettings } = usePosReceiptSettings()
  const { print: printReceipt, printSurface, isPrinting: isReceiptPrinting, transport: printTransport } = usePosReceiptPrint()
  // Set in the completion callback, acted on one commit later — see the effect below.
  const [autoPrintIntent, setAutoPrintIntent] = useState<{
    orderId: string
    copies: number
    doc: PosReceiptDocument
  } | null>(null)
  const autoPrintedOrderIdRef = useRef<string | null>(null)
  const { showToast } = useNotification()

  const { data: order, isLoading: isOrderLoading } = useOrderDetail(businessId, orderId)
  const isPaid = order?.status === PosOrderStatus.Completed || Boolean(order?.completedAt)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const {
    data: receivePaymentMethods = [],
    isLoading: areReceivePaymentMethodsLoading,
  } = usePublicBusinessPaymentMethods(businessId)
  // One query for every technician plus the services each can perform, rather than the drawer's
  // per-service query: with the picker inline, several lines can ask the same question at once.
  // Same population either way — both endpoints require an Active staff link and an Active POS
  // profile, and both mark busy from an InService line.
  const {
    data: allTechnicians = [],
    isPending: areTechniciansPending,
    isFetching: areTechniciansFetching,
  } = useCheckInTechnicians(businessId)

  const addServiceLine = useAddOrderServiceLine(businessId)
  const addCustomServiceLine = useAddOrderCustomServiceLine(businessId)
  const removeServiceLine = useRemoveOrderServiceLine(businessId)
  const updateServiceLine = useUpdateOrderServiceLine(businessId)
  const removeProductLine = useRemoveOrderProductLine(businessId)
  const updateProductQuantity = useUpdateOrderProductLineQuantity(businessId)
  const assignStaffToServiceLine = useAssignStaffToServiceLine(businessId)
  const setServiceLineDiscount = useSetOrderServiceLineDiscount(businessId)
  const addServiceAddOnLine = useAddOrderServiceAddOnLine(businessId)
  const removeServiceAddOnLine = useRemoveOrderServiceAddOnLine(businessId)
  const startOrderService = useStartOrderService(businessId)
  const startServiceLine = useStartServiceLine(businessId)
  const markServiceLineDone = useMarkServiceLineDone(businessId)
  const orderSettings = useOrderSettings(businessId)
  const setOrderDiscount = useSetOrderDiscount(businessId)
  const setTip = useSetOrderTip(businessId)
  const setNote = useSetOrderNote(businessId)
  const setStaffTipSplit = useSetOrderStaffTipSplit(businessId)
  const completeOrder = useCompleteOrder(businessId)

  // Sync lock so a second tap in the same tick cannot queue another call. Mutation
  // `isPending` is the visual source of truth; the ref covers the gap before React
  // re-renders and the add-then-assign chain where one mutation ends before the next starts.
  const isMutationPending =
    addServiceLine.isPending ||
    addCustomServiceLine.isPending ||
    removeServiceLine.isPending ||
    updateServiceLine.isPending ||
    removeProductLine.isPending ||
    updateProductQuantity.isPending ||
    assignStaffToServiceLine.isPending ||
    setServiceLineDiscount.isPending ||
    startOrderService.isPending ||
    startServiceLine.isPending ||
    markServiceLineDone.isPending ||
    setTip.isPending ||
    setStaffTipSplit.isPending ||
    completeOrder.isPending
  const { busySurface, isBusy, startTicketAction, endTicketAction } = useTicketActionLock(isMutationPending)
  const isAddingLine =
    busySurface === TicketBusySurface.AddLine || addServiceLine.isPending || addCustomServiceLine.isPending
  // Same window as the service catalog pending state: one placeholder row until add (and
  // the follow-up assign) both settle. The just-inserted line stays hidden so it cannot
  // appear while the catalog is still locked.
  const showAddLinePlaceholder = isAddingLine
  const isLineBusy =
    isLineBusySurface(busySurface) ||
    removeServiceLine.isPending ||
    updateServiceLine.isPending ||
    removeProductLine.isPending ||
    updateProductQuantity.isPending ||
    setServiceLineDiscount.isPending
  const isTipBusy = busySurface === TicketBusySurface.Tip || setTip.isPending || setStaffTipSplit.isPending
  const isCompleteBusy = busySurface === TicketBusySurface.Complete || completeOrder.isPending

  const [showPaymentSection, setShowPaymentSection] = useState(false)

  // Eligibility is decided by the visit's check-in time, so this list cannot change while the
  // operator works — fetched once the payment section is on screen and then left alone.
  const { data: eligiblePromotions = [] } = useEligiblePromotions(businessId, orderId, showPaymentSection)
  // The line whose technician is being picked. Carries the values the popup needs to open and the
  // ones the save has to send back unchanged, so it never reaches into the list again.
  const [technicianTarget, setTechnicianTarget] = useState<{
    serviceLineId: string
    serviceName: string
    posServiceId: string | null
    posStaffProfileId?: string
    note?: string
  } | null>(null)
  const technicianTurnWindow = getLocalDayWindow()
  const technicianTurnRosterQuery = useTimeClockRoster(businessId, technicianTurnWindow, {
    enabled: technicianTarget !== null,
    refetchInterval: 15000,
  })
  const technicianNextTurnBalanceQuery = usePosNextTurnBalance(
    businessId,
    reportTodayIso(businessTimeZone || 'America/Chicago'),
    businessTimeZone,
    technicianTarget !== null && canViewReport,
  )
  const [noteDraft, setNoteDraft] = useState('')
  // Chosen technician shown immediately so the row never flashes the previous name while
  // AssignStaffToServiceLine and the order-detail refetch catch up.
  const [pendingTechnician, setPendingTechnician] = useState<{
    lineId: string
    staffId: string | null
    displayName: string | null
  } | null>(null)
  // The line whose service is being swapped. Held as id + name so the popup can title itself
  // without reaching back into the list.
  const [changeServiceTarget, setChangeServiceTarget] = useState<{
    serviceLineId: string
    serviceName: string
    posServiceId: string | null
    // Swapping the service removes its add-ons server-side (they belong to one service only), so
    // the count travels with the target and the popup warns before anything is lost.
    addOnCount: number
  } | null>(null)
  // Open when a custom (off-menu) service is being added (no serviceLineId) or corrected.
  const [customServiceTarget, setCustomServiceTarget] = useState<CustomServiceTarget | null>(null)
  // The line whose "+ Add-On" picker is open. Held as id + name so the picker can title itself and
  // scope its own query without reaching back into the list.
  const [addOnTarget, setAddOnTarget] = useState<{ serviceLineId: string; serviceName: string } | null>(null)
  // The line whose discount is being edited. Carries the figures the popup previews with, so it
  // never has to reach back into the list while the order refetches underneath it.
  const [discountTarget, setDiscountTarget] = useState<ServiceDiscountTarget | null>(null)
  const [tipMode, setTipMode] = useState<TipMode>('noTip')
  const [customTipInput, setCustomTipInput] = useState('')
  const [noteInput, setNoteInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  const [cashReceived, setCashReceived] = useState('')
  const cashReceivedWasEditedRef = useRef(false)
  const [completedPayment, setCompletedPayment] = useState<CompleteOrderResultApiDto | null>(null)
  // POS iPad redesign, Ticket 6 — "Turn to Customer": front desk flips the iPad around so
  // the customer picks their own tip in private. Deliberately does NOT auto-return after
  // the customer confirms — front desk must explicitly tap "Back to Staff" once they have
  // the device back (brainstorm decision: avoid stray taps landing on the next screen).
  const [customerFacingMode, setCustomerFacingMode] = useState(false)
  // POS iPad redesign, Ticket 6 — receipt delivery is a single choice: Send SMS (using the phone
  // already on file — mandatory since Ticket 2), Print, or No Receipt. Email is intentionally
  // omitted; Print Preview remains a separate action so previewing never changes the selection.
  //
  // Defaults to No Receipt: a receipt costs an SMS and most walk-ins do not ask for one, so it is
  // opted into per checkout rather than sent unless someone remembers to turn it off.
  const [receiptChoice, setReceiptChoice] = useState<PosReceiptMode>('none')
  const [printPreviewOpen, setPrintPreviewOpen] = useState(false)
  const [ticketPreviewOpen, setTicketPreviewOpen] = useState(false)
  const [ticketBrowserFallback, setTicketBrowserFallback] = useState(false)
  useEffect(() => setTicketBrowserFallback(false), [orderId])
  const [tipSplitInputs, setTipSplitInputs] = useState<Record<string, string>>({})
  const initializedWorkspaceRef = useRef<string | null>(null)
  const initializedOrderIdRef = useRef<string | null>(null)
  const printCleanupRef = useRef<(() => void) | null>(null)
  const serviceLineIdsBeforeAddRef = useRef<Set<string> | null>(null)

  useEffect(() => {
    return () => {
      printCleanupRef.current?.()
    }
  }, [])

  // No local draft for the lines — the table is always a live reflection of the latest
  // GetOrderDetailQuery result, since every edit already calls its endpoint immediately
  // (see handlers below).
  const visibleLines: DisplayLine[] = useMemo(() => {
    if (!order) return []
    const idsBeforeAdd = serviceLineIdsBeforeAddRef.current
    const hideInFlightAdd = showAddLinePlaceholder && idsBeforeAdd !== null
    return [
      ...order.serviceLines
        .filter((l) => isPersistedLineId(l.id) && (!hideInFlightAdd || idsBeforeAdd.has(l.id)))
        .map((l): DisplayServiceLine => ({
          key: l.id,
          existingId: l.id,
          itemType: 'Service',
          posServiceId: l.posServiceId,
          serviceName: l.serviceName,
          unitPrice: l.unitPrice,
          posStaffProfileId: l.assignedPosStaffProfileId ?? undefined,
          technicianName: l.technicianName ?? undefined,
          note: l.note ?? undefined,
          lineStatus: l.lineStatus,
          startedAt: l.startedAt,
          completedAt: l.completedAt,
          discountType: l.discountType,
          discountValue: l.discountValue,
          discountAmount: l.discountAmount,
          discountBearer: l.discountBearer,
          staffDiscountShare: l.staffDiscountShare,
          discountNote: l.discountNote,
          canAssignDiscountToStaff: l.canAssignDiscountToStaff,
          addOns: l.addOns ?? [],
        })),
      ...order.productLines.filter((l) => isPersistedLineId(l.id)).map((l): DisplayProductLine => ({
        key: l.id,
        existingId: l.id,
        itemType: 'Product',
        posProductId: '',
        productName: l.productName,
        unitPrice: l.unitPrice,
        quantity: l.quantity,
      })),
    ]
  }, [order, showAddLinePlaceholder])

  // Preserve service-line order while deduplicating staff. Exactly one entry means the ticket has
  // one technician on it, which is the only case a new line can be assigned from (see
  // resolveNewLineTechnicianAssignment).
  const assignedTechnicianIds = useMemo(() => {
    const uniqueIds = new Set(
      visibleLines
        .filter((line): line is DisplayServiceLine => line.itemType === 'Service')
        .map((line) => line.posStaffProfileId)
        .filter((id): id is string => Boolean(id)),
    )
    return [...uniqueIds]
  }, [visibleLines])
  // Pre-selection for the custom-service form. Read off the ticket, not the roster, so the form can
  // open before that query lands — an off-menu service has no skill list to check anyone against.
  const soleTicketTechnician = useMemo(() => {
    if (assignedTechnicianIds.length !== 1) return null
    const posStaffProfileId = assignedTechnicianIds[0]
    const line = visibleLines.find(
      (l): l is DisplayServiceLine => l.itemType === 'Service' && l.posStaffProfileId === posStaffProfileId,
    )
    return { posStaffProfileId, technicianName: line?.technicianName ?? null }
  }, [assignedTechnicianIds, visibleLines])
  const isTechnicianRosterLoading = areTechniciansPending || areTechniciansFetching
  // Ticket Detail placeholder and catalog pending share `isAddingLine` so one panel cannot
  // finish while the other is still locked. Initial sole-technician skill load uses pending
  // (empty roster), not background refetch, to avoid greying the catalog after the ticket is idle.
  const isServiceCatalogPending =
    isAddingLine || (assignedTechnicianIds.length === 1 && areTechniciansPending && allTechnicians.length === 0)

  useEffect(() => {
    if (!pendingTechnician || !order) return
    const line = order.serviceLines.find((serviceLine) => serviceLine.id === pendingTechnician.lineId)
    if (!line) return
    if ((line.assignedPosStaffProfileId ?? null) === pendingTechnician.staffId) {
      setPendingTechnician(null)
    }
  }, [order, pendingTechnician])

  useEffect(() => {
    if (!isAddingLine) serviceLineIdsBeforeAddRef.current = null
  }, [isAddingLine])

  // Initializes local UI-only state (tip mode, receipt fields, payment-section visibility)
  // from the server exactly once per order id — later refetches (from this cashier's own
  // live edits or another tab) must not reset what the user is currently doing with tip/
  // payment-method inputs mid-checkout.
  useEffect(() => {
    if (!order) return
    const workspaceKey = `${order.id}:${mode}`
    if (initializedWorkspaceRef.current === workspaceKey) return
    initializedWorkspaceRef.current = workspaceKey

    // Status never reveals checkout information by itself. An InService order reached through
    // Edit still opens as an operational ticket; only an explicit Checkout entry reveals payment.
    setShowPaymentSection(mode === 'checkout' && !isPaid)
    setNoteInput(order.note ?? '')
    if (mode !== 'success') {
      setReceiptChoice('none')
      setPaymentMethod('Cash')
      cashReceivedWasEditedRef.current = false
      setCashReceived(formatUsdInputAmount(order.total))
      setCompletedPayment(null)
    }

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
      setCustomTipInput(formatUsdInputAmount(order.tipAmount))
    }
  }, [order, mode, isPaid])

  // Keep the default equal to the live total while tip/discount edits are still changing it.
  // Once the cashier types a received amount, that physical cash value belongs to them and must
  // not be overwritten by a later order refetch.
  useEffect(() => {
    if (!order || paymentMethod !== PosCheckoutPaymentMethod.Cash || cashReceivedWasEditedRef.current) return
    setCashReceived(formatUsdInputAmount(order.total))
  }, [order?.total, paymentMethod])

  useEffect(() => {
    if (!order) return
    setTipSplitInputs(
      Object.fromEntries(
        order.staffTipShares.map((share) => [
          share.posStaffProfileId,
          formatUsdInputAmount(share.tipAmount),
        ]),
      ),
    )
  }, [order])

  const hasServiceLines = visibleLines.some((l) => l.itemType === 'Service')
  const serviceLineCount = visibleLines.filter((line) => line.itemType === 'Service').length
  // "First available" leaves a line unassigned on purpose — a person on the floor decides who
  // takes it. CompleteOrder refuses that state, so every completion path guards it before the API;
  // QR's Mark as received stays clickable and explains what the operator must fix.
  const hasUnassignedServiceLine = visibleLines.some(
    (l) => l.itemType === 'Service' && !l.posStaffProfileId,
  )
  // Removing every line leaves the ticket in InService, so the server refuses to complete it.
  // Mirrored here so an emptied ticket cannot be checked out by tapping through.
  const hasNoLines = visibleLines.length === 0
  const selectedReceivePaymentMethod = receivePaymentMethods.find(
    (method) => method.isActive && method.isConfigured && method.type === paymentMethod,
  )
  const isCorePaymentMethod = CORE_CHECKOUT_PAYMENT_METHODS.has(paymentMethod)
  const isPaymentMethodEligible = isCorePaymentMethod || Boolean(selectedReceivePaymentMethod)
  const cashPaymentCovered = paymentMethod !== PosCheckoutPaymentMethod.Cash
    || (order ? isCashPaymentCovered(cashReceived, order.total) : false)
  const draftSubtotal = visibleLines.reduce(
    (sum, l) => sum + lineTotalAfterDiscount(l) + addOnsTotalAfterDiscount(l),
    0,
  )

  // AssignStaffToServiceLine only accepts a Waiting or InService order, so a closed ticket shows
  // its technicians as text instead of offering a picker every tap of which would fail.
  const canEditLines =
    order?.status === PosOrderStatus.Waiting || order?.status === PosOrderStatus.InService

  useEffect(() => {
    if (areReceivePaymentMethodsLoading || isCorePaymentMethod || selectedReceivePaymentMethod) return
    setPaymentMethod(PosCheckoutPaymentMethod.Cash)
  }, [areReceivePaymentMethodsLoading, isCorePaymentMethod, selectedReceivePaymentMethod])

  // Catalog services only offer qualified technicians. A custom service has no catalog skill to
  // match, so every active technician is eligible; both paths still use today's fair-turn order.
  const techniciansForService = (posServiceId: string | null) => {
    const eligibleTechnicians = allTechnicians
      .filter((tech) => posServiceId === null || tech.serviceIds.includes(posServiceId))
      .slice()
      .sort((a, b) => a.displayName.localeCompare(b.displayName))
    const eligibleTechnicianIds = new Set(
      eligibleTechnicians.map((technician) => technician.posStaffProfileId),
    )
    const rosterRows = technicianTurnRosterQuery.data?.rows ?? []
    const turnsByTechnicianId = new Map(
      rosterRows.map((row) => [row.posStaffProfileId, row.turnsToday]),
    )
    const serviceAmountsByTechnicianId = technicianNextTurnBalanceQuery.data?.completedAmounts ?? new Map<string, number>()
    const nextTurnTechnician = technicianNextTurnBalanceQuery.data
      && !technicianNextTurnBalanceQuery.isFetching && !technicianNextTurnBalanceQuery.isError
      ? selectNextTurnTechnician(
          rosterRows,
          eligibleTechnicianIds,
          serviceAmountsByTechnicianId,
          technicianNextTurnBalanceQuery.data,
        )
      : undefined

    return eligibleTechnicians.map((technician) => ({
      ...technician,
      turnsToday: turnsByTechnicianId.get(technician.posStaffProfileId),
      isNextTurn: technician.posStaffProfileId === nextTurnTechnician?.posStaffProfileId,
    }))
  }

  const noteLines = visibleLines.filter(
    (l): l is DisplayServiceLine => l.itemType === 'Service' && Boolean(l.note?.trim()),
  )

  const reportError = (err: unknown) => {
    showToast(getErrorMessage(err, t, 'ERROR'), 'error')
  }

  // Keep an existing ticket with an already assigned technician when services are added.
  const handleCatalogServiceClick = (service: CheckoutServiceCatalogItemApiDto) => {
    // Qualification must be known before inheriting a sole technician. The picker is disabled
    // during this window; this guard also protects programmatic/stale click handlers.
    if (assignedTechnicianIds.length === 1 && isTechnicianRosterLoading) return
    if (!startTicketAction(TicketBusySurface.AddLine)) return
    serviceLineIdsBeforeAddRef.current = new Set(order?.serviceLines.map((line) => line.id) ?? [])

    addServiceLine.mutate(
      { orderId, posServiceId: service.id, unitPrice: service.price, serviceName: service.name },
      {
        onSuccess: (newServiceLineId) => {
          if (!isPersistedLineId(newServiceLineId)) {
            endTicketAction()
            return
          }

          const inheritedStaffId = resolveNewLineTechnicianAssignment(
            assignedTechnicianIds,
            (staffId) => techniciansForService(service.id).some((tech) => tech.posStaffProfileId === staffId),
          )
          // Nothing to inherit means the line is already how it should be — an assign call here
          // would only write an empty note over an empty note.
          if (inheritedStaffId === null) {
            endTicketAction()
            return
          }
          saveServiceLine(newServiceLineId, inheritedStaffId, '', { onSettled: endTicketAction })
        },
        onError: (err) => {
          reportError(err)
          endTicketAction()
        },
      },
    )
  }

  // The technician comes with the payload — the form picked it — so this is one call, and the line
  // never exists for a moment with nobody on it. The modal stays open until the server confirms:
  // the most likely failure is a technician who went off shift while the form was open, and losing
  // the typed name, price and note to that would be a poor trade.
  const handleAddCustomService = (payload: CustomServiceSubmit) => {
    if (!startTicketAction(TicketBusySurface.AddLine)) return
    serviceLineIdsBeforeAddRef.current = new Set(order?.serviceLines.map((line) => line.id) ?? [])

    addCustomServiceLine.mutate(
      { orderId, ...payload },
      {
        onSuccess: () => {
          setCustomServiceTarget(null)
          endTicketAction()
        },
        onError: (err) => {
          reportError(err)
          endTicketAction()
        },
      },
    )
  }

  // Corrects an existing custom line. Two calls only when the note changed as well: the name and
  // price live on the line, the note is only writable through the assignment endpoint.
  const handleSaveCustomService = (payload: CustomServiceSubmit) => {
    const target = customServiceTarget
    const serviceLineId = target?.serviceLineId
    if (!serviceLineId) {
      handleAddCustomService(payload)
      return
    }
    if (!isPersistedLineId(serviceLineId) || !startTicketAction(TicketBusySurface.Lines)) return
    const noteChanged = (payload.note ?? '') !== (target?.note ?? '')
    const line = visibleLines.find(
      (l): l is DisplayServiceLine => l.itemType === 'Service' && l.existingId === serviceLineId,
    )
    setCustomServiceTarget(null)

    updateServiceLine.mutate(
      {
        orderId,
        serviceLineId,
        posServiceId: null,
        unitPrice: payload.price,
        serviceName: payload.customServiceName,
      },
      {
        onError: reportError,
        onSettled: () => {
          if (!noteChanged) {
            endTicketAction()
            return
          }
          saveServiceLine(serviceLineId, line?.posStaffProfileId, payload.note ?? '', {
            onSettled: endTicketAction,
          })
        },
      },
    )
  }

  const openTechnicianModal = (line: DisplayServiceLine) => {
    if (isBusy || !isPersistedLineId(line.existingId)) return
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
    if (!target || posServiceId === target.posServiceId) {
      setChangeServiceTarget(null)
      return
    }

    const service = serviceCatalog.find((s) => s.id === posServiceId)
    if (!service) return
    if (!isPersistedLineId(target.serviceLineId) || !startTicketAction(TicketBusySurface.Lines)) return
    setChangeServiceTarget(null)
    updateServiceLine.mutate(
      {
        orderId,
        serviceLineId: target.serviceLineId,
        posServiceId,
        unitPrice: service.price,
        serviceName: service.name,
      },
      {
        onError: reportError,
        onSettled: endTicketAction,
      },
    )
  }

  const runDiscountMutation = (payload: SetOrderServiceLineDiscountPayload) => {
    const target = discountTarget
    if (!target || !isPersistedLineId(target.serviceLineId) || !startTicketAction(TicketBusySurface.Lines)) return
    setDiscountTarget(null)
    setServiceLineDiscount.mutate(
      { orderId, serviceLineId: target.serviceLineId, payload },
      { onError: reportError, onSettled: endTicketAction },
    )
  }

  // The resolved amount, the technician's share and any bearer fallback are all decided by the
  // backend, so the popup stays open until the call settles; the refetched order is what the
  // screen shows after it closes.
  const handleSaveDiscount = (submitted: ServiceDiscountSubmit) => {
    runDiscountMutation({
      discountType: submitted.discountType,
      discountValue: submitted.discountValue,
      discountBearer: submitted.discountBearer,
      discountNote: submitted.discountNote,
    })
  }

  // A null discountType is how the endpoint clears a discount — the same call, no second endpoint.
  const handleRemoveDiscount = () => {
    runDiscountMutation({ discountType: null, discountValue: null, discountBearer: null, discountNote: null })
  }

  const technicianDisplayName = (staffId: string | null | undefined) =>
    staffId
      ? allTechnicians.find((tech) => tech.posStaffProfileId === staffId)?.displayName ?? null
      : null

  // AssignStaffToServiceLine overwrites Note unconditionally, so both values travel together on
  // every call — sending only the technician would silently wipe the note.
  const saveServiceLine = (
    serviceLineId: string,
    posStaffProfileId: string | undefined,
    note: string,
    options?: { onError?: () => void; onSettled?: () => void },
  ) => {
    if (!isPersistedLineId(serviceLineId)) {
      options?.onSettled?.()
      return
    }
    assignStaffToServiceLine.mutate(
      {
        orderId,
        serviceLineId,
        posStaffProfileId,
        technicianName: technicianDisplayName(posStaffProfileId),
        note: note.trim() || undefined,
      },
      {
        onError: (err) => {
          reportError(err)
          options?.onError?.()
        },
        onSettled: options?.onSettled,
      },
    )
  }

  const handleSelectTechnician = (posStaffProfileId: string | null) => {
    const target = technicianTarget
    if (!target) return
    // Close before the request so the picker never swaps to a loading list in place.
    setTechnicianTarget(null)
    const sameTechnician = posStaffProfileId === (target.posStaffProfileId ?? null)
    const sameNote = noteDraft.trim() === (target.note ?? '').trim()
    if (sameTechnician && sameNote) return
    if (!startTicketAction(TicketBusySurface.Technician)) return
    setPendingTechnician({
      lineId: target.serviceLineId,
      staffId: posStaffProfileId,
      displayName: technicianDisplayName(posStaffProfileId),
    })
    saveServiceLine(target.serviceLineId, posStaffProfileId ?? undefined, noteDraft, {
      onError: () => setPendingTechnician(null),
      onSettled: endTicketAction,
    })
  }

  // Closing without picking anyone still keeps a note the operator typed — it is saved against
  // whoever the line already had, since the endpoint writes both fields together.
  const handleCloseTechnicianModal = () => {
    const target = technicianTarget
    if (!target) return
    setTechnicianTarget(null)
    if (noteDraft.trim() === (target.note ?? '').trim()) return
    if (!startTicketAction(TicketBusySurface.Technician)) return
    saveServiceLine(target.serviceLineId, target.posStaffProfileId, noteDraft, {
      onSettled: endTicketAction,
    })
  }

  const { data: addOnOptions = [], isLoading: areAddOnOptionsLoading } = useServiceLineAddOnOptions(
    businessId,
    orderId,
    addOnTarget?.serviceLineId,
  )

  // The picker stays open: two taps on the same extra is two lines, and one "yes" at the chair
  // often becomes two.
  const handleAddAddOn = (option: ServiceLineAddOnOptionApiDto) => {
    const target = addOnTarget
    if (!target) return
    addServiceAddOnLine.mutate(
      {
        orderId,
        serviceLineId: target.serviceLineId,
        serviceAddOnId: option.id,
        unitPrice: option.price,
        addOnName: option.name,
      },
      { onError: reportError },
    )
  }

  const handleRemoveAddOn = (addOn: OrderServiceAddOnLineApiDto) => {
    removeServiceAddOnLine.mutate({ orderId, addOnLineId: addOn.id }, { onError: reportError })
  }

  const handleDeleteLine = (line: DisplayLine) => {
    if (!isPersistedLineId(line.existingId) || !startTicketAction(TicketBusySurface.Lines)) return
    const unlockAfterMutation = { onError: reportError, onSettled: endTicketAction }
    if (line.itemType === 'Service') {
      removeServiceLine.mutate({ orderId, serviceLineId: line.existingId }, unlockAfterMutation)
      return
    }
    removeProductLine.mutate({ orderId, productLineId: line.existingId }, unlockAfterMutation)
  }

  // POS iPad redesign — Order Detail stepper replaces the old free-text Qty input (which
  // needed a keyboard draft-then-blur-commit dance). A +/- tap applies immediately since
  // there's no partial/invalid intermediate state to debounce, unlike typed text.
  const applyQuantityDelta = (line: DisplayProductLine, delta: number) => {
    const nextQty = Math.max(1, line.quantity + delta)
    if (nextQty === line.quantity) return

    if (!isPersistedLineId(line.existingId) || !startTicketAction(TicketBusySurface.Lines)) return
    updateProductQuantity.mutate(
      { orderId, productLineId: line.existingId, quantity: nextQty },
      { onError: reportError, onSettled: endTicketAction },
    )
  }

  // The warning is advisory and switchable off per salon; the backend behaves identically either
  // way (it force-syncs the lines), so this only decides whether the front desk is asked first.
  const warnOnMismatch = orderSettings.data?.warnOnServiceLineStatusMismatch ?? true

  const parentServiceLines = useMemo(
    () => visibleLines.filter((l): l is DisplayServiceLine => l.itemType === 'Service'),
    [visibleLines],
  )

  const describeLine = (line: DisplayServiceLine) =>
    line.technicianName ? `${line.serviceName} — ${line.technicianName}` : line.serviceName

  // Nobody has taken a service yet: every line is still unassigned or waiting to be accepted.
  const noLineReadyToStart =
    parentServiceLines.length > 0
    && !parentServiceLines.some((l) => isLineAtOrPast(l.lineStatus, PosOrderItemStatus.Assigned))

  const unfinishedLineLabels = parentServiceLines
    .filter((l) => l.lineStatus !== PosOrderItemStatus.Completed)
    .map(describeLine)

  // Which line's status button is mid-flight, so only that button shows a spinner. The ref covers
  // the gap before React re-renders, exactly as useTicketActionLock's own ref does.
  const [pendingLineStatusAction, setPendingLineStatusAction] =
    useState<{ lineId: string; kind: LineStatusActionKind } | null>(null)
  const lineStatusActionLockRef = useRef(false)

  const [mismatchWarning, setMismatchWarning] = useState<{
    kind: ServiceLineMismatchKind
    lines: string[]
    onConfirm: () => void
  } | null>(null)

  const confirmMismatch = (
    kind: ServiceLineMismatchKind,
    lines: string[],
    shouldWarn: boolean,
    run: () => void,
  ) => {
    if (!warnOnMismatch || !shouldWarn) {
      run()
      return
    }
    setMismatchWarning({ kind, lines, onConfirm: run })
  }

  const runStartService = () => {
    if (!startTicketAction(TicketBusySurface.Status)) return
    startOrderService.mutate(orderId, {
      onSuccess: () => showToast(t('components.dashboard.views.pos.PosOrderWorkspace.startServiceSuccess')),
      onError: reportError,
      onSettled: endTicketAction,
    })
  }

  const handleStartService = () => {
    if (hasUnassignedServiceLine) {
      showToast(t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst'), 'error')
      return
    }
    confirmMismatch('start', [], noLineReadyToStart, runStartService)
  }

  // Per-line Start/Complete. Both are idempotent server-side, so a stale board that shows the
  // button one tap too late costs nothing.
  //
  // Deliberately NOT routed through startTicketAction(TicketBusySurface.Lines): that surface
  // blanks the whole ticket panel behind a skeleton, which is the right weight for editing a
  // line (price, technician, discount all move at once) but far too heavy for flipping one
  // line's status — the only thing that changes is that line's badge. The pressed button carries
  // its own spinner instead, and the ref below keeps the double-tap protection the surface lock
  // used to provide.
  //
  // Success is also silent: the badge already changes, and the front desk taps these once per
  // service — a confirmation dialog per tap would be three interruptions on a three-service
  // ticket. Failures still surface through reportError.
  const runLineStatusAction = (
    line: DisplayServiceLine,
    kind: LineStatusActionKind,
    mutation: typeof startServiceLine,
  ) => {
    if (!isPersistedLineId(line.existingId)) return
    if (isBusy || lineStatusActionLockRef.current) return

    lineStatusActionLockRef.current = true
    setPendingLineStatusAction({ lineId: line.existingId as string, kind })

    mutation.mutate(
      { orderId, serviceLineId: line.existingId as string },
      {
        onError: reportError,
        onSettled: () => {
          lineStatusActionLockRef.current = false
          setPendingLineStatusAction(null)
        },
      },
    )
  }

  const isLineStatusActionPending = (line: DisplayServiceLine, kind: LineStatusActionKind) =>
    pendingLineStatusAction?.lineId === line.existingId && pendingLineStatusAction.kind === kind

  const handleStartLine = (line: DisplayServiceLine) => runLineStatusAction(line, 'start', startServiceLine)

  const handleCompleteLine = (line: DisplayServiceLine) =>
    runLineStatusAction(line, 'complete', markServiceLineDone)

  const handleCheckoutFromUpdate = () => {
    if (isPaid) return
    // Only start service first if there's actually a service to serve — StartOrderService
    // rejects an order with no service line. Reached from the InService Checkout button; a
    // Waiting ticket with no service has nothing to charge and offers neither button.
    if (order?.status === PosOrderStatus.Waiting && hasServiceLines) {
      if (!startTicketAction(TicketBusySurface.Status)) return
      startOrderService.mutate(orderId, {
        onSuccess: () => setShowPaymentSection(true),
        onError: reportError,
        onSettled: endTicketAction,
      })
    } else {
      setShowPaymentSection(true)
    }
  }

  const handleApplyOrderDiscount = (payload: SetOrderDiscountPayload) => {
    setOrderDiscount.mutate({ orderId, payload }, { onError: reportError })
  }

  const applyTip = (mode: TipMode, amount: number) => {
    if (amount < 0) return
    if (!startTicketAction(TicketBusySurface.Tip)) return
    setTipMode(mode)
    setTip.mutate(
      { orderId, tipAmount: amount },
      { onError: reportError, onSettled: endTicketAction },
    )
  }

  const handleCustomTipCommit = () => {
    const parsed = parseDirectPaymentAmountInput(customTipInput)
    if (!Number.isFinite(parsed) || parsed < 0) return
    applyTip('custom', round2(parsed))
  }

  const handleNoteCommit = () => {
    if (setNote.isPending) return
    const trimmed = noteInput.trim()
    if (trimmed === (order?.note ?? '')) return
    setNote.mutate(
      { orderId, note: trimmed.length > 0 ? trimmed : null },
      { onError: reportError },
    )
  }

  // A percentage tip mode (pct10/pct20) is a live % of servicesSubtotal, not a one-time
  // dollar snapshot — without this, adding/removing a service after picking e.g. 10%
  // leaves the old dollar amount on the order, so Payment Summary's Tip/Total silently
  // stop matching the selected percentage. Re-applies the percentage server-side whenever
  // the subtotal it's based on changes; a no-op once the persisted tip already matches.
  useEffect(() => {
    const percent = TIP_PERCENT_BY_MODE[tipMode]
    if (percent === undefined || !order || isBusy) return
    const expectedTip = round2(order.servicesSubtotal * percent)
    if (Math.abs(expectedTip - order.tipAmount) < 0.005) return
    setTip.mutate({ orderId, tipAmount: expectedTip }, { onError: reportError })
    // Only the subtotal driving the % (and the mode itself) should retrigger this — order.
    // tipAmount is deliberately excluded, since this effect is what changes it. isBusy waits
    // until add/remove line settles so this does not race a second tip request.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.servicesSubtotal, tipMode, orderId, isBusy])

  const tipSplitTotal = Object.values(tipSplitInputs).reduce(
    (sum, value) => sum + parseDirectPaymentAmountInput(value),
    0,
  )
  const isTipSplitBalanced = order ? Math.abs(round2(tipSplitTotal) - order.tipAmount) < 0.01 : false

  const handleSaveTipSplit = () => {
    if (!order || !isTipSplitBalanced || !startTicketAction(TicketBusySurface.Tip)) return
    setStaffTipSplit.mutate(
      {
        orderId,
        payload: {
          shares: Object.entries(tipSplitInputs).map(([posStaffProfileId, amount]) => ({
            posStaffProfileId,
            tipAmount: round2(parseDirectPaymentAmountInput(amount)),
          })),
        },
      },
      { onError: reportError, onSettled: endTicketAction },
    )
  }

  const handleComplete = () => {
    if (!order || isPaid || !cashPaymentCovered || !isPaymentMethodEligible) return
    if (hasNoLines) {
      showToast(t('components.dashboard.views.pos.PosOrderWorkspace.addLineFirst'), 'error')
      return
    }
    // A line with no technician is a money problem (no commission, no tip split), so it stays a
    // hard block rather than something the mismatch warning can be switched off for.
    if (hasUnassignedServiceLine) {
      showToast(t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst'), 'error')
      return
    }
    confirmMismatch('checkout', unfinishedLineLabels, unfinishedLineLabels.length > 0, runComplete)
  }

  const runComplete = () => {
    if (!order) return
    if (!startTicketAction(TicketBusySurface.Complete)) return
    const submittedReceiptMode = receiptChoice
    completeOrder.mutate(
      {
        orderId,
        payload: {
          paymentMethodType: paymentMethod,
          // E.164, not the bare national number: the backend re-parses this value and only a
          // full number tells it which country the receipt SMS is addressed to.
          receiptPhone: submittedReceiptMode === 'sms' ? order?.customerPhoneE164 ?? undefined : undefined,
        },
      },
      {
        onSuccess: (result) => {
          setCompletedPayment(result)
          onPaymentCompleted?.(result.orderId, submittedReceiptMode)

          // Built here, synchronously, rather than in the effect: completing the order
          // invalidates the order query, so by the time an effect runs `order` may be mid
          // refetch. The lines in this closure are the correct pre-completion snapshot
          // (Complete does not change lines) and `result` carries the server-confirmed money.
          if (submittedReceiptMode !== 'print') return
          const settings = receiptSettings ?? DEFAULT_POS_RECEIPT_SETTINGS
          const copies = resolveReceiptCopies(paymentMethod, settings)
          if (copies < 1) return
          setAutoPrintIntent({
            orderId: result.orderId,
            copies,
            doc: buildPosReceiptDocument(
              {
                order,
                confirmed: result,
                business: {
                  name: businessName,
                  address: businessAddress,
                  phone: businessPhone,
                },
                unassignedTechnicianLabel: resolveUnassignedTechnicianLabel(t),
                productsLabel: resolveProductsGroupLabel(t),
                paymentMethodLabel: getPosCheckoutPaymentMethodLabel(paymentMethod, t),
                totalsLabels: resolvePosReceiptTotalsLabels(t),
                labels: resolvePosReceiptLabels(t),
                locale: currentLanguage,
              },
              settings,
            ),
          })
        },
        onError: reportError,
        onSettled: endTicketAction,
      },
    )
  }

  const handleOpenPrintPreview = () => {
    setPrintPreviewOpen(true)
  }

  const handlePrintDocument = () => {
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      printCleanupRef.current?.()
      document.body.classList.add('printing-pos-invoice')

      const cleanup = () => {
        window.removeEventListener('afterprint', cleanup)
        document.body.classList.remove('printing-pos-invoice')
        if (printCleanupRef.current === cleanup) printCleanupRef.current = null
      }

      printCleanupRef.current = cleanup
      window.addEventListener('afterprint', cleanup, { once: true })
      try {
        window.print()
      } catch {
        cleanup()
      }
    }
  }

  const mutationSkeletonLabel = t('common.loading')

  // Services only. The Products tab is hidden rather than deleted — the picker, the
  // AddOrderProductLine endpoint and the Products catalog screen all stay, so retail selling is one
  // JSX block away from coming back. Nothing sells products anywhere while it is hidden: check-in
  // dropped them with the one-page redesign, and this was the last surface.
  const catalogPanel = (
          <div className="nexora-card space-y-3 p-4">
            <div className="border-b border-nexoraBorder pb-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-nexoraMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.tabServices')}
              </h3>
            </div>

            <CategoryGroupedCatalogPicker
              variant="grid"
              items={serviceCatalog}
              isPending={isServiceCatalogPending}
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
          <div className="space-y-4">
            <div
              role="region"
              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
              className="space-y-3 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-[10px] font-black tracking-wider text-nexoraMuted">
                  <span className="uppercase">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
                  </span>{' '}
                  <span className="normal-case">
                    {t(
                      `components.dashboard.views.pos.PosOrderWorkspace.${
                        serviceLineCount === 1 ? 'orderDetailServiceCountOne' : 'orderDetailServiceCount'
                      }`,
                      { count: serviceLineCount },
                    )}
                  </span>
                </h3>
                {canEditLines ? (
                  <button
                    type="button"
                    data-testid="add-custom-service"
                    onClick={() =>
                      setCustomServiceTarget({
                        posStaffProfileId: soleTicketTechnician?.posStaffProfileId ?? null,
                        technicianName: soleTicketTechnician?.technicianName ?? null,
                      })
                    }
                    disabled={isBusy}
                    className="h-7 shrink-0 rounded-lg border border-nexoraBrand bg-nexoraBrandSoft/50 px-3 text-[11px] font-bold text-nexoraBrandDark transition-colors hover:bg-nexoraBrandSoft disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosOrderWorkspace.addCustomServiceButton')}
                  </button>
                ) : null}
              </div>

              {visibleLines.length === 0 && !showAddLinePlaceholder ? (
                <p className="text-[11px] text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}
                </p>
              ) : (
                // Bounded height + internal scroll: a long order scrolls its line items in
                // place, keeping Note/Estimated Total/Start Service/Checkout below always visible.
                <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
                  {visibleLines.map((line, index) => (
                    <Fragment key={line.key}>
                      {index > 0 ? (
                        <div
                          data-testid={`ticket-detail-separator-${index}`}
                          aria-hidden="true"
                          className="border-t border-dashed border-nexoraBorder/70"
                        />
                      ) : null}
                      {line.itemType === 'Service' ? (
                        (() => {
                          const { isFirstAvailable, technicianName } = lineTechnicianDisplay(line, pendingTechnician)
                          const technicianLabel = isFirstAvailable
                            ? t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel')
                            : technicianName
                          const isCustomLine = line.posServiceId === null
                          const canEditServiceLine =
                            canEditLines && !line.completedAt && isPersistedLineId(line.existingId)
                          const canChangeService =
                            SHOW_CHANGE_SERVICE_ACTION
                            && canEditServiceLine
                            && !isCustomLine
                          const canEditCustomService = canEditServiceLine && isCustomLine
                          const canMutateLine = canEditLines && isPersistedLineId(line.existingId)
                          return (
                            <div
                              data-testid={`ticket-detail-${line.key}`}
                              className={`grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-1 rounded-lg px-2 py-3 ${
                                index % 2 === 0 ? 'bg-white' : 'bg-nexoraCanvas/70'
                              }`}
                            >
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="min-w-0 truncate text-[13px] font-bold leading-tight text-nexoraText">
                                    {line.serviceName}
                                  </p>
                                  {isCustomLine ? (
                                    <span className="shrink-0 rounded-md bg-violet-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-700">
                                      {t('components.dashboard.views.pos.PosOrderWorkspace.customServiceBadge')}
                                    </span>
                                  ) : null}
                                  <span
                                    data-testid={`line-status-${line.key}`}
                                    className={`shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider ${LINE_STATUS_BADGE_CLASS[line.lineStatus] ?? LINE_STATUS_BADGE_CLASS[PosOrderItemStatus.Unassigned]}`}
                                  >
                                    {t(posOrderItemStatusLabelKey(line.lineStatus))}
                                  </span>
                                </div>
                                <p className="mt-1 min-w-0 truncate text-xs font-semibold leading-tight text-nexoraText">
                                  <span className="text-[10px] font-normal text-nexoraMuted">
                                    {t('components.dashboard.views.pos.PosOrderWorkspace.technicianPrefix')}
                                  </span>{' '}
                                  {technicianLabel}
                                </p>
                              </div>
                              <div className="text-right">
                                {line.discountAmount > 0 ? (
                                  <div className="text-right leading-tight">
                                    <span className="text-sm font-bold text-nexoraText">
                                      {formatCompactUsdAmount(lineTotal(line))}
                                    </span>
                                    <span className="ml-1 text-[11px] font-semibold text-rose-500">
                                      {formatDiscountPriceBadge(
                                        line.discountType,
                                        line.discountValue,
                                        line.discountAmount,
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-sm font-bold text-nexoraText">
                                    {formatCompactUsdAmount(lineTotal(line))}
                                  </span>
                                )}
                              </div>

                              {/* Wraps rather than scrolls: a hidden action is an action the front
                                  desk does not know exists, and Start/Complete now sit in this row.
                                  Vertical growth is cheap here — the list above it already scrolls. */}
                              <div className="col-span-2 min-w-0 pt-1">
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {/* Also offered on a line still awaiting the technician's acceptance:
                                      starting on their behalf is the designed way out when nobody
                                      answers, and it records the acceptance at the same instant. */}
                                  {canMutateLine
                                    && (line.lineStatus === PosOrderItemStatus.Assigned
                                      || line.lineStatus === PosOrderItemStatus.PendingAcceptance) ? (
                                    <button
                                      type="button"
                                      data-testid={`start-line-${line.key}`}
                                      onClick={() => handleStartLine(line)}
                                      disabled={isBusy}
                                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 text-[10px] font-bold text-emerald-700 disabled:opacity-60"
                                    >
                                      {isLineStatusActionPending(line, 'start') ? (
                                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                      ) : null}
                                      {t('components.dashboard.views.pos.serviceLineStatus.startAction')}
                                    </button>
                                  ) : null}
                                  {canMutateLine && line.lineStatus === PosOrderItemStatus.Started ? (
                                    <button
                                      type="button"
                                      data-testid={`complete-line-${line.key}`}
                                      onClick={() => handleCompleteLine(line)}
                                      disabled={isBusy}
                                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-300 bg-emerald-500 px-2 text-[10px] font-bold text-white disabled:opacity-60"
                                    >
                                      {isLineStatusActionPending(line, 'complete') ? (
                                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                      ) : null}
                                      {t('components.dashboard.views.pos.serviceLineStatus.completeAction')}
                                    </button>
                                  ) : null}
                                  {canMutateLine ? (
                                    <button
                                      type="button"
                                      data-testid={`assign-technician-${line.key}`}
                                      onClick={() => openTechnicianModal(line)}
                                      disabled={isBusy}
                                      className={`h-7 shrink-0 rounded-lg border px-2 text-[10px] font-bold transition-colors disabled:opacity-60 ${
                                        isFirstAvailable
                                          ? 'border-nexoraBrand bg-nexoraBrand text-white shadow-sm hover:bg-nexoraBrand/90'
                                          : 'border-sky-200 bg-sky-50/50 text-sky-700 hover:bg-sky-100/70'
                                      }`}
                                    >
                                      {t(`components.dashboard.views.pos.PosOrderWorkspace.${isFirstAvailable ? 'assignTechnician' : 'changeTechnician'}`)}
                                    </button>
                                  ) : null}
                                  {canEditCustomService ? (
                                    <button
                                      type="button"
                                      onClick={() => setCustomServiceTarget({
                                        serviceLineId: line.existingId as string,
                                        customServiceName: line.serviceName,
                                        unitPrice: line.unitPrice,
                                        note: line.note ?? null,
                                      })}
                                      disabled={isBusy}
                                      className="h-7 shrink-0 rounded-lg border border-violet-200 bg-violet-50/50 px-2 text-[10px] font-bold text-violet-700 disabled:opacity-60"
                                    >
                                      {t('common.edit')}
                                    </button>
                                  ) : null}
                                  {canChangeService ? (
                                    <button type="button" onClick={() => setChangeServiceTarget({ serviceLineId: line.existingId as string, serviceName: line.serviceName, posServiceId: line.posServiceId, addOnCount: line.addOns.length })} disabled={isBusy} className="h-7 shrink-0 rounded-lg border border-violet-200 bg-violet-50/50 px-2 text-[10px] font-bold text-violet-700 disabled:opacity-60">
                                      {t('components.dashboard.views.pos.PosOrderWorkspace.changeService')}
                                    </button>
                                  ) : null}
                                  {SHOW_SERVICE_ADD_ONS && canEditServiceLine && !isCustomLine ? (
                                    <button type="button" data-testid={`add-add-on-${line.key}`} onClick={() => setAddOnTarget({ serviceLineId: line.existingId as string, serviceName: line.serviceName })} className="h-7 shrink-0 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-2 text-[10px] font-bold text-nexoraText">
                                      {t('components.dashboard.views.pos.PosOrderWorkspace.addAddOn')}
                                    </button>
                                  ) : null}
                                  {canMutateLine ? (
                                    <button type="button" onClick={() => setDiscountTarget({ serviceLineId: line.existingId as string, serviceName: line.serviceName, lineTotal: lineTotal(line), technicianName: line.technicianName, canAssignDiscountToStaff: line.canAssignDiscountToStaff, discountType: line.discountType, discountValue: line.discountValue, discountBearer: line.discountBearer, discountNote: line.discountNote })} disabled={isBusy} className="h-7 shrink-0 rounded-lg border border-amber-200 bg-amber-50/50 px-2 text-[10px] font-bold text-amber-700 disabled:opacity-60">
                                      {t(`components.dashboard.views.pos.PosOrderWorkspace.${line.discountAmount > 0 ? 'editDiscount' : 'addDiscount'}`)}
                                    </button>
                                  ) : null}
                                  <PosRemoveConfirmAction onConfirm={() => handleDeleteLine(line)} disabled={isBusy || !isPersistedLineId(line.existingId)} />
                                </div>
                              </div>

                              {/* Indented under the service, spanning both columns: an add-on is a
                                  charge of its own on the receipt but never a ticket row of its own. */}
                              {line.addOns.length > 0 ? (
                                <ul className="col-span-2 space-y-1 border-l-2 border-nexoraBorder pl-3">
                                  {line.addOns.map((addOn, addOnIndex) => (
                                    <li
                                      key={addOn.id}
                                      data-testid={`ticket-add-on-${addOn.id}`}
                                      className={`flex items-start justify-between gap-2 rounded-md px-2 py-1.5 ${
                                        addOnIndex % 2 === 0
                                          ? 'bg-nexoraCanvas/80'
                                          : 'bg-nexoraBrandSoft/40'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <p className="min-w-0 truncate text-xs font-bold leading-tight text-nexoraText">
                                          + {addOn.addOnName}
                                        </p>
                                      </div>
                                      <div className="flex shrink-0 items-center gap-1.5">
                                        {addOn.discountAmount > 0 ? (
                                          <span className="leading-tight">
                                            <span className="text-xs font-bold text-nexoraText">
                                              {formatCompactUsdAmount(addOn.lineTotal)}
                                            </span>
                                            <span className="ml-1 text-[11px] font-semibold text-rose-500">
                                              {formatDiscountPriceBadge(
                                                addOn.discountType,
                                                addOn.discountValue,
                                                addOn.discountAmount,
                                              )}
                                            </span>
                                          </span>
                                        ) : (
                                          <span className="text-xs font-bold text-nexoraText">
                                            {formatCompactUsdAmount(addOn.lineTotal)}
                                          </span>
                                        )}
                                        {canEditLines ? (
                                          <>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                setDiscountTarget({
                                                  serviceLineId: addOn.id,
                                                  serviceName: addOn.addOnName,
                                                  lineTotal: addOn.lineTotal,
                                                  technicianName: line.technicianName,
                                                  canAssignDiscountToStaff: addOn.canAssignDiscountToStaff,
                                                  discountType: addOn.discountType,
                                                  discountValue: addOn.discountValue,
                                                  discountBearer: addOn.discountBearer,
                                                  discountNote: addOn.discountNote,
                                                })
                                              }
                                              className="h-6 rounded-lg border border-amber-200 bg-amber-50/50 px-2 text-[10px] font-bold text-amber-700 hover:bg-amber-50"
                                            >
                                              {t(
                                                `components.dashboard.views.pos.PosOrderWorkspace.${
                                                  addOn.discountAmount > 0 ? 'editDiscount' : 'addDiscount'
                                                }`,
                                              )}
                                            </button>
                                            <PosRemoveConfirmAction
                                              testId={`remove-add-on-${addOn.id}`}
                                              onConfirm={() => handleRemoveAddOn(addOn)}
                                              disabled={isBusy}
                                            />
                                          </>
                                        ) : null}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              ) : null}
                            </div>
                          )
                        })()
                      ) : (
                        <div
                          data-testid={`ticket-detail-${line.key}`}
                          className={`space-y-2 rounded-lg px-2 py-3 ${
                            index % 2 === 0 ? 'bg-white' : 'bg-nexoraCanvas/70'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraCanvas text-nexoraBrandDark">
                              <Package className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold leading-tight text-nexoraText">{line.productName}</p>
                              <p className="text-xs leading-tight text-nexoraMuted">
                                {formatCompactUsdAmount(line.unitPrice)} each
                              </p>
                            </div>
                            <span className="shrink-0 text-sm font-bold text-nexoraText">
                              {formatCompactUsdAmount(lineTotal(line))}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => applyQuantityDelta(line, -1)}
                                disabled={isBusy}
                                className="h-8 rounded-lg border border-nexoraBorder px-2 text-[10px] font-bold text-nexoraText hover:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {t('components.dashboard.views.pos.PosOrderWorkspace.decreaseQty')}
                              </button>
                              <span className="w-5 text-center text-sm font-bold text-nexoraText">{line.quantity}</span>
                              <button
                                type="button"
                                onClick={() => applyQuantityDelta(line, 1)}
                                disabled={isBusy}
                                className="h-8 rounded-lg border border-nexoraBorder px-2 text-[10px] font-bold text-nexoraText hover:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {t('components.dashboard.views.pos.PosOrderWorkspace.increaseQty')}
                              </button>
                            </div>
                            <PosRemoveConfirmAction
                              onConfirm={() => handleDeleteLine(line)}
                              disabled={isBusy || !isPersistedLineId(line.existingId)}
                            />
                          </div>
                        </div>
                      )}
                    </Fragment>
                  ))}
                  {showAddLinePlaceholder ? (
                    <div role="status" aria-live="polite" aria-label={mutationSkeletonLabel}>
                      {visibleLines.length > 0 ? (
                        <div aria-hidden="true" className="border-t border-dashed border-nexoraBorder/70" />
                      ) : null}
                      <SkeletonListItem lines={2} showAction />
                    </div>
                  ) : null}
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
                  {isLineBusy ? (
                    <Skeleton width={72} height={16} borderRadius={6} />
                  ) : (
                    <span className="font-black text-nexoraText">${draftSubtotal.toFixed(2)}</span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="space-y-2 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
              <label htmlFor="pos-ticket-note" className="block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle')}
              </label>
              <textarea
                id="pos-ticket-note"
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                onBlur={handleNoteCommit}
                disabled={isBusy}
                maxLength={500}
                rows={2}
                placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePlaceholder')}
                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteLabel')}
                className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>

            {!showPaymentSection ? (
              <div className="flex gap-2">
                {mode === 'edit' ? (
                  <button
                    type="button"
                    onClick={() => setTicketPreviewOpen(true)}
                    disabled={isBusy || serviceLineCount === 0}
                    className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-xs font-semibold text-nexoraMuted transition-colors hover:border-nexoraBrand/30 hover:bg-nexoraBrandSoft/40 hover:text-nexoraBrandDark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Printer className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {t('components.dashboard.views.pos.PosOrderWorkspace.printTicketAction')}
                  </button>
                ) : null}
                {order?.status === PosOrderStatus.Waiting && hasServiceLines ? (
                  <button
                    type="button"
                    onClick={handleStartService}
                    disabled={isBusy}
                    title={
                      hasUnassignedServiceLine
                        ? t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst')
                        : undefined
                    }
                    className="inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-nexoraBrand/25 bg-nexoraBrandSoft/60 px-3 text-xs font-semibold text-nexoraBrandDark transition-colors hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {startOrderService.isPending ? (
                      <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <ClipboardCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                        {t('components.dashboard.views.pos.PosOrderWorkspace.startServiceButton')}
                      </>
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
                    disabled={isBusy || hasNoLines}
                    title={
                      hasNoLines
                        ? t('components.dashboard.views.pos.PosOrderWorkspace.addLineFirst')
                        : undefined
                    }
                    className="h-11 flex-1 rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')}
                  </button>
                ) : null}
              </div>
            ) : null}

            {showPaymentSection && order ? (
              <>
                <div className="relative space-y-3 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
                  <TicketActionSkeletonOverlay
                    visible={isTipBusy}
                    label={mutationSkeletonLabel}
                    count={TICKET_SKELETON_ROW_COUNT.tip}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.tipTitle')}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCustomerFacingMode(true)}
                      className="rounded-lg border border-nexoraBrand/40 bg-nexoraBrandSoft/40 px-2.5 py-1 text-[10px] font-semibold text-nexoraBrandDark transition-colors hover:bg-nexoraBrandSoft"
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.turnToCustomerButton')}
                    </button>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => applyTip('noTip', 0)}
                      className={`inline-flex min-w-[84px] flex-[1_1_auto] items-center justify-center whitespace-nowrap h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
                        tipMode === 'noTip'
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                          : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.noTipButton')}
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('fixed10', 10)}
                      className={`inline-flex min-w-[72px] flex-[1_1_auto] items-center justify-center whitespace-nowrap h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
                        tipMode === 'fixed10'
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                          : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      $10
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('fixed15', 15)}
                      className={`inline-flex min-w-[72px] flex-[1_1_auto] items-center justify-center whitespace-nowrap h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
                        tipMode === 'fixed15'
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                          : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      $15
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct10', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct10!))}
                      className={`inline-flex min-w-[72px] flex-[1_1_auto] items-center justify-center whitespace-nowrap h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
                        tipMode === 'pct10'
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                          : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      10%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct20', round2(order.servicesSubtotal * TIP_PERCENT_BY_MODE.pct20!))}
                      className={`inline-flex min-w-[72px] flex-[1_1_auto] items-center justify-center whitespace-nowrap h-8 rounded-lg border text-[11px] font-semibold transition-colors ${
                        tipMode === 'pct20'
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                          : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      20%
                    </button>
                    <div className="min-w-[180px] flex-[2_1_180px]">
                      <div className="relative">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-nexoraMuted">
                          $
                        </span>
                        <input
                          type="text"
                          inputMode="decimal"
                          value={customTipInput}
                          onChange={(e) => setCustomTipInput(
                            sanitizeDirectPaymentAmountInput(e.target.value, Number.MAX_SAFE_INTEGER),
                          )}
                          onFocus={() => setTipMode('custom')}
                          onBlur={handleCustomTipCommit}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleCustomTipCommit()
                            }
                          }}
                          placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.customTipPlaceholder')}
                          className={`h-9 w-full min-w-0 rounded-lg border bg-nexoraCanvas/30 pl-7 pr-3 text-xs text-nexoraText outline-none transition-colors ${
                            tipMode === 'custom' ? 'border-nexoraBrand/60 bg-nexoraBrandSoft/20' : 'border-nexoraBorder/70'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {order.staffTipShares.length > 1 ? (
                  <div className="relative space-y-2 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
                    <TicketActionSkeletonOverlay
                      visible={isTipBusy}
                      label={mutationSkeletonLabel}
                      count={TICKET_SKELETON_ROW_COUNT.tip}
                    />
                    <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.tipSplitTitle')}
                    </h3>
                    {order.staffTipShares.map((share) => (
                      <div key={share.posStaffProfileId} className="flex items-center gap-2 text-xs">
                        <span className="flex-1 truncate font-semibold text-nexoraText">{share.technicianName}</span>
                        <div className="relative w-24">
                          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-xs font-medium text-nexoraMuted">
                            $
                          </span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={tipSplitInputs[share.posStaffProfileId] ?? ''}
                            onChange={(e) =>
                              setTipSplitInputs((prev) => ({
                                ...prev,
                                [share.posStaffProfileId]: sanitizeDirectPaymentAmountInput(
                                  e.target.value,
                                  Number.MAX_SAFE_INTEGER,
                                ),
                              }))
                            }
                            className="h-8 w-full rounded-lg border border-nexoraBorder/70 bg-nexoraCanvas/30 pl-7 pr-2 text-xs text-nexoraText outline-none transition-colors focus:border-nexoraBrand/60 focus:bg-white"
                          />
                        </div>
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
                        disabled={!isTipSplitBalanced || isBusy}
                        className="rounded-lg border border-nexoraBorder/70 px-3 py-1.5 text-[10px] font-semibold text-nexoraText transition-colors hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40 disabled:opacity-60"
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.saveTipSplitButton')}
                      </button>
                    </div>
                  </div>
                ) : null}

                <div className="space-y-3 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.paymentMethodTitle')}
                  </h3>
                  <PosPaymentMethodSelector
                    value={paymentMethod}
                    onChange={setPaymentMethod}
                    receiveMethods={receivePaymentMethods}
                    disabled={isBusy}
                  />
                  {paymentMethod === PosCheckoutPaymentMethod.Cash && order ? (
                    <PosCashPaymentPanel
                      total={order.total}
                      value={cashReceived}
                      onChange={(value) => {
                        cashReceivedWasEditedRef.current = true
                        setCashReceived(value)
                      }}
                      disabled={isBusy}
                    />
                  ) : null}
                  {selectedReceivePaymentMethod && order ? (
                    <PosReceivePaymentPanel
                      method={selectedReceivePaymentMethod}
                      amount={order.total}
                      businessId={businessId}
                      businessName={businessName}
                      onMarkReceived={handleComplete}
                      disabled={isBusy}
                    />
                  ) : null}
                  <div>
                    <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.receiptTitle')}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setReceiptChoice('none')}
                        aria-pressed={receiptChoice === 'none'}
                        disabled={isBusy}
                        className={`h-8 rounded-lg border text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          receiptChoice === 'none'
                            ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                            : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                        }`}
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptNone')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptChoice('sms')}
                        aria-pressed={receiptChoice === 'sms'}
                        disabled={isBusy || !order?.customerPhoneE164}
                        className={`h-8 rounded-lg border text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          receiptChoice === 'sms'
                            ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                            : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                        }`}
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptSendSms')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setReceiptChoice('print')}
                        aria-pressed={receiptChoice === 'print'}
                        disabled={isBusy}
                        className={`h-8 rounded-lg border text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                          receiptChoice === 'print'
                            ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                            : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                        }`}
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptPrint')}
                      </button>
                    </div>
                    <div className="mt-1 grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={handleOpenPrintPreview}
                        disabled={isBusy}
                        className="col-start-3 justify-self-center text-[10px] font-semibold text-nexoraBrand underline underline-offset-2 hover:text-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  role="region"
                  aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.summaryTitle')}
                  className="nexora-card relative space-y-3 p-4"
                >
                  <TicketActionSkeletonOverlay
                    visible={isLineBusy || isTipBusy || isCompleteBusy}
                    label={mutationSkeletonLabel}
                    count={TICKET_SKELETON_ROW_COUNT.summary}
                  />
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosOrderWorkspace.summaryTitle')}
                    </h3>
                    <OrderDiscountSection
                      order={order}
                      promotions={eligiblePromotions}
                      isSaving={setOrderDiscount.isPending}
                      onApply={handleApplyOrderDiscount}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                      <span>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')}</span>
                      <span>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryPrice')}</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-nexoraText">
                      {visibleLines.map((line) => {
                        const name = line.itemType === 'Service' ? line.serviceName : line.productName
                        const summaryAddOns = line.itemType === 'Service' ? line.addOns : []
                        return (
                          <li key={line.key} aria-label={name} className="space-y-1.5">
                            <div className="flex items-center justify-between gap-3">
                              <span className="min-w-0 truncate">
                                {name}
                                {line.itemType === 'Service' && line.discountAmount > 0 ? (
                                  <span className="ml-1 font-semibold text-rose-500">
                                    {formatDiscountPriceBadge(
                                      line.discountType,
                                      line.discountValue,
                                      line.discountAmount,
                                    )}
                                  </span>
                                ) : null}
                              </span>
                              <span className="shrink-0 font-semibold tabular-nums">
                                ${lineTotalAfterDiscount(line).toFixed(2)}
                              </span>
                            </div>
                            {/* Add-ons are charged on top of their service and are already inside
                                Total — listing them keeps the breakdown adding up to it. */}
                            {summaryAddOns.length > 0 ? (
                              <ul className="space-y-1 border-l-2 border-nexoraBorder pl-3 text-nexoraMuted">
                                {summaryAddOns.map((addOn) => (
                                  <li
                                    key={addOn.id}
                                    aria-label={addOn.addOnName}
                                    data-testid={`summary-add-on-${addOn.id}`}
                                    className="flex items-center justify-between gap-3"
                                  >
                                    <span className="min-w-0 truncate">
                                      + {addOn.addOnName}
                                      {addOn.discountAmount > 0 ? (
                                        <span className="ml-1 font-semibold text-rose-500">
                                          {formatDiscountPriceBadge(
                                            addOn.discountType,
                                            addOn.discountValue,
                                            addOn.discountAmount,
                                          )}
                                        </span>
                                      ) : null}
                                    </span>
                                    <span className="shrink-0 font-semibold tabular-nums">
                                      ${addOn.lineTotalAfterDiscount.toFixed(2)}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                          </li>
                        )
                      })}
                    </ul>
                  </div>

                  <dl className="space-y-1 text-xs">
                    <div role="separator" className="border-t border-nexoraBorder" />
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip')}</dt>
                      <dd className="font-semibold text-nexoraText">${order.tipAmount.toFixed(2)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount')}</dt>
                      <dd className="font-semibold text-rose-600">
                        {order.discountAmount === 0 ? '$0.00' : `-$${Math.abs(order.discountAmount).toFixed(2)}`}
                      </dd>
                    </div>
		    {order.orderDiscountAmount > 0 ? (
                      <div className="flex justify-between">
                        <dt className="min-w-0 truncate text-nexoraMuted">
                          {order.appliedPromotionName
                            ?? t('components.dashboard.views.pos.PosOrderWorkspace.summaryOrderDiscount')}
                        </dt>
                        <dd className="shrink-0 font-semibold text-rose-600">
                          -${order.orderDiscountAmount.toFixed(2)}
                        </dd>
                      </div>
                    ) : null}
                    <div className="flex justify-between border-t border-nexoraBorder pt-1.5">
                      <dt className="font-black uppercase text-nexoraText">
                        {t('components.dashboard.views.pos.PosOrderWorkspace.summaryTotal')}
                      </dt>
                      <dd className="font-black text-nexoraText">{formatUsdAmount(order.total)}</dd>
                    </div>
                  </dl>
                </div>

                <button
                  type="button"
                  onClick={handleComplete}
                  disabled={isBusy || hasNoLines || !cashPaymentCovered || !isPaymentMethodEligible}
                  title={
                    hasNoLines
                      ? t('components.dashboard.views.pos.PosOrderWorkspace.addLineFirst')
                      : hasUnassignedServiceLine
                        ? t('components.dashboard.views.pos.PosOrderWorkspace.assignTechnicianFirst')
                        : undefined
                  }
                  className="h-11 w-full rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {completeOrder.isPending ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : (
                    t('components.dashboard.views.pos.PosOrderWorkspace.completeButton', {
                      amount: order.total.toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      }),
                    })
                  )}
                </button>
              </>
            ) : null}
          </div>
  )

  const completedReceiptItems: PosCheckoutReceiptItem[] = visibleLines.flatMap((line) => {
    if (line.itemType === 'Product') {
      return [{
        id: line.key,
        name: line.productName,
        groupName: t('components.dashboard.views.pos.PosOrderWorkspace.summaryProducts'),
        price: lineTotal(line),
      }]
    }
    return [
      {
        id: line.key,
        name: line.serviceName,
        groupName: line.technicianName
          || t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel'),
        price: lineTotal(line),
      },
      ...line.addOns.map((addOn) => ({
        id: addOn.id,
        name: `+ ${addOn.addOnName}`,
        groupName: line.technicianName
          || t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel'),
        price: addOn.lineTotal,
      })),
    ]
  })

  const printableServiceGroups = visibleLines.reduce<Array<{ id: string; technician: string; lines: DisplayServiceLine[] }>>(
    (groups, line) => {
      if (line.itemType !== 'Service') return groups

      const technician = line.technicianName?.trim() || t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel')
      const id = line.posStaffProfileId || 'unassigned'
      const group = groups.find((entry) => entry.id === id)
      if (group) {
        group.lines.push(line)
      } else {
        groups.push({ id, technician, lines: [line] })
      }
      return groups
    },
    [],
  )
  const printableReceiptGroups: PosTicketPrintGroup[] = [
    ...printableServiceGroups.map((group) => ({
      id: `technician-${group.id}`,
      label: group.technician,
      lines: group.lines.map((line) => ({
        id: line.key,
        name: line.serviceName,
        note: line.note,
        amount: lineTotal(line),
        discountLabel: line.discountAmount > 0
          ? formatDiscountPriceBadge(line.discountType, line.discountValue, line.discountAmount)
          : undefined,
        addOns: line.addOns.map((addOn) => ({
          id: addOn.id,
          name: addOn.addOnName,
          amount: addOn.lineTotal,
          discountLabel: addOn.discountAmount > 0
            ? formatDiscountPriceBadge(addOn.discountType, addOn.discountValue, addOn.discountAmount)
            : undefined,
        })),
      })),
    })),
  ]
  const printableTicket = order ? (
    <PosTicketPrintPreview
      open={ticketPreviewOpen}
      isPrinting={isReceiptPrinting}
      onPrint={() => {
        const doc = buildPosTicketDocument({ orderNumber: order.orderNumber, completedAtLabel: formatPosDateTime(order.completedAt ?? new Date().toISOString(), currentLanguage), customerName: order.customerName, orderNote: noteInput, groups: printableReceiptGroups,
          noteLabel: t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle'), customerLabel: t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewCustomer') })
        setTicketPreviewOpen(false)
        printReceipt(doc, { jobId: orderId, copies: 1, backPath: POS_FRONT_DESK_ROUTE_PATH, browserOnly: ticketBrowserFallback,
          restore: { surface: 'frontDesk', tab: receiptPrintTab, orderId, mode: 'edit' } })
      }}
      customerName={order.customerName}
      orderNote={noteInput}
      onClose={() => setTicketPreviewOpen(false)}
      orderNumber={order.orderNumber}
      completedAt={order.completedAt}
      groups={printableReceiptGroups}
    />
  ) : null

  const isPaidReceiptPreview = isPaid || Boolean(completedPayment)

  // One builder for every print surface. The grouping, the discount badges and the totals used
  // to be assembled here and again in PosCompletedOrdersPanel; they now live in
  // buildPosReceiptDocument so the preview, the printed paper and a replayed copy cannot differ.
  const receiptDocument = useMemo(
    () =>
      order
        ? buildPosReceiptDocument(
            {
              order,
              business: {
                name: businessName,
                address: businessAddress,
                phone: businessPhone,
              },
              unassignedTechnicianLabel: resolveUnassignedTechnicianLabel(t),
              productsLabel: resolveProductsGroupLabel(t),
              paymentMethodLabel: order.paymentMethodType
                ? getPosCheckoutPaymentMethodLabel(order.paymentMethodType, t)
                : undefined,
              totalsLabels: resolvePosReceiptTotalsLabels(t),
              labels: resolvePosReceiptLabels(t),
              locale: currentLanguage,
            },
            receiptSettings ?? DEFAULT_POS_RECEIPT_SETTINGS,
          )
        : null,
    [order, businessName, businessAddress, businessPhone, receiptSettings, currentLanguage, t],
  )

  // One commit after the intent is set, so the success screen (and the print surface) exist
  // before anything navigates away to PassPRNT.
  useEffect(() => {
    if (!autoPrintIntent) return
    // Assigned before any async work: StrictMode double-invoke, a re-render and a double tap on
    // Complete all have to collapse to a single print.
    if (autoPrintedOrderIdRef.current === autoPrintIntent.orderId) return
    autoPrintedOrderIdRef.current = autoPrintIntent.orderId
    printReceipt(autoPrintIntent.doc, {
      jobId: autoPrintIntent.orderId,
      copies: autoPrintIntent.copies,
      backPath: POS_FRONT_DESK_ROUTE_PATH,
      restore: {
        surface: 'frontDesk',
        tab: receiptPrintTab,
        orderId: autoPrintIntent.orderId,
        mode: 'success',
        receiptMode: 'print',
      },
    })
    setAutoPrintIntent(null)
  }, [autoPrintIntent, printReceipt, receiptPrintTab])

  // The manual Print button has to respect the device transport too. Without this, a salon that
  // paired a Star printer would still get the browser dialog every time someone pressed Print —
  // auto-print would go to the printer while the button beside it did something else.
  //
  // Only wired for PassPRNT: on the browser transport the modal already prints its own DOM, and
  // routing that through the hook would render the receipt twice (once in the modal, once in the
  // off-screen surface) and print both.
  // A failed print leaves the transport untouched — the salon still wants its Star printer — so
  // only this one print falls back, by opening the preview whose button uses window.print().
  const isPrintFallback = Boolean(printFallbackOrderId) && printFallbackOrderId === orderId
  useEffect(() => {
    if (!isPrintFallback) return
    if (mode === 'edit') { setTicketBrowserFallback(true); setTicketPreviewOpen(true) }
    else setPrintPreviewOpen(true)
    onPrintFallbackHandled?.()
  }, [isPrintFallback, onPrintFallbackHandled, mode])

  const handleManualPrint =
    receiptDocument && printTransport === PosPrintTransport.PassPrnt && !isPrintFallback
      ? () =>
          printReceipt(
            { ...receiptDocument, isPaid: isPaidReceiptPreview },
            {
              jobId: orderId,
              copies: 1,
              backPath: POS_FRONT_DESK_ROUTE_PATH,
              restore: {
                surface: 'frontDesk',
                tab: receiptPrintTab,
                orderId,
                mode: isPaidReceiptPreview ? 'success' : 'checkout',
                receiptMode: 'print',
              },
            },
          )
      : undefined

  const printableReceipt = receiptDocument ? (
    <PosReceiptPrintPreview
      open={printPreviewOpen}
      onClose={() => setPrintPreviewOpen(false)}
      doc={{ ...receiptDocument, isPaid: isPaidReceiptPreview }}
      onPrint={handleManualPrint}
    />
  ) : null

  const showCheckoutSuccess = Boolean(order && (
    completedPayment || (mode === 'success' && isPaid)
  ))

  if (showCheckoutSuccess && order) {
    const completedReceiptChoice = completedPayment
      ? receiptChoice
      : successReceiptMode ?? (order.receiptPhone ? 'sms' : 'none')
    const receiptLabel = completedReceiptChoice === 'sms'
      ? t('components.dashboard.views.pos.PosOrderWorkspace.receiptSendSms')
      : completedReceiptChoice === 'print'
        ? t('components.dashboard.views.pos.PosOrderWorkspace.receiptPrint')
        : t('components.dashboard.views.pos.PosOrderWorkspace.receiptNone')
    return (
      <>
        <PosCheckoutSuccessView
          businessName={businessName}
          businessLogoUrl={businessLogoUrl}
          businessAddress={businessAddress}
          businessPhone={businessPhone}
          customerName={order.customerName}
          orderNumber={order.orderNumber}
          paymentMethodLabel={getPosCheckoutPaymentMethodLabel(
            completedPayment ? paymentMethod : order.paymentMethodType,
            t,
          )}
          receiptLabel={receiptLabel}
          receiptWasPrinted={completedReceiptChoice === 'print'}
          total={completedPayment?.totalAmount ?? order.total}
          discountAmount={
            (completedPayment?.discountAmount ?? order.discountAmount)
            + (order.orderDiscountAmount ?? 0)
          }
          tipAmount={completedPayment?.tipAmount ?? order.tipAmount}
          items={completedReceiptItems}
          onReprint={handleOpenPrintPreview}
          onStartNext={() => (onCompleted ?? onClose)?.()}
        />
        {printableReceipt}
    {printableTicket}
        {printSurface}
      </>
    )
  }

  return (
    <>
    <div className="space-y-4">
      <div className="flex items-center gap-3">
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
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">
          {t('components.dashboard.views.pos.PosOrderWorkspace.titleUpdate', {
            orderNumber: order?.orderNumber ?? '',
            customerName: order?.customerName ?? '',
          })}
        </h1>
      </div>

      {isOrderLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          aria-busy={isBusy}
        >
          {catalogPanel}
          {orderPanel}
        </div>
      )}

      <ChangeTechnicianModal
        open={technicianTarget !== null}
        serviceName={technicianTarget?.serviceName ?? ''}
        technicians={technicianTarget ? techniciansForService(technicianTarget.posServiceId) : []}
        isLoading={areTechniciansPending && allTechnicians.length === 0}
        selectedStaffId={technicianTarget?.posStaffProfileId ?? null}
        note={noteDraft}
        onChangeNote={setNoteDraft}
        onSelect={handleSelectTechnician}
        onClose={handleCloseTechnicianModal}
      />

      <ServiceAddOnPickerModal
        open={addOnTarget !== null}
        serviceName={addOnTarget?.serviceName ?? ''}
        options={addOnOptions}
        isLoading={areAddOnOptionsLoading}
        onAdd={handleAddAddOn}
        onClose={() => setAddOnTarget(null)}
      />

      <CustomServiceModal
        target={customServiceTarget}
        isSaving={isBusy}
        technicians={techniciansForService(null)}
        isTechnicianRosterLoading={areTechniciansPending && allTechnicians.length === 0}
        onSubmit={handleSaveCustomService}
        onPickFromMenu={
          customServiceTarget?.serviceLineId
            ? () => {
                const target = customServiceTarget
                setCustomServiceTarget(null)
                setChangeServiceTarget({
                  serviceLineId: target.serviceLineId as string,
                  serviceName: target.customServiceName ?? '',
                  posServiceId: null,
                  addOnCount: 0,
                })
              }
            : undefined
        }
        onClose={() => {
          if (isBusy) return
          setCustomServiceTarget(null)
        }}
      />

      <ChangeServiceModal
        open={changeServiceTarget !== null}
        serviceName={changeServiceTarget?.serviceName ?? ''}
        addOnCount={changeServiceTarget?.addOnCount ?? 0}
        services={serviceCatalog}
        isPending={isBusy}
        onSelect={handleChangeService}
        onPickCustom={() => {
          const target = changeServiceTarget
          if (!target) return
          setChangeServiceTarget(null)
          setCustomServiceTarget({ serviceLineId: target.serviceLineId })
        }}
        onClose={() => {
          if (isBusy) return
          setChangeServiceTarget(null)
        }}
      />

      <ServiceDiscountModal
        target={discountTarget}
        isSaving={isBusy}
        onSubmit={handleSaveDiscount}
        onRemove={handleRemoveDiscount}
        onClose={() => {
          if (isBusy) return
          setDiscountTarget(null)
        }}
      />

      {customerFacingMode && order ? (
        <div className="fixed inset-0 z-[70] flex flex-col bg-nexoraSurface p-6">
          <div className="relative flex-1 space-y-6 overflow-y-auto text-center">
            <p className="text-lg font-bold text-nexoraText">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingTitle')}
            </p>
            <p className="text-sm text-nexoraMuted">
              {t('components.dashboard.views.pos.PosOrderWorkspace.customerFacingSubtitle')}
            </p>
            <div className="relative mx-auto flex max-w-md flex-wrap justify-center gap-4">
              <TicketActionSkeletonOverlay
                visible={isTipBusy}
                label={mutationSkeletonLabel}
                count={TICKET_SKELETON_ROW_COUNT.tip}
              />
              <button
                type="button"
                onClick={() => applyTip('noTip', 0)}
                disabled={isBusy}
                className={`inline-flex h-20 min-w-[132px] flex-[1_1_132px] items-center justify-center whitespace-nowrap rounded-2xl border-2 text-lg font-black disabled:cursor-not-allowed disabled:opacity-60 ${
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
                disabled={isBusy}
                className={`inline-flex h-20 min-w-[120px] flex-[1_1_120px] items-center justify-center whitespace-nowrap rounded-2xl border-2 text-2xl font-black disabled:cursor-not-allowed disabled:opacity-60 ${
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
                disabled={isBusy}
                className={`inline-flex h-20 min-w-[120px] flex-[1_1_120px] items-center justify-center whitespace-nowrap rounded-2xl border-2 text-2xl font-black disabled:cursor-not-allowed disabled:opacity-60 ${
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
                disabled={isBusy}
                className={`inline-flex h-20 min-w-[120px] flex-[1_1_120px] items-center justify-center whitespace-nowrap rounded-2xl border-2 text-2xl font-black disabled:cursor-not-allowed disabled:opacity-60 ${
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
                disabled={isBusy}
                className={`inline-flex h-20 min-w-[120px] flex-[1_1_120px] items-center justify-center whitespace-nowrap rounded-2xl border-2 text-2xl font-black disabled:cursor-not-allowed disabled:opacity-60 ${
                  tipMode === 'pct20'
                    ? 'border-nexoraBrand bg-nexoraBrand text-white'
                    : 'border-nexoraBorder text-nexoraText'
                }`}
              >
                20%
              </button>
            </div>
            <div className="mx-auto max-w-md">
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-lg font-medium text-nexoraMuted">
                  $
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  value={customTipInput}
                  onChange={(e) => setCustomTipInput(
                    sanitizeDirectPaymentAmountInput(e.target.value, Number.MAX_SAFE_INTEGER),
                  )}
                  onFocus={() => setTipMode('custom')}
                  onBlur={handleCustomTipCommit}
                  disabled={isBusy}
                  placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.customTipPlaceholder')}
                  className={`h-14 w-full rounded-2xl border-2 pl-10 pr-4 text-xl text-nexoraText outline-none ${
                    tipMode === 'custom' ? 'border-nexoraBrand' : 'border-nexoraBorder'
                  }`}
                />
              </div>
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
    {mismatchWarning ? (
      <ServiceLineMismatchWarningModal
        kind={mismatchWarning.kind}
        affectedLines={mismatchWarning.lines}
        isBusy={isBusy}
        onCancel={() => setMismatchWarning(null)}
        onConfirm={() => {
          const run = mismatchWarning.onConfirm
          setMismatchWarning(null)
          run()
        }}
      />
    ) : null}
    {printableReceipt}
    {printableTicket}
    {printSurface}
    </>
  )
}
