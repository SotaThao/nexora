import React, { useEffect, useMemo, useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import { usePosReport } from '../../../../../data/hooks/usePosReport'
import posReportRepository, { type PosReportParams } from '../../../../../data/repositories/posReport'
import { PosReportMode } from '../../../../../constants/posReportMode'
import { formatPosTime } from '../posDateTime'
import PosReportPeriodPicker from './PosReportPeriodPicker'
import PosReportTable from './PosReportTable'
import {
  defaultSelectionFor,
  isSelectionComplete,
  type PosReportSelection,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report'

type Props = {
  businessId?: string
  isActive: boolean
  selection: PosReportSelection
  onSelectionChange: (next: PosReportSelection) => void
}

function toParams(businessId: string, selection: PosReportSelection): PosReportParams {
  return {
    businessId,
    mode: selection.mode,
    dates: selection.mode === PosReportMode.Daily ? selection.dates : undefined,
    weeks: selection.mode === PosReportMode.Weekly ? selection.weeks : undefined,
    month: selection.mode === PosReportMode.Monthly ? selection.month : undefined,
  }
}

export default function PosReportPanel({ businessId, isActive, selection, onSelectionChange }: Props) {
  const { t, currentLanguage } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(false)

  const params = useMemo(
    () => (businessId && isSelectionComplete(selection) ? toParams(businessId, selection) : null),
    [businessId, selection],
  )

  const reportQuery = usePosReport(params, { enabled: isActive })

  // The tab stays mounted while the user moves around Front Desk, so a return visit must refetch —
  // a checkout done on another tab changes these numbers.
  useEffect(() => {
    if (!isActive || !params) return
    if (!reportQuery.isFetching) void reportQuery.refetch()
    // Refetch on tab activation only, not on every query-object identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive])

  const data = reportQuery.data
  const rows = data?.rows ?? []
  const totals = data?.totals

  const handleExport = async () => {
    if (isExporting || !params) return
    setIsExporting(true)
    setExportError(false)
    try {
      const blob = await posReportRepository.exportStaffReportCsv(params)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `pos-report-${selection.mode.toLowerCase()}.csv`
      link.click()
      URL.revokeObjectURL(url)
    } catch {
      setExportError(true)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="space-y-3" aria-label={t(`${TK}.title`)} data-testid="report-panel">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-nexoraText">{t(`${TK}.title`)}</h2>
          <p className="mt-0.5 text-xs text-nexoraMuted">{t(`${TK}.subtitle`)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {data?.generatedAtUtc ? (
            <span className="text-[11px] font-semibold text-nexoraMuted">
              {t(`${TK}.updatedAt`, { time: formatPosTime(data.generatedAtUtc, currentLanguage) })}
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void reportQuery.refetch()}
            disabled={reportQuery.isFetching || !params}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas disabled:opacity-50"
          >
            {reportQuery.isFetching ? t(`${TK}.refreshing`) : t(`${TK}.refresh`)}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting || !params || rows.length === 0}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-bold text-white hover:bg-nexoraBrandDark disabled:opacity-50"
          >
            {isExporting ? t(`${TK}.exporting`) : t(`${TK}.exportCsv`)}
          </button>
        </div>
      </div>

      <PosReportPeriodPicker selection={selection} onChange={onSelectionChange} />

      {exportError ? (
        <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.exportError`)}</p>
      ) : null}

      {reportQuery.isPending && reportQuery.fetchStatus !== 'idle' ? (
        <div className="py-6"><SkeletonList count={4} lines={2} /></div>
      ) : null}

      {reportQuery.isError ? (
        <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface py-10 text-center">
          <p className="text-xs text-nexoraMuted">{t(`${TK}.error`)}</p>
          <button
            type="button"
            onClick={() => void reportQuery.refetch()}
            className="mt-2 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas"
          >
            {t(`${TK}.retry`)}
          </button>
        </div>
      ) : null}

      {!reportQuery.isError && data ? (
        <>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <StatTile label={t(`${TK}.kpi.serviceAmount`)} value={formatCurrency(totals?.serviceAmount ?? 0)} />
            <StatTile label={t(`${TK}.kpi.tips`)} value={formatCurrency(totals?.tips ?? 0)} />
            <StatTile label={t(`${TK}.kpi.techTakes`)} value={formatCurrency(totals?.techTakes ?? 0)} />
            <StatTile label={t(`${TK}.kpi.turns`)} value={String(totals?.turns ?? 0)} />
          </div>

          {rows.length === 0 ? (
            <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface py-10 text-center text-xs text-nexoraMuted">
              {t(`${TK}.empty`)}
            </div>
          ) : (
            <PosReportTable rows={rows} />
          )}
        </>
      ) : null}
    </section>
  )
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-nexoraBorder bg-nexoraSurface p-3">
      <div className="text-[10px] font-black uppercase tracking-wider text-nexoraMuted">{label}</div>
      <div className="mt-1 text-lg font-black tabular-nums text-nexoraText">{value}</div>
    </div>
  )
}

export { defaultSelectionFor }
