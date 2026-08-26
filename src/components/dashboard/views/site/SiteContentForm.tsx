import React, { useState } from 'react'
import {
  Upload,
  Plus,
  Trash2,
  Sparkles,
  Star,
  Image as ImageIcon,
  CheckCircle2,
  Calendar,
  Eye,
  ShieldCheck,
  Award,
  RefreshCw,
  Heart,
  Loader2
} from 'lucide-react'
import { SiteContentDto, MerchantSitePaletteId, MerchantSiteTemplateId } from '../../../../constants/merchantSiteStatus'
import { imagesRepository } from '../../../../data/repositories/images'
import { logger } from '../../../../utils/logger'
import { getSitePalette } from '../../../public/site/palettes'

const QUICK_SLOGAN_TEMPLATES = [
  'Nâng tầm vẻ đẹp móng nghệ thuật và trải nghiệm chăm sóc spa đẳng cấp',
  'Salon chăm sóc móng chuẩn 5 sao với sản phẩm 100% Organic lành tính',
  'Thiết kế móng thời thượng, sắc sảo cùng đội ngũ thợ lành nghề',
]

export interface SiteContentFormProps {
  content: SiteContentDto
  onChange: (content: Partial<SiteContentDto>) => void
  paletteId?: MerchantSitePaletteId
  customColor?: string
  templateId?: MerchantSiteTemplateId
}

// Safe & resilient upload helper: calls API if available, fallbacks to DataURL for offline/pre-BE
async function uploadImageSafely(file: File): Promise<string> {
  try {
    const res = await imagesRepository.uploadAndGetUrl(file)
    if (typeof res === 'string' && res.trim().length > 0) {
      return res
    }
  } catch (err) {
    logger.warn('[ImageUpload] API upload unavailable or offline, using local preview DataURL:', err)
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to read file as DataURL'))
      }
    }
    reader.onerror = (e) => reject(e)
    reader.readAsDataURL(file)
  })
}

export const SiteContentForm: React.FC<SiteContentFormProps> = ({
  content,
  onChange,
  paletteId,
  customColor,
  templateId
}) => {
  const [isUploadingHero, setIsUploadingHero] = useState(false)
  const [isUploadingGallery, setIsUploadingGallery] = useState(false)
  const palette = getSitePalette(paletteId || MerchantSitePaletteId.Gold, customColor)

  const handleHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setIsUploadingHero(true)
      const url = await uploadImageSafely(file)
      if (url) onChange({ heroImageUrl: url })
    } catch (err) {
      logger.error('Failed to upload hero image:', err)
    } finally {
      setIsUploadingHero(false)
    }
  }

  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    try {
      setIsUploadingGallery(true)
      const newUrls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const url = await uploadImageSafely(files[i])
        if (url) newUrls.push(url)
      }
      onChange({ galleryImageUrls: [...(content.galleryImageUrls || []), ...newUrls].slice(0, 8) })
    } catch (err) {
      logger.error('Failed to upload gallery images:', err)
    } finally {
      setIsUploadingGallery(false)
    }
  }

  const removeGalleryImage = (index: number) => {
    const next = [...(content.galleryImageUrls || [])]
    next.splice(index, 1)
    onChange({ galleryImageUrls: next })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
      {/* LEFT COLUMN: Controls & Uploads (7 cols) */}
      <div className="xl:col-span-7 space-y-6">
        {/* 1. Hero Slogan & Tagline */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-nexoraText flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>1. Hero Slogan & Thông Điệp Bìa</span>
            </h3>
            <span className="text-[11px] font-semibold text-slate-400">Xuất hiện trên cùng</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Hero Slogan (Tiêu Đề Nổi Bật)
            </label>
            <input
              type="text"
              value={content.taglineVi || ''}
              onChange={(e) => onChange({ taglineVi: e.target.value, taglineEn: e.target.value })}
              placeholder="VD: Nâng tầm vẻ đẹp móng nghệ thuật cao cấp tại Austin"
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-all font-medium"
            />

            {/* Quick Slogan Suggestions */}
            <div className="mt-2.5 space-y-1">
              <span className="text-[11px] font-semibold text-slate-400">Gợi ý thông điệp mẫu:</span>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SLOGAN_TEMPLATES.map((slogan, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => onChange({ taglineVi: slogan, taglineEn: slogan })}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-600 transition-colors text-left"
                  >
                    "{slogan.slice(0, 32)}..."
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hero Banner Upload */}
          <div className="pt-4 border-t border-slate-100">
            <label className="block text-xs font-bold text-slate-700 mb-2">
              Ảnh Bìa Hero Banner (Tỷ lệ 16:9)
            </label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {isUploadingHero ? (
                <div className="w-full sm:w-64 aspect-[16/9] rounded-2xl border-2 border-indigo-300 bg-indigo-50/60 flex flex-col items-center justify-center gap-2 shadow-inner animate-pulse shrink-0">
                  <Loader2 className="w-7 h-7 text-indigo-600 animate-spin" />
                  <span className="text-xs font-bold text-indigo-700">Đang tải ảnh lên...</span>
                </div>
              ) : content.heroImageUrl ? (
                <div className="relative w-full sm:w-64 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-900 shrink-0">
                  <img src={content.heroImageUrl} alt="Hero preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <button
                      type="button"
                      onClick={() => onChange({ heroImageUrl: '' })}
                      className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa ảnh</span>
                    </button>
                  </div>
                </div>
              ) : (
                <label className="w-full sm:w-64 aspect-[16/9] rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-indigo-50/20 transition-all group shrink-0">
                  <div className="w-9 h-9 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center mb-1.5 group-hover:scale-110 transition-transform">
                    <Upload className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-bold text-slate-700">Tải ảnh bìa</span>
                  <span className="text-[10px] text-slate-400">1920x1080 (16:9)</span>
                  <input type="file" accept="image/*" onChange={handleHeroUpload} className="hidden" />
                </label>
              )}
              <div className="text-xs text-slate-500 leading-relaxed">
                Ảnh bìa hiển thị trên cùng website, giúp thu hút khách hàng ngay từ giây đầu tiên.
              </div>
            </div>
          </div>
        </div>

        {/* 2. Story & Highlights */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <h3 className="font-bold text-base text-nexoraText flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span>2. Giới Thiệu & Điểm Nổi Bật (About & Highlights)</span>
          </h3>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Câu Chuyện Tiệm (About Story)
            </label>
            <textarea
              rows={3}
              value={content.aboutVi || ''}
              onChange={(e) => onChange({ aboutVi: e.target.value, aboutEn: e.target.value })}
              placeholder="VD: Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao với sản phẩm lành tính organic và đội ngũ thợ lành nghề..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none transition-all"
            />
          </div>

          <div className="pt-2">
            <label className="block text-xs font-bold text-slate-700 mb-2">3 Điểm Nổi Bật Được Khách Yêu Thích</label>
            <div className="space-y-2">
              {(content.highlights || []).map((h, hIdx) => (
                <div key={h.id || hIdx} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                    #{hIdx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <input
                      type="text"
                      value={h.titleVi || h.titleEn || ''}
                      onChange={(e) => {
                        const next = [...(content.highlights || [])]
                        next[hIdx] = { ...next[hIdx], titleVi: e.target.value, titleEn: e.target.value }
                        onChange({ highlights: next })
                      }}
                      className="w-full text-xs font-bold text-slate-800 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1"
                    />
                    <input
                      type="text"
                      value={h.descriptionVi || h.descriptionEn || ''}
                      onChange={(e) => {
                        const next = [...(content.highlights || [])]
                        next[hIdx] = { ...next[hIdx], descriptionVi: e.target.value, descriptionEn: e.target.value }
                        onChange({ highlights: next })
                      }}
                      className="w-full text-[11px] text-slate-500 bg-transparent focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1 mt-0.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Gallery Album */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-nexoraText flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-indigo-600" />
              <span>3. Album Ảnh Mẫu Móng & Không Gian (Tối đa 8)</span>
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              {(content.galleryImageUrls || []).length}/8 ảnh
            </span>
          </div>

          <div className="flex flex-wrap gap-3 items-center pt-2">
            {(content.galleryImageUrls || []).map((url, idx) => (
              <div key={idx} className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-slate-200 group shadow-sm bg-slate-100 shrink-0">
                <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <button
                    type="button"
                    onClick={() => removeGalleryImage(idx)}
                    className="p-1.5 rounded-xl bg-red-600 text-white hover:bg-red-700 shadow"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}

            {isUploadingGallery && (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-indigo-300 bg-indigo-50/60 flex flex-col items-center justify-center gap-1 shrink-0 animate-pulse">
                <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                <span className="text-[10px] font-bold text-indigo-700">Đang tải...</span>
              </div>
            )}

            {(content.galleryImageUrls || []).length < 8 && !isUploadingGallery && (
              <label className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-500 flex flex-col items-center justify-center cursor-pointer bg-slate-50 hover:bg-indigo-50/20 transition-all group shrink-0">
                <Plus className="w-5 h-5 text-indigo-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold text-slate-700">Thêm ảnh</span>
                <input type="file" multiple accept="image/*" onChange={handleGalleryUpload} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Realtime Live Mockup Mini Preview (5 cols) */}
      <div className="xl:col-span-5 xl:sticky xl:top-4 space-y-4">
        <div
          className="p-4 sm:p-5 rounded-3xl shadow-2xl border space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto transition-all duration-300"
          style={{
            backgroundColor: palette.bgPrimary,
            borderColor: palette.borderPrimary,
            color: palette.textPrimary
          }}
        >
          <div
            className="flex items-center justify-between pb-2.5 border-b"
            style={{ borderColor: palette.borderPrimary }}
          >
            <span
              className="text-xs font-bold flex items-center gap-1.5 uppercase tracking-wider"
              style={{ color: palette.accentColor }}
            >
              <Eye className="w-3.5 h-3.5" />
              Xem Trước Trực Tiếp
            </span>
            <span className="text-[10px] font-mono" style={{ color: palette.textSecondary }}>
              Website Mockup
            </span>
          </div>

          {/* Hero Mockup (16:9 exact matching Hình 1) */}
          <div
            className="relative rounded-2xl overflow-hidden p-3.5 border space-y-2.5 shadow-sm transition-colors"
            style={{
              backgroundColor: palette.bgSurface,
              borderColor: palette.borderPrimary
            }}
          >
            {isUploadingHero ? (
              <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative shadow-sm border border-indigo-200 bg-indigo-50/80 flex flex-col items-center justify-center gap-1.5 animate-pulse">
                <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                <span className="text-xs font-bold text-indigo-700">Đang cập nhật ảnh bìa...</span>
              </div>
            ) : content.heroImageUrl ? (
              <div className="w-full aspect-[16/9] rounded-xl overflow-hidden relative shadow-sm border" style={{ borderColor: palette.borderPrimary }}>
                <img src={content.heroImageUrl} alt="Mockup Hero" className="w-full h-full object-cover" />
                {/* Floating Rating Pill on Mockup */}
                <div className="absolute top-2 right-2 px-2 py-0.5 rounded-lg bg-black/75 backdrop-blur-xs text-[9px] font-bold text-white flex items-center gap-1 shadow">
                  <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                  <span>5.0</span>
                </div>
              </div>
            ) : (
              <div
                className="w-full aspect-[16/9] rounded-xl flex items-center justify-center text-xs font-semibold border border-dashed"
                style={{
                  backgroundColor: palette.bgPrimary,
                  borderColor: palette.borderPrimary,
                  color: palette.textSecondary
                }}
              >
                (Chưa chọn ảnh bìa 16:9)
              </div>
            )}

            <div className={`space-y-1.5 ${templateId === MerchantSiteTemplateId.Modern || templateId === MerchantSiteTemplateId.Minimal ? 'text-center' : ''}`}>
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  templateId === MerchantSiteTemplateId.Bold ? 'uppercase tracking-wider' : ''
                }`}
                style={{
                  backgroundColor: palette.badgeBg,
                  color: palette.badgeText
                }}
              >
                {templateId === MerchantSiteTemplateId.Minimal ? 'ZEN BEAUTY' : '★ 4.9 (128 Đánh Giá POS)'}
              </span>
              <h4
                className={`text-xs sm:text-sm font-extrabold leading-tight ${
                  templateId === MerchantSiteTemplateId.Bold ? 'uppercase tracking-tight' : ''
                }`}
                style={{ color: palette.textPrimary }}
              >
                {content.taglineVi || content.taglineEn || 'Nâng tầm vẻ đẹp móng nghệ thuật cao cấp'}
              </h4>
              <p
                className="text-[10px] line-clamp-2 leading-relaxed opacity-90"
                style={{ color: palette.textSecondary }}
              >
                {content.aboutVi || content.aboutEn || 'Chúng tôi mang đến dịch vụ chăm sóc móng chuẩn 5 sao...'}
              </p>
            </div>

            <button
              type="button"
              className={`w-full py-2 text-xs font-bold shadow flex items-center justify-center gap-1.5 transition-transform active:scale-95 ${
                templateId === MerchantSiteTemplateId.Minimal ? 'rounded-full' : 'rounded-xl'
              } ${templateId === MerchantSiteTemplateId.Bold ? 'uppercase tracking-wider font-black' : ''}`}
              style={{
                backgroundColor: palette.accentColor,
                color: palette.buttonText
              }}
            >
              <Calendar className="w-3 h-3" />
              <span>Đặt Lịch Hẹn Ngay</span>
            </button>
          </div>

          {/* Highlights Mockup */}
          <div className="space-y-1.5">
            <span
              className="text-[10px] font-bold uppercase tracking-wider block"
              style={{ color: palette.textSecondary }}
            >
              Điểm Nổi Bật
            </span>
            <div className="grid grid-cols-1 gap-1.5">
              {(content.highlights || []).slice(0, 3).map((h, i) => (
                <div
                  key={i}
                  className="p-1.5 px-2.5 rounded-xl border flex items-center gap-2 text-[11px] shadow-xs"
                  style={{
                    backgroundColor: palette.bgSurface,
                    borderColor: palette.borderPrimary,
                    color: palette.textPrimary
                  }}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: palette.accentColor }} />
                  <span className="font-semibold truncate">{h.titleVi || h.titleEn}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Gallery Mini Strip */}
          {(content.galleryImageUrls || []).length > 0 && (
            <div
              className="space-y-1.5 pt-2 border-t"
              style={{ borderColor: palette.borderPrimary }}
            >
              <span
                className="text-[10px] font-bold uppercase tracking-wider block"
                style={{ color: palette.textSecondary }}
              >
                Album Mẫu Móng ({content.galleryImageUrls.length})
              </span>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {content.galleryImageUrls.map((url, i) => (
                  <img
                    key={i}
                    src={url}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover shrink-0 border shadow-sm"
                    style={{ borderColor: palette.borderPrimary }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

