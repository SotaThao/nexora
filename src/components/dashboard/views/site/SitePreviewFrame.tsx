import React, { useState } from 'react'
import { Monitor, Smartphone, ExternalLink, RefreshCw } from 'lucide-react'
import { MerchantSiteDto, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { buildPublicBookingFormUrl } from '../../../../utils/publicBookingUrl'
import { SiteRenderer } from '../../../public/site/SiteRenderer'

interface SitePreviewFrameProps {
  site: MerchantSiteDto
  businessName?: string
  businessSlug?: string
  phone?: string
  address?: string
  ratingSummary?: PublicSiteDto['ratingSummary']
  services?: PublicSiteDto['services']
  staffList?: PublicSiteDto['staffList']
  businessHours?: PublicSiteDto['businessHours']
  reviews?: PublicSiteDto['reviews']
}

export const SitePreviewFrame: React.FC<SitePreviewFrameProps> = ({
  site,
  businessName,
  businessSlug,
  phone,
  address,
  ratingSummary,
  services,
  staffList,
  businessHours,
  reviews,
}) => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop')

  const effectiveSlug = businessSlug || site.businessId || ''
  const publicBookingUrl = buildPublicBookingFormUrl(effectiveSlug)

  const publicSiteData: PublicSiteDto = {
    businessSlug: effectiveSlug,
    businessName: businessName || '',
    phone: phone || undefined,
    address: address || undefined,
    templateId: site.templateId,
    paletteId: site.paletteId,
    customColor: site.customColor,
    status: site.status,
    publishedAt: site.publishedAt,
    content: site.content,
    ratingSummary: ratingSummary || undefined,
    services: services || undefined,
    staffList: staffList || undefined,
    businessHours: businessHours || undefined,
    reviews: reviews || undefined,
  }

  return (
    <div className="space-y-4">
      {/* Device Toolbar */}
      <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDeviceMode('desktop')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              deviceMode === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>Desktop (1440px)</span>
          </button>
          <button
            type="button"
            onClick={() => setDeviceMode('mobile')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              deviceMode === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>Mobile (375px)</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
          <span>{publicBookingUrl}</span>
        </div>
      </div>

      {/* Frame Container */}
      <div className="w-full min-h-[600px] max-h-[750px] overflow-y-auto rounded-2xl border-2 border-slate-300 bg-slate-100 p-4 flex justify-center shadow-inner">
        <div
          className={`transition-all duration-300 rounded-xl shadow-2xl overflow-y-auto ${
            deviceMode === 'mobile' ? 'w-[375px] min-h-[667px]' : 'w-full'
          }`}
        >
          <SiteRenderer site={publicSiteData} />
        </div>
      </div>
    </div>
  )
}
