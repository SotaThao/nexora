import { useTranslation } from '../../contexts/LanguageContext'
import { supportsPayoutAccountName } from '../../data/paymentMethodTypes'

interface PayoutAccountNameFieldProps {
  walletKey: string
  value: string
  onChange: (nextValue: string) => void
  disabled?: boolean
}

/** Account-holder-name input; renders only for methods that persist accountName. */
export default function PayoutAccountNameField({
  walletKey,
  value,
  onChange,
  disabled = false,
}: PayoutAccountNameFieldProps) {
  const { t } = useTranslation()

  if (!supportsPayoutAccountName(walletKey)) return null

  const inputClass = `w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
    disabled ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''
  }`

  return (
    <div>
      <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
        {t('components.payout.accountNameField.label')}
      </label>
      <input
        type="text"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t('components.payout.accountNameField.placeholder')}
        className={inputClass}
      />
    </div>
  )
}
