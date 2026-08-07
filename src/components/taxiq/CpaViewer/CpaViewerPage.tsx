import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2, Lock, Pencil } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useAddCpaNote, useCpaPackage } from '../../../data/hooks/useTaxiqCpaViewer'
import type { CpaDeduction, CpaPayout } from '../../../data/repositories/taxiqCpaViewer'
import LoadingScreen from '../../../app/LoadingScreen'
import Tooltip from '../../ui/Tooltip'
import { formatTransactionDateTime } from '../../dashboard/utils'

/**
 * Public CPA External Viewer (US-10 Phần B) — deliberately does not call useAuth() or
 * render the Owner/Staff dashboard shell. Token comes from the URL query string only.
 * Registered outside RequireAuth in AppRouter.tsx at /cpa/access (matches the link the
 * backend's invite email actually sends — see US-10-assumptions.md A2 for why this
 * differs from the ticket's suggested /taxiq/cpa-view path).
 */
export default function CpaViewerPage() {
  const { t, currentLanguage } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? undefined

  const packageQuery = useCpaPackage(token)

  if (!token) {
    return <CpaViewerError message={t('taxiq.cpaViewer.linkInvalid')} />
  }

  if (packageQuery.isLoading) {
    return <LoadingScreen />
  }

  if (packageQuery.isError || !packageQuery.data) {
    // Deliberately generic regardless of the underlying error code (invalid / expired /
    // revoked) — AC requires not leaking which specific reason applies.
    return <CpaViewerError message={t('taxiq.cpaViewer.linkExpiredOrRevoked')} />
  }

  const pkg = packageQuery.data
  const isMasked = pkg.dataMode === 'Masked'

  return (
    <div className="min-h-dvh bg-nexoraCanvas px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-4">
        <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {t('taxiq.cpaViewer.readOnlyBanner', { date: formatTransactionDateTime(pkg.expiresAt, currentLanguage) })}
        </div>

        <div className="rounded-2xl border border-nexoraBorder bg-white p-5 dark:bg-luxuryCoal">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.cpaViewer.title')}</h1>
              <p className="mt-1 text-xs text-nexoraMuted">
                {t(`taxiq.cpaAccess.packageTypes.${pkg.packageType}`)}
              </p>
            </div>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold ${
                isMasked
                  ? 'border-slate-200 bg-slate-50 text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400'
                  : 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400'
              }`}
            >
              <Lock className="h-3 w-3" />
              {t(`taxiq.cpaAccess.dataModes.${pkg.dataMode}`)}
            </span>
          </div>

          {(pkg.businessTin || pkg.staffTin) && (
            <div className="mt-3 flex flex-wrap gap-4 border-t border-nexoraRule pt-3 text-xs">
              {pkg.businessTin && (
                <div>
                  <span className="font-bold text-nexoraMuted">{t('taxiq.taxProfile.einLabel')}: </span>
                  <span className="font-mono text-nexoraText">{pkg.businessTin}</span>
                </div>
              )}
              {pkg.staffTin && (
                <div>
                  <span className="font-bold text-nexoraMuted">{t('taxiq.taxProfile.title')}: </span>
                  <span className="font-mono text-nexoraText">{pkg.staffTin}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <h2 className="px-1 text-xs font-extrabold uppercase text-nexoraMuted">
          {t('taxiq.cpaViewer.sections.deductions')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.category')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.description')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.vendor')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.date')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.amount')}</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.cpaViewer.columns.deductibleAmount')}
                    <Tooltip content={t('taxiq.tooltips.deductible')} />
                  </span>
                </th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.receipts')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.cpaNotes')}</th>
              </tr>
            </thead>
            <tbody>
              {pkg.deductions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                    {t('taxiq.cpaViewer.emptyState')}
                  </td>
                </tr>
              ) : (
                pkg.deductions.map((deduction) => (
                  <CpaDeductionRow key={deduction.id} deduction={deduction} accessToken={token} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <h2 className="px-1 text-xs font-extrabold uppercase text-nexoraMuted">
          {t('taxiq.cpaViewer.sections.payouts')}
        </h2>
        <div className="overflow-x-auto rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.staffName')}</th>
                <th className="px-4 py-3">{t('taxiq.taxProfile.title')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.payPeriod')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.grossPayout')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.netPaid')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.paymentMethod')}</th>
                <th className="px-4 py-3">{t('taxiq.cpaViewer.columns.status')}</th>
              </tr>
            </thead>
            <tbody>
              {pkg.payouts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                    {t('taxiq.cpaViewer.emptyPayoutState')}
                  </td>
                </tr>
              ) : (
                pkg.payouts.map((payout) => <CpaPayoutRow key={payout.id} payout={payout} />)
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function CpaDeductionRow({ deduction, accessToken }: { deduction: CpaDeduction; accessToken: string }) {
  const { t } = useTranslation()
  const addNote = useAddCpaNote(accessToken)
  const [isEditing, setIsEditing] = useState(false)
  const [noteDraft, setNoteDraft] = useState(deduction.cpaNotes ?? '')

  const handleSave = async () => {
    if (addNote.isPending) return
    try {
      await addNote.mutateAsync({
        deductionRecordId: deduction.id,
        cpaNotes: noteDraft.trim(),
        cpaAccessToken: accessToken,
      })
      setIsEditing(false)
    } catch {
      // Error surfaces via addNote.isError below; keep the editor open so the CPA can retry.
    }
  }

  return (
    <tr className="border-t border-nexoraRule align-top">
      <td className="px-4 py-3 font-bold text-nexoraText">{deduction.categoryName}</td>
      <td className="px-4 py-3 text-nexoraText">{deduction.description}</td>
      <td className="px-4 py-3 text-nexoraMuted">{deduction.vendorName ?? '—'}</td>
      <td className="px-4 py-3 text-nexoraMuted">{deduction.date}</td>
      <td className="px-4 py-3 text-nexoraText">{formatUsd(deduction.amount)}</td>
      <td className="px-4 py-3 font-extrabold text-nexoraText">{formatUsd(deduction.deductibleAmount)}</td>
      <td className="px-4 py-3 text-nexoraMuted">{deduction.receiptCount}</td>
      <td className="px-4 py-3">
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={2}
              className="w-full min-w-[180px] rounded-lg border border-nexoraBorder px-2 py-1.5 text-xs"
            />
            {addNote.isError && (
              <p className="text-[11px] font-semibold text-rose-600">{t('taxiq.cpaViewer.notes.errors.generic')}</p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setNoteDraft(deduction.cpaNotes ?? '') }}
                className="text-[11px] font-bold text-nexoraMuted"
              >
                {t('common.cancel')}
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={addNote.isPending}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand disabled:opacity-60"
              >
                {addNote.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-start justify-between gap-2">
            <span className="text-nexoraMuted">{deduction.cpaNotes || '—'}</span>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
            >
              <Pencil className="h-3 w-3" />
              {t('taxiq.cpaViewer.notes.editButton')}
            </button>
          </div>
        )}
      </td>
    </tr>
  )
}

function CpaPayoutRow({ payout }: { payout: CpaPayout }) {
  return (
    <tr className="border-t border-nexoraRule align-top">
      <td className="px-4 py-3 font-bold text-nexoraText">{payout.staffName ?? '—'}</td>
      <td className="px-4 py-3 font-mono text-nexoraMuted">{payout.staffTin ?? '—'}</td>
      <td className="px-4 py-3 text-nexoraMuted">
        {payout.periodStart} – {payout.periodEnd}
      </td>
      <td className="px-4 py-3 text-nexoraText">{formatUsd(payout.grossPayout)}</td>
      <td className="px-4 py-3 font-extrabold text-nexoraText">{formatUsd(payout.netPaid)}</td>
      <td className="px-4 py-3 text-nexoraMuted">{payout.paymentMethod}</td>
      <td className="px-4 py-3 text-nexoraMuted">{payout.status}</td>
    </tr>
  )
}

function formatUsd(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value)
}

function CpaViewerError({ message }: { message: string }) {
  const { t } = useTranslation()
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.cpaViewer.errorTitle')}</h1>
        <p className="mt-2 text-sm text-nexoraMuted leading-relaxed">{message}</p>
      </div>
    </div>
  )
}
