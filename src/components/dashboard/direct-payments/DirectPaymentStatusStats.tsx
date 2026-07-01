import { BarChart3, CreditCard, DollarSign, Percent, Receipt, TrendingUp } from 'lucide-react'
import { PaymentStatus } from '../../../types/domain'
import type { MerchantPaymentStats } from '../../../types/domain'
import { formatCurrency } from '../utils'
import Panel from '../../ui/Panel'
import {
  DIRECT_PAYMENT_STATUS_ORDER,
  getDirectPaymentStatusLabelKey,
} from '../../../utils/directPaymentStatus'

function toPercentLabel(value: number) {
  const num = Number(value) || 0
  const percent = num <= 1 ? num * 100 : num
  const rounded = Math.round(percent * 10) / 10
  return Number.isInteger(rounded) ? `${rounded}%` : `${rounded.toFixed(1)}%`
}

function statusBucketKey(status: number): keyof MerchantPaymentStats['byStatus'] {
  if (status === PaymentStatus.Confirmed) return 'confirmed'
  if (status === PaymentStatus.Completed) return 'completed'
  return 'initiated'
}

function StatsSkeleton() {
  return (
    <div className="space-y-3 sm:space-y-4">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-[88px] animate-pulse rounded-xl bg-nexoraBorder/50" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="h-[104px] animate-pulse rounded-xl bg-nexoraBorder/50" />
        ))}
      </div>
    </div>
  )
}

export default function DirectPaymentStatusStats({
  stats,
  isLoading = false,
  t,
  variant = 'merchant',
}: {
  stats?: MerchantPaymentStats
  isLoading?: boolean
  t: (key: string, params?: Record<string, unknown>) => string
  variant?: 'merchant' | 'staff'
}) {
  const prefix = variant === 'staff' ? 'staff_payments' : 'merchant_payments'

  if (isLoading && !stats) {
    return (
      <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/50 p-3 sm:p-4">
        <StatsSkeleton />
      </div>
    )
  }

  const data = stats ?? {
    totalCount: 0,
    totalAmount: 0,
    averageAmount: 0,
    conversionRate: 0,
    mostUsedMethod: null,
    byStatus: {
      initiated: { count: 0, totalAmount: 0 },
      confirmed: { count: 0, totalAmount: 0 },
      completed: { count: 0, totalAmount: 0 },
    },
    byPaymentMethod: [],
  }

  const summaryCards = [
    {
      key: 'total_count',
      label: t(`${prefix}.stats_total_count`),
      value: String(data.totalCount),
      icon: Receipt,
      borderClass: 'border-l-nexoraBrand',
      iconClass: 'text-nexoraBrand bg-nexoraBrandSoft',
    },
    {
      key: 'total_amount',
      label: t(`${prefix}.stats_total_amount`),
      value: formatCurrency(data.totalAmount),
      icon: DollarSign,
      borderClass: 'border-l-emerald-500',
      iconClass: 'text-emerald-600 bg-emerald-50',
    },
    {
      key: 'average_amount',
      label: t(`${prefix}.stats_average_amount`),
      value: formatCurrency(data.averageAmount),
      icon: TrendingUp,
      borderClass: 'border-l-sky-500',
      iconClass: 'text-sky-600 bg-sky-50',
    },
    {
      key: 'conversion_rate',
      label: t(`${prefix}.stats_conversion_rate`),
      value: toPercentLabel(data.conversionRate),
      icon: Percent,
      borderClass: 'border-l-violet-500',
      iconClass: 'text-violet-600 bg-violet-50',
    },
    {
      key: 'most_used_method',
      label: t(`${prefix}.stats_most_used_method`),
      value: data.mostUsedMethod || '—',
      icon: CreditCard,
      borderClass: 'border-l-amber-500',
      iconClass: 'text-amber-600 bg-amber-50',
    },
  ]

  return (
    <div className="space-y-3 rounded-xl border border-nexoraBorder bg-nexoraCanvas/50 p-3 sm:space-y-4 sm:p-4">
      <p className="text-right text-xs font-bold text-nexoraMuted sm:text-sm">
        {t(`${prefix}.stats_period_hint`)}
      </p>

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
        {summaryCards.map((card) => {
          const Icon = card.icon
          return (
            <Panel
              key={card.key}
              className={`flex min-h-[88px] items-center justify-between border-l-4 p-3 ${card.borderClass}`}
            >
              <div className="min-w-0 space-y-1">
                <p className="text-[9px] font-black uppercase tracking-wider text-nexoraSubtle sm:text-[10px]">
                  {card.label}
                </p>
                <p className="truncate text-lg font-black tracking-tight text-nexoraText sm:text-xl">
                  {card.value}
                </p>
              </div>
              <div className={`hidden shrink-0 rounded-lg p-2 sm:block ${card.iconClass}`}>
                <Icon className="h-4 w-4" />
              </div>
            </Panel>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {DIRECT_PAYMENT_STATUS_ORDER.map((status) => {
          const bucket = data.byStatus[statusBucketKey(status)]
          return (
            <div
              key={status}
              className="rounded-lg border border-nexoraBorder/70 bg-white px-3 py-2.5"
            >
              <p className="text-xs font-bold text-nexoraText">
                {t(getDirectPaymentStatusLabelKey(status, variant))}
              </p>
              <div className="mt-2 flex items-end justify-between gap-3">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-wide text-nexoraMuted">
                    {t(`${prefix}.stats_count`)}
                  </p>
                  <p className="text-lg font-black text-nexoraText">{bucket.count}</p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-nexoraMuted">
                    {t(`${prefix}.stats_amount`)}
                  </p>
                  <p className="text-sm font-black text-nexoraText">{formatCurrency(bucket.totalAmount)}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {data.byPaymentMethod.length > 0 ? (
        <div className="rounded-lg border border-nexoraBorder/70 bg-white p-3 sm:p-4">
          <div className="mb-3 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-nexoraMuted" />
            <p className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
              {t(`${prefix}.stats_by_method_title`)}
            </p>
          </div>
          <div className="space-y-2">
            {data.byPaymentMethod.map((item) => (
              <div
                key={item.method}
                className="flex items-center justify-between gap-3 rounded-lg bg-nexoraCanvas/60 px-3 py-2"
              >
                <span className="truncate text-xs font-bold text-nexoraText">
                  {item.method}
                </span>
                <div className="flex shrink-0 items-center gap-3 text-xs">
                  <span className="font-semibold text-nexoraMuted">
                    {t(`${prefix}.stats_count`)}: <span className="font-black text-nexoraText">{item.count}</span>
                  </span>
                  <span className="font-black text-nexoraText">{formatCurrency(item.totalAmount)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  )
}
