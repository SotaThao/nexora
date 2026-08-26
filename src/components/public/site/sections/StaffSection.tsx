import React from 'react'
import { Users, Star } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface StaffSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  onSelectStaff?: (staffName: string) => void
  isMobileView?: boolean
}

export const StaffSection: React.FC<StaffSectionProps> = ({ site, palette, onSelectStaff, isMobileView }) => {
  const defaultStaffMembers = [
    { name: 'Sarah Nguyen', role: 'Master Nail Artist', exp: '8 năm kinh nghiệm', rating: 4.9, specialties: 'Ombre, Chrome, 3D Art', avatarUrl: null },
    { name: 'Jessica Tran', role: 'Spa & Gel Specialist', exp: '6 năm kinh nghiệm', rating: 5.0, specialties: 'Deluxe Pedicure, Dip Powder', avatarUrl: null },
    { name: 'David Le', role: 'Acrylic & Extension Pro', exp: '10 năm kinh nghiệm', rating: 4.8, specialties: 'Fullset Acrylic, Stiletto, Coffin', avatarUrl: null }
  ]

  const staffMembers = (site.staffList && site.staffList.length > 0)
    ? site.staffList.map((s) => ({
        name: s.name,
        role: s.role || 'Kỹ Thuật Viên Nail & Spa',
        exp: s.exp || 'Chuyên viên lành nghề',
        rating: s.rating ?? 5.0,
        specialties: s.specialties || 'Chăm sóc móng & Nail Art',
        avatarUrl: s.avatarUrl || null
      }))
    : defaultStaffMembers

  const templateId = site.templateId || MerchantSiteTemplateId.Classic

  // 1. MINIMALIST CLEAN (Zen Horizontal Flat Flow)
  if (templateId === MerchantSiteTemplateId.Minimal) {
    return (
      <section
        className={`border-t transition-colors ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
        style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
      >
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: palette.accentColor }}>
              NGHỆ NHÂN
            </span>
            <h2 className={`font-bold ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`} style={{ color: palette.textPrimary }}>
              Đội Ngũ Kỹ Thuật Viên
            </h2>
            <div className="w-12 h-0.5 mx-auto rounded-full" style={{ backgroundColor: palette.accentColor }} />
          </div>

          <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-3'}`}>
            {staffMembers.map((staff, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl border text-center flex flex-col items-center justify-between transition-all hover:bg-slate-50/50"
                style={{ borderColor: palette.borderPrimary, backgroundColor: palette.bgSurface }}
              >
                {staff.avatarUrl ? (
                  <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border shadow-xs" style={{ borderColor: palette.borderPrimary }}>
                    <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold mb-3 border"
                    style={{ backgroundColor: palette.bgPrimary, color: palette.textPrimary, borderColor: palette.borderPrimary }}
                  >
                    {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                )}

                <h3 className="font-bold text-sm" style={{ color: palette.textPrimary }}>{staff.name}</h3>
                <span className="text-[11px] font-medium" style={{ color: palette.accentColor }}>{staff.role}</span>
                <span className="text-[10px] mt-0.5 mb-3" style={{ color: palette.textSecondary }}>{staff.specialties}</span>

                <button
                  type="button"
                  onClick={() => onSelectStaff?.(staff.name)}
                  className="w-full py-1.5 px-3 rounded-full text-xs font-semibold border transition-colors mt-auto"
                  style={{ borderColor: palette.borderPrimary, color: palette.textPrimary }}
                >
                  Chọn Thợ
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    )
  }

  // 2. MODERN CHIC & 3. BOLD VIBRANT & 4. CLASSIC LUXE
  return (
    <section
      className={`border-t transition-colors ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgPrimary, borderColor: palette.borderPrimary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center max-w-2xl mx-auto ${isMobileView ? 'mb-6' : 'mb-12'}`}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-2" style={{ backgroundColor: palette.badgeBg, color: palette.badgeText }}>
            <Users className="w-3.5 h-3.5" />
            <span>Nghệ Nhân Lành Nghề</span>
          </div>
          <h2 className={`font-bold mb-2 ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`} style={{ color: palette.textPrimary }}>
            Đội Ngũ Kỹ Thuật Viên
          </h2>
          <p className="text-xs sm:text-sm" style={{ color: palette.textSecondary }}>Chọn thợ yêu thích để được phục vụ chu đáo và tận tâm nhất</p>
        </div>

        <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 md:gap-6'}`}>
          {staffMembers.map((staff, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border text-center transition-all hover:shadow-lg flex flex-col items-center"
              style={{
                backgroundColor: palette.bgSurface,
                borderColor: palette.borderPrimary
              }}
            >
              {staff.avatarUrl ? (
                <div className="w-20 h-20 rounded-full overflow-hidden mb-4 border-2 shadow-inner" style={{ borderColor: palette.accentColor }}>
                  <img src={staff.avatarUrl} alt={staff.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-xl font-bold mb-4 border-2 shadow-inner"
                  style={{ backgroundColor: palette.badgeBg, color: palette.badgeText, borderColor: palette.accentColor }}
                >
                  {staff.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
              )}

              <h3 className="font-bold text-lg mb-1" style={{ color: palette.textPrimary }}>{staff.name}</h3>
              <span className="text-xs font-medium mb-2" style={{ color: palette.accentColor }}>{staff.role}</span>
              <span className="text-xs mb-3" style={{ color: palette.textSecondary }}>{staff.specialties}</span>

              <div className="flex items-center gap-1 text-xs font-bold mb-4" style={{ color: '#F59E0B' }}>
                <Star className="w-4 h-4 fill-current" />
                <span>{staff.rating} / 5.0</span>
                <span className="text-[11px] font-normal" style={{ color: palette.textSecondary }}>({staff.exp})</span>
              </div>

              <button
                type="button"
                onClick={() => onSelectStaff?.(staff.name)}
                className={`w-full py-2.5 px-4 rounded-2xl text-xs font-bold transition-all shadow-xs mt-auto ${
                  templateId === MerchantSiteTemplateId.Modern
                    ? 'text-white hover:opacity-90 shadow-sm'
                    : 'border hover:bg-slate-50'
                }`}
                style={{
                  backgroundColor: templateId === MerchantSiteTemplateId.Modern ? palette.accentColor : 'transparent',
                  borderColor: palette.accentColor,
                  color: templateId === MerchantSiteTemplateId.Modern ? palette.buttonText : palette.accentColor
                }}
              >
                Đặt Lịch Với {staff.name.split(' ')[0]}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
