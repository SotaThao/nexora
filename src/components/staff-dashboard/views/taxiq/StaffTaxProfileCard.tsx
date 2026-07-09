import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useMyStaffTaxProfile, useUpsertStaffTaxProfile } from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'

const SSN_PATTERN = /^\d{3}-?\d{2}-?\d{4}$/
const EIN_PATTERN = /^\d{2}-?\d{7}$/

interface FormErrors {
  ssn?: string
  ein?: string
  general?: string
}

// SSN/EIN capture for W-9 (US-012, tách từ US-17-assumptions.md). Staff owns this
// data so GetMyStaffTaxProfileQuery returns it in plaintext — no masking needed here,
// unlike the Owner-facing view (StaffTaxProfileTab) which always masks by default.
export default function StaffTaxProfileCard() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile, isLoading } = useMyStaffTaxProfile()
  const upsertProfile = useUpsertStaffTaxProfile()

  const [ssn, setSsn] = useState('')
  const [ein, setEin] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPrefilled, setIsPrefilled] = useState(false)

  useEffect(() => {
    if (isPrefilled || !profile) return
    setSsn(profile.ssn ?? '')
    setEin(profile.ein ?? '')
    setIsPrefilled(true)
  }, [isPrefilled, profile])

  const validate = (): boolean => {
    const next: FormErrors = {}
    if (!ssn.trim() && !ein.trim()) {
      next.general = t('taxiq.taxProfile.errors.required')
    }
    if (ssn.trim() && !SSN_PATTERN.test(ssn.trim())) {
      next.ssn = t('taxiq.taxProfile.errors.ssnFormat')
    }
    if (ein.trim() && !EIN_PATTERN.test(ein.trim())) {
      next.ein = t('taxiq.taxProfile.errors.einFormat')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    try {
      await upsertProfile.mutateAsync({ ssn: ssn.trim() || null, ein: ein.trim() || null })
      showToast(t('taxiq.taxProfile.savedNotice'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.taxProfile.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="nexora-card p-6">
      <h2 className="text-sm font-extrabold text-nexoraText">{t('taxiq.taxProfile.title')}</h2>
      <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.taxProfile.description')}</p>

      {isLoading ? (
        <div className="mt-4 h-16 animate-pulse rounded-lg bg-nexoraCanvas" />
      ) : (
        <div className="mt-4 space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.ssnLabel')}</label>
              <input
                type="text"
                value={ssn}
                onChange={(e) => setSsn(e.target.value)}
                placeholder={t('taxiq.taxProfile.ssnPlaceholder')}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {errors.ssn && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.ssn}</p>}
            </div>
            <div>
              <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.einLabel')}</label>
              <input
                type="text"
                value={ein}
                onChange={(e) => setEin(e.target.value)}
                placeholder={t('taxiq.taxProfile.einPlaceholder')}
                className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
              />
              {errors.ein && <p className="mt-1 text-xs font-semibold text-rose-500">{errors.ein}</p>}
            </div>
          </div>
          {errors.general && <p className="text-xs font-semibold text-rose-500">{errors.general}</p>}

          <button
            type="button"
            onClick={handleSave}
            disabled={upsertProfile.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
          >
            {upsertProfile.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('taxiq.taxProfile.saveButton')}
          </button>
        </div>
      )}
    </div>
  )
}
