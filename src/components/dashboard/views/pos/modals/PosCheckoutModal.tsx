// PosCheckoutModal — POS Merchant Ops: Checkout (US-14 / US-025). Full checkout for
// a single ticket: service lines + "+ Add Service", 5 tip presets, 4 payment methods,
// receipt email/phone, and a live Payment Summary sourced from GetTicketDetailQuery
// (backend computes ServicesSubtotal/SalesTax/Total — this modal never recomputes
// Total itself, to avoid a second source of truth).
//
// Scope cuts vs the BA doc (see US-025 story for the full reasoning):
// - No saved-card "Visa **** 4242" default — Payment Method defaults to Cash (no real
//   card-storage integration exists; backend never calls a real payment gateway).
// - No Discount/Coupon buttons (Phase 2 "coming soon", DiscountAmount is always 0).
// - No multi-technician tip-split display (ticket has exactly one primary technician).
import { useEffect, useRef, useState } from 'react'
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import {
  useAddTicketServiceLine,
  useChargeTicket,
  useCheckoutServiceCatalog,
  useSetTicketTip,
  useTicketDetail,
} from '../../../../../data/hooks/usePosCheckout'
import type { PosCheckoutPaymentMethodType } from '../../../../../types/repositories'
import IconButton from '../../../../ui/IconButton'
import { SkeletonList } from '../../../../ui/skeleton'

type TipMode = 'fixed10' | 'fixed15' | 'pct18' | 'pct20' | 'custom'

const PAYMENT_METHODS: PosCheckoutPaymentMethodType[] = ['Card', 'Cash', 'GiftCard', 'SplitPay']
const DEFAULT_TIP_AMOUNT = 15

function round2(value: number) {
  return Math.round(value * 100) / 100
}

export default function PosCheckoutModal({
  open,
  businessId,
  ticketId,
  onClose,
}: {
  open: boolean
  businessId: string
  ticketId: string | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: ticket, isLoading } = useTicketDetail(businessId, ticketId ?? undefined)
  const { data: serviceCatalog = [] } = useCheckoutServiceCatalog(businessId)
  const addServiceLine = useAddTicketServiceLine(businessId)
  const setTip = useSetTicketTip(businessId)
  const chargeTicket = useChargeTicket(businessId)

  const [tipMode, setTipMode] = useState<TipMode>('fixed15')
  const [customTipInput, setCustomTipInput] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PosCheckoutPaymentMethodType>('Cash')
  const [receiptEmail, setReceiptEmail] = useState('')
  const [receiptPhone, setReceiptPhone] = useState('')
  const [selectedServiceId, setSelectedServiceId] = useState('')
  const initializedTicketIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!open) {
      initializedTicketIdRef.current = null
      return
    }
    if (!ticket || initializedTicketIdRef.current === ticket.id) return
    initializedTicketIdRef.current = ticket.id

    setReceiptEmail(ticket.customerEmail ?? '')
    setReceiptPhone(ticket.customerPhone ?? '')
    setPaymentMethod('Cash')

    if (ticket.tipAmount === 0) {
      setTipMode('fixed15')
      setTip.mutate({ ticketId: ticket.id, tipAmount: DEFAULT_TIP_AMOUNT })
      return
    }

    const subtotal = ticket.servicesSubtotal
    const pct18 = subtotal > 0 ? round2(subtotal * 0.18) : -1
    const pct20 = subtotal > 0 ? round2(subtotal * 0.2) : -1
    if (ticket.tipAmount === 10) setTipMode('fixed10')
    else if (ticket.tipAmount === 15) setTipMode('fixed15')
    else if (ticket.tipAmount === pct18) setTipMode('pct18')
    else if (ticket.tipAmount === pct20) setTipMode('pct20')
    else setTipMode('custom')
    setCustomTipInput(String(ticket.tipAmount))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, ticket])

  if (!open || !ticketId) return null

  const applyTip = (mode: TipMode, amount: number) => {
    setTipMode(mode)
    if (!ticket || amount < 0) return
    setTip.mutate(
      { ticketId: ticket.id, tipAmount: amount },
      {
        onError: (err: unknown) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
        },
      },
    )
  }

  const handleCustomTipCommit = () => {
    const parsed = Number(customTipInput)
    if (!Number.isFinite(parsed) || parsed < 0) return
    applyTip('custom', round2(parsed))
  }

  const handleAddService = () => {
    if (!ticket || !selectedServiceId) return
    addServiceLine.mutate(
      { ticketId: ticket.id, posServiceId: selectedServiceId },
      {
        onError: (err: unknown) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
        },
      },
    )
  }

  const handleCharge = () => {
    if (!ticket) return
    chargeTicket.mutate(
      {
        ticketId: ticket.id,
        payload: {
          paymentMethodType: paymentMethod,
          receiptEmail: receiptEmail.trim() || undefined,
          receiptPhone: receiptPhone.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          showToast(t('components.dashboard.views.pos.PosCheckoutModal.chargeSuccess'))
          onClose()
        },
        onError: (err: unknown) => {
          showToast(t(getErrorI18nKey(getApiErrorCode(err, 'ERROR'))), 'error')
        },
      },
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {ticket
              ? t('components.dashboard.views.pos.PosCheckoutModal.title', {
                  ticketNumber: ticket.ticketNumber,
                  customerName: ticket.customerName,
                })
              : t('components.dashboard.views.pos.PosCheckoutModal.titleLoading')}
          </h2>
          <IconButton label={t('components.dashboard.views.pos.PosCheckoutModal.close')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto">
          {isLoading || !ticket ? (
            <SkeletonList count={4} lines={2} />
          ) : (
            <>
              {ticket.technicianName ? (
                <p className="text-xs text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosCheckoutModal.technician', {
                    name: ticket.technicianName,
                  })}
                </p>
              ) : null}

              <section>
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosCheckoutModal.servicesTitle')}
                </h3>
                <div className="space-y-1.5">
                  {ticket.serviceLines.map((line) => (
                    <div
                      key={line.id}
                      className="flex items-center justify-between rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-xs"
                    >
                      <span className="font-semibold text-nexoraText">
                        {line.quantity > 1 ? `${line.quantity}x ` : ''}
                        {line.serviceName}
                      </span>
                      <span className="font-bold text-nexoraText">${line.lineTotal.toFixed(2)}</span>
                    </div>
                  ))}
                  {ticket.serviceLines.length === 0 ? (
                    <p className="text-[11px] text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosCheckoutModal.noServices')}
                    </p>
                  ) : null}
                </div>
                {serviceCatalog.length > 0 ? (
                  <div className="mt-2 flex gap-2">
                    <select
                      value={selectedServiceId}
                      onChange={(e) => setSelectedServiceId(e.target.value)}
                      className="h-9 flex-1 rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                    >
                      <option value="">
                        {t('components.dashboard.views.pos.PosCheckoutModal.addServicePlaceholder')}
                      </option>
                      {serviceCatalog.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} — ${service.price.toFixed(2)}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddService}
                      disabled={!selectedServiceId || addServiceLine.isPending}
                      className="h-9 shrink-0 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
                    >
                      {t('components.dashboard.views.pos.PosCheckoutModal.addServiceButton')}
                    </button>
                  </div>
                ) : null}
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosCheckoutModal.tipTitle')}
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
                    onClick={() => applyTip('pct18', round2(ticket.servicesSubtotal * 0.18))}
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
                    onClick={() => applyTip('pct20', round2(ticket.servicesSubtotal * 0.2))}
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
                      placeholder={t('components.dashboard.views.pos.PosCheckoutModal.customTipPlaceholder')}
                      className={`h-9 w-full rounded-lg border px-2 text-xs text-nexoraText outline-none ${
                        tipMode === 'custom' ? 'border-nexoraBrand' : 'border-nexoraBorder'
                      }`}
                    />
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosCheckoutModal.paymentMethodTitle')}
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
                      {t(`components.dashboard.views.pos.PosCheckoutModal.paymentMethod.${method}`)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
                      {t('components.dashboard.views.pos.PosCheckoutModal.receiptEmail')}
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
                      {t('components.dashboard.views.pos.PosCheckoutModal.receiptPhone')}
                    </label>
                    <input
                      type="tel"
                      value={receiptPhone}
                      onChange={(e) => setReceiptPhone(e.target.value)}
                      className="h-9 w-full rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
                    />
                  </div>
                </div>
              </section>

              <section className="rounded-xl bg-nexoraCanvas p-4">
                <h3 className="mb-2 text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosCheckoutModal.summaryTitle')}
                </h3>
                <dl className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosCheckoutModal.summaryServices')}</dt>
                    <dd className="font-semibold text-nexoraText">${ticket.servicesSubtotal.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosCheckoutModal.summaryTip')}</dt>
                    <dd className="font-semibold text-nexoraText">${ticket.tipAmount.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosCheckoutModal.summaryDiscount')}</dt>
                    <dd className="font-semibold text-nexoraText">
                      {ticket.discountAmount === 0 ? '$0.00' : `-$${Math.abs(ticket.discountAmount).toFixed(2)}`}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosCheckoutModal.summarySalesTax')}</dt>
                    <dd className="font-semibold text-nexoraText">${ticket.salesTaxAmount.toFixed(2)}</dd>
                  </div>
                  <div className="flex justify-between border-t border-nexoraBorder pt-1.5">
                    <dt className="font-black uppercase text-nexoraText">
                      {t('components.dashboard.views.pos.PosCheckoutModal.summaryTotal')}
                    </dt>
                    <dd className="font-black text-nexoraText">${ticket.total.toFixed(2)}</dd>
                  </div>
                </dl>
              </section>

              <button
                type="button"
                onClick={handleCharge}
                disabled={chargeTicket.isPending}
                className="h-11 w-full rounded-lg bg-nexoraBrand text-sm font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-60"
              >
                {chargeTicket.isPending ? (
                  <Loader2 className="mx-auto h-4 w-4 animate-spin" />
                ) : (
                  t('components.dashboard.views.pos.PosCheckoutModal.chargeButton', {
                    amount: ticket.total.toFixed(2),
                  })
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
