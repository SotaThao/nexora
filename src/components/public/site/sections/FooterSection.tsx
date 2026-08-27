// FooterSection.tsx — Apple HIG Inspired 4-Column Luxury Footer (US-107)
import React from 'react'
import {
  MapPin,
  Phone,
  Clock,
  Sparkles,
  ShieldCheck,
  Globe,
  ArrowRight,
  ExternalLink,
  Calendar
} from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface FooterSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  onSelectService?: (serviceName: string) => void
  isMobileView?: boolean
}

export const FooterSection: React.FC<FooterSectionProps> = ({
  site,
  palette,
  onBookClick,
  onSelectService,
  isMobileView
}) => {
  const businessName = site.businessName || 'Nexora Salon'
  const logoUrl = site.content?.logoUrl
  const address = site.address || '9793 Westheimer Rd A, Houston, TX 77042, USA'
  const phone = site.phone || '(832) 555-0198'
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`

  const popularServices = React.useMemo(() => {
    if (site.services && site.services.length > 0) {
      return site.services.slice(0, 5).map((s) => s.name)
    }
    return [
      'Bitcoin 24K Gold Pedicure',
      'Paris Pearl Manicure',
      'Diamond Gel Manicure',
      'Organic Deluxe Spa',
      'Crypto Glow Facial'
    ]
  }, [site.services])

  const quickLinks = [
    { label: 'Dịch Vụ (Services)', href: '#services' },
    { label: 'Đặt Lịch Hẹn (Book Appointment)', href: '#book', isBooking: true },
    { label: 'Ưu Đãi Đặc Biệt (Promotions)', href: '#promotions' },
    { label: 'Giới Thiệu (About Us)', href: '#about' },
    { label: 'Đội Ngũ Nghệ Nhân (Staff)', href: '#staff' },
    { label: 'Đánh Giá Khách Hàng (Reviews)', href: '#reviews' },
    { label: 'Vị Trí & Chỉ Đường (Location & Map)', href: '#hours' },
  ]

  const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, href: string, isBooking?: boolean) => {
    e.preventDefault()
    if (isBooking) {
      onBookClick?.()
      return
    }
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId) || document.querySelector(href)
    if (!targetElement) return
    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const handleServiceClick = (e: React.MouseEvent<HTMLAnchorElement>, serviceName: string) => {
    e.preventDefault()
    onSelectService?.(serviceName)
    const targetElement = document.getElementById('services')
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <footer
      className="border-t text-xs transition-colors select-none"
      style={{
        backgroundColor: '#070C18',
        borderColor: palette.borderPrimary,
        color: palette.textSecondary
      }}
    >
      {/* 1. Main 4-Column Footer Content */}
      <div className={`max-w-7xl mx-auto ${isMobileView ? 'py-10 px-4 space-y-8' : 'py-14 px-4 sm:px-6 lg:px-8'}`}>
        <div className={`grid gap-8 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-12 lg:gap-10'}`}>
          {/* Column 1: Brand Info & Description (4 cols on lg) */}
          <div className="lg:col-span-4 space-y-4 text-left">
            <div className="flex items-center gap-3">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={businessName}
                  className="w-10 h-10 rounded-full object-cover border shadow-md shrink-0"
                  style={{ borderColor: palette.accentColor }}
                />
              ) : (
                <div
                  className="w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-lg border shrink-0"
                  style={{
                    backgroundColor: palette.accentColor,
                    color: palette.buttonText,
                    borderColor: palette.borderPrimary
                  }}
                >
                  {businessName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="font-extrabold text-base tracking-tight truncate block text-white">
                  {businessName}
                </span>
                <span className="text-[11px] font-semibold opacity-80 flex items-center gap-1 leading-none" style={{ color: palette.accentColor }}>
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>Luxury Nail & Spa Lounge</span>
                </span>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-slate-300/90 max-w-sm">
              {site.slogan || site.content?.about?.description || 'Premium nail care services with a futuristic twist. The world\'s first crypto integrated luxury salon.'}
            </p>

            <div className="pt-1">
              <button
                type="button"
                onClick={onBookClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold shadow-lg transition-transform hover:scale-102 active:scale-95 cursor-pointer"
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText
                }}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span>Đặt Lịch Hẹn Ngay</span>
              </button>
            </div>
          </div>

          {/* Column 2: Quick Links (2 cols on lg) */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: palette.accentColor }} />
              <span>Quick Links</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <a
                    href={link.href}
                    onClick={(e) => handleSmoothScroll(e, link.href, link.isBooking)}
                    className="hover:text-white transition-colors flex items-center gap-1.5 group text-slate-300/90 cursor-pointer"
                  >
                    <span className="w-1 h-1 rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all shrink-0" style={{ backgroundColor: palette.accentColor }} />
                    <span className="group-hover:translate-x-0.5 transition-transform">{link.label}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Popular Services (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-3 text-left">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: palette.accentColor }} />
              <span>Popular Services</span>
            </h4>
            <ul className="space-y-2 text-xs">
              {popularServices.map((service, idx) => (
                <li key={idx}>
                  <a
                    href="#services"
                    onClick={(e) => handleServiceClick(e, service)}
                    className="hover:text-white transition-colors flex items-center gap-1.5 group text-slate-300/90 cursor-pointer"
                  >
                    <span className="w-1 h-1 rounded-full opacity-40 group-hover:opacity-100 group-hover:scale-150 transition-all shrink-0" style={{ backgroundColor: palette.accentColor }} />
                    <span className="truncate group-hover:translate-x-0.5 transition-transform">{service}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact Us & Location (3 cols on lg) */}
          <div className="lg:col-span-3 space-y-3 text-left">
            <h4 className="font-bold text-sm text-white tracking-wide uppercase flex items-center gap-2">
              <span className="w-1.5 h-3.5 rounded-full" style={{ backgroundColor: palette.accentColor }} />
              <span>Contact Us</span>
            </h4>

            <div className="space-y-2.5 text-xs text-slate-300/90">
              <a
                href={mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 group hover:text-white transition-colors cursor-pointer"
              >
                <MapPin className="w-4 h-4 shrink-0 mt-0.5" style={{ color: palette.accentColor }} />
                <span className="leading-tight group-hover:underline">{address}</span>
              </a>

              {phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                  <div className="flex flex-col">
                    <span className="font-bold text-white">Store: {phone}</span>
                    <span className="text-[11px] opacity-70">Cell Phone: (832) 799-3990</span>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 pt-1">
                <Clock className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span>Mon - Sat: 9:30 AM - 7:30 PM</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Bottom Copyright & Badges Bar */}
      <div className="border-t py-6 px-4 sm:px-6 lg:px-8" style={{ borderColor: 'rgba(255, 255, 255, 0.08)', backgroundColor: '#050912' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
          {/* Copyright */}
          <div className="text-slate-400 text-center md:text-left">
            <span className="font-bold text-white">{businessName}</span> — © {new Date().getFullYear()} All Rights Reserved.
          </div>

          {/* Payment Method Badges */}
          <div className="flex items-center gap-1.5 flex-wrap justify-center">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">₿ Bitcoin</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">₮ USDT</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">💳 VLINKPAY</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20"> Pay</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">G Pay</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-300 border border-slate-500/20">Visa / MC</span>
          </div>

          {/* POS & Technology Badges */}
          <div className="flex items-center gap-4 text-slate-400">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Clover POS Verified</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Powered by <strong>NEXORA</strong></span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
