import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  POS_CHECKOUT_PAYMENT_METHOD_ICON_SOURCES,
  POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS,
  POS_CHECKOUT_PAYMENT_METHOD_OPTIONS,
  PosCheckoutPaymentMethod,
  isPosCheckoutPaymentMethod,
  type PosCheckoutPaymentMethodType,
} from '../../../../constants/posCheckoutPaymentMethod'
import type { PaymentMethodDto } from '../../../../types/domain'

interface PosPaymentMethodSelectorProps {
  value: PosCheckoutPaymentMethodType
  onChange: (value: PosCheckoutPaymentMethodType) => void
  receiveMethods?: PaymentMethodDto[]
  disabled?: boolean
}

const CORE_METHODS = new Set<PosCheckoutPaymentMethodType>([
  PosCheckoutPaymentMethod.Cash,
  PosCheckoutPaymentMethod.Card,
  PosCheckoutPaymentMethod.GiftCard,
  PosCheckoutPaymentMethod.SplitPay,
])

export default function PosPaymentMethodSelector({
  value,
  onChange,
  receiveMethods = [],
  disabled = false,
}: PosPaymentMethodSelectorProps) {
  const { t } = useTranslation()
  const [showMore, setShowMore] = useState(false)
  const coreOptions = POS_CHECKOUT_PAYMENT_METHOD_OPTIONS.filter((method) => CORE_METHODS.has(method.value))
  const receiveOptions = useMemo(() => {
    const seen = new Set<PosCheckoutPaymentMethodType>()
    return receiveMethods.flatMap((method) => {
      if (!method.isActive || !method.isConfigured || !isPosCheckoutPaymentMethod(method.type) || CORE_METHODS.has(method.type)) return []
      if (seen.has(method.type)) return []
      seen.add(method.type)
      return [{
        value: method.type,
        labelKey: POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS[method.type],
        iconSrc: POS_CHECKOUT_PAYMENT_METHOD_ICON_SOURCES[method.type],
      }]
    })
  }, [receiveMethods])

  useEffect(() => {
    if (!CORE_METHODS.has(value)) setShowMore(true)
  }, [value])

  const renderOption = (method: (typeof POS_CHECKOUT_PAYMENT_METHOD_OPTIONS)[number]) => {
    const selected = value === method.value
    return (
      <button
        key={method.value}
        type="button"
        aria-pressed={selected}
        disabled={disabled}
        onClick={() => onChange(method.value)}
        className={`inline-flex min-h-8 w-auto flex-none items-center justify-center gap-1 whitespace-nowrap rounded-lg border px-2 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
          selected
            ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
            : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
        }`}
      >
        {method.iconSrc ? (
          <img src={method.iconSrc} alt="" aria-hidden="true" className="h-5 w-5 shrink-0 object-contain" />
        ) : null}
        <span>{t(method.labelKey)}</span>
      </button>
    )
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {coreOptions.map(renderOption)}
        {receiveOptions.length > 0 ? (
          <button
            type="button"
            aria-expanded={showMore}
            disabled={disabled}
            onClick={() => setShowMore((current) => !current)}
            className="inline-flex min-h-8 w-auto flex-none items-center justify-center rounded-lg border border-nexoraBorder/70 bg-white px-2 text-[11px] font-semibold text-nexoraText transition-colors hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40 disabled:opacity-60"
          >
            ··· {t('components.dashboard.views.pos.PosOrderWorkspace.morePaymentMethods')}
          </button>
        ) : null}
      </div>
      {receiveOptions.length > 0 && showMore ? (
        <div className="flex flex-wrap items-center gap-1.5">
          {receiveOptions.map(renderOption)}
        </div>
      ) : null}
    </div>
  )
}
