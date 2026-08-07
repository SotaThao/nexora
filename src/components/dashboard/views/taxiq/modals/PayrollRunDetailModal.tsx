import { useState } from 'react'
import { CheckCircle2, Download, Loader2, X } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { usePayrollRun, useRerunPayrollRunValidation } from '../../../../../data/hooks/usePayrollRuns'
import payrollRunsRepository from '../../../../../data/repositories/payrollRuns'
import type { PayrollRun } from '../../../../../data/repositories/payrollRuns'
import { qk } from '../../../../../data/queryKeys'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import { PayrollRunStatusBadge } from '../PayrollRunsView'
import CancelPayrollRunModal from './CancelPayrollRunModal'

interface Props {
  businessId: string
  payrollRunId: string
  onClose: () => void
  onFinalize: (run: PayrollRun) => void
  onCreateCorrection: (run: PayrollRun) => void
  onOpenRun: (id: string) => void
}

function GateRow({ passed, label, detail, t }: { passed: boolean; label: string; detail?: string | null; t: (k: string) => string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-nexoraRule py-2 last:border-b-0">
      <div>
        <div className="text-xs font-bold text-nexoraText">{label}</div>
        {detail && <div className="text-[11px] text-nexoraMuted">{detail}</div>}
      </div>
      <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${passed ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
        {passed ? t('taxiq.payrollRuns.detailModal.validationGate.passed') : t('taxiq.payrollRuns.detailModal.validationGate.failed')}
      </span>
    </div>
  )
}

const CANCELLABLE_STATUSES = ['ValidationFailed', 'ReviewRequired', 'Approved']
const RERUNNABLE_STATUSES = ['ValidationFailed', 'ReviewRequired', 'Approved']

export default function PayrollRunDetailModal({ businessId, payrollRunId, onClose, onFinalize, onCreateCorrection, onOpenRun }: Props) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const runQuery = usePayrollRun(payrollRunId)
  const rerunValidation = useRerunPayrollRunValidation(businessId)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [isReporting, setIsReporting] = useState(false)

  const run = runQuery.data

  const handleRerun = async () => {
    if (rerunValidation.isPending) return
    try {
      await rerunValidation.mutateAsync(payrollRunId)
      showToast(t('taxiq.payrollRuns.savedNotice'), 'success')
    } catch (err) {
      const fallback = t('taxiq.payrollRuns.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      showToast(message, 'error')
    }
  }

  const handleReport = async () => {
    if (isReporting) return
    setIsReporting(true)
    try {
      const blob = await payrollRunsRepository.report(payrollRunId)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${run?.runCode ?? payrollRunId}-report.csv`
      link.click()
      URL.revokeObjectURL(url)
      showToast(t('taxiq.payrollRuns.reportedNotice'), 'success')
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRun(payrollRunId) })
      queryClient.invalidateQueries({ queryKey: qk.taxiqPayrollRuns(businessId) })
    } catch {
      showToast(t('taxiq.payrollRuns.errors.generic'), 'error')
    } finally {
      setIsReporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-extrabold text-nexoraText">
              {t('taxiq.payrollRuns.detailModal.title', { runCode: run?.runCode ?? '' })}
            </h2>
            {run && <PayrollRunStatusBadge status={run.status} />}
            {run?.runType === 'Bonus' && (
              <span className="inline-flex items-center rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600">
                {t('taxiq.payrollRuns.runType.Bonus')}
              </span>
            )}
          </div>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        {runQuery.isPending || !run ? (
          <div className="flex-1 overflow-y-auto">
            <SkeletonList count={3} lines={2} />
          </div>
        ) : (
          <div className="flex-1 space-y-5 overflow-y-auto">
            {(run.correctionOfRunId || run.correctionRunIds.length > 0) && (
              <div className="nexora-card space-y-1 p-4">
                {run.correctionOfRunId && (
                  <p className="text-xs font-semibold text-nexoraText">
                    {t('taxiq.payrollRuns.detailModal.correctionOf')}{' '}
                    <button type="button" onClick={() => onOpenRun(run.correctionOfRunId as string)} className="font-bold text-nexoraBrand hover:underline">
                      {t('taxiq.payrollRuns.detailModal.correctionViewLink')}
                    </button>
                  </p>
                )}
                {run.correctionRunIds.length > 0 && (
                  <p className="text-xs font-semibold text-nexoraText">
                    {t('taxiq.payrollRuns.detailModal.hasCorrections', { count: String(run.correctionRunIds.length) })}{' '}
                    {run.correctionRunIds.map((id, idx) => (
                      <span key={id}>
                        <button type="button" onClick={() => onOpenRun(id)} className="font-bold text-nexoraBrand hover:underline">
                          {t('taxiq.payrollRuns.detailModal.correctionRunViewLink')} {idx + 1}
                        </button>
                        {idx < run.correctionRunIds.length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                )}
              </div>
            )}

            <div className="nexora-card p-4">
              <h3 className="mb-2 text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.validationGate.title')}</h3>
              <GateRow
                passed={run.schemaIntegrityPassed}
                label={t('taxiq.payrollRuns.detailModal.validationGate.schemaIntegrity')}
                detail={run.schemaIntegrityDetail}
                t={t}
              />
              <GateRow
                passed={run.taxProfileReadinessPassed}
                label={t('taxiq.payrollRuns.detailModal.validationGate.taxProfileReadiness')}
                detail={run.taxProfileReadinessDetail}
                t={t}
              />
              <GateRow
                passed={run.ledgerReconciliationPassed}
                label={t('taxiq.payrollRuns.detailModal.validationGate.ledgerReconciliation')}
                detail={run.ledgerReconciliationDetail}
                t={t}
              />
            </div>

            <div>
              <h3 className="mb-2 text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.lineItems.title')}</h3>
              <div className="overflow-x-auto rounded-xl border border-nexoraBorder">
                <table className="w-full min-w-[700px] text-left text-xs">
                  <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                    <tr>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.employee')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.gross')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.taxable')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.employeeTax')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.employerTax')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.net')}</th>
                      <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.lineItems.columns.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {run.lineItems.map((li) => (
                      <tr key={li.id} className="border-t border-nexoraRule align-top">
                        <td className="px-3 py-2 font-bold text-nexoraText">{li.employeeName}</td>
                        <td className="px-3 py-2 text-nexoraText">{formatCurrency(li.gross)}</td>
                        <td className="px-3 py-2 text-nexoraText">{formatCurrency(li.taxable)}</td>
                        <td className="px-3 py-2 text-nexoraText">{formatCurrency(li.employeeTax)}</td>
                        <td className="px-3 py-2 text-nexoraText">{formatCurrency(li.employerTax)}</td>
                        <td className="px-3 py-2 font-bold text-nexoraText">{formatCurrency(li.net)}</td>
                        <td className="px-3 py-2">
                          {li.status === 'NeedsReview' ? (
                            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600" title={li.needsReviewReason ?? ''}>
                              {t('taxiq.payrollRuns.detailModal.lineItems.needsReviewStatus')}
                            </span>
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.taxBreakdown.title')}</h3>
              {run.taxBreakdown.length === 0 ? (
                <p className="text-[11px] text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.taxBreakdown.empty')}</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-nexoraBorder">
                  <table className="w-full min-w-[700px] text-left text-xs">
                    <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                      <tr>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.employee')}</th>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.jurisdiction')}</th>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.type')}</th>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.taxable')}</th>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.employeeAmount')}</th>
                        <th className="px-3 py-2">{t('taxiq.payrollRuns.detailModal.taxBreakdown.columns.employerAmount')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {run.taxBreakdown.map((entry) => (
                        <tr key={entry.entryCode} className="border-t border-nexoraRule">
                          <td className="px-3 py-2 font-bold text-nexoraText">{entry.employeeName}</td>
                          <td className="px-3 py-2 text-nexoraText">{entry.jurisdiction}</td>
                          <td className="px-3 py-2 text-nexoraText">{entry.type}</td>
                          <td className="px-3 py-2 text-nexoraText">{formatCurrency(entry.taxableAmount)}</td>
                          <td className="px-3 py-2 font-bold text-nexoraText">{formatCurrency(entry.employeeAmount)}</td>
                          <td className="px-3 py-2 font-bold text-nexoraText">{formatCurrency(entry.employerAmount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="nexora-card grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              <div>
                <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.runSummary.grossWages')}</div>
                <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(run.totalGross)}</div>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.runSummary.employeeTax')}</div>
                <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(run.totalEmployeeTax)}</div>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.runSummary.employerTax')}</div>
                <div className="text-sm font-extrabold text-nexoraText">{formatCurrency(run.totalEmployerTax)}</div>
              </div>
              <div>
                <div className="text-[10px] font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.runSummary.depositDue')}</div>
                <div className="text-sm font-extrabold text-nexoraText">{run.depositDue}</div>
              </div>
            </div>

            <div>
              <h3 className="mb-2 text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.auditTrail.title')}</h3>
              {run.auditTrail.length === 0 ? (
                <p className="text-[11px] text-nexoraMuted">{t('taxiq.payrollRuns.detailModal.auditTrail.empty')}</p>
              ) : (
                <ul className="space-y-1">
                  {run.auditTrail.map((entry, idx) => (
                    <li key={idx} className="text-[11px] text-nexoraMuted">
                      <span className="font-bold text-nexoraText">{entry.action}</span> — {new Date(entry.at).toLocaleString()}
                      {entry.notes && <span> — {entry.notes}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {run && (
          <div className="mt-6 flex flex-wrap justify-end gap-2">
            {RERUNNABLE_STATUSES.includes(run.status) && (
              <button
                type="button"
                onClick={handleRerun}
                disabled={rerunValidation.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
              >
                {rerunValidation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('taxiq.payrollRuns.detailModal.rerunButton')}
              </button>
            )}
            {CANCELLABLE_STATUSES.includes(run.status) && (
              <button
                type="button"
                onClick={() => setCancelOpen(true)}
                className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-bold text-rose-600"
              >
                {t('taxiq.payrollRuns.detailModal.cancelButton')}
              </button>
            )}
            {run.status === 'LedgerPosted' && (
              <button
                type="button"
                onClick={handleReport}
                disabled={isReporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
              >
                {isReporting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {t('taxiq.payrollRuns.reportButton')}
              </button>
            )}
            {run.status === 'LedgerPosted' && (
              <button
                type="button"
                onClick={() => onCreateCorrection(run)}
                className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
              >
                {t('taxiq.payrollRuns.detailModal.createCorrectionButton')}
              </button>
            )}
            {(run.status === 'ValidationFailed' || run.status === 'Approved') && (
              <button
                type="button"
                onClick={() => onFinalize(run)}
                className="rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white"
              >
                {t('taxiq.payrollRuns.finalizeButton')}
              </button>
            )}
          </div>
        )}
      </div>

      {cancelOpen && run && (
        <CancelPayrollRunModal
          businessId={businessId}
          run={run}
          onClose={() => setCancelOpen(false)}
          onCancelled={() => {
            setCancelOpen(false)
          }}
        />
      )}
    </div>
  )
}
