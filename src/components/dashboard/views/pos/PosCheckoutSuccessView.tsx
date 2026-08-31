import { Check, ArrowRight } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { formatUsdAmount } from '../../../../utils/currencyInput'

export interface PosCheckoutReceiptItem {
  id: string
  name: string
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
  servicesSubtotal,
  productsSubtotal,
  discountAmount,
  tipAmount,
  salesTaxAmount,
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
  servicesSubtotal: number
  productsSubtotal: number
  discountAmount: number
  tipAmount: number
  salesTaxAmount: number
  items: PosCheckoutReceiptItem[]
  onStartNext: () => void
}) {
  const { t } = useTranslation()
  const subtotal = servicesSubtotal + productsSubtotal

  return (
    <div className="grid min-h-[70vh] gap-6 lg:grid-cols-[minmax(300px,5fr)_minmax(0,7fr)]">
      <section className="flex flex-col items-center justify-center rounded-2xl border border-nexoraBorder bg-white p-8 text-center shadow-sm">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600"><Check className="h-10 w-10" /></span>
        <p className="mt-5 text-[11px] font-black uppercase tracking-[0.2em] text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.checkoutComplete')}</p>
        <h1 className="mt-3 text-3xl font-black text-nexoraText">{t('components.dashboard.views.pos.PosOrderWorkspace.paymentComplete')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.ticketReadyToClose', { customer: customerName })}</p>
        <p className="my-8 text-5xl font-black tabular-nums text-nexoraText">{formatUsdAmount(total)}</p>
        <dl className="grid w-full grid-cols-3 gap-2 text-xs">
          {[
            [t('components.dashboard.views.pos.PosOrderWorkspace.successPayment'), paymentMethodLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successReceipt'), receiptLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successTicket'), `#${orderNumber}`],
          ].map(([label, value]) => <div key={label} className="rounded-xl bg-nexoraCanvas p-3"><dt className="text-nexoraMuted">{label}</dt><dd className="mt-1 font-black text-nexoraText">{value}</dd></div>)}
        </dl>
        <button type="button" onClick={onStartNext} className="mt-8 inline-flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-nexoraBrand text-base font-black text-white hover:bg-nexoraBrandDark">
          {t('components.dashboard.views.pos.PosOrderWorkspace.startNextCheckout')} <ArrowRight className="h-5 w-5" />
        </button>
      </section>
      <section className="rounded-2xl border border-nexoraBorder bg-white p-6 shadow-sm">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.customerReceipt')}</p>
        <h2 className="mt-2 text-2xl font-black text-nexoraText">{businessName || 'VLINKPAY'}</h2>
        {businessAddress ? <p className="mt-1 text-xs text-nexoraMuted">{businessAddress}</p> : null}
        {businessPhone ? <p className="text-xs text-nexoraMuted">{businessPhone}</p> : null}
        <dl className="my-5 grid grid-cols-2 gap-2 border-y border-dashed border-nexoraBorder py-4 text-xs sm:grid-cols-4">
          {[
            [t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewCustomer'), customerName],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successTicket'), `#${orderNumber}`],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successPayment'), paymentMethodLabel],
            [t('components.dashboard.views.pos.PosOrderWorkspace.successStatus'), t('components.dashboard.views.pos.PosOrderWorkspace.successPaid')],
          ].map(([label, value]) => <div key={label} className="rounded-lg bg-nexoraCanvas p-3"><dt className="text-[10px] font-bold uppercase text-nexoraMuted">{label}</dt><dd className="mt-1 font-black text-nexoraText">{value}</dd></div>)}
        </dl>
        <div className="divide-y divide-nexoraBorder">
          {items.map((item) => <div key={item.id} className="flex items-start justify-between gap-4 py-4"><div><p className="font-bold text-nexoraText">{item.name}</p>{item.detail ? <p className="text-xs text-nexoraMuted">{item.detail}</p> : null}</div><span className="font-black tabular-nums text-nexoraText">{formatUsdAmount(item.price)}</span></div>)}
        </div>
        <dl className="ml-auto mt-5 max-w-sm space-y-2 border-t border-dashed border-nexoraBorder pt-4 text-sm">
          {[
            [t('components.dashboard.views.pos.PosOrderWorkspace.summarySubtotal'), subtotal],
            [t('components.dashboard.views.pos.PosOrderWorkspace.summaryDiscount'), -Math.abs(discountAmount)],
            [t('components.dashboard.views.pos.PosOrderWorkspace.summaryTip'), tipAmount],
            [t('components.dashboard.views.pos.PosOrderWorkspace.summarySalesTax'), salesTaxAmount],
          ].map(([label, value]) => <div key={String(label)} className="flex justify-between"><dt className="text-nexoraMuted">{label}</dt><dd className="font-semibold text-nexoraText">{formatUsdAmount(Number(value))}</dd></div>)}
          <div className="flex justify-between border-t border-nexoraBorder pt-3 text-lg"><dt className="font-black text-nexoraText">{t('components.dashboard.views.pos.PosOrderWorkspace.totalPaid')}</dt><dd className="font-black text-nexoraText">{formatUsdAmount(total)}</dd></div>
        </dl>
      </section>
    </div>
  )
}
