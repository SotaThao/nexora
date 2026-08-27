// HoursSection.tsx — Business Hours & Interactive Google Map (US-107)
import React from 'react'
import { Clock, CheckCircle, MapPin, ExternalLink, Navigation, Compass } from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface HoursSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

const DAY_LABELS: Record<string, string> = {
  Monday: 'Thứ Hai (Mon)',
  Tuesday: 'Thứ Ba (Tue)',
  Wednesday: 'Thứ Tư (Wed)',
  Thursday: 'Thứ Năm (Thu)',
  Friday: 'Thứ Sáu (Fri)',
  Saturday: 'Thứ Bảy (Sat)',
  Sunday: 'Chủ Nhật (Sun)',
}

function formatTime(timeStr?: string | null): string {
  if (!timeStr) return ''
  const parts = timeStr.split(':')
  if (parts.length < 2) return timeStr
  let hour = parseInt(parts[0], 10)
  const min = parts[1]
  const ampm = hour >= 12 ? 'PM' : 'AM'
  hour = hour % 12 || 12
  return `${hour.toString().padStart(2, '0')}:${min} ${ampm}`
}

export const HoursSection: React.FC<HoursSectionProps> = ({ site, palette, isMobileView }) => {
  const address = site.address || '9793 Westheimer Rd A, Houston, TX 77042, USA'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`

  const defaultHours = [
    { day: 'Thứ Hai (Mon)', time: '09:30 AM - 07:30 PM', open: true },
    { day: 'Thứ Ba (Tue)', time: '09:30 AM - 07:30 PM', open: true },
    { day: 'Thứ Tư (Wed)', time: '09:30 AM - 07:30 PM', open: true },
    { day: 'Thứ Năm (Thu)', time: '09:30 AM - 07:30 PM', open: true },
    { day: 'Thứ Sáu (Fri)', time: '09:30 AM - 07:30 PM', open: true },
    { day: 'Thứ Bảy (Sat)', time: '09:00 AM - 07:00 PM', open: true },
    { day: 'Chủ Nhật (Sun)', time: '11:00 AM - 05:00 PM', open: true }
  ]

  const hours = (site.businessHours && site.businessHours.length > 0)
    ? site.businessHours.map((h) => ({
        day: DAY_LABELS[h.dayOfWeek] || h.dayOfWeek,
        time: h.isOpen ? `${formatTime(h.openTime)} - ${formatTime(h.closeTime)}` : 'Đóng cửa (Closed)',
        open: h.isOpen
      }))
    : defaultHours

  return (
    <section
      id="hours"
      className="transition-colors scroll-mt-16 sm:scroll-mt-20 border-t"
      style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
    >
      {/* 1. Hours Table Card */}
      <div className={`max-w-6xl mx-auto ${isMobileView ? 'py-8 px-4' : 'py-14 px-4 sm:px-6 lg:px-8'}`}>
        <div
          className={`rounded-3xl border shadow-xl ${isMobileView ? 'p-4' : 'p-8'}`}
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.borderPrimary
          }}
        >
          <div className={`flex items-center justify-between border-b ${isMobileView ? 'mb-4 pb-3 flex-col items-start gap-2' : 'mb-6 pb-4'}`} style={{ borderColor: palette.borderPrimary }}>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl border flex items-center justify-center shrink-0" style={{ borderColor: palette.borderPrimary, backgroundColor: palette.bgPrimary }}>
                <Clock className="w-5 h-5" style={{ color: palette.accentColor }} />
              </div>
              <div>
                <h3 className={`font-bold ${isMobileView ? 'text-base' : 'text-lg sm:text-xl'}`} style={{ color: palette.textPrimary }}>
                  Giờ Mở Cửa & Hoạt Động
                </h3>
                <span className="text-xs" style={{ color: palette.textSecondary }}>Đồng bộ lịch từ hệ thống POS</span>
              </div>
            </div>

            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all hover:scale-102 cursor-pointer ${
                isMobileView ? 'w-full justify-center' : ''
              }`}
              style={{
                backgroundColor: palette.bgPrimary,
                borderColor: palette.borderPrimary,
                color: palette.accentColor
              }}
            >
              <Compass className="w-4 h-4 shrink-0" />
              <span>Chỉ Đường Google Maps (Get Directions)</span>
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
            </a>
          </div>

          <div className={`grid gap-2.5 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 sm:gap-3'}`}>
            {hours.map((h, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-2xl border text-xs transition-colors hover:bg-white/5"
                style={{
                  borderColor: palette.borderPrimary,
                  backgroundColor: palette.bgPrimary
                }}
              >
                <span className="font-semibold" style={{ color: palette.textPrimary }}>{h.day}</span>
                <span className="font-bold flex items-center gap-1.5" style={{ color: palette.accentColor }}>
                  <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{h.time}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Full-Width Interactive Google Map with Centered GET DIRECTIONS CTA */}
      <div className="relative w-full border-t border-b overflow-hidden group" style={{ borderColor: palette.borderPrimary, height: isMobileView ? '320px' : '420px' }}>
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

        {/* Top-Left Address Info Card */}
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

        {/* Center Floating Get Directions CTA Button */}
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
      </div>
    </section>
  )
}
