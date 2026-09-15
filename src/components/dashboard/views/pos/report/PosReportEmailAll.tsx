import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Mail, X, XCircle } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useSendPosStaffReportEmailBulk } from '../../../../../data/hooks/usePosReport'
import type { PosStaffReportEmailBulkResultItem } from '../../../../../data/repositories/posReport'
import type { PosReportMode } from '../../../../../constants/posReportMode'
import { hasReportActivity, type TechnicianPrintReport } from './PosReportPrintAll'

const TK = 'components.dashboard.views.pos.report'

type Props = {
  businessId: string
  mode: PosReportMode
  periodKey: string
  reports: TechnicianPrintReport[]
  staffEmailByStaffId: Map<string, string>
  onClose: () => void
}

export default function PosReportEmailAll({
  businessId, mode, periodKey, reports, staffEmailByStaffId, onClose,
}: Props) {
  const { t } = useTranslation()
  const sendBulk = useSendPosStaffReportEmailBulk()

  const rows = useMemo(() => reports.map((report) => ({
    posStaffProfileId: report.detail.posStaffProfileId,
    displayName: report.displayName,
    email: staffEmailByStaffId.get(report.detail.posStaffProfileId) ?? '',
    hasActivity: hasReportActivity(report.detail),
  })), [reports, staffEmailByStaffId])

  const [selected, setSelected] = useState<Record<string, boolean>>({})
  useEffect(() => {
    setSelected(Object.fromEntries(
      rows.map((row) => [row.posStaffProfileId, Boolean(row.email) && row.hasActivity]),
    ))
  }, [rows])

  const selectedCount = rows.filter((row) => selected[row.posStaffProfileId]).length

  const handleToggleAll = (checked: boolean) => {
    setSelected(Object.fromEntries(
      rows.map((row) => [row.posStaffProfileId, checked && Boolean(row.email)]),
    ))
  }

  const handleSend = () => {
    const recipients = rows
      .filter((row) => selected[row.posStaffProfileId] && row.email)
      .map((row) => ({ posStaffProfileId: row.posStaffProfileId, email: row.email }))
    if (recipients.length === 0) return
    sendBulk.mutate({ businessId, mode, periodKey, skipEmptyReports: false, recipients })
  }

  const resultByStaffId = useMemo(() => {
    const map = new Map<string, PosStaffReportEmailBulkResultItem>()
    sendBulk.data?.forEach((item) => map.set(item.posStaffProfileId, item))
    return map
  }, [sendBulk.data])

  return createPortal(
    <div className="pos-report-detail-backdrop pos-invoice-modal-backdrop">
      <section className="pos-invoice-modal" role="dialog" aria-modal="true" aria-label={t(`${TK}.sendMailAll`)}>
        <header className="pos-invoice-modal-header">
          <div>
            <p className="text-[10px] font-black uppercase text-nexoraMuted">{t('components.dashboard.views.pos.PosOrderWorkspace.printPreviewLabel')}</p>
            <h2 className="text-lg font-black text-nexoraText">{t(`${TK}.sendMailAll`)}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={sendBulk.isPending} aria-label={t(`${TK}.detail.close`)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder disabled:opacity-50">
            <X className="h-4 w-4" />
          </button>
        </header>

        <label className="flex min-h-11 shrink-0 cursor-pointer items-center gap-2 border-b border-nexoraBorder px-4 py-2 text-xs font-semibold text-nexoraText">
          <input
            type="checkbox"
            checked={rows.length > 0 && selectedCount === rows.filter((row) => row.email).length}
            disabled={sendBulk.isPending}
            onChange={(event) => handleToggleAll(event.target.checked)}
            className="h-4 w-4 accent-nexoraBrand"
          />
          {t(`${TK}.emailAllSelectAll`, { count: selectedCount })}
        </label>

        <div className="pos-invoice-modal-body space-y-1.5">
          {rows.map((row) => {
            const result = resultByStaffId.get(row.posStaffProfileId)
            return (
              <div key={row.posStaffProfileId} className="flex items-center gap-2 rounded-lg border border-nexoraBorder px-3 py-2">
                <input
                  type="checkbox"
                  checked={Boolean(selected[row.posStaffProfileId])}
                  disabled={!row.email || sendBulk.isPending}
                  onChange={(event) => setSelected((prev) => ({ ...prev, [row.posStaffProfileId]: event.target.checked }))}
                  className="h-4 w-4 shrink-0 accent-nexoraBrand"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-nexoraText">{row.displayName}</p>
                  {row.email ? (
                    <p className="truncate text-[11px] text-nexoraMuted">{row.email}</p>
                  ) : (
                    <p className="truncate text-[11px] font-semibold text-amber-600">{t(`${TK}.emailAllMissingEmail`)}</p>
                  )}
                  {!row.hasActivity ? (
                    <p className="text-[11px] text-nexoraMuted">{t(`${TK}.emailAllEmptyReport`)}</p>
                  ) : null}
                </div>
                {result ? (
                  result.sent
                    ? <CheckCircle2 className="h-4 w-4 shrink-0 text-nexoraSuccess" aria-label={t(`${TK}.emailAllSent`)} />
                    : <XCircle className="h-4 w-4 shrink-0 text-nexoraDanger" aria-label={t(`${TK}.emailAllFailed`)} />
                ) : null}
              </div>
            )
          })}
        </div>

        <footer className="pos-invoice-modal-actions flex flex-col gap-2">
          {sendBulk.isError ? (
            <p className="text-xs font-semibold text-nexoraDanger" role="alert">{t(`${TK}.emailAllError`)}</p>
          ) : null}
          {sendBulk.isSuccess ? (
            <p className="text-xs font-semibold text-nexoraSuccess" role="status">{t(`${TK}.emailAllSuccess`)}</p>
          ) : null}
          <button
            type="button"
            disabled={sendBulk.isPending || selectedCount === 0}
            onClick={handleSend}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-5 text-xs font-bold text-white disabled:opacity-50"
          >
            <Mail className="h-4 w-4" />
            {sendBulk.isPending ? t(`${TK}.detail.sending`) : t(`${TK}.emailAllSend`, { count: selectedCount })}
          </button>
        </footer>
      </section>
    </div>,
    window.document.body,
  )
}
