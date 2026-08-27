// HoursSection.tsx — Interactive Google Map & Location Section (US-107)
import React from 'react'
import { MapPin, ExternalLink, Navigation } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface HoursSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

export const HoursSection: React.FC<HoursSectionProps> = ({ site, palette, isMobileView }) => {
  const address = site.address || '9793 Westheimer Rd A, Houston, TX 77042, USA'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  return (
    <section
      id="hours"
      className="relative w-full border-t border-b overflow-hidden group scroll-mt-16 sm:scroll-mt-20"
      style={{ borderColor: palette.borderPrimary, height: isMobileView ? '320px' : '450px' }}
    >
      {/* 1. Full-Width Interactive Google Map */}
      <iframe
        title="Salon Location Google Map"
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, filter: 'contrast(1.05) saturate(1.1)' }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full object-cover"
      />

      {/* 2. Top-Left Address Info Card */}
      <div className="absolute top-4 left-4 z-10 max-w-sm">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 p-3 rounded-2xl border shadow-xl backdrop-blur-xl transition-all hover:scale-102 group/card"
          style={{
            backgroundColor: `${palette.bgSurface}EE`,
            borderColor: palette.borderPrimary,
            color: palette.textPrimary
          }}
        >
          <div className="p-2 rounded-xl border shrink-0" style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}>
            <MapPin className="w-4 h-4" style={{ color: palette.accentColor }} />
          </div>
          <div className="min-w-0 pr-2">
            <span className="font-bold text-xs block truncate leading-tight group-hover/card:text-amber-500 transition-colors">
              {address}
            </span>
            <span className="text-[11px] opacity-70 flex items-center gap-1 leading-none mt-0.5" style={{ color: palette.textSecondary }}>
              <span>Xem trên Google Maps</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </span>
          </div>
        </a>
      </div>

      {/* 3. Center Floating Get Directions CTA Button */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <a
          href={mapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-wider shadow-2xl border transition-all hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
          style={{
            backgroundColor: '#000000',
            color: '#FFFFFF',
            borderColor: palette.accentColor,
            boxShadow: `0 12px 30px -4px rgba(0, 0, 0, 0.8), 0 0 15px 0px ${palette.accentColor}50`
          }}
        >
          <Navigation className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
          <span className="tracking-widest">GET DIRECTIONS</span>
        </a>
      </div>
    </section>
  )
}
