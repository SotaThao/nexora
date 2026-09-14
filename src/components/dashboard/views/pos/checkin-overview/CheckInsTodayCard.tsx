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
      className="rounded-xl border border-nexoraBrand/30 bg-nexoraLavender/20 px-4 py-3 text-left shadow-sm transition hover:border-nexoraBrand/50"
    >
      <p className="text-base font-black text-nexoraBrandDark">
        {t(p + 'title', { count: summary?.totalCheckIns ?? 0 })}
      </p>
      <p className="mt-0.5 text-xs font-bold text-nexoraMuted">
        {t(p + 'breakdown', { newCount: summary?.newGuests ?? 0, returningCount: summary?.returningGuests ?? 0 })}
        {' → '}
        <span className="underline">{t(p + 'viewOverview')}</span>
      </p>
    </button>
  )
}
