import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Archive, Eye, Loader2, Package, Send } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useArchiveFormsReport,
  useConfirmFormsReportReady,
  useFormsReports,
} from '../../../../data/hooks/useTaxiqFormsReports'
import type { FormsReportListItem } from '../../../../data/repositories/taxiqFormsReports'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import FormsReportStatusBadge from './shared/FormsReportStatusBadge'
import FormsReportPreviewModal from './modals/FormsReportPreviewModal'
import ShareFormsReportModal from './modals/ShareFormsReportModal'
import GenerateFormsReportPackageModal from './modals/GenerateFormsReportPackageModal'

export default function FormsReportsView({ ownerTaxYearId }: { ownerTaxYearId: string }) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { showToast } = useNotification()

  const listQuery = useFormsReports(ownerTaxYearId)
  const items = listQuery.data ?? []

  const confirmReady = useConfirmFormsReportReady(ownerTaxYearId)
  const archive = useArchiveFormsReport(ownerTaxYearId)

  const [previewId, setPreviewId] = useState<string | null>(null)
  const [shareItem, setShareItem] = useState<FormsReportListItem | null>(null)
  const [isGenerateOpen, setIsGenerateOpen] = useState(false)

  function handleError(err: unknown) {
    const fallback = t('taxiq.formsReports.errors.generic')
    const message = isApiError(err)
      ? (() => {
          const i18nKey = getErrorI18nKey(err.errorCode)
          const translated = t(i18nKey)
          return translated !== i18nKey ? translated : (err.message || fallback)
        })()
      : fallback
    showToast(message, 'error')
  }

  function handleConfirmReady(id: string) {
    confirmReady.mutate(id, {
      onSuccess: () => showToast(t('taxiq.formsReports.confirmReadySuccess'), 'success'),
      onError: handleError,
    })
  }

  function handleArchive(id: string) {
    archive.mutate(id, {
      onSuccess: () => showToast(t('taxiq.formsReports.archiveSuccess'), 'success'),
      onError: handleError,
    })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.formsReports.title')}</h2>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.formsReports.subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => setIsGenerateOpen(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          <Package className="h-3.5 w-3.5" />
          {t('taxiq.formsReports.actions.generatePackage')}
        </button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[900px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.report')}</th>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.period')}</th>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.records')}</th>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.source')}</th>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.due')}</th>
              <th className="px-4 py-3">{t('taxiq.formsReports.columns.status')}</th>
              <th className="px-4 py-3 text-right">{t('taxiq.formsReports.columns.actions')}</th>
            </tr>
          </thead>
          <tbody>
            {listQuery.isPending ? (
              <tr>
                <td colSpan={7} className="p-4">
                  <SkeletonList count={5} lines={1} />
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.reportType} className="border-t border-nexoraRule align-top">
                  <td className="px-4 py-3 font-bold text-nexoraText">{t(`taxiq.formsReports.reportName.${item.reportType}`)}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.periodLabel}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.records}</td>
                  <td className="px-4 py-3 text-nexoraMuted">{item.source}</td>
                  <td className="px-4 py-3 text-nexoraText">{item.dueLabel}</td>
                  <td className="px-4 py-3">
                    <FormsReportStatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      {item.reportType === 'Nec1099' ? (
                        <button
                          type="button"
                          onClick={() => navigate('/dashboard/taxiq/1099nec')}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                        >
                          <Eye className="h-3 w-3" />
                          {t('taxiq.formsReports.actions.viewIn1099Center')}
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => setPreviewId(item.formsReportId as string)}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            <Eye className="h-3 w-3" />
                            {t('taxiq.formsReports.actions.preview')}
                          </button>
                          {(item.status === 'Draft' || item.status === 'NeedsReview') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmReady(item.formsReportId as string)}
                              disabled={confirmReady.isPending}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:underline disabled:opacity-60"
                            >
                              {confirmReady.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                              {t('taxiq.formsReports.actions.confirmReady')}
                            </button>
                          )}
                          {item.status === 'Ready' && (
                            <>
                              <button
                                type="button"
                                onClick={() => setShareItem(item)}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                              >
                                <Send className="h-3 w-3" />
                                {t('taxiq.formsReports.actions.share')}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleArchive(item.formsReportId as string)}
                                disabled={archive.isPending}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraMuted hover:underline disabled:opacity-60"
                              >
                                <Archive className="h-3 w-3" />
                                {t('taxiq.formsReports.actions.archive')}
                              </button>
                            </>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {previewId && (
        <FormsReportPreviewModal open onClose={() => setPreviewId(null)} formsReportId={previewId} />
      )}

      {shareItem && (
        <ShareFormsReportModal
          open
          onClose={() => setShareItem(null)}
          ownerTaxYearId={ownerTaxYearId}
          formsReportId={shareItem.formsReportId as string}
          reportName={t(`taxiq.formsReports.reportName.${shareItem.reportType}`)}
        />
      )}

      {isGenerateOpen && (
        <GenerateFormsReportPackageModal
          open
          onClose={() => setIsGenerateOpen(false)}
          ownerTaxYearId={ownerTaxYearId}
        />
      )}
    </div>
  )
}
