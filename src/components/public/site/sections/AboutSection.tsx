import React from 'react'
import { ShieldCheck, Award, RefreshCw, Sparkles, CheckCircle2, Quote } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface AboutSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

export const AboutSection: React.FC<AboutSectionProps> = ({ site, palette, isMobileView }) => {
  const content = site.content
  const highlights = content.highlights || []
  const templateId = site.templateId || MerchantSiteTemplateId.Classic
  const ICONS = [ShieldCheck, Award, RefreshCw]

  // 1. MINIMALIST CLEAN (Zen Linear Text Flow)
  if (templateId === MerchantSiteTemplateId.Minimal) {
    return (
      <section
        id="about"
        className={`transition-colors border-b ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
        style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary, color: palette.textPrimary }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: palette.accentColor }}>
              TRIẾT LÝ & KHÔNG GIAN
            </span>
            <h2 className={`font-bold ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
              Về Chúng Tôi
            </h2>
            <div className="w-12 h-0.5 mx-auto rounded-full" style={{ backgroundColor: palette.accentColor }} />
            <p
              className={`leading-relaxed max-w-2xl mx-auto pt-2 ${isMobileView ? 'text-xs' : 'text-sm sm:text-base'}`}
              style={{ color: palette.textSecondary }}
            >
              {content.aboutVi || content.aboutEn || 'Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao với sản phẩm lành tính organic và đội ngũ thợ lành nghề.'}
            </p>
          </div>

          {highlights.length > 0 && (
            <div className={`grid gap-4 pt-4 border-t ${isMobileView ? 'grid-cols-1' : 'grid-cols-3'}`} style={{ borderColor: palette.borderPrimary }}>
              {highlights.map((item, idx) => (
                <div key={item.id || idx} className="flex items-start gap-3 p-3">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: palette.accentColor }} />
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm mb-1">{item.titleVi || item.titleEn}</h3>
                    <p className="text-[11px] leading-relaxed" style={{ color: palette.textSecondary }}>
                      {item.descriptionVi || item.descriptionEn}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    )
  }

  // 2. MODERN CHIC (Editorial Story & Pill Cards)
  if (templateId === MerchantSiteTemplateId.Modern) {
    return (
      <section
        id="about"
        className={`transition-colors ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
        style={{ backgroundColor: palette.bgSurface, color: palette.textPrimary }}
      >
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="p-6 sm:p-10 rounded-3xl border shadow-sm relative overflow-hidden"
            style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
          >
            <Quote className="w-12 h-12 absolute -top-2 -left-2 opacity-10" style={{ color: palette.accentColor }} />
            <div className="max-w-3xl mx-auto text-center space-y-3">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-bold"
                style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
              >
                OUR STORY & PHILOSOPHY
              </span>
              <h2 className={`font-black ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
                Câu Chuyện Thương Hiệu
              </h2>
              <p className={`leading-relaxed italic font-serif ${isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'}`} style={{ color: palette.textSecondary }}>
                "{content.aboutVi || content.aboutEn || 'Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao với sản phẩm lành tính organic và đội ngũ thợ lành nghề.'}"
              </p>
            </div>
          </div>

          {highlights.length > 0 && (
            <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-3'}`}>
              {highlights.map((item, idx) => {
                const IconComponent = ICONS[idx % ICONS.length]
                return (
                  <div
                    key={item.id || idx}
                    className="p-5 rounded-2xl border flex items-center gap-4 transition-all hover:scale-[1.02] shadow-xs"
                    style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
                  >
                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-sm"
                      style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
                    >
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xs sm:text-sm truncate">{item.titleVi || item.titleEn}</h3>
                      <p className="text-[11px] line-clamp-2 mt-0.5" style={{ color: palette.textSecondary }}>
                        {item.descriptionVi || item.descriptionEn}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    )
  }

  // 3. BOLD VIBRANT (Asymmetric Bento Highlight Grid)
  if (templateId === MerchantSiteTemplateId.Bold) {
    return (
      <section
        id="about"
        className={`transition-colors ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
        style={{ backgroundColor: palette.bgSurface, color: palette.textPrimary }}
      >
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-black uppercase tracking-wider block mb-1" style={{ color: palette.accentColor }}>
                // SIGNATURE EXPERIENCE
              </span>
              <h2 className={`font-black uppercase tracking-tight ${isMobileView ? 'text-2xl' : 'text-3xl sm:text-4xl'}`}>
                Tại Sao Chọn Chúng Tôi?
              </h2>
            </div>
            <p className="text-xs sm:text-sm max-w-md" style={{ color: palette.textSecondary }}>
              {content.aboutVi || content.aboutEn || 'Dịch vụ chăm sóc móng chuẩn 5 sao cùng kỹ thuật viên tay nghề cao.'}
            </p>
          </div>

          {highlights.length > 0 && (
            <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-12'}`}>
              {highlights.map((item, idx) => {
                const IconComponent = ICONS[idx % ICONS.length]
                const isWide = idx === 0 && !isMobileView
                return (
                  <div
                    key={item.id || idx}
                    className={`rounded-3xl border-2 p-6 transition-all hover:shadow-xl flex flex-col justify-between ${
                      isWide ? 'md:col-span-6' : 'md:col-span-3'
                    }`}
                    style={{
                      backgroundColor: isWide ? '#0F172A' : '#1E293B',
                      borderColor: palette.borderPrimary,
                      color: '#FFFFFF'
                    }}
                  >
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4 shadow"
                      style={{ backgroundColor: palette.accentColor, color: palette.buttonText }}
                    >
                      <IconComponent className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-black text-base sm:text-lg mb-1.5 text-white">{item.titleVi || item.titleEn}</h3>
                      <p className="text-xs leading-relaxed opacity-85 text-slate-400">
                        {item.descriptionVi || item.descriptionEn}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    )
  }

  // 4. CLASSIC LUXE (Symmetric Cards - Default)
  return (
    <section
      id="about"
      className={`transition-colors ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgSurface, color: palette.textPrimary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center max-w-3xl mx-auto ${isMobileView ? 'mb-6' : 'mb-12'}`}>
          <div
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider mb-3 shadow-xs"
            style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>TRIẾT LÝ & ĐẲNG CẤP DỊCH VỤ</span>
          </div>
          <h2 className={`font-black mb-3 ${isMobileView ? 'text-xl' : 'text-3xl sm:text-4xl'}`}>
            Về Chúng Tôi
          </h2>
          <p
            className={`leading-relaxed ${isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'}`}
            style={{ color: palette.textSecondary }}
          >
            {content.aboutVi || content.aboutEn || 'Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao với sản phẩm lành tính organic và đội ngũ thợ lành nghề.'}
          </p>
        </div>

        {highlights.length > 0 && (
          <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3 md:gap-6'}`}>
            {highlights.map((item, idx) => {
              const IconComponent = ICONS[idx % ICONS.length]
              return (
                <div
                  key={item.id || idx}
                  className={`rounded-2xl border transition-shadow hover:shadow-md ${isMobileView ? 'p-4' : 'p-6'}`}
                  style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
                >
                  <div
                    className={`rounded-xl flex items-center justify-center ${
                      isMobileView ? 'w-9 h-9 mb-3' : 'w-12 h-12 mb-4'
                    }`}
                    style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
                  >
                    <IconComponent className={isMobileView ? 'w-4 h-4' : 'w-6 h-6'} />
                  </div>
                  <h3 className={`font-bold mb-1.5 ${isMobileView ? 'text-sm' : 'text-base'}`}>
                    {item.titleVi || item.titleEn}
                  </h3>
                  <p className="text-xs leading-relaxed" style={{ color: palette.textSecondary }}>
                    {item.descriptionVi || item.descriptionEn}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

