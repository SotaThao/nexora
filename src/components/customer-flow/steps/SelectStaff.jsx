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
          filteredStaff.map((member, index) => {
            const isSelected = selectedStaffMembers.some(s => s.id === member.id)
            const colors = ['bg-[#6C4DE6]', 'bg-[#2589f5]', 'bg-[#ef4444]', 'bg-[#f97316]', 'bg-[#3b82f6]', 'bg-[#10b981]'];
            const bgColor = colors[index % colors.length];

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => handleToggleStaff(member)}
                className={`relative flex flex-col items-center p-4 rounded-[16px] border transition-all duration-300 text-center group ${
                  isSelected
                    ? 'bg-[#F5F3FF] border-[#6C4DE6] shadow-[0_2px_8px_rgba(108,77,230,0.15)]'
                    : 'bg-white border-slate-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.04)]'
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
                      className={`w-14 h-14 ${isSelected ? 'rounded-[16px]' : 'rounded-full'} object-cover border border-slate-100 shrink-0 transition-all`}
                    />
                  ) : (
                    <div className={`flex h-14 w-14 items-center justify-center ${isSelected ? 'rounded-[16px]' : 'rounded-full'} ${bgColor} text-[24px] font-[700] text-white shrink-0 transition-all`}>
                      {member.nickname.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="w-full">
                  <h4 className="font-[800] text-[14px] text-slate-900 leading-tight truncate">
                    {member.fullName}
                  </h4>
                  <p className="text-[12px] text-slate-400 font-medium truncate mt-0.5">
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
        <button
          type="button"
          disabled={selectedStaffMembers.length === 0}
          onClick={() => setStep('tip_amount')}
          className={`w-full min-h-[56px] flex items-center justify-center gap-2 rounded-[12px] text-[13px] font-[800] tracking-widest uppercase transition-all duration-300 ${
            selectedStaffMembers.length > 0
              ? 'bg-[#7B5CFF] text-white shadow-[0_8px_20px_rgba(123,92,255,0.3)] hover:opacity-95 transform hover:-translate-y-0.5'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          {currentLanguage === 'vi' ? 'Tiếp theo' : 'Next'}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="ml-1">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </button>
      </div>
    </div>
  )
}
