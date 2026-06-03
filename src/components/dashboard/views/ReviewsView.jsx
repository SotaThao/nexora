import { useState, useMemo } from 'react'
import { Star, ExternalLink, Lock } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { renderTextWithGoldStars } from '../utils'
import Panel from '../../ui/Panel'
import CustomSelect from '../../CustomSelect'

function ReviewsView({ reviews, staff, filter, setFilter, setupData }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [sourceFilter, setSourceFilter] = useState('all')
  const [starFilter, setStarFilter] = useState('all')

  // Reviews filtered ONLY by staff/technician, used for calculating filter counts
  const reviewsByStaff = useMemo(() => {
    return reviews.filter((review) => filter === 'all' || review.staffId === filter)
  }, [reviews, filter])

  const stats = useMemo(() => {
    if (!reviewsByStaff || reviewsByStaff.length === 0) {
      return { avg: '0.0', google: 0, yelp: 0, internal: 0 }
    }
    let sum = 0
    let google = 0
    let yelp = 0
    let internal = 0
    reviewsByStaff.forEach((r) => {
      sum += r.rating || 0
      const cat = r.category?.toLowerCase() || ''
      if (cat.includes('google')) {
        google++
      } else if (cat.includes('yelp')) {
        yelp++
      } else {
        internal++
      }
    })
    return {
      avg: (sum / reviewsByStaff.length).toFixed(1),
      google,
      yelp,
      internal
    }
  }, [reviewsByStaff])

  const counts = useMemo(() => {
    const total = reviewsByStaff.length
    let google = 0
    let yelp = 0
    let lowStars = 0
    const stars = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }

    reviewsByStaff.forEach((r) => {
      const cat = r.category?.toLowerCase() || ''
      if (cat.includes('google')) {
        google++
      } else if (cat.includes('yelp')) {
        yelp++
      }
      
      if ((r.rating || 0) <= 3) {
        lowStars++
      }

      if (r.rating >= 1 && r.rating <= 5) {
        stars[r.rating]++
      }
    })

    return {
      all: total,
      google,
      yelp,
      lowStars,
      stars
    }
  }, [reviewsByStaff])

  const reviewLinks = useMemo(() => {
    const defaultLinks = {
      googleReview: 'https://g.page/r/cGoldenGlowNails/review',
      yelpReview: 'https://www.yelp.com/biz/golden-glow-nails-palm-beach',
      feedbackEmail: 'manager@goldenglownails.com'
    }
    return setupData?.reviewLinks || defaultLinks
  }, [setupData])

  const filtered = useMemo(() => {
    return reviewsByStaff.filter((review) => {
      // 1. Source / Rating Filter
      let matchesSource = true
      if (sourceFilter === 'google') {
        matchesSource = review.category?.toLowerCase().includes('google')
      } else if (sourceFilter === 'yelp') {
        matchesSource = review.category?.toLowerCase().includes('yelp')
      } else if (sourceFilter === 'low_stars') {
        matchesSource = review.rating <= 3
      }

      // 2. Star Filter
      let matchesStar = true
      if (starFilter !== 'all') {
        matchesStar = review.rating === Number(starFilter)
      }

      return matchesSource && matchesStar
    })
  }, [reviewsByStaff, sourceFilter, starFilter])

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div className="pb-4 border-b border-nexoraBorder">
        <h2 className="text-xl font-extrabold text-nexoraText">{t('dashboard.menu.reviews')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{renderTextWithGoldStars(t('setup.review_routing_policy'))}</p>
      </div>

      {/* Overview Stats Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Panel className="p-4 flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-nexoraMuted uppercase tracking-widest">
              {t('dashboard.review_kpi.avg_rating') || 'Average Rating'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-nexoraText flex items-center gap-1">
              {stats.avg} <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </h3>
          </div>
        </Panel>
        <Panel className="p-4 flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-nexoraMuted uppercase tracking-widest">
              {t('dashboard.review_kpi.google_reviews') || 'Google Reviews'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-nexoraText">{stats.google}</h3>
          </div>
        </Panel>
        <Panel className="p-4 flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-nexoraMuted uppercase tracking-widest">
              {t('dashboard.review_kpi.yelp_reviews') || 'Yelp Reviews'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-nexoraText">{stats.yelp}</h3>
          </div>
        </Panel>
        <Panel className="p-4 flex items-center justify-between">
          <div>
            <small className="text-[10px] font-black text-nexoraMuted uppercase tracking-widest">
              {t('dashboard.review_kpi.internal_feedback') || 'Internal Feedback'}
            </small>
            <h3 className="mt-1 text-2xl font-black text-nexoraText">{stats.internal}</h3>
          </div>
        </Panel>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between bg-white p-3 rounded-xl border border-nexoraBorder/60 shadow-sm">
        {/* Left: Source Filters */}
        <div className="space-y-1 w-full lg:w-auto">
          <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraMuted block">
            {t('dashboard.review_kpi.review_source') || 'Review Source'}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: `${t('staff_detail.tab_all') || 'All'} (${counts.all})` },
              { id: 'google', label: `${t('dashboard.review_kpi.google_reviews') || 'Google'} (${counts.google})` },
              { id: 'yelp', label: `${t('dashboard.review_kpi.yelp_reviews') || 'Yelp'} (${counts.yelp})` },
              { id: 'low_stars', label: `${t('dashboard.review_kpi.low_stars_filter') || '3★ or below'} (${counts.lowStars})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSourceFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition cursor-pointer select-none ${
                  sourceFilter === tab.id
                    ? 'bg-nexoraBrand text-white shadow-sm'
                    : 'bg-nexoraSurfaceMuted text-nexoraMuted hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Star & Tech Dropdowns */}
        <div className="flex flex-col sm:flex-row gap-3 items-center shrink-0 w-full lg:w-auto">
          {/* Star Filter Dropdown */}
          <div className="space-y-1 w-full sm:w-48">
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraMuted block">
              {t('dashboard.review_kpi.star_rating') || 'Star Rating'}
            </span>
            <CustomSelect
              size="sm"
              className="font-semibold"
              buttonClass="h-9 px-3 text-xs"
              value={starFilter}
              onChange={(event) => setStarFilter(event.target.value)}
              options={[
                { value: 'all', label: `${t('dashboard.review_kpi.all_stars') || 'All Stars'} (${counts.all})` },
                ...[5, 4, 3, 2, 1].map((starNum) => ({
                  value: String(starNum),
                  label: `${starNum}★ (${counts.stars[starNum]})`
                }))
              ]}
            />
          </div>

          {/* Technician Dropdown */}
          <div className="space-y-1 w-full sm:w-48">
            <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraMuted block">
              {t('dashboard.activity_log.filter_staff') || 'Technician'}
            </span>
            <CustomSelect
              size="sm"
              className="font-semibold"
              buttonClass="h-9 px-3 text-xs"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              options={[
                { value: 'all', label: t('staff_detail.tab_all') },
                ...staff.map((member) => ({ value: member.id, label: member.nickname }))
              ]}
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <Panel className="p-8 text-center text-nexoraMuted font-medium text-xs">
            {t('staff_detail.no_reviews_matching') || 'No reviews matching the filter criteria.'}
          </Panel>
        ) : (
          filtered.map((review) => {
            const isGoogle = review.category?.toLowerCase().includes('google')
            const isYelp = review.category?.toLowerCase().includes('yelp')
            const isInternal = !isGoogle && !isYelp

            return (
              <Panel key={review.id} className="p-4 hover:shadow-premium transition-shadow duration-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Star rating rendering */}
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`h-3.5 w-3.5 ${
                              i < review.rating ? 'fill-current' : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-xs font-extrabold text-nexoraWarning">{review.rating}.0★</span>
                    </div>
                    <p className="text-sm text-nexoraText">"{review.comment}"</p>
                    <p className="text-xs text-nexoraMuted">{review.staffName} - {review.date}</p>
                  </div>

                  {/* Redirecting Logo Badges / Internal tag */}
                  <div className="self-end sm:self-start shrink-0">
                    {isGoogle && (
                      <a
                        href={reviewLinks.googleReview}
                        target="_blank"
                        rel="noreferrer"
                        title={t('common.view_on_google') || 'View on Google'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 hover:bg-slate-50 transition shadow-sm hover:scale-[1.03] duration-150 cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4" xmlns="http://www.w3.org/2000/svg">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                        </svg>
                        <span className="text-[10px] font-black uppercase text-nexoraText tracking-wider">{t('dashboard.review_kpi.google_reviews') || 'Google'}</span>
                        <ExternalLink className="h-3 w-3 text-nexoraMuted" />
                      </a>
                    )}
                    {isYelp && (
                      <a
                        href={reviewLinks.yelpReview}
                        target="_blank"
                        rel="noreferrer"
                        title={t('common.view_on_yelp') || 'View on Yelp'}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white px-2.5 py-1.5 hover:bg-slate-50 transition shadow-sm hover:scale-[1.03] duration-150 cursor-pointer"
                      >
                        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-[#D32323]" xmlns="http://www.w3.org/2000/svg">
                          <path d="m7.6885 15.1415-3.6715.8483c-.3769.0871-.755.183-1.1452.155-.2611-.0188-.5122-.0414-.7606-.213a1.179 1.179 0 0 1-.331-.3594c-.3486-.5519-.3656-1.3661-.3697-2.0004a6.2874 6.2874 0 0 1 .3314-2.0642 1.857 1.857 0 0 1 .1073-.2474 2.3426 2.3426 0 0 1 .1255-.2165 2.4572 2.4572 0 0 1 .1563-.1975 1.1736 1.1736 0 0 1 .399-.2831 1.082 1.082 0 0 1 .4592-.0837c.2355.0016.5139.052.91.1734.0555.0191.1237.0382.1856.0572.3277.1013.7048.2404 1.1499.3987.6863.2404 1.3663.487 2.0463.7397l1.2117.4423c.2217.0807.4363.18.6412.297.174.0984.3273.2298.4512.387a1.217 1.217 0 0 1 .192.4309 1.2205 1.2205 0 0 1-.872 1.4522c-.0468.0151-.0852.0239-.1085.0293l-1.105.2553-.0031-.001zM18.8208 7.565a1.8506 1.8506 0 0 0-.2042-.1754 2.4082 2.4082 0 0 0-.2077-.1394 2.3607 2.3607 0 0 0-.2269-.109 1.1705 1.1705 0 0 0-.482-.0796 1.0862 1.0862 0 0 0-.4498.1263c-.2107.1048-.4388.2732-.742.5551-.042.0417-.0947.0886-.142.133-.2502.2351-.5286.5252-.8599.863a114.6363 114.6363 0 0 0-1.5166 1.5629l-.8962.9293a4.1897 4.1897 0 0 0-.4466.5483 1.541 1.541 0 0 0-.2364.5459 1.2199 1.2199 0 0 0 .0107.4518l.0046.02a1.218 1.218 0 0 0 1.4184.923 1.162 1.162 0 0 0 .1105-.0213l4.7781-1.104c.3766-.087.7587-.1667 1.097-.3631.2269-.1316.4428-.262.5909-.5252a1.1793 1.1793 0 0 0 .1405-.4683c.0733-.6512-.2668-1.3908-.5403-1.963a6.2792 6.2792 0 0 0-1.2001-1.7103zM8.9703.0754a8.6724 8.6724 0 0 0-.83.1564c-.2754.066-.548.1383-.8146.2236-.868.2844-2.0884.8063-2.295 1.8065-.1165.5655.1595 1.1439.3737 1.66.2595.6254.614 1.1889.9373 1.7777.8543 1.5545 1.7245 3.0993 2.5922 4.6457.259.4617.5416 1.0464 1.043 1.2856a1.058 1.058 0 0 0 .1013.0383c.2248.0851.4699.1016.7041.0471a4.3015 4.3015 0 0 0 .0418-.0097 1.2136 1.2136 0 0 0 .5658-.3397 1.1033 1.1033 0 0 0 .079-.0822c.3463-.435.3454-1.0833.3764-1.6134.1042-1.771.2139-3.5423.3009-5.3142.0332-.6712.1055-1.3333.0655-2.0096-.0328-.5579-.0368-1.1984-.3891-1.6563-.6218-.8073-1.9476-.741-2.8523-.6158zm2.084 15.9505a1.1053 1.1053 0 0 0-1.2306-.4145 1.1398 1.1398 0 0 0-.1526.0633 1.4806 1.4806 0 0 0-.2171.1354c-.1992.1475-.3668.3392-.5196.5315-.0386.049-.074.1143-.12.1562l-.7686 1.0573a113.9168 113.9168 0 0 0-1.2913 1.789c-.278.3895-.5184.7184-.7083 1.0094-.036.0547-.0734.116-.1075.1647-.2277.3522-.3566.6092-.4228.8381a1.0945 1.0945 0 0 0-.046.4721c.0211.1655.0768.3246.1635.467.046.0715.0957.1406.1487.207a2.334 2.334 0 0 0 .1754.1825 1.843 1.843 0 0 0 .2108.1732c.5304.369 1.1112.6342 1.722.8391a6.0958 6.0958 0 0 0 1.5716.3004c.091.0046.1821.0025.2728-.006a2.3878 2.3878 0 0 0 .2506-.0351 2.3862 2.3862 0 0 0 .2447-.071 1.1927 1.1927 0 0 0 .4175-.2658c.1127-.113.1994-.249.2541-.3989.0889-.2214.1473-.5026.1857-.92.0034-.0593.0118-.1305.0177-.1958.0304-.3463.0443-.7531.0666-1.2315.0375-.7357.067-1.4681.0903-2.2026 0 0 .0495-1.3053.0494-1.306.0113-.3008.002-.6342-.0814-.9336a1.396 1.396 0 0 0-.1756-.4054zm8.6754 2.0439c-.1605-.176-.3878-.3514-.7462-.5682-.0518-.0288-.1124-.0674-.1684-.1009-.2985-.1795-.658-.3684-1.078-.5965a120.7615 120.7615 0 0 0-1.9427-1.042l-1.1515-.6107c-.0597-.0175-.1203-.0607-.1766-.0878-.2212-.1058-.4558-.2045-.6992-.2498a1.4915 1.4915 0 0 0-.2545-.0265 1.1527 1.1527 0 0 0-.1648.01 1.1077 1.1077 0 0 0-.9227.9133 1.4186 1.4186 0 0 0 .0159.439c.0563.3065.1932.6096.3346.875l.615 1.1526c.3422.65.6884 1.2963 1.0435 1.9406.229.4202.4196.7799.5982 1.078.0338.056.0721.1163.1011.1682.2173.3584.392.584.569.7458.1146.1107.252.195.4026.247.1583.0525.326.071.4919.0546a2.368 2.368 0 0 0 .251-.0435c.0817-.022.1622-.048.241-.0784a1.863 1.863 0 0 0 .2475-.1143 6.1018 6.1018 0 0 0 1.2818-.9597c.4596-.4522.8659-.9454 1.182-1.51.044-.08.0819-.163.1138-.2483a2.49 2.49 0 0 0 .0773-.2411c.0186-.083.033-.1669.0429-.2513a1.188 1.188 0 0 0-.0565-.491 1.0933 1.0933 0 0 0-.248-.4041z"/>
                        </svg>
                        <span className="text-[10px] font-black uppercase text-nexoraText tracking-wider">{t('dashboard.review_kpi.yelp_reviews') || 'Yelp'}</span>
                        <ExternalLink className="h-3 w-3 text-nexoraMuted" />
                      </a>
                    )}
                    {isInternal && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 px-2.5 py-1.5 text-[10px] font-extrabold uppercase select-none">
                        <Lock className="h-3 w-3" />
                        {t('staff_detail.private_recovery') || 'Internal Feedback'}
                      </span>
                    )}
                  </div>
                </div>
              </Panel>
            )
          })
        )}
      </div>
    </div>
  )
}

export default ReviewsView
