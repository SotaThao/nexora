import { useState } from 'react'
import { Loader2, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useCreateCpaAccessGrant } from '../../../../../data/hooks/useTaxiqCpaAccess'
import {
  CPA_DATA_MODES,
  CPA_EXPIRY_DAYS,
  CPA_PACKAGE_TYPES,
  type CpaDataMode,
  type CpaExpiryDays,
  type CpaPackageType,
} from '../../../../../data/repositories/taxiqCpaAccess'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import ConfirmModal from './ConfirmModal'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const CONSENT_REQUIRED_PACKAGES = new Set<CpaPackageType>(['Full', 'CPAReview'])

export default function CreateCpaAccessGrantModal({
  open,
  onClose,
  scope,
  ownerTaxYearId,
  staffTaxYearId,
}: {
  open: boolean
  onClose: () => void
  scope: 'owner' | 'staff'
  ownerTaxYearId?: string
  staffTaxYearId?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const createGrant = useCreateCpaAccessGrant({ ownerTaxYearId, staffTaxYearId })

  const [cpaEmail, setCpaEmail] = useState('')
  const [packageType, setPackageType] = useState<CpaPackageType>(CPA_PACKAGE_TYPES[0])
  const [dataMode, setDataMode] = useState<CpaDataMode>(CPA_DATA_MODES[0])
  const [expiryDays, setExpiryDays] = useState<CpaExpiryDays>(CPA_EXPIRY_DAYS[1])
  const [staffConsentConfirmed, setStaffConsentConfirmed] = useState(false)
  const [showFullSensitiveConfirm, setShowFullSensitiveConfirm] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const requiresStaffConsent = scope === 'staff' && CONSENT_REQUIRED_PACKAGES.has(packageType)

  const canSubmit =
    EMAIL_PATTERN.test(cpaEmail.trim()) && (!requiresStaffConsent || staffConsentConfirmed)

  const handleClose = () => {
    setCpaEmail('')
    setPackageType(CPA_PACKAGE_TYPES[0])
    setDataMode(CPA_DATA_MODES[0])
    setExpiryDays(CPA_EXPIRY_DAYS[1])
    setStaffConsentConfirmed(false)
    setShowFullSensitiveConfirm(false)
    setError('')
    onClose()
  }

  const submitGrant = async () => {
    if (createGrant.isPending) return
    setError('')
    try {
      await createGrant.mutateAsync({
        cpaEmail: cpaEmail.trim(),
        packageType,
        dataMode,
        expiryDays,
        ownerTaxYearId,
        staffTaxYearId,
        staffConsentConfirmed: requiresStaffConsent ? staffConsentConfirmed : undefined,
      })
      showToast(t('taxiq.cpaAccess.form.success'), 'success')
      handleClose()
    } catch (err) {
      const fallback = t('taxiq.cpaAccess.form.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      setError(message)
      setShowFullSensitiveConfirm(false)
    }
  }

  const handleSubmitClick = () => {
    if (!canSubmit || createGrant.isPending) return
    if (dataMode === 'FullSensitive') {
      setShowFullSensitiveConfirm(true)
      return
    }
    submitGrant()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.cpaAccess.form.modalTitle')}</h2>
          <IconButton label={t('common.cancel')} onClick={handleClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.cpaAccess.form.cpaEmailLabel')}
            </label>
            <input
              type="email"
              value={cpaEmail}
              onChange={(e) => setCpaEmail(e.target.value)}
              placeholder={t('taxiq.cpaAccess.form.cpaEmailPlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.cpaAccess.form.packageTypeLabel')}
            </label>
            <select
              value={packageType}
              onChange={(e) => setPackageType(e.target.value as CpaPackageType)}
              className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
            >
              {CPA_PACKAGE_TYPES.map((type) => (
                <option key={type} value={type}>{t(`taxiq.cpaAccess.packageTypes.${type}`)}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.cpaAccess.form.dataModeLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {CPA_DATA_MODES.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setDataMode(mode)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    dataMode === mode
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t(`taxiq.cpaAccess.dataModes.${mode}`)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold text-nexoraMuted">
              {t('taxiq.cpaAccess.form.expiryDaysLabel')}
            </label>
            <div className="flex flex-wrap gap-2">
              {CPA_EXPIRY_DAYS.map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => setExpiryDays(days)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold ${
                    expiryDays === days
                      ? 'border-nexoraBrand bg-nexoraBrand text-white'
                      : 'border-nexoraBorder text-nexoraText'
                  }`}
                >
                  {t('taxiq.cpaAccess.form.expiryDaysOption', { count: days })}
                </button>
              ))}
            </div>
          </div>

          {requiresStaffConsent && (
            <label className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400">
              <input
                type="checkbox"
                checked={staffConsentConfirmed}
                onChange={(e) => setStaffConsentConfirmed(e.target.checked)}
                className="mt-0.5"
              />
              {t('taxiq.cpaAccess.form.staffConsentLabel')}
            </label>
          )}

          {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={handleClose} className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted">
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSubmitClick}
            disabled={!canSubmit || createGrant.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {createGrant.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.cpaAccess.form.submitButton')}
          </button>
        </div>
      </div>

      <ConfirmModal
        open={showFullSensitiveConfirm}
        onClose={() => setShowFullSensitiveConfirm(false)}
        onConfirm={submitGrant}
        title={t('taxiq.cpaAccess.form.fullSensitiveConfirmTitle')}
        message={t('taxiq.cpaAccess.form.fullSensitiveConfirmMessage')}
        confirmLabel={t('taxiq.cpaAccess.form.fullSensitiveConfirmButton')}
        isDangerous
        isPending={createGrant.isPending}
      />
    </div>
  )
}
