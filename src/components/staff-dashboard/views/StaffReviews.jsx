import { useMemo } from 'react'
import { Star, Lock, HelpCircle, MessageSquare } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useReviews } from '../../../data/hooks/useReviews'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-5 shadow-sm'

export default function StaffReviews() {
  const { t, currentLanguage } = useTranslation()
  const { tips, staffMember, kpis } = useStaffAccount()

  // Get reviews from TanStack Query cache (no direct localStorage read)
  const { data: allReviews = [] } = useReviews()
  const staffReviews = useMemo(
    () => allReviews.filter((r) => r.staffId === staffMember.id),
    [allReviews, staffMember.id]
  )

  // Aggregate stats
  const averageRating = useMemo(() => {
    if (!staffReviews.length) return 0
    const total = staffReviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0)
    return Math.round((total / staffReviews.length) * 10) / 10
  }, [staffReviews])

  const starCounts = useMemo(() => {
    const counts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    staffReviews.forEach((r) => {
      const rating = Math.round(Number(r.rating) || 5)
      if (counts[rating] !== undefined) {
        counts[rating]++
      }
    })
    return counts
  }, [staffReviews])

  return (
    <div className="space-y-4">
      {/* Summary Panel */}
      <section className={panel}>
        <h3 className="text-base font-extrabold text-nexoraText mb-4">
          {currentLanguage === 'vi' ? 'Đánh Giá & Xếp Hạng' : 'Reviews & Ratings'}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          {/* Average Rating Score */}
          <div className="text-center md:border-r border-slate-100 py-2">
            <div className="text-5xl font-black text-slate-800 tracking-tight">
              {averageRating ? averageRating.toFixed(1) : '-.-'}
            </div>
            
            <div className="mt-2 flex justify-center items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i < Math.round(averageRating) ? 'fill-current' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            
            <div className="text-xs font-semibold text-slate-400 mt-2">
              {currentLanguage === 'vi' 
                ? `Dựa trên ${staffReviews.length} lượt đánh giá`
                : `Based on ${staffReviews.length} reviews`}
            </div>
          </div>

          {/* Star Distribution Breakdown */}
          <div className="col-span-1 md:col-span-2 space-y-2">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = starCounts[stars] || 0
              const percentage = staffReviews.length ? Math.round((count / staffReviews.length) * 100) : 0
              return (
                <div key={stars} className="flex items-center gap-3 text-xs">
                  <span className="w-8 font-extrabold text-slate-500 text-right">{stars} ★</span>
                  <div className="flex-grow h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="w-8 text-slate-400 text-right font-bold">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Reviews List Panel */}
      <section className={panel}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
          <h4 className="text-sm font-black uppercase text-slate-700 tracking-wider">
            {currentLanguage === 'vi' ? 'Ý Kiến Khách Hàng' : 'Customer Reviews'}
          </h4>
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-1 rounded-md">
            <Lock className="h-3 w-3 shrink-0" />
            <span>{currentLanguage === 'vi' ? 'BẢO MẬT DANH TÍNH' : 'IDENTITY SECURED'}</span>
          </div>
        </div>

        {staffReviews.length === 0 ? (
          <div className="text-center py-10 text-slate-400 space-y-2">
            <MessageSquare className="h-10 w-10 mx-auto text-slate-200" />
            <p className="text-xs font-semibold">
              {currentLanguage === 'vi' ? 'Bạn chưa có đánh giá nào.' : 'No reviews received yet.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {staffReviews.map((review) => {
              const isGoogle = review.category?.toLowerCase().includes('google')
              const isYelp = review.category?.toLowerCase().includes('yelp')
              
              // Privacy-focused: determine name mask label
              const maskedName = currentLanguage === 'vi' ? 'Khách hàng ẩn danh' : 'Anonymous Customer'

              return (
                <div key={review.id} className="py-4 first:pt-0 last:pb-0 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                        <Lock className="h-3 w-3" />
                      </span>
                      <span className="text-xs font-black text-slate-700">{maskedName}</span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-bold">{review.date}</span>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Stars */}
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < review.rating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-amber-600">{review.rating}.0★</span>
                    
                    {/* Source Tag */}
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      isGoogle ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      isYelp ? 'bg-rose-50 text-rose-600 border border-rose-100' :
                      'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                      {isGoogle ? 'Google' : isYelp ? 'Yelp' : (currentLanguage === 'vi' ? 'Nội bộ' : 'Internal')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50 border border-slate-100/60 p-3 rounded-xl italic">
                    "{review.comment}"
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
