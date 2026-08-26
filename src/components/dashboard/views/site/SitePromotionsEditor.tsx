import React, { useState } from 'react'
import {
  Tag,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  Sparkles,
  Scissors,
  Calendar,
  Ticket,
  Check,
  Gift,
  Loader2
} from 'lucide-react'
import { SitePromotionDto } from '../../../../constants/merchantSiteStatus'
import { imagesRepository } from '../../../../data/repositories/images'
import { logger } from '../../../../utils/logger'

const PRESET_BANNERS = [
  {
    id: 'luxe-gold',
    name: 'Vàng Kim 24K Sang Trọng',
    url: 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'rose-manicure',
    name: 'Rose Gold Manicure',
    url: 'https://images.unsplash.com/photo-1519014816548-bf5fe059798b?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'spa-pedicure',
    name: 'Deluxe Spa Pedicure',
    url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
  },
  {
    id: 'neon-art',
    name: 'Nail Art Phong Cách',
    url: 'https://images.unsplash.com/photo-1632345031435-8727f6897d53?auto=format&fit=crop&w=800&q=80',
  }
]

const QUICK_PROMO_TEMPLATES: Partial<SitePromotionDto>[] = [
  {
    titleVi: 'Ưu Đãi Chào Mừng: Giảm 15% Khi Đặt Hẹn Online',
    titleEn: 'Welcome Special: 15% OFF Online Booking',
    code: 'WELCOME15',
    discountPercent: 15,
    descriptionVi: 'Áp dụng cho toàn bộ dịch vụ làm móng & spa cho lần đầu ghé tiệm',
    descriptionEn: 'Valid for all nail & spa services on your first visit',
    imageUrl: PRESET_BANNERS[0].url
  },
  {
    titleVi: 'Combo Tiết Kiệm: Giảm $10 Cho Gói Mani & Pedi',
    titleEn: 'Combo Special: $10 OFF Mani & Pedi',
    code: 'COMBOSAVE10',
    discountPercent: 10,
    descriptionVi: 'Áp dụng khi đặt cùng lúc dịch vụ làm móng tay và chăm sóc móng chân',
    descriptionEn: 'Applicable when booking manicure and pedicure together',
    imageUrl: PRESET_BANNERS[1].url
  },
  {
    titleVi: 'Happy Wednesday: Tặng Vẽ Móng Nghệ Thuật Miễn Phí',
    titleEn: 'Happy Wednesday: Free Custom Nail Art',
    code: 'FREEART',
    discountPercent: 20,
    descriptionVi: 'Tặng 2 ngón vẽ hoa hoặc chrome 3D vào các ngày Thứ Tư hàng tuần',
    descriptionEn: 'Free 2-finger hand-painted art or 3D chrome on Wednesdays',
    imageUrl: PRESET_BANNERS[3].url
  }
]

interface SitePromotionsEditorProps {
  promotions: SitePromotionDto[]
  onChange: (promotions: SitePromotionDto[]) => void
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

export const SitePromotionsEditor: React.FC<SitePromotionsEditorProps> = ({ promotions, onChange }) => {
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  const addPromotion = (template?: Partial<SitePromotionDto>) => {
    if (promotions.length >= 3) return
    const newPromo: SitePromotionDto = {
      id: `promo-${Date.now()}`,
      titleVi: template?.titleVi || 'Giảm 15% Cho Khách Đặt Lịch Hẹn Online',
      titleEn: template?.titleEn || '15% OFF Online Booking',
      descriptionVi: template?.descriptionVi || 'Áp dụng cho mọi dịch vụ làm móng và chăm sóc spa',
      descriptionEn: template?.descriptionEn || 'Valid for all services',
      code: template?.code || 'WELCOME15',
      discountPercent: template?.discountPercent || 15,
      imageUrl: template?.imageUrl || PRESET_BANNERS[0].url
    }
    onChange([...promotions, newPromo])
  }

  const removePromotion = (index: number) => {
    const next = [...promotions]
    next.splice(index, 1)
    onChange(next)
  }

  const updatePromotion = (index: number, field: keyof SitePromotionDto, value: any) => {
    const next = [...promotions]
    next[index] = { ...next[index], [field]: value }
    onChange(next)
  }

  const handleBannerUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploadingIdx(index)
      const url = await uploadImageSafely(file)
      if (url) {
        updatePromotion(index, 'imageUrl', url)
      }
    } catch (err) {
      logger.error('Failed to upload promotion banner:', err)
    } finally {
      setUploadingIdx(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Notice Banner */}
      <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 leading-relaxed">
          <strong className="font-bold">Lưu ý về Khuyến Mãi:</strong> Các chương trình khuyến mãi sẽ hiển thị dạng thẻ voucher nổi bật trên website. Khi khách đặt lịch hẹn hoặc mang mã coupon đến tiệm, nhân viên áp dụng giảm giá trực tiếp trên đơn POS. Khuyến mãi sẽ tự động ẩn khi qua ngày hết hạn (HSD).
        </div>
      </div>

      {/* Header & Quick Templates */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-bold text-base text-nexoraText flex items-center gap-2">
            <Ticket className="w-5 h-5 text-indigo-600" />
            <span>Chương Trình Khuyến Mãi & Voucher Ưu Đãi (Tối đa 3)</span>
          </h3>
          <p className="text-xs text-nexoraMuted mt-0.5">
            Tạo phiếu giảm giá thu hút khách đặt lịch hẹn online
          </p>
        </div>

        {promotions.length < 3 && (
          <button
            type="button"
            onClick={() => addPromotion()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow hover:bg-indigo-700 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Thêm Khuyến Mãi</span>
          </button>
        )}
      </div>

      {/* 1-Click Quick Preset Template Pills */}
      {promotions.length < 3 && (
        <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <span className="text-xs font-bold text-indigo-900 flex items-center gap-1.5 shrink-0">
            <Gift className="w-4 h-4 text-indigo-600" />
            Tạo Nhanh Bằng Mẫu Có Sẵn:
          </span>
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMO_TEMPLATES.map((tpl, i) => (
              <button
                key={i}
                type="button"
                onClick={() => addPromotion(tpl)}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tpl.code}: {tpl.titleVi?.split(':')[0]}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Promotion Cards */}
      <div className="space-y-6">
        {promotions.map((promo, idx) => (
          <div
            key={promo.id || idx}
            className="rounded-3xl bg-white border border-slate-200 shadow-md overflow-hidden"
          >
            {/* Card Header Bar */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white text-xs font-bold">
                  {idx + 1}
                </span>
                <span className="font-bold text-xs text-slate-800">
                  {promo.titleVi || `Khuyến Mãi #${idx + 1}`}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removePromotion(idx)}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xóa</span>
              </button>
            </div>

            {/* Split Voucher Body */}
            <div className="p-6 grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* LEFT: Visual Voucher Card Graphic (5 cols) */}
              <div className="xl:col-span-5 space-y-3">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Phiếu Ưu Đãi (Voucher Preview)
                </span>

                {/* Voucher Mockup Container */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 text-white">
                  {/* Banner Photo */}
                  <div className="relative w-full h-36 overflow-hidden">
                    {uploadingIdx === idx && (
                      <div className="absolute inset-0 bg-slate-900/85 backdrop-blur-xs flex flex-col items-center justify-center gap-1.5 z-20 animate-pulse">
                        <Loader2 className="w-6 h-6 text-indigo-400 animate-spin" />
                        <span className="text-xs font-bold text-white">Đang tải banner lên...</span>
                      </div>
                    )}
                    {promo.imageUrl ? (
                      <img src={promo.imageUrl} alt="Banner" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-800 flex items-center justify-center text-slate-400 text-xs">
                        (Chưa có ảnh banner)
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 shadow">
                        Ưu Đãi Đặc Biệt
                      </span>
                    </div>

                    {/* Change / Upload on hover */}
                    <label className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 hover:bg-indigo-600 text-white cursor-pointer transition-colors shadow">
                      <Upload className="w-3.5 h-3.5" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleBannerUpload(idx, e)}
                        disabled={uploadingIdx === idx}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Dashed Voucher Stub */}
                  <div className="p-3.5 bg-slate-950 border-t border-dashed border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-amber-400">
                      <Scissors className="w-3.5 h-3.5" />
                      <span className="font-mono text-xs font-bold tracking-widest uppercase">
                        MÃ: {promo.code || 'CHƯA ĐẶT MÃ'}
                      </span>
                    </div>
                    {promo.endDate && (
                      <span className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(promo.endDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Preset Banner Selector */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-indigo-500" />
                    Chọn nhanh banner mẫu:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {PRESET_BANNERS.map((preset) => {
                      const isSelected = promo.imageUrl === preset.url
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => updatePromotion(idx, 'imageUrl', preset.url)}
                          className={`relative h-14 rounded-xl overflow-hidden border-2 transition-all ${
                            isSelected
                              ? 'border-indigo-600 ring-2 ring-indigo-500/30 scale-[1.02]'
                              : 'border-slate-200 hover:border-slate-400'
                          }`}
                        >
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-indigo-600/40 flex items-center justify-center text-white">
                              <Check className="w-4 h-4" />
                            </div>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT: Detailed Information Form (7 cols) */}
              <div className="xl:col-span-7 space-y-4">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Thông Tin Chi Tiết Chương Trình
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Tiêu Đề Khuyến Mãi
                  </label>
                  <input
                    type="text"
                    value={promo.titleVi || ''}
                    onChange={(e) => updatePromotion(idx, 'titleVi', e.target.value)}
                    placeholder="VD: Ưu Đãi Chào Mừng: Giảm 15% Khi Đặt Hẹn Online"
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mã Coupon (Hiển thị cho khách)
                    </label>
                    <input
                      type="text"
                      value={promo.code || ''}
                      onChange={(e) => updatePromotion(idx, 'code', e.target.value.toUpperCase())}
                      placeholder="VD: WELCOME15"
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 font-mono font-bold uppercase focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Ngày Hết Hạn (Tự động ẩn)
                    </label>
                    <input
                      type="date"
                      value={promo.endDate ? promo.endDate.split('T')[0] : ''}
                      onChange={(e) => updatePromotion(idx, 'endDate', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                      className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Mô Tả Điều Kiện Áp Dụng
                  </label>
                  <textarea
                    rows={3}
                    value={promo.descriptionVi || ''}
                    onChange={(e) => updatePromotion(idx, 'descriptionVi', e.target.value)}
                    placeholder="VD: Áp dụng cho toàn bộ dịch vụ làm móng & spa cho lần đầu ghé tiệm..."
                    className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


