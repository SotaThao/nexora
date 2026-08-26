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
      subtitle: 'Không gian riêng tư, chuẩn 5 sao'
    },
    {
      icon: ShieldCheck,
      title: '100% VÔ TRÙNG Y TẾ',
      subtitle: 'Dụng cụ tiệt trùng khép kín'
    },
    {
      icon: Award,
      title: 'MASTER NAIL ARTISTS',
      subtitle: 'Đội ngũ thợ 8-10 năm tay nghề'
    },
    {
      icon: CreditCard,
      title: 'THANH TOÁN HIỆN ĐẠI',
      subtitle: 'Cards, Apple Pay, POS & Crypto'
    },
    {
      icon: CalendarCheck,
      title: 'GIỮ CHỖ ĐẢM BẢO',
      subtitle: 'Xác nhận tức thì qua POS'
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
        <div className={`grid gap-4 items-center ${
          isMobileView ? 'grid-cols-1 divide-y divide-slate-700/20' : 'grid-cols-2 md:grid-cols-5 divide-x divide-slate-700/20'
        }`}>
          {pillars.map((p, idx) => {
            const Icon = p.icon
            return (
              <div
                key={idx}
                className={`flex items-center gap-3 ${
                  isMobileView ? 'pt-2.5 first:pt-0' : 'px-4 first:pl-0'
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
