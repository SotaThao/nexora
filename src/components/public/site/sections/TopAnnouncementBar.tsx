import React from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface TopAnnouncementBarProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  isMobileView?: boolean
}

export const TopAnnouncementBar: React.FC<TopAnnouncementBarProps> = ({
  site,
  palette,
  onBookClick,
  isMobileView
}) => {
  const content = site.content
  const announcement =
    content.highlights?.[0]?.titleVi ||
    content.highlights?.[0]?.titleEn ||
    '🎉 ONLINE BOOKING SPECIAL: ENJOY 15% OFF FIRST VISIT · 100% GUARANTEED APPOINTMENT'

  return (
    <div
      className={`relative z-20 border-b flex items-center justify-center transition-colors overflow-hidden ${
        isMobileView ? 'py-1.5 px-3 text-[11px]' : 'py-2 px-4 text-xs font-semibold'
      }`}
      style={{
        backgroundColor: palette.bgSurface,
        borderColor: palette.borderPrimary,
        color: palette.textPrimary
      }}
    >
      <div className="flex items-center gap-2 max-w-6xl mx-auto overflow-hidden text-center truncate">
        <Sparkles className="w-3.5 h-3.5 shrink-0 animate-pulse" style={{ color: palette.accentColor }} />
        <span className="font-bold tracking-wide truncate">
          {announcement}
        </span>
        {onBookClick && (
          <button
            type="button"
            onClick={onBookClick}
            className="hidden sm:inline-flex items-center gap-1 font-bold underline ml-1 hover:opacity-80 transition-opacity cursor-pointer"
            style={{ color: palette.accentColor }}
          >
            <span>Book Now</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )
}
