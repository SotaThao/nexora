import React, { useMemo } from 'react'
import {
  Plus, Trash2, AlertTriangle, HelpCircle,
  QrCode, Users, Edit2, Search
} from 'lucide-react'
import CustomSelect from '../../CustomSelect'
import CountryCodeSelect, { parsePhone } from '../../CountryCodeSelect'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { WalletLogos, DEFAULT_PAYOUT_CONFIGS, getTouchpointIcon } from '../constants'
import { renderLabel } from '../../../contexts/LanguageContext'
import { getCustomerAppBaseUrl } from '../../../utils/webUrlBase'
import {
  getPaymentMethodDisplayName,
  payoutTypeToUiKey,
  PAYOUT_UI_LABELS,
} from '../../../data/paymentMethodTypes'
import type { PaymentMethodDto } from '../../../types/domain'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'

export default function Step2StaffTouchpoints({
  t,
  currentLanguage,
  isSsoLocked,
  staffList,
  newStaff,
  setNewStaff,
  touchPoints,
  newTouchpoint,
  setNewTouchpoint,
  editingTpId,
  setEditingTpId,
  editingTpName,
  setEditingTpName,
  editingTpType,
  setEditingTpType,
  errors,
  businessInfo,
  handleAddStaff,
  handleToggleWallet,
  openPayoutSetup,
  handleRemoveStaff,
  handleAddTouchpoint,
  handleRemoveTouchpoint,
  handleStartEditTouchpoint,
  handleSaveTouchpoint,
  setPreviewingTp,
  merchantPaymentMethods = [],
}) {
  const newStaffPhoneParsed = parsePhone(newStaff.phone || '')

  const displayPaymentMethods = useMemo(() => {
    if (merchantPaymentMethods.length > 0) {
      return merchantPaymentMethods.map((method: PaymentMethodDto) => ({
        key: method.uiKey || payoutTypeToUiKey(method.type || ''),
        name: method.name || getPaymentMethodDisplayName(method.type || ''),
      }))
    }

    return Object.keys(DEFAULT_PAYOUT_CONFIGS).map((key) => ({
        key,
        name: PAYOUT_UI_LABELS[key] || key,
      }))
  }, [merchantPaymentMethods])

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="border-b border-nexoraRule pb-4 mb-4">
        <h2 className="font-sans text-xl md:text-2xl font-bold flex items-center gap-2.5 text-nexoraText">
          <QrCode className="text-nexoraBrand w-6 h-6" />
          {t('components.setup_wizard.steps.Step2StaffTouchpoints.step2PayoutAnd')}
        </h2>
        <p className="text-nexoraSubtle text-sm mt-1">
          {t('components.setup_wizard.steps.Step2StaffTouchpoints.setUpPayoutMethods')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Left Column: Staff Creation & Grid list */}
        <div className="lg:col-span-6 space-y-6 lg:border-r lg:border-nexoraRule lg:pr-8">
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <QrCode className="w-4 h-4 text-nexoraBrand" /> {t('setup.payout_methods')}
            </h3>
            <p className="text-xs text-nexoraSubtle mb-4">
              {t('components.setup_wizard.steps.Step2StaffTouchpoints.setUpPaymentMethods')}
            </p>

            <div className="mt-4">
              <div className="divide-y divide-slate-100 rounded-xl border border-nexoraBorder bg-white px-4">
                {displayPaymentMethods.map((wallet) => {
                  const config = (businessInfo.payoutConfigs && businessInfo.payoutConfigs[wallet.key]) || { enabled: false, value: '', qrCode: '' }

                  return (
                    <div key={wallet.key} className="flex items-center justify-between py-3.5">
                      <div className="flex items-center gap-3">
                        <ToggleSwitch
                          checked={config.enabled}
                          onChange={() => handleToggleWallet(wallet.key)}
                          size="md"
                          activeColor="bg-amber-600"
                          inactiveColor="bg-slate-200"
                        />
                        <div className="flex items-center gap-2">
                          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50 shrink-0">
                            {WalletLogos[wallet.key]}
                          </span>
                          <span className="text-xs font-bold text-slate-700">{wallet.name}</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => openPayoutSetup(wallet.key)}
                        className="flex items-center gap-1 text-[11px] font-bold text-amber-600 hover:text-amber-700 transition"
                      >
                        <Edit2 className="h-3 w-3 stroke-[2.5]" />
                        <span>{t('setup.payout_account')}</span>
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: QR Touchpoints management & custom adding */}
        <div className="lg:col-span-6 space-y-6">
          {/* Add Custom touchpoint form */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-nexoraText uppercase tracking-wider flex items-center gap-1.5 pb-1">
              <QrCode className="w-4 h-4 text-nexoraBrand" /> {t('setup.qr_touchpoints_title')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">
                  <span>{renderLabel(t('setup.tp_name'))}</span>
                  <div className="relative group inline-block ml-1.5 align-middle normal-case font-normal text-nexoraSubtle">
                    <HelpCircle className="w-3.5 h-3.5 hover:text-nexoraBrand cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-48 bg-black text-white text-[10px] p-2.5 rounded-lg shadow-xl z-50 text-center leading-normal">
                      {t('components.setup_wizard.steps.Step2StaffTouchpoints.nameThisSpecificTouch')}
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1.5 border-4 border-transparent border-t-black"></div>
                    </div>
                  </div>
                </label>
                <input
                  type="text"
                  placeholder={t('setup.tp_name_placeholder')}
                  className={`w-full bg-nexoraCanvas border ${errors.tpName ? 'border-red-300 focus:border-red-500' : 'border-nexoraBorder focus:border-nexoraBrand focus:bg-white'} rounded-lg px-3 py-2 text-sm text-nexoraText placeholder-nexoraSubtle focus:outline-none transition-all`}
                  value={newTouchpoint.name}
                  onChange={(e) => setNewTouchpoint({ ...newTouchpoint, name: e.target.value })}
                />
                {errors.tpName && <span className="text-[10px] text-red-500 mt-1 block">{errors.tpName}</span>}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">{t('setup.tp_type')}</label>
                <CustomSelect
                  buttonClass="bg-nexoraCanvas focus:bg-white"
                  value={newTouchpoint.type}
                  onChange={(e) => setNewTouchpoint({ ...newTouchpoint, type: e.target.value })}
                  options={[
                    { value: 'Table QR', label: 'Table QR' },
                    { value: 'Front Desk', label: 'Front Desk' },
                    { value: 'Receipt QR', label: 'Receipt QR' }
                  ]}
                />
              </div>
            </div>

            <button
              onClick={handleAddTouchpoint}
              className="w-full py-2 bg-white hover:bg-nexoraCanvas text-nexoraBrand border border-nexoraBorder rounded-lg shadow-sm font-bold transition-all"
            >
              {t('setup.add_tp_btn')}
            </button>
          </div>

          {/* Touchpoints Listing */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">{t('setup.qr_touchpoints_title')} ({touchPoints.length})</h4>
            <div className="space-y-2 overflow-y-auto pr-1 max-h-[220px] lg:max-h-[440px]">
              {touchPoints.map((tp) => {
                const qrUrl = `${getCustomerAppBaseUrl()}?flow=customer&merchant=${encodeURIComponent(businessInfo.name || 'Your Business')}&tech=tp/${tp.id}`
                const qrCodeSrc = buildPublicQrImageUrl(qrUrl, 150)

                if (tp.id === editingTpId) {
                  return (
                    <div
                      key={tp.id}
                      className="flex flex-col gap-3 p-3 rounded-xl border border-nexoraBrand bg-slate-50 shadow-sm animate-fadeIn"
                    >
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">
                            {t('setup.tp_name')}
                          </label>
                          <input
                            type="text"
                            className="w-full bg-white border border-nexoraBorder rounded-lg px-3 py-1.5 text-xs text-nexoraText focus:outline-none focus:border-nexoraBrand transition-all"
                            value={editingTpName}
                            onChange={(e) => setEditingTpName(e.target.value)}
                            placeholder={t('setup.tp_name_placeholder')}
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-nexoraText uppercase tracking-wider mb-1">
                            {t('setup.tp_type')}
                          </label>
                          <select
                            className="w-full bg-white border border-nexoraBorder rounded-lg px-3 py-1.5 text-xs text-nexoraText focus:outline-none focus:border-nexoraBrand transition-all h-[34px]"
                            value={editingTpType}
                            onChange={(e) => setEditingTpType(e.target.value)}
                          >
                            <option value="Table QR">Table QR</option>
                            <option value="Front Desk">Front Desk</option>
                            <option value="Receipt QR">Receipt QR</option>
                            <option value="Business Main">Business Main</option>
                            <option value="Staff QR">Staff QR</option>
                          </select>
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingTpId(null)}
                          className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-500 hover:bg-slate-100 rounded border border-slate-200 transition"
                        >
                          {t('common.cancel')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveTouchpoint(tp.id)}
                          className="px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wide text-white bg-nexoraBrand hover:opacity-90 rounded shadow-sm transition"
                        >
                          {t('setup.submit')}
                        </button>
                      </div>
                    </div>
                  )
                }

                return (
                  <div
                    key={tp.id}
                    className="flex items-center justify-between p-3 rounded-xl border border-nexoraBorder bg-white shadow-sm animate-fadeIn"
                  >
                    <div className="flex items-center min-w-0 flex-grow">
                      <div
                        onClick={() => setPreviewingTp(tp)}
                        className="relative w-12 h-12 rounded-lg bg-white border border-nexoraBorder/60 p-1 flex items-center justify-center shadow-sm cursor-pointer hover:border-nexoraBrand transition-all hover:scale-105 group/qr select-none overflow-hidden shrink-0"
                        title="Click to zoom / Nhấp để phóng to"
                      >
                        <img
                          src={qrCodeSrc}
                          alt="Scan QR"
                          className="h-full w-full object-contain"
                        />
                        <div className="absolute inset-0 bg-nexoraBrand/75 opacity-0 group-hover/qr:opacity-100 flex items-center justify-center text-white transition-opacity select-none">
                          <Search className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="min-w-0 flex-grow ml-3">
                        <div className="truncate text-xs font-bold text-nexoraText">{tp.name}</div>
                        <div className="text-[9px] flex items-center gap-2 mt-0.5">
                          <span className="px-1.5 py-0.5 rounded font-black bg-nexoraBrandSoft text-nexoraBrand border border-nexoraBrandSoft/50 uppercase flex items-center gap-1">
                            {getTouchpointIcon(tp.type, "w-3 h-3")}
                            {tp.type}
                          </span>
                          {tp.staffName && (
                            <span className="text-nexoraSubtle">{t('dashboard.modals.assign_staff')} {tp.staffName}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleStartEditTouchpoint(tp)}
                        className="p-1.5 rounded-lg text-nexoraSubtle hover:text-nexoraBrand hover:bg-slate-50 transition"
                        title="Edit / Sửa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveTouchpoint(tp.id)}
                        className="p-1.5 rounded-lg text-nexoraSubtle hover:text-red-500 hover:bg-slate-50 transition"
                        title="Delete / Xóa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
