import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useMerchantPayoutsList } from '../../../data/hooks/useMerchantPayouts'
import type { MerchantPayoutsListQuery } from '../../../data/repositories/payouts'
import type { StaffMember } from '../../../types/domain'
import { getPayoutStatusI18nKey, getPayoutTypeI18nKeys } from '../../../utils/payoutDisplay'
import { formatTransactionDateTime } from '../../dashboard/utils'
import CustomSelect from '../../CustomSelect'

function defaultYearRange() {
  const year = new Date().getFullYear()
  return { from: `${year}-01-01`, to: `${year}-12-31` }
}

function defaultMonthRange() {
  const now = new Date()
  const start = new Date(now.getFullYear(), now.getMonth(), 1)
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
  const toIso = (d: Date) => d.toISOString().slice(0, 10)
  return { from: toIso(start), to: toIso(end) }
}

export default function PayoutExportModal({
  isOpen,
  onClose,
  staffList,
}: {
  isOpen: boolean
  onClose: () => void
  staffList: StaffMember[]
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [periodKey, setPeriodKey] = useState('year')
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [staffProfileId, setStaffProfileId] = useState('all')

  useEffect(() => {
    if (!isOpen) return
    setPeriodKey('year')
    setCustomFrom('')
    setCustomTo('')
    setStaffProfileId('all')
  }, [isOpen])

  const staffExportOptions = useMemo(
    () => [
      { value: 'all', label: t('dashboard.tips.payouts_manager.filter_all_staff') },
      ...staffList
        .filter((s) => s.staffProfileId)
        .map((staff) => ({
          value: staff.staffProfileId as string,
          label: (staff.displayName || staff.fullName) as string,
        })),
    ],
    [staffList, t],
  )

  const range = useMemo(() => {
    if (periodKey === 'month') return defaultMonthRange()
    if (periodKey === 'custom') {
      if (!customFrom || !customTo) return null
      return { from: customFrom, to: customTo }
    }
    return defaultYearRange()
  }, [periodKey, customFrom, customTo])

  const exportQuery = useMemo<MerchantPayoutsListQuery | null>(() => {
    if (!range || range.from > range.to) return null
    return {
      page: 1,
      pageSize: 500,
      periodFrom: range.from,
      periodTo: range.to,
      ...(staffProfileId !== 'all' ? { staffProfileId } : {}),
    }
  }, [range, staffProfileId])

  const { data: exportPage, isPending, isFetching } = useMerchantPayoutsList(exportQuery ?? {}, {
    enabled: isOpen && Boolean(exportQuery),
  })

  const exportRows = exportPage?.items ?? []
  const isLoadingExport = isPending || isFetching

  if (!isOpen) return null

  const handleExport = () => {
    if (!exportQuery) {
      showToast(t('dashboard.tips.payouts_manager.export_period_required'), 'error')
      return
    }
    if (!exportRows.length) {
      showToast(t('dashboard.tips.payouts_manager.export_empty'), 'error')
      return
    }
    const header = [
      'PayoutCode',
      'Date',
      'Staff',
      'StaffCode',
      'Amount',
      'Method',
      'Types',
      'PeriodStart',
      'PeriodEnd',
      'Status',
    ]
    const rows = exportRows.map((row) => [
      row.payoutCode,
      formatTransactionDateTime(row.createdAt, currentLanguage),
      row.staffDisplayName,
      row.staffCode,
      String(row.amount),
      row.payoutMethodType,
      getPayoutTypeI18nKeys(row.payoutTypes).map((k) => t(k)).join('+'),
      row.periodStart,
      row.periodEnd,
      t(getPayoutStatusI18nKey(row.status)),
    ])
    const csv = [header, ...rows]
      .map((line) => line.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `payouts-${exportQuery.periodFrom}-${exportQuery.periodTo}.csv`
    link.click()
    URL.revokeObjectURL(url)
    showToast(t('dashboard.tips.payouts_manager.export_success'), 'success')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-nexoraBorder px-5 py-4">
          <div>
            <h3 className="text-base font-black text-inkBlue">{t('dashboard.tips.payouts_manager.export_title')}</h3>
            <p className="mt-1 text-xs text-mutedGrey">{t('dashboard.tips.payouts_manager.export_sub')}</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder p-2">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="space-y-2">
            {[
              { id: 'year', label: t('dashboard.tips.payouts_manager.export_year') },
              { id: 'month', label: t('dashboard.tips.payouts_manager.export_month') },
              { id: 'custom', label: t('dashboard.tips.payouts_manager.export_custom') },
            ].map((opt) => (
              <label key={opt.id} className="flex cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder px-3 py-2 text-sm font-semibold">
                <input type="radio" name="export-period" checked={periodKey === opt.id} onChange={() => setPeriodKey(opt.id)} />
                {opt.label}
              </label>
            ))}
            {periodKey === 'custom' ? (
              <div className="grid grid-cols-2 gap-2">
                <input type="date" className="h-9 rounded-lg border border-nexoraBorder px-2 text-sm" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
                <input type="date" className="h-9 rounded-lg border border-nexoraBorder px-2 text-sm" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-[11px] font-bold uppercase text-mutedGrey">{t('dashboard.tips.payouts_manager.field_staff')}</label>
            <CustomSelect
              value={staffProfileId}
              onChange={(e) => setStaffProfileId(e.target.value)}
              options={staffExportOptions}
            />
          </div>

          <p className="text-xs text-mutedGrey">
            {isLoadingExport
              ? t('dashboard.tips.payouts_manager.export_loading')
              : !exportQuery
                ? t('dashboard.tips.payouts_manager.export_period_required')
                : t('dashboard.tips.payouts_manager.export_preview', { count: exportRows.length })}
          </p>
        </div>

        <div className="flex justify-end gap-2 border-t border-nexoraBorder px-5 py-4">
          <button type="button" onClick={onClose} className="rounded-lg border border-nexoraBorder px-4 py-2 text-sm font-bold">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isLoadingExport || !exportQuery}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
          >
            {isLoadingExport ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t('dashboard.tips.payouts_manager.export_action')}
          </button>
        </div>
      </div>
    </div>
  )
}
