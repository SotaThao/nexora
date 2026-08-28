// SiteNavbarHeader.tsx — Apple HIG Inspired Homepage Navigation Header with Submenus (US-107)
import React, { useState, useMemo, useRef, useEffect } from 'react'
import {
  Menu,
  X,
  Calendar,
  Sparkles,
  Star,
  Clock,
  MapPin,
  Gift,
  Users,
  Scissors,
  ChevronDown,
  ArrowRight,
  Layers,
  Phone
} from 'lucide-react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface SubMenuItem {
  label: string
  href: string
  categoryName?: string
  badge?: string
}

interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ElementType
  subItems?: SubMenuItem[]
}

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
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [expandedMobileNav, setExpandedMobileNav] = useState<string | null>('services')
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const businessName = site.businessName || 'Nexora Salon'
  const logoUrl = site.content?.logoUrl

  // Group service categories from real POS services or fallback mock list
  const serviceSubmenu: SubMenuItem[] = useMemo(() => {
    if (site.services && site.services.length > 0) {
      const counts: Record<string, number> = {}
      site.services.forEach((s) => {
        const cat = s.categoryName || 'Salon Services'
        counts[cat] = (counts[cat] || 0) + 1
      })
      const items = Object.entries(counts).map(([name, count]) => ({
        label: name,
        badge: `${count}`,
        href: '#services',
        categoryName: name
      }))
      return [
        { label: 'All Services', href: '#services', categoryName: 'all', badge: `${site.services.length}` },
        ...items
      ]
    }
    return [
      { label: 'All Services', href: '#services', categoryName: 'all', badge: '22' },
      { label: 'Pedicure', href: '#services', categoryName: 'Pedicure', badge: '9' },
      { label: 'Manicure', href: '#services', categoryName: 'Manicure', badge: '4' },
      { label: 'Acrylic Nail Service', href: '#services', categoryName: 'Acrylic Nail Service', badge: '3' },
      { label: 'Dipping Nail', href: '#services', categoryName: 'Dipping Nail', badge: '2' },
      { label: 'Builder Gel Service', href: '#services', categoryName: 'Builder Gel Service', badge: '2' },
      { label: 'Waxing Service', href: '#services', categoryName: 'Waxing Service', badge: '2' },
    ]
  }, [site.services])

  const navItems: NavItem[] = [
    {
      id: 'services',
      label: 'Services',
      href: '#services',
      icon: Scissors,
      subItems: serviceSubmenu
    },
    { id: 'promotions', label: 'Offers', href: '#promotions', icon: Gift },
    { id: 'about', label: 'About', href: '#about', icon: Sparkles },
    { id: 'staff', label: 'Artists', href: '#staff', icon: Users },
    { id: 'reviews', label: 'Reviews', href: '#reviews', icon: Star },
    { id: 'hours', label: 'Location', href: '#hours', icon: MapPin },
  ]

  const handleNavClick = (e: React.MouseEvent<HTMLElement>, href: string) => {
    e.preventDefault()
    setOpenDropdown(null)
    setIsMobileMenuOpen(false)
    const targetId = href.replace('#', '')
    const targetElement = document.getElementById(targetId) || document.querySelector(href)
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
        const targetScrollTop = elementTop - parentTop + parent.scrollTop - headerOffset
        parent.scrollTo({
          top: Math.max(0, targetScrollTop),
          behavior: 'smooth'
        })
        break
      }
      parent = parent.parentElement
    }
  }

  const handleSubItemSelect = (e: React.MouseEvent<HTMLElement>, subItem: SubMenuItem) => {
    e.preventDefault()
    setOpenDropdown(null)
    setIsMobileMenuOpen(false)

    if (subItem.categoryName) {
      window.dispatchEvent(
        new CustomEvent('nexora-select-category', {
          detail: { categoryName: subItem.categoryName }
        })
      )
    }

    handleNavClick(e, subItem.href)
  }

  const handleMouseEnter = (navId: string) => {
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current)
    }
    setOpenDropdown(navId)
  }

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setOpenDropdown(null)
    }, 150)
  }

  useEffect(() => {
    return () => {
      if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current)
    }
  }, [])

  return (
    <header
      className="sticky top-0 z-30 w-full backdrop-blur-xl border-b transition-colors select-none"
      style={{
        backgroundColor: palette.bgSurface,
        borderColor: palette.borderPrimary,
        color: palette.textPrimary
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          {/* 1. Brand Logo & Name */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="flex items-center gap-2 sm:gap-2.5 group shrink min-w-0 max-w-[200px] sm:max-w-[260px] lg:max-w-[320px]"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={businessName}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover border shadow-sm group-hover:scale-105 transition-transform shrink-0"
                style={{ borderColor: palette.accentColor }}
              />
            ) : (
              <div
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center font-black text-sm shadow-md border group-hover:scale-105 transition-transform shrink-0"
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText,
                  borderColor: palette.borderPrimary
                }}
              >
                {businessName.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 text-left">
              <span className="font-extrabold text-xs sm:text-sm lg:text-base tracking-tight truncate block leading-tight group-hover:opacity-90 transition-opacity" style={{ color: palette.textPrimary }}>
                {businessName}
              </span>
              <span className="text-[10px] sm:text-[11px] font-semibold opacity-70 flex items-center gap-1 leading-none truncate" style={{ color: palette.textSecondary }}>
                <Sparkles className="w-2.5 h-2.5 shrink-0" style={{ color: palette.accentColor }} />
                <span className="truncate">Nail & Spa Studio</span>
              </span>
            </div>
          </a>

          {/* 2. Desktop Navigation Menu (With Interactive Submenu Dropdowns) */}
          {!isMobileView && (
            <nav className="hidden md:flex items-center gap-1 lg:gap-1.5 shrink-0 whitespace-nowrap">
              {navItems.map((item) => {
                const hasSubmenu = Boolean(item.subItems && item.subItems.length > 0)
                const isDropdownOpen = openDropdown === item.id

                return (
                  <div
                    key={item.id}
                    className="relative"
                    onMouseEnter={() => hasSubmenu && handleMouseEnter(item.id)}
                    onMouseLeave={() => hasSubmenu && handleMouseLeave()}
                  >
                    <a
                      href={item.href}
                      onClick={(e) => {
                        if (hasSubmenu) {
                          setOpenDropdown(isDropdownOpen ? null : item.id)
                        }
                        handleNavClick(e, item.href)
                      }}
                      className={`px-2.5 lg:px-3 py-1.5 rounded-xl text-xs lg:text-sm font-semibold transition-all flex items-center gap-1.5 opacity-85 hover:opacity-100 whitespace-nowrap shrink-0 ${
                        isDropdownOpen ? 'bg-white/10 opacity-100 shadow-xs' : 'hover:bg-white/5'
                      }`}
                      style={{ color: palette.textPrimary }}
                    >
                      <span className="whitespace-nowrap">{item.label}</span>
                      {hasSubmenu && (
                        <ChevronDown
                          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
                            isDropdownOpen ? 'rotate-180 opacity-100' : ''
                          }`}
                          style={{ color: isDropdownOpen ? palette.accentColor : undefined }}
                        />
                      )}
                    </a>

                    {/* Submenu Dropdown Popover */}
                    {hasSubmenu && isDropdownOpen && (
                      <div
                        className="absolute left-0 top-full mt-1.5 w-72 sm:w-80 rounded-2xl border shadow-2xl backdrop-blur-2xl p-2 z-50 animate-fadeIn"
                        style={{
                          backgroundColor: palette.bgSurface,
                          borderColor: palette.borderPrimary,
                          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.6)'
                        }}
                      >
                        {/* Submenu Header Label */}
                        <div
                          className="px-3 py-2 flex items-center justify-between border-b text-[10px] font-extrabold uppercase tracking-wider mb-1"
                          style={{ borderColor: palette.borderPrimary, color: palette.accentColor }}
                        >
                          <span className="flex items-center gap-1.5">
                            <Layers className="w-3 h-3" />
                            <span>SERVICE CATEGORIES</span>
                          </span>
                          <span className="opacity-70 lowercase font-normal">select to view</span>
                        </div>

                        {/* Category List */}
                        <div className="grid grid-cols-1 gap-1 max-h-[320px] overflow-y-auto pr-1">
                          {item.subItems?.map((sub, idx) => (
                            <button
                              key={sub.label + idx}
                              type="button"
                              onClick={(e) => handleSubItemSelect(e, sub)}
                              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-left transition-all hover:bg-white/10 group cursor-pointer"
                              style={{ color: palette.textPrimary }}
                            >
                              <span className="flex items-center gap-2 truncate">
                                <span className="w-1.5 h-1.5 rounded-full opacity-60 group-hover:opacity-100 group-hover:scale-125 transition-all shrink-0" style={{ backgroundColor: palette.accentColor }} />
                                <span className="truncate group-hover:translate-x-0.5 transition-transform">{sub.label}</span>
                              </span>
                              {sub.badge && (
                                <span
                                  className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 transition-colors"
                                  style={{
                                    backgroundColor: palette.badgeBg,
                                    color: palette.badgeText
                                  }}
                                >
                                  {sub.badge}
                                </span>
                              )}
                            </button>
                          ))}
                        </div>

                        {/* Quick Action Footer */}
                        <div className="mt-1 pt-1.5 border-t" style={{ borderColor: palette.borderPrimary }}>
                          <button
                            type="button"
                            onClick={(e) => handleNavClick(e, '#services')}
                            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-opacity hover:opacity-80 cursor-pointer"
                            style={{ color: palette.accentColor }}
                          >
                            <span>View Full Menu & Pricing</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>
          )}

          {/* 3. Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap">
            {/* Primary CTA Button: Book Now */}
            <button
              type="button"
              onClick={onBookClick}
              className={`rounded-xl font-bold shadow-lg hover:shadow-xl transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-1.5 shrink-0 whitespace-nowrap ${
                isMobileView ? 'px-3 py-2 text-xs min-h-[38px]' : 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm min-h-[38px] sm:min-h-[40px]'
              }`}
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText,
                boxShadow: `0 8px 20px -4px ${palette.accentColor}50`
              }}
            >
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span className="whitespace-nowrap">Book Now</span>
            </button>

            {/* Mobile / Tablet Hamburger Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-2 rounded-xl border transition-colors flex items-center justify-center shrink-0 ${
                isMobileView ? 'flex' : 'md:hidden flex'
              }`}
              style={{
                borderColor: palette.borderPrimary,
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                color: palette.textPrimary
              }}
              aria-label={isMobileMenuOpen ? 'Close menu' : 'Open navigation menu'}
            >
              {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* 4. Mobile Dropdown / Slide Navigation Drawer (With Expandable Submenu Accordion) */}
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
            <div className="flex flex-col gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon
                const hasSubmenu = Boolean(item.subItems && item.subItems.length > 0)
                const isExpanded = expandedMobileNav === item.id

                return (
                  <div key={item.id} className="flex flex-col">
                    <div className="flex items-center gap-1">
                      <a
                        href={item.href}
                        onClick={(e) => handleNavClick(e, item.href)}
                        className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all text-xs font-bold bg-white/5 hover:bg-white/10"
                        style={{
                          borderColor: palette.borderPrimary,
                          color: palette.textPrimary
                        }}
                      >
                        <Icon className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                        <span>{item.label}</span>
                      </a>

                      {hasSubmenu && (
                        <button
                          type="button"
                          onClick={() => setExpandedMobileNav(isExpanded ? null : item.id)}
                          className="px-3 py-2.5 rounded-xl border flex items-center justify-center transition-colors bg-white/5"
                          style={{
                            borderColor: palette.borderPrimary,
                            color: palette.textPrimary
                          }}
                          aria-label="Toggle category submenu"
                        >
                          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} style={{ color: palette.accentColor }} />
                        </button>
                      )}
                    </div>

                    {/* Mobile Nested Submenu Category Chips */}
                    {hasSubmenu && isExpanded && (
                      <div className="pt-2 pb-1 pl-4 pr-1 grid grid-cols-2 gap-1.5 animate-fadeIn">
                        {item.subItems?.map((sub, idx) => (
                          <button
                            key={sub.label + idx}
                            type="button"
                            onClick={(e) => handleSubItemSelect(e, sub)}
                            className="flex items-center justify-between gap-1.5 px-2.5 py-2 rounded-lg border text-[11px] font-semibold text-left transition-colors bg-white/5 hover:bg-white/15 truncate"
                            style={{
                              borderColor: palette.borderPrimary,
                              color: palette.textPrimary
                            }}
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-white/10 shrink-0">
                                {sub.badge}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Business Quick Contact & Location Info */}
            <div className="pt-2 border-t flex flex-col gap-2 text-xs" style={{ borderColor: palette.borderPrimary, color: palette.textSecondary }}>
              {site.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                  <span className="truncate">{site.address}</span>
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
                <span>Book Appointment Online</span>
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
