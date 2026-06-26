import React, { useState } from 'react'
import { X, Camera, FolderOpen, AlertTriangle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PayoutLogos } from '../constants'
import ImageFileInput from '../../ui/ImageFileInput'
import BankWireAccountForm from '../../payout/BankWireAccountForm'
import CameraCapture from '../../ui/CameraCapture'

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
  handleModalImagePick,
  handleModalTakePhoto,
  handleModalClearQr,
}) {
  const { t, renderLabel } = useTranslation()
  const [isCameraOpen, setIsCameraOpen] = useState(false)

  if (!editingMethod) return null
  const isBankWire = editingMethod === 'bankwire'

  const walletNames = {
    zelle: 'Zelle',
    bankwire: 'Bank Wire',
    paypal: 'PayPal',
    venmo: 'Venmo',
    cashapp: 'Cash App',
    applecash: 'Apple Cash'
  }

  const walletFields = {
    zelle: t('components.register.modals.PayoutEditModal.emailPhone'),
    bankwire: t('components.register.modals.PayoutEditModal.details'),
    paypal: 'email',
    venmo: '@username',
    cashapp: '$cashtag',
    applecash: t('common.phone_number_short')
  }

  const walletPlaceholders = {
    zelle: t('components.register.modals.PayoutEditModal.enterZelleEmailPhone'),
    bankwire: t('components.register.modals.PayoutEditModal.accountAndRoutingNumbers'),
    paypal: 'email@paypal.com',
    venmo: '@username-venmo',
    cashapp: '$cashtag',
    applecash: t('components.register.modals.PayoutEditModal.enterPhoneNumber')
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className={`bg-white rounded-3xl border border-slate-100 w-full shadow-2xl relative overflow-hidden animate-scaleUp text-left ${isCameraOpen ? 'max-w-sm h-[480px]' : `p-6 space-y-4 ${isBankWire ? 'max-w-md' : 'max-w-sm'}`}`}>

        {/* Header */}
        <div className="flex items-center gap-3.5 border-b border-slate-100 pb-3">
          <span className="h-11 w-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 shadow-sm">
            {PayoutLogos[editingMethod]}
          </span>
          <div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">
              {isBankWire
                ? t('components.payout.bankWireForm.title')
                : t('register.payout.configure_wallet', { wallet: walletNames[editingMethod]?.toUpperCase() })}
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">
              {t('components.register.modals.PayoutEditModal.specifyReceivingTargetIdentifier')}
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={savePayoutAccount} className="space-y-4">
          {/* Account Identifier Input */}
          {isBankWire ? (
            <BankWireAccountForm
              value={editValue}
              onChange={(nextValue) => {
                setEditValue(nextValue)
                setModalError('')
              }}
              onBeneficiaryNameChange={setEditAccountName}
              error={modalError}
            />
          ) : (
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {renderLabel(t('register.payout.account_label', {
                wallet: walletNames[editingMethod],
                field: walletFields[editingMethod]
              }))}
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
          )}

          {/* QR Code Optional Upload */}
          {!isBankWire && (
          <div>
            <label className="block text-[10px] font-extrabold uppercase text-slate-500 tracking-wider mb-2">
              {t('components.register.modals.PayoutEditModal.qrCodeOptional')}
            </label>

            {isCapturing ? (
              <div className="flex h-44 w-full flex-col items-center justify-center rounded-xl border border-slate-200 bg-slate-50">
                <div className="h-6 w-6 border-2 border-nexoraBrand/20 border-t-nexoraBrand rounded-full animate-spin"></div>
                <span className="mt-2 text-xs font-semibold text-slate-500">
                  {t('setup.taking_photo')}
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
                  onClick={() => setIsCameraOpen(true)}
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5"
                >
                  <Camera className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">
                    {t('components.register.modals.PayoutEditModal.takePhoto')}
                  </span>
                </button>
                <ImageFileInput
                  as="label"
                  className="flex flex-col items-center justify-center py-5 border border-dashed border-slate-200 hover:border-nexoraBrand rounded-xl bg-slate-50 hover:bg-slate-50/50 transition gap-1.5 cursor-pointer"
                  onPick={handleModalImagePick}
                >
                  <FolderOpen className="w-5 h-5 text-nexoraBrand" />
                  <span className="text-[11px] font-bold text-slate-600">
                    {t('components.register.modals.PayoutEditModal.chooseFile')}
                  </span>
                </ImageFileInput>
              </div>
            )}
          </div>
          )}

          {/* Warning box */}
          <div className="rounded-lg bg-blue-50/50 border border-blue-100 p-3 text-[10px] leading-relaxed text-blue-800 flex gap-2">
            <AlertTriangle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
            <span>
              {t(isBankWire ? 'components.payout.bankWireForm.warning' : 'components.register.modals.PayoutEditModal.pleaseEnterTheCorrect')}
            </span>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex justify-end gap-2.5 pt-2.5 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setEditingMethod(null)}
              className="px-5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider rounded-lg transition"
            >
              {t(isBankWire ? 'setup.close' : 'components.register.modals.PayoutEditModal.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm transition"
            >
              {t(isBankWire ? 'common.update' : 'components.register.modals.PayoutEditModal.save')}
            </button>
          </div>
        </form>

        {isCameraOpen && (
          <CameraCapture
            onCapture={(dataUrl) => {
              handleModalImagePick(dataUrl)
              setIsCameraOpen(false)
            }}
            onCancel={() => setIsCameraOpen(false)}
          />
        )}
      </div>
    </div>
  )
}
