import { useId } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import { supportsPayoutAccountName } from '../../data/paymentMethodTypes'
import { renderLabel } from '../../utils/renderLabel'

interface PayoutAccountNameFieldProps {
  walletKey: string
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
  error?: string
}

/** Account-holder-name input; renders only for methods that persist accountName. */
export default function PayoutAccountNameField({
  walletKey,
  value,
  onChange,
  disabled = false,
  error = '',
}: PayoutAccountNameFieldProps) {
  const { t } = useTranslation()
  const errorId = useId()

  if (!supportsPayoutAccountName(walletKey)) return null

  const inputClass = `w-full bg-slate-50 border rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
    error
      ? 'border-rose-300 focus:border-rose-400 focus:ring-2 focus:ring-rose-100'
      : 'border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:bg-white'
  } ${
    disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400' : ''
  }`

  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
        {renderLabel(`${t('components.payout.accountNameField.label')} *`)}
      </label>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('components.payout.accountNameField.placeholder')}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={inputClass}
      />
      {error ? (
        <p id={errorId} className="mt-1 text-[10px] font-bold text-rose-500">
          {error}
        </p>
      ) : null}
    </div>
  )
}
