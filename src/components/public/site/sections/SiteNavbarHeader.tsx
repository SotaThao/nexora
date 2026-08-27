// SiteNavbarHeader.tsx — Apple HIG Inspired Homepage Navigation Header for Merchant Site (US-107)
import React, { useState } from 'react'
import {
  Menu,
  X,
  Calendar,
  Phone,
  Sparkles,
  Star,
  Clock,
  MapPin,
  Gift,
  Users,
  Scissors
} from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface SiteNavbarHeaderProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  isMobileView?: boolean
}

export const SiteNavbarHeader: React.FC<SiteNavbarHeaderProps> = ({
  site,
  palette,
  onBookClick,
  isMobileView
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const businessName = site.businessName || 'Nexora Salon'
  const logoUrl = site.content?.logoUrl

  const navItems = [
    { label: 'Dịch Vụ', href: '#services', icon: Scissors },
    { label: 'Ưu Đãi', href: '#promotions', icon: Gift },
    { label: 'Đội Ngũ', href: '#staff', icon: Users },
    { label: 'Đánh Giá', href: '#reviews', icon: Star },
    { label: 'Giờ Mở Cửa', href: '#hours', icon: Clock },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault()
    setIsMobileMenuOpen(false)
    const targetElement = document.querySelector(href)
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <header
      className="sticky top-0 z-30 w-full backdrop-blur-xl border-b transition-colors select-none"
      style={{
        backgroundColor: `${palette.bgSurface}F2`,
        borderColor: `${palette.borderPrimary}80`,
        color: palette.textPrimary
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-3">
          {/* 1. Brand Logo & Name */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="flex items-center gap-2.5 sm:gap-3 group shrink-0 min-w-0"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border shadow-sm group-hover:scale-105 transition-transform"
                style={{ borderColor: palette.accentColor }}
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md border group-hover:scale-105 transition-transform shrink-0"
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText,
                  borderColor: `${palette.accentColor}80`
                }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 text-left">
              <span className="font-extrabold text-sm sm:text-base tracking-tight truncate block leading-tight group-hover:opacity-90 transition-opacity" style={{ color: palette.textPrimary }}>
                {businessName}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold opacity-70 flex items-center gap-1 leading-none" style={{ color: palette.textSecondary }}>
                <Sparkles className="w-2.5 h-2.5" style={{ color: palette.accentColor }} />
                <span>Nail & Spa Studio</span>
              </span>
            </div>
          </a>

          {/* 2. Desktop Navigation Menu (Hidden on Mobile) */}
          {!isMobileView && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  className="px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all hover:bg-white/10 flex items-center gap-1.5 opacity-80 hover:opacity-100"
                  style={{ color: palette.textPrimary }}
                >
                  <span>{item.label}</span>
                </a>
              ))}
            </nav>
          )}

          {/* 3. Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Hotline Phone Link (Desktop & Tablet) */}
            {site.phone && !isMobileView && (
              <a
                href={`tel:${site.phone}`}
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all hover:bg-white/10"
                style={{
                  borderColor: `${palette.borderPrimary}80`,
                  color: palette.textPrimary
                }}
              >
                <Phone className="w-3.5 h-3.5" style={{ color: palette.accentColor }} />
                <span>{site.phone}</span>
              </a>
            )}

            {/* Primary CTA Button: Đặt Lịch Hẹn */}
            <button
              type="button"
              onClick={onBookClick}
              className={`rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 ${
                isMobileView ? 'px-3 py-2 text-xs min-h-[38px]' : 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[40px]'
              }`}
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText,
                boxShadow: `0 8px 20px -4px ${palette.accentColor}50`
              }}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Đặt Lịch Hẹn</span>
            </button>

            {/* Mobile Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center ${
                isMobileView ? 'flex' : 'md:hidden flex'
              }`}
              style={{
                borderColor: `${palette.borderPrimary}80`,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: palette.textPrimary
              }}
              aria-label={isMobileMenuOpen ? 'Đóng menu' : 'Mở menu điều hướng'}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Dropdown / Slide Navigation Drawer */}
      {isMobileMenuOpen && (
        <div
          className="border-b shadow-2xl animate-fadeIn overflow-hidden"
          style={{
            backgroundColor: palette.bgSurface,
            borderColor: palette.borderPrimary
          }}
        >
          <div className="max-w-7xl mx-auto px-4 py-4 space-y-3">
            {/* Quick Links List */}
            <div className="grid grid-cols-2 gap-2">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-bold bg-white/5 hover:bg-white/10"
                    style={{
                      borderColor: `${palette.borderPrimary}60`,
                      color: palette.textPrimary
                    }}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                    <span>{item.label}</span>
                  </a>
                )
              })}
            </div>

            {/* Business Quick Contact & Location Info */}
            <div className="pt-2 border-t flex flex-col gap-2 text-xs" style={{ borderColor: `${palette.borderPrimary}40`, color: palette.textSecondary }}>
              {site.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                  <span className="truncate">{site.address}</span>
                </div>
              )}
              {site.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                  <span>{site.phone}</span>
                </div>
              )}
            </div>

            {/* Full-Width Mobile Action Buttons */}
            <div className="pt-1 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false)
                  onBookClick?.()
                }}
                className="flex-1 py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-transform active:scale-95 min-h-[44px]"
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>Đặt Lịch Hẹn Trực Tuyến</span>
              </button>

              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className="py-3 px-3.5 rounded-xl border text-xs font-bold flex items-center justify-center transition-colors min-h-[44px]"
                  style={{
                    borderColor: palette.borderPrimary,
                    color: palette.textPrimary,
                    backgroundColor: 'rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  )
}
