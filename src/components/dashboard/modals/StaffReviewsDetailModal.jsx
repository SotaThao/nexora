import { X, Star } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

function StaffReviewsDetailModal({
  open,
  onClose,
  form,
  reviewsList,
  filteredReviewsList,
  averageRating,
  starCounts,
  reviewFilterRating,
  reviewFilterSource,
  reviewFilterOnlyCommented,
  setReviewFilterRating,
  setReviewFilterSource,
  setReviewFilterOnlyCommented
}) {
  const { currentLanguage } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-100 rounded-3xl max-w-lg w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
          title="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="text-left">
          <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
            {currentLanguage === 'vi' ? 'Đánh Giá & Uy Tín' : 'Reviews & Reputation'}
          </h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5 text-left">
            {currentLanguage === 'vi' ? `Hồ sơ đánh giá của ${form.fullName}` : `Feedback details for ${form.fullName}`}
          </p>
        </div>

        {/* Rating Summary Grid */}
        <div className="grid grid-cols-5 gap-4 items-center bg-slate-50/50 border border-slate-100 rounded-2xl p-4">
          {/* Average Score */}
          <div className="col-span-2 text-center border-r border-slate-200/60 pr-2">
            <div className="text-4xl font-black text-slate-800 tracking-tighter">
              {averageRating ? averageRating.toFixed(1) : '-.-'}
            </div>
            <div className="mt-1.5 flex justify-center items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4.5 w-4.5 ${
                    i < Math.round(averageRating) ? 'fill-current' : 'text-slate-200'
                  }`}
                />
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-2 tracking-wider">
              {currentLanguage === 'vi' ? `${reviewsList.length} đánh giá` : `${reviewsList.length} reviews`}
            </p>
          </div>

          {/* Star Distribution Bars */}
          <div className="col-span-3 space-y-1.5 pl-2">
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = starCounts[rating] || 0
              const pct = reviewsList.length ? (count / reviewsList.length) * 100 : 0
              return (
                <div key={rating} className="flex items-center gap-2 text-[10px] font-bold text-slate-600">
                  <span className="w-3 text-right">{rating}</span>
                  <Star className="h-3 w-3 text-amber-500 fill-current" />
                  <div className="flex-1 h-2 bg-slate-200/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-left font-mono text-slate-400">{count}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Filters */}
        <div className="space-y-2.5 text-left">
          <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
            {currentLanguage === 'vi' ? 'Bộ lọc nhanh' : 'Quick Filters'}
          </label>

          {/* Star Rating Filters */}
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              onClick={() => setReviewFilterRating('all')}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all border ${
                reviewFilterRating === 'all'
                  ? 'bg-slate-800 text-white border-slate-800'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {currentLanguage === 'vi' ? 'Tất cả' : 'All'}
            </button>
            {[5, 4, 3, 2, 1].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setReviewFilterRating(star.toString())}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all flex items-center gap-1 border ${
                  reviewFilterRating === star.toString()
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{star}</span>
                <Star className="h-3 w-3 fill-current" />
              </button>
            ))}
          </div>

          {/* Source Filters & Comment Filter */}
          <div className="flex flex-wrap gap-1.5 items-center justify-between">
            <div className="flex gap-1.5">
              {[
                { key: 'all', label: currentLanguage === 'vi' ? 'Tất cả nguồn' : 'All Sources' },
                { key: 'google', label: 'Google' },
                { key: 'yelp', label: 'Yelp' },
                { key: 'internal', label: currentLanguage === 'vi' ? 'Nội bộ' : 'Internal' }
              ].map((src) => (
                <button
                  key={src.key}
                  type="button"
                  onClick={() => setReviewFilterSource(src.key)}
                  className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                    reviewFilterSource === src.key
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {src.label}
                </button>
              ))}
            </div>

            {/* With Comments Only Checkbox */}
            <button
              type="button"
              onClick={() => setReviewFilterOnlyCommented(!reviewFilterOnlyCommented)}
              className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all border ${
                reviewFilterOnlyCommented
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {currentLanguage === 'vi' ? 'Có bình luận' : 'With Comments'}
            </button>
          </div>
        </div>

        {/* Filtered Reviews List */}
        <div className="space-y-3 max-h-[200px] overflow-y-auto pr-1">
          {filteredReviewsList.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs italic">
              {currentLanguage === 'vi'
                ? 'Không tìm thấy đánh giá phù hợp.'
                : 'No matching reviews found.'}
            </div>
          ) : (
            filteredReviewsList.map((rev) => {
              const isGoogle = rev.category?.toLowerCase().includes('google')
              const isYelp = rev.category?.toLowerCase().includes('yelp')

              return (
                <div key={rev.id} className="rounded-xl border border-slate-100 bg-white p-3 space-y-1.5 shadow-sm text-left transition hover:shadow">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${
                      isGoogle ? 'bg-blue-50 text-blue-600' :
                      isYelp ? 'bg-rose-50 text-rose-600' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      {isGoogle ? 'Google' : isYelp ? 'Yelp' : (currentLanguage === 'vi' ? 'Nội bộ' : 'Internal')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold">{rev.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className={`h-3 w-3 ${
                            i < rev.rating ? 'fill-current' : 'text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-700">{rev.rating}.0★</span>
                  </div>
                  {rev.comment ? (
                    <p className="text-[11px] text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-100/40 leading-relaxed text-left">
                      "{rev.comment}"
                    </p>
                  ) : (
                    <p className="text-[10px] text-slate-350 italic text-left">
                      {currentLanguage === 'vi' ? '(Chỉ đánh giá sao)' : '(Rating only)'}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2.5 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-extrabold uppercase bg-slate-150 hover:bg-slate-200 text-slate-600 rounded-lg transition"
          >
            {currentLanguage === 'vi' ? 'Đóng' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default StaffReviewsDetailModal
