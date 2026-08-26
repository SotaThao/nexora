import React from 'react'
import { Globe, ShieldCheck } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface FooterSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

export const FooterSection: React.FC<FooterSectionProps> = ({ site, palette, isMobileView }) => {
  return (
    <footer
      className={`border-t text-center text-xs transition-colors ${isMobileView ? 'py-8 px-4 space-y-4' : 'py-12 px-4 sm:px-6 lg:px-8 space-y-6'}`}
      style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary, color: palette.textSecondary }}
    >
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 border-b pb-6" style={{ borderColor: palette.borderPrimary }}>
        <div className="text-left space-y-1 text-center md:text-left">
          <div className="font-serif font-bold text-base" style={{ color: palette.textPrimary }}>
            {site.businessName}
          </div>
          <p className="text-xs max-w-md opacity-80" style={{ color: palette.textSecondary }}>
            Trải nghiệm làm đẹp và chăm sóc móng chuẩn 5 sao với sản phẩm Organic & công nghệ đặt hẹn POS thông minh.
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Phương Thức Thanh Toán</span>
          <div className="flex items-center gap-1.5 flex-wrap justify-center md:justify-end">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/30">₿ Bitcoin</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30">₮ USDT</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">💳 VLINKPAY</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30"> Pay</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/30">G Pay</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/30">Visa / MC</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div>
          <span className="font-bold" style={{ color: palette.textPrimary }}>{site.businessName}</span> — © {new Date().getFullYear()} All Rights Reserved.
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-500 font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Clover POS Verified</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5" />
            <span>Powered by <strong>NEXORA Touch</strong></span>
          </div>
        </div>
      </div>
    </footer>
  )
}
