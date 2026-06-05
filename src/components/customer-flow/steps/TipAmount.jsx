import React from 'react'
import { ArrowRight } from 'lucide-react'

export default function TipAmount({
  t,
  currentLanguage,
  tipScreenTitle,
  selectedStaffMembers,
  selectedTips,
  setSelectedTips,
  customTips,
  setCustomTips,
  activeTipAmount,
  initialStaffMember,
  setStep,
  handleNextToPayment,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-4">
        <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
          {tipScreenTitle}
        </h2>
      </div>

      {/* Tip grid for each selected staff */}
      <div className="space-y-4 max-h-[320px] overflow-y-auto pr-1">
        {selectedStaffMembers.map((member) => {
          const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
          const custTip = customTips[member.id] || ''
          return (
            <div key={member.id} className="p-4 bg-nexoraCanvas/30 border border-nexoraBorder rounded-xl space-y-3">
              {/* Staff Mini Profile */}
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover border border-nexoraBorder shrink-0"
                  />
                ) : (
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-xs font-black text-white shrink-0 shadow-sm">
                    {member.nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-nexoraText text-xs leading-none">
                    {member.nickname}
                  </h4>
                  <p className="text-[10px] text-nexoraSubtle mt-0.5 font-semibold">
                    {member.position}
                  </p>
                </div>
              </div>

              {/* Tip Grid for this staff */}
              <div className="grid grid-cols-3 gap-2">
                {[5, 10, 15, 20, 30].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSelectedTips({ ...selectedTips, [member.id]: val })
                    }}
                    className={`py-2 rounded-lg text-xs font-black transition-all ${
                      selTip === val
                        ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                        : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTips({ ...selectedTips, [member.id]: 'custom' })
                    if (!customTips[member.id]) {
                      setCustomTips({ ...customTips, [member.id]: '' })
                    }
                  }}
                  className={`py-2 rounded-lg text-xs font-black transition-all ${
                    selTip === 'custom'
                      ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                      : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                  }`}
                >
                  {t('customer.custom_tip_btn') || 'Other'}
                </button>
              </div>

              {/* Custom Input for this staff */}
              {selTip === 'custom' && (
                <div className="relative mt-2">
                  <span className="absolute left-3 top-2.5 text-xs font-extrabold text-nexoraSubtle">$</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg pl-7 pr-3 py-2 text-xs font-extrabold text-nexoraText focus:outline-none transition-all"
                    value={custTip}
                    onChange={(e) => {
                      setCustomTips({ ...customTips, [member.id]: e.target.value })
                    }}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Total Tip summary */}
      <div className="p-4 bg-nexoraBrandSoft/40 border border-nexoraBrandSoft rounded-xl flex items-center justify-between shadow-sm">
        <div>
          <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {currentLanguage === 'vi' ? 'Tổng tiền Tip' : 'Total Tip'}
          </h4>
          <p className="text-[10px] text-nexoraMuted font-semibold mt-0.5">
            {currentLanguage === 'vi' ? `Cho ${selectedStaffMembers.length} nhân viên` : `For ${selectedStaffMembers.length} provider(s)`}
          </p>
        </div>
        <div className="text-lg font-black text-nexoraBrand">
          ${activeTipAmount.toFixed(2)}
        </div>
      </div>

      {/* Next button */}
      <div className="pt-2 flex gap-3">
        {!initialStaffMember && (
          <button
            type="button"
            onClick={() => setStep('select_staff')}
            className="w-1/3 py-3.5 bg-nexoraCanvas border border-nexoraBorder hover:bg-nexoraSurfaceMuted transition text-nexoraMuted font-extrabold text-xs uppercase tracking-wider rounded-xl"
          >
            {t('common.back')}
          </button>
        )}
        <button
          type="button"
          onClick={handleNextToPayment}
          className={`py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-nexoraElectric/25 ${
            initialStaffMember ? 'w-full' : 'w-2/3'
          }`}
        >
          {t('customer.pay_btn')} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
