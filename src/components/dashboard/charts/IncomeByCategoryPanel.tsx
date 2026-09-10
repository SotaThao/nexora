import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { formatCurrency } from '../utils'
import {
  buildPeriodValueOptions,
  IncomeCategoryPeriod,
  type IncomeCategoryPeriodValue,
} from '../../../constants/incomeCategoryPeriod'
import {
  useMerchantIncomeByCategoryStats,
  useStaffIncomeByCategoryStats,
} from '../../../data/hooks/useTransactionCategories'

/** Distinct dot/bar colors, cycled by category position. "Uncategorized" always gets `UNCATEGORIZED_COLOR`. */
const CATEGORY_COLORS = [
  '#10B981', // emerald
  '#8B5CF6', // violet
  '#F43F5E', // rose
  '#3B82F6', // blue
  '#F59E0B', // amber
  '#14B8A6', // teal
  '#EC4899', // pink
  '#6366F1', // indigo
]
const UNCATEGORIZED_COLOR = '#94A3B8' // slate

const PERIOD_OPTIONS: { value: IncomeCategoryPeriodValue; labelKey: string }[] = [
  { value: IncomeCategoryPeriod.AllTime, labelKey: 'transaction_categories.period_all_time' },
  { value: IncomeCategoryPeriod.Week, labelKey: 'transaction_categories.period_week' },
  { value: IncomeCategoryPeriod.Month, labelKey: 'transaction_categories.period_month' },
  { value: IncomeCategoryPeriod.Year, labelKey: 'transaction_categories.period_year' },
]

/**
 * Income/Payout Categories (issue #584) — "Income by category" panel, reused by the Merchant
 * Overview tab, Merchant Category Management, Staff Earnings Overview, and Staff Category
 * Management (per tickets 4/5/7). Self-fetching: pass `scope` and it owns its own period state and
 * data — no prop-drilling through the host screen's existing data chain.
 */
export default function IncomeByCategoryPanel({
  scope,
  onManageCategories,
}: {
  scope: 'merchant' | 'staff'
  onManageCategories?: () => void
}) {
  const { t, currentLanguage } = useTranslation()

  const [period, setPeriod] = useState<IncomeCategoryPeriodValue>(IncomeCategoryPeriod.AllTime)
  const [periodKey, setPeriodKey] = useState('')

  const periodValueOptions = useMemo(
    () => buildPeriodValueOptions(period, currentLanguage),
    [period, currentLanguage],
  )
  const selectedOption = periodValueOptions.find((opt) => opt.key === periodKey) ?? periodValueOptions[0]

  const statsQuery = {
    period,
    year: selectedOption?.year,
    month: selectedOption?.month,
    week: selectedOption?.week,
  }

  const merchantStats = useMerchantIncomeByCategoryStats(statsQuery, { enabled: scope === 'merchant' })
  const staffStats = useStaffIncomeByCategoryStats(statsQuery, { enabled: scope === 'staff' })
  const { data: stats, isPending } = scope === 'merchant' ? merchantStats : staffStats

  const handlePeriodChange = (nextPeriod: IncomeCategoryPeriodValue) => {
    setPeriod(nextPeriod)
    const nextOptions = buildPeriodValueOptions(nextPeriod, currentLanguage)
    setPeriodKey(nextOptions[0]?.key ?? '')
  }

  const items = stats?.items ?? []
  const maxAmount = Math.max(1, ...items.map((item) => item.amount))

  return (
    <div className="card-elevated p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-black uppercase tracking-wider text-inkBlue dark:text-white">
            {t('transaction_categories.panel_title')}
          </h4>
          <p className="mt-0.5 text-xs text-nexoraMuted">{t('transaction_categories.panel_subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => handlePeriodChange(e.target.value as IncomeCategoryPeriodValue)}
            className="h-9 rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs font-bold text-nexoraText"
          >
            {PERIOD_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
          <select
            value={periodKey}
            onChange={(e) => setPeriodKey(e.target.value)}
            disabled={periodValueOptions.length === 0}
            className="h-9 rounded-lg border border-nexoraBorder bg-white px-2.5 text-xs font-bold text-nexoraText disabled:cursor-not-allowed disabled:opacity-60"
          >
            {periodValueOptions.length === 0 ? (
              <option value="">{t('transaction_categories.period_value_all')}</option>
            ) : (
              periodValueOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))
            )}
          </select>
          {onManageCategories ? (
            <button
              type="button"
              onClick={onManageCategories}
              className="h-9 shrink-0 whitespace-nowrap rounded-lg bg-nexoraBrand px-3 text-xs font-black uppercase tracking-wider text-white transition hover:bg-nexoraBrand/90"
            >
              {t('transaction_categories.manage_categories')}
            </button>
          ) : null}
        </div>
      </div>

      {isPending ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-nexoraBrand" />
        </div>
      ) : items.length === 0 ? (
        <p className="py-8 text-center text-xs text-nexoraMuted">{t('transaction_categories.panel_empty')}</p>
      ) : (
        <div className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
          {items.map((item, index) => {
            const label = item.categoryId ? item.categoryName : t('transaction_categories.uncategorized')
            const color = item.categoryId ? CATEGORY_COLORS[index % CATEGORY_COLORS.length] : UNCATEGORIZED_COLOR
            const barWidth = (item.amount / maxAmount) * 100
            return (
              <div key={item.categoryId ?? 'uncategorized'} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                    <span className="truncate text-sm font-bold text-nexoraText">{label}</span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-nexoraMuted">{formatCurrency(item.amount)}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${barWidth}%`, backgroundColor: color }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
