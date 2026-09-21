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
import { ArrowLeft, Loader2, Package, UserRound, X, Printer, ClipboardCheck, Camera, Image as ImageIcon, Phone, DollarSign, ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { TechnicianOption } from '../../../checkin/parts/TechnicianPickerGrid'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorMessage } from '../../../../data/errorCodes'
import { posCheckoutRepository } from '../../../../data/repositories/posCheckout'
import CameraCaptureModal from '../../../ui/CameraCaptureModal'
import ImageFileInput from '../../../ui/ImageFileInput'
import IconButton from '../../../ui/IconButton'
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
  useSetOrderPaymentAllocations,
  useSetOrderServiceLineDiscount,
  useUpdateOrderServiceLine,
  useEligiblePromotions,
  useSetOrderDiscount,
  useSetOrderNote,
  useSetOrderStaffTipSplit,
  useSetOrderPaymentMethod,
  useSetOrderTip,
  useUpdateOrderProductLineQuantity,
} from '../../../../data/hooks/usePosCheckout'
import {
  useAssignStaffToServiceLine,
  useMarkServiceLineDone,
  useSaveOrderServiceLineAssignments,
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
import { useTurnBoard } from '../../../../data/hooks/usePosTurnBoard'
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
  SetOrderPaymentAllocationsPayload,
  CompleteOrderResultApiDto,
} from '../../../../types/repositories'
import { Skeleton, SkeletonList, SkeletonListItem } from '../../../ui/skeleton'
import { maskCustomerPhone } from './customer/customerFormatters'
import CustomerVisitTag from './CustomerVisitTag'
import OrderCustomerDetailButton from './customer/OrderCustomerDetailButton'
import PosServiceCatalogPanel from './PosServiceCatalogPanel'
import TicketActionSkeletonOverlay, { TICKET_SKELETON_ROW_COUNT } from './TicketActionSkeletonOverlay'
import ChangeServiceModal from './modals/ChangeServiceModal'
import CustomServiceModal from './modals/CustomServiceModal'
import type { CustomServiceSubmit, CustomServiceTarget } from './modals/CustomServiceModal'
import ServiceAddOnPickerModal from './modals/ServiceAddOnPickerModal'
import ServiceCatalogPickerModal from './modals/ServiceCatalogPickerModal'
import TipModal from './modals/TipModal'
import OrderDiscountSection from './OrderDiscountSection'
import { sortTicketServiceLines } from './posTicketLineOrder'
import ServiceDiscountModal, {
  type ServiceDiscountSubmit,
  type ServiceDiscountTarget,
} from './modals/ServiceDiscountModal'
import ChangeTechnicianModal from './modals/ChangeTechnicianModal'
import { formatPosDateTime } from './posDateTime'
import { useTicketActionLock } from './useTicketActionLock'
import PosPaymentMethodSelector from './PosPaymentMethodSelector'
import PosQuickSplitPanel from './PosQuickSplitPanel'
import { reallocateTip } from './posPaymentAllocations'
import {
  getPosCheckoutPaymentMethodLabel,
  isPosCheckoutPaymentMethod,
  POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS,
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
import { formatPaymentMethodDisplay } from './posDisplay'
import { usePosReceiptPrint } from './receipt/usePosReceiptPrint'
import type { PosReceiptDocument } from '../../../../types/domain'
import { PosFrontDeskTab } from '../../../../constants/posFrontDesk'
import { DASHBOARD_MENU_ID } from '../../constants'
import { DEFAULT_POS_RECEIPT_SETTINGS, PosPrintTransport } from '../../../../constants/posPrinter'
import { usePosReceiptSettings, usePosTicketPrinted } from '../../../../data/hooks/usePosPrinterSettings'
import { getLocalDayWindow } from './timeclock/timeClockDay'
import { selectNextTurnStation } from './posNextTurn'
import type { PosReceiptMode } from './posWorkspaceUrl'
import { todayIso as reportTodayIso } from './report/posReportPeriod'

export type TipMode = 'noTip' | 'fixed10' | 'fixed15' | 'pct10' | 'pct20' | 'custom'
// Which of the three Tip modal options is active: no tip, one amount split evenly across the
// ticket's technicians, or an amount picked separately per technician.
export type TipPanelMode = 'noTip' | 'even' | 'perStaff'
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

// Long enough to swallow a run through the chip row, short enough that stepping away right after
// the last tap still writes before the cashier can reach anything that reads the order back.
const PAYMENT_METHOD_SAVE_DELAY_MS = 500

const MAX_NOTE_PHOTOS = 5

// Split amounts are compared in whole cents: a split that is one cent out has to read as one cent
// out, and float dollars cannot be trusted to say so.
function toPaymentCents(amount: number) {
  return Math.round(amount * 100)
}

function isRedundantEstimateLineNote(note: string | undefined, orderNote: string) {
  // Older Estimate tickets saved this boilerplate on every quantity unit. Suppress only
  // the exact persisted format when the shared quote is present; leave stored notes intact.
  return /^Estimated unit price: \$\d+\.\d{2}\. Confirm at checkout\.$/.test(note?.trim() ?? '')
    && /^Service estimate: subtotal \$\d+\.\d{2}; discount (?:\d+(?:\.\d+)?%|\$\d+\.\d{2}) \(\$\d+\.\d{2}\); estimated total \$\d+\.\d{2}\. Tax and tip excluded\. Confirm final prices and discount at checkout\.$/.test(orderNote.trim())
}

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

/** A technician (or "First available") picked on a line but not yet confirmed. */
type DraftAssignment = {
  staffId: string | null
  displayName: string | null
  note: string
}

// Always the confirmed technician, never a staged pick: until Assign Services is pressed the line
// still belongs to whoever is on it, and the ticket has to say so (#1569). A staged pick shows as
// its own badge on the row instead.
function lineTechnicianDisplay(line: DisplayServiceLine) {
  return {
    isFirstAvailable: !line.technicianName,
    technicianName: line.technicianName,
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
  isNewCustomer,
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
  receiptPrintBackPath = POS_FRONT_DESK_ROUTE_PATH,
  printFallbackOrderId = null,
  onPrintFallbackHandled,
  initialTicketNote,
}: {
  businessId: string
  orderId: string
  isNewCustomer?: boolean
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
  receiptPrintBackPath?: string
  // Order whose PassPRNT print just failed. The preview opens on it so the operator can fall
  // back to the browser dialog without going anywhere.
  printFallbackOrderId?: string | null
  onPrintFallbackHandled?: () => void
  initialTicketNote?: string
}) {
  const { t, currentLanguage } = useTranslation()
  // Device-local receipt options (what to print, how many copies). Read here rather than at
  // print time so the document is already shaped correctly for the preview the operator sees.
  const { data: receiptSettings } = usePosReceiptSettings()
  const { data: ticketWasPrinted } = usePosTicketPrinted(businessId, orderId)
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
  // AssignStaffToServiceLine only accepts a Waiting or InService order.
  const canEditLines =
    order?.status === PosOrderStatus.Waiting || order?.status === PosOrderStatus.InService
  const notePhotos = order?.notePhotoUrls ?? []
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
  const saveServiceLineAssignments = useSaveOrderServiceLineAssignments(businessId)
  const setServiceLineDiscount = useSetOrderServiceLineDiscount(businessId)
  const addServiceAddOnLine = useAddOrderServiceAddOnLine(businessId)
  const removeServiceAddOnLine = useRemoveOrderServiceAddOnLine(businessId)
  const startOrderService = useStartOrderService(businessId)
  const startServiceLine = useStartServiceLine(businessId)
  const markServiceLineDone = useMarkServiceLineDone(businessId)
  const orderSettings = useOrderSettings(businessId)
  const setOrderDiscount = useSetOrderDiscount(businessId)
  const setTip = useSetOrderTip(businessId)
  const setOrderPaymentMethod = useSetOrderPaymentMethod(businessId)

  // Picking a chip is instant on screen — the selection is local state — so the write behind it is
  // coalesced rather than fired per tap. A cashier flicking Cash → Card → Split Pay leaves one
  // request, not three, and nothing on screen waits for any of them.
  const pendingPaymentMethodRef = useRef<PosCheckoutPaymentMethodType | null>(null)
  const paymentMethodSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearPaymentMethodSave = () => {
    if (paymentMethodSaveTimerRef.current !== null) clearTimeout(paymentMethodSaveTimerRef.current)
    paymentMethodSaveTimerRef.current = null
    pendingPaymentMethodRef.current = null
  }

  const flushPaymentMethodSave = () => {
    const pending = pendingPaymentMethodRef.current
    clearPaymentMethodSave()
    if (pending === null) return
    // A failed write costs only the persistence — the chip on screen still drives Pay — so it
    // reports itself without pulling the cashier out of the checkout.
    setOrderPaymentMethod.mutate({ orderId, paymentMethodType: pending }, { onError: reportError })
  }

  const queuePaymentMethodSave = (value: PosCheckoutPaymentMethodType) => {
    // Landing back on what the order already holds cancels the pending write instead of sending a
    // request that would change nothing.
    if (order?.paymentMethodType === value) {
      clearPaymentMethodSave()
      return
    }
    pendingPaymentMethodRef.current = value
    if (paymentMethodSaveTimerRef.current !== null) clearTimeout(paymentMethodSaveTimerRef.current)
    paymentMethodSaveTimerRef.current = setTimeout(flushPaymentMethodSave, PAYMENT_METHOD_SAVE_DELAY_MS)
  }

  // Read through a ref so the unmount cleanup below runs the current closure rather than the one
  // captured on first render, without re-subscribing on every keystroke elsewhere in the screen.
  const flushPaymentMethodSaveRef = useRef(flushPaymentMethodSave)
  flushPaymentMethodSaveRef.current = flushPaymentMethodSave

  // Leaving the checkout is the cashier finishing with the chip, so the pending choice is written
  // rather than dropped — otherwise a tap followed straight by Back would be silently lost.
  useEffect(() => () => flushPaymentMethodSaveRef.current(), [])
  const setNote = useSetOrderNote(businessId)
  const setStaffTipSplit = useSetOrderStaffTipSplit(businessId)
  const setPaymentAllocations = useSetOrderPaymentAllocations(businessId)
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
    saveServiceLineAssignments.isPending ||
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
    technicianName?: string
    note?: string
  } | null>(null)
  const technicianTurnWindow = getLocalDayWindow(new Date(), businessTimeZone?.trim() || 'America/Chicago')
  // Warm the shared next-turn data while the operator reviews the ticket, before opening a picker.
  const technicianTurnRosterQuery = useTimeClockRoster(businessId, technicianTurnWindow, {
    enabled: canEditLines,
    refetchInterval: 5000,
  })
  const technicianTurnBoardQuery = useTurnBoard(businessId, {
    enabled: canEditLines,
    refetchInterval: 5000,
  })
  const technicianNextTurnBalanceQuery = usePosNextTurnBalance(
    businessId,
    reportTodayIso(businessTimeZone || 'America/Chicago'),
    businessTimeZone,
    canEditLines && canViewReport,
  )
  const [noteDraft, setNoteDraft] = useState('')
  // Technician picks the front desk has made but not confirmed yet, keyed by service line (#1569).
  // Nothing here has been written, and nobody has been notified — pressing Assign Services is what
  // does both, so changing one's mind costs a technician nothing.
  const [draftAssignments, setDraftAssignments] = useState<Record<string, DraftAssignment>>({})
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
  // Open when picking from the full service catalog on the checkout screen — the catalog moved
  // into this modal once the left column started showing Tip/Payment/Summary/Pay instead.
  const [isServicePickerOpen, setIsServicePickerOpen] = useState(false)
  // Ticket Detail now renders above the catalog/payment column on phone (<768px), so it can push
  // that column below the fold. Letting it collapse there gives the line items room without
  // affecting the tablet/desktop layout, where it always stays expanded.
  const [isTicketDetailCollapsed, setIsTicketDetailCollapsed] = useState(false)
  // The line whose "+ Add-On" picker is open. Held as id + name so the picker can title itself and
  // scope its own query without reaching back into the list.
  const [addOnTarget, setAddOnTarget] = useState<{ serviceLineId: string; serviceName: string } | null>(null)
  // The line whose discount is being edited. Carries the figures the popup previews with, so it
  // never has to reach back into the list while the order refetches underneath it.
  const [discountTarget, setDiscountTarget] = useState<ServiceDiscountTarget | null>(null)
  const [tipMode, setTipMode] = useState<TipMode>('noTip')
  // The Tip row on the checkout screen is one compact button; the three ways to set a tip live in
  // the modal it opens, so which of them is showing has to be tracked here rather than derived from
  // the button itself.
  const [isTipModalOpen, setIsTipModalOpen] = useState(false)
  const [tipPanelMode, setTipPanelMode] = useState<TipPanelMode>('noTip')
  const [noteInput, setNoteInput] = useState('')
  const [isUploadingNotePhoto, setIsUploadingNotePhoto] = useState(false)
  const [isNoteCameraOpen, setIsNoteCameraOpen] = useState(false)
  const [previewNotePhoto, setPreviewNotePhoto] = useState<string | null>(null)
  const notePhotoActionPending = isBusy || isUploadingNotePhoto || setNote.isPending
  const notePhotoControlsDisabled = notePhotoActionPending || notePhotos.length >= MAX_NOTE_PHOTOS
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  // Quick Split is a sub-screen of checkout, not a mode of it: the split is built there and the
  // payment is still confirmed once by the Pay button here. Unmounting it on close is deliberate —
  // the next open re-reads the saved draft from the order instead of showing stale local edits.
  const [isQuickSplitOpen, setIsQuickSplitOpen] = useState(false)
  const [cashReceived, setCashReceived] = useState('')
  const cashReceivedWasEditedRef = useRef(false)
  const [completedPayment, setCompletedPayment] = useState<CompleteOrderResultApiDto | null>(null)
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
  const restoredTicketNoteKeyRef = useRef<string | null>(null)
  const ticketNoteEditedRef = useRef(false)
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
  // (see handlers below). The reading order is decided here rather than by the backend: the
  // customer receipt groups the same lines by its own rule, and the query feeds that too.
  const visibleLines: DisplayLine[] = useMemo(() => {
    if (!order) return []
    const idsBeforeAdd = serviceLineIdsBeforeAddRef.current
    const hideInFlightAdd = showAddLinePlaceholder && idsBeforeAdd !== null
    return [
      ...sortTicketServiceLines(
        order.serviceLines.filter((l) => isPersistedLineId(l.id) && (!hideInFlightAdd || idsBeforeAdd.has(l.id))),
      )
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

  // Which service lines open a technician's block. The list is already grouped by technician
  // (sortTicketServiceLines), so a heading belongs wherever the name changes from the line above —
  // and the name each row shows, pending assignment included, is the one that decides it.
  const technicianHeadingByLineKey = useMemo(() => {
    const headings = new Map<string, string>()
    let group: { key: string; label: string; count: number } | null = null

    for (const line of visibleLines) {
      if (line.itemType !== 'Service') {
        group = null
        continue
      }
      const { technicianName } = lineTechnicianDisplay(line)
      const label = technicianName
        ? `${t('components.dashboard.views.pos.PosOrderWorkspace.technicianPrefix')} ${technicianName}`
        : t('components.dashboard.views.pos.PosOrderWorkspace.needsTechnician')
      if (!group || group.label !== label) group = { key: line.key, label, count: 0 }
      group.count += 1
      headings.set(group.key, `${label} (${group.count})`)
    }

    return headings
  }, [visibleLines, t])

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
  // Who the Tip modal can split a tip between. Read off the ticket's own lines rather than
  // order.staffTipShares — that array only carries technicians the backend has already resolved a
  // tip share for, so a ticket nobody has tipped yet (or just reassigned) can list fewer people
  // than are actually working it, right when the cashier needs to see all of them.
  const ticketTechnicians = useMemo(() => {
    const names = new Map<string, string>()
    for (const line of visibleLines) {
      if (line.itemType !== 'Service' || !line.posStaffProfileId || !line.technicianName) continue
      names.set(line.posStaffProfileId, line.technicianName)
    }
    return Array.from(names, ([posStaffProfileId, technicianName]) => ({
      posStaffProfileId,
      technicianName,
      photoUrl: allTechnicians.find((tech) => tech.posStaffProfileId === posStaffProfileId)?.photoUrl,
    }))
  }, [visibleLines, allTechnicians])
  const isTechnicianRosterLoading = areTechniciansPending || areTechniciansFetching
  // Ticket Detail placeholder and catalog pending share `isAddingLine` so one panel cannot
  // finish while the other is still locked. Initial sole-technician skill load uses pending
  // (empty roster), not background refetch, to avoid greying the catalog after the ticket is idle.
  const isServiceCatalogPending =
    isAddingLine || (assignedTechnicianIds.length === 1 && areTechniciansPending && allTechnicians.length === 0)

  // A staged pick only means something against the line it was made on. The ticket is polled and
  // other people work it, so a draft whose line is gone — or whose technician somebody else has
  // already set — is dropped rather than replayed over their work when Assign Services is pressed.
  useEffect(() => {
    if (!order) return
    setDraftAssignments((previous) => {
      const stillPending = Object.entries(previous).filter(([serviceLineId, draft]) => {
        const line = order.serviceLines.find((serviceLine) => serviceLine.id === serviceLineId)
        if (!line) return false
        return (line.assignedPosStaffProfileId ?? null) !== draft.staffId
          || (line.note ?? '').trim() !== draft.note
      })
      if (stillPending.length === Object.keys(previous).length) return previous
      return Object.fromEntries(stillPending)
    })
  }, [order])

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
    if (initializedWorkspaceRef.current === workspaceKey) {
      // The parent may recover the print draft after this cached order has hydrated.
      // Apply it once, without overwriting any edits made since returning.
      if (mode === 'edit' && initialTicketNote !== undefined
        && restoredTicketNoteKeyRef.current !== workspaceKey) {
        restoredTicketNoteKeyRef.current = workspaceKey
        if (!ticketNoteEditedRef.current) setNoteInput(initialTicketNote)
      }
      return
    }
    initializedWorkspaceRef.current = workspaceKey
    ticketNoteEditedRef.current = false
    restoredTicketNoteKeyRef.current = mode === 'edit' && initialTicketNote !== undefined ? workspaceKey : null

    // Status never reveals checkout information by itself. An InService order reached through
    // Edit still opens as an operational ticket; only an explicit Checkout entry reveals payment.
    setShowPaymentSection(mode === 'checkout' && !isPaid)
    setNoteInput(mode === 'edit' ? initialTicketNote ?? order.note ?? '' : order.note ?? '')
    if (mode !== 'success') {
      setReceiptChoice('none')
      // The chip the cashier picked is stored on the order, so reopening checkout shows their
      // choice rather than dropping back to the Cash default. Saved portions are the fallback:
      // orders split before the method was persisted carry allocations but no method of their own.
      setPaymentMethod(
        isPosCheckoutPaymentMethod(order.paymentMethodType)
          ? order.paymentMethodType
          : order.paymentAllocations.length > 0
            ? PosCheckoutPaymentMethod.SplitPay
            : PosCheckoutPaymentMethod.Cash,
      )
      cashReceivedWasEditedRef.current = false
      setCashReceived(formatUsdInputAmount(order.total))
      setCompletedPayment(null)
    }

    if (order.tipAmount === 0) {
      setTipMode('noTip')
      setTipPanelMode('noTip')
    } else {
      const subtotal = order.servicesSubtotal
      const pct10 = subtotal > 0 ? round2(subtotal * TIP_PERCENT_BY_MODE.pct10!) : -1
      const pct20 = subtotal > 0 ? round2(subtotal * TIP_PERCENT_BY_MODE.pct20!) : -1
      if (order.tipAmount === 10) setTipMode('fixed10')
      else if (order.tipAmount === 15) setTipMode('fixed15')
      else if (order.tipAmount === pct10) setTipMode('pct10')
      else if (order.tipAmount === pct20) setTipMode('pct20')
      else setTipMode('custom')

      // Guessed rather than tracked server-side: an equal split across every technician on the
      // ticket opens back into "Chia đều", anything else (a prior custom save) opens into
      // "Tip riêng từng thợ" with those amounts already in place.
      const shares = order.staffTipShares
      const evenShare = shares.length > 0 ? round2(order.tipAmount / shares.length) : 0
      const isEvenSplit = shares.every((share) => Math.abs(share.tipAmount - evenShare) < 0.01)
      setTipPanelMode(isEvenSplit ? 'even' : 'perStaff')
    }
  }, [order, mode, isPaid, initialTicketNote])

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

  // Validity is read off the saved draft on the order, not off local state — the Pay button has to
  // judge exactly what the server will be asked to complete. Mirrors the checks in
  // PosOrderCheckout.ApplyPaymentAllocationsAsync so the cashier is stopped here rather than by a
  // rejected request after the tap.
  const splitAllocations = order?.paymentAllocations ?? []
  const orderTotalCents = order ? toPaymentCents(order.total) : 0
  const splitAllocatedCents = splitAllocations.reduce(
    (sum, allocation) => sum + toPaymentCents(allocation.amount),
    0,
  )
  const splitTipCents = order ? toPaymentCents(order.tipAmount) : 0
  const splitTipAttributedCents = splitAllocations.reduce(
    (sum, allocation) => sum + toPaymentCents(allocation.tipAmount),
    0,
  )
  const splitTipBearerCount = splitAllocations.filter((allocation) => allocation.tipAmount > 0).length
  const splitCashCovered = splitAllocations.every((allocation) =>
    allocation.paymentMethodType !== PosCheckoutPaymentMethod.Cash
    || (allocation.cashReceived != null
      && toPaymentCents(allocation.cashReceived) >= toPaymentCents(allocation.amount)))
  const isSplitPaymentReady = paymentMethod !== PosCheckoutPaymentMethod.SplitPay
    || (splitAllocations.length >= 2
      && splitAllocatedCents === orderTotalCents
      && splitTipAttributedCents === splitTipCents
      && (splitTipCents === 0 || splitTipBearerCount === 1)
      && splitCashCovered)

  // Every blocker above used to share one sentence about the total, which sent the cashier to
  // re-check amounts that were already correct. Each condition now names itself.
  const splitBlockMessage = (() => {
    if (isSplitPaymentReady) return null
    if (splitAllocations.length < 2) return t('components.dashboard.views.pos.PosQuickSplitPanel.needTwoMethods')
    if (splitAllocatedCents !== orderTotalCents) {
      const unallocatedCents = orderTotalCents - splitAllocatedCents
      return unallocatedCents > 0
        ? t('components.dashboard.views.pos.PosQuickSplitPanel.short', { amount: formatUsdAmount(unallocatedCents / 100) })
        : t('components.dashboard.views.pos.PosQuickSplitPanel.over', { amount: formatUsdAmount(-unallocatedCents / 100) })
    }
    if (!splitCashCovered) return t('components.dashboard.views.pos.PosQuickSplitPanel.cashNotCovered')
    return t('components.dashboard.views.pos.PosQuickSplitPanel.tipNotAttributed')
  })()

  // The same filter PosPaymentMethodSelector applies to the chip row, minus Split Pay itself —
  // that value labels the order, it is never one of the portions.
  const availableSplitMethods = useMemo(() => {
    const core: PosCheckoutPaymentMethodType[] = [
      PosCheckoutPaymentMethod.Cash,
      PosCheckoutPaymentMethod.Card,
      PosCheckoutPaymentMethod.GiftCard,
    ]
    const configured = receivePaymentMethods
      .filter((method) => method.isActive && method.isConfigured && isPosCheckoutPaymentMethod(method.type))
      .map((method) => method.type as PosCheckoutPaymentMethodType)
      .filter((method) => !core.includes(method) && method !== PosCheckoutPaymentMethod.SplitPay)
    return [...core, ...Array.from(new Set(configured))]
  }, [receivePaymentMethods])

  // The chosen method is recorded only on the portion carrying the tip, so clearing the tip to
  // zero erases it. Remembered per order while this screen stays open, so No Tip followed by a
  // new tip still lands where the cashier said rather than sending them back into Quick Split.
  const savedTipBearerMethod = order?.paymentAllocations
    .find((allocation) => allocation.tipAmount > 0)?.paymentMethodType
  const lastTipBearerRef = useRef<{ orderId: string; method: string } | null>(null)
  useEffect(() => {
    if (savedTipBearerMethod) lastTipBearerRef.current = { orderId, method: savedTipBearerMethod }
  }, [orderId, savedTipBearerMethod])

  // Once the cashier has said which method the tip arrives through, a tip edited on this screen
  // re-places itself — reopening Quick Split only to press Save again is work the screen can do.
  // Covers every path that moves the tip, including the percentage effect below re-applying a %
  // after a service is added, which changes the tip without anyone touching the tip controls.
  const reconciledSplitRef = useRef<string | null>(null)
  useEffect(() => {
    if (!order || paymentMethod !== PosCheckoutPaymentMethod.SplitPay) return
    // Quick Split does this itself while open, and writing underneath it would leave the amounts
    // on screen disagreeing with what the dialog thinks is saved.
    if (isQuickSplitOpen || isBusy || setPaymentAllocations.isPending) return

    const rememberedBearer = lastTipBearerRef.current?.orderId === orderId
      ? lastTipBearerRef.current.method
      : null
    const payload = reallocateTip(order.paymentAllocations, order.tipAmount, rememberedBearer)
    if (!payload) {
      reconciledSplitRef.current = null
      return
    }

    // One attempt per distinct split: a rejected write must not turn into a retry loop driven by
    // the refetch it triggers.
    const signature = JSON.stringify(payload)
    if (reconciledSplitRef.current === signature) return
    reconciledSplitRef.current = signature
    setPaymentAllocations.mutate({ orderId, payload }, { onError: reportError })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [order?.tipAmount, order?.paymentAllocations, paymentMethod, isQuickSplitOpen, isBusy,
    setPaymentAllocations.isPending, orderId])

  // Closes only once the server has taken the split. On a rejected save the dialog stays open
  // with the cashier's amounts still on screen and the reason in a toast, rather than vanishing
  // and taking the work with it.
  const handleSaveSplit = (payload: SetOrderPaymentAllocationsPayload) => {
    setPaymentAllocations.mutate({ orderId, payload }, {
      onSuccess: () => setIsQuickSplitOpen(false),
      onError: reportError,
    })
  }
  const draftSubtotal = visibleLines.reduce(
    (sum, l) => sum + lineTotalAfterDiscount(l) + addOnsTotalAfterDiscount(l),
    0,
  )

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
    const stations = technicianTurnBoardQuery.data ?? []
    const nextTurnTechnician = !technicianTurnBoardQuery.isError && !technicianTurnRosterQuery.isError
      ? selectNextTurnStation(
          stations.filter(station => eligibleTechnicianIds.has(station.posStaffProfileId)),
          rosterRows,
          technicianNextTurnBalanceQuery.data?.availableSince,
        )
      : undefined

    return eligibleTechnicians.map((technician) => {
      const station = stations.find(row => row.posStaffProfileId === technician.posStaffProfileId)
      const rosterRow = rosterRows.find(row => row.posStaffProfileId === technician.posStaffProfileId)
      return {
        ...technician,
        isBusy: station ? station.currentStatus === PosOrderStatus.InService
          : rosterRow ? Boolean(rosterRow.currentOrderId) : technician.isBusy,
        // All weighted turns assigned today, including completed and provisional services.
        assignedTurns: station?.weightedTurnsToday ?? rosterRow?.weightedTurnsToday,
        // Completed ticket counts cannot represent weighted turns completed today.
        isNextTurn: technician.posStaffProfileId === nextTurnTechnician?.posStaffProfileId,
      }
    })
  }

  const noteLines = visibleLines.filter(
    (l): l is DisplayServiceLine => l.itemType === 'Service' && Boolean(l.note?.trim())
      && !isRedundantEstimateLineNote(l.note, noteInput),
  )

  const reportError = (err: unknown) => {
    showToast(getErrorMessage(err, t, 'ERROR'), 'error')
  }

  // What the ticket's own technician pickers offer: the qualified roster, plus anyone already on
  // this ticket who has since clocked out. The backend keeps those assignable on the order they are
  // already working (PosStaffAssignmentResolver), so hiding them would leave the front desk unable
  // to move a line back to the technician actually doing it. Every other off-shift technician stays
  // out, and a technician who is on shift but not trained for the service stays out too — that is a
  // skill rule, not a shift one.
  const technicianOptionsForTicket = (posServiceId: string | null): TechnicianOption[] => {
    const qualified = techniciansForService(posServiceId)
    const rosterIds = new Set(allTechnicians.map((tech) => tech.posStaffProfileId))
    const offShiftOnTicket = assignedTechnicianIds
      .filter((staffId) => !rosterIds.has(staffId))
      .map((staffId) => ({
        posStaffProfileId: staffId,
        displayName: technicianDisplayName(staffId) ?? '',
        isOffShift: true,
      }))
      .filter((option) => option.displayName !== '')
    return [...qualified, ...offShiftOnTicket]
  }

  // Whether the ticket's technician may take one more service. Absence from the roster is not a
  // "no": it only lists technicians who are clocked in, and a shift ends (or PosStaffClockAutoCloseJob
  // ends it) while the customer is still in the chair — the ticket already names who is doing the
  // work. Only a technician the roster does list is held to their assigned services.
  const canTechnicianTakeService = (staffId: string, posServiceId: string) => {
    const rosterEntry = allTechnicians.find((tech) => tech.posStaffProfileId === staffId)
    return !rosterEntry || rosterEntry.serviceIds.includes(posServiceId)
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
            (staffId) => canTechnicianTakeService(staffId, service.id),
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

  // The target carries the CONFIRMED values, which is what a staged pick is measured against:
  // picking the technician the line already has clears the draft instead of queueing a no-op.
  const openTechnicianModal = (line: DisplayServiceLine) => {
    if (isBusy || !isPersistedLineId(line.existingId)) return
    const draft = draftAssignments[line.existingId]
    setTechnicianTarget({
      serviceLineId: line.existingId,
      serviceName: line.serviceName,
      posServiceId: line.posServiceId,
      posStaffProfileId: line.posStaffProfileId,
      technicianName: line.technicianName,
      note: line.note,
    })
    setNoteDraft(draft?.note ?? line.note ?? '')
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

  // Roster first, then the ticket's own lines: an off-shift technician is no longer in the roster,
  // and this name feeds the optimistic patch — "First available" flashing over work that already has
  // a technician reads as a lost assignment.
  const technicianDisplayName = (staffId: string | null | undefined) => {
    if (!staffId) return null
    const rosterName = allTechnicians.find((tech) => tech.posStaffProfileId === staffId)?.displayName
    if (rosterName) return rosterName
    const assignedLine = visibleLines.find(
      (line): line is DisplayServiceLine => line.itemType === 'Service' && line.posStaffProfileId === staffId,
    )
    return assignedLine?.technicianName ?? null
  }

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

  // Staging, not saving (#1569). Landing back on the line's confirmed technician and note drops
  // the draft entirely, so a change of mind that ends where it started confirms nothing and
  // notifies nobody.
  const stageAssignment = (
    target: { serviceLineId: string; posStaffProfileId?: string; note?: string },
    posStaffProfileId: string | null,
    note: string,
  ) => {
    const trimmedNote = note.trim()
    const sameTechnician = posStaffProfileId === (target.posStaffProfileId ?? null)
    const sameNote = trimmedNote === (target.note ?? '').trim()

    setDraftAssignments((previous) => {
      if (sameTechnician && sameNote) {
        if (!(target.serviceLineId in previous)) return previous
        const { [target.serviceLineId]: _dropped, ...rest } = previous
        return rest
      }
      return {
        ...previous,
        [target.serviceLineId]: {
          staffId: posStaffProfileId,
          displayName: technicianDisplayName(posStaffProfileId),
          note: trimmedNote,
        },
      }
    })
  }

  const handleSelectTechnician = (posStaffProfileId: string | null) => {
    const target = technicianTarget
    if (!target) return
    setTechnicianTarget(null)
    stageAssignment(target, posStaffProfileId, noteDraft)
  }

  // Closing without picking anyone still keeps a note the operator typed — it stages against
  // whoever the line already had, since the endpoint writes both fields together.
  const handleCloseTechnicianModal = () => {
    const target = technicianTarget
    if (!target) return
    setTechnicianTarget(null)
    const staged = draftAssignments[target.serviceLineId]
    stageAssignment(target, staged ? staged.staffId : target.posStaffProfileId ?? null, noteDraft)
  }

  // The picker re-opens on what the front desk last chose, staged or confirmed. A staged "First
  // available" is a real answer, so this cannot collapse into a ?? chain.
  const stagedTechnicianTarget = technicianTarget
    ? draftAssignments[technicianTarget.serviceLineId]
    : undefined
  const technicianModalSelectedStaffId = stagedTechnicianTarget
    ? stagedTechnicianTarget.staffId
    : technicianTarget?.posStaffProfileId ?? null

  const draftAssignmentCount = Object.keys(draftAssignments).length
  const hasDraftAssignments = draftAssignmentCount > 0

  const handleDiscardAssignments = () => setDraftAssignments({})

  // Starting, checking out and completing all read the ticket — who is on the clock for it, what
  // gets paid out — so they cannot run on picks the front desk has not confirmed yet.
  const blockedByStagedAssignments = () => {
    if (!hasDraftAssignments) return false
    showToast(t('components.dashboard.views.pos.PosOrderWorkspace.confirmAssignmentsFirst'), 'error')
    return true
  }

  // Staged picks live only in this screen, so every way out of it — Back, another Front Desk tab, a
  // route change — drops them. Warned from the unmount path rather than from the Back button alone:
  // the front desk must never walk away believing technicians were told something they were not.
  const stagedExitWarningRef = useRef<{ hasDrafts: boolean; warn: () => void }>({
    hasDrafts: false,
    warn: () => {},
  })
  stagedExitWarningRef.current = {
    hasDrafts: hasDraftAssignments,
    warn: () => showToast(t('components.dashboard.views.pos.PosOrderWorkspace.stagedAssignmentsDiscarded'), 'error'),
  }

  useEffect(() => () => {
    if (stagedExitWarningRef.current.hasDrafts) stagedExitWarningRef.current.warn()
  }, [])

  // Reloading or closing the tab never reaches React's unmount path, so the browser's own prompt
  // is the only thing standing between an unconfirmed pick and silence.
  useEffect(() => {
    if (!hasDraftAssignments) return
    const warnBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault()
      event.returnValue = ''
    }
    window.addEventListener('beforeunload', warnBeforeUnload)
    return () => window.removeEventListener('beforeunload', warnBeforeUnload)
  }, [hasDraftAssignments])

  // The only thing that writes a technician pick — and therefore the only thing that pages anyone.
  // One request for the whole ticket: the backend applies it in a single transaction, so a
  // rejected technician leaves every line where it was and nobody is told anything.
  const handleAssignServices = () => {
    const staged = Object.entries(draftAssignments)
    if (staged.length === 0) return
    if (!startTicketAction(TicketBusySurface.Technician)) return
    saveServiceLineAssignments.mutate(
      {
        orderId,
        assignments: staged.map(([serviceLineId, draft]) => ({
          serviceLineId,
          posStaffProfileId: draft.staffId ?? undefined,
          note: draft.note || undefined,
        })),
      },
      {
        onSuccess: () => setDraftAssignments({}),
        onError: reportError,
        onSettled: endTicketAction,
      },
    )
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
      onError: reportError,
      onSettled: endTicketAction,
    })
  }

  const handleStartService = () => {
    if (blockedByStagedAssignments()) return
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
    if (blockedByStagedAssignments()) return

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

  const handleNoteCommit = () => {
    if (setNote.isPending) return
    const trimmed = noteInput.trim()
    if (trimmed === (order?.note ?? '')) return
    setNote.mutate(
      { orderId, note: trimmed.length > 0 ? trimmed : null },
      { onError: reportError },
    )
  }

  const saveNotePhotos = (nextPhotos: string[]) => {
    if (setNote.isPending) return
    const trimmed = noteInput.trim()
    setNote.mutate(
      { orderId, note: trimmed.length > 0 ? trimmed : null, notePhotoUrls: nextPhotos },
      { onError: reportError },
    )
  }

  const handleAddNotePhoto = async (file: File) => {
    if (notePhotoControlsDisabled) return
    setIsUploadingNotePhoto(true)
    try {
      const url = await posCheckoutRepository.uploadOrderNotePhoto(businessId, orderId, file)
      saveNotePhotos([...notePhotos, url])
    } catch (err) {
      reportError(err)
    } finally {
      setIsUploadingNotePhoto(false)
    }
  }

  const handleRemoveNotePhoto = (url: string) => {
    saveNotePhotos(notePhotos.filter((photoUrl) => photoUrl !== url))
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

  // Summed over the ticket's own technician list, not Object.values(tipSplitInputs) — that map can
  // carry a stale entry for someone no longer on the ticket (reassigned mid-checkout), which would
  // otherwise silently inflate the total the cashier never sees a row for.
  const tipSplitTotal = ticketTechnicians.reduce(
    (sum, { posStaffProfileId }) => sum + parseDirectPaymentAmountInput(tipSplitInputs[posStaffProfileId] ?? ''),
    0,
  )

  // "Tip riêng từng thợ" builds the order's tip bottom-up from what's picked per technician —
  // there is no separate total to agree on first. Saving treats that sum as the order's new tip:
  // the order is updated to it first (the split write requires the two to already match), and the
  // split itself only fires once that settles.
  const handleSavePerStaffTip = () => {
    if (!order || !startTicketAction(TicketBusySurface.Tip)) return
    const total = round2(tipSplitTotal)
    // Every technician on the ticket gets an explicit share, defaulting to 0 — one who was never
    // clicked (still showing their empty default) must still land in the payload as $0, not be
    // silently left out of it.
    const shares = ticketTechnicians.map(({ posStaffProfileId }) => ({
      posStaffProfileId,
      tipAmount: round2(parseDirectPaymentAmountInput(tipSplitInputs[posStaffProfileId] ?? '')),
    }))
    const saveShares = () => {
      setStaffTipSplit.mutate(
        { orderId, payload: { shares } },
        { onError: reportError, onSettled: endTicketAction },
      )
    }
    if (Math.abs(order.tipAmount - total) < 0.005) {
      saveShares()
      return
    }
    setTipMode('custom')
    setTip.mutate(
      { orderId, tipAmount: total },
      {
        onError: (err) => {
          reportError(err)
          endTicketAction()
        },
        onSuccess: saveShares,
      },
    )
  }

  const handleComplete = () => {
    if (!order || isPaid || !cashPaymentCovered || !isPaymentMethodEligible || !isSplitPaymentReady) return
    if (blockedByStagedAssignments()) return
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
    // Complete carries the method itself and closes the order to edits, so a queued write landing
    // after it would only fail — and show the cashier an error about a payment that went through.
    clearPaymentMethodSave()
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
                paymentMethodLabel: formatPaymentMethodDisplay(order?.paymentAllocations, paymentMethod, t),
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
    <PosServiceCatalogPanel
      items={serviceCatalog}
      isPending={isServiceCatalogPending}
      scrollInParentOnPhone
      onAdd={(itemId) => {
        const service = serviceCatalog.find((s) => s.id === itemId)
        if (service) handleCatalogServiceClick(service)
      }}
    />
  )

  const orderPanel = (
          <div className="space-y-4">
            {order ? (
              <section
                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketCustomerTitle')}
                className="space-y-1 rounded-xl border border-nexoraBrand/20 bg-gradient-to-br from-nexoraBrandSoft/60 via-nexoraSurface to-nexoraSurface px-3 py-2"
              >
                <h2 className="text-[11px] font-black uppercase tracking-wider text-nexoraBrandDark">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.ticketCustomerTitle')}
                </h2>
                <div className="min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                    <p className="min-w-0 break-words text-sm font-bold uppercase leading-snug text-nexoraText">
                      {order.customerName}
                    </p>
                    {typeof isNewCustomer === 'boolean' ? (
                      <CustomerVisitTag isNewCustomer={isNewCustomer} />
                    ) : null}
                    <OrderCustomerDetailButton
                      key={order.id}
                      businessId={businessId}
                      orderId={order.id}
                      phoneE164={order.customerPhoneE164 || (
                        order.customerPhoneCountryCode && order.customerPhone
                          ? `${order.customerPhoneCountryCode}${order.customerPhone}`
                          : undefined
                      )}
                    />
                  </div>
                  {order.customerPhone || order.customerPhoneE164 ? (
                    <p className="flex items-center gap-1.5 text-xs font-normal text-nexoraText">
                      <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span className="min-w-0 whitespace-nowrap font-sans text-xs font-normal [font-variant-ligatures:none]">
                        {maskCustomerPhone(order.customerPhoneE164 || order.customerPhone)}
                      </span>
                    </p>
                  ) : null}
                </div>
              </section>
            ) : null}
            <div
              role="region"
              aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
              className="space-y-3 rounded-xl border border-nexoraBorder bg-nexoraSurface p-4"
            >
              <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-2 lg:justify-start">
                  <h3 className="min-w-0 text-[10px] font-black tracking-wider text-nexoraMuted">
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
                  {/* Ticket Detail sits above the catalog/payment column on phone, so letting it
                      collapse there keeps the rest of checkout reachable without scrolling past it.
                      Hidden from md: up, where the two-column layout has room for it expanded. */}
                  <IconButton
                    className="shrink-0 md:hidden"
                    label={t(
                      `components.dashboard.views.pos.PosOrderWorkspace.${
                        isTicketDetailCollapsed ? 'ticketDetailExpand' : 'ticketDetailCollapse'
                      }`,
                    )}
                    onClick={() => setIsTicketDetailCollapsed((prev) => !prev)}
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${isTicketDetailCollapsed ? '' : 'rotate-180'}`}
                      aria-hidden="true"
                    />
                  </IconButton>
                </div>
                {canEditLines ? (
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* In edit mode the full catalog already sits inline in the other column, so
                        this shortcut is only worth showing on phone, where Ticket Detail renders
                        above that column and reaching it means scrolling past everything here. */}
                    <button
                      type="button"
                      data-testid="add-services"
                      onClick={() => setIsServicePickerOpen(true)}
                      disabled={isBusy}
                      className={`inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBrand/40 bg-nexoraBrandSoft/40 px-3 text-[11px] font-bold text-nexoraBrandDark transition-colors hover:bg-nexoraBrandSoft disabled:cursor-not-allowed disabled:opacity-60${showPaymentSection ? '' : ' md:hidden'}`}
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.addServicesButton')}
                    </button>
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
                      className="inline-flex h-7 shrink-0 items-center justify-center rounded-lg border border-violet-200 bg-violet-50/50 px-3 text-[11px] font-bold text-violet-700 transition-colors hover:bg-violet-100/70 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {t('components.dashboard.views.pos.PosOrderWorkspace.addCustomServiceButton')}
                    </button>
                  </div>
                ) : null}
              </div>

              <div className={isTicketDetailCollapsed ? 'hidden md:block' : 'space-y-3'}>
              {visibleLines.length === 0 && !showAddLinePlaceholder ? (
                <p className="text-[11px] text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}
                </p>
              ) : (
                // Bounded height + internal scroll only from sm: up. On phone the page itself is
                // the only scroll region — a second one nested inside it means two scroll
                // gestures stacked on the same touch area, which reads as broken, not helpful.
                <div className="space-y-2 pr-1 sm:max-h-[320px] sm:overflow-y-auto">
                  {visibleLines.map((line, index) => (
                    <Fragment key={line.key}>
                      {index > 0 && !technicianHeadingByLineKey.has(line.key) ? (
                        <div
                          data-testid={`ticket-detail-separator-${index}`}
                          aria-hidden="true"
                          className="border-t border-dashed border-nexoraBorder/70"
                        />
                      ) : null}
                      {technicianHeadingByLineKey.has(line.key) ? (
                        <div
                          data-testid={`ticket-detail-technician-heading-${line.key}`}
                          className={`flex items-center gap-1.5 rounded-lg bg-nexoraBrandSoft/70 px-2.5 py-1.5 ${
                            index > 0 ? 'mt-2' : ''
                          }`}
                        >
                          <span className="min-w-0 truncate text-[11px] font-black tracking-wider text-nexoraBrandDark">
                            {technicianHeadingByLineKey.get(line.key)}
                          </span>
                        </div>
                      ) : null}
                      {line.itemType === 'Service' ? (
                        (() => {
                          // Only the button label still needs this — the name itself now lives in the
                          // technician heading above the block.
                          const { isFirstAvailable } = lineTechnicianDisplay(line)
                          const isCustomLine = line.posServiceId === null
                          const canEditServiceLine =
                            canEditLines && !line.completedAt && isPersistedLineId(line.existingId)
                          const canChangeService =
                            SHOW_CHANGE_SERVICE_ACTION
                            && canEditServiceLine
                            && !isCustomLine
                          const canEditCustomService = canEditServiceLine && isCustomLine
                          const canMutateLine = canEditLines && isPersistedLineId(line.existingId)
                          const stagedAssignment = isPersistedLineId(line.existingId)
                            ? draftAssignments[line.existingId as string]
                            : undefined
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
                                  {/* The line still belongs to the technician above it — this is
                                      only what the next Assign Services will hand over. */}
                                  {stagedAssignment ? (
                                    <span
                                      data-testid={`staged-assignment-${line.key}`}
                                      className="min-w-0 shrink rounded-md bg-amber-100 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-amber-800"
                                    >
                                      {t('components.dashboard.views.pos.PosOrderWorkspace.stagedAssignmentBadge', {
                                        name: stagedAssignment.displayName
                                          ?? t('components.dashboard.views.pos.PosOrderWorkspace.firstAvailableLabel'),
                                      })}
                                    </span>
                                  ) : null}
                                </div>
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
                                      disabled={isBusy || Boolean(stagedAssignment)}
                                      title={stagedAssignment ? t('components.dashboard.views.pos.PosOrderWorkspace.confirmAssignmentsFirst') : undefined}
                                      className="inline-flex h-7 shrink-0 items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50/60 px-2 text-[10px] font-bold text-emerald-700 disabled:opacity-60"
                                    >
                                      {isLineStatusActionPending(line, 'start') ? (
                                        <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />
                                      ) : null}
                                      {t('components.dashboard.views.pos.serviceLineStatus.startAction')}
                                    </button>
                                  ) : null}
                                  {mode === 'checkout' && canMutateLine && line.lineStatus === PosOrderItemStatus.Started ? (
                                    <button
                                      type="button"
                                      data-testid={`complete-line-${line.key}`}
                                      onClick={() => handleCompleteLine(line)}
                                      disabled={isBusy || Boolean(stagedAssignment)}
                                      title={stagedAssignment ? t('components.dashboard.views.pos.PosOrderWorkspace.confirmAssignmentsFirst') : undefined}
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

              {/* Sits with the lines rather than the checkout buttons: it is the confirmation for
                  what was just picked above, and it has to stay reachable in checkout mode too. */}
              {canEditLines && hasDraftAssignments ? (
                <div
                  data-testid="assign-services-bar"
                  className="flex flex-wrap items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 p-3"
                >
                  <p className="min-w-[8rem] flex-1 text-[11px] font-semibold leading-tight text-amber-900">
                    {t(
                      `components.dashboard.views.pos.PosOrderWorkspace.${
                        draftAssignmentCount === 1
                          ? 'stagedAssignmentsSummaryOne'
                          : 'stagedAssignmentsSummary'
                      }`,
                      { count: draftAssignmentCount },
                    )}
                  </p>
                  <button
                    type="button"
                    data-testid="discard-assignments"
                    onClick={handleDiscardAssignments}
                    disabled={isBusy}
                    className="h-9 shrink-0 rounded-lg border border-amber-300 bg-white px-3 text-[11px] font-bold text-amber-900 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t('components.dashboard.views.pos.PosOrderWorkspace.discardAssignmentsButton')}
                  </button>
                  <button
                    type="button"
                    data-testid="assign-services"
                    onClick={handleAssignServices}
                    disabled={isBusy}
                    className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-[11px] font-bold text-white hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saveServiceLineAssignments.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                    ) : null}
                    {t('components.dashboard.views.pos.PosOrderWorkspace.assignServicesButton')}
                  </button>
                </div>
              ) : null}

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
            </div>

            <div className="space-y-2 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
              <label htmlFor="pos-ticket-note" className="block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle')}
              </label>
              <textarea
                id="pos-ticket-note"
                value={noteInput}
                onChange={(e) => { ticketNoteEditedRef.current = true; setNoteInput(e.target.value) }}
                onBlur={handleNoteCommit}
                disabled={isBusy}
                maxLength={500}
                rows={2}
                placeholder={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePlaceholder')}
                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteLabel')}
                className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand disabled:cursor-not-allowed disabled:opacity-60"
              />

              <div className="flex items-center justify-between">
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsNoteCameraOpen(true)}
                    disabled={notePhotoControlsDisabled}
                    aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTakePhoto')}
                    className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 text-[11px] font-semibold text-nexoraMuted transition-colors hover:border-nexoraBrand/30 hover:text-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Camera className="h-4 w-4" />
                    {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTakePhoto')}
                  </button>
                  <ImageFileInput
                    as="label"
                    onPickFile={handleAddNotePhoto}
                    disabled={notePhotoControlsDisabled}
                    accept="image/jpeg,image/png,image/webp"
                    inputAriaLabel={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteUploadImage')}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 text-[11px] font-semibold text-nexoraMuted transition-colors ${notePhotoControlsDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-nexoraBrand/30 hover:text-nexoraBrandDark'}`}
                  >
                    <ImageIcon className="h-4 w-4" />
                    {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteUploadImage')}
                  </ImageFileInput>
                  {isUploadingNotePhoto ? <Loader2 className="h-4 w-4 animate-spin text-nexoraMuted" /> : null}
                </div>
                <span className="text-[10px] font-semibold text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePhotoCount', { count: notePhotos.length, max: MAX_NOTE_PHOTOS })}
                </span>
              </div>

              {notePhotos.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {notePhotos.map((url) => (
                    <div key={url} className="group relative h-14 w-14 overflow-hidden rounded-lg border border-nexoraBorder">
                      <button
                        type="button"
                        onClick={() => setPreviewNotePhoto(url)}
                        aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePhotoAlt')}
                        className="h-full w-full"
                      >
                        <img src={url} alt={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePhotoAlt')} className="h-full w-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveNotePhoto(url) }}
                        disabled={notePhotoActionPending}
                        aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteRemovePhoto')}
                        className="absolute right-0.5 top-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/60 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}

              {previewNotePhoto ? (
                <div className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm" onClick={() => setPreviewNotePhoto(null)}>
                  <div className="nexora-modal-card max-w-lg" onClick={(e) => e.stopPropagation()}>
                    <div className="mb-3 flex items-center justify-between">
                      <h2 className="text-sm font-extrabold text-nexoraText">
                        {t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle')}
                      </h2>
                      <IconButton label={t('common.cancel')} onClick={() => setPreviewNotePhoto(null)}>
                        <X className="h-4 w-4" />
                      </IconButton>
                    </div>
                    <img
                      src={previewNotePhoto}
                      alt={t('components.dashboard.views.pos.PosOrderWorkspace.ticketNotePhotoAlt')}
                      className="mx-auto max-h-[70vh] w-auto rounded-xl border border-nexoraBorder object-contain"
                    />
                  </div>
                </div>
              ) : null}

              <CameraCaptureModal
                open={isNoteCameraOpen}
                onClose={() => setIsNoteCameraOpen(false)}
                onCapture={(file) => handleAddNotePhoto(file)}
                accept="image/jpeg,image/png,image/webp"
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
                    {t(`components.dashboard.views.pos.PosOrderWorkspace.${ticketWasPrinted ? 'reprintTicketAction' : 'printTicketAction'}`)}
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

          </div>
  )

  const paymentPanel = showPaymentSection && order ? (
              <div className="space-y-4">

                <div className="space-y-3 rounded-xl border border-nexoraBorder/70 bg-nexoraSurface p-3 shadow-sm">
                  {isQuickSplitOpen && order ? (
                    <PosQuickSplitPanel
                      amountDueCents={orderTotalCents}
                      tipAmount={order.tipAmount}
                      availableMethods={availableSplitMethods}
                      savedAllocations={order.paymentAllocations}
                      isSaving={setPaymentAllocations.isPending}
                      onSave={handleSaveSplit}
                      onBack={() => setIsQuickSplitOpen(false)}
                      disabled={isBusy}
                    />
                  ) : null}
                  <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.paymentMethodTitle')}
                  </h3>
                  {/* Nothing here hides while Quick Split is open any more: it is a dialog over the
                      page now, so the checkout it belongs to stays visible behind it. */}
                  <PosPaymentMethodSelector
                    value={paymentMethod}
                    onChange={(value) => {
                      setPaymentMethod(value)
                      // Stored so the choice survives reopening the ticket, coalesced so holding
                      // down the chip row does not become a request per tap.
                      queuePaymentMethodSave(value)
                      // Split Pay is a doorway, not a method: picking it opens the dialog where the
                      // real portions get built. The payment is still confirmed by Pay below.
                      if (value === PosCheckoutPaymentMethod.SplitPay) setIsQuickSplitOpen(true)
                    }}
                    receiveMethods={receivePaymentMethods}
                    disabled={isBusy}
                  />
                  {paymentMethod === PosCheckoutPaymentMethod.SplitPay && order ? (
                    <div className="space-y-2 rounded-xl border border-nexoraBorder/70 bg-nexoraCanvas/40 p-3">
                      {splitAllocations.length > 0 ? (
                        <dl className="space-y-1 text-xs">
                          {splitAllocations.map((allocation) => (
                            <div key={allocation.paymentMethodType} className="flex justify-between">
                              <dt className="text-nexoraMuted">
                                {t(POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS[
                                  allocation.paymentMethodType as PosCheckoutPaymentMethodType
                                ] ?? allocation.paymentMethodType)}
                              </dt>
                              <dd className="font-bold tabular-nums text-nexoraText">
                                {formatUsdAmount(allocation.amount)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      ) : (
                        <p className="text-xs font-medium text-nexoraMuted">
                          {t('components.dashboard.views.pos.PosQuickSplitPanel.noSplitYet')}
                        </p>
                      )}
                      {splitBlockMessage ? (
                        <p className="text-xs font-bold text-nexoraDanger" aria-live="polite">
                          {splitBlockMessage}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setIsQuickSplitOpen(true)}
                        disabled={isBusy}
                        className="h-11 w-full rounded-lg border border-nexoraBrand text-xs font-bold text-nexoraBrand hover:bg-nexoraLavender/15 disabled:opacity-60"
                      >
                        {t('components.dashboard.views.pos.PosQuickSplitPanel.editSplit')}
                      </button>
                    </div>
                  ) : null}
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
                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsTipModalOpen(true)}
                        disabled={isBusy}
                        className="inline-flex h-7 shrink-0 items-center gap-1 justify-center rounded-lg border border-nexoraBrand/40 bg-nexoraBrandSoft/40 px-2.5 text-[10px] font-bold text-nexoraBrandDark transition-colors hover:bg-nexoraBrandSoft disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <DollarSign aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                        {t('components.dashboard.views.pos.PosOrderWorkspace.addTipButton')}
                      </button>
                      <OrderDiscountSection
                        order={order}
                        promotions={eligiblePromotions}
                        isSaving={setOrderDiscount.isPending}
                        onApply={handleApplyOrderDiscount}
                      />
                    </div>
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
                  disabled={isBusy || hasNoLines || !cashPaymentCovered || !isPaymentMethodEligible || !isSplitPaymentReady}
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
              </div>
  ) : null

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
        note: isRedundantEstimateLineNote(line.note, noteInput) ? undefined : line.note,
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
      wasPrinted={ticketWasPrinted}
      isPrinting={isReceiptPrinting}
      onPrint={() => {
        const doc = buildPosTicketDocument({ orderNumber: order.orderNumber, completedAtLabel: formatPosDateTime(order.completedAt ?? new Date().toISOString(), currentLanguage), customerName: order.customerName, orderNote: noteInput, groups: printableReceiptGroups,
          noteLabel: t('components.dashboard.views.pos.PosOrderWorkspace.ticketNoteTitle'), customerLabel: t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewCustomer') })
        setTicketPreviewOpen(false)
        printReceipt(doc, { jobId: orderId, copies: 1, backPath: receiptPrintBackPath, browserOnly: ticketBrowserFallback, ticketPrint: { businessId, orderId },
          restore: { surface: 'frontDesk', tab: receiptPrintTab, orderId, mode: 'edit', ticketNote: noteInput } })
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
              paymentMethodLabel: order.paymentMethodType || order.paymentAllocations.length > 0
                ? formatPaymentMethodDisplay(order.paymentAllocations, order.paymentMethodType, t)
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
      backPath: receiptPrintBackPath,
      restore: {
        surface: 'frontDesk',
        tab: receiptPrintTab,
        orderId: autoPrintIntent.orderId,
        mode: 'success',
        receiptMode: 'print',
      },
    })
    setAutoPrintIntent(null)
  }, [autoPrintIntent, printReceipt, receiptPrintTab, receiptPrintBackPath])

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
    if (mode === 'edit') setTicketBrowserFallback(true)
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
              backPath: receiptPrintBackPath,
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
          paymentMethodLabel={formatPaymentMethodDisplay(
            order.paymentAllocations,
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
          })}
        </h1>
      </div>

      {isOrderLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : (
        <div
          className="grid grid-cols-1 items-start gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          aria-busy={isBusy}
        >
          {/* Edit mode's inline catalog is redundant on phone now that Ticket Detail has its own
              "Add services" button opening the same picker in a modal — hidden below md: there,
              shown from md: up where it is the only way to add a service. */}
          <div className={`order-2 md:order-1${showPaymentSection ? '' : ' hidden md:block'}`}>
            {showPaymentSection ? paymentPanel : catalogPanel}
          </div>
          <div className="order-1 md:order-2">{orderPanel}</div>
        </div>
      )}

      <ChangeTechnicianModal
        open={technicianTarget !== null}
        serviceName={technicianTarget?.serviceName ?? ''}
        technicians={technicianTarget ? technicianOptionsForTicket(technicianTarget.posServiceId) : []}
        isLoading={areTechniciansPending && allTechnicians.length === 0}
        selectedStaffId={technicianModalSelectedStaffId}
        currentTechnicianName={technicianTarget?.technicianName}
        turnsError={technicianTurnBoardQuery.isError || technicianTurnRosterQuery.isError}
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
        technicians={technicianOptionsForTicket(null)}
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

      <ServiceCatalogPickerModal
        open={isServicePickerOpen}
        services={serviceCatalog}
        isPending={isBusy || isServiceCatalogPending}
        onAdd={(itemId) => {
          const service = serviceCatalog.find((s) => s.id === itemId)
          if (service) handleCatalogServiceClick(service)
        }}
        onClose={() => setIsServicePickerOpen(false)}
      />

      {order ? (
        <TipModal
          open={isTipModalOpen}
          onClose={() => setIsTipModalOpen(false)}
          panelMode={tipPanelMode}
          onSelectPanelMode={setTipPanelMode}
          technicians={ticketTechnicians}
          servicesSubtotal={order.servicesSubtotal}
          orderTipAmount={order.tipAmount}
          onApplyTip={applyTip}
          tipSplitInputs={tipSplitInputs}
          onTipSplitInputChange={(posStaffProfileId, value) =>
            setTipSplitInputs((prev) => ({ ...prev, [posStaffProfileId]: value }))
          }
          tipSplitTotal={tipSplitTotal}
          onSavePerStaffTip={handleSavePerStaffTip}
          isBusy={isBusy}
        />
      ) : null}

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
