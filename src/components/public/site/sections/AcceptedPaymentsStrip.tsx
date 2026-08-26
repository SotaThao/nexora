import React from 'react'
import { SitePalette } from '../palettes'

interface AcceptedPaymentsStripProps {
  palette: SitePalette
  isMobileView?: boolean
}

export const AcceptedPaymentsStrip: React.FC<AcceptedPaymentsStripProps> = ({
  palette,
  isMobileView
}) => {
  const payments = [
    { label: '₿ Bitcoin', bg: 'bg-amber-500/10 text-amber-500 border-amber-500/30' },
    { label: '₮ USDT', bg: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' },
    { label: '💳 VLINKPAY', bg: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
    { label: ' Apple Pay', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
    { label: 'G Pay', bg: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
    { label: 'Visa / MC', bg: 'bg-slate-500/10 text-slate-300 border-slate-500/30' },
    { label: 'Clover POS', bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  ]

  return (
    <div className={`flex items-center gap-2 pt-2 ${isMobileView ? 'flex-wrap justify-center' : 'flex-wrap'}`}>
      <span className="text-[10px] font-bold uppercase tracking-wider opacity-70" style={{ color: palette.heroTextSecondary }}>
        WE ACCEPT:
      </span>
      <div className="flex items-center gap-1.5 flex-wrap">
        {payments.map((p, idx) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border backdrop-blur-xs ${p.bg}`}
          >
            {p.label}
          </span>
        ))}
      </div>
    </div>
  )
}
