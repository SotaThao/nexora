import React from 'react'
import { Search, Users } from 'lucide-react'

export default function SelectStaff({
  t,
  currentLanguage,
  searchQuery,
  setSearchQuery,
  filteredStaff,
  selectedStaffMembers,
  handleToggleStaff,
  setStep,
}) {
  return (
    <div className="flex flex-col min-h-full pb-[100px] animate-fadeIn">
      {/* Header text */}
      <div className="text-center mb-6">
        <h1 className="text-[20px] font-[800] text-slate-900 tracking-[-0.5px] uppercase">
          {t('customer.select_staff_title') || 'WHO SERVED YOU TODAY?'}
        </h1>
        <p className="text-[13px] text-slate-500 mt-1.5">
          {t('customer.select_staff_subtitle') || "Select the staff member you'd like to tip."}
        </p>
      </div>

      {/* Search Container */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-4 w-4 text-slate-400" strokeWidth={2.5} />
        </div>
        <input
          type="text"
          placeholder={t('customer.search_staff_placeholder') || 'Search staff...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-[12px] pl-[40px] pr-4 py-3 text-[13px] text-slate-900 focus:outline-none focus:border-[#8E4DE8] focus:ring-4 focus:ring-[#8E4DE8]/10 transition-all placeholder-slate-400 font-medium"
        />
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-2 gap-3 mb-[20px]">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member, index) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            const colors = ['bg-[#6C4DE6]', 'bg-[#2589f5]', 'bg-[#ef4444]', 'bg-[#f97316]', 'bg-[#3b82f6]', 'bg-[#10b981]'];
            const bgColor = colors[index % colors.length];

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleToggleStaff(member)}
                className={`relative flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 text-center gap-2 group ${
                  isSelected
                    ? 'bg-nexoraBrandSoft/10 border-nexoraBrand shadow-[0_0_0_3px_rgba(108,77,230,0.15)]'
                    : 'bg-white border-slate-100 hover:border-nexoraBrand/40 hover:bg-slate-50 hover:-translate-y-[1px]'
                }`}
              >
                {/* Radio Button -> Check Icon */}
                <div className={`absolute top-2 right-2 w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all ${
                  isSelected ? 'bg-nexoraBrand border-nexoraBrand' : 'border-slate-300 bg-transparent group-hover:border-slate-400'
                }`}>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`w-2.5 h-2.5 text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                {/* Avatar */}
                <div className="w-14 h-14 shrink-0">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.fullName}
                      className="w-full h-full rounded-2xl object-cover shadow-sm"
                    />
                  ) : (
                    <div className={`w-full h-full rounded-2xl ${bgColor} flex items-center justify-center text-white text-xl font-bold shadow-sm select-none`}>
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full min-w-0">
                  <h4 className="font-bold text-[13px] text-slate-800 leading-tight truncate">
                    {member.fullName}
                  </h4>
                  <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                    {member.position}
                  </p>
                </div>
              </button>
            )
          })
        ) : (
          <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center text-slate-400">
            <Users className="w-10 h-10 mb-3 opacity-50" />
            <p className="text-[13px] font-medium">{t('customer.no_staff_found') || 'No staff members found.'}</p>
          </div>
        )}
      </div>

      {/* Floating Button Footer (No white background) */}
      <div className="absolute bottom-6 left-5 right-5 z-20">
        <div className="relative group">
          {selectedStaffMembers.length > 0 && (
            <div className="absolute -inset-1 bg-gradient-to-r from-nexoraBrand to-[#16b7ff] rounded-full blur-md opacity-60 group-hover:opacity-80 transition duration-1000 group-hover:duration-200 animate-pulse"></div>
          )}
          <button
            type="button"
            disabled={selectedStaffMembers.length === 0}
            onClick={() => setStep('tip_amount')}
            className={`relative w-full py-3.5 flex items-center justify-center gap-2 rounded-full text-sm font-extrabold tracking-wide uppercase transition-all duration-300 active:scale-95 ${
              selectedStaffMembers.length > 0
                ? 'bg-gradient-to-r from-nexoraBrand to-[#4f46e5] text-white hover:scale-[1.02]'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            {currentLanguage === 'vi' ? 'Tiếp theo' : 'Next'}
            {selectedStaffMembers.length > 1 && ` (${selectedStaffMembers.length})`}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
