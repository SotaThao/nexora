import React from 'react'
import { ArrowRight, Search, Users, Check } from 'lucide-react'

export default function SelectStaff({
  t,
  searchQuery,
  setSearchQuery,
  filteredStaff,
  selectedStaffMembers,
  handleToggleStaff,
  setStep,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
          {t('customer.select_staff_title') || 'Choose your service provider'}
        </h2>
        <p className="text-xs text-nexoraSubtle font-medium">
          {t('customer.select_staff_subtitle') || 'Select the staff who served you.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3.5 w-4 h-4 text-nexoraSubtle" />
        <input
          type="text"
          placeholder={t('customer.search_staff_placeholder') || 'Search staff...'}
          className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand focus:bg-white rounded-lg pl-10 pr-4 py-2.5 text-sm text-nexoraText focus:outline-none placeholder-nexoraSubtle transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Staff cards */}
      <div className="grid grid-cols-2 gap-3 max-h-[320px] overflow-y-auto pr-1 pb-16">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => {
                  handleToggleStaff(member)
                }}
                className={`relative flex flex-col items-center text-center p-4 bg-white border rounded-[16px] transition-all duration-200 shadow-sm hover:shadow group ${
                  isSelected
                    ? 'border-nexoraBrand bg-nexoraBrandSoft/10 shadow-[0_4px_12px_rgba(108,77,230,0.1)]'
                    : 'border-nexoraBorder hover:border-nexoraBrand/40 hover:bg-nexoraCanvas'
                }`}
              >
                <div className="absolute top-2 left-2">
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center border transition-all ${
                    isSelected
                      ? 'bg-nexoraBrand border-nexoraBrand text-white scale-110'
                      : 'border-nexoraBorder group-hover:border-nexoraBrand/60 bg-white'
                  }`}>
                    {isSelected && (
                      <Check className="w-3 h-3 stroke-[3px]" />
                    )}
                  </div>
                </div>

                <div className="mb-3">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt=""
                      className="h-14 w-14 rounded-full object-cover border border-nexoraBorder shrink-0"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-base font-extrabold text-white shrink-0 shadow-sm group-hover:scale-105 transition-transform">
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                <div className="min-w-0 w-full px-1">
                  <h4 className="font-bold text-nexoraText text-[13px] leading-tight group-hover:text-nexoraBrand transition-colors truncate">
                    {member.fullName}
                  </h4>
                  <p className="text-[11px] text-nexoraSubtle font-medium truncate mt-0.5">
                    {member.position}
                  </p>
                </div>
              </button>
            )
          })
        ) : (
          <div className="py-12 flex flex-col items-center justify-center text-center text-nexoraSubtle">
            <Users className="w-10 h-10 text-nexoraBorder mb-3" />
            <p className="text-xs font-semibold">{t('customer.no_staff_found') || 'No staff members found.'}</p>
          </div>
        )}
      </div>

      {/* Bottom Next Button */}
      <div className="pt-2">
        <button
          type="button"
          disabled={selectedStaffMembers.length === 0}
          onClick={() => setStep('tip_amount')}
          className={`w-full py-3.5 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 shadow-lg shadow-[#2B59FF]/25 ${
            selectedStaffMembers.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {t('common.next') || 'Next'} <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
