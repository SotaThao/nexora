import React from 'react'
import { Calendar, Phone } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface MobileStickyBookingBarProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
}

export const MobileStickyBookingBar: React.FC<MobileStickyBookingBarProps> = ({
  site,
  palette,
  onBookClick
}) => {
  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-white/95 backdrop-blur-md border-t shadow-2xl flex items-center gap-2 sm:hidden"
      style={{
        borderColor: palette.borderPrimary,
        backgroundColor: palette.bgSurface
      }}
    >
      {site.phone && (
        <a
          href={`tel:${site.phone}`}
          className="flex-1 py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          style={{
            borderColor: palette.borderPrimary,
            color: palette.textPrimary,
            backgroundColor: palette.bgPrimary
          }}
        >
          <Phone className="w-3.5 h-3.5" />
          <span>Gọi Điện</span>
        </a>
      )}

      <button
        type="button"
        onClick={onBookClick}
        className="flex-[2] py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95"
        style={{
          backgroundColor: palette.accentColor,
          color: palette.buttonText,
          boxShadow: `0 8px 20px -4px ${palette.accentColor}60`
        }}
      >
        <Calendar className="w-4 h-4" />
        <span>Đặt Lịch Hẹn Ngay</span>
      </button>
    </div>
  )
}
