import { useState, useEffect } from 'react'
import { X, Camera, FolderOpen, AlertTriangle, Bitcoin } from 'lucide-react'
import { useTranslation, renderLabel } from '../../../contexts/LanguageContext'

function PayoutSetupModal({ open, walletKey, staffName, initialValue, initialQrCode, onClose, onSubmit, readOnly = false }) {
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
    applecash: 'Apple Cash',
    vlinkpay: 'VLINKPAY Wallet',
    crypto: 'Crypto Wallet'
  }

  const walletFields = {
    zelle: 'email/phone',
    bankwire: 'details',
    paypal: 'email',
    venmo: '@username',
    cashapp: '$cashtag',
    applecash: 'phone number',
    vlinkpay: 'VLINKPAY ID',
    crypto: 'BTC/USDT Address'
  }

  const walletPlaceholders = {
    zelle: 'Enter Zelle email/phone...',
    bankwire: 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: 'Enter phone number...',
    vlinkpay: 'Enter VLINKPAY ID (e.g. VLP-0123-MIA)...',
    crypto: 'Enter BTC/ETH/USDT address...'
  }

  const handleFileChange = (e) => {
    if (readOnly) return
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setQrCode(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleTakePhoto = () => {
    if (readOnly) return
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
    if (readOnly) return
    setQrCode('')
  }

  const handleSubmit = () => {
    if (readOnly) return
    if (!value.trim()) {
      setError(t('setup.errors.field_required') || 'This field is required.')
      return
    }
    onSubmit(value, qrCode, accountName)
  }

  const PayoutLogos = {
    zelle: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#7414CA]" xmlns="http://www.w3.org/2000/svg">
        <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
      </svg>
    ),
    bankwire: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#475569]" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
      </svg>
    ),
    paypal: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#003087]" xmlns="http://www.w3.org/2000/svg">
        <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
        <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
      </svg>
    ),
    venmo: (
      <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-[#008CFF]" xmlns="http://www.w3.org/2000/svg">
        <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
      </svg>
    ),
    cashapp: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-[#00D632]" xmlns="http://www.w3.org/2000/svg">
        <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32c1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
      </svg>
    ),
    applecash: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
      </svg>
    ),
    vlinkpay: (
      <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain shrink-0" />
    ),
    crypto: (
      <Bitcoin className="h-[18px] w-[18px] text-amber-500 shrink-0" />
    )
  }

  const brandStyles = {
    venmo: { text: 'venmo', color: 'text-[#008CFF]', fontClass: 'font-black italic text-lg tracking-tight' },
    cashapp: { text: 'cash app', color: 'text-[#00D632]', fontClass: 'font-extrabold text-lg tracking-tighter' },
    zelle: { text: 'zelle', color: 'text-[#7414CA]', fontClass: 'font-black text-lg' },
    paypal: { text: 'PayPal', color: 'text-[#003087]', fontClass: 'font-black italic text-lg' },
    applecash: { text: 'Apple Cash', color: 'text-black', fontClass: 'font-black text-lg tracking-tight' },
    bankwire: { text: 'Bank Wire', color: 'text-[#475569]', fontClass: 'font-bold uppercase text-xs tracking-widest' },
    vlinkpay: { text: 'VLINKPAY', color: 'text-[#1E40AF]', fontClass: 'font-black text-lg tracking-tight' },
    crypto: { text: 'Crypto Wallet', color: 'text-[#F59E0B]', fontClass: 'font-black text-lg tracking-tight' }
  }[walletKey] || { text: walletKey, color: 'text-slate-800', fontClass: 'font-bold' }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 text-left">
      <div data-testid="payout-setup-modal" className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp space-y-4.5">
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
          <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {PayoutLogos[walletKey]}
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
              {renderLabel(currentLanguage === 'vi' ? 'THÔNG TIN TÀI KHOẢN *' : 'Account Identifier *')}
            </label>
            <input
              type="text"
              disabled={readOnly}
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder={walletPlaceholders[walletKey]}
              className={`w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-[#4648D8]/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
                error ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
              } ${readOnly ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200' : ''}`}
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
                {!readOnly && (
                  <button
                    type="button"
                    onClick={handleClearQr}
                    className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                    title="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
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
            ) : readOnly ? (
              <div className="flex h-24 w-full flex-col items-center justify-center rounded-xl border border-slate-150 bg-slate-50 text-slate-400 text-xs font-semibold">
                {currentLanguage === 'vi' ? 'Thợ chưa tải lên mã QR' : 'No QR code uploaded'}
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
            {!qrCode && !readOnly && (
              <p className="mt-2 text-[10px] text-slate-400 leading-normal">
                {t('setup.uploader_hint') || 'You can either take a photo or upload from your device. Accepted formats: JPG, PNG, JPEG. Max size: 5MB per file.'}
              </p>
            )}
          </div>

          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10.5px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {readOnly
                ? (currentLanguage === 'vi' ? 'Thông tin này được nhập bởi Kỹ thuật viên khi tham gia Salon. Salon Owner chỉ có thể xem.' : 'This information was entered by the technician. Salon Owner has view-only access.')
                : (t('setup.payout_warning') || 'Please enter the correct receiving account information. This will be used to receive payments.')}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
          <button
            onClick={onClose}
            className={`px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition ${readOnly ? 'w-full text-center' : ''}`}
          >
            {currentLanguage === 'vi' ? (readOnly ? 'ĐÓNG' : 'HỦY') : (readOnly ? 'CLOSE' : 'CANCEL')}
          </button>
          {!readOnly && (
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
            >
              {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PayoutSetupModal
