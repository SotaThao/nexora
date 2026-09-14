import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useCheckInOverview } from '../../../../../data/hooks/usePosOrders'

export default function CheckInsTodayCard({
  businessId,
  onViewOverview,
}: {
  businessId: string
  onViewOverview: () => void
}) {
  const { t } = useTranslation()
  const p = 'components.dashboard.views.pos.checkinOverview.CheckInsTodayCard.'
  const { data } = useCheckInOverview(businessId, { pageNumber: 1, pageSize: 1 })
  const summary = data?.summary

  return (
    <button
      type="button"
      onClick={onViewOverview}
      className="rounded-xl border border-nexoraLavender bg-violet-50 px-4 py-3 text-left shadow-sm transition-colors hover:bg-violet-100"
    >
      <p className="text-base font-black text-violet-700">
        {t(p + 'title', { count: summary?.totalCheckIns ?? 0 })}
      </p>
      <p className="mt-0.5 text-xs font-bold text-violet-600">
        {t(p + 'breakdown', { newCount: summary?.newGuests ?? 0, returningCount: summary?.returningGuests ?? 0 })}
        {' → '}
        <span>{t(p + 'viewOverview')}</span>
      </p>
    </button>
  )
}
