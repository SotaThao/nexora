import { useTranslation } from '../../../../contexts/LanguageContext'
import {
  POS_CHECKOUT_PAYMENT_METHOD_OPTIONS,
  type PosCheckoutPaymentMethodType,
} from '../../../../constants/posCheckoutPaymentMethod'

interface PosPaymentMethodSelectorProps {
  value: PosCheckoutPaymentMethodType
  onChange: (value: PosCheckoutPaymentMethodType) => void
  disabled?: boolean
}

export default function PosPaymentMethodSelector({
  value,
  onChange,
  disabled = false,
}: PosPaymentMethodSelectorProps) {
  const { t } = useTranslation()

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {POS_CHECKOUT_PAYMENT_METHOD_OPTIONS.map((method) => {
        const selected = value === method.value
        return (
          <button
            key={method.value}
            type="button"
            aria-pressed={selected}
            disabled={disabled}
            onClick={() => onChange(method.value)}
            className={`inline-flex min-h-11 w-auto flex-none items-center gap-2 whitespace-nowrap rounded-lg border px-3 text-[11px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
              selected
                ? 'border-nexoraBrand/50 bg-nexoraBrandSoft text-nexoraBrandDark'
                : 'border-nexoraBorder/70 bg-white text-nexoraText hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
            }`}
          >
            {method.iconSrc ? (
              <img
                src={method.iconSrc}
                alt=""
                aria-hidden="true"
                className="h-5 w-5 shrink-0 object-contain"
              />
            ) : null}
            <span>{t(method.labelKey)}</span>
          </button>
        )
      })}
    </div>
  )
}
