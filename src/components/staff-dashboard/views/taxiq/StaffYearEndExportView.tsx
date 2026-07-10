import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertTriangle, CheckCircle2, Download, FilePlus2, Loader2, Lock, PlusCircle } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useTaxiqReadinessScore } from '../../../../data/hooks/useTaxiqReadinessScore'
import { useGenerateStaffDraftExport, useGenerateStaffFinalExport } from '../../../../data/hooks/useTaxiqStaffExport'
import type { StaffFinalExportResult } from '../../../../data/hooks/useTaxiqStaffExport'
import { useStaffAdjustments } from '../../../../data/hooks/useTaxiqStaffAdjustments'
import type { CpaPackageType, ExportPackage } from '../../../../data/repositories/taxiqStaffExport'
import type { StaffTaxYear } from '../../../../data/repositories/taxiqStaffTaxYear'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import TaxReadinessScoreWidget, { getReadinessItemLabel, READINESS_ITEM_ROUTES } from '../../../dashboard/views/taxiq/shared/TaxReadinessScoreWidget'
import CreateAdjustmentModal from '../../../dashboard/views/taxiq/modals/CreateAdjustmentModal'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import { formatTransactionDateTime } from '../../../dashboard/utils'

// Draft is watermarked "NOT FINAL" regardless of tier — ticket only specifies a
// package picker for Final Export, so Draft always requests Full (most detail)
// internally. See US-15 assumptions doc (A9).
const DRAFT_PACKAGE_TYPE: CpaPackageType = 'Full'

const PACKAGE_TYPES: CpaPackageType[] = ['Basic', 'Full', 'CPAReview']

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
        {t('taxiq.staffExport.downloadLink')}
      </a>
      <p className="text-[11px] text-nexoraMuted">{t('taxiq.staffExport.linkExpiryWarning')}</p>
    </div>
  )
}

function PackageOption({
  packageType,
  selected,
  onSelect,
}: {
  packageType: CpaPackageType
  selected: boolean
  onSelect: () => void
}) {
  const { t } = useTranslation()
  const key = packageType === 'CPAReview' ? 'cpaReview' : packageType.toLowerCase()
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex flex-col gap-1.5 rounded-lg border p-4 text-left transition-colors ${
        selected
          ? 'border-nexoraBrand bg-nexoraBrandSoft'
          : 'border-nexoraBorder bg-white hover:border-nexoraBrand/50'
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-nexoraText">{t(`taxiq.staffExport.package.${key}.title`)}</span>
        {selected && <CheckCircle2 className="h-4 w-4 shrink-0 text-nexoraBrand" />}
      </div>
      <p className="text-[11px] text-nexoraMuted">{t(`taxiq.staffExport.package.${key}.description`)}</p>
    </button>
  )
}

export default function StaffYearEndExportView({
  staffTaxYear,
}: {
  staffTaxYear: StaffTaxYear
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const navigate = useNavigate()

  const isLocked = staffTaxYear.status === 'Locked'
  // Staff never reaches an `Exported` status (no separate Lock step like Owner) — `Locked`
  // is the only state Staff Adjustment can gate on. See US-18 (BE) design notes.
  const canCreateAdjustment = isLocked

  const readinessQuery = useTaxiqReadinessScore('staff', staffTaxYear.id)
  const highPriorityItems = readinessQuery.data?.highPriorityItems ?? []

  const [selectedPackageType, setSelectedPackageType] = useState<CpaPackageType | null>(null)
  const [consentConfirmed, setConsentConfirmed] = useState(false)
  const [draftResult, setDraftResult] = useState<ExportPackage | null>(null)
  const [finalResult, setFinalResult] = useState<StaffFinalExportResult | null>(null)
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState(false)

  const generateDraft = useGenerateStaffDraftExport()
  const generateFinal = useGenerateStaffFinalExport()
  const adjustmentsQuery = useStaffAdjustments(staffTaxYear.id)

  const requiresConsent = selectedPackageType === 'Full' || selectedPackageType === 'CPAReview'

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
      const result = await generateDraft.mutateAsync({ staffTaxYearId: staffTaxYear.id, packageType: DRAFT_PACKAGE_TYPE })
      setDraftResult(result)
      showToast(t('taxiq.staffExport.draftSuccess'), 'success')
    } catch (err) {
      handleApiError(err, 'taxiq.staffExport.errors.generic')
    }
  }

  const handleGenerateFinal = async () => {
    if (!selectedPackageType) return
    try {
      const result = await generateFinal.mutateAsync({
        staffTaxYearId: staffTaxYear.id,
        // BE requires ConsentConfirmed=true unconditionally for Final Export on every
        // tier (see GenerateFinalExportCommandHandler) — Basic has no consent checkbox
        // in the UI per AC, so it is implicitly confirmed here.
        consentConfirmed: requiresConsent ? consentConfirmed : true,
        packageType: selectedPackageType,
      })
      setFinalResult(result)
      if (result.isNoChangeReexport) {
        showToast(t('taxiq.staffExport.finalNoChanges'), 'info')
      } else {
        showToast(t('taxiq.staffExport.finalSuccess'), 'success')
      }
    } catch (err) {
      handleApiError(err, 'taxiq.staffExport.errors.generic')
    }
  }

  // Per BA spec DR-EXPORT-003, Medium/Low priority items (the only kind
  // CalculateStaffScore ever produces for Staff — see US-15 assumptions doc A2)
  // do not block export; they are surfaced as non-blocking Open Notes instead.
  // Only High Priority items block (DR-EXPORT-002), which applies to Owner only.
  const finalExportDisabledReason = !selectedPackageType
    ? t('taxiq.staffExport.finalDisabledNoPackage')
    : requiresConsent && !consentConfirmed
      ? t('taxiq.staffExport.finalDisabledConsent')
      : null

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.staffExport.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.staffExport.subtitle')}</p>
      </div>

      <TaxReadinessScoreWidget scope="staff" taxYearId={staffTaxYear.id} />

      <div className="nexora-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-extrabold text-nexoraText">
              <span className="inline-flex items-center gap-1">
                {t('taxiq.staffExport.draftTitle')}
                <Tooltip content={t('taxiq.yearEndExport.tooltips.draftReport')} />
              </span>
            </h3>
            <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.staffExport.draftDescription')}</p>
          </div>
          <button
            type="button"
            onClick={handleGenerateDraft}
            disabled={generateDraft.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
          >
            {generateDraft.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FilePlus2 className="h-3.5 w-3.5" />}
            {t('taxiq.staffExport.generateDraftButton')}
          </button>
        </div>
        {draftResult && <ExportResultCard pkg={draftResult} label={t('taxiq.staffExport.draftResultLabel')} />}
      </div>

      {isLocked ? (
        <div className="nexora-card p-6">
          <h3 className="text-sm font-extrabold text-nexoraText">
            <span className="inline-flex items-center gap-1">
              {t('taxiq.staffExport.finalTitle')}
              <Tooltip content={t('taxiq.yearEndExport.tooltips.finalExport')} />
            </span>
          </h3>
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Lock className="h-3.5 w-3.5" />
            {t('taxiq.staffExport.lockedBanner')}
          </div>
          {finalResult && !finalResult.isNoChangeReexport && (
            <ExportResultCard pkg={finalResult} label={t('taxiq.staffExport.finalResultLabel')} />
          )}
        </div>
      ) : (
        <div className="nexora-card p-6">
          <h3 className="text-sm font-extrabold text-nexoraText">
            <span className="inline-flex items-center gap-1">
              {t('taxiq.staffExport.finalTitle')}
              <Tooltip content={t('taxiq.yearEndExport.tooltips.finalExport')} />
            </span>
          </h3>
          <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.staffExport.finalDescription')}</p>

          <div className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
            <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {t('taxiq.staffExport.autoLockNotice')}
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {PACKAGE_TYPES.map((packageType) => (
              <PackageOption
                key={packageType}
                packageType={packageType}
                selected={selectedPackageType === packageType}
                onSelect={() => setSelectedPackageType(packageType)}
              />
            ))}
          </div>

          {highPriorityItems.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] font-bold uppercase text-nexoraMuted">{t('taxiq.staffExport.openNotesTitle')}</p>
              <ul className="mt-2 space-y-2">
                {highPriorityItems.map((item, index) => {
                  const route = READINESS_ITEM_ROUTES[item.type]
                  return (
                    <li
                      key={`${item.type}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400"
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                        {getReadinessItemLabel(item, t)}
                      </span>
                      {route && (
                        <button type="button" onClick={() => navigate(route)} className="shrink-0 underline">
                          {t('taxiq.staffExport.resolveLink')}
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          {requiresConsent && (
            <label className="mt-4 flex items-center gap-2 text-xs font-semibold text-nexoraText">
              <input
                type="checkbox"
                checked={consentConfirmed}
                onChange={(e) => setConsentConfirmed(e.target.checked)}
                className="h-4 w-4 rounded border-nexoraBorder"
              />
              {t('taxiq.staffExport.consentLabel')}
            </label>
          )}

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
            {t('taxiq.staffExport.finalButton')}
          </button>

          {finalResult && !finalResult.isNoChangeReexport && (
            <ExportResultCard pkg={finalResult} label={t('taxiq.staffExport.finalResultLabel')} />
          )}
          {finalResult && finalResult.isNoChangeReexport && (
            <p className="mt-3 text-xs font-semibold text-nexoraMuted">{t('taxiq.staffExport.finalNoChanges')}</p>
          )}
        </div>
      )}

      {canCreateAdjustment && (
        <div className="nexora-card p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold text-nexoraText">{t('taxiq.createAdjustment.historyTitle')}</h3>
              <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.createAdjustment.historySubtitle')}</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAdjustmentModalOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText"
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

      <CreateAdjustmentModal
        open={isAdjustmentModalOpen}
        onClose={() => setIsAdjustmentModalOpen(false)}
        staffTaxYearId={staffTaxYear.id}
      />
    </div>
  )
}
