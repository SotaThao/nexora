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
    <div className="flex flex-col h-full animate-fadeIn">
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
          filteredStaff.map((member) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleToggleStaff(member)}
                className={`relative flex flex-col items-center p-4 rounded-[16px] border transition-all duration-300 text-center group ${
                  isSelected
                    ? 'bg-[#F5F3FF] border-[#6C4DE6] shadow-sm'
                    : 'bg-white border-slate-200 hover:shadow-[0_8px_16px_rgba(0,0,0,0.04)] hover:-translate-y-0.5'
                }`}
              >
                {/* Radio Button */}
                <div className={`absolute top-3 right-3 w-[20px] h-[20px] rounded-full border flex items-center justify-center transition-all ${
                  isSelected ? 'bg-[#6C4DE6] border-[#6C4DE6]' : 'border-slate-300 bg-transparent group-hover:border-slate-400'
                }`}>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="3.5" 
                    strokeLinecap="round" 
                    strokeLinejoin="round"
                    className={`w-[10px] h-[10px] text-white transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>

                {/* Avatar */}
                <div className="mb-2">
                  {member.avatar ? (
                    <img
                      src={member.avatar}
                      alt={member.fullName}
                      className="w-14 h-14 rounded-full object-cover border border-slate-100 shrink-0"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-[20px] font-[800] text-white shrink-0">
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full">
                  <h4 className="font-[700] text-[14px] text-slate-900 leading-tight truncate">
                    {member.fullName}
                  </h4>
                  <p className="text-[12px] text-slate-500 font-medium truncate mt-0.5">
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

      {/* Fixed Sticky Footer for the button */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-slate-100 px-5 py-4 pb-[max(16px,env(safe-area-inset-bottom))] z-20">
        <button
          type="button"
          disabled={selectedStaffMembers.length === 0}
          onClick={() => setStep('tip_amount')}
          className={`w-full min-h-[56px] flex items-center justify-center gap-2 rounded-[16px] text-[13px] font-[800] tracking-wider uppercase transition-all duration-300 ${
            selectedStaffMembers.length > 0
              ? 'bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] text-white shadow-[0_8px_16px_rgba(108,77,230,0.25)] hover:opacity-95 transform hover:-translate-y-0.5'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          {currentLanguage === 'vi' ? 'Tiếp theo' : 'Next'}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
        </button>
      </div>
    </div>
  )
}
