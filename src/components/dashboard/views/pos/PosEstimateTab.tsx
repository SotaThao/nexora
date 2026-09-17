import { useRef, useState } from 'react'
import { Minus, Percent, Plus, Trash2, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useCheckoutServiceCatalog } from '../../../../data/hooks/usePosCheckout'
import { useEstimateCheckIn } from '../../../../data/hooks/usePosEstimate'
import { calculateEstimate, type EstimateDiscountType, type EstimateLine } from '../../../../data/repositories/posEstimate'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import { randomUuid } from '../../../../utils/uuid'
import CountryCodeSelect, { formatNationalNumber, getNationalPhonePlaceholder, isValidPhoneE164, normalizePhoneE164, PhoneDialCode } from '../../../CountryCodeSelect'
import PosServiceCatalogPanel from './PosServiceCatalogPanel'
import CustomServiceModal, { type CustomServiceTarget } from './modals/CustomServiceModal'
import ThankYouScreen from '../../../checkin/parts/ThankYouScreen'
import EstimateDiscountModal from './modals/EstimateDiscountModal'

const K = 'components.dashboard.views.pos.PosEstimateTab'
const W = 'components.dashboard.views.pos.PosOrderWorkspace'
const inputClass = 'h-11 w-full min-w-0 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm text-nexoraText focus:border-nexoraBrand focus:outline-none disabled:opacity-60'
const buttonClass = 'min-h-11 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText hover:border-nexoraBrand disabled:opacity-50'

export default function PosEstimateTab({ businessId, onCheckedIn, onFinished, onViewTickets }: {
  businessId: string
  onCheckedIn: () => void
  onFinished?: () => void
  onViewTickets?: () => void
}) {
  const { t } = useTranslation()
  const catalog = useCheckoutServiceCatalog(businessId)
  const checkIn = useEstimateCheckIn(businessId)
  const [lines, setLines] = useState<EstimateLine[]>([])
  const [discountType, setDiscountType] = useState<EstimateDiscountType>('percent')
  const [discountInput, setDiscountInput] = useState('0')
  const [discountEditing, setDiscountEditing] = useState(false)
  const [customTarget, setCustomTarget] = useState<CustomServiceTarget | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [phone, setPhone] = useState('')
  const [dialCode, setDialCode] = useState<string>(PhoneDialCode.US)
  const [error, setError] = useState('')
  const [completedCheckIn, setCompletedCheckIn] = useState<{ orderNumber: string; customerName: string } | null>(null)
  const submitting = useRef(false)
  const totals = calculateEstimate(lines, discountType, discountInput)
  const serviceCount = lines.reduce((sum, line) => sum + (Number.isFinite(line.quantity) ? line.quantity : 0), 0)
  const locked = checkIn.isPending || Boolean(checkIn.progress.result) || Boolean(checkIn.progress.uncertain)
  const customerValid = customerName.trim() !== '' && isValidPhoneE164(phone, dialCode)

  const stepQuantity = (key: string, delta: number) => {
    if (locked) return
    setLines(current => current.map(line => line.key === key && Number.isSafeInteger(line.quantity)
      ? { ...line, quantity: Math.min(99, Math.max(1, line.quantity + delta)) }
      : line))
  }

  const clear = () => {
    setLines([])
    setDiscountType('percent')
    setDiscountInput('0')
    setDiscountEditing(false)
    setCustomerName('')
    setPhone('')
    setDialCode(PhoneDialCode.US)
    setError('')
    setConfirming(false)
    checkIn.reset()
  }

  const submit = async () => {
    if (submitting.current || !totals.valid || !customerValid || checkIn.progress.uncertain) return
    submitting.current = true
    setError('')
    try {
      const result = await checkIn.mutateAsync({ customerName: customerName.trim(), customerPhone: normalizePhoneE164(phone, dialCode), lines, discountType, discountInput })
      clear()
      setCompletedCheckIn({ orderNumber: result.orderNumber, customerName: customerName.trim() })
      onCheckedIn()
    } catch {
      setError(t(`${K}.checkInFailed`))
    } finally {
      submitting.current = false
    }
  }

  if (completedCheckIn) {
    return (
      <ThankYouScreen
        orderNumber={completedCheckIn.orderNumber}
        customerName={completedCheckIn.customerName}
        autoReturnSeconds={null}
        onDone={() => { setCompletedCheckIn(null); onFinished?.() }}
      />
    )
  }

  return (
    <section className="space-y-4" aria-label={t(`${K}.title`)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold text-nexoraText">{t(`${K}.title`)}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t(`${K}.subtitle`)}</p>
        </div>
        <button type="button" className={buttonClass} disabled={locked || lines.length === 0} onClick={clear}>{t(`${K}.clear`)}</button>
      </div>
      <div className="grid min-w-0 items-start gap-5 lg:grid-cols-2">
        <PosServiceCatalogPanel
          className="pos-estimate-card"
          scrollInParentOnTablet
          items={catalog.data ?? []}
          isPending={locked}
          missingPriceLabel={t(`${K}.enterPrice`)}
          statusContent={catalog.isError ? (
            <div role="alert" className="space-y-2 text-sm text-nexoraDanger">
              <p>{t(`${K}.catalogError`)}</p>
              <button type="button" className={buttonClass} onClick={() => catalog.refetch()}>{t(`${K}.retry`)}</button>
            </div>
          ) : catalog.isPending ? <p className="text-sm text-nexoraMuted">{t('common.loading')}</p> : undefined}
          onAdd={id => {
            const service = catalog.data?.find(item => item.id === id)
            if (!service || locked) return
            const existing = lines.find(line => line.serviceId === id)
            if (existing) {
              setLines(current => current.map(line => line.key === existing.key ? { ...line, quantity: Math.min(99, line.quantity + 1) } : line))
            } else {
              setLines(current => [...current, { key: randomUuid(), serviceId: service.price == null ? null : id, name: service.name, price: service.price ?? null, quantity: 1 }])
            }
          }}
        />
        <div className="nexora-card pos-estimate-card min-w-0 space-y-3 px-4 pb-4 pt-2 sm:px-5 sm:pb-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="shrink-0 text-lg font-extrabold text-nexoraText">{t(`${K}.yourEstimate`)}</h3>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={`${buttonClass} !min-h-9 inline-flex items-center gap-1.5 bg-nexoraCanvas transition-colors hover:bg-nexoraBrand/5`} aria-haspopup="dialog" onClick={() => setDiscountEditing(true)} disabled={locked}>
                <Percent aria-hidden="true" className="h-4 w-4 shrink-0 text-nexoraMuted" />
                {t(`${K}.discountAll`)}
              </button>
              <button type="button" className={`${buttonClass} !min-h-9 inline-flex items-center justify-center gap-1.5`} onClick={() => setCustomTarget({})} disabled={locked}>
                <Plus aria-hidden="true" className="h-4 w-4 shrink-0" />
                <span>{t(`${W}.addCustomServiceButton`)}</span>
              </button>
            </div>
          </div>
          {lines.length === 0 ? <p className="py-8 text-center text-sm text-nexoraMuted">{t(`${K}.empty`)}</p> : (
            <div className="pos-estimate-lines divide-y divide-dashed divide-nexoraBorder">
              <div className="pos-estimate-line-header hidden gap-2 pb-3 text-[11px] font-bold text-nexoraMuted">
                <span>{t(`${K}.service`)}</span><span>{t(`${K}.unitPrice`)}</span><span>{t(`${K}.quantity`)}</span><span />
              </div>
              {lines.map(line => (
                <div key={line.key} className="pos-estimate-line grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 py-2">
                  <div className="min-w-0">
                    <span className="break-words text-sm font-bold text-nexoraText">{line.name}</span>
                    {line.serviceId == null ? <span className="ml-2 text-[11px] text-nexoraMuted">{t(`${W}.customServiceBadge`)}</span> : null}
                  </div>
                  {line.serviceId == null ? <button type="button" className={`${buttonClass} pos-estimate-line-price justify-self-end text-left`} disabled={locked} onClick={() => setCustomTarget({ serviceLineId: line.key, customServiceName: line.name, unitPrice: line.price ?? undefined, note: line.note })} aria-label={t(`${K}.editPrice`, { name: line.name })}>{line.price == null ? t(`${K}.enterPrice`) : formatUsdAmount(line.price)}</button> : <span className="pos-estimate-line-price justify-self-end whitespace-nowrap text-sm font-semibold text-nexoraMuted">{formatUsdAmount(line.price as number)}</span>}
                  <div role="group" aria-label={t(`${K}.lineQuantity`, { name: line.name })} className="flex h-8 w-[5.5rem] min-w-0 items-center justify-self-end overflow-hidden rounded-lg border border-nexoraBorder bg-nexoraSurface focus-within:border-nexoraBrand">
                    <button type="button" aria-label={`${t(`${W}.decreaseQty`)}: ${line.name}`} className="flex h-full w-7 shrink-0 items-center justify-center text-nexoraMuted transition-colors hover:bg-nexoraBrand/5 hover:text-nexoraBrandDark focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-nexoraBrand disabled:opacity-30" disabled={locked || !Number.isSafeInteger(line.quantity) || line.quantity <= 1} onClick={() => stepQuantity(line.key, -1)}><Minus aria-hidden="true" className="h-3.5 w-3.5" /></button>
                    <input type="number" min={1} max={99} step={1} inputMode="numeric" aria-label={t(`${K}.lineQuantity`, { name: line.name })} className="h-full min-w-0 flex-1 appearance-none border-0 bg-transparent p-0 text-center text-xs font-semibold text-nexoraText outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none disabled:opacity-60" value={Number.isNaN(line.quantity) ? '' : line.quantity} disabled={locked} onChange={event => {
                      const quantity = event.target.value === '' ? NaN : Number(event.target.value)
                      setLines(current => current.map(item => item.key === line.key ? { ...item, quantity } : item))
                    }} />
                    <button type="button" aria-label={`${t(`${W}.increaseQty`)}: ${line.name}`} className="flex h-full w-7 shrink-0 items-center justify-center text-nexoraMuted transition-colors hover:bg-nexoraBrand/5 hover:text-nexoraBrandDark focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-nexoraBrand disabled:opacity-30" disabled={locked || !Number.isSafeInteger(line.quantity) || line.quantity >= 99} onClick={() => stepQuantity(line.key, 1)}><Plus aria-hidden="true" className="h-3.5 w-3.5" /></button>
                  </div>
                  <button type="button" className="flex h-11 w-11 items-center justify-center justify-self-end rounded-lg text-nexoraMuted hover:bg-nexoraCanvas disabled:opacity-50" disabled={locked} aria-label={t(`${K}.removeService`, { name: line.name })} onClick={() => setLines(current => current.filter(item => item.key !== line.key))}><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>
          )}
          <div className="space-y-3">
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between gap-3"><dt className="text-nexoraMuted">{t(`${K}.subtotal`)}</dt><dd className="font-bold text-nexoraText">{formatUsdAmount(totals.subtotal)}</dd></div>
              <div className="flex justify-between gap-3"><dt className="text-nexoraMuted">{discountType === 'percent' && Number(discountInput) > 0 ? t(`${K}.discountWithPercent`, { value: Number(discountInput) }) : t(`${K}.discount`)}</dt><dd className="font-bold text-nexoraDanger">{totals.discount > 0 ? '−' : ''}{formatUsdAmount(totals.discount)}</dd></div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-nexoraBorder pt-4"><dt className="font-bold text-nexoraText">{t(`${K}.total`)}</dt><dd data-testid="estimate-total" className="text-2xl font-black text-nexoraBrandDark">{formatUsdAmount(totals.total)}</dd></div>
            </dl>
          </div>
          {lines.length > 0 && !totals.valid ? <p role="alert" className="text-xs text-nexoraDanger">{t(`${K}.invalidEstimate`)}</p> : null}
          <p className="text-xs leading-relaxed text-nexoraMuted">{t(`${K}.disclaimer`)}</p>
          <button type="button" className="min-h-12 w-full rounded-xl bg-nexoraBrand px-4 py-3 text-sm font-extrabold text-white hover:bg-nexoraBrandDark disabled:opacity-50" disabled={!totals.valid || checkIn.isPending} onClick={() => setConfirming(true)}>{t(`${K}.${serviceCount === 1 ? 'checkInOne' : 'checkIn'}`)}</button>
        </div>
      </div>
      <CustomServiceModal target={customTarget} isSaving={locked} technicians={[]} showTechnician={false} hint={t(`${K}.customHint`)} addButtonLabel={t(`${K}.addToEstimate`)} onClose={() => setCustomTarget(null)} onSubmit={payload => {
        if (locked) return
        const targetKey = customTarget?.serviceLineId
        setLines(current => targetKey ? current.map(line => line.key === targetKey ? { ...line, name: payload.customServiceName, price: payload.price, note: payload.note } : line) : [...current, { key: randomUuid(), serviceId: null, name: payload.customServiceName, price: payload.price, quantity: 1, note: payload.note }])
        setCustomTarget(null)
      }} />
      {discountEditing ? <EstimateDiscountModal lines={lines} initialType={discountType} initialInput={discountInput} disabled={locked} onClose={() => setDiscountEditing(false)} onApply={(type, input) => { setDiscountType(type); setDiscountInput(input); setDiscountEditing(false) }} /> : null}
      {confirming ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/60 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="estimate-checkin-title" className="nexora-modal-card w-full max-w-md">
            <div className="mb-4 flex shrink-0 items-center justify-between gap-3"><h3 id="estimate-checkin-title" className="text-lg font-extrabold text-nexoraText">{t(`${K}.confirmTitle`)}</h3><button type="button" className="flex h-11 w-11 items-center justify-center" aria-label={t(`${K}.back`)} disabled={checkIn.isPending} onClick={() => setConfirming(false)}><X className="h-5 w-5" /></button></div>
            <div className="min-h-0 flex-1 space-y-4 overflow-y-auto">
              <p className="text-sm font-bold text-nexoraText">{t(`${K}.total`)}: {formatUsdAmount(totals.total)}</p>
              <div><label htmlFor="estimate-customer" className="mb-1 block text-xs font-bold text-nexoraMuted">{t(`${K}.customerName`)}</label><input id="estimate-customer" className={inputClass} autoComplete="name" maxLength={200} placeholder={t(`${K}.namePlaceholder`)} value={customerName} disabled={locked} onChange={event => setCustomerName(event.target.value)} /></div>
              <div><label htmlFor="estimate-phone" className="mb-1 block text-xs font-bold text-nexoraMuted">{t(`${K}.phone`)}</label><div className="flex rounded-lg border border-nexoraBorder"><CountryCodeSelect embedded value={dialCode} disabled={locked} onChange={code => { setDialCode(code); setPhone(formatNationalNumber(phone, code)) }} /><input id="estimate-phone" type="tel" autoComplete="tel-national" className={`${inputClass} !border-0`} placeholder={getNationalPhonePlaceholder(dialCode)} value={phone} disabled={locked} onChange={event => setPhone(formatNationalNumber(event.target.value, dialCode))} /></div></div>
              {error ? <p role="alert" className="text-sm text-nexoraDanger">{checkIn.progress.uncertain ? t(`${K}.uncertain`) : checkIn.progress.result ? t(`${K}.partialFailure`, { number: checkIn.progress.result.orderNumber }) : error}</p> : null}
              {checkIn.progress.uncertain ? <button type="button" className={buttonClass} onClick={() => { setConfirming(false); onViewTickets?.() }}>{t(`${K}.viewTickets`)}</button> : null}
              {checkIn.progress.uncertain ? <button type="button" className={buttonClass} onClick={clear}>{t(`${K}.verifiedReset`)}</button> : null}
            </div>
            <div className="mt-5 flex shrink-0 gap-2"><button type="button" className={buttonClass} disabled={checkIn.isPending} onClick={() => setConfirming(false)}>{t(`${K}.back`)}</button><button type="button" className="min-h-11 flex-1 rounded-lg bg-nexoraBrand px-3 text-sm font-bold text-white disabled:opacity-50" disabled={checkIn.isPending || !customerValid || !totals.valid || checkIn.progress.uncertain} onClick={submit}>{checkIn.isPending ? t('common.loading') : t(`${K}.confirm`)}</button></div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
