// ReceiptPage — what the customer sees when they tap the link in their checkout SMS.
//
// Anonymous and read-only: the token in the URL is the only credential, and the page offers no
// actions (no tipping, no review, no rebooking — those keep their own entry points). Mobile first,
// because it is always opened from a text message.
//
// English only, deliberately: this is a customer-facing document for US salons, and the viewer's
// stored app language belongs to whoever last used that browser — a merchant who works in Vietnamese
// would otherwise hand their customer a Vietnamese receipt. So it reads en.json directly rather than
// going through useTranslation(). The Vietnamese copies of these keys stay in vi.json to keep the
// locale files at parity and to leave a future language switcher one prop away.
import { useParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { usePublicReceipt } from '../../data/hooks/usePublicReceipt'
import en from '../../locales/en.json'
import { parseApiUtcDateTime } from '../../utils/localDate'
import { resolveTranslation } from '../../utils/translate'
import type { TranslationVariables } from '../../types/contexts'
import type { ReceiptApiDto } from '../../types/repositories'
import { formatPromotionRate } from '../dashboard/views/pos/posPromotionDisplay'

const K = 'public.receipt'

// Dates follow the copy: an English receipt showing "18 thg 8" would read as a bug.
const RECEIPT_LOCALE = 'en-US'

const t = (key: string, variables?: TranslationVariables) => resolveTranslation(en, key, variables)

function money(amount: number): string {
  return `$${amount.toFixed(2)}`
}

/**
 * Renders the completion time in the salon's own zone. The instant arrives as UTC (often without a
 * trailing Z — see parseApiUtcDateTime), and the browser does the zone maths, which keeps this off
 * the server where the available zone database depends on the host OS.
 *
 * A business with no zone set, or one the browser rejects, falls back to UTC and says so rather
 * than showing a UTC time dressed up as local.
 */
function formatCompletedAt(iso: string, timeZone: string | null): string {
  const date = parseApiUtcDateTime(iso)
  if (!date) return ''

  const options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' }
  if (timeZone) {
    try {
      return new Intl.DateTimeFormat(RECEIPT_LOCALE, { ...options, timeZone }).format(date)
    } catch {
      // Unknown zone id — fall through to the UTC form below.
    }
  }
  return `${new Intl.DateTimeFormat(RECEIPT_LOCALE, { ...options, timeZone: 'UTC' }).format(date)} UTC`
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-md">{children}</div>
    </div>
  )
}

function AmountRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? 'text-sm font-black text-nexoraText' : 'text-xs text-nexoraMuted'}>{label}</span>
      <span
        className={
          strong
            ? 'text-base font-black tabular-nums text-nexoraText'
            : 'text-xs font-bold tabular-nums text-nexoraText'
        }
      >
        {value}
      </span>
    </div>
  )
}

function ReceiptBody({ receipt }: { receipt: ReceiptApiDto }) {
  return (
    <div className="nexora-card space-y-4 p-5">
      <header className="space-y-1 border-b border-nexoraBorder pb-4 text-center">
        <h1 className="text-lg font-black text-nexoraText">{receipt.salonName}</h1>
        <p className="text-xs font-bold text-nexoraMuted">
          {t(`${K}.ticketNumber`, { number: receipt.ticketNumber })}
        </p>
        <p className="text-xs text-nexoraMuted">
          {formatCompletedAt(receipt.completedAt, receipt.timeZone)}
        </p>
        <p className="pt-1 text-sm font-bold text-nexoraText">{receipt.customerName}</p>
      </header>

      {receipt.serviceLines.length > 0 ? (
        <section className="space-y-2">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.servicesTitle`)}
          </h2>
          {receipt.serviceLines.map((line, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-nexoraText">{line.serviceName}</p>
                  <p className="text-xs text-nexoraMuted">
                    {line.technicianName ?? t(`${K}.firstAvailable`)}
                    {line.quantity > 1 ? ` · ×${line.quantity}` : ''}
                  </p>
                </div>
                {/* Both figures, so the customer can see the reduction they were promised rather than
                    just a net amount they have to trust. */}
                <span className="shrink-0 text-sm font-bold tabular-nums text-nexoraText">
                  {line.discountAmount > 0 ? (
                    <>
                      <span className="mr-1.5 font-normal text-nexoraMuted line-through">
                        {money(line.lineTotal)}
                      </span>
                      {money(line.lineTotalAfterDiscount)}
                    </>
                  ) : (
                    money(line.lineTotal)
                  )}
                </span>
              </div>

              {/* Indented under the service it was performed with — the customer has to be able to
                  see where an extra charge came from. */}
              {line.addOns?.length ? (
                <div className="space-y-1 border-l-2 border-nexoraBorder pl-3">
                  {line.addOns.map((addOn, addOnIndex) => (
                    <div key={addOnIndex} className="flex items-start justify-between gap-3">
                      <p className="min-w-0 text-xs font-bold text-nexoraText">+ {addOn.addOnName}</p>
                      <span className="shrink-0 text-xs font-bold tabular-nums text-nexoraText">
                        {addOn.discountAmount > 0 ? (
                          <>
                            <span className="mr-1.5 font-normal text-nexoraMuted line-through">
                              {money(addOn.lineTotal)}
                            </span>
                            {money(addOn.lineTotalAfterDiscount)}
                          </>
                        ) : (
                          money(addOn.lineTotal)
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </section>
      ) : null}

      {receipt.productLines.length > 0 ? (
        <section className="space-y-2 border-t border-nexoraBorder pt-4">
          <h2 className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {t(`${K}.productsTitle`)}
          </h2>
          {receipt.productLines.map((line, index) => (
            <div key={index} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-bold text-nexoraText">{line.productName}</p>
                <p className="text-xs text-nexoraMuted">
                  {money(line.unitPrice)}
                  {line.quantity > 1 ? ` · ×${line.quantity}` : ''}
                </p>
              </div>
              <span className="shrink-0 text-sm font-bold tabular-nums text-nexoraText">
                {money(line.lineTotal)}
              </span>
            </div>
          ))}
        </section>
      ) : null}

      <section className="space-y-1.5 border-t border-nexoraBorder pt-4">
        <AmountRow label={t(`${K}.servicesSubtotal`)} value={money(receipt.servicesSubtotal)} />
        {receipt.productLines.length > 0 ? (
          <AmountRow label={t(`${K}.productsSubtotal`)} value={money(receipt.productsSubtotal)} />
        ) : null}
        <AmountRow label={t(`${K}.tip`)} value={money(receipt.tipAmount)} />
        {receipt.discountAmount !== 0 ? (
          <AmountRow label={t(`${K}.serviceDiscounts`)} value={`-${money(Math.abs(receipt.discountAmount))}`} />
        ) : null}
        {/* Its own line, named after the promotion when one was used — that name is what the
            customer remembers the offer by, and it is separate from any per-service reduction. */}
        {receipt.orderDiscountAmount > 0 ? (
          <AmountRow
            label={
              receipt.appliedPromotionName
                ? t(`${K}.promotionDiscount`, {
                    name: receipt.appliedPromotionName,
                    rate: formatPromotionRate(receipt.orderDiscountType ?? '', receipt.orderDiscountValue ?? 0),
                  })
                : t(`${K}.orderDiscount`)
            }
            value={`-${money(receipt.orderDiscountAmount)}`}
          />
        ) : null}
        <AmountRow label={t(`${K}.salesTax`)} value={money(receipt.salesTaxAmount)} />
        <div className="border-t border-nexoraBorder pt-2">
          <AmountRow label={t(`${K}.total`)} value={money(receipt.total)} strong />
        </div>
      </section>

      {receipt.paymentMethodType ? (
        <p className="border-t border-nexoraBorder pt-4 text-center text-xs text-nexoraMuted">
          {t(`${K}.paidWith`, {
            method: t(`${K}.paymentMethod.${receipt.paymentMethodType}`),
          })}
        </p>
      ) : null}
    </div>
  )
}

export default function ReceiptPage() {
  const { receiptToken } = useParams<{ receiptToken: string }>()
  const { data, isLoading, isError } = usePublicReceipt(receiptToken)

  if (isLoading) {
    return (
      <Shell>
        <div className="nexora-card flex items-center justify-center p-10">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
        </div>
      </Shell>
    )
  }

  // One screen for every failure: a made-up token, a real token whose order was never completed,
  // and a network error all look the same, so nothing here confirms which tokens exist.
  if (isError || !data) {
    return (
      <Shell>
        <div className="nexora-card space-y-2 p-8 text-center">
          <h1 className="text-base font-black text-nexoraText">{t(`${K}.notFoundTitle`)}</h1>
          <p className="text-xs text-nexoraMuted">{t(`${K}.notFoundBody`)}</p>
        </div>
      </Shell>
    )
  }

  return (
    <Shell>
      <ReceiptBody receipt={data} />
    </Shell>
  )
}
