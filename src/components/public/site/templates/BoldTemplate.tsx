import React from 'react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'
import { TopAnnouncementBar } from '../sections/TopAnnouncementBar'
import { SiteBannersCarousel } from '../sections/SiteBannersCarousel'
import { HeroSection } from '../sections/HeroSection'
import { GoldenTrustStrip } from '../sections/GoldenTrustStrip'
import { VipAmenitiesSection } from '../sections/VipAmenitiesSection'
import { AboutSection } from '../sections/AboutSection'
import { PromotionsSection } from '../sections/PromotionsSection'
import { ServiceMenuSection } from '../sections/ServiceMenuSection'
import { StaffSection } from '../sections/StaffSection'
import { ReviewsSection } from '../sections/ReviewsSection'
import { HoursSection } from '../sections/HoursSection'
import { FooterSection } from '../sections/FooterSection'
import { MobileStickyBookingBar } from '../sections/MobileStickyBookingBar'

interface TemplateProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  onSelectService?: (serviceName: string) => void
  onSelectStaff?: (staffName: string) => void
  children?: React.ReactNode
  isMobileView?: boolean
}

export const BoldTemplate: React.FC<TemplateProps> = ({
  site,
  palette,
  onBookClick,
  onSelectService,
  onSelectStaff,
  children,
  isMobileView
}) => {
  // Bold Vibrant is a signature High-Contrast Dark Neon Bento Grid experience
  // Guarantee high-contrast dark surfaces, neon accent glow, and pure white text
  const boldPalette: SitePalette = {
    ...palette,
    bgPrimary: '#080D1A',
    bgSurface: '#0F172A',
    textPrimary: '#FFFFFF',
    textSecondary: '#94A3B8',
    heroTextPrimary: '#FFFFFF',
    heroTextSecondary: '#94A3B8',
    borderPrimary: `${palette.accentColor}40`,
    heroGradient: `linear-gradient(135deg, #080D1A 0%, ${palette.accentColor}30 50%, #080D1A 100%)`,
    badgeBg: `${palette.accentColor}25`,
    badgeText: palette.accentColor,
    buttonText: '#FFFFFF'
  }

  return (
    <div className="min-h-screen font-sans relative pb-16 sm:pb-0" style={{ backgroundColor: boldPalette.bgPrimary, color: boldPalette.textPrimary }}>
      <TopAnnouncementBar site={site} palette={boldPalette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <SiteBannersCarousel site={site} palette={boldPalette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <HeroSection site={site} palette={boldPalette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <GoldenTrustStrip palette={boldPalette} isMobileView={isMobileView} />
      <PromotionsSection site={site} palette={boldPalette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <ServiceMenuSection site={site} palette={boldPalette} onSelectService={onSelectService} onBookClick={onBookClick} isMobileView={isMobileView} />
      <VipAmenitiesSection palette={boldPalette} isMobileView={isMobileView} />
      <AboutSection site={site} palette={boldPalette} isMobileView={isMobileView} />
      {children}
      <StaffSection site={site} palette={boldPalette} onSelectStaff={onSelectStaff} isMobileView={isMobileView} />
      <ReviewsSection site={site} palette={boldPalette} isMobileView={isMobileView} />
      <HoursSection site={site} palette={boldPalette} isMobileView={isMobileView} />
      <FooterSection site={site} palette={boldPalette} isMobileView={isMobileView} />
      {isMobileView && <MobileStickyBookingBar site={site} palette={boldPalette} onBookClick={onBookClick} />}
    </div>
  )
}
