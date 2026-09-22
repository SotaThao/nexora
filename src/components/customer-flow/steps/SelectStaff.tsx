import React from 'react'
import { ArrowRight, Search, Users, Check } from 'lucide-react'

const QUICK_TIP_AMOUNTS = [5, 10, 15, 20, 30]

export default function SelectStaff({
  t,
  searchQuery,
  setSearchQuery,
  filteredStaff,
  selectedStaffMembers,
  handleToggleStaff,
  setStep,
  selectedTips,
  setSelectedTips,
  customTips,
  setCustomTips,
  canSelectMultipleStaff,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
          {t('customer.select_staff_title')}
        </h2>
        <p className="text-xs text-nexoraSubtle font-medium">
          {t('customer.select_staff_subtitle')}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-nexoraSubtle" />
        <input
          type="text"
          placeholder={t('customer.search_staff_placeholder')}
          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Staff cards */}
      <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            const isSelectionDisabled = !canSelectMultipleStaff && selectedStaffMembers.length >= 1 && !isSelected
            const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 15
            const custTip = customTips[member.id] || ''
            return (
              <div key={member.id} className="space-y-2">
                <button
                  type="button"
                  disabled={isSelectionDisabled}
                  onClick={() => {
                    handleToggleStaff(member)
                  }}
                  className={`w-full flex items-center justify-between p-4 bg-white border rounded-xl text-left transition-all duration-200 shadow-sm group ${
                    isSelected
                      ? 'border-nexoraBrand bg-nexoraBrandSoft/10'
                      : isSelectionDisabled
                        ? 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
                        : 'border-nexoraBorder hover:border-nexoraBrand/40 hover:bg-nexoraCanvas hover:shadow'
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {member.avatar ? (
                      <img
                        src={member.avatar}
                        alt=""
                        className="h-12 w-12 rounded-full object-cover border border-nexoraBorder shrink-0"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-nexoraElectric to-nexoraViolet text-sm font-extrabold text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                        {member.nickname.charAt(0)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="font-extrabold text-nexoraText text-sm group-hover:text-nexoraBrand transition-colors truncate">
                        {member.fullName}
                      </h4>
                      <p className="text-xs text-nexoraSubtle font-semibold truncate mt-0.5">
                        {member.position}
                      </p>
                    </div>
                  </div>

                  {!isSelectionDisabled && (
                    <div className="flex items-center shrink-0">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                        isSelected
                          ? 'bg-nexoraBrand border-nexoraBrand text-white scale-110'
                          : 'border-nexoraBorder group-hover:border-nexoraBrand/60 bg-white'
                      }`}>
                        {isSelected && (
                          <Check className="w-3.5 h-3.5 stroke-[3px]" />
                        )}
                      </div>
                    </div>
                  )}
                </button>

                {isSelected && (
                  <div className="px-2 pb-1 animate-fadeIn">
                    <p className="text-[10px] font-bold text-nexoraSubtle uppercase tracking-wider mb-1.5">
                      {t('customer.inline_tip_label')}
                    </p>
                    <div className="grid grid-cols-6 gap-1.5">
                      {QUICK_TIP_AMOUNTS.map(val => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => {
                            setSelectedTips({ ...selectedTips, [member.id]: val })
                          }}
                          className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
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
                        className={`py-1.5 rounded-lg text-[11px] font-black transition-all ${
                          selTip === 'custom'
                            ? 'bg-nexoraBrand text-white shadow shadow-nexoraBrand/30'
                            : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder/60'
                        }`}
                      >
                        {t('customer.custom_tip_btn')}
                      </button>
                    </div>
                    {selTip === 'custom' && (
                      <div className="relative mt-1.5">
                        <span className="absolute left-3 top-2.5 text-xs font-extrabold text-nexoraSubtle">$</span>
                        <input
                          type="text"
                          inputMode="decimal"
                          placeholder={t('components.customer_flow.steps.TipAmount.phAmount')}
                          className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-lg pl-7 pr-3 py-2 text-xs font-extrabold text-nexoraText focus:outline-none transition-all"
                          value={custTip}
                          onChange={(e) => {
                            setCustomTips({ ...customTips, [member.id]: e.target.value })
                          }}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center text-nexoraSubtle">
            <Users className="w-10 h-10 text-nexoraBorder mb-3" />
            <p className="text-xs font-semibold">{t('customer.no_staff_found')}</p>
          </div>
        )}
      </div>

      {/* Bottom Next Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={selectedStaffMembers.length === 0}
          onClick={() => setStep('tip_amount')}
          className={`w-full py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-nexoraElectric/25 ${
            selectedStaffMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {t('common.next')} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
