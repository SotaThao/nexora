import React from 'react'
import { X, Camera, FolderOpen, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PayoutLogos } from '../constants'

export default function PayoutEditModal({
  editingMethod,
  setEditingMethod,
  editValue, setEditValue,
  editQrCode, setEditQrCode,
  editAccountName, setEditAccountName,
  isCapturing,
  modalError, setModalError,
  currentLanguage,
  savePayoutAccount,
  handleModalFileChange,
  handleModalTakePhoto,
  handleModalClearQr,
}) {
  const { renderLabel } = useTranslation()

  if (!editingMethod) return null

  const walletNames = {
    zelle: 'Zelle',
    bankwire: 'Bank Wire',
    paypal: 'PayPal',
    venmo: 'Venmo',
    cashapp: 'Cash App',
    applecash: 'Apple Cash'
  }

  const walletFields = {
    zelle: currentLanguage === 'vi' ? 'email/SĐT' : 'email/phone',
    bankwire: currentLanguage === 'vi' ? 'chi tiết' : 'details',
    paypal: 'email',
    venmo: '@username',
    cashapp: '$cashtag',
    applecash: currentLanguage === 'vi' ? 'SĐT' : 'phone number'
  }

  const walletPlaceholders = {
    zelle: currentLanguage === 'vi' ? 'Nhập email/SĐT Zelle...' : 'Enter Zelle email/phone...',
    bankwire: currentLanguage === 'vi' ? 'Số tài khoản & Số Routing' : 'Account & Routing numbers',
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: currentLanguage === 'vi' ? 'Nhập số điện thoại...' : 'Enter phone number...'
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl border border-slate-100 max-w-sm w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-left space-y-4">

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
          <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {PayoutLogos[editingMethod]}
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {currentLanguage === 'vi'
                ? `CẤU HÌNH ${walletNames[editingMethod]?.toUpperCase()}`
                : `CONFIGURE ${walletNames[editingMethod]?.toUpperCase()}`}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {currentLanguage === 'vi' ? 'Chỉ định thông tin tài khoản nhận tiền' : 'Specify receiving target identifier'}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={savePayoutAccount} className="space-y-4">
          {/* Account Identifier Input */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {renderLabel(currentLanguage === 'vi'
                ? `${walletNames[editingMethod]} ${walletFields[editingMethod]} của bạn *`
                : `Your ${walletNames[editingMethod]} ${walletFields[editingMethod]} *`)}
            </label>
            <input
              type="text"
              value={editValue}
              onChange={(e) => {
                setEditValue(e.target.value)
                setModalError('')
              }}
              placeholder={walletPlaceholders[editingMethod]}
              className={`w-full bg-slate-50 border border-slate-200 focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 focus:bg-white rounded-xl px-3.5 h-11 text-xs text-slate-800 focus:outline-none transition-all ${
                modalError ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-500/20' : ''
              }`}
            />
            {modalError && <p className="mt-1 text-[10px] font-bold text-rose-500">{modalError}</p>}
          </div>

          {/* QR Code Optional Upload */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {currentLanguage === 'vi' ? 'MÃ QR (TÙY CHỌN)' : 'QR CODE (OPTIONAL)'}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">
                  {currentLanguage === 'vi' ? 'Đang chụp hình...' : 'Taking photo...'}
                </span>
              </div>
            ) : editQrCode ? (
              <div className="relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <button
                  type="button"
                  onClick={handleModalClearQr}
                  className="absolute right-2 top-2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
                  title="Remove image"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="text-center">
                  <div className="text-sm font-extrabold text-slate-800">{editAccountName}</div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-0.5">{editValue}</div>
                </div>
                <div className="my-3 flex h-28 w-28 items-center justify-center border border-slate-100 bg-white p-1 rounded-lg">
                  <img src={editQrCode} alt="Payout QR Code" className="h-full w-full object-contain" />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleModalTakePhoto}
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                >
                  <Camera className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">
                    {currentLanguage === 'vi' ? 'CHỤP HÌNH' : 'TAKE PHOTO'}
                  </span>
                </button>
                <label
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">
                    {currentLanguage === 'vi' ? 'CHỌN FILE' : 'CHOOSE FILE'}
                  </span>
                  <input type="file" accept="image/*" className="sr-only" onChange={handleModalFileChange} />
                </label>
              </div>
            )}
          </div>

          {/* Warning box */}
          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {currentLanguage === 'vi'
                ? 'Vui lòng nhập đúng thông tin tài khoản nhận tiền. Tài khoản này sẽ được dùng để nhận tiền tip.'
                : 'Please enter the correct receiving account information. This will be used to receive payments.'}
            </span>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingMethod(null)}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              {currentLanguage === 'vi' ? 'HỦY' : 'CANCEL'}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
            >
              {currentLanguage === 'vi' ? 'LƯU LẠI' : 'SAVE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
