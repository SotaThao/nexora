// SiteRenderer — Dynamic template selector for Merchant Site — US-107
import React from 'react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../constants/merchantSiteStatus'
import { getSitePalette } from './palettes'
import { ClassicTemplate } from './templates/ClassicTemplate'
import { ModernTemplate } from './templates/ModernTemplate'
import { BoldTemplate } from './templates/BoldTemplate'
import { MinimalTemplate } from './templates/MinimalTemplate'

export interface SiteRendererProps {
  site: PublicSiteDto
  onBookClick?: () => void
  onSelectService?: (serviceName: string) => void
  onSelectStaff?: (staffName: string) => void
  children?: React.ReactNode
  isMobileView?: boolean
}

export const SiteRenderer: React.FC<SiteRendererProps> = ({
  site,
  onBookClick,
  onSelectService,
  onSelectStaff,
  children,
  isMobileView
}) => {
  const palette = getSitePalette(site.paletteId, site.customColor)

  switch (site.templateId) {
    case MerchantSiteTemplateId.Minimal:
      return (
        <MinimalTemplate
          site={site}
          palette={palette}
          onBookClick={onBookClick}
          onSelectService={onSelectService}
          onSelectStaff={onSelectStaff}
          isMobileView={isMobileView}
        >
          {children}
        </MinimalTemplate>
      )
    case MerchantSiteTemplateId.Modern:
      return (
        <ModernTemplate
          site={site}
          palette={palette}
          onBookClick={onBookClick}
          onSelectService={onSelectService}
          onSelectStaff={onSelectStaff}
          isMobileView={isMobileView}
        >
          {children}
        </ModernTemplate>
      )
    case MerchantSiteTemplateId.Bold:
      return (
        <BoldTemplate
          site={site}
          palette={palette}
          onBookClick={onBookClick}
          onSelectService={onSelectService}
          onSelectStaff={onSelectStaff}
          isMobileView={isMobileView}
        >
          {children}
        </BoldTemplate>
      )
    case MerchantSiteTemplateId.Classic:
    default:
      return (
        <ClassicTemplate
          site={site}
          palette={palette}
          onBookClick={onBookClick}
          onSelectService={onSelectService}
          onSelectStaff={onSelectStaff}
          isMobileView={isMobileView}
        >
          {children}
        </ClassicTemplate>
      )
  }
}
