import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  CircleDollarSign,
  Gift,
  Loader2,
  Sparkles,
  Star,
} from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../../dashboard/utils'
import TipsTrendChart from '../../dashboard/charts/TipsTrendChart'
import ReportsView from '../../dashboard/views/ReportsView'
import StaffPayouts from './StaffPayouts'
import { useStaffEarningsData } from '../hooks/useStaffEarningsData'

const TAB_OVERVIEW = 'overview'
const TAB_TRANSACTIONS = 'transactions'
const TAB_PAYOUTS = 'payouts'

const BREAKDOWN_ICONS = {
  tips: Sparkles,
  payments: CircleDollarSign,
  referral: Gift,
  bonuses: Star,
} as const

function BalanceCard({
  availableBalance,
  pendingAmount,
  lifetimeEarnings,
  isLoading,
  onWithdraw,
  t,
}: {
  availableBalance: number
  pendingAmount: number
  lifetimeEarnings: number
  isLoading: boolean
  onWithdraw: () => void
  t: (key: string, params?: Record<string, unknown>) => string
}) {
  return (
    <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#6C4DF6] via-[#5B4AE8] to-[#4648D8] p-5 text-white shadow-[0_16px_40px_rgba(70,72,216,0.28)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-white/75">
            {t('staff_earnings.available_balance')}
          </p>
          <p className="mt-1 text-3xl font-black tracking-tight">
            {isLoading ? '—' : formatCurrency(availableBalance)}
          </p>
        </div>
        <button
          type="button"
          onClick={onWithdraw}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-xs font-extrabold text-[#4648D8] shadow-sm transition hover:bg-white/95 active:scale-95"
        >
          {t('staff_earnings.withdraw')}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-4 border-t border-white/20 pt-4">
        <div>
          <p className="text-[11px] font-semibold text-white/70">{t('staff_earnings.pending')}</p>
          <p className="mt-1 text-lg font-bold">{isLoading ? '—' : formatCurrency(pendingAmount)}</p>
        </div>
        <div className="border-l border-white/20 pl-4">
          <p className="text-[11px] font-semibold text-white/70">{t('staff_earnings.lifetime_earnings')}</p>
          <p className="mt-1 text-lg font-bold">{isLoading ? '—' : formatCurrency(lifetimeEarnings)}</p>
        </div>
      </div>
    </div>
  )
}

function EarningsOverview({
  breakdownRows,
  thisWeekTotal,
  weekChangePct,
  isLoading,
  chartBars,
  svgMetrics,
  yTicks,
  chartRef,
  hoverIndex,
  setHoverIndex,
  activePoint,
  t,
}: ReturnType<typeof useStaffEarningsData> & { t: (key: string, params?: Record<string, unknown>) => string }) {
  const weekTrendLabel = useMemo(() => {
    if (isLoading) return '—'
    const rounded = Math.abs(weekChangePct).toFixed(1)
    if (weekChangePct > 0.05) {
      return t('staff_earnings.vs_last_week_up', { pct: rounded })
    }
    if (weekChangePct < -0.05) {
      return t('staff_earnings.vs_last_week_down', { pct: rounded })
    }
    return t('staff_earnings.vs_last_week_flat')
  }, [isLoading, weekChangePct, t])

  const weekTrendClass =
    weekChangePct > 0.05
      ? 'text-emerald-600'
      : weekChangePct < -0.05
        ? 'text-rose-600'
        : 'text-nexoraMuted'

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-sm">
        {breakdownRows.map((row, index) => {
          const Icon = BREAKDOWN_ICONS[row.id as keyof typeof BREAKDOWN_ICONS]
          const labelKey = `staff_earnings.breakdown_${row.id}` as const
          return (
            <div
              key={row.id}
              className={`flex items-center gap-3 px-4 py-3.5 ${
                index < breakdownRows.length - 1 ? 'border-b border-nexoraBorder/70' : ''
              }`}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#F3EEFF] text-[#6C4DF6]">
                <Icon className="h-4 w-4" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-nexoraText">{t(labelKey)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-nexoraText">
                  {isLoading ? '—' : formatCurrency(row.amount)}
                </p>
                <p className="text-[11px] font-semibold text-nexoraMuted">
                  {isLoading ? '—' : `${row.percent}%`}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-2xl border border-nexoraBorder bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-nexoraMuted">
              {t('staff_earnings.this_week')}
            </p>
            <p className="mt-1 text-2xl font-black text-nexoraText">
              {isLoading ? '—' : formatCurrency(thisWeekTotal)}
            </p>
          </div>
          <p className={`text-xs font-bold ${weekTrendClass}`}>{weekTrendLabel}</p>
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
          </div>
        ) : svgMetrics ? (
          <TipsTrendChart
            svgMetrics={svgMetrics}
            yTicks={yTicks}
            chartBars={chartBars}
            chartRef={chartRef}
            hoverIndex={hoverIndex}
            setHoverIndex={setHoverIndex}
            activePoint={activePoint}
          />
        ) : (
          <div className="flex h-40 items-center justify-center text-sm text-nexoraMuted">
            {t('staff_earnings.chart_empty')}
          </div>
        )}
      </div>
    </div>
  )
}

export default function StaffMyEarnings() {
  const { t, currentLanguage } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const earningsData = useStaffEarningsData(currentLanguage)

  const activeTab = searchParams.get('tab') === TAB_PAYOUTS
    ? TAB_PAYOUTS
    : searchParams.get('tab') === TAB_TRANSACTIONS
      ? TAB_TRANSACTIONS
      : TAB_OVERVIEW

  const setActiveTab = useCallback(
    (tab: string) => {
      if (tab === TAB_OVERVIEW) {
        navigate('/staff/earnings', { replace: true })
        return
      }
      navigate(`/staff/earnings?tab=${tab}`, { replace: true })
    },
    [navigate],
  )

  const tabs = useMemo(
    () => [
      { id: TAB_OVERVIEW, label: t('staff_earnings.tab_overview') },
      { id: TAB_TRANSACTIONS, label: t('staff_earnings.tab_transactions') },
      { id: TAB_PAYOUTS, label: t('staff_earnings.tab_payouts') },
    ],
    [t],
  )

  return (
    <div className="space-y-5">
      <BalanceCard
        availableBalance={earningsData.availableBalance}
        pendingAmount={earningsData.pendingAmount}
        lifetimeEarnings={earningsData.lifetimeEarnings}
        isLoading={earningsData.isLoading}
        onWithdraw={() => navigate('/staff/pay')}
        t={t}
      />

      <div className="border-b border-nexoraBorder">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`-mb-px border-b-2 pb-3 text-sm font-bold transition ${
                  isActive
                    ? 'border-nexoraBrand text-nexoraBrand'
                    : 'border-transparent text-nexoraMuted hover:text-nexoraText'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      {activeTab === TAB_OVERVIEW ? (
        <EarningsOverview {...earningsData} t={t} />
      ) : null}

      {activeTab === TAB_TRANSACTIONS ? (
        <ReportsView audience="staff" showPageHeader={false} />
      ) : null}

      {activeTab === TAB_PAYOUTS ? <StaffPayouts /> : null}
    </div>
  )
}
