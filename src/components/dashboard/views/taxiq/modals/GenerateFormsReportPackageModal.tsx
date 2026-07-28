import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useGenerateFormsReportPackage } from '../../../../../data/hooks/useTaxiqFormsReports'
import { FORMS_REPORT_PACKAGE_TYPES, PII_MODES } from '../../../../../data/repositories/taxiqFormsReports'
import type { FormsReportPackageType, PiiMode } from '../../../../../data/repositories/taxiqFormsReports'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'

export default function GenerateFormsReportPackageModal({
  open,
  onClose,
  ownerTaxYearId,
}: {
  open: boolean
  onClose: () => void
  ownerTaxYearId: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const generatePackage = useGenerateFormsReportPackage()

  const [packageType, setPackageType] = useState<FormsReportPackageType>(FORMS_REPORT_PACKAGE_TYPES[0])
  const [piiMode, setPiiMode] = useState<PiiMode>('Masked')
  const [fullPiiConfirmed, setFullPiiConfirmed] = useState(false)
  const [error, setError] = useState('')
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)

  if (!open) return null

  const handleClose = () => {
    setDownloadUrl(null)
    setError('')
    setFullPiiConfirmed(false)
    onClose()
  }

  const handleSubmit = async () => {
    if (piiMode === 'Full' && !fullPiiConfirmed) {
      setError(t('taxiq.formsReports.generatePackage.piiFullConfirmRequired'))
      return
    }
    setError('')
    try {
      const result = await generatePackage.mutateAsync({ ownerTaxYearId, packageType, piiMode })
      setDownloadUrl(result.signedUrl)
      showToast(t('taxiq.formsReports.generatePackage.success'), 'success')
    } catch (err) {
      const fallback = t('taxiq.formsReports.errors.generic')
      const message = isApiError(err)
        ? (() => {
            const i18nKey = getErrorI18nKey(err.errorCode)
            const translated = t(i18nKey)
            return translated !== i18nKey ? translated : (err.message || fallback)
          })()
        : fallback
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.formsReports.generatePackage.title')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {downloadUrl ? (
            <div className="space-y-3">
              <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.formsReports.generatePackage.success')}</p>
              <a
                href={downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
              >
                {t('taxiq.formsReports.generatePackage.downloadLink')}
              </a>
            </div>
          ) : (
            <>
              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.generatePackage.packageTypeLabel')}</label>
                <select
                  value={packageType}
                  onChange={(e) => setPackageType(e.target.value as FormsReportPackageType)}
                  className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                >
                  {FORMS_REPORT_PACKAGE_TYPES.map((pt) => (
                    <option key={pt} value={pt}>
                      {t(`taxiq.formsReports.generatePackage.packageType.${pt}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-nexoraMuted">{t('taxiq.formsReports.generatePackage.piiModeLabel')}</label>
                <div className="flex flex-wrap gap-2">
                  {PII_MODES.map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPiiMode(mode)}
                      className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                        piiMode === mode ? 'border-nexoraBrand bg-nexoraBrand text-white' : 'border-nexoraBorder text-nexoraText'
                      }`}
                    >
                      {t(`taxiq.formsReports.generatePackage.piiMode.${mode}`)}
                    </button>
                  ))}
                </div>
              </div>

              {piiMode === 'Full' && (
                <label className="flex items-start gap-2 text-xs font-semibold text-nexoraText">
                  <input
                    type="checkbox"
                    checked={fullPiiConfirmed}
                    onChange={(e) => setFullPiiConfirmed(e.target.checked)}
                    className="mt-0.5"
                  />
                  {t('taxiq.formsReports.generatePackage.piiFullConfirmLabel')}
                </label>
              )}
            </>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {downloadUrl ? t('common.close') : t('common.cancel')}
          </button>
          {!downloadUrl && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={generatePackage.isPending}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
            >
              {generatePackage.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {t('taxiq.formsReports.generatePackage.generateButton')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
