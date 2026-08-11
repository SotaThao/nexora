import { useEffect, useState } from 'react'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  type BankWireAccountDetails,
  parseBankWireAccount,
  serializeBankWireAccount,
} from './bankWireAccount'

interface BankWireAccountFormProps {
  value: string
  onChange: (value: string) => void
  onBeneficiaryNameChange?: (value: string) => void
  disabled?: boolean
  error?: string
}

const fieldClass =
  'mt-auto h-8 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none transition focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed'

export default function BankWireAccountForm({
  value,
  onChange,
  onBeneficiaryNameChange,
  disabled = false,
  error,
}: BankWireAccountFormProps) {
  const { t } = useTranslation()
  const [details, setDetails] = useState<BankWireAccountDetails>(() => parseBankWireAccount(value))

  useEffect(() => {
    setDetails(parseBankWireAccount(value))
  }, [value])

  const updateField = (field: keyof BankWireAccountDetails, nextValue: string) => {
    const nextDetails = { ...details, [field]: nextValue }
    setDetails(nextDetails)
    onChange(serializeBankWireAccount(nextDetails))
    if (field === 'beneficiaryName') {
      onBeneficiaryNameChange?.(nextValue)
    }
  }

  const renderInput = (
    field: keyof BankWireAccountDetails,
    labelKey: string,
    placeholderKey?: string,
    containerClass = '',
  ) => (
    <div className={`flex min-w-0 flex-col ${containerClass}`}>
      <label className="mb-1.5 block text-xs font-bold text-slate-600">
        {t(labelKey)} <span className="text-rose-500">*</span>
      </label>
      <input
        required
        disabled={disabled}
        value={details[field]}
        onChange={(event) => updateField(field, event.target.value)}
        placeholder={placeholderKey ? t(placeholderKey) : undefined}
        className={`${fieldClass} ${error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''}`}
      />
    </div>
  )

  return (
    <div data-testid="bank-wire-account-form" className="grid grid-cols-2 gap-x-3 gap-y-2.5">
      {renderInput('beneficiaryName', 'components.payout.bankWireForm.beneficiaryName')}
      {renderInput('bankName', 'components.payout.bankWireForm.bankName')}
      {renderInput('routingNumber', 'components.payout.bankWireForm.routingNumber')}
      {renderInput('accountNumber', 'components.payout.bankWireForm.accountNumber')}
      {renderInput(
        'bankAddress',
        'components.payout.bankWireForm.bankAddress',
        undefined,
        'col-span-2',
      )}
      {renderInput('city', 'components.payout.bankWireForm.city')}
      {renderInput('state', 'components.payout.bankWireForm.state')}
      {renderInput('zipCode', 'components.payout.bankWireForm.zipCode')}
      {renderInput(
        'country',
        'components.payout.bankWireForm.country',
        'components.payout.bankWireForm.selectCountry',
      )}
      {error && <p className="col-span-2 text-[10px] font-bold text-rose-500">{error}</p>}
    </div>
  )
}
