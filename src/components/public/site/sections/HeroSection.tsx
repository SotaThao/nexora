import React from 'react'
import { Calendar, Phone, MapPin, Sparkles, Star, ChevronRight, ShieldCheck, Award, Clock } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'
import { AcceptedPaymentsStrip } from './AcceptedPaymentsStrip'

interface HeroSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  onBookClick?: () => void
  isMobileView?: boolean
}

export const HeroSection: React.FC<HeroSectionProps> = ({ site, palette, onBookClick, isMobileView }) => {
  const content = site.content
  const templateId = site.templateId || MerchantSiteTemplateId.Classic
  const ratingSummary = site.ratingSummary || { averageRating: 4.9, totalReviews: 128 }

  const defaultHeroImage = 'https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1200&auto=format&fit=crop&q=80'

  // 1. MINIMALIST CLEAN (Zen Atmosphere & 2-Column Responsive Layout)
  if (templateId === MerchantSiteTemplateId.Minimal) {
    return (
      <section
        id="hero"
        className={`relative overflow-hidden transition-colors border-b scroll-mt-16 sm:scroll-mt-20 ${
          isMobileView ? 'py-8' : 'py-12 md:py-20'
        }`}
        style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary, color: palette.textPrimary }}
      >
        {/* Zen Ambient Lighting */}
        <div
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-15 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />

        <div
          className={`max-w-6xl mx-auto flex items-center px-4 sm:px-6 lg:px-8 relative z-10 ${
            isMobileView
              ? 'flex-col gap-8 text-center'
              : 'flex-col md:flex-row md:text-left text-center gap-10 lg:gap-14'
          }`}
        >
          {/* Left Column: Salon Presentation (55%) */}
          <div className="flex-1 w-full space-y-5">
            {/* Zen Capsule Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold tracking-widest uppercase border shadow-xs"
              style={{ backgroundColor: palette.bgSurface, borderColor: palette.borderPrimary, color: palette.accentColor }}
            >
              <Sparkles className="w-3 h-3" />
              <span>ZEN BEAUTY & ORGANIC NAIL CARE</span>
            </div>

            {/* Headline */}
            <h1
              className={`font-black tracking-tight leading-tight ${
                isMobileView ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
              }`}
              style={{ color: palette.textPrimary }}
            >
              {site.businessName || 'Nexora Clean Studio'}
            </h1>

            {/* Tagline */}
            <p
              className={`font-normal leading-relaxed max-w-xl mx-auto md:mx-0 ${
                isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'
              }`}
              style={{ color: palette.textSecondary }}
            >
              {content.taglineEn || content.taglineVi || 'Minimalist beauty haven, vegan non-toxic nail care, and exquisite bespoke artistry.'}
            </p>

            {/* 3-Pill Trust Guarantee (Apple HIG Responsive Grid) */}
            <div
              className={`pt-1 text-xs ${
                isMobileView
                  ? 'grid grid-cols-3 gap-1.5 w-full text-center'
                  : 'flex items-center gap-3 flex-wrap justify-start'
              }`}
              style={{ color: palette.textSecondary }}
            >
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-black/5 border border-black/10' : ''}`}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">100% Medical Grade</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-black/5 border border-black/10' : ''}`}>
                <Award className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">Master Artists</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-black/5 border border-black/10' : ''}`}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">Instant Booking</span>
              </div>
            </div>

            {/* CTA Buttons (Apple HIG min 48px touch target) */}
            <div className={`flex items-center gap-3 pt-1 ${isMobileView ? 'flex-col w-full' : 'flex-wrap justify-start'}`}>
              <button
                type="button"
                onClick={onBookClick}
                className={`rounded-full font-bold shadow-lg hover:shadow-xl transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-2 min-h-[48px] ${
                  isMobileView ? 'w-full py-3.5 text-sm' : 'px-8 py-3.5 text-sm'
                }`}
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText,
                  boxShadow: `0 12px 24px -6px ${palette.accentColor}40`
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Online</span>
              </button>

              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className={`rounded-full font-semibold border-2 transition-all hover:bg-slate-50 flex items-center justify-center gap-2 min-h-[48px] ${
                    isMobileView ? 'w-full py-3 text-xs' : 'px-6 py-3.5 text-sm'
                  }`}
                  style={{ borderColor: palette.borderPrimary, color: palette.textPrimary, backgroundColor: palette.bgSurface }}
                >
                  <Phone className="w-4 h-4" />
                  <span>{site.phone}</span>
                </a>
              )}
            </div>

            <AcceptedPaymentsStrip palette={palette} isMobileView={isMobileView} />

            {site.address && (
              <div className={`flex items-center gap-1.5 text-xs pt-1 opacity-80 ${isMobileView ? 'justify-center' : 'justify-start'}`} style={{ color: palette.textSecondary }}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                <span>{site.address}</span>
              </div>
            )}
          </div>

          {/* Right Column: Zen Showcase Photo Frame (45%) */}
          <div className={`w-full ${isMobileView ? 'max-w-sm mx-auto' : 'md:w-1/2 max-w-lg'}`}>
            <div className="relative">
              <div
                className="p-2 sm:p-3 rounded-[2.5rem] bg-white/60 backdrop-blur-xl border shadow-2xl overflow-hidden group"
                style={{ borderColor: palette.borderPrimary }}
              >
                <div className="rounded-[2rem] overflow-hidden w-full aspect-video bg-slate-900 relative">
                  <img
                    src={content.heroImageUrl || defaultHeroImage}
                    alt={site.businessName}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating Rating Pill */}
              <div className="absolute -top-3 -right-3 px-3.5 py-1.5 rounded-full bg-white shadow-xl border border-slate-100 flex items-center gap-2 z-20">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-bold text-slate-800">{ratingSummary.averageRating} / 5.0</span>
                <span className="text-[10px] text-slate-400">({ratingSummary.totalReviews}+ Reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 2. MODERN CHIC (Parisian Editorial Magazine & 2-Column Responsive Layout)
  if (templateId === MerchantSiteTemplateId.Modern) {
    return (
      <section
        id="hero"
        className={`relative overflow-hidden transition-colors scroll-mt-16 sm:scroll-mt-20 ${
          isMobileView ? 'py-8' : 'py-12 md:py-20'
        }`}
        style={{ background: palette.heroGradient, color: palette.heroTextPrimary }}
      >
        {/* Soft Rose/Pastel Ambient Light Orbs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full blur-3xl opacity-30 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />

        <div
          className={`max-w-6xl mx-auto flex items-center px-4 sm:px-6 lg:px-8 relative z-10 ${
            isMobileView
              ? 'flex-col gap-8 text-center'
              : 'flex-col md:flex-row md:text-left text-center gap-10 lg:gap-14'
          }`}
        >
          {/* Left Column: Salon Presentation (55%) */}
          <div className="flex-1 w-full space-y-5">
            {/* Fashion Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md"
              style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AESTHETICS & MODERN NAIL COUTURE</span>
            </div>

            {/* Editorial Headline */}
            <h1
              className={`font-black tracking-tight leading-tight ${
                isMobileView ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
              }`}
              style={{ color: palette.heroTextPrimary }}
            >
              {site.businessName || 'Nexora Modern Chic'}
            </h1>

            {/* Subtitle */}
            <p
              className={`font-normal leading-relaxed max-w-xl mx-auto md:mx-0 ${
                isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'
              }`}
              style={{ color: palette.heroTextSecondary }}
            >
              {content.taglineEn || content.taglineVi || 'Chic editorial nail trends, bespoke nail art, and modern wellness experiences.'}
            </p>

            {/* 3-Pill Trust Guarantee (Apple HIG Responsive Grid) */}
            <div
              className={`pt-1 text-xs ${
                isMobileView
                  ? 'grid grid-cols-3 gap-1.5 w-full text-center'
                  : 'flex items-center gap-3 flex-wrap justify-start'
              }`}
              style={{ color: palette.heroTextSecondary }}
            >
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-slate-900/5 border border-slate-900/10' : ''}`}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">100% Medical Grade</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-slate-900/5 border border-slate-900/10' : ''}`}>
                <Award className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">Master Artists</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-slate-900/5 border border-slate-900/10' : ''}`}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px]">Instant Booking</span>
              </div>
            </div>

            {/* Action Bar (Apple HIG min 48px touch target) */}
            <div className={`flex items-center gap-3 pt-1 ${isMobileView ? 'flex-col w-full' : 'flex-wrap justify-start'}`}>
              <button
                onClick={onBookClick}
                type="button"
                className={`rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-2 min-h-[48px] ${
                  isMobileView ? 'w-full py-3.5 text-sm' : 'px-8 py-3.5 text-base'
                }`}
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText,
                  boxShadow: `0 15px 30px -8px ${palette.accentColor}50`
                }}
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Online</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className={`rounded-2xl font-semibold border-2 backdrop-blur-md transition-all hover:bg-white/40 flex items-center justify-center gap-2 min-h-[48px] ${
                    isMobileView ? 'w-full py-3 text-xs' : 'px-6 py-3.5 text-sm'
                  }`}
                  style={{
                    borderColor: palette.borderPrimary,
                    color: palette.heroTextPrimary,
                    backgroundColor: 'rgba(255, 255, 255, 0.4)'
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>{site.phone}</span>
                </a>
              )}
            </div>

            <AcceptedPaymentsStrip palette={palette} isMobileView={isMobileView} />

            {site.address && (
              <div className={`flex items-center gap-2 text-xs opacity-90 pt-1 ${isMobileView ? 'justify-center' : 'justify-start'}`} style={{ color: palette.heroTextSecondary }}>
                <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                <span>{site.address}</span>
              </div>
            )}
          </div>

          {/* Right Column: Modern Chic Showcase Photo Frame (45%) */}
          <div className={`w-full ${isMobileView ? 'max-w-sm mx-auto' : 'md:w-1/2 max-w-lg'}`}>
            <div className="relative">
              <div
                className="p-2 sm:p-3 rounded-[2.5rem] bg-white/40 backdrop-blur-xl border shadow-2xl overflow-hidden group"
                style={{ borderColor: 'rgba(255, 255, 255, 0.6)' }}
              >
                <div className="rounded-[2rem] overflow-hidden w-full aspect-video bg-slate-900 relative">
                  <img
                    src={content.heroImageUrl || defaultHeroImage}
                    alt={site.businessName}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating Fashion Pill */}
              <div className="absolute -top-3 -right-3 px-3.5 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl border border-white/80 flex items-center gap-2 z-20">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <div className="text-left">
                  <div className="text-xs font-bold text-slate-800">5.0 Excellent</div>
                  <div className="text-[10px] text-slate-500">Clover POS Verified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 3. BOLD VIBRANT (Dark Neon Cyber Bento Grid & 2-Column Responsive Layout)
  if (templateId === MerchantSiteTemplateId.Bold) {
    return (
      <section
        id="hero"
        className={`relative overflow-hidden transition-colors scroll-mt-16 sm:scroll-mt-20 ${
          isMobileView ? 'py-8' : 'py-12 md:py-20'
        }`}
        style={{ background: palette.heroGradient, color: palette.heroTextPrimary }}
      >
        {/* Ambient Neon Glow Spheres */}
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full blur-[100px] opacity-40 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full blur-[100px] opacity-30 pointer-events-none"
          style={{ backgroundColor: palette.accentColor }}
        />

        <div
          className={`max-w-6xl mx-auto flex items-center px-4 sm:px-6 lg:px-8 relative z-10 ${
            isMobileView
              ? 'flex-col gap-8 text-center'
              : 'flex-col md:flex-row md:text-left text-center gap-10 lg:gap-14'
          }`}
        >
          {/* Left Column: Salon Presentation (55%) */}
          <div className="flex-1 w-full space-y-5">
            {/* Cyber Neon Badge */}
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black tracking-wider uppercase shadow-xl border"
              style={{
                backgroundColor: `${palette.accentColor}25`,
                borderColor: `${palette.accentColor}70`,
                color: palette.accentColor
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>BOLD ART & NEON STUDIO</span>
            </div>

            {/* High-Impact Headline */}
            <h1
              className={`font-black tracking-tighter uppercase leading-tight ${
                isMobileView ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
              }`}
              style={{ color: palette.heroTextPrimary }}
            >
              {site.businessName || 'Nexora Bold'}
            </h1>

            {/* Tagline */}
            <p
              className={`font-medium leading-relaxed max-w-xl mx-auto md:mx-0 ${
                isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'
              }`}
              style={{ color: palette.heroTextSecondary }}
            >
              {content.taglineEn || content.taglineVi || 'High-energy VIP nail lounge with handcrafted cocktails, custom nail designs, and crypto payments.'}
            </p>

            {/* 3-Pill Trust Guarantee (Apple HIG Responsive Grid) */}
            <div
              className={`pt-1 text-xs ${
                isMobileView
                  ? 'grid grid-cols-3 gap-1.5 w-full text-center'
                  : 'flex items-center gap-3 flex-wrap justify-start'
              }`}
              style={{ color: palette.heroTextSecondary }}
            >
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
                <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px] text-white">100% Medical Grade</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
                <Award className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px] text-white">Master Artists</span>
              </div>
              {!isMobileView && <span className="opacity-40">•</span>}
              <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
                <Clock className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span className="font-semibold text-[11px] text-white">Instant Booking</span>
              </div>
            </div>

            {/* High-Contrast CTAs (Apple HIG min 48px touch target) */}
            <div className={`flex items-center gap-3 pt-1 ${isMobileView ? 'flex-col w-full' : 'flex-wrap justify-start'}`}>
              <button
                onClick={onBookClick}
                type="button"
                className={`rounded-2xl font-black uppercase tracking-wider shadow-2xl transition-all hover:scale-102 active:scale-95 flex items-center justify-center gap-2 min-h-[48px] ${
                  isMobileView ? 'w-full py-3.5 text-sm' : 'px-8 py-3.5 text-base'
                }`}
                style={{
                  backgroundColor: palette.accentColor,
                  color: palette.buttonText,
                  boxShadow: `0 0 30px ${palette.accentColor}80`
                }}
              >
                <Calendar className="w-5 h-5" />
                <span>Book Appointment Online</span>
              </button>

              {site.phone && (
                <a
                  href={`tel:${site.phone}`}
                  className={`rounded-2xl font-bold border-2 backdrop-blur-md transition-colors flex items-center justify-center gap-2 min-h-[48px] ${
                    isMobileView ? 'w-full py-3 text-xs' : 'px-6 py-3.5 text-sm'
                  }`}
                  style={{
                    borderColor: palette.accentColor,
                    color: palette.heroTextPrimary,
                    backgroundColor: 'rgba(0,0,0,0.5)'
                  }}
                >
                  <Phone className="w-4 h-4" />
                  <span>{site.phone}</span>
                </a>
              )}
            </div>

            <AcceptedPaymentsStrip palette={palette} isMobileView={isMobileView} />

            {site.address && (
              <div className={`flex items-center gap-2 text-xs font-semibold pt-1 ${isMobileView ? 'justify-center' : 'justify-start'}`} style={{ color: palette.heroTextSecondary }}>
                <MapPin className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
                <span>{site.address}</span>
              </div>
            )}
          </div>

          {/* Right Column: Cyber Bento Showcase Frame (45%) */}
          <div className={`w-full ${isMobileView ? 'max-w-sm mx-auto' : 'md:w-1/2 max-w-lg'}`}>
            <div className="relative">
              <div
                className="relative rounded-3xl overflow-hidden border-2 shadow-2xl bg-slate-900 group"
                style={{
                  borderColor: palette.accentColor,
                  boxShadow: `0 0 35px ${palette.accentColor}40`
                }}
              >
                <div className="w-full aspect-video relative overflow-hidden bg-slate-950">
                  <img
                    src={content.heroImageUrl || defaultHeroImage}
                    alt={site.businessName}
                    className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Floating Top Rating Pill */}
              <div className="absolute -top-3 -right-3 px-3.5 py-1.5 rounded-xl bg-black/90 backdrop-blur-md border border-amber-400/80 flex items-center gap-2 shadow-xl z-20">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-xs font-black text-white">5.0 / 5.0 (Clover POS)</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  // 4. CLASSIC LUXE (Imperial Split 50/50 Layout with Glassmorphism Showcase & Royal Serif Font)
  return (
    <section
      id="hero"
      className={`relative overflow-hidden transition-colors scroll-mt-16 sm:scroll-mt-20 ${
        isMobileView ? 'py-8' : 'py-12 md:py-20'
      }`}
      style={{ background: palette.heroGradient, color: palette.heroTextPrimary }}
    >
      {/* Royal Ambient Glows */}
      <div
        className="absolute -top-32 -left-32 w-[450px] h-[450px] rounded-full blur-3xl opacity-25 pointer-events-none"
        style={{ backgroundColor: palette.accentColor }}
      />
      <div
        className="absolute -bottom-32 -right-32 w-[450px] h-[450px] rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{ backgroundColor: palette.accentColor }}
      />

      <div
        className={`max-w-6xl mx-auto flex items-center px-4 sm:px-6 lg:px-8 relative z-10 ${
          isMobileView
            ? 'flex-col gap-8 text-center'
            : 'flex-col md:flex-row md:text-left text-center gap-10 lg:gap-14'
        }`}
      >
        {/* Left Column: Salon Presentation (55%) */}
        <div className="flex-1 w-full space-y-5">
          {/* Trust Guarantee Pill */}
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold shadow-md backdrop-blur-md border"
            style={{
              backgroundColor: palette.badgeBg,
              borderColor: palette.borderPrimary,
              color: palette.badgeText
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>✨ LUXURY NAIL BAR & SPA LOUNGE</span>
          </div>

          {/* Salon Main Title with Editorial Serif Font */}
          <h1
            className={`font-serif font-black tracking-tight leading-tight ${
              isMobileView ? 'text-3xl' : 'text-4xl sm:text-5xl md:text-6xl'
            }`}
            style={{ color: palette.heroTextPrimary }}
          >
            {site.businessName || 'Nexora Luxury Salon'}
          </h1>

          {/* Tagline */}
          <p
            className={`font-normal leading-relaxed max-w-xl mx-auto md:mx-0 ${
              isMobileView ? 'text-xs' : 'text-sm sm:text-base md:text-lg'
            }`}
            style={{ color: palette.heroTextSecondary }}
          >
            {content.taglineEn || content.taglineVi || 'The pinnacle of luxury nail artistry, master craftsmanship, and organic botanical care.'}
          </p>

          {/* 3-Pill Trust Guarantee Bar (Apple HIG Responsive Grid) */}
          <div
            className={`pt-1 text-xs ${
              isMobileView
                ? 'grid grid-cols-3 gap-1.5 w-full text-center'
                : 'flex items-center gap-3 flex-wrap justify-start'
            }`}
            style={{ color: palette.heroTextSecondary }}
          >
            <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
              <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
              <span className="font-semibold text-[11px]">100% Medical Grade</span>
            </div>
            {!isMobileView && <span className="opacity-40">•</span>}
            <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
              <Award className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
              <span className="font-semibold text-[11px]">Master Artists</span>
            </div>
            {!isMobileView && <span className="opacity-40">•</span>}
            <div className={`flex items-center gap-1.5 ${isMobileView ? 'flex-col justify-center p-2 rounded-xl bg-white/5 border border-white/10' : ''}`}>
              <Clock className="w-4 h-4 shrink-0" style={{ color: palette.accentColor }} />
              <span className="font-semibold text-[11px]">Instant Booking</span>
            </div>
          </div>

          {/* Action CTAs (Apple HIG min 48px touch target) */}
          <div
            className={`flex items-center gap-3 pt-1 ${
              isMobileView
                ? 'flex-col w-full'
                : 'flex-wrap justify-start'
            }`}
          >
            <button
              onClick={onBookClick}
              type="button"
              className={`inline-flex items-center justify-center gap-2.5 rounded-2xl font-bold shadow-xl hover:shadow-2xl transition-all hover:scale-102 active:scale-95 min-h-[48px] ${
                isMobileView ? 'w-full py-3.5 text-sm' : 'px-8 py-3.5 text-base'
              }`}
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText,
                boxShadow: `0 15px 30px -8px ${palette.accentColor}50`
              }}
            >
              <Calendar className="w-4 h-4" />
              <span>Book Appointment Online</span>
            </button>

            {site.phone && (
              <a
                href={`tel:${site.phone}`}
                className={`inline-flex items-center justify-center gap-2 rounded-2xl font-semibold border-2 backdrop-blur-md transition-all hover:bg-white/20 min-h-[48px] ${
                  isMobileView ? 'w-full py-3 text-xs' : 'px-6 py-3.5 text-sm'
                }`}
                style={{
                  borderColor: palette.borderPrimary,
                  color: palette.heroTextPrimary,
                  backgroundColor: 'rgba(255, 255, 255, 0.15)'
                }}
              >
                <Phone className="w-4 h-4" />
                <span>{site.phone}</span>
              </a>
            )}
          </div>

          {/* Accepted Payments Strip */}
          <AcceptedPaymentsStrip palette={palette} isMobileView={isMobileView} />

          {site.address && (
            <div
              className={`flex items-center gap-2 text-xs opacity-90 pt-1 ${
                isMobileView ? 'justify-center' : 'justify-start'
              }`}
              style={{ color: palette.heroTextSecondary }}
            >
              <MapPin className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
              <span>{site.address}</span>
            </div>
          )}
        </div>

        {/* Right Column: Layered Artistic Showcase Frame (45%) */}
        <div className={`w-full ${isMobileView ? 'max-w-sm mx-auto' : 'md:w-1/2 max-w-lg'}`}>
          <div className="relative">
            <div
              className="p-2 sm:p-3 rounded-[2.5rem] bg-white/30 backdrop-blur-xl border shadow-2xl relative overflow-hidden group"
              style={{
                borderColor: palette.borderPrimary,
                boxShadow: `0 25px 50px -12px ${palette.accentColor}30`
              }}
            >
              <div className="rounded-[2rem] overflow-hidden w-full aspect-video bg-slate-950 relative">
                <img
                  src={content.heroImageUrl || defaultHeroImage}
                  alt={site.businessName}
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Floating Top Rating Card */}
            <div
              className="absolute -top-3 -right-3 px-3.5 py-1.5 rounded-2xl bg-white/90 backdrop-blur-md shadow-xl border border-white/80 flex items-center gap-2 z-20"
            >
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <div className="text-left">
                <span className="text-xs font-black text-slate-800">{ratingSummary.averageRating} / 5.0</span>
                <span className="text-[10px] text-slate-500 block leading-tight">({ratingSummary.totalReviews}+ Reviews)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
