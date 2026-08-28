import React from 'react'
import { Sparkles, Clock, CheckCircle } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface ServiceMenuSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  onSelectService?: (serviceName: string) => void
  onBookClick?: () => void
  isMobileView?: boolean
}

const LEGACY_VN_DESCRIPTIONS: Record<string, string> = {
  'Dịch vụ Pedicure cao cấp với tinh chất vàng 24K, massage đá nóng 20p và đắp mặt nạ chân.':
    'Ultra-luxurious pedicure with 24K gold serum, 20-min hot stone massage & botanical foot mask.',
  'Chăm sóc móng chân ngọc trai Paris, tẩy tế bào chết muối biển và massage thảo mộc.':
    'Parisian pearl foot spa, sea salt exfoliation & calming herbal massage.',
  'Ngâm chân sữa tươi & mật ong thiên nhiên, làm mềm gót chân.':
    'Fresh milk & organic honey foot soak, smoothing dry cracked heels.',
  'Cắt da, tạo form móng, chà gót và sơn màu chuẩn salon.':
    'Cuticle grooming, precision nail shaping, heel buffing & salon regular polish.',
  'Chăm sóc móng chân nhanh gọn, cắt da, tạo form và thoa kem dưỡng.':
    'Quick refresh pedicure, cuticle clean, shaping & moisturizing lotion.',
  'Xử lý vết chai sần gót chân bằng serum đặc trị và chà nhám chuyên sâu.':
    'Intensive callus treatment serum with deep heel smoothing therapy.',
  'Tẩy tế bào chết bằng đường nâu hữu cơ và tinh dầu dừa thiên nhiên.':
    'Organic brown sugar scrub exfoliation with natural coconut essential oils.',
  'Gói kết hợp tẩy tế bào chết và ủ sáp dưỡng ẩm làm mềm gót chân.':
    'Exfoliation scrub paired with warm paraffin moisture wax treatment.',
  'Nâng cấp sơn Shellac bền màu bóng đẹp cho dịch vụ Pedicure.':
    'Shellac long-lasting high-gloss upgrade for any pedicure service.',
  'Kỹ thuật nhặt da khô chuẩn Nga, phom móng chuẩn xác.':
    'Dry Russian e-file cuticle detailing with immaculate nail shaping.',
  'Găng tay collagen chống lão hóa, chăm sóc khóe móng và sơn gel cao cấp.':
    'Anti-aging collagen gloves, meticulous cuticle care & luxury gel polish.',
  'Sơn gel giữ màu 3-4 tuần với hơn 500 màu thịnh hành.':
    'Long-lasting gel lacquer staying flawless 3-4 weeks with 500+ trending shades.',
  'Cắt tỉa móng, dưỡng ẩm tinh dầu hoa hồng tự nhiên.':
    'Natural nail trimming, gentle cuticle tidy & organic rose oil hydration.',
  'Đắp móng bột Acrylic hoàn thiện sơn gel cao cấp.':
    'Full set acrylic extensions with durable high-shine gel finish.',
  'Đắp móng bột Acrylic tiêu chuẩn kèm sơn thường.':
    'Standard full set acrylic extensions with classic salon polish.',
  'Châm bột móng nối Acrylic.':
    'Acrylic refill maintenance for outgrowth with reshaping & fresh color.',
  'Nhúng bột hiệu ứng ombre chuyển màu tự nhiên.':
    'Organic dipping powder with soft seamless ombre color transition.',
  'Nhúng bột màu dinh dưỡng hữu cơ không lưu huỳnh.':
    'Nutrient-rich organic dipping powder free of harsh chemicals and odor.',
  'Nối móng gel định hình chuẩn form sang trọng.':
    'Structured builder gel extensions shaped to elegant bespoke forms.',
  'Tráng gel cứng bảo vệ móng tự nhiên không gãy.':
    'Reinforcing BIAB builder gel overlay to shield natural nails from chipping.',
  'Tỉa và wax định hình chân mày.':
    'Precision eyebrow mapping, sculpting & gentle botanical wax.',
  'Wax ria mép nhẹ nhàng.':
    'Gentle and soothing upper lip facial waxing.'
}

function formatServiceDescription(rawDesc?: string | null): string {
  if (!rawDesc) {
    return 'Premium nail care and luxury spa treatment delivered by certified master technicians.'
  }
  let cleaned = rawDesc.replace(/\[ADDONS:.*?\]/gi, '').trim()

  const memberMatch = cleaned.match(/^(\[MEMBER:\s*\$?[\d.]+\])\s*(.*)$/i)
  if (memberMatch) {
    const memberTag = memberMatch[1]
    let text = memberMatch[2].trim()
    if (LEGACY_VN_DESCRIPTIONS[text]) {
      text = LEGACY_VN_DESCRIPTIONS[text]
    }
    return `${memberTag} ${text}`
  }

  if (LEGACY_VN_DESCRIPTIONS[cleaned]) {
    return LEGACY_VN_DESCRIPTIONS[cleaned]
  }

  return cleaned || 'Premium nail care and luxury spa treatment delivered by certified master technicians.'
}

export const ServiceMenuSection: React.FC<ServiceMenuSectionProps> = ({ site, palette, onSelectService, onBookClick, isMobileView }) => {
  // Group real POS services from admin setup if available
  const categories = React.useMemo(() => {
    if (site.services && site.services.length > 0) {
      const grouped: Record<string, typeof site.services> = {}
      site.services.forEach((s) => {
        const cat = s.categoryName || 'Salon Services'
        if (!grouped[cat]) grouped[cat] = []
        grouped[cat].push(s)
      })
      return Object.entries(grouped).map(([name, list], idx) => ({
        id: `real-cat-${idx}`,
        name,
        services: list.map((item) => ({
          name: item.name,
          dur: item.durationMinutes ? `${item.durationMinutes} mins` : '45 mins',
          price: typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : (String(item.price).startsWith('$') ? String(item.price) : `$${item.price}`),
          desc: formatServiceDescription(item.description)
        }))
      }))
    }
    return []
  }, [site.services])

  const [selectedCatId, setSelectedCatId] = React.useState<string>('all')

  // Listen for category selection dispatched from header submenu
  React.useEffect(() => {
    const handleCategorySelect = (e: Event) => {
      const customEvent = e as CustomEvent<{ categoryName?: string; catId?: string }>
      if (customEvent.detail) {
        if (customEvent.detail.catId) {
          setSelectedCatId(customEvent.detail.catId)
        } else if (customEvent.detail.categoryName) {
          if (customEvent.detail.categoryName === 'all') {
            setSelectedCatId('all')
          } else {
            const match = categories.find((c) => c.name === customEvent.detail.categoryName)
            if (match) {
              setSelectedCatId(match.id)
            }
          }
        }
      }
    }
    window.addEventListener('nexora-select-category', handleCategorySelect)
    return () => window.removeEventListener('nexora-select-category', handleCategorySelect)
  }, [categories])

  const visibleCategories = React.useMemo(() => {
    if (selectedCatId === 'all') return categories
    return categories.filter((c) => c.id === selectedCatId)
  }, [categories, selectedCatId])

  // Auto-hide section when no real services are configured
  if (categories.length === 0) {
    return null
  }

  const templateId = site.templateId || MerchantSiteTemplateId.Classic

  // 1. MINIMALIST CLEAN (Zen Dotted Price List)
  if (templateId === MerchantSiteTemplateId.Minimal) {
    return (
      <section
        id="services"
        className={`transition-colors border-b scroll-mt-16 sm:scroll-mt-20 ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
        style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary, color: palette.textPrimary }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: palette.accentColor }}>
              OFFICIAL PRICE MENU
            </span>
            <h2 className={`font-bold ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
              Signature Services & Pricing
            </h2>
            <div className="w-12 h-0.5 mx-auto rounded-full" style={{ backgroundColor: palette.accentColor }} />
          </div>

          {/* Interactive Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap pt-2">
              <button
                type="button"
                onClick={() => setSelectedCatId('all')}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  selectedCatId === 'all'
                    ? 'shadow-sm text-white'
                    : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                }`}
                style={selectedCatId === 'all' ? { backgroundColor: palette.accentColor, color: palette.buttonText } : {}}
              >
                All Services ({categories.reduce((acc, c) => acc + c.services.length, 0)})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    selectedCatId === c.id
                      ? 'shadow-sm text-white'
                      : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/80'
                  }`}
                  style={selectedCatId === c.id ? { backgroundColor: palette.accentColor, color: palette.buttonText } : {}}
                >
                  {c.name} ({c.services.length})
                </button>
              ))}
            </div>
          )}

          <div className="space-y-10">
            {visibleCategories.map((cat) => (
              <div key={cat.id} className="space-y-4">
                <h3 className="text-sm sm:text-base font-bold uppercase tracking-wider pb-2 border-b flex items-center justify-between"
                  style={{ borderColor: palette.borderPrimary, color: palette.textPrimary }}
                >
                  <span>{cat.name}</span>
                  <button
                    type="button"
                    onClick={() => onBookClick?.()}
                    className="text-xs font-semibold hover:underline flex items-center gap-1 transition-opacity opacity-85 hover:opacity-100 cursor-pointer"
                    style={{ color: palette.accentColor }}
                  >
                    <span>View Full Catalog</span>
                    <span aria-hidden="true">&rarr;</span>
                  </button>
                </h3>

                <div className="space-y-3">
                  {cat.services.map((srv, sIdx) => (
                    <div
                      key={sIdx}
                      onClick={() => onSelectService?.(srv.name)}
                      className="group cursor-pointer py-2 hover:bg-slate-50/50 rounded-lg px-2 -mx-2 transition-colors"
                    >
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-bold text-xs sm:text-sm group-hover:text-indigo-600 transition-colors">
                          {srv.name}
                        </span>
                        <div className="flex-1 border-b border-dotted border-slate-300 mx-2 opacity-60" />
                        <span className="font-extrabold text-xs sm:text-sm shrink-0" style={{ color: palette.accentColor }}>
                          {srv.price}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] mt-1" style={{ color: palette.textSecondary }}>
                        <span className="line-clamp-1">{srv.desc}</span>
                        <span className="shrink-0 ml-3 font-mono opacity-80">{srv.dur}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Bottom Conversion CTA */}
          <div className="text-center pt-6">
            <button
              type="button"
              onClick={() => onBookClick?.()}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm shadow-md hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Book Appointment Online — Instant Confirmation</span>
            </button>
          </div>
        </div>
      </section>
    )
  }

  // 2. MODERN CHIC & 3. BOLD VIBRANT & 4. CLASSIC LUXE
  return (
    <section
      id="services"
      className={`transition-colors scroll-mt-16 sm:scroll-mt-20 ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgSurface, color: palette.textPrimary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center max-w-2xl mx-auto ${isMobileView ? 'mb-6' : 'mb-12'}`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}>
            <Sparkles className="w-3.5 h-3.5" />
            <span>Official POS Price Menu</span>
          </div>
          <h2 className={`font-bold mb-2 ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>Signature Services & Pricing</h2>
          <p className="text-xs sm:text-sm" style={{ color: palette.textSecondary }}>Real-time official service menu synchronized with Clover POS</p>

          {/* Interactive Category Filter Pills */}
          {categories.length > 1 && (
            <div className="flex items-center justify-center gap-2 flex-wrap pt-4">
              <button
                type="button"
                onClick={() => setSelectedCatId('all')}
                className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  selectedCatId === 'all'
                    ? 'shadow-md scale-105'
                    : 'border opacity-80 hover:opacity-100 hover:scale-102'
                }`}
                style={{
                  backgroundColor: selectedCatId === 'all' ? palette.accentColor : palette.bgPrimary,
                  color: selectedCatId === 'all' ? palette.buttonText : palette.textPrimary,
                  borderColor: palette.borderPrimary
                }}
              >
                All Services ({categories.reduce((acc, c) => acc + c.services.length, 0)})
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedCatId(c.id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                    selectedCatId === c.id
                      ? 'shadow-md scale-105'
                      : 'border opacity-80 hover:opacity-100 hover:scale-102'
                  }`}
                  style={{
                    backgroundColor: selectedCatId === c.id ? palette.accentColor : palette.bgPrimary,
                    color: selectedCatId === c.id ? palette.buttonText : palette.textPrimary,
                    borderColor: palette.borderPrimary
                  }}
                >
                  {c.name} ({c.services.length})
                </button>
              ))}
            </div>
          )}
        </div>

        <div className={`space-y-6 ${isMobileView ? 'space-y-4' : 'space-y-10'}`}>
          {visibleCategories.map((cat) => (
            <div
              key={cat.id}
              className={`rounded-3xl border shadow-sm ${isMobileView ? 'p-4' : 'p-6'}`}
              style={{
                backgroundColor: templateId === MerchantSiteTemplateId.Bold ? '#0F172A' : palette.bgPrimary,
                borderColor: palette.borderPrimary
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b mb-6" style={{ borderColor: palette.borderPrimary }}>
                <h3 className={`font-bold flex items-center gap-2 ${isMobileView ? 'text-sm' : 'text-lg sm:text-xl'}`} style={{ color: palette.textPrimary }}>
                  <CheckCircle className="w-4 h-4" style={{ color: palette.accentColor }} />
                  <span>{cat.name}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onBookClick?.()}
                  className="text-xs font-semibold hover:underline flex items-center gap-1 transition-opacity opacity-85 hover:opacity-100 cursor-pointer shrink-0 ml-2"
                  style={{ color: palette.accentColor }}
                >
                  <span>View Complete Menu</span>
                  <span aria-hidden="true">&rarr;</span>
                </button>
              </div>

              <div className={`grid gap-3 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 md:gap-4'}`}>
                {cat.services.map((srv, sIdx) => (
                  <div
                    key={sIdx}
                    onClick={() => onSelectService?.(srv.name)}
                    className="p-4 rounded-2xl border transition-all hover:scale-[1.01] hover:shadow-md cursor-pointer flex flex-col justify-between"
                    style={{
                      backgroundColor: templateId === MerchantSiteTemplateId.Bold ? '#1E293B' : palette.bgSurface,
                      borderColor: palette.borderPrimary,
                      color: palette.textPrimary
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="font-bold text-sm sm:text-base">{srv.name}</span>
                        <span className="font-extrabold text-base sm:text-lg" style={{ color: palette.accentColor }}>{srv.price}</span>
                      </div>
                      <p className="text-xs leading-relaxed mb-3 opacity-80" style={{ color: palette.textSecondary }}>{srv.desc}</p>
                    </div>

                    <div className="flex items-center justify-between text-[11px]" style={{ color: palette.textSecondary }}>
                      <span className="inline-flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {srv.dur}
                      </span>
                      <span className="font-semibold" style={{ color: palette.accentColor }}>Book Service →</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Bottom Conversion CTA */}
          <div className="text-center pt-6 sm:pt-10">
            <button
              type="button"
              onClick={() => onBookClick?.()}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm sm:text-base shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText,
                boxShadow: `0 10px 25px -5px ${palette.accentColor}40`
              }}
            >
              <Sparkles className="w-4 h-4" />
              <span>Book Appointment Online — Claim 25% OFF</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}
