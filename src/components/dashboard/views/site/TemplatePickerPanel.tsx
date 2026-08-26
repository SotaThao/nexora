import React, { useState } from 'react'
import { Check, Sparkles, Palette, Sliders, CheckCircle2 } from 'lucide-react'
import {
  MerchantSitePaletteId,
  MerchantSiteTemplateId,
  MerchantSiteDto
} from '../../../../constants/merchantSiteStatus'
import { SITE_PALETTES } from '../../../public/site/palettes'

interface TemplatePickerPanelProps {
  site: MerchantSiteDto
  onChange: (templateId: MerchantSiteTemplateId, paletteId: MerchantSitePaletteId, customColor?: string) => void
}

const QUICK_SWATCHES = [
  { name: 'Indigo Brand', hex: '#4F46E5' },
  { name: 'Amber Gold', hex: '#D97706' },
  { name: 'Rose Red', hex: '#E11D48' },
  { name: 'Ruby Wine', hex: '#BE123C' },
  { name: 'Royal Purple', hex: '#7C3AED' },
  { name: 'Emerald Green', hex: '#059669' },
  { name: 'Ocean Blue', hex: '#0284C7' },
  { name: 'Warm Mocha', hex: '#92400E' },
]

// Visual Miniature Section Blueprint for each Template
const TemplateWireframe: React.FC<{ templateId: MerchantSiteTemplateId; accentColor: string; bgColor: string }> = ({
  templateId,
  accentColor,
  bgColor
}) => {
  if (templateId === MerchantSiteTemplateId.Classic) {
    return (
      <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-700/60 shadow-inner flex flex-col bg-[#0F172A] text-white p-2.5 space-y-1.5 select-none pointer-events-none group-hover:scale-[1.02] transition-transform">
        {/* Mini Browser Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-slate-800">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-slate-800" />
          <div className="h-2 w-6 rounded-md text-[6px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
            BOOK
          </div>
        </div>

        {/* Hero Section: Split 50/50 */}
        <div className="bg-slate-800/80 rounded-lg p-1.5 border border-slate-700/50 flex items-center justify-between gap-1.5">
          <div className="space-y-1 flex-1">
            <div className="h-2 w-16 rounded bg-white/90" />
            <div className="h-1.5 w-20 rounded bg-slate-400" />
            <div className="h-2.5 w-12 rounded flex items-center justify-center text-[6px] font-bold text-white shadow-xs" style={{ backgroundColor: accentColor }}>
              Đặt Lịch
            </div>
          </div>
          <div className="w-10 h-8 rounded-md bg-slate-700/80 border border-slate-600 flex items-center justify-center shrink-0">
            <div className="w-4 h-4 rounded-full border border-amber-400/40" />
          </div>
        </div>

        {/* Promo Ribbon */}
        <div className="h-3 rounded-md px-1.5 flex items-center justify-between border" style={{ backgroundColor: `${accentColor}20`, borderColor: `${accentColor}40` }}>
          <span className="text-[6px] font-bold truncate" style={{ color: accentColor }}>★ VOUCHER GIẢM 15%</span>
          <span className="text-[5px] px-1 rounded bg-white/20">CODE</span>
        </div>

        {/* 3-Column Highlights */}
        <div className="grid grid-cols-3 gap-1">
          <div className="h-3.5 rounded bg-slate-800/80 border border-slate-700/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-0.5" />
            <div className="h-1 w-4 rounded bg-slate-400" />
          </div>
          <div className="h-3.5 rounded bg-slate-800/80 border border-slate-700/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mr-0.5" />
            <div className="h-1 w-4 rounded bg-slate-400" />
          </div>
          <div className="h-3.5 rounded bg-slate-800/80 border border-slate-700/40 flex items-center justify-center">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 mr-0.5" />
            <div className="h-1 w-4 rounded bg-slate-400" />
          </div>
        </div>

        {/* 2-Column Services Menu */}
        <div className="grid grid-cols-2 gap-1 flex-1">
          <div className="rounded bg-slate-800/60 p-1 border border-slate-700/30 flex items-center justify-between">
            <div className="h-1 w-8 rounded bg-slate-300" />
            <div className="h-1 w-3 rounded" style={{ backgroundColor: accentColor }} />
          </div>
          <div className="rounded bg-slate-800/60 p-1 border border-slate-700/30 flex items-center justify-between">
            <div className="h-1 w-8 rounded bg-slate-300" />
            <div className="h-1 w-3 rounded" style={{ backgroundColor: accentColor }} />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === MerchantSiteTemplateId.Modern) {
    return (
      <div className="w-full h-44 rounded-2xl overflow-hidden border border-rose-200/80 shadow-inner flex flex-col bg-[#FFF1F2] text-slate-800 p-2.5 space-y-1.5 select-none pointer-events-none group-hover:scale-[1.02] transition-transform">
        {/* Mini Browser Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-rose-200/60">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          </div>
          <div className="h-1.5 w-16 rounded-full bg-rose-200" />
          <div className="h-2 w-5 rounded-full text-[6px] font-bold flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
            App
          </div>
        </div>

        {/* Centered Editorial Hero */}
        <div className="bg-white rounded-xl p-2 border border-rose-100 shadow-xs text-center space-y-1 flex flex-col items-center">
          <div className="h-1 w-10 rounded-full bg-rose-100 mb-0.5" />
          <div className="h-2 w-24 rounded bg-slate-900" />
          <div className="h-1 w-28 rounded bg-slate-400" />
          <div className="flex items-center gap-1 mt-0.5">
            <div className="h-2.5 px-2 rounded-full text-[5px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              Đặt Hẹn
            </div>
            <div className="h-2.5 px-1.5 rounded-full text-[5px] font-medium border border-slate-300 text-slate-700 bg-white">
              Gọi Điện
            </div>
          </div>
        </div>

        {/* Brand Story Highlight Card */}
        <div className="bg-white/80 rounded-lg p-1.5 border border-rose-100 flex items-center gap-1.5">
          <div className="w-4 h-4 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[7px] shrink-0 font-serif font-bold">
            “
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="h-1 w-20 rounded bg-slate-700" />
            <div className="h-0.5 w-24 rounded bg-slate-400" />
          </div>
        </div>

        {/* Dual Promo Cards Grid */}
        <div className="grid grid-cols-2 gap-1 flex-1">
          <div className="rounded-lg bg-white p-1 border border-rose-100 shadow-xs space-y-0.5">
            <div className="h-1 w-8 rounded bg-rose-600" />
            <div className="h-0.5 w-10 rounded bg-slate-400" />
          </div>
          <div className="rounded-lg bg-white p-1 border border-rose-100 shadow-xs space-y-0.5">
            <div className="h-1 w-8 rounded bg-rose-600" />
            <div className="h-0.5 w-10 rounded bg-slate-400" />
          </div>
        </div>
      </div>
    )
  }

  if (templateId === MerchantSiteTemplateId.Bold) {
    return (
      <div className="w-full h-44 rounded-2xl overflow-hidden border border-indigo-900 shadow-inner flex flex-col bg-[#081F49] text-white p-2.5 space-y-1.5 select-none pointer-events-none group-hover:scale-[1.02] transition-transform">
        {/* Mini Browser Bar */}
        <div className="flex items-center justify-between pb-1 border-b border-indigo-900">
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
            <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
          </div>
          <div className="h-1.5 w-12 rounded-full bg-indigo-950" />
          <div className="h-2 w-7 rounded text-[5px] font-black uppercase flex items-center justify-center text-white" style={{ backgroundColor: accentColor }}>
            NEON
          </div>
        </div>

        {/* Bold Impact Hero */}
        <div className="bg-indigo-950/80 rounded-lg p-1.5 border border-indigo-700/50 flex items-center justify-between">
          <div className="space-y-1">
            <div className="h-2.5 w-20 rounded bg-white font-black" />
            <div className="h-1 w-16 rounded" style={{ backgroundColor: accentColor }} />
            <div className="h-2.5 w-14 rounded text-[5px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: accentColor }}>
              BOOK NOW
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-500 border border-indigo-400 shadow-sm" />
        </div>

        {/* Services Bento Grid (Asymmetric) */}
        <div className="grid grid-cols-3 gap-1">
          <div className="col-span-2 rounded bg-indigo-950/90 p-1 border border-indigo-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="h-1 w-12 rounded bg-white" />
              <div className="h-0.5 w-8 rounded bg-indigo-300" />
            </div>
            <div className="h-1.5 w-4 rounded font-bold text-[5px] text-indigo-300">$65</div>
          </div>
          <div className="rounded bg-indigo-950/90 p-1 border border-indigo-800 flex flex-col justify-center items-center">
            <div className="h-1 w-5 rounded bg-indigo-300 mb-0.5" />
            <div className="h-1.5 w-4 rounded bg-indigo-500 text-[5px] text-white flex items-center justify-center">★ 5.0</div>
          </div>
        </div>

        {/* Neon Artist Showcase Row */}
        <div className="flex items-center gap-1.5 pt-0.5">
          <div className="w-4 h-4 rounded-full border-2 border-indigo-400 bg-indigo-900" />
          <div className="w-4 h-4 rounded-full border-2 border-purple-400 bg-indigo-900" />
          <div className="w-4 h-4 rounded-full border-2 border-pink-400 bg-indigo-900" />
          <div className="h-1 w-12 rounded bg-indigo-300 ml-auto" />
        </div>
      </div>
    )
  }

  // Minimalist Clean (Zen Flat Single Column Flow)
  return (
    <div className="w-full h-44 rounded-2xl overflow-hidden border border-slate-200 shadow-inner flex flex-col bg-white text-slate-800 p-2.5 space-y-1.5 select-none pointer-events-none group-hover:scale-[1.02] transition-transform">
      {/* Mini Browser Bar */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
          <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
        </div>
        <div className="h-1.5 w-12 rounded-full bg-slate-100" />
        <div className="h-2 w-6 rounded text-[5px] font-medium border border-slate-300 flex items-center justify-center text-slate-700">
          Menu
        </div>
      </div>

      {/* Zen Clean Hero */}
      <div className="py-1 text-center space-y-1">
        <div className="h-2 w-20 rounded bg-slate-900 mx-auto" />
        <div className="h-1 w-28 rounded bg-slate-400 mx-auto" />
        <div className="h-2.5 w-14 rounded text-[5px] font-medium text-white mx-auto flex items-center justify-center shadow-xs" style={{ backgroundColor: accentColor }}>
          Đặt Lịch Hẹn
        </div>
      </div>

      {/* Dotted Minimal Menu Lines */}
      <div className="space-y-1 px-1 py-0.5 border-y border-slate-100">
        <div className="flex items-center justify-between text-[5px] text-slate-600">
          <div className="h-1 w-14 rounded bg-slate-700" />
          <div className="h-0.5 flex-1 border-b border-dotted border-slate-300 mx-1" />
          <span className="font-bold text-slate-900">$45</span>
        </div>
        <div className="flex items-center justify-between text-[5px] text-slate-600">
          <div className="h-1 w-12 rounded bg-slate-700" />
          <div className="h-0.5 flex-1 border-b border-dotted border-slate-300 mx-1" />
          <span className="font-bold text-slate-900">$60</span>
        </div>
      </div>

      {/* Clean Staff Badges Grid */}
      <div className="grid grid-cols-3 gap-1 pt-0.5">
        <div className="p-1 rounded border border-slate-100 text-center space-y-0.5 bg-slate-50">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mx-auto" />
          <div className="h-0.5 w-5 rounded bg-slate-600 mx-auto" />
        </div>
        <div className="p-1 rounded border border-slate-100 text-center space-y-0.5 bg-slate-50">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mx-auto" />
          <div className="h-0.5 w-5 rounded bg-slate-600 mx-auto" />
        </div>
        <div className="p-1 rounded border border-slate-100 text-center space-y-0.5 bg-slate-50">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-300 mx-auto" />
          <div className="h-0.5 w-5 rounded bg-slate-600 mx-auto" />
        </div>
      </div>
    </div>
  )
}

export const TemplatePickerPanel: React.FC<TemplatePickerPanelProps> = ({ site, onChange }) => {
  const [customHex, setCustomHex] = useState(site.customColor || '#4F46E5')

  const templates = [
    {
      id: MerchantSiteTemplateId.Classic,
      name: 'Classic Luxe',
      tagline: 'Vàng Kim 24K · Sang Trọng Cổ Điển',
      layoutBadge: 'Bố cục Chia Đôi 50/50',
      description: 'Bố cục thanh lịch với tone màu hoàng gia, phù hợp cho salon cao cấp và spa thư giãn.',
      defaultPalette: MerchantSitePaletteId.Gold,
      bgPreview: '#0F172A',
      accentPreview: '#D97706'
    },
    {
      id: MerchantSiteTemplateId.Modern,
      name: 'Modern Chic',
      tagline: 'Rose Gold · Tạp Chí Thời Thượng',
      layoutBadge: 'Bố cục Căn Giữa Tối Giản',
      description: 'Phong cách pastel hiện đại, tinh tế và sáng thoáng, thu hút giới trẻ và khách hàng thời thượng.',
      defaultPalette: MerchantSitePaletteId.RoseGold,
      bgPreview: '#FFF1F2',
      accentPreview: '#E11D48'
    },
    {
      id: MerchantSiteTemplateId.Bold,
      name: 'Bold Vibrant',
      tagline: 'Neon Dark · Năng Động & Cá Tính',
      layoutBadge: 'Bố cục Bento Grid Đậm',
      description: 'Độ tương phản cao với gam màu rực rỡ, lý tưởng cho salon nail art phong cách và cá tính mạnh.',
      defaultPalette: MerchantSitePaletteId.Neon,
      bgPreview: '#081F49',
      accentPreview: '#6366F1'
    },
    {
      id: MerchantSiteTemplateId.Minimal,
      name: 'Minimalist Clean',
      tagline: 'Chủ Đề Đơn Giản · Tinh Tế & Thanh Lịch',
      layoutBadge: 'Bố cục Phẳng Zen Tối Giản',
      description: 'Giao diện phẳng tinh khôi, sáng thoáng, tối giản tối đa để làm nổi bật hình ảnh mẫu móng và dịch vụ.',
      defaultPalette: MerchantSitePaletteId.Slate,
      bgPreview: '#F8FAFC',
      accentPreview: '#0284C7'
    }
  ]

  const palettes = Object.values(SITE_PALETTES).filter(p => p.id !== MerchantSitePaletteId.Custom)

  const handleApplyCustomColor = (hex: string) => {
    setCustomHex(hex)
    onChange(site.templateId, MerchantSitePaletteId.Custom, hex)
  }

  const isCustomPaletteActive = site.paletteId === MerchantSitePaletteId.Custom

  return (
    <div className="space-y-10">
      {/* 1. Templates Selection */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-nexoraText">
              1. Chọn Mẫu Giao Diện Website (Templates)
            </h3>
            <p className="text-xs sm:text-sm text-nexoraMuted">
              Chọn 1 trong 4 layout thiết kế nhận diện thương hiệu độc quyền cho salon
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {templates.map((tmpl) => {
            const isSelected = site.templateId === tmpl.id
            return (
              <div
                key={tmpl.id}
                onClick={() => onChange(tmpl.id, tmpl.defaultPalette, site.customColor)}
                className={`relative rounded-3xl border-2 p-5 cursor-pointer transition-all hover:shadow-xl flex flex-col justify-between group ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-4 right-4 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md z-10">
                    <Check className="w-3.5 h-3.5" />
                  </span>
                )}

                <div>
                  {/* Visual Section Blueprint Wireframe */}
                  <div className="mb-4">
                    <TemplateWireframe
                      templateId={tmpl.id}
                      accentColor={tmpl.accentPreview}
                      bgColor={tmpl.bgPreview}
                    />
                  </div>

                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-extrabold text-base text-nexoraText">{tmpl.name}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                      {tmpl.layoutBadge}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-indigo-600 mb-2">{tmpl.tagline}</p>
                  <p className="text-xs text-nexoraMuted leading-relaxed">{tmpl.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* 2. Color Palette Presets */}
      <div className="pt-6 border-t border-slate-200 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-nexoraText">
              2. Bảng Màu Chủ Đạo (Color Palette Presets)
            </h3>
            <p className="text-xs sm:text-sm text-nexoraMuted">
              Chọn nhanh bộ màu sắc có sẵn hoặc tự do tùy chỉnh mã màu nhận diện tiệm
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {palettes.map((pal) => {
            const isPalActive = site.paletteId === pal.id
            return (
              <button
                key={pal.id}
                type="button"
                onClick={() => onChange(site.templateId, pal.id, undefined)}
                className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
                  isPalActive
                    ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600 shadow-sm'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <span
                  className="w-6 h-6 rounded-full border border-black/10 shadow-sm shrink-0 flex items-center justify-center text-white"
                  style={{ backgroundColor: pal.accentColor }}
                >
                  {isPalActive && <Check className="w-3.5 h-3.5" />}
                </span>
                <span className="text-xs font-bold truncate text-slate-800">
                  {pal.name.split(' ')[0]}
                </span>
              </button>
            )
          })}

          {/* Custom Palette Toggle Card */}
          <button
            type="button"
            onClick={() => handleApplyCustomColor(customHex)}
            className={`p-3 rounded-2xl border text-left transition-all flex items-center gap-2.5 ${
              isCustomPaletteActive
                ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-300 hover:bg-slate-50'
            }`}
          >
            {isCustomPaletteActive ? (
              <span
                className="w-6 h-6 rounded-full border border-black/10 shadow-sm shrink-0 flex items-center justify-center text-white"
                style={{ backgroundColor: customHex }}
              >
                <Check className="w-3.5 h-3.5 text-white" />
              </span>
            ) : (
              <span className="w-6 h-6 rounded-full shadow-sm shrink-0 flex items-center justify-center bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 text-white">
                <Palette className="w-3 h-3 text-white" />
              </span>
            )}
            <span className={`text-xs font-bold truncate ${isCustomPaletteActive ? 'text-indigo-700' : 'text-slate-800'}`}>
              Tùy Chỉnh
            </span>
          </button>
        </div>

        {/* 3. Custom Primary Color Studio Box (Only visible when Custom Palette is selected) */}
        {isCustomPaletteActive && (
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-50 border border-indigo-200/80 shadow-inner space-y-4 animate-in fade-in slide-in-from-top-3 duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-white border border-indigo-200 shadow-sm text-indigo-600">
                  <Sliders className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-nexoraText">
                    Tùy Biến Màu Thương Hiệu Salon (Custom Primary Color)
                  </h4>
                  <p className="text-[11px] text-nexoraMuted">
                    Chọn màu bất kỳ từ bảng màu hoặc nhập mã HEX để đồng bộ toàn bộ nút bấm, biểu tượng & badge
                  </p>
                </div>
              </div>

              {/* Color Picker & Hex Input */}
              <div className="flex items-center gap-2.5">
                <div className="relative flex items-center">
                  <input
                    type="color"
                    value={customHex}
                    onChange={(e) => handleApplyCustomColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-2 border-white shadow-sm p-0 bg-transparent overflow-hidden"
                  />
                </div>
                <input
                  type="text"
                  value={customHex}
                  onChange={(e) => {
                    const val = e.target.value
                    setCustomHex(val)
                    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                      onChange(site.templateId, MerchantSitePaletteId.Custom, val)
                    }
                  }}
                  placeholder="#4F46E5"
                  maxLength={7}
                  className="w-24 px-3 py-2 rounded-xl border border-slate-300 bg-white font-mono text-xs font-bold text-slate-800 uppercase focus:border-indigo-600 outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCustomColor(customHex)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all shadow"
                >
                  Áp Dụng
                </button>
              </div>
            </div>

            {/* Quick Swatches Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
              <span className="text-[11px] font-semibold text-slate-500 mr-1">Màu gợi ý:</span>
              {QUICK_SWATCHES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  onClick={() => handleApplyCustomColor(swatch.hex)}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 hover:border-slate-300 text-[11px] font-medium text-slate-700 shadow-sm transition-all"
                >
                  <span className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: swatch.hex }} />
                  <span>{swatch.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

