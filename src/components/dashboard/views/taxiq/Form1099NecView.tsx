import { useState } from 'react'
import { Download, FileText, Mail, RefreshCw, Send, Upload } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useForm1096Report,
  useForm1099NecSummary,
  useScanForm1099Nec,
} from '../../../../data/hooks/useTaxiqForm1099Nec'
import taxiqForm1099NecRepository from '../../../../data/repositories/taxiqForm1099Nec'
import type { Form1099NecListItem } from '../../../../data/repositories/taxiqForm1099Nec'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import Form1099NecStatusBadge from './shared/Form1099NecStatusBadge'
import SendForm1099NecCopyModal from './modals/SendForm1099NecCopyModal'
import SendForm1099NecBatchModal from './modals/SendForm1099NecBatchModal'
import EfileForm1099NecModal from './modals/EfileForm1099NecModal'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function Form1099NecView({ ownerTaxYearId }: { ownerTaxYearId?: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const [sendingForm, setSendingForm] = useState<Form1099NecListItem | null>(null)
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false)
  const [isEfileModalOpen, setIsEfileModalOpen] = useState(false)

  const summaryQuery = useForm1099NecSummary(ownerTaxYearId)
  const scanMutation = useScanForm1099Nec(ownerTaxYearId)
  const reportQuery = useForm1096Report(ownerTaxYearId)

  const summary = summaryQuery.data
  const items = summary?.items ?? []
  const readyItems = items.filter((i) => i.status === 'Ready')
  const deliveredItems = items.filter((i) => i.status === 'CopyDelivered')

  const handleError = (err: unknown, fallbackKey: string) => {
    const fallback = t(fallbackKey)
    const message = isApiError(err)
      ? (() => {
          const i18nKey = getErrorI18nKey(err.errorCode)
          const translated = t(i18nKey)
          return translated !== i18nKey ? translated : (err.message || fallback)
        })()
      : fallback
    showToast(message, 'error')
  }

  const handleScan = async () => {
    if (scanMutation.isPending) return
    try {
      const result = await scanMutation.mutateAsync()
      showToast(
        t('taxiq.form1099nec.scan.success', { created: result.created, updated: result.updated, skipped: result.skipped }),
        'success'
      )
    } catch (err) {
      handleError(err, 'taxiq.form1099nec.scan.errors.generic')
    }
  }

  const handleDownloadWorksheet = async (item: Form1099NecListItem) => {
    try {
      const blob = await taxiqForm1099NecRepository.getWorksheetPdfBlob(item.id)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `1099-nec-worksheet-${item.id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      handleError(err, 'taxiq.form1099nec.worksheet.errors.generic')
    }
  }

  const handleCreate1096Report = async () => {
    try {
      await reportQuery.refetch()
    } catch (err) {
      handleError(err, 'taxiq.form1099nec.report1096.errors.generic')
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.form1099nec.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.form1099nec.subtitle')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleScan}
            disabled={scanMutation.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${scanMutation.isPending ? 'animate-spin' : ''}`} />
            {t('taxiq.form1099nec.rescanButton')}
          </button>
          <button
            type="button"
            onClick={handleCreate1096Report}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
          >
            <FileText className="h-3.5 w-3.5" />
            {t('taxiq.form1099nec.create1096Button')}
          </button>
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            disabled={readyItems.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            <Mail className="h-3.5 w-3.5" />
            {t('taxiq.form1099nec.emailAllButton')}
          </button>
          <button
            type="button"
            onClick={() => setIsEfileModalOpen(true)}
            disabled={deliveredItems.length === 0}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            {t('taxiq.form1099nec.efileAllButton')}
          </button>
        </div>
      </div>

      {reportQuery.data && (
        <div className="rounded-xl border border-nexoraBorder bg-white p-4">
          <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.form1099nec.report1096.title')}</h3>
          <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.report1096.formCount')}</div>
              <div className="text-lg font-extrabold text-nexoraText">{reportQuery.data.formCount}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.report1096.totalServiceCommission')}</div>
              <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(reportQuery.data.totalServiceCommission)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.report1096.totalBox1bCashTips')}</div>
              <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(reportQuery.data.totalBox1bCashTips)}</div>
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.report1096.totalBox1a')}</div>
              <div className="text-lg font-extrabold text-nexoraText">{formatCurrency(reportQuery.data.totalBox1a)}</div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-nexoraBorder bg-white p-4">
          <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.metrics.totalForms')}</div>
          <div className="text-xl font-extrabold text-nexoraText">{summary?.totalForms ?? 0}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-4">
          <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.metrics.totalBox1a')}</div>
          <div className="text-xl font-extrabold text-nexoraText">{formatCurrency(summary?.totalBox1a ?? 0)}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-4">
          <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.metrics.readyToFile')}</div>
          <div className="text-xl font-extrabold text-nexoraText">{summary?.readyToFileCount ?? 0}/{summary?.totalForms ?? 0}</div>
        </div>
        <div className="rounded-xl border border-nexoraBorder bg-white p-4">
          <div className="text-[10px] font-bold uppercase text-nexoraMuted">{t('taxiq.form1099nec.metrics.w9OnFile')}</div>
          <div className="text-xl font-extrabold text-nexoraText">{summary?.w9OnFileCount ?? 0}/{summary?.totalForms ?? 0}</div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[1100px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.worker')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.tin')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.serviceCommission')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.box1b')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.box1a')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.box1c')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.box1d')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.w9')}</th>
              <th className="px-4 py-3">{t('taxiq.form1099nec.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.form1099nec.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {summaryQuery.isPending ? (
              <tr>
                <td colSpan={10} className="p-4">
                  <SkeletonList count={3} lines={1} />
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                  {t('taxiq.form1099nec.emptyState')}
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3">
                    <div className="font-bold text-nexoraText">{item.workerName}</div>
                    <div className="text-[11px] text-nexoraMuted">{item.workerEmail}</div>
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{item.maskedTin ?? '—'}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.serviceCommission)}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.box1bCashTips)}</td>
                  <td className="px-4 py-3">
                    <div className="font-bold text-nexoraText">{formatCurrency(item.box1aTotal)}</div>
                    <div className="text-[10px] text-nexoraMuted">{t('taxiq.form1099nec.includesBox1b')}</div>
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{item.box1cTtoc}</td>
                  <td className="px-4 py-3 text-nexoraText">{formatCurrency(item.box1dOvertime)}</td>
                  <td className="px-4 py-3 text-nexoraText">{t(`taxiq.form1099nec.w9Status.${item.w9Status}`)}</td>
                  <td className="px-4 py-3">
                    <Form1099NecStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => handleDownloadWorksheet(item)}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                      >
                        <Download className="h-3 w-3" />
                        {t('taxiq.form1099nec.actions.printNec')}
                      </button>
                      {(item.status === 'Ready' || item.status === 'CopyDelivered') && (
                        <button
                          type="button"
                          onClick={() => setSendingForm(item)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          <Send className="h-3 w-3" />
                          {item.status === 'CopyDelivered'
                            ? t('taxiq.form1099nec.actions.resend')
                            : t('taxiq.form1099nec.actions.email')}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {sendingForm && (
        <SendForm1099NecCopyModal
          open={!!sendingForm}
          onClose={() => setSendingForm(null)}
          form={sendingForm}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}

      {isBatchModalOpen && (
        <SendForm1099NecBatchModal
          open={isBatchModalOpen}
          onClose={() => setIsBatchModalOpen(false)}
          items={readyItems}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}

      {isEfileModalOpen && (
        <EfileForm1099NecModal
          open={isEfileModalOpen}
          onClose={() => setIsEfileModalOpen(false)}
          items={deliveredItems}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}
    </div>
  )
}
