import { useMemo } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../../dashboard/utils'
import type { MerchantPayoutStats, MerchantPayoutStatsByStaffPage } from '../../../types/domain'

const CARD_ICONS = {
  all_time: { emoji: '💸', box: 'bg-[#f0fdf4]' },
  this_month: { emoji: '📅', box: 'bg-[#eff6ff]' },
  pending: { emoji: '⏳', box: 'bg-[#fffbeb]' },
  staff_paid: { emoji: '👥', box: 'bg-[#f5f3ff]' },
} as const

export default function PayoutStatsCards({
  stats,
  statsByStaff,
  isLoading,
}: {
  stats?: MerchantPayoutStats
  statsByStaff?: MerchantPayoutStatsByStaffPage
  isLoading?: boolean
}) {
  const { t, currentLanguage } = useTranslation()

  const staffPaidCount = useMemo(
    () => statsByStaff?.items.filter((item) => item.payoutCount > 0 || item.totalPaid > 0).length ?? 0,
    [statsByStaff],
  )

  const monthLabel = useMemo(() => {
    const now = new Date()
    return new Intl.DateTimeFormat(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      month: 'long',
      year: 'numeric',
    }).format(now)
  }, [currentLanguage])

  const cards = [
    {
      key: 'all_time' as const,
      label: t('dashboard.tips.payouts_manager.stat_all_time'),
      value: formatCurrency(stats?.totalPaidAllTime ?? 0),
      sub: null,
      subClass: '',
    },
    {
      key: 'this_month' as const,
      label: t('dashboard.tips.payouts_manager.stat_this_month'),
      value: formatCurrency(stats?.totalPaidThisMonth ?? 0),
      sub: monthLabel,
      subClass: 'text-[#687381]',
    },
    {
      key: 'pending' as const,
      label: t('dashboard.tips.payouts_manager.stat_pending'),
      value: formatCurrency(stats?.totalPendingAmount ?? 0),
      sub: t('dashboard.tips.payouts_manager.stat_pending_sub', {
        count: stats?.totalPendingCount ?? 0,
      }),
      subClass: 'text-[#d97706]',
    },
    {
      key: 'staff_paid' as const,
      label: t('dashboard.tips.payouts_manager.stat_staff_paid'),
      value: String(staffPaidCount),
      sub: t('dashboard.tips.payouts_manager.stat_staff_paid_sub'),
      subClass: 'text-[#687381]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const icon = CARD_ICONS[card.key]
        return (
          <div
            key={card.key}
            className="rounded-xl border border-[#dde5ef] bg-white p-5 shadow-[0_2px_8px_rgba(15,23,42,0.04)]"
          >
            <p className="text-[10px] font-extrabold uppercase tracking-[0.06em] text-[#4d5870]">
              {card.label}
            </p>
            <div className="mt-2.5 flex items-end justify-between gap-2">
              <p className="text-[22px] font-extrabold leading-none text-[#070e25]">
                {isLoading ? '—' : card.value}
              </p>
              <div
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] text-lg ${icon.box}`}
                aria-hidden
              >
                {icon.emoji}
              </div>
            </div>
            {card.sub ? (
              <p className={`mt-1.5 text-[11px] font-semibold ${card.subClass}`}>{card.sub}</p>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
