import React from 'react'
import { Clock, CheckCircle, MapPin, ExternalLink } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
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
  const templateId = site.templateId || MerchantSiteTemplateId.Classic
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

  const mapsUrl = site.address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(site.address)}`
    : null

  return (
    <section
      className={`border-t transition-colors ${isMobileView ? 'py-8 px-4' : 'py-14 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
    >
      <div
        className={`max-w-4xl mx-auto rounded-3xl border shadow-sm ${isMobileView ? 'p-4' : 'p-8'}`}
        style={{
          backgroundColor: palette.bgSurface,
          borderColor: palette.borderPrimary
        }}
      >
        <div className={`flex items-center justify-between border-b ${isMobileView ? 'mb-4 pb-3 flex-col items-start gap-2' : 'mb-6 pb-4'}`} style={{ borderColor: palette.borderPrimary }}>
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5" style={{ color: palette.accentColor }} />
            <div>
              <h3 className={`font-bold ${isMobileView ? 'text-base' : 'text-lg sm:text-xl'}`} style={{ color: palette.textPrimary }}>
                Giờ Mở Cửa & Hoạt Động
              </h3>
              <span className="text-xs" style={{ color: palette.textSecondary }}>Đồng bộ lịch từ hệ thống POS</span>
            </div>
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border transition-all hover:scale-102 ${
                isMobileView ? 'w-full justify-center' : ''
              }`}
              style={{
                backgroundColor: palette.bgPrimary,
                borderColor: palette.borderPrimary,
                color: palette.accentColor
              }}
            >
              <MapPin className="w-4 h-4" />
              <span>Chỉ Đường Google Maps (Get Directions)</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className={`grid gap-2.5 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 sm:gap-3'}`}>
          {hours.map((h, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 rounded-2xl border text-xs"
              style={{
                borderColor: palette.borderPrimary,
                backgroundColor: palette.bgPrimary
              }}
            >
              <span className="font-medium" style={{ color: palette.textPrimary }}>{h.day}</span>
              <span className="font-bold flex items-center gap-1" style={{ color: palette.accentColor }}>
                <CheckCircle className="w-3.5 h-3.5" />
                {h.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
