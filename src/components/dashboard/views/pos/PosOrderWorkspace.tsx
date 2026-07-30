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
import { Loader2, Pencil, Trash2 } from 'lucide-react'
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
import type {
  CheckInOrderItemPayload,
  CheckoutProductCatalogItemApiDto,
  CheckoutServiceCatalogItemApiDto,
  PosCheckoutPaymentMethodType,
} from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CategoryGroupedCatalogPicker from './CategoryGroupedCatalogPicker'
import SelectTechniciansModal, { type SelectTechniciansSelection } from './modals/SelectTechniciansModal'

type TipMode = 'fixed10' | 'fixed15' | 'pct18' | 'pct20' | 'custom'
type CatalogTab = 'services' | 'products'

const PAYMENT_METHODS: PosCheckoutPaymentMethodType[] = ['Card', 'Cash', 'GiftCard', 'SplitPay']

function round2(value: number) {
  return Math.round(value * 100) / 100
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
  customerDraft,
  onClose,
  onCheckedIn,
  onCompleted,
}: {
  businessId: string
  // null = Create mode (Check-in step 2, order does not exist yet).
  orderId: string | null
  // Required in Create mode — collected by the Check-in step 1 form.
  customerDraft?: { customerName: string; customerEmail?: string; customerPhone?: string }
  onClose: () => void
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
  // Local text while the user is typing a Qty change — committed (and cleared) on blur/Enter
  // so an Update-mode edit fires one API call per commit, not one per keystroke.
  const [qtyInputDrafts, setQtyInputDrafts] = useState<Record<string, string>>({})

  const [tipMode, setTipMode] = useState<TipMode>('fixed15')
  const [customTipInput, setCustomTipInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [receiptPhone, setReceiptPhone] = useState('')
  const [tipSplitInputs, setTipSplitInputs] = useState<Record<string, string>>({})
  const initializedOrderIdRef = useRef<string | null>(null)

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

    setShowPaymentSection(order.status === 'InService' || order.status === 'Completed')
    setReceiptEmail(order.customerEmail ?? '')
    setReceiptPhone(order.customerPhone ?? '')
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

  const noteLines = visibleLines.filter(
    (l): l is DisplayServiceLine => l.itemType === 'Service' && Boolean(l.note?.trim()),
  )

  const statusLabel = isCreateMode
    ? t('components.dashboard.views.pos.PosOrderWorkspace.statusDraft')
    : (order?.status ?? '')

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

  const commitQuantityChange = (line: DisplayProductLine) => {
    const raw = qtyInputDrafts[line.key]
    setQtyInputDrafts((prev) => {
      const next = { ...prev }
      delete next[line.key]
      return next
    })
    if (raw === undefined) return
    const parsed = Number(raw)
    if (!Number.isFinite(parsed) || parsed < 1 || parsed === line.quantity) return

    if (isCreateMode) {
      setDraftLines((prev) => prev.map((l) => (l.key === line.key ? { ...l, quantity: parsed } : l)))
      return
    }
    if (!effectiveOrderId || !line.existingId) return
    updateProductQuantity.mutate(
      { orderId: effectiveOrderId, productLineId: line.existingId, quantity: parsed },
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

  const handleCheckIn = () => {
    if (!customerDraft) return
    checkInOrder.mutate(
      { ...customerDraft, items: buildCheckInItems() },
      {
        onSuccess: (newOrderId) => {
          showToast(t('components.dashboard.views.pos.PosOrderWorkspace.checkInSuccess'))
          onCheckedIn?.(newOrderId)
        },
        onError: reportError,
      },
    )
  }

  const handleCheckoutFromCreate = () => {
    if (!customerDraft) return
    checkInOrder.mutate(
      { ...customerDraft, items: buildCheckInItems() },
      {
        onSuccess: (newOrderId) => {
          setInternalOrderId(newOrderId)
          startOrderService.mutate(newOrderId, {
            onSuccess: () => setShowPaymentSection(true),
            onError: reportError,
          })
        },
        onError: reportError,
      },
    )
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
    if (order?.status === 'Waiting') {
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
          receiptEmail: receiptEmail.trim() || undefined,
          receiptPhone: receiptPhone.trim() || undefined,
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

  const isBusy = checkInOrder.isPending || startOrderService.isPending

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold leading-tight text-nexoraText">
            {isCreateMode
              ? t('components.dashboard.views.pos.PosOrderWorkspace.titleCreate', {
                  customerName: customerDraft?.customerName ?? '',
                })
              : t('components.dashboard.views.pos.PosOrderWorkspace.titleUpdate', {
                  orderNumber: order?.orderNumber ?? '',
                  customerName: order?.customerName ?? '',
                })}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-nexoraCanvas px-3 py-1 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {statusLabel}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText hover:border-nexoraBrand"
          >
            {t('components.dashboard.views.pos.PosOrderWorkspace.closeButton')}
          </button>
        </div>
      </div>

      {!isCreateMode && isOrderLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="nexora-card space-y-3 p-4">
            <div className="flex gap-1 border-b border-nexoraBorder pb-2">
              <button
                type="button"
                onClick={() => setCatalogTab('services')}
                className={`px-3 py-1.5 text-xs font-bold ${
                  catalogTab === 'services'
                    ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
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
                    ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
                    : 'text-nexoraMuted hover:text-nexoraText'
                }`}
              >
                {t('components.dashboard.views.pos.PosOrderWorkspace.tabProducts')}
              </button>
            </div>

            {catalogTab === 'services' ? (
              <CategoryGroupedCatalogPicker
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

          <div className="space-y-4">
            <div className="nexora-card space-y-3 p-4">
              <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                {t('components.dashboard.views.pos.PosOrderWorkspace.orderDetailTitle')}
              </h3>

              {visibleLines.length === 0 ? (
                <p className="text-[11px] text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.noLines')}
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
                        <th className="pb-2 pr-2">{t('components.dashboard.views.pos.PosOrderWorkspace.columnName')}</th>
                        <th className="pb-2 pr-2">
                          {t('components.dashboard.views.pos.PosOrderWorkspace.columnTechnician')}
                        </th>
                        <th className="pb-2 pr-2 text-right">
                          {t('components.dashboard.views.pos.PosOrderWorkspace.columnPrice')}
                        </th>
                        <th className="pb-2 pr-2 text-right">
                          {t('components.dashboard.views.pos.PosOrderWorkspace.columnQty')}
                        </th>
                        <th className="pb-2 pr-2 text-right">
                          {t('components.dashboard.views.pos.PosOrderWorkspace.columnTotal')}
                        </th>
                        <th className="pb-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {visibleLines.map((line) => (
                        <tr key={line.key} className="border-t border-nexoraBorder">
                          <td className="py-2 pr-2 font-semibold text-nexoraText">
                            {line.itemType === 'Service' ? line.serviceName : line.productName}
                          </td>
                          <td className="py-2 pr-2 text-nexoraMuted">
                            {line.itemType === 'Service'
                              ? line.technicianName ??
                                t('components.dashboard.views.pos.PosOrderWorkspace.nextAvailable')
                              : '—'}
                          </td>
                          <td className="py-2 pr-2 text-right text-nexoraMuted">${line.unitPrice.toFixed(2)}</td>
                          <td className="py-2 pr-2 text-right">
                            {line.itemType === 'Product' ? (
                              <input
                                type="number"
                                min={1}
                                value={qtyInputDrafts[line.key] ?? String(line.quantity)}
                                onChange={(e) =>
                                  setQtyInputDrafts((prev) => ({ ...prev, [line.key]: e.target.value }))
                                }
                                onBlur={() => commitQuantityChange(line)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault()
                                    ;(e.target as HTMLInputElement).blur()
                                  }
                                }}
                                className="h-7 w-14 rounded-lg border border-nexoraBorder bg-white px-1.5 text-right text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                              />
                            ) : (
                              1
                            )}
                          </td>
                          <td className="py-2 pr-2 text-right font-bold text-nexoraText">
                            ${lineTotal(line).toFixed(2)}
                          </td>
                          <td className="py-2 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {line.itemType === 'Service' ? (
                                <button
                                  type="button"
                                  onClick={() => handleEditServiceLine(line)}
                                  className="rounded-md p-1 text-nexoraMuted hover:text-nexoraBrand"
                                  aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.editLine')}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => handleDeleteLine(line)}
                                className="rounded-md p-1 text-nexoraMuted hover:text-rose-600"
                                aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.deleteLine')}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {noteLines.length > 0 ? (
                <div className="rounded-lg bg-nexoraCanvas p-3">
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

            {!isCreateMode && !showPaymentSection ? (
              <div className="flex gap-2">
                {order?.status === 'Waiting' ? (
                  <button
                    type="button"
                    onClick={handleStartService}
                    disabled={isBusy}
                    className="h-11 flex-1 rounded-lg border border-nexoraBorder text-sm font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-60"
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
                  className="h-11 flex-1 rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')}
                </button>
              </div>
            ) : null}

            {isCreateMode ? (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={hasServiceLines ? handleCheckIn : handleCheckoutFromCreate}
                  disabled={isBusy || visibleLines.length === 0}
                  className="h-11 flex-1 rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                >
                  {isBusy ? (
                    <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                  ) : hasServiceLines ? (
                    t('components.dashboard.views.pos.PosOrderWorkspace.checkInButton')
                  ) : (
                    t('components.dashboard.views.pos.PosOrderWorkspace.checkoutButton')
                  )}
                </button>
              </div>
            ) : null}

            {showPaymentSection && order ? (
              <>
                <div className="nexora-card space-y-3 p-4">
                  <h3 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.tipTitle')}
                  </h3>
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
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
                      onClick={() => applyTip('pct18', round2(order.servicesSubtotal * 0.18))}
                      className={`h-9 rounded-lg border text-xs font-bold ${
                        tipMode === 'pct18'
                          ? 'border-nexoraBrand bg-nexoraBrand text-white'
                          : 'border-nexoraBorder text-nexoraText hover:border-nexoraBrand'
                      }`}
                    >
                      18%
                    </button>
                    <button
                      type="button"
                      onClick={() => applyTip('pct20', round2(order.servicesSubtotal * 0.2))}
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
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptEmail')}
                      </label>
                      <input
                        type="email"
                        value={receiptEmail}
                        onChange={(e) => setReceiptEmail(e.target.value)}
                        className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                        {t('components.dashboard.views.pos.PosOrderWorkspace.receiptPhone')}
                      </label>
                      <input
                        type="tel"
                        value={receiptPhone}
                        onChange={(e) => setReceiptPhone(e.target.value)}
                        className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                      />
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
        </div>
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
    </div>
  )
}
