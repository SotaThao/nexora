import React, { useState, useEffect } from 'react'
import { AlertTriangle, Camera, FolderOpen, X } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { WalletLogos } from './constants'

export default function PayoutSetupModal({ open, walletKey, staffName, initialValue, initialQrCode, onClose, onSubmit }) {
  const { t, currentLanguage } = useTranslation()
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

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setQrCode(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTakePhoto = () => {
    setIsCapturing(true)
    setTimeout(() => {
      const mockQr = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        value || 'nexora-mock-payout'
      )}`
      setQrCode(mockQr)
      setIsCapturing(false)
    }, 800)
  }

  const handleClearQr = () => {
    setQrCode('')
  }

  const handleSubmit = () => {
    if (!value.trim()) {
      setError(t('setup.errors.field_required') || 'This field is required.')
      return
    }
    onSubmit(value, qrCode, accountName)
  }

  const brandStyles = {
    venmo: { text: 'venmo', color: 'text-[#008CFF]', fontClass: 'font-black italic text-lg tracking-tight' },
    cashapp: { text: 'cash app', color: 'text-[#00D632]', fontClass: 'font-extrabold text-lg tracking-tighter' },
    zelle: { text: 'zelle', color: 'text-[#7414CA]', fontClass: 'font-black text-lg' },
    paypal: { text: 'PayPal', color: 'text-[#003087]', fontClass: 'font-black italic text-lg' },
    applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
    bankwire: { text: 'Bank Wire', color: 'text-[#475569]', fontClass: 'font-bold uppercase text-xs tracking-widest' }
  }[walletKey] || { text: walletKey, color: 'text-slate-800', fontClass: 'font-bold' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-left">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp space-y-4.5">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
          <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {WalletLogos[walletKey]}
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {currentLanguage === 'vi'
                ? `TÀI KHOẢN ${walletNames[walletKey]?.toUpperCase()}`
                : `${walletNames[walletKey]?.toUpperCase()} ACCOUNT`}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {currentLanguage === 'vi' ? 'Chỉ định thông tin tài khoản nhận tiền' : 'Specify receiving target identifier'}
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'THÔNG TIN TÀI KHOẢN' : 'Account Identifier'}
            </label>
            <input
              type="text"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder={walletPlaceholders[walletKey]}
              className={`w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-[#4648D8]/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
                error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
              }`}
            />
            {error && <p className="mt-1 text-[10px] font-bold text-rose-500">{error}</p>}
          </div>

          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'MÃ QR (TÙY CHỌN)' : 'QR Code (optional)'}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">{t('setup.taking_photo') || 'Taking photo...'}</span>
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
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{value}</div>
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
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.take_photo') || 'Take photo'}</span>
                </button>
                <label
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">{t('setup.choose_file') || 'Choose file'}</span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleFileChange} />
                </label>
              </div>
            )}
            {!qrCode && (
              <p className="mt-2 text-[10px] text-slate-400 leading-normal">
                {t('setup.uploader_hint') || 'You can either take a photo or upload from your device. Accepted formats: JPG, PNG, JPEG. Max size: 5MB per file.'}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10.5px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {t('setup.payout_warning') || 'Please enter the correct receiving account information. This will be used to receive payments.'}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
          >
            {currentLanguage === 'vi' ? 'HỦY' : 'CANCEL'}
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
          >
            {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
          </button>
        </div>
      </div>
    </div>
  )
}
