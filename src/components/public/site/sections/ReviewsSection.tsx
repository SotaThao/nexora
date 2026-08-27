import React from 'react'
import { Star, Quote } from 'lucide-react'
import { MerchantSiteTemplateId, PublicSiteDto } from '../../../../constants/merchantSiteStatus'
import { SitePalette } from '../palettes'

interface ReviewsSectionProps {
  site: PublicSiteDto
  palette: SitePalette
  isMobileView?: boolean
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ site, palette, isMobileView }) => {
  const templateId = site.templateId || MerchantSiteTemplateId.Classic
  const reviews = [
    { name: 'Emily Watson', rating: 5, date: '2 ngày trước', comment: 'Dịch vụ làm móng xuất sắc! Thợ làm rất kỹ, sạch sẽ và nhẹ nhàng. Mình sẽ quay lại thường xuyên.' },
    { name: 'Michael Hernandez', rating: 5, date: '1 tuần trước', comment: 'Không gian sang trọng, bảng giá rõ ràng không chèo kéo. Đặt lịch online cực kỳ tiện lợi.' },
    { name: 'Sophia Davis', rating: 5, date: '2 tuần trước', comment: 'Mẫu nail art vẽ tay rất đẹp và đúng mẫu mình đưa. Giữ được gần 4 tuần không bị bong tróc!' }
  ]

  return (
    <section
      id="reviews"
      className={`border-t transition-colors scroll-mt-16 sm:scroll-mt-20 ${isMobileView ? 'py-8 px-4' : 'py-16 px-4 sm:px-6 lg:px-8'}`}
      style={{ backgroundColor: palette.bgSurface, color: palette.textPrimary }}
    >
      <div className="max-w-6xl mx-auto">
        <div className={`text-center max-w-2xl mx-auto ${isMobileView ? 'mb-6' : 'mb-12'}`}>
          <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ backgroundColor: '#FEF3C7', color: '#B45309' }}>
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>4.9 / 5.0 (128 Đánh Giá)</span>
          </div>
          <h2 className={`font-bold mb-2 ${isMobileView ? 'text-xl' : 'text-2xl sm:text-3xl'}`}>
            Khách Hàng Nói Gì Về Chúng Tôi
          </h2>
        </div>

        <div className={`grid gap-4 ${isMobileView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3 md:gap-6'}`}>
          {reviews.map((rev, idx) => (
            <div
              key={idx}
              className="p-6 rounded-3xl border flex flex-col justify-between shadow-sm transition-all hover:shadow-md"
              style={{
                backgroundColor: palette.bgPrimary,
                borderColor: palette.borderPrimary
              }}
            >
              <div>
                <Quote className="w-6 h-6 mb-3 opacity-40" style={{ color: palette.accentColor }} />
                <p className="text-xs sm:text-sm leading-relaxed mb-4" style={{ color: palette.textSecondary }}>"{rev.comment}"</p>
              </div>

              <div className="pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: palette.borderPrimary }}>
                <span className="font-bold">{rev.name}</span>
                <span className="text-[11px] opacity-75">{rev.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
