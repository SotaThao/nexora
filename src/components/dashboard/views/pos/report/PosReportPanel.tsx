import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Mail, Printer } from 'lucide-react'
import PosReportPrintAll, { type TechnicianPrintReport } from './PosReportPrintAll'
import PosReportEmailAll from './PosReportEmailAll'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import { usePosReport } from '../../../../../data/hooks/usePosReport'
import { useMerchantStaff } from '../../../../../data/hooks/useMerchantStaff'
import { useSessionRole } from '../../../../../auth/useSessionRole'
import posReportRepository, {
  type PosReportDetailParams,
  type PosReportParams,
  type PosReportRow,
} from '../../../../../data/repositories/posReport'
import { PosReportMode } from '../../../../../constants/posReportMode'
import PosReportPeriodPicker from './PosReportPeriodPicker'
import PosReportTable from './PosReportTable'
import PosReportDetailModal from './PosReportDetailModal'
import {
  defaultSelectionFor,
  isoWeekBounds,
  isSelectionComplete,
  parseIsoWeekKey,
  type PosReportSelection,
} from './posReportPeriod'

const TK = 'components.dashboard.views.pos.report'

type Props = {
  businessId?: string
  businessTimeZone: string
  isActive: boolean
  selection: PosReportSelection
  onSelectionChange: (next: PosReportSelection) => void
}

function toParams(
  businessId: string,
  selection: PosReportSelection,
  businessTimeZone: string,
): PosReportParams {
  return {
    businessId,
    timeZone: businessTimeZone,
    mode: selection.mode,
    dates: selection.mode === PosReportMode.Daily ? selection.dates : undefined,
    weeks: selection.mode === PosReportMode.Weekly ? selection.weeks : undefined,
    month: selection.mode === PosReportMode.Monthly ? selection.month : undefined,
  }
}

export default function PosReportPanel({
  businessId,
  businessTimeZone,
  isActive,
  selection,
  onSelectionChange,
}: Props) {
  const { t } = useTranslation()
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState(false)
  const [printError, setPrintError] = useState(false)
  const [isPreparingPrint, setIsPreparingPrint] = useState(false)
  const [printReports, setPrintReports] = useState<TechnicianPrintReport[] | null>(null)
  const printRequestRef = useRef(0)
  const preparingPrintRef = useRef(false)
  useEffect(() => {
    printRequestRef.current += 1
    preparingPrintRef.current = false
    setIsPreparingPrint(false)
    setPrintReports(null)
    setPrintError(false)
    return () => {
      printRequestRef.current += 1
    }
  }, [selection, businessId, businessTimeZone, isActive])

  const [detailRow, setDetailRow] = useState<PosReportRow | null>(null)
  const { isOwner, isStaff, session } = useSessionRole()
  const staffListQuery = useMerchantStaff({
    pageNumber: 1,
    pageSize: 20,
    keyword: detailRow?.displayName,
    enabled: isOwner && detailRow !== null,
  })

  const [isPreparingEmailAll, setIsPreparingEmailAll] = useState(false)
  const [emailAllError, setEmailAllError] = useState(false)
  const [emailAllReports, setEmailAllReports] = useState<TechnicianPrintReport[] | null>(null)
  const emailAllRequestRef = useRef(0)
  const preparingEmailAllRef = useRef(false)
  // The bulk roster (every technician's email, not just one) is only needed once the Send mail all
  // dialog is actually being prepared — Owner-only, same restriction as the single-technician roster read.
  const emailAllStaffQuery = useMerchantStaff({
    pageNumber: 1,
    pageSize: 200,
    enabled: isOwner && (isPreparingEmailAll || emailAllReports !== null),
  })

  const params = useMemo(
    () => (businessId && isSelectionComplete(selection)
      ? toParams(businessId, selection, businessTimeZone)
      : null),
    [businessId, businessTimeZone, selection],
  )

  const reportQuery = usePosReport(params, { enabled: isActive })

  useEffect(() => {
    setDetailRow(null)
  }, [selection])

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
  const staffEmailByStaffId = useMemo(() => {
    const map = new Map<string, string>()
    for (const row of rows) {
      const staff = emailAllStaffQuery.data?.items.find((item) =>
        String(item.linkId ?? item.staffLinkId ?? item.id ?? '') === row.businessStaffLinkId)
      const email = typeof staff?.email === 'string' ? staff.email.trim() : ''
      if (email) map.set(row.posStaffProfileId, email)
    }
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, emailAllStaffQuery.data?.items])
  const detailPeriod = useMemo(() => {
    if (selection.mode === PosReportMode.Daily) {
      const date = selection.dates[0]
      return date ? { key: date, start: date, end: date } : null
    }
    if (selection.mode === PosReportMode.Weekly) {
      const weekKey = selection.weeks[0]
      const parsed = parseIsoWeekKey(weekKey ?? '')
      return parsed && weekKey ? { key: weekKey, ...isoWeekBounds(parsed.year, parsed.week) } : null
    }
    return null
  }, [selection])
  const detailDefaultEmail = useMemo(() => {
    if (!detailRow) return ''
    const staff = staffListQuery.data?.items.find((item) =>
      String(item.linkId ?? item.staffLinkId ?? item.id ?? '') === detailRow.businessStaffLinkId,
    )
    if (typeof staff?.email === 'string' && staff.email.trim()) return staff.email

    // Staff-role report access cannot read the owner-only Merchant Staff roster. When the chosen
    // row unambiguously matches the signed-in staff member, their session email is a role-safe
    // existing source. Coworker rows stay blank until an API exposes those emails to this role.
    const normalizedName = detailRow.displayName.trim().toLocaleLowerCase()
    const matchingRows = rows.filter(
      (row) => row.displayName.trim().toLocaleLowerCase() === normalizedName,
    )
    const sessionName = session?.displayName?.trim().toLocaleLowerCase()
    return isStaff
      && matchingRows.length === 1
      && Boolean(sessionName)
      && sessionName === normalizedName
      && typeof session?.email === 'string'
      ? session.email
      : ''
  }, [detailRow, isStaff, rows, session?.displayName, session?.email, staffListQuery.data?.items])

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

  const handlePrintAll = async () => {
    if (preparingPrintRef.current || !data || !params || !rows.length || reportQuery.isFetching
      || reportQuery.isPlaceholderData || reportQuery.isError || !data.periods[0]) return
    const request = ++printRequestRef.current
    preparingPrintRef.current = true
    setIsPreparingPrint(true)
    setPrintError(false)
    setPrintReports(null)
    try {
      const reports = await posReportRepository.getStaffReportsForPrint(params, rows, data.periods[0])
      if (request === printRequestRef.current) setPrintReports(reports)
    } catch {
      if (request === printRequestRef.current) setPrintError(true)
    } finally {
      if (request === printRequestRef.current) {
        preparingPrintRef.current = false
        setIsPreparingPrint(false)
      }
    }
  }

  const canEmailAll = selection.mode !== PosReportMode.Monthly

  const handleOpenEmailAll = async () => {
    if (preparingEmailAllRef.current || !isOwner || !canEmailAll || !data || !params || !rows.length
      || reportQuery.isFetching || reportQuery.isPlaceholderData || reportQuery.isError || !data.periods[0]) return
    const request = ++emailAllRequestRef.current
    preparingEmailAllRef.current = true
    setIsPreparingEmailAll(true)
    setEmailAllError(false)
    setEmailAllReports(null)
    try {
      const reports = await posReportRepository.getStaffReportsForPrint(params, rows, data.periods[0])
      if (request === emailAllRequestRef.current) setEmailAllReports(reports)
    } catch {
      if (request === emailAllRequestRef.current) setEmailAllError(true)
    } finally {
      if (request === emailAllRequestRef.current) {
        preparingEmailAllRef.current = false
        setIsPreparingEmailAll(false)
      }
    }
  }

  return (
    <section className="space-y-3" aria-label={t(`${TK}.title`)} data-testid="report-panel">
      <div
        className="flex flex-wrap items-start justify-between gap-3"
        data-testid="technician-report-toolbar"
      >
        <PosReportPeriodPicker
          selection={selection}
          businessTimeZone={businessTimeZone}
          onChange={onSelectionChange}
        />
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePrintAll}
            disabled={isPreparingPrint || !params || !rows.length || !data?.periods.length || reportQuery.isFetching || reportQuery.isPlaceholderData || reportQuery.isError}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas disabled:opacity-50"
          >
            <Printer className="h-4 w-4" aria-hidden="true" />
            {t(`${TK}.${isPreparingPrint ? 'preparingPrint' : 'printAll'}`)}
          </button>
          <span title={!isOwner ? t(`${TK}.emailAllOwnerOnly`) : undefined} className="inline-flex">
            <button
              type="button"
              onClick={handleOpenEmailAll}
              disabled={!isOwner || !canEmailAll || isPreparingEmailAll || !params || !rows.length
                || !data?.periods.length || reportQuery.isFetching || reportQuery.isPlaceholderData || reportQuery.isError}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-xs font-bold text-nexoraText hover:bg-nexoraCanvas disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Mail className="h-4 w-4" aria-hidden="true" />
              {t(`${TK}.${isPreparingEmailAll ? 'preparingPrint' : 'sendMailAll'}`)}
            </button>
          </span>
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

      {exportError ? (
        <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.exportError`)}</p>
      ) : null}
      {printError ? (
        <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.printError`)}</p>
      ) : null}
      {emailAllError ? (
        <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.emailAllPrepareError`)}</p>
      ) : null}
      {isActive && printReports ? (
        <PosReportPrintAll reports={printReports} onClose={() => setPrintReports(null)} />
      ) : null}
      {isActive && emailAllReports && businessId && detailPeriod
        && (selection.mode === PosReportMode.Daily || selection.mode === PosReportMode.Weekly) ? (
        <PosReportEmailAll
          businessId={businessId}
          mode={selection.mode}
          periodKey={detailPeriod.key}
          reports={emailAllReports}
          staffEmailByStaffId={staffEmailByStaffId}
          onClose={() => setEmailAllReports(null)}
        />
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
            <PosReportTable rows={rows} mode={selection.mode} onView={setDetailRow} />
          )}
        </>
      ) : null}

      {detailRow && businessId && detailPeriod && selection.mode !== PosReportMode.Monthly ? (
        <PosReportDetailModal
          params={{
            businessId,
            posStaffProfileId: detailRow.posStaffProfileId,
            mode: selection.mode,
            periodKey: detailPeriod.key,
            displayName: detailRow.displayName,
            periodStart: detailPeriod.start,
            periodEnd: detailPeriod.end,
            timeZone: businessTimeZone,
          } satisfies PosReportDetailParams}
          displayName={detailRow.displayName}
          defaultEmail={detailDefaultEmail}
          onClose={() => setDetailRow(null)}
        />
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
