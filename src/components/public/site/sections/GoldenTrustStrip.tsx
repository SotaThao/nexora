import React from 'react'
import { Sparkles, ShieldCheck, Award, CreditCard, CalendarCheck } from 'lucide-react'
import { SitePalette } from '../palettes'

interface GoldenTrustStripProps {
  palette: SitePalette
  isMobileView?: boolean
}

export const GoldenTrustStrip: React.FC<GoldenTrustStripProps> = ({
  palette,
  isMobileView
}) => {
  const pillars = [
    {
      icon: Sparkles,
      title: 'LUXURY EXPERIENCE',
      subtitle: '5-Star Private Luxury Sanctuary'
    },
    {
      icon: ShieldCheck,
      title: '100% HOSPITAL SANITIZED',
      subtitle: 'Autoclave Sealed & Single-Use'
    },
    {
      icon: Award,
      title: 'MASTER NAIL ARTISTS',
      subtitle: 'Certified Master Technicians (8-10+ Yrs)'
    },
    {
      icon: CreditCard,
      title: 'MODERN SMART PAYMENTS',
      subtitle: 'Cards, Apple Pay, POS & Crypto'
    },
    {
      icon: CalendarCheck,
      title: 'INSTANT APPOINTMENT SYNC',
      subtitle: 'Real-time confirmation via POS'
    },
  ]

  return (
    <div
      className={`border-y transition-colors ${
        isMobileView ? 'py-4 px-3' : 'py-6 px-4 sm:px-6 lg:px-8'
      }`}
      style={{
        backgroundColor: palette.bgSurface,
        borderColor: palette.borderPrimary,
        color: palette.textPrimary
      }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`grid gap-3 items-center ${
          isMobileView ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-5 divide-x divide-slate-700/20'
        }`}>
          {pillars.map((p, idx) => {
            const Icon = p.icon
            return (
              <div
                key={idx}
                className={`flex items-center gap-2.5 ${
                  isMobileView ? 'p-2 rounded-xl bg-white/5 border border-white/10' : 'px-4 first:pl-0'
                }`}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm border"
                  style={{
                    backgroundColor: palette.bgPrimary,
                    borderColor: `${palette.accentColor}40`,
                    color: palette.accentColor
                  }}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-black tracking-wide uppercase truncate" style={{ color: palette.textPrimary }}>
                    {p.title}
                  </h4>
                  <p className="text-[11px] truncate leading-tight opacity-80" style={{ color: palette.textSecondary }}>
                    {p.subtitle}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
