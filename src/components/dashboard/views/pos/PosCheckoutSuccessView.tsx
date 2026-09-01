import { Check, ArrowRight } from 'lucide-react'
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
  businessAddress,
  businessPhone,
  customerName,
  orderNumber,
  paymentMethodLabel,
  receiptLabel,
  total,
  discountAmount,
  tipAmount,
  items,
  onStartNext,
}: {
  businessName?: string
  businessAddress?: string
  businessPhone?: string
  customerName: string
  orderNumber: string
  paymentMethodLabel: string
  receiptLabel: string
  total: number
  discountAmount: number
  tipAmount: number
  items: PosCheckoutReceiptItem[]
  onStartNext: () => void
}) {
  const { t } = useTranslation()
  const receiptGroups = items.reduce<Array<{ name: string; items: PosCheckoutReceiptItem[] }>>(
    (groups, item) => {
      const groupName = item.groupName?.trim()
        || t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')
      const group = groups.find((entry) => entry.name === groupName)
      if (group) {
        group.items.push(item)
      } else {
        groups.push({ name: groupName, items: [item] })
      }
      return groups
    },
    [],
  )

  return (
    <div className="grid min-h-[60vh] gap-4 lg:grid-cols-[minmax(300px,5fr)_minmax(0,7fr)]">
      <section className="flex flex-col items-center justify-center rounded-2xl border border-nexoraBorder bg-white p-6 text-center shadow-sm">
        <span className="grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-8 w-8" /></span>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.2em] text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.checkoutComplete')}</p>
        <h1 className="mt-2 text-2xl font-black text-nexoraText">{t('components.dashboard.views.pos.PosOrderWorkspace.paymentComplete')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.ticketReadyToClose', { customer: customerName.toLocaleUpperCase() })}</p>
        <p className="my-5 text-4xl font-black tabular-nums text-nexoraText">{formatUsdAmount(total)}</p>
        <dl className="grid w-full grid-cols-3 gap-2 text-xs">
          {[
            [t('components.dashboard.views.pos.PosOrderWorkspace.successPayment'), paymentMethodLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successReceipt'), receiptLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successTicket'), `#${orderNumber}`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-nexoraCanvas p-2.5"><dt className="text-nexoraMuted">{label}</dt><dd className="mt-1 font-black text-nexoraText">{value}</dd></div>)}
        </dl>
        <button type="button" onClick={onStartNext} className="mt-6 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand text-sm font-black text-white hover:bg-nexoraBrandDark">
          {t('components.dashboard.views.pos.PosOrderWorkspace.startNextCheckout')} <ArrowRight className="h-4 w-4" />
        </button>
      </section>
      <section className="flex items-start justify-center rounded-2xl border border-nexoraBorder bg-nexoraCanvas/60 p-4 shadow-sm">
        <article
          aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.customerReceipt')}
          className="pos-receipt-print pos-receipt-ink-black pos-checkout-customer-receipt rounded-lg border border-nexoraBorder shadow-sm"
        >
          <div className="pos-receipt-print-header">
            <p className="pos-receipt-ticket">Ticket #{orderNumber}</p>
            <div className="pos-receipt-business">
              <h2>{businessName || 'VLINKPAY'}</h2>
              {businessAddress ? <p>{businessAddress}</p> : null}
              {businessPhone ? <p>{businessPhone}</p> : null}
            </div>
          </div>

          <section
            className="pos-receipt-lines"
            aria-label={t('components.dashboard.views.pos.PosOrderWorkspace.summaryItem')}
          >
            {receiptGroups.map((group) => (
              <div className="pos-receipt-tech-group" key={group.name}>
                <p className="pos-receipt-tech-heading">{group.name.toUpperCase()}</p>
                <div className="pos-receipt-group-lines">
                  {group.items.map((item) => (
                    <div key={item.id}>
                      <span>{item.name}</span>
                      <span className="tabular-nums">{formatUsdAmount(item.price)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </section>

          <dl className="pos-receipt-totals">
            <div>
              <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount')}</dt>
              <dd className="pos-receipt-discount">{formatUsdAmount(-Math.abs(discountAmount))}</dd>
            </div>
            <div>
              <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip')}</dt>
              <dd>{formatUsdAmount(tipAmount)}</dd>
            </div>
            <div className="pos-receipt-total">
              <dt>{t('components.dashboard.views.pos.PosOrderWorkspace.totalPaid')}</dt>
              <dd>{formatUsdAmount(total)}</dd>
            </div>
          </dl>

          <p className="pos-receipt-thank-you">
            {t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewThankYou')}
          </p>
        </article>
      </section>
    </div>
  )
}
