import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Download, FilePlus2, Loader2, Lock, PlusCircle } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqReadinessScore } from '../../../../data/hooks/useTaxiqReadinessScore'
import { useGenerateDraftExport, useGenerateFinalExport } from '../../../../data/hooks/useTaxiqOwnerExport'
import type { FinalExportResult } from '../../../../data/hooks/useTaxiqOwnerExport'
import { useOwnerAdjustments } from '../../../../data/hooks/useTaxiqOwnerTaxYearLock'
import type { ExportPackage } from '../../../../data/repositories/taxiqOwnerExport'
import type { OwnerTaxYear } from '../../../../data/repositories/taxiqOwnerTaxYear'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import { formatTransactionDateTime } from '../../utils'
import TaxReadinessScoreWidget, { getReadinessItemLabel, READINESS_ITEM_ROUTES } from './shared/TaxReadinessScoreWidget'
import LockTaxYearModal from './modals/LockTaxYearModal'
import CreateAdjustmentModal from './modals/CreateAdjustmentModal'

function ExportResultCard({ pkg, label }: { pkg: ExportPackage; label: string }) {
  const { t } = useTranslation()
  return (
    <div className="mt-3 space-y-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-nexoraText">{label}</span>
        <span className="rounded-full bg-nexoraBrandSoft px-2.5 py-0.5 text-[10px] font-extrabold text-nexoraBrand">
          v{pkg.version} · {pkg.exportType}
        </span>
      </div>
      <a
        href={pkg.signedUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-nexoraBrand hover:underline"
      >
        <Download className="h-3.5 w-3.5" />
        {t('taxiq.yearEndExport.downloadLink')}
      </a>
      <p className="text-[11px] text-nexoraMuted">{t('taxiq.yearEndExport.linkExpiryWarning')}</p>
    </div>
  )
}

export default function YearEndExportView({
  ownerTaxYear,
}: {
  ownerTaxYear: OwnerTaxYear
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const readinessQuery = useTaxiqReadinessScore('owner', ownerTaxYear.id)
  const highPriorityItems = readinessQuery.data?.highPriorityItems ?? []
  const hasNonDisputeHardBlock = highPriorityItems.some((i) => i.type !== 'PayoutDispute')
  const onlyDisputeRemaining = highPriorityItems.length > 0 && !hasNonDisputeHardBlock
  const canLock = highPriorityItems.length === 0 || onlyDisputeRemaining

  const isLockedOrExported = ownerTaxYear.status === 'Locked' || ownerTaxYear.status === 'Exported'
  // Backend only allows adjustments while Status is exactly Locked — once the
  // first Final Export flips status to Exported, creating adjustments always
  // fails (TAXIQ_OWNER_TAX_YEAR_NOT_LOCKED). See US-06 assumptions doc (A5).
  const canCreateAdjustment = ownerTaxYear.status === 'Locked'

  const [isLockModalOpen, setIsLockModalOpen] = useState(false)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)
  const [draftResult, setDraftResult] = useState<ExportPackage | null>(null)
  const [finalResult, setFinalResult] = useState<FinalExportResult | null>(null)
  const [consentConfirmed, setConsentConfirmed] = useState(false)

  const generateDraft = useGenerateDraftExport()
  const generateFinal = useGenerateFinalExport()
  const adjustmentsQuery = useOwnerAdjustments(ownerTaxYear.id)

  const handleApiError = (err: unknown, fallbackKey: string) => {
    const fallback = t(fallbackKey)
    if (isApiError(err)) {
      const i18nKey = getErrorI18nKey(err.errorCode)
      const translated = t(i18nKey)
      showToast(translated !== i18nKey ? translated : (err.message || fallback), 'error')
      return
    }
    showToast(fallback, 'error')
  }

  const handleGenerateDraft = async () => {
    try {
      const result = await generateDraft.mutateAsync({ ownerTaxYearId: ownerTaxYear.id })
      setDraftResult(result)
      showToast(t('taxiq.yearEndExport.draftSuccess'), 'success')
    } catch (err) {
      handleApiError(err, 'taxiq.yearEndExport.errors.generic')
    }
  }

  const handleGenerateFinal = async () => {
    try {
      const result = await generateFinal.mutateAsync({ ownerTaxYearId: ownerTaxYear.id, consentConfirmed: true })
      setFinalResult(result)
      if (result.isNoChangeReexport) {
        showToast(t('taxiq.yearEndExport.finalNoChanges'), 'info')
      } else {
        showToast(t('taxiq.yearEndExport.finalSuccess'), 'success')
      }
    } catch (err) {
      handleApiError(err, 'taxiq.yearEndExport.errors.generic')
    }
  }

  const finalExportDisabledReason = !isLockedOrExported
    ? t('taxiq.yearEndExport.finalDisabledNotLocked')
    : highPriorityItems.length > 0
      ? t('taxiq.yearEndExport.finalDisabledHighPriority')
      : !consentConfirmed
        ? t('taxiq.yearEndExport.finalDisabledConsent')
        : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.yearEndExport.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.yearEndExport.subtitle')}</p>
      </div>

      <TaxReadinessScoreWidget scope="owner" taxYearId={ownerTaxYear.id} />

      <div className="nexora-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-nexoraText">
              <span className="inline-flex items-center gap-1">
                {t('taxiq.yearEndExport.draftTitle')}
                <Tooltip content={t('taxiq.yearEndExport.tooltips.draftReport')} />
              </span>
            </h3>
            <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.yearEndExport.draftDescription')}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={generateDraft.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            {generateDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
            {t('taxiq.yearEndExport.generateDraftButton')}
          </button>
        </div>
        {draftResult && <ExportResultCard pkg={draftResult} label={t('taxiq.yearEndExport.draftResultLabel')} />}
      </div>

      <div className="nexora-card p-6">
        <h3 className="text-sm font-extrabold text-nexoraText">
          <span className="inline-flex items-center gap-1">
            {t('taxiq.yearEndExport.lockTitle')}
            <Tooltip content={t('taxiq.yearEndExport.tooltips.lockTaxYear')} />
          </span>
        </h3>

        {isLockedOrExported ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Lock className="h-3.5 w-3.5" />
            {t('taxiq.yearEndExport.lockedBanner', {
              date: ownerTaxYear.lockedAt ? formatTransactionDateTime(ownerTaxYear.lockedAt, currentLanguage) : '—',
            })}
          </div>
        ) : (
          <div className="mt-3 space-y-3">
            {!canLock && highPriorityItems.length > 0 && (
              <ul className="space-y-2">
                {highPriorityItems.map((item, index) => {
                  const route = READINESS_ITEM_ROUTES[item.type]
                  return (
                    <li key={`${item.type}-${index}`} className="flex items-center justify-between gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-400">
                      <span>{getReadinessItemLabel(item, t)}</span>
                      {route && (
                        <button
                          type="button"
                          onClick={() => navigate(route)}
                          className="shrink-0 underline"
                        >
                          {t('taxiq.yearEndExport.resolveLink')}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            )}
            <button
              type="button"
              onClick={() => setIsLockModalOpen(true)}
              disabled={!canLock || readinessQuery.isLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Lock className="h-3.5 w-3.5" />
              {t('taxiq.yearEndExport.lockButton')}
            </button>
          </div>
        )}
      </div>

      <div className="nexora-card p-6">
        <h3 className="text-sm font-extrabold text-nexoraText">
          <span className="inline-flex items-center gap-1">
            {t('taxiq.yearEndExport.finalTitle')}
            <Tooltip content={t('taxiq.yearEndExport.tooltips.finalExport')} />
          </span>
        </h3>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.yearEndExport.finalDescription')}</p>

        <label className="mt-3 flex items-center gap-2 text-xs font-semibold text-nexoraText">
          <input
            type="checkbox"
            checked={consentConfirmed}
            onChange={(e) => setConsentConfirmed(e.target.checked)}
            disabled={!isLockedOrExported}
            className="h-4 w-4 rounded border-nexoraBorder"
          />
          {t('taxiq.yearEndExport.consentLabel')}
        </label>

        {finalExportDisabledReason && (
          <p className="mt-2 text-[11px] font-semibold text-nexoraMuted">{finalExportDisabledReason}</p>
        )}

        <button
          type="button"
          onClick={handleGenerateFinal}
          disabled={!!finalExportDisabledReason || generateFinal.isPending}
          className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {generateFinal.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          {t('taxiq.yearEndExport.finalButton')}
        </button>

        {finalResult && !finalResult.isNoChangeReexport && (
          <ExportResultCard pkg={finalResult} label={t('taxiq.yearEndExport.finalResultLabel')} />
        )}
        {finalResult && finalResult.isNoChangeReexport && (
          <p className="mt-3 text-xs font-semibold text-nexoraMuted">{t('taxiq.yearEndExport.finalNoChanges')}</p>
        )}
      </div>

      {isLockedOrExported && (
        <div className="nexora-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.createAdjustment.historyTitle')}</h3>
              <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.createAdjustment.historySubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(true)}
              disabled={!canCreateAdjustment}
              title={canCreateAdjustment ? undefined : t('taxiq.createAdjustment.disabledNotLocked')}
              className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:cursor-not-allowed disabled:opacity-40"
            >
              <PlusCircle className="h-3.5 w-3.5" />
              {t('taxiq.createAdjustment.addButton')}
            </button>
          </div>

          <div className="mt-4 overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                <tr>
                  <th className="px-4 py-3">{t('taxiq.createAdjustment.columns.entity')}</th>
                  <th className="px-4 py-3">{t('taxiq.createAdjustment.columns.change')}</th>
                  <th className="px-4 py-3">{t('taxiq.createAdjustment.columns.reason')}</th>
                  <th className="px-4 py-3">{t('taxiq.createAdjustment.columns.createdBy')}</th>
                  <th className="px-4 py-3">{t('taxiq.createAdjustment.columns.createdAt')}</th>
                </tr>
              </thead>
              <tbody>
                {adjustmentsQuery.isPending ? (
                  <tr><td colSpan={5} className="p-4"><SkeletonList count={3} lines={1} /></td></tr>
                ) : (adjustmentsQuery.data ?? []).length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-8 text-center font-medium text-nexoraMuted">{t('taxiq.createAdjustment.emptyState')}</td></tr>
                ) : (
                  (adjustmentsQuery.data ?? []).map((record) => (
                    <tr key={record.id} className="border-t border-nexoraRule">
                      <td className="px-4 py-3 font-bold text-nexoraText">{record.entityType} · {record.fieldName}</td>
                      <td className="px-4 py-3 text-nexoraText">{record.oldValue} → {record.newValue}</td>
                      <td className="px-4 py-3 text-nexoraMuted">{record.reason}</td>
                      <td className="px-4 py-3 text-nexoraMuted">{record.createdByUserName}</td>
                      <td className="px-4 py-3 text-nexoraMuted">{formatTransactionDateTime(record.createdAt, currentLanguage)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <LockTaxYearModal
        open={isLockModalOpen}
        onClose={() => setIsLockModalOpen(false)}
        ownerTaxYearId={ownerTaxYear.id}
        requireOverrideNote={onlyDisputeRemaining}
      />

      <CreateAdjustmentModal
        open={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        ownerTaxYearId={ownerTaxYear.id}
      />
    </div>
  )
}
