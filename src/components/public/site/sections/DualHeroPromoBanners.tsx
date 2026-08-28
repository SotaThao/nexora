import React from 'react'
import { Crown, Zap, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react'
import { SitePalette } from '../palettes'

interface DualHeroPromoBannersProps {
  palette: SitePalette
  onBookClick?: () => void
  isMobileView?: boolean
}

export const DualHeroPromoBanners: React.FC<DualHeroPromoBannersProps> = ({
  palette,
  onBookClick,
  isMobileView
}) => {
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 relative z-20">
      <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
        {/* Card 1: VIP Membership (Black & Gold Prestige) */}
        <div
          className="relative rounded-2xl overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-[#0B0F19] via-[#111827] to-[#0A0D14] border shadow-xl flex flex-col justify-between group hover:border-amber-400/60 transition-all duration-300"
          style={{ borderColor: `${palette.accentColor}40` }}
        >
          {/* Ambient Gold Sheen */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-amber-500/20 transition-colors" />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[10px] font-bold tracking-widest uppercase">
                <Crown className="w-3 h-3 text-amber-400" />
                <span>VIP MEMBERSHIP CLUB</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide pt-1">
                ELEVATED CIRCLE
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                Earn up to 15% cashback, VIP priority reservations, and complimentary Lounge bar service.
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <Crown className="w-6 h-6 text-amber-400" />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between relative z-10">
            <span className="text-[11px] text-amber-200/80 font-mono">MEMBER SINCE 2026</span>
            {onBookClick && (
              <button
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer group-hover:translate-x-0.5 duration-200"
              >
                <span>Join VIP Club</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Card 2: VlinkPay & Modern Payment Gateway */}
        <div
          className="relative rounded-2xl overflow-hidden p-5 sm:p-6 bg-gradient-to-br from-[#070D1B] via-[#0F1E36] to-[#081124] border shadow-xl flex flex-col justify-between group hover:border-emerald-400/60 transition-all duration-300"
          style={{ borderColor: `${palette.accentColor}40` }}
        >
          {/* Ambient Blue/Emerald Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />

          <div className="flex items-start justify-between gap-4 relative z-10">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/30 text-emerald-300 text-[10px] font-bold tracking-widest uppercase">
                <Zap className="w-3 h-3 text-emerald-400" />
                <span>0% PROCESSING FEES</span>
              </div>
              <h3 className="text-base sm:text-lg font-black text-white tracking-wide pt-1">
                VLINKPAY CRYPTO GATEWAY
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                Accept Bitcoin, USDT, Apple Pay, Google Pay & instant Clover POS sync.
              </p>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center shrink-0 shadow-inner">
              <CreditCard className="w-6 h-6 text-emerald-400" />
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-slate-800/80 flex items-center justify-between relative z-10">
            <span className="text-[11px] text-emerald-300/80 font-mono font-bold">SECURE · SWIFT · GLOBAL</span>
            <div className="flex items-center gap-1 text-[10px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Encrypted & Secure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
