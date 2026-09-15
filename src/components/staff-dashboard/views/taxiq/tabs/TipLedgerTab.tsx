import { useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useStaffBusinesses } from '../../../../../data/hooks/useStaffSelf'
import { useTipLedgerSummary } from '../../../../../data/hooks/useTaxiqTipLedger'
import Tooltip from '../../../../ui/Tooltip'
import { SkeletonList } from '../../../../ui/skeleton'
import TipQualifiedStatusBadge from '../../../../dashboard/views/taxiq/shared/TipQualifiedStatusBadge'
import AddTipAsStaffModal from '../modals/AddTipAsStaffModal'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function TipLedgerTab({
  staffTaxYearId,
  isLocked,
}: {
  staffTaxYearId: string
  isLocked: boolean
  onLockedError: () => void
}) {
  const { t } = useTranslation()
  const businessesQuery = useStaffBusinesses()
  const businesses = useMemo(() => businessesQuery.data ?? [], [businessesQuery.data])

  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('')
  const effectiveBusinessId = selectedBusinessId || businesses[0]?.businessId || ''

  const [isModalOpen, setIsModalOpen] = useState(false)

  const summaryQuery = useTipLedgerSummary(staffTaxYearId, undefined, 'staff')
  const summary = summaryQuery.data
  const entries = summary?.entries ?? []

  return (
    <div className="space-y-4">
      {businesses.length > 1 && (
        <div>
          <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.tipLedger.staffPickerLabel')}</label>
          <select
            value={effectiveBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
            className="mt-1 w-full max-w-sm rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
          >
            {businesses.map((b) => (
              <option key={b.businessId} value={b.businessId}>
                {b.businessName}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-nexoraBorder bg-white p-3">
          <div className="text-xs font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.today')}</div>
          <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary?.todayTotal ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-3">
          <div className="text-xs font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.monthToDate')}</div>
          <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary?.monthToDateTotal ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-3">
          <div className="text-xs font-bold uppercase text-nexoraMuted">{t('taxiq.tipLedger.metrics.yearToDate')}</div>
          <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(summary?.yearToDateTotal ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-3">
          <div className="inline-flex items-center gap-1 text-xs font-bold uppercase text-nexoraMuted">
            {t('taxiq.tipLedger.metrics.capUsed')}
            <Tooltip content={t('taxiq.tipLedger.disclaimer')} />
          </div>
          <div className="text-lg font-extrabold text-nexoraText">{(summary?.capUsedPercent ?? 0).toFixed(1)}%</div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          disabled={isLocked || !effectiveBusinessId}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
        >
          <Plus className="h-3.5 w-3.5" />
          {t('taxiq.tipLedger.addButton')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-xs font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.tipLedger.columns.date')}</th>
              <th className="px-4 py-3">{t('taxiq.tipLedger.columns.method')}</th>
              <th className="px-4 py-3">{t('taxiq.tipLedger.columns.amount')}</th>
              <th className="px-4 py-3">{t('taxiq.tipLedger.columns.source')}</th>
              <th className="px-4 py-3">{t('taxiq.tipLedger.columns.qualifiedStatus')}</th>
            </tr>
          </thead>
          <tbody>
            {summaryQuery.isPending ? (
              <tr>
                <td colSpan={5} className="p-4">
                  <SkeletonList count={4} lines={1} />
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.tipLedger.emptyState')}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{entry.date}</td>
                  <td className="px-4 py-3 text-nexoraText">{t(`taxiq.tipLedger.method.${entry.method}`)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(entry.amount)}</td>
                  <td className="px-4 py-3 text-nexoraText">{t(`taxiq.tipLedger.source.${entry.source}`)}</td>
                  <td className="px-4 py-3">
                    <TipQualifiedStatusBadge status={entry.qualifiedStatus} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.tipLedger.disclaimer')}</p>

      {isModalOpen && effectiveBusinessId && (
        <AddTipAsStaffModal
          open
          onClose={() => setIsModalOpen(false)}
          businessId={effectiveBusinessId}
          staffTaxYearId={staffTaxYearId}
        />
      )}
    </div>
  )
}
