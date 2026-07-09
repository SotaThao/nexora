import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import PayoutsTab from './tabs/PayoutsTab'
import DisputesTab from './tabs/DisputesTab'

type TabId = 'payouts' | 'disputes'

export default function PayoutDisputeCenterView({
  ownerTaxYearId,
  ownerTaxYearStatus,
}: {
  ownerTaxYearId: string
  ownerTaxYearStatus: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('payouts')

  const isLocked = ownerTaxYearStatus === 'Locked'
  const canAdjust = ownerTaxYearStatus === 'Locked' || ownerTaxYearStatus === 'Exported'

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'payouts', labelKey: 'taxiq.payoutCenter.tabs.payouts' },
    { id: 'disputes', labelKey: 'taxiq.payoutCenter.tabs.disputes' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.payoutCenter.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.payoutCenter.subtitle')}</p>
      </div>

      {isLocked && (
        <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <span>{t('taxiq.payoutCenter.errors.lockedMessage')}</span>
          <button
            type="button"
            onClick={() => navigate('/dashboard/taxiq/export')}
            className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {t('taxiq.payoutCenter.errors.lockedAction')}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-nexoraBorder">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`rounded-t-lg px-4 py-2 text-xs font-bold transition-colors ${
              activeTab === tab.id
                ? 'border-b-2 border-nexoraBrand text-nexoraBrand'
                : 'text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t(tab.labelKey)}
          </button>
        ))}
      </div>

      {activeTab === 'payouts' && <PayoutsTab ownerTaxYearId={ownerTaxYearId} isLocked={isLocked} canAdjust={canAdjust} />}
      {activeTab === 'disputes' && <DisputesTab ownerTaxYearId={ownerTaxYearId} />}
    </div>
  )
}
