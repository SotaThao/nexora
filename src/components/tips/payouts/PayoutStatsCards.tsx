import { useMemo } from 'react'
import type { LucideIcon } from 'lucide-react'
import { CalendarDays, CircleDollarSign, Clock3, HandCoins } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../../dashboard/utils'
import type { MerchantPayoutStats } from '../../../types/domain'

const CARD_ICONS: Record<
  'all_time' | 'this_month' | 'pending' | 'unpaid_debt',
  { Icon: LucideIcon; box: string; iconClass: string }
> = {
  all_time: {
    Icon: CircleDollarSign,
    box: 'bg-emerald-50 ring-1 ring-emerald-100',
    iconClass: 'text-emerald-600',
  },
  this_month: {
    Icon: CalendarDays,
    box: 'bg-sky-50 ring-1 ring-sky-100',
    iconClass: 'text-sky-600',
  },
  pending: {
    Icon: Clock3,
    box: 'bg-amber-50 ring-1 ring-amber-100',
    iconClass: 'text-amber-600',
  },
  unpaid_debt: {
    Icon: HandCoins,
    box: 'bg-violet-50 ring-1 ring-violet-100',
    iconClass: 'text-violet-600',
  },
}

export default function PayoutStatsCards({
  stats,
  isLoading,
}: {
  stats?: MerchantPayoutStats
  isLoading?: boolean
}) {
  const { t, currentLanguage } = useTranslation()

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
      subClass: 'text-amber-600',
    },
    {
      key: 'unpaid_debt' as const,
      label: t('dashboard.tips.payouts_manager.stat_staff_paid'),
      value: formatCurrency(stats?.totalUnpaidDebt ?? 0),
      sub: t('dashboard.tips.payouts_manager.stat_staff_paid_sub', {
        count: stats?.staffWithDebt ?? 0,
      }),
      subClass: 'text-[#687381]',
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const { Icon, box, iconClass } = CARD_ICONS[card.key]
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
                className={`flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[10px] ${box}`}
                aria-hidden
              >
                <Icon className={`h-[18px] w-[18px] ${iconClass}`} strokeWidth={2.25} />
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
