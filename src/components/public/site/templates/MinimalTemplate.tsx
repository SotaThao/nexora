// MinimalTemplate.tsx — Clean, Minimalist & Modern Theme for Merchant Site (US-107)
import React from 'react'
import { PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'
import { TopAnnouncementBar } from '../sections/TopAnnouncementBar'
import { SiteNavbarHeader } from '../sections/SiteNavbarHeader'
import { SiteBannersCarousel } from '../sections/SiteBannersCarousel'
import { HeroSection } from '../sections/HeroSection'
import { GoldenTrustStrip } from '../sections/GoldenTrustStrip'
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

export const MinimalTemplate: React.FC<TemplateProps> = ({
  site,
  palette,
  onBookClick,
  onSelectService,
  onSelectStaff,
  children,
  isMobileView
}) => {
  return (
    <div className="min-h-screen font-sans relative pb-16 sm:pb-0" style={{ backgroundColor: palette.bgPrimary, color: palette.textPrimary }}>
      <TopAnnouncementBar site={site} palette={palette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <SiteNavbarHeader site={site} palette={palette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <SiteBannersCarousel site={site} palette={palette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <HeroSection site={site} palette={palette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <GoldenTrustStrip palette={palette} isMobileView={isMobileView} />
      <AboutSection site={site} palette={palette} isMobileView={isMobileView} />
      <PromotionsSection site={site} palette={palette} onBookClick={onBookClick} isMobileView={isMobileView} />
      <ServiceMenuSection site={site} palette={palette} onSelectService={onSelectService} onBookClick={onBookClick} isMobileView={isMobileView} />
      {children}
      <StaffSection site={site} palette={palette} onSelectStaff={onSelectStaff} isMobileView={isMobileView} />
      <ReviewsSection site={site} palette={palette} isMobileView={isMobileView} />
      <HoursSection site={site} palette={palette} isMobileView={isMobileView} />
      <FooterSection site={site} palette={palette} isMobileView={isMobileView} />
      {isMobileView && <MobileStickyBookingBar site={site} palette={palette} onBookClick={onBookClick} />}
    </div>
  )
}
