import { Check, ArrowRight, Printer } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatUsdAmount } from '../../../../utils/currencyInput'

export interface PosCheckoutReceiptItem {
  id: string
  name: string
  groupName?: string
  detail?: string
  price: number
}

export default function PosCheckoutSuccessView({
  businessName,
  businessLogoUrl,
  businessAddress,
  businessPhone,
  customerName,
  orderNumber,
  paymentMethodLabel,
  receiptLabel,
  receiptWasPrinted = false,
  total,
  discountAmount,
  tipAmount,
  items,
  onReprint,
  onStartNext,
}: {
  businessName?: string
  businessLogoUrl?: string | null
  businessAddress?: string
  businessPhone?: string
  customerName: string
  orderNumber: string
  paymentMethodLabel: string
  receiptLabel: string
  receiptWasPrinted?: boolean
  total: number
  discountAmount: number
  tipAmount: number
  items: PosCheckoutReceiptItem[]
  onReprint: () => void
  onStartNext: () => void
}) {
  const { t } = useTranslation()
  const businessDisplayName = businessName?.trim() || 'VLINKPAY'
  const businessLogo = businessLogoUrl?.trim()
  const businessInitials = businessDisplayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
  const subtotal = items.reduce((sum, item) => sum + item.price, 0)
  const salesTaxAmount = Math.round(
    (total - subtotal + Math.abs(discountAmount) - tipAmount) * 100,
  ) / 100
  const productsLabel = t('components.dashboard.views.pos.PosOrderWorkspace.summaryProducts')

  return (
    <div className="grid min-h-[60vh] gap-4 lg:grid-cols-[minmax(300px,5fr)_minmax(0,7fr)]">
      <section className="flex flex-col items-center justify-center rounded-2xl border border-nexoraBorder bg-white p-6 text-center shadow-sm">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-8 w-8" /></span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.checkoutComplete')}</p>
        <h1 className="mt-2 text-2xl font-black text-nexoraText">{t('components.dashboard.views.pos.PosOrderWorkspace.paymentComplete')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.ticketReadyToClose', { customer: customerName })}</p>
        <p className="my-5 text-4xl font-black tabular-nums text-nexoraText">{formatUsdAmount(total)}</p>
        <dl className="grid w-full grid-cols-3 gap-2 text-xs">
          {[
            [t('components.dashboard.views.pos.PosOrderWorkspace.successPayment'), paymentMethodLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successReceipt'), receiptLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successTicket'), `#${orderNumber}`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-nexoraCanvas p-2.5"><dt className="text-nexoraMuted">{label}</dt><dd className="mt-1 font-black text-nexoraText">{value}</dd></div>)}
        </dl>
        <button
          type="button"
          onClick={onReprint}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-bold text-nexoraBrand transition-colors hover:text-nexoraBrandDark hover:underline"
        >
          <Printer className="h-3.5 w-3.5" aria-hidden="true" />
          {t(
            `components.dashboard.views.pos.PosOrderWorkspace.${
              receiptWasPrinted ? 'receiptReprint' : 'printReceiptAction'
            }`,
          )}
        </button>
        <button type="button" onClick={onStartNext} className="mt-3 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand text-sm font-black text-white hover:bg-nexoraBrandDark">
          {t('components.dashboard.views.pos.PosOrderWorkspace.startNextCheckout')} <ArrowRight className="h-4 w-4" />
        </button>
      </section>
      <section className="flex min-w-0 flex-col">
        <div className="flex flex-1 items-start justify-center">
          <article
            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.customerReceipt')}
            className="w-full rounded-2xl border border-nexoraBorder bg-white p-5 shadow-sm sm:p-6"
          >
              <header className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-nexoraMuted">
                    {t('components.dashboard.views.pos.PosOrderWorkspace.customerReceipt')}
                  </p>
                  <h2 className="mt-2 truncate text-2xl font-black text-nexoraText">
                    {businessDisplayName}
                  </h2>
                  {businessAddress ? <p className="mt-1 text-xs text-nexoraMuted">{businessAddress}</p> : null}
                  {businessPhone ? <p className="text-xs text-nexoraMuted">{businessPhone}</p> : null}
                </div>
                {businessLogo ? (
                  <img
                    src={businessLogo}
                    alt={businessDisplayName}
                    className="h-14 w-14 shrink-0 rounded-2xl border border-nexoraBorder bg-white object-contain shadow-sm"
                  />
                ) : (
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-nexoraBrand text-base font-black text-white shadow-sm">
                    {businessInitials}
                  </span>
                )}
              </header>

              <dl className="my-5 grid grid-cols-2 gap-2 border-y border-dashed border-nexoraBorder py-4 text-xs sm:grid-cols-4">
                {[
                  [t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewCustomer'), customerName],
                  [t('components.dashboard.views.pos.PosOrderWorkspace.successTicket'), `#${orderNumber}`],
                  [t('components.dashboard.views.pos.PosOrderWorkspace.successPayment'), paymentMethodLabel],
                  [t('components.dashboard.views.pos.PosOrderWorkspace.successStatus'), t('components.dashboard.views.pos.PosOrderWorkspace.successPaid')],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl bg-nexoraCanvas p-3">
                    <dt className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">{label}</dt>
                    <dd className={`mt-1 font-black ${label === t('components.dashboard.views.pos.PosOrderWorkspace.successStatus') ? 'text-nexoraSuccess' : 'text-nexoraText'}`}>
                      {value}
                    </dd>
                  </div>
                ))}
              </dl>

              <section aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')}>
                <div className="flex items-center justify-between gap-4 border-b border-nexoraBorder pb-2 text-[10px] font-black uppercase tracking-[0.16em] text-nexoraMuted">
                  <span>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')}</span>
                  <span>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryPrice')}</span>
                </div>
                <div className="divide-y divide-nexoraBorder">
                  {items.map((item) => {
                    const itemDetail = item.detail || (
                      item.groupName && item.groupName !== productsLabel
                        ? `${t('components.dashboard.views.pos.PosOrderWorkspace.technicianPrefix')} ${item.groupName}`
                        : undefined
                    )
                    return (
                      <div key={item.id} className="flex items-start justify-between gap-4 py-4">
                        <div className="min-w-0">
                          <p className="font-bold text-nexoraText">{item.name}</p>
                          {itemDetail ? <p className="mt-0.5 text-xs text-nexoraMuted">{itemDetail}</p> : null}
                        </div>
                        <span className="shrink-0 font-black tabular-nums text-nexoraText">
                          {formatUsdAmount(item.price)}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </section>

              <dl className="ml-auto mt-5 max-w-sm space-y-2 border-t border-dashed border-nexoraBorder pt-4 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summarySubtotal')}</dt>
                  <dd className="font-semibold tabular-nums text-nexoraText">{formatUsdAmount(subtotal)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount')}</dt>
                  <dd className="font-semibold tabular-nums text-nexoraDanger">{formatUsdAmount(-Math.abs(discountAmount))}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip')}</dt>
                  <dd className="font-semibold tabular-nums text-nexoraText">{formatUsdAmount(tipAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.summarySalesTax')}</dt>
                  <dd className="font-semibold tabular-nums text-nexoraText">{formatUsdAmount(salesTaxAmount)}</dd>
                </div>
                <div className="flex justify-between gap-4 border-t border-nexoraBorder pt-3 text-lg">
                  <dt className="font-black text-nexoraText">{t('components.dashboard.views.pos.PosOrderWorkspace.totalPaid')}</dt>
                  <dd className="font-black tabular-nums text-nexoraText">{formatUsdAmount(total)}</dd>
                </div>
              </dl>

              <footer className="mt-5 border-t border-dashed border-nexoraBorder pt-4 text-center">
                <p className="text-xs text-nexoraMuted">
                  {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewThankYou')}
                </p>
              </footer>
          </article>
        </div>
      </section>
    </div>
  )
}
