import { useTranslation } from '../../../../../contexts/LanguageContext'

/**
 * One bar per report row, used twice on the Service Income tab — once for net revenue and once for
 * completed count. The two charts sort independently, so `color` is derived from the row name by the
 * caller and is the same in both: colour is a stable handle on one service, not a rank.
 *
 * The layout switches with the row count, because a vertical bar chart does not survive a salon with
 * a hundred services:
 *  - collapsed (top N)  -> vertical bars, matching the report design
 *  - expanded (all rows) -> horizontal bars scrolling vertically, so 121 names stay readable at full
 *    width instead of forcing ten screens of sideways scrolling
 *
 * Every bar carries its value as a visible label, so no number is reachable only through hover, and
 * every bar is a real `<button>` so drill-down works from the keyboard.
 */
export type ServiceIncomeChartBar = {
  key: string
  label: string
  /** Parent service of an add-on row; rendered in the hover title, not on the axis. */
  parentLabel: string | null
  badge: string | null
  inactiveBadge: string | null
  value: number
  valueLabel: string
  /** The other chart's measure for this row — shown beside the bar when expanded. */
  secondaryLabel: string
  color: string
}

type Props = {
  title: string
  totalValue: string
  totalCaption: string
  bars: ServiceIncomeChartBar[]
  emptyLabel: string
  /** Null when the reader may not drill down (nothing to expand into). */
  onSelectBar: ((key: string) => void) | null
  expandLabel: string | null
  onToggleExpand: (() => void) | null
  isExpanded: boolean
  isStale: boolean
}

const TRACK_HEIGHT_CLASS = 'h-[132px]'

function hoverTitleOf(bar: ServiceIncomeChartBar): string {
  return [
    bar.parentLabel ? `${bar.parentLabel} — ${bar.label}` : bar.label,
    `${bar.valueLabel} · ${bar.secondaryLabel}`,
    bar.inactiveBadge,
  ]
    .filter(Boolean)
    .join('\n')
}

/** A nonzero row must stay visible even when it rounds to a sliver of the tallest bar. */
function fillPercent(value: number, maxValue: number): number {
  if (value <= 0) return 0
  return Math.max(3, (value / maxValue) * 100)
}

export default function ServiceIncomeBarChart({
  title,
  totalValue,
  totalCaption,
  bars,
  emptyLabel,
  onSelectBar,
  expandLabel,
  onToggleExpand,
  isExpanded,
  isStale,
}: Props) {
  const { t } = useTranslation()
  const maxValue = bars.reduce((max, bar) => Math.max(max, bar.value), 0)
  const titleId = `service-income-chart-${slug(title)}`

  return (
    <article className="nexora-card overflow-hidden" aria-labelledby={titleId}>
      <header className="flex flex-wrap items-end justify-between gap-3 border-b border-nexoraBorder px-4 py-3">
        <h3 id={titleId} className="text-sm font-extrabold text-nexoraText">
          {title}
        </h3>
        <div className="text-right">
          <strong className="block text-lg font-extrabold leading-none text-nexoraText">
            {totalValue}
          </strong>
          <span className="mt-1 block text-[10px] font-black uppercase tracking-wider text-nexoraMuted">
            {totalCaption}
          </span>
        </div>
      </header>

      {bars.length === 0 ? (
        <p className="px-4 py-10 text-center text-xs font-semibold text-nexoraMuted">{emptyLabel}</p>
      ) : (
        <div className={`transition-opacity ${isStale ? 'opacity-60' : 'opacity-100'}`}>
          {isExpanded ? (
            <HorizontalBars
              bars={bars}
              maxValue={maxValue}
              onSelectBar={onSelectBar}
              drillDownHint={t('components.dashboard.views.pos.reports.serviceIncome.chart.drillDownHint')}
            />
          ) : (
            <VerticalBars
              bars={bars}
              maxValue={maxValue}
              onSelectBar={onSelectBar}
              drillDownHint={t('components.dashboard.views.pos.reports.serviceIncome.chart.drillDownHint')}
            />
          )}

          {expandLabel && onToggleExpand ? (
            <div className="border-t border-nexoraBorder/70 px-4 py-2.5 text-center">
              <button
                type="button"
                onClick={onToggleExpand}
                aria-expanded={isExpanded}
                className="inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-extrabold text-nexoraBrandDark transition hover:bg-nexoraBrandSoft focus:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40"
              >
                {expandLabel}
              </button>
            </div>
          ) : null}
        </div>
      )}
    </article>
  )
}

type LayoutProps = {
  bars: ServiceIncomeChartBar[]
  maxValue: number
  onSelectBar: ((key: string) => void) | null
  drillDownHint: string
}

function VerticalBars({ bars, maxValue, onSelectBar, drillDownHint }: LayoutProps) {
  return (
    <div className="overflow-x-auto px-3 pb-3 pt-4">
      {/* items-stretch, not items-end: every column runs to the height of the tallest so the value
          labels and bar tracks share one baseline, and the taller name/badge stacks grow downwards
          instead of shoving their own bar up the card. */}
      <div className="flex min-w-full items-stretch gap-2">
        {bars.map((bar) => {
          const hoverTitle = hoverTitleOf(bar)
          const content = (
            <>
              <span className="text-xs font-extrabold text-nexoraText">{bar.valueLabel}</span>
              <span
                className={`relative w-full max-w-[68px] overflow-hidden rounded-lg bg-nexoraSurfaceMuted ${TRACK_HEIGHT_CLASS}`}
              >
                <span
                  className="absolute inset-x-0 bottom-0 rounded-t-md transition-[height]"
                  style={{
                    height: `${fillPercent(bar.value, maxValue)}%`,
                    backgroundColor: bar.color,
                  }}
                />
              </span>
              {/* justify-end keeps the badge row on one baseline across columns, so a two-line
                  service name pushes its own name up rather than its badge down. */}
              <span className="flex w-full flex-1 flex-col items-center justify-end gap-1">
                <span className="w-full break-words text-[11px] font-extrabold leading-tight text-nexoraText">
                  {bar.label}
                </span>
                {/* The band is reserved even with no badge, so an unbadged one-line name lands on
                    the same baseline as the last line of a wrapped one. */}
                <span className="flex min-h-4 flex-wrap justify-center gap-1">
                  <Badges bar={bar} />
                </span>
              </span>
            </>
          )

          const columnClass =
            'flex min-w-[92px] flex-1 shrink-0 flex-col items-center gap-2 rounded-xl px-1.5 pb-1.5 pt-0.5 text-center'

          return onSelectBar ? (
            <button
              key={bar.key}
              type="button"
              title={hoverTitle}
              onClick={() => onSelectBar(bar.key)}
              aria-label={`${hoverTitle.replace(/\n/g, ' · ')} — ${drillDownHint}`}
              className={`${columnClass} transition hover:bg-nexoraCanvas focus:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40`}
            >
              {content}
            </button>
          ) : (
            <div key={bar.key} title={hoverTitle} className={columnClass}>
              {content}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function HorizontalBars({ bars, maxValue, onSelectBar, drillDownHint }: LayoutProps) {
  // Capped height with vertical scroll: a hundred rows must not push the second chart off the page.
  return (
    <div className="max-h-[26rem] overflow-y-auto px-2 py-1.5">
      <ul className="space-y-0.5">
        {bars.map((bar) => {
          const hoverTitle = hoverTitleOf(bar)
          const content = (
            <>
              <span className="min-w-0 text-left">
                {/* Wraps on a phone and only truncates from `sm` up. Squeezing this into a narrow
                    column instead cut every name back to "Gel Manicure …" — losing the variant,
                    which is the only thing telling these rows apart. */}
                <span className="block break-words text-[11px] font-extrabold leading-tight text-nexoraText sm:truncate">
                  {bar.label}
                </span>
                <span className="mt-0.5 flex flex-wrap gap-1">
                  <Badges bar={bar} />
                </span>
              </span>
              {/* `sm:contents` promotes the bar and the value to grid cells of the row itself, so one
                  markup tree serves the stacked phone layout and the three-column desktop one. */}
              <span className="flex items-center gap-2 sm:contents">
                <span className="relative h-5 flex-1 overflow-hidden rounded-md bg-nexoraSurfaceMuted">
                  <span
                    className="absolute inset-y-0 left-0 rounded-r-md"
                    style={{
                      width: `${fillPercent(bar.value, maxValue)}%`,
                      backgroundColor: bar.color,
                    }}
                  />
                </span>
                <span className="w-[76px] shrink-0 text-right sm:w-auto">
                  <strong className="block text-[11px] font-extrabold tabular-nums text-nexoraText">
                    {bar.valueLabel}
                  </strong>
                  <span className="block text-[10px] font-semibold tabular-nums text-nexoraMuted">
                    {bar.secondaryLabel}
                  </span>
                </span>
              </span>
            </>
          )

          const rowClass =
            'flex w-full flex-col gap-1 rounded-lg px-2 py-1.5 sm:grid sm:grid-cols-[minmax(160px,1fr)_minmax(0,2.4fr)_minmax(88px,auto)] sm:items-center sm:gap-3'

          return (
            <li key={bar.key}>
              {onSelectBar ? (
                <button
                  type="button"
                  title={hoverTitle}
                  onClick={() => onSelectBar(bar.key)}
                  aria-label={`${hoverTitle.replace(/\n/g, ' · ')} — ${drillDownHint}`}
                  className={`${rowClass} transition hover:bg-nexoraCanvas focus:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40`}
                >
                  {content}
                </button>
              ) : (
                <div title={hoverTitle} className={rowClass}>
                  {content}
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Badges({ bar }: { bar: ServiceIncomeChartBar }) {
  return (
    <>
      {bar.badge ? (
        <span className="rounded-full bg-nexoraSurfaceMuted px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-nexoraMuted">
          {bar.badge}
        </span>
      ) : null}
      {bar.inactiveBadge ? (
        <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wide text-rose-600">
          {bar.inactiveBadge}
        </span>
      ) : null}
    </>
  )
}

function slug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'chart'
}
