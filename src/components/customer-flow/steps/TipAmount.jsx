import React, { useState, useEffect } from 'react'
import { ArrowRight, Star } from 'lucide-react'

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
  const isMulti = selectedStaffMembers.length > 1;
  const [tipMode, setTipMode] = useState('combine'); // 'combine' | 'split'
  const [combineTip, setCombineTip] = useState(15);
  const [combineCustom, setCombineCustom] = useState('');

  // When combineTip changes, distribute evenly to selectedTips
  useEffect(() => {
    if (isMulti && tipMode === 'combine') {
      const newTips = {};
      const newCustomTips = {};
      let perPersonAmount = 0;

      if (combineTip === 'custom') {
        perPersonAmount = (parseFloat(combineCustom) || 0) / selectedStaffMembers.length;
      } else {
        perPersonAmount = combineTip / selectedStaffMembers.length;
      }

      selectedStaffMembers.forEach(member => {
        newTips[member.id] = 'custom';
        newCustomTips[member.id] = perPersonAmount.toFixed(2);
      });
      setSelectedTips(newTips);
      setCustomTips(newCustomTips);
    }
  }, [tipMode, combineTip, combineCustom, isMulti, selectedStaffMembers]);

  // Handle initialization for single staff
  useEffect(() => {
    if (!isMulti && selectedTips[selectedStaffMembers[0]?.id] === undefined) {
      setSelectedTips({ [selectedStaffMembers[0]?.id]: 15 });
    }
  }, [isMulti, selectedStaffMembers, selectedTips, setSelectedTips]);

  const renderSingleOrCombineBody = () => {
    const isCustom = isMulti ? combineTip === 'custom' : selectedTips[selectedStaffMembers[0]?.id] === 'custom';
    const activeVal = isMulti ? combineTip : selectedTips[selectedStaffMembers[0]?.id];
    
    return (
      <>
        {/* Custom Input Field */}
        <div className="relative mb-6">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-[28px] font-extrabold text-nexoraText">$</span>
          <input
            type="number"
            inputMode="decimal"
            placeholder="0.00"
            value={isMulti ? combineCustom : (customTips[selectedStaffMembers[0]?.id] || '')}
            onChange={(e) => {
              if (isMulti) {
                setCombineTip('custom');
                setCombineCustom(e.target.value);
              } else {
                setSelectedTips({ ...selectedTips, [selectedStaffMembers[0].id]: 'custom' });
                setCustomTips({ ...customTips, [selectedStaffMembers[0].id]: e.target.value });
              }
            }}
            className="w-full bg-white border border-nexoraBorder focus:border-nexoraBrand rounded-[16px] pl-[52px] pr-4 py-5 text-[28px] font-extrabold text-nexoraText focus:outline-none transition-all shadow-sm"
          />
        </div>

        {/* Quick Tips */}
        <div className="grid grid-cols-4 gap-2.5">
          {[10, 15, 20, 25].map(val => (
            <button
              key={val}
              type="button"
              onClick={() => {
                if (isMulti) {
                  setCombineTip(val);
                  setCombineCustom('');
                } else {
                  setSelectedTips({ ...selectedTips, [selectedStaffMembers[0].id]: val });
                  setCustomTips({ ...customTips, [selectedStaffMembers[0].id]: '' });
                }
              }}
              className={`py-3.5 rounded-xl text-base font-extrabold transition-all duration-200 ${
                activeVal === val
                  ? 'bg-nexoraBrand text-white shadow-[0_4px_12px_rgba(108,77,230,0.25)] border-transparent'
                  : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder shadow-sm'
              }`}
            >
              ${val}
            </button>
          ))}
        </div>
      </>
    );
  };

  const renderSplitBody = () => {
    return (
      <div className="space-y-4">
        {selectedStaffMembers.map((member) => {
          const selTip = selectedTips[member.id] !== undefined ? selectedTips[member.id] : 10;
          const custTip = customTips[member.id] || '';
          return (
            <div key={member.id} className="flex flex-col gap-3 p-4 bg-white border border-nexoraBorder rounded-[16px] shadow-sm">
              <div className="flex items-center gap-3">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="h-10 w-10 rounded-full object-cover border border-nexoraBorder shrink-0" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-sm font-extrabold text-white shrink-0">
                    {member.nickname.charAt(0)}
                  </div>
                )}
                <span className="font-bold text-nexoraText text-sm flex-1">{member.nickname}</span>
                
                <div className="relative w-28">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-extrabold text-nexoraText">$</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={selTip === 'custom' ? custTip : selTip}
                    onChange={(e) => {
                      setSelectedTips({ ...selectedTips, [member.id]: 'custom' });
                      setCustomTips({ ...customTips, [member.id]: e.target.value });
                    }}
                    className="w-full bg-nexoraCanvas border border-nexoraBorder focus:border-nexoraBrand rounded-lg pl-6 pr-2 py-2 text-right text-sm font-extrabold text-nexoraText focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => {
                      setSelectedTips({ ...selectedTips, [member.id]: val });
                      setCustomTips({ ...customTips, [member.id]: '' });
                    }}
                    className={`py-2 rounded-lg text-[13px] font-extrabold transition-all duration-200 ${
                      selTip === val
                        ? 'bg-nexoraBrand text-white shadow-md border-transparent'
                        : 'bg-white hover:bg-slate-50 text-nexoraText border border-nexoraBorder'
                    }`}
                  >
                    ${val}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full animate-fadeIn">
      <div className="flex-grow">
        {/* Header - Staff Info */}
        <div className="mb-6 flex flex-col items-center">
          {isMulti ? (
            <div className="flex flex-col items-center">
              <div className="flex -space-x-3 mb-2">
                {selectedStaffMembers.map(m => (
                  m.avatar ? (
                    <img key={m.id} src={m.avatar} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  ) : (
                    <div key={m.id} className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-sm font-extrabold text-white border-2 border-white shadow-sm">
                      {m.nickname.charAt(0)}
                    </div>
                  )
                ))}
              </div>
              <h3 className="font-bold text-nexoraText text-[15px]">
                {selectedStaffMembers.map(s => s.nickname).join(', ')}
              </h3>
            </div>
          ) : (
            <div className="flex items-center w-full bg-white border border-nexoraBorder p-4 rounded-[16px] shadow-sm">
              <div className="flex items-center gap-3 flex-1">
                {selectedStaffMembers[0].avatar ? (
                  <img src={selectedStaffMembers[0].avatar} className="w-12 h-12 rounded-full object-cover border border-nexoraBorder" />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-[#2B59FF] to-[#8E4DF8] text-sm font-extrabold text-white">
                    {selectedStaffMembers[0].nickname.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-nexoraText text-base leading-tight mb-0.5">
                    {selectedStaffMembers[0].fullName}
                  </h3>
                  <p className="text-xs text-nexoraSubtle font-medium">{selectedStaffMembers[0].position}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2.5 py-1 rounded-full border border-yellow-200">
                <Star className="w-3.5 h-3.5 fill-current" />
                <span className="text-[11px] font-bold">5.0</span>
              </div>
            </div>
          )}
        </div>

        {/* Multi-tips Toggle */}
        {isMulti && (
          <div className="flex p-1 bg-nexoraCanvas border border-nexoraBorder rounded-[12px] mb-6">
            <button
              type="button"
              onClick={() => setTipMode('combine')}
              className={`flex-1 py-2.5 text-[13px] font-extrabold rounded-[8px] transition-all duration-200 ${
                tipMode === 'combine' ? 'bg-white shadow-sm text-nexoraBrand' : 'text-nexoraSubtle hover:text-nexoraText'
              }`}
            >
              {currentLanguage === 'vi' ? 'Chia Đều' : 'Split Evenly'}
            </button>
            <button
              type="button"
              onClick={() => setTipMode('split')}
              className={`flex-1 py-2.5 text-[13px] font-extrabold rounded-[8px] transition-all duration-200 ${
                tipMode === 'split' ? 'bg-white shadow-sm text-nexoraBrand' : 'text-nexoraSubtle hover:text-nexoraText'
              }`}
            >
              {currentLanguage === 'vi' ? 'Tip Riêng Lẻ' : 'Separate Tips'}
            </button>
          </div>
        )}

        <div className="max-h-[320px] overflow-y-auto pr-1 pb-4">
          {(!isMulti || tipMode === 'combine') ? renderSingleOrCombineBody() : renderSplitBody()}
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="mt-4 pt-4 border-t border-nexoraBorder">
        <button
          onClick={handleNextToPayment}
          disabled={activeTipAmount <= 0}
          className="w-full min-h-[56px] py-4 bg-gradient-to-r from-[#5B21B6] to-[#6D28D9] hover:opacity-90 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 text-white font-extrabold text-[13px] uppercase tracking-wider rounded-[12px] flex items-center justify-center gap-2 shadow-[0_4px_16px_rgba(109,40,217,0.25)] transition-all"
        >
          {t('common.continue') || 'CONTINUE'}
        </button>
      </div>
    </div>
  )
}
