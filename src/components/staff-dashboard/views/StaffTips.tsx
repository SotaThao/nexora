// StaffTips — tip activity list with statuses + an AI insight panel.
import { Sparkles } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const STATUS_STYLE = {
  Pending: 'bg-amber-50 text-amber-700',
  Completed: 'bg-emerald-50 text-emerald-600',
  Verified: 'bg-nexoraBrandSoft/60 text-nexoraBrand'
}

export default function StaffTips() {
  const { t } = useTranslation()
  const { tips } = useStaffAccount()

  const statusLabel = (s) => t(`staff_dashboard.tips.status.${s.toLowerCase()}`)

  return (
    <div className="space-y-4">
      <section className={panel}>
        <h3 className="mb-3 text-base font-extrabold text-nexoraText">{t('staff_dashboard.tips.activity')}</h3>
        {tips.length === 0 ? (
          <p className="py-4 text-center text-xs text-nexoraSubtle">{t('staff_dashboard.tips.empty')}</p>
        ) : (
          <div className="divide-y divide-nexoraBorder">
            {tips.map((tip) => (
              <div key={tip.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-bold text-nexoraText">${Number(tip.amount).toFixed(2)}</div>
                  <div className="truncate text-xs text-nexoraMuted">
                    {tip.paymentMethod} · {tip.businessName} · {tip.displayName}
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${STATUS_STYLE[tip.status] || ''}`}>
                  {statusLabel(tip.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={panel}>
        <h3 className="mb-2 flex items-center gap-2 text-base font-extrabold text-nexoraText">
          <Sparkles className="h-4 w-4 text-nexoraBrand" />
          {t('staff_dashboard.tips.ai_insight')}
        </h3>
        <p className="text-sm leading-relaxed text-nexoraMuted">{t('staff_dashboard.tips.ai_insight_body')}</p>
      </section>
    </div>
  )
}
