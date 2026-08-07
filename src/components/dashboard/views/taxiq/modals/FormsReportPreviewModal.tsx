import { X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useFormsReportPreview } from '../../../../../data/hooks/useTaxiqFormsReports'
import { SkeletonList } from '../../../../ui/skeleton'
import FormsReportStatusBadge from '../shared/FormsReportStatusBadge'

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
}

export default function FormsReportPreviewModal({
  open,
  onClose,
  formsReportId,
}: {
  open: boolean
  onClose: () => void
  formsReportId: string
}) {
  const { t } = useTranslation()
  const previewQuery = useFormsReportPreview(formsReportId)
  const preview = previewQuery.data

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.formsReports.preview.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {previewQuery.isPending ? (
            <SkeletonList count={4} lines={2} />
          ) : preview ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-extrabold text-nexoraText">{t(`taxiq.formsReports.reportName.${preview.reportType}`)}</p>
                  <p className="text-xs text-nexoraMuted">{preview.periodLabel}</p>
                </div>
                <FormsReportStatusBadge status={preview.status} />
              </div>

              {preview.status === 'NeedsReview' && (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  {t('taxiq.formsReports.needsReviewBanner')}
                </p>
              )}

              {preview.w2Lines && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px] text-left text-xs">
                    <thead className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                      <tr>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.employee')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.wages')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.federalTax')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.ssWages')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.ssTax')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.medicareWages')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.w2.medicareTax')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.w2Lines.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-4 text-center text-nexoraMuted">{t('taxiq.formsReports.preview.empty')}</td>
                        </tr>
                      ) : (
                        preview.w2Lines.map((line) => (
                          <tr key={line.posStaffProfileId} className="border-t border-nexoraRule">
                            <td className="py-2 pr-4 font-bold text-nexoraText">{line.staffName}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.wages)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.federalIncomeTaxWithheld)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.socialSecurityWages)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.socialSecurityTaxWithheld)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.medicareWages)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.medicareTaxWithheld)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {preview.form941 && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form941.line1')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form941.line1TotalWages)}</span></div>
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form941.line2')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form941.line2FederalIncomeTaxWithheld)}</span></div>
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form941.line5a')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form941.line5aTaxableSocialSecurityWages)} / {formatCurrency(preview.form941.line5aSocialSecurityTax)}</span></div>
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form941.line5c')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form941.line5cTaxableMedicareWages)} / {formatCurrency(preview.form941.line5cMedicareTax)}</span></div>
                  <div className="flex justify-between border-t border-nexoraRule pt-1.5"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form941.line13')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form941.line13TotalDeposits)}</span></div>
                </div>
              )}

              {preview.form940 && (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form940.totalWages')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form940.totalFutaTaxableWages)}</span></div>
                  <div className="flex justify-between"><span className="text-nexoraMuted">{t('taxiq.formsReports.preview.form940.taxDue')}</span><span className="font-bold text-nexoraText">{formatCurrency(preview.form940.futaTaxDue)}</span></div>
                </div>
              )}

              {preview.sutaLines && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-left text-xs">
                    <thead className="text-[10px] font-extrabold uppercase text-nexoraMuted">
                      <tr>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.suta.jurisdiction')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.suta.taxableWages')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.suta.wageBaseCap')}</th>
                        <th className="py-2 pr-4">{t('taxiq.formsReports.preview.suta.taxDue')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.sutaLines.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-nexoraMuted">{t('taxiq.formsReports.preview.empty')}</td>
                        </tr>
                      ) : (
                        preview.sutaLines.map((line) => (
                          <tr key={line.jurisdiction} className="border-t border-nexoraRule">
                            <td className="py-2 pr-4 font-bold text-nexoraText">{line.jurisdiction}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.taxableWages)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.wageBaseCap)}</td>
                            <td className="py-2 pr-4 text-nexoraText">{formatCurrency(line.sutaTaxDue)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  )
}
