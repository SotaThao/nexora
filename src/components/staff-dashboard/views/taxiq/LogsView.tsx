import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import MileageLogTab from './tabs/MileageLogTab'
import CashTipLogTab from './tabs/CashTipLogTab'

type TabId = 'mileage' | 'cashTip'

export default function LogsView({
  staffTaxYearId,
  staffTaxYearStatus,
}: {
  staffTaxYearId: string
  staffTaxYearStatus: string
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<TabId>('mileage')
  const [lockedNoticeVisible, setLockedNoticeVisible] = useState(false)

  const isLocked = staffTaxYearStatus === 'Locked' || lockedNoticeVisible

  const tabs: { id: TabId; labelKey: string }[] = [
    { id: 'mileage', labelKey: 'taxiq.staffLogs.tabs.mileage' },
    { id: 'cashTip', labelKey: 'taxiq.staffLogs.tabs.cashTip' },
  ]

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.staffLogs.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.staffLogs.subtitle')}</p>
      </div>

      {isLocked && (
        <div className="flex flex-col gap-2 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
          <span>{t('taxiq.staffLogs.errors.lockedMessage')}</span>
          <button
            type="button"
            onClick={() => navigate('/staff/taxiq/export')}
            className="self-start rounded-lg bg-rose-600 px-3 py-1.5 text-[11px] font-bold text-white"
          >
            {t('taxiq.deductionCenter.errors.lockedAction')}
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

      {activeTab === 'mileage' && (
        <MileageLogTab staffTaxYearId={staffTaxYearId} isLocked={isLocked} onLockedError={() => setLockedNoticeVisible(true)} />
      )}
      {activeTab === 'cashTip' && (
        <CashTipLogTab staffTaxYearId={staffTaxYearId} isLocked={isLocked} onLockedError={() => setLockedNoticeVisible(true)} />
      )}
    </div>
  )
}
