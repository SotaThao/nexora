import React from 'react'
import { Loader2, Star } from 'lucide-react'

export default function LeaveReview({
  t,
  rating,
  handleRatingChange,
  positiveTagKeys,
  negativeTagKeys,
  selectedTags,
  handleTagToggle,
  comment,
  setComment,
  handleSubmitFeedback,
  setStep,
  isSubmitting = false,
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="text-center space-y-1">
        <h2 className="font-sans text-xl font-bold tracking-wide text-nexoraText uppercase">
          {t('customer.rate_service_label')}
        </h2>
      </div>

      {/* Star Rating */}
      <div className="space-y-3">
        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map(val => (
            <button
              key={val}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleRatingChange(val)}
              className="p-1 hover:scale-110 transition disabled:cursor-not-allowed"
            >
              <Star
                className={`h-9 w-9 ${
                  val <= rating
                    ? 'fill-amber-500 text-amber-500 filter drop-shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                    : 'text-nexoraBorder hover:text-amber-300'
                }`}
              />
            </button>
          ))}
        </div>
        {/* Rating description */}
        <p className="text-center text-sm font-bold text-amber-600 animate-pulse">
          {t(`customer.rating_label_${rating}`)}
        </p>
      </div>

      {/* Quick Comment Chips */}
      <div className="space-y-2.5">
        <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">
          {rating >= 4 ? t('customer.quick_tags_positive_label') : t('customer.quick_tags_negative_label')}
        </label>
        <div className="flex flex-wrap gap-2">
          {(rating >= 4 ? positiveTagKeys : negativeTagKeys).map((key) => {
            const tagText = rating >= 4
              ? t(`customer.tags_positive.${key}`)
              : t(`customer.tags_negative.${key}`)
            const isSelected = selectedTags.includes(key)
            return (
              <button
                key={key}
                type="button"
                disabled={isSubmitting}
                onClick={() => handleTagToggle(key)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 active:scale-95 font-medium disabled:cursor-not-allowed disabled:opacity-60 ${
                  isSelected
                    ? 'bg-nexoraBrandSoft text-nexoraBrand border-nexoraBrand/30 shadow-sm shadow-nexoraBrandSoft/20'
                    : 'bg-nexoraCanvas hover:bg-nexoraSurfaceMuted text-nexoraMuted border border-nexoraBorder/50'
                }`}
              >
                {tagText}
              </button>
            )
          })}
        </div>
      </div>

      {/* Review Text */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold text-nexoraMuted uppercase tracking-widest">
          {t('customer.feedback_label')}
        </label>
        <textarea
          rows={3}
          disabled={isSubmitting}
          placeholder={t('customer.feedback_placeholder')}
          className="w-full bg-nexoraCanvas border border-nexoraBorder rounded-lg p-3 text-xs text-nexoraText placeholder-nexoraSubtle focus:outline-none focus:border-nexoraBrand focus:bg-white transition-all disabled:cursor-not-allowed disabled:opacity-60"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
      </div>

      {/* Buttons */}
      <div className="space-y-3 pt-2">
        <button
          type="button"
          aria-busy={isSubmitting}
          disabled={isSubmitting}
          onClick={handleSubmitFeedback}
          className="flex w-full items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 transition text-white font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-nexoraElectric/25 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {t('customer.submit_review_btn')}
        </button>
        <button
          type="button"
          disabled={isSubmitting}
          onClick={() => {
            if (rating >= 4) {
              setStep('google_yelp_review')
            } else {
              setStep('final_done')
            }
          }}
          className="w-full py-2 text-center text-xs font-bold text-nexoraSubtle hover:text-nexoraText transition disabled:cursor-not-allowed disabled:opacity-60"
        >
          {t('customer.skip_btn')}
        </button>
      </div>
    </div>
  )
}
