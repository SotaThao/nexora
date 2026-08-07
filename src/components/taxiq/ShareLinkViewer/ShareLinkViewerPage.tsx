import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Download, KeyRound, Loader2, Lock, Upload } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useDownloadShareLink,
  useShareLinkContent,
  useUploadShareLinkFile,
} from '../../../data/hooks/useTaxiqShareLinkViewer'
import { isApiError } from '../../../types/domain'
import LoadingScreen from '../../../app/LoadingScreen'
import { formatTransactionDateTime } from '../../dashboard/utils'

/**
 * Public Share Link viewer (mục 23) — deliberately does not call useAuth() or render the
 * dashboard shell. Token comes from the URL query string only. Registered outside
 * RequireAuth in AppRouter.tsx at /share/access, same pattern as CpaViewerPage.tsx.
 */
export default function ShareLinkViewerPage() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? undefined

  const [passcodeInput, setPasscodeInput] = useState('')
  const [submittedPasscode, setSubmittedPasscode] = useState<string | undefined>(undefined)

  const contentQuery = useShareLinkContent(token, submittedPasscode)
  const downloadLink = useDownloadShareLink()
  const uploadFile = useUploadShareLinkFile()

  if (!token) {
    return <ShareLinkViewerError message={t('taxiq.shareLinkViewer.linkInvalid')} />
  }

  if (contentQuery.isLoading) {
    return <LoadingScreen />
  }

  const errorCode = isApiError(contentQuery.error) ? contentQuery.error.errorCode : undefined
  const needsPasscode = errorCode === 'TAXIQ_SHARE_LINK_PASSCODE_REQUIRED' || errorCode === 'TAXIQ_SHARE_LINK_PASSCODE_INVALID'

  if (needsPasscode) {
    return (
      <PasscodeGate
        passcode={passcodeInput}
        onChangePasscode={setPasscodeInput}
        onSubmit={() => setSubmittedPasscode(passcodeInput)}
        showInvalid={errorCode === 'TAXIQ_SHARE_LINK_PASSCODE_INVALID'}
      />
    )
  }

  if (contentQuery.isError || !contentQuery.data) {
    // Deliberately generic regardless of the underlying error code (invalid / expired /
    // revoked) — same rationale as CpaViewerPage: don't leak which specific reason applies.
    return <ShareLinkViewerError message={t('taxiq.shareLinkViewer.linkExpiredOrRevoked')} />
  }

  const content = contentQuery.data
  const canDownloadPdf = content.downloadPermission !== 'Disabled'
  const canDownloadCsv = content.downloadPermission === 'PdfAndCsv'
  const canUpload = content.accessMode === 'UploadOnly' || content.accessMode === 'ReviewAndUpload'

  const handleDownload = async (format: 'pdf' | 'csv') => {
    try {
      const blob = await downloadLink.mutateAsync({ token, format, passcode: submittedPasscode })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `share-link-${token}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      showToast(t('taxiq.shareLinkViewer.download.errors.generic'), 'error')
    }
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {content.expiresAt
            ? t('taxiq.shareLinkViewer.readOnlyBanner', {
                date: formatTransactionDateTime(content.expiresAt, currentLanguage),
              })
            : t('taxiq.shareLinkViewer.readOnlyBannerNoExpiry')}
        </div>

        <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.shareLinkViewer.title')}</h1>
              <p className="mt-1 text-xs text-nexoraMuted">{content.recipientName}</p>
            </div>
            {(canDownloadPdf || canDownloadCsv) && (
              <div className="flex gap-2">
                {canDownloadPdf && (
                  <button
                    type="button"
                    onClick={() => handleDownload('pdf')}
                    disabled={downloadLink.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText disabled:opacity-60"
                  >
                    {downloadLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {t('taxiq.shareLinkViewer.download.pdf')}
                  </button>
                )}
                {canDownloadCsv && (
                  <button
                    type="button"
                    onClick={() => handleDownload('csv')}
                    disabled={downloadLink.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-1.5 text-xs font-bold text-nexoraText disabled:opacity-60"
                  >
                    {downloadLink.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                    {t('taxiq.shareLinkViewer.download.csv')}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {content.publicProfile && (
          <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
            <div className="flex items-center gap-4">
              {content.publicProfile.logoUrl && (
                <img src={content.publicProfile.logoUrl} alt={content.publicProfile.name} className="h-14 w-14 rounded-xl object-cover" />
              )}
              <div>
                <h2 className="text-base font-extrabold text-nexoraText">{content.publicProfile.name}</h2>
                {content.publicProfile.description && (
                  <p className="mt-1 text-xs text-nexoraMuted">{content.publicProfile.description}</p>
                )}
                {content.publicProfile.address && (
                  <p className="mt-1 text-xs text-nexoraMuted">
                    {content.publicProfile.address}, {content.publicProfile.city}, {content.publicProfile.state}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {content.taxLedgerSummary && (
          <>
            <h2 className="px-1 text-xs font-extrabold uppercase text-nexoraMuted">
              {t('taxiq.shareLinkViewer.sections.taxLedgerSummary')}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal">
              <table className="w-full min-w-[600px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.jurisdiction')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.type')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.employeeAmount')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.employerAmount')}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.taxLedgerSummary.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                        {t('taxiq.shareLinkViewer.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    content.taxLedgerSummary.map((row, idx) => (
                      <tr key={`${row.jurisdiction}-${row.type}-${idx}`} className="border-t border-nexoraRule">
                        <td className="px-4 py-3 font-bold text-nexoraText">{row.jurisdiction}</td>
                        <td className="px-4 py-3 text-nexoraText">{row.type}</td>
                        <td className="px-4 py-3 text-nexoraText">{formatUsd(row.employeeAmount)}</td>
                        <td className="px-4 py-3 text-nexoraText">{formatUsd(row.employerAmount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {content.receiptIndex && (
          <>
            <h2 className="px-1 text-xs font-extrabold uppercase text-nexoraMuted">
              {t('taxiq.shareLinkViewer.sections.receiptIndex')}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.fileName')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.vendor')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.date')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.amount')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.qualityStatus')}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.receiptIndex.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                        {t('taxiq.shareLinkViewer.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    content.receiptIndex.map((row) => (
                      <tr key={row.id} className="border-t border-nexoraRule">
                        <td className="px-4 py-3 font-bold text-nexoraText">{row.fileName}</td>
                        <td className="px-4 py-3 text-nexoraMuted">{row.aiExtractedVendor ?? '—'}</td>
                        <td className="px-4 py-3 text-nexoraMuted">{row.aiExtractedDate ?? '—'}</td>
                        <td className="px-4 py-3 text-nexoraText">{row.aiExtractedAmount != null ? formatUsd(row.aiExtractedAmount) : '—'}</td>
                        <td className="px-4 py-3 text-nexoraMuted">{row.qualityStatus}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {content.payoutEvidence && (
          <>
            <h2 className="px-1 text-xs font-extrabold uppercase text-nexoraMuted">
              {t('taxiq.shareLinkViewer.sections.payoutEvidence')}
            </h2>
            <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal">
              <table className="w-full min-w-[700px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.period')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.servicePayout')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.totalTip')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.bonus')}</th>
                    <th className="px-4 py-3">{t('taxiq.shareLinkViewer.columns.status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {content.payoutEvidence.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                        {t('taxiq.shareLinkViewer.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    content.payoutEvidence.map((row) => (
                      <tr key={row.id} className="border-t border-nexoraRule">
                        <td className="px-4 py-3 text-nexoraMuted">{row.periodStart} – {row.periodEnd}</td>
                        <td className="px-4 py-3 text-nexoraText">{formatUsd(row.servicePayout)}</td>
                        <td className="px-4 py-3 text-nexoraText">{formatUsd(row.totalTip)}</td>
                        <td className="px-4 py-3 text-nexoraText">{formatUsd(row.bonus + row.reimbursement)}</td>
                        <td className="px-4 py-3 text-nexoraMuted">{row.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {canUpload && (
          <UploadPanel
            token={token}
            passcode={submittedPasscode}
            uploadFile={uploadFile}
          />
        )}
      </div>
    </div>
  )
}

function UploadPanel({
  token,
  passcode,
  uploadFile,
}: {
  token: string
  passcode: string | undefined
  uploadFile: ReturnType<typeof useUploadShareLinkFile>
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [file, setFile] = useState<File | null>(null)

  const handleSubmit = async () => {
    if (!file || uploadFile.isPending) return
    try {
      await uploadFile.mutateAsync({ token, file, passcode })
      showToast(t('taxiq.shareLinkViewer.upload.success'), 'success')
      setFile(null)
    } catch {
      showToast(t('taxiq.shareLinkViewer.upload.errors.generic'), 'error')
    }
  }

  return (
    <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
      <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.shareLinkViewer.upload.title')}</h2>
      <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.shareLinkViewer.upload.subtitle')}</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="file"
          accept=".pdf,.png,.jpg,.jpeg,.xlsx"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="flex-1 text-xs"
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!file || uploadFile.isPending}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
        >
          {uploadFile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          {t('taxiq.shareLinkViewer.upload.submitButton')}
        </button>
      </div>
    </div>
  )
}

function PasscodeGate({
  passcode,
  onChangePasscode,
  onSubmit,
  showInvalid,
}: {
  passcode: string
  onChangePasscode: (value: string) => void
  onSubmit: () => void
  showInvalid: boolean
}) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nexoraBrand/10 text-nexoraBrand">
          <KeyRound className="h-6 w-6" />
        </div>
        <h1 className="text-center text-lg font-extrabold text-nexoraText">{t('taxiq.shareLinkViewer.passcodeGate.title')}</h1>
        <p className="mt-2 text-center text-sm text-nexoraMuted">{t('taxiq.shareLinkViewer.passcodeGate.subtitle')}</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            onSubmit()
          }}
          className="mt-4 space-y-3"
        >
          <input
            type="text"
            value={passcode}
            onChange={(e) => onChangePasscode(e.target.value)}
            placeholder={t('taxiq.shareLinkViewer.passcodeGate.placeholder')}
            className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-center text-sm tracking-widest"
            autoFocus
          />
          {showInvalid && (
            <p className="text-center text-xs font-semibold text-rose-600">{t('taxiq.shareLinkViewer.passcodeGate.invalid')}</p>
          )}
          <button
            type="submit"
            disabled={!passcode.trim()}
            className="w-full rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {t('taxiq.shareLinkViewer.passcodeGate.submitButton')}
          </button>
        </form>
      </div>
    </div>
  )
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
}

function ShareLinkViewerError({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.shareLinkViewer.errorTitle')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
