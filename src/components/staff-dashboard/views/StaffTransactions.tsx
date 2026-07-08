import { useCallback } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import ReportsView from '../../dashboard/views/ReportsView'
import StaffPayments from './StaffPayments'
import StaffPayouts from './StaffPayouts'

const TAB_TIPS = 'tips'
const TAB_DIRECT_PAYMENTS = 'direct_payments'
const TAB_PAYOUTS = 'payouts'

export default function StaffTransactions() {
  const { t } = useTranslation()
  const { paymentId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const activeTab =
    paymentId || searchParams.get('tab') === TAB_DIRECT_PAYMENTS
      ? TAB_DIRECT_PAYMENTS
      : searchParams.get('tab') === TAB_PAYOUTS
        ? TAB_PAYOUTS
      : TAB_TIPS

  const setActiveTab = useCallback(
    (tab: string) => {
      if (tab === TAB_DIRECT_PAYMENTS) {
        const next = new URLSearchParams(searchParams)
        next.set('tab', TAB_DIRECT_PAYMENTS)
        navigate(`/staff/payments?${next.toString()}`, { replace: true })
        return
      }
      if (tab === TAB_PAYOUTS) {
        navigate('/staff/payments?tab=payouts', { replace: true })
        return
      }
      navigate('/staff/payments?tab=tips', { replace: true })
    },
    [navigate, searchParams],
  )

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 border-b border-nexoraBorder pb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">
            {t('staff_dashboard.transactions.title')}
          </h2>
          <p className="mt-1 max-w-[22rem] text-xs leading-relaxed text-nexoraMuted">
            {activeTab === TAB_DIRECT_PAYMENTS
              ? t('staff_payments.description')
              : activeTab === TAB_PAYOUTS
                ? t('staff_payouts.description')
              : t('staff_dashboard.transactions.tips_subtitle')}
          </p>
        </div>

        <div className="flex w-full gap-1 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-1 sm:w-auto">
          {[
            { id: TAB_TIPS, label: t('dashboard.reports.tabs.tips') },
            { id: TAB_DIRECT_PAYMENTS, label: t('dashboard.reports.tabs.direct_payments') },
            { id: TAB_PAYOUTS, label: t('dashboard.reports.tabs.payouts') },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`h-9 min-w-0 flex-1 rounded-lg px-2 text-[10px] font-bold transition-all sm:flex-none sm:px-4 sm:text-xs ${
                activeTab === tab.id
                  ? 'bg-white font-black text-nexoraBrand shadow-sm'
                  : 'text-nexoraMuted hover:text-nexoraText'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === TAB_TIPS ? (
        <ReportsView audience="staff" showPageHeader={false} />
      ) : activeTab === TAB_DIRECT_PAYMENTS ? (
        <StaffPayments />
      ) : (
        <StaffPayouts />
      )}
    </div>
  )
}
