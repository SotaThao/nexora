// HoursSection.tsx — Interactive Google Map & Location Section (US-107)
import React from 'react'
import { MapPin, ExternalLink, Navigation, Star, MessageSquareQuote, ChevronRight } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface HoursSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

export const HoursSection: React.FC<HoursSectionProps> = ({ site, palette, isMobileView }) => {
  const address = site.address || '10882 Westheimer Rd, Houston, TX 77042'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  // iwloc=near prevents Google Maps from rendering the duplicate built-in place balloon in the top-left
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=m&z=15&output=embed&iwloc=near`

  const handleScrollToReviews = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const targetElement = document.getElementById('reviews') || document.querySelector('#reviews')
    if (!targetElement) return

    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })

    let parent = targetElement.parentElement
    while (parent && parent !== document.body) {
      const style = window.getComputedStyle(parent)
      const overflowY = style.overflowY
      if ((overflowY === 'auto' || overflowY === 'scroll') && parent.scrollHeight > parent.clientHeight) {
        const headerOffset = 64
        const elementTop = targetElement.getBoundingClientRect().top
        const parentTop = parent.getBoundingClientRect().top
        parent.scrollTo({
          top: parent.scrollTop + (elementTop - parentTop) - headerOffset,
          behavior: 'smooth'
        })
        break
      }
      parent = parent.parentElement
    }
  }

  return (
    <section
      id="hours"
      className="relative w-full border-t border-b overflow-hidden group scroll-mt-16 sm:scroll-mt-20 select-none"
      style={{ borderColor: palette.borderPrimary, height: isMobileView ? '360px' : '480px' }}
    >
      {/* 1. Full-Width Interactive Google Map */}
      <iframe
        title="Salon Location Google Map"
        src={mapEmbedUrl}
        width="100%"
        height="100%"
        style={{ border: 0, filter: 'contrast(1.03) saturate(1.08)' }}
        allowFullScreen={false}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="w-full h-full object-cover"
      />

      {/* 2. Top-Left Comprehensive Info Card (Address + Live Rating & Review Count) */}
      <div className="absolute top-4 left-4 z-10 max-w-sm sm:max-w-md pointer-events-auto">
        <div
          className="p-3.5 sm:p-4 rounded-2xl border shadow-2xl backdrop-blur-xl transition-all"
          style={{
            backgroundColor: `${palette.bgSurface}F2`,
            borderColor: palette.borderPrimary,
            color: palette.textPrimary,
            boxShadow: '0 10px 30px -5px rgba(0, 0, 0, 0.25), 0 0 1px 1px rgba(255, 255, 255, 0.1)'
          }}
        >
          {/* Top Rating & Review Trigger Bar */}
          <button
            type="button"
            onClick={handleScrollToReviews}
            className="w-full flex items-center justify-between gap-3 pb-2.5 mb-2.5 border-b text-left group/rev transition-colors cursor-pointer"
            style={{ borderColor: palette.borderPrimary }}
            title="Click to view client reviews directly"
          >
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-500 border border-amber-400/30 text-xs font-black">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>4.9</span>
              </div>
              <div className="flex items-center text-amber-400 text-[10px]">
                {'★★★★★'.split('').map((s, i) => (
                  <span key={i}>{s}</span>
                ))}
              </div>
              <span className="text-xs font-semibold underline-offset-2 group-hover/rev:underline" style={{ color: palette.textSecondary }}>
                (128 reviews)
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-500 group-hover/rev:translate-x-0.5 transition-transform shrink-0">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span className="hidden xs:inline sm:inline">View reviews</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </div>
          </button>

          {/* Address & Direct Google Map Navigation Link */}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2.5 group/addr transition-all"
            title="Open address on Google Maps"
          >
            <div
              className="p-2 rounded-xl border shrink-0 mt-0.5 group-hover/addr:scale-105 transition-transform"
              style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
            >
              <MapPin className="w-4 h-4" style={{ color: palette.accentColor }} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="font-bold text-xs sm:text-sm block leading-snug group-hover/addr:text-amber-500 transition-colors">
                {address}
              </span>
              <span className="text-[11px] opacity-70 flex items-center gap-1 leading-none mt-1" style={{ color: palette.textSecondary }}>
                <span>Open in Google Maps & Directions</span>
                <ExternalLink className="w-2.5 h-2.5" />
              </span>
            </div>
          </a>
        </div>
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
