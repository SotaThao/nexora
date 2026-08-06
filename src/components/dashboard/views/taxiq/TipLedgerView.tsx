import { useMemo, useState } from 'react'
import { Pencil, Plus, Send, Trash2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqOwnerStaffList } from '../../../../data/hooks/useTaxiqOwnerPayouts'
import { useTipLedgerSummary } from '../../../../data/hooks/useTaxiqTipLedger'
import type { TipLedgerEntry, TipLedgerFilters, TipMethod, TipQualifiedStatus, TipSource } from '../../../../data/repositories/taxiqTipLedger'
import { TIP_METHODS, TIP_QUALIFIED_STATUSES, TIP_SOURCES } from '../../../../data/repositories/taxiqTipLedger'
import { SkeletonList } from '../../../ui/skeleton'
import TipQualifiedStatusBadge from './shared/TipQualifiedStatusBadge'
import AddEditTipModal from './modals/AddEditTipModal'
import DeleteTipModal from './modals/DeleteTipModal'
import ExportTipLedgerModal from './modals/ExportTipLedgerModal'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function TipLedgerView({ ownerTaxYearId }: { ownerTaxYearId?: string }) {
  const { t } = useTranslation()

  const staffListQuery = useTaxiqOwnerStaffList(ownerTaxYearId)
  const staffWithTaxYear = useMemo(
    () => (staffListQuery.data ?? []).filter((s) => s.hasStaffTaxYear && s.staffTaxYearId),
    [staffListQuery.data],
  )

  const [selectedStaffTaxYearId, setSelectedStaffTaxYearId] = useState<string>('')
  const [methodFilter, setMethodFilter] = useState<TipMethod | ''>('')
  const [sourceFilter, setSourceFilter] = useState<TipSource | ''>('')
  const [qualifiedFilter, setQualifiedFilter] = useState<TipQualifiedStatus | ''>('')

  const filters: TipLedgerFilters = {
    method: methodFilter || undefined,
    source: sourceFilter || undefined,
    qualifiedStatus: qualifiedFilter || undefined,
  }

  const summaryQuery = useTipLedgerSummary(selectedStaffTaxYearId || undefined, filters, 'owner')
  const summary = summaryQuery.data

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null)
  const [editingEntry, setEditingEntry] = useState<TipLedgerEntry | null>(null)
  const [deletingEntry, setDeletingEntry] = useState<TipLedgerEntry | null>(null)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)

  const selectedStaffName = staffWithTaxYear.find((s) => s.staffTaxYearId === selectedStaffTaxYearId)?.displayName

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.tipLedger.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.tipLedger.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            disabled={!selectedStaffTaxYearId}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            <Send className="h-3.5 w-3.5" />
            {t('taxiq.tipLedger.exportButton')}
          </button>
          <button
            type="button"
            onClick={() => setModalMode('add')}
            disabled={!selectedStaffTaxYearId}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.tipLedger.addButton')}
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-nexoraBorder bg-white p-4">
        <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.staffPickerLabel')}</label>
        {staffListQuery.isPending ? (
          <SkeletonList count={1} lines={1} />
        ) : (
          <select
            value={selectedStaffTaxYearId}
            onChange={(e) => setSelectedStaffTaxYearId(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            <option value="">{t('taxiq.tipLedger.staffPickerPlaceholder')}</option>
            {staffWithTaxYear.map((s) => (
              <option key={s.staffTaxYearId} value={s.staffTaxYearId as string}>
                {s.displayName}
              </option>
            ))}
          </select>
        )}
      </div>

      {!selectedStaffTaxYearId ? (
        <div className="rounded-xl border border-nexoraBorder bg-white p-8 text-center text-xs font-medium text-nexoraMuted">
          {t('taxiq.tipLedger.selectStaffPrompt')}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.today')}</div>
              <div className="text-xl font-extrabold text-nexoraText">{formatCurrency(summary?.todayTotal ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.monthToDate')}</div>
              <div className="text-xl font-extrabold text-nexoraText">{formatCurrency(summary?.monthToDateTotal ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.yearToDate')}</div>
              <div className="text-xl font-extrabold text-nexoraText">{formatCurrency(summary?.yearToDateTotal ?? 0)}</div>
            </div>
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.capUsed')}</div>
              <div className="text-xl font-extrabold text-nexoraText">{(summary?.capUsedPercent ?? 0).toFixed(1)}%</div>
              <div className="text-[10px] text-nexoraMuted">{formatCurrency(summary?.capUsedAmount ?? 0)} / $25,000</div>
            </div>
          </div>

          {summary && summary.ytdByMethod.length > 0 && (
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.tipLedger.ytdByMethod.title')}</h3>
              <div className="mt-2 overflow-x-auto">
                <table className="w-full min-w-[400px] text-left text-xs">
                  <thead className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                    <tr>
                      <th className="py-2 pr-4">{t('taxiq.tipLedger.ytdByMethod.method')}</th>
                      <th className="py-2 pr-4">{t('taxiq.tipLedger.ytdByMethod.total')}</th>
                      <th className="py-2 pr-4">{t('taxiq.tipLedger.ytdByMethod.count')}</th>
                      <th className="py-2 pr-4">{t('taxiq.tipLedger.ytdByMethod.average')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.ytdByMethod.map((row) => (
                      <tr key={row.method} className="border-t border-nexoraRule">
                        <td className="py-2 pr-4 font-bold text-nexoraText">{t(`taxiq.tipLedger.method.${row.method}`)}</td>
                        <td className="py-2 pr-4 text-nexoraText">{formatCurrency(row.total)}</td>
                        <td className="py-2 pr-4 text-nexoraText">{row.count}</td>
                        <td className="py-2 pr-4 text-nexoraText">{formatCurrency(row.average)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {summary && (
            <div className="rounded-xl border border-nexoraBorder bg-white p-4">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.tipLedger.qualifiedBreakdown.title')}</h3>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] font-bold uppercase text-emerald-600">{t('taxiq.tipLedger.qualifiedStatus.LikelyQualified')}</div>
                  <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary.qualifiedBreakdown.likelyQualifiedTotal)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-amber-600">{t('taxiq.tipLedger.qualifiedStatus.NeedsReview')}</div>
                  <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary.qualifiedBreakdown.needsReviewTotal)}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-500">{t('taxiq.tipLedger.qualifiedStatus.NotQualified')}</div>
                  <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary.qualifiedBreakdown.notQualifiedTotal)}</div>
                </div>
              </div>
            </div>
          )}

          <p className="text-[11px] font-medium text-nexoraMuted">{t('taxiq.tipLedger.disclaimer')}</p>

          <div className="flex flex-wrap gap-2">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value as TipMethod | '')}
              className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              <option value="">{t('taxiq.tipLedger.filters.allMethods')}</option>
              {TIP_METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`taxiq.tipLedger.method.${m}`)}
                </option>
              ))}
            </select>
            <select
              value={sourceFilter}
              onChange={(e) => setSourceFilter(e.target.value as TipSource | '')}
              className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              <option value="">{t('taxiq.tipLedger.filters.allSources')}</option>
              {TIP_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {t(`taxiq.tipLedger.source.${s}`)}
                </option>
              ))}
            </select>
            <select
              value={qualifiedFilter}
              onChange={(e) => setQualifiedFilter(e.target.value as TipQualifiedStatus | '')}
              className="rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              <option value="">{t('taxiq.tipLedger.filters.allQualifiedStatuses')}</option>
              {TIP_QUALIFIED_STATUSES.map((qs) => (
                <option key={qs} value={qs}>
                  {t(`taxiq.tipLedger.qualifiedStatus.${qs}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.date')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.method')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.amount')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.service')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.source')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.qualifiedStatus')}</th>
                  <th className="px-4 py-3">{t('taxiq.tipLedger.columns.proof')}</th>
                  <th className="px-4 py-3 text-right">{t('taxiq.tipLedger.columns.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {summaryQuery.isPending ? (
                  <tr>
                    <td colSpan={8} className="p-4">
                      <SkeletonList count={4} lines={1} />
                    </td>
                  </tr>
                ) : !summary || summary.entries.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                      {t('taxiq.tipLedger.emptyState')}
                    </td>
                  </tr>
                ) : (
                  summary.entries.map((entry) => (
                    <tr key={entry.id} className="border-t border-nexoraRule align-top">
                      <td className="px-4 py-3 font-bold text-nexoraText">{entry.date}</td>
                      <td className="px-4 py-3 text-nexoraText">{t(`taxiq.tipLedger.method.${entry.method}`)}</td>
                      <td className="px-4 py-3 text-nexoraText">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3 text-nexoraMuted">{entry.serviceType ?? '—'}</td>
                      <td className="px-4 py-3 text-nexoraText">{t(`taxiq.tipLedger.source.${entry.source}`)}</td>
                      <td className="px-4 py-3">
                        <TipQualifiedStatusBadge status={entry.qualifiedStatus} />
                      </td>
                      <td className="px-4 py-3 text-nexoraText">{t(`taxiq.tipLedger.proof.${entry.proof}`)}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center justify-end gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEntry(entry)
                              setModalMode('edit')
                            }}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            <Pencil className="h-3 w-3" />
                            {t('taxiq.tipLedger.actions.edit')}
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingEntry(entry)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                          >
                            <Trash2 className="h-3 w-3" />
                            {t('taxiq.tipLedger.actions.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {modalMode && ownerTaxYearId && selectedStaffTaxYearId && (
        <AddEditTipModal
          open
          mode={modalMode}
          onClose={() => {
            setModalMode(null)
            setEditingEntry(null)
          }}
          ownerTaxYearId={ownerTaxYearId}
          staffTaxYearId={selectedStaffTaxYearId}
          entry={modalMode === 'edit' ? editingEntry : null}
        />
      )}

      {deletingEntry && (
        <DeleteTipModal
          open
          onClose={() => setDeletingEntry(null)}
          entry={deletingEntry}
          staffTaxYearId={selectedStaffTaxYearId}
        />
      )}

      {isExportModalOpen && selectedStaffTaxYearId && (
        <ExportTipLedgerModal
          open
          onClose={() => setIsExportModalOpen(false)}
          staffTaxYearId={selectedStaffTaxYearId}
          staffName={selectedStaffName ?? ''}
        />
      )}
    </div>
  )
}
