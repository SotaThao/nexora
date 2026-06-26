import React, { useState, useEffect } from 'react'
import { AlertTriangle, Camera, FolderOpen, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { WalletLogos } from './constants'
import ImageFileInput from '../ui/ImageFileInput'
import { captureQrImage } from '../../utils/qrCode'
import BankWireAccountForm from '../payout/BankWireAccountForm'
import PayoutAccountIdentifierInput from '../payout/PayoutAccountIdentifierInput'
import { formatPayoutPhoneDisplay } from '../payout/payoutPhone'
import {
  getBankWireBeneficiaryName,
  isBankWireAccountComplete,
} from '../payout/bankWireAccount'
import { isValidEmail, isValidPhone } from '../../utils/validation'

const validatePayoutAccount = (method, input) => {
  const account = String(input || '').trim()
  if (!account) return 'required'
  if (method === 'zelle') return isValidEmail(account) || isValidPhone(account) ? '' : 'emailOrPhone'
  if (method === 'paypal') return isValidEmail(account) ? '' : 'email'
  if (method === 'venmo') return /^@[A-Za-z0-9_]{2,30}$/.test(account) ? '' : 'venmo'
  if (method === 'applecash') return isValidPhone(account) ? '' : 'phone'
  return account.length >= 3 ? '' : 'invalid'
}

export default function PayoutSetupModal({ open, walletKey, staffName, initialValue, initialQrCode, onClose, onSubmit }) {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialValue || '')
  const [qrCode, setQrCode] = useState(initialQrCode || '')
  const [accountName, setAccountName] = useState(staffName || '')
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(initialValue || '')
    setQrCode(initialQrCode || '')
    setAccountName(staffName || '')
    setError('')
  }, [open, walletKey, initialValue, initialQrCode, staffName])

  if (!open) return null
  const isBankWire = walletKey === 'bankwire'

  const walletNames = {
    zelle: 'Zelle',
    bankwire: 'Bank Wire',
    paypal: 'PayPal',
    venmo: 'Venmo',
    cashapp: 'Cash App',
    applecash: 'Apple Cash'
  }

  const walletPlaceholders = {
    zelle: 'Enter Zelle email/phone...',
    bankwire: 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: 'Enter phone number...'
  }

  const handleImagePick = (dataUrl) => {
    if (dataUrl) setQrCode(dataUrl)
  }

  const handleTakePhoto = async () => {
    setIsCapturing(true)
    try {
      const dataUrl = await captureQrImage({ fallbackValue: value || '' })
      if (dataUrl) setQrCode(dataUrl)
    } finally {
      setIsCapturing(false)
    }
  }

  const handleClearQr = () => {
    setQrCode('')
  }

  const handleSubmit = () => {
    if (isBankWire) {
      if (!isBankWireAccountComplete(value)) {
        setError(t('components.payout.bankWireForm.completeRequired'))
        return
      }
      onSubmit(value, '', getBankWireBeneficiaryName(value) || accountName)
      return
    }
    const validationKey = validatePayoutAccount(walletKey, value)
    if (validationKey) {
      setError(t(`components.settings.tabs.ProfileTab.validation.${validationKey}`))
      return
    }
    onSubmit(value, qrCode, accountName)
  }

  const brandStyles = {
    venmo: { text: 'venmo', color: 'text-walletVenmo', fontClass: 'font-black italic text-lg tracking-tight' },
    cashapp: { text: 'cash app', color: 'text-walletCashapp', fontClass: 'font-extrabold text-lg tracking-tighter' },
    zelle: { text: 'zelle', color: 'text-walletZelle', fontClass: 'font-black text-lg' },
    paypal: { text: 'PayPal', color: 'text-walletPaypal', fontClass: 'font-black italic text-lg' },
    applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
    bankwire: { text: 'Bank Wire', color: 'text-slate-600', fontClass: 'font-bold uppercase text-xs tracking-widest' }
  }[walletKey] || { text: walletKey, color: 'text-slate-800', fontClass: 'font-bold' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-left">
      <div className={`bg-white rounded-3xl border border-slate-100 w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp space-y-4.5 ${isBankWire ? 'max-w-md' : 'max-w-sm'}`}>
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
          <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {WalletLogos[walletKey]}
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {isBankWire
                ? t('components.payout.bankWireForm.title')
                : t('components.setup_wizard.PayoutSetupModal.walletAccountTitle', {
                  wallet: walletNames[walletKey]?.toUpperCase(),
                })}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {t('components.setup_wizard.PayoutSetupModal.specifyReceivingTargetIdentifier')}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {isBankWire && (
            <BankWireAccountForm
              value={value}
              onChange={(nextValue) => {
                setValue(nextValue)
                setError('')
              }}
              onBeneficiaryNameChange={setAccountName}
              error={error}
            />
          )}
          {!isBankWire && (
          <>
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {t('components.setup_wizard.PayoutSetupModal.accountIdentifier')}
            </label>
            <PayoutAccountIdentifierInput
              walletKey={walletKey}
              value={value}
              hasError={Boolean(error)}
              placeholder={walletPlaceholders[walletKey]}
              onChange={(nextValue) => {
                setValue(nextValue)
                setError('')
              }}
            />
            {error && <p className="mt-1 text-[10px] font-bold text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {t('components.setup_wizard.PayoutSetupModal.qrCodeOptional')}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">{t('setup.taking_photo')}</span>
              </div>
            ) : qrCode ? (
              <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4.5 shadow-sm">
                <button
                  type="button"
                  onClick={handleClearQr}
                  className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">{accountName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">
                    {formatPayoutPhoneDisplay(value) || value}
                  </div>
                </div>
                <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                  <img src={qrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                </div>
                <div className={`${brandStyles.color} ${brandStyles.fontClass}`}>
                  {brandStyles.text}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleTakePhoto}
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                >
                  <Camera className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.take_photo')}</span>
                </button>
                <ImageFileInput
                  as="label"
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                  onPick={handleImagePick}
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.choose_file')}</span>
                </ImageFileInput>
              </div>
            )}
            {!qrCode && (
              <p className="mt-2 text-[10px] text-slate-400 leading-normal">
                {t('setup.uploader_hint')}
              </p>
            )}
          </div>
          </>
          )}

          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10.5px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {t(isBankWire ? 'components.payout.bankWireForm.warning' : 'setup.payout_warning')}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
          >
            {t(isBankWire ? 'setup.close' : 'components.setup_wizard.PayoutSetupModal.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
          >
            {t(isBankWire ? 'common.update' : 'components.setup_wizard.PayoutSetupModal.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
