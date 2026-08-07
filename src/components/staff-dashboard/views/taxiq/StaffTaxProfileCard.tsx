import { useEffect, useState } from 'react'
import { Loader2, Paperclip, ShieldCheck } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useCertifyW9Record,
  useMyStaffTaxProfile,
  useUploadSignedW9,
  useUpsertStaffTaxProfile,
  useUpsertW9Record,
} from '../../../../data/hooks/useTaxiqStaffTaxYear'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'

const SSN_PATTERN = /^\d{3}-?\d{2}-?\d{4}$/
const EIN_PATTERN = /^\d{2}-?\d{7}$/

const TAX_CLASSIFICATION_OPTIONS = [
  { key: 'Individual', labelKey: 'taxiq.taxProfile.w9.taxClassifications.individual' },
  { key: 'SoleProprietor', labelKey: 'taxiq.taxProfile.w9.taxClassifications.soleProprietor' },
  { key: 'LLC', labelKey: 'taxiq.taxProfile.w9.taxClassifications.llc' },
  { key: 'Partnership', labelKey: 'taxiq.taxProfile.w9.taxClassifications.partnership' },
  { key: 'CCorp', labelKey: 'taxiq.taxProfile.w9.taxClassifications.cCorp' },
  { key: 'SCorp', labelKey: 'taxiq.taxProfile.w9.taxClassifications.sCorp' },
  { key: 'TrustEstate', labelKey: 'taxiq.taxProfile.w9.taxClassifications.trustEstate' },
  { key: 'Other', labelKey: 'taxiq.taxProfile.w9.taxClassifications.other' },
]

// W-9 line 3b: only meaningful when TAX_CLASSIFICATION_OPTIONS selection is 'LLC'.
const LLC_TAX_CLASSIFICATION_OPTIONS = [
  { key: 'C', labelKey: 'taxiq.taxProfile.w9.llcTaxClassifications.c' },
  { key: 'S', labelKey: 'taxiq.taxProfile.w9.llcTaxClassifications.s' },
  { key: 'P', labelKey: 'taxiq.taxProfile.w9.llcTaxClassifications.p' },
]

interface FormErrors {
  ssn?: string
  ein?: string
  general?: string
}

interface W9FormErrors {
  legalName?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  llcTaxClassificationType?: string
  otherClassificationDescription?: string
}

// SSN/EIN capture for W-9 (US-012, tách từ US-17-assumptions.md). Staff owns this
// data so GetMyStaffTaxProfileQuery returns it in plaintext — no masking needed here,
// unlike the Owner-facing view (StaffTaxProfileTab) which always masks by default.
export default function StaffTaxProfileCard() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: profile, isLoading } = useMyStaffTaxProfile()
  const upsertProfile = useUpsertStaffTaxProfile()
  const upsertW9Record = useUpsertW9Record()
  const uploadSignedW9 = useUploadSignedW9()
  const certifyW9Record = useCertifyW9Record()

  const [ssn, setSsn] = useState('')
  const [ein, setEin] = useState('')
  const [errors, setErrors] = useState<FormErrors>({})
  const [isPrefilled, setIsPrefilled] = useState(false)

  const [legalName, setLegalName] = useState('')
  const [dbaName, setDbaName] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipCode, setZipCode] = useState('')
  const [taxClassification, setTaxClassification] = useState('Individual')
  const [llcTaxClassificationType, setLlcTaxClassificationType] = useState('')
  const [otherClassificationDescription, setOtherClassificationDescription] = useState('')
  const [isSubjectToBackupWithholding, setIsSubjectToBackupWithholding] = useState(false)
  const [w9Errors, setW9Errors] = useState<W9FormErrors>({})
  const [isW9Prefilled, setIsW9Prefilled] = useState(false)

  useEffect(() => {
    if (isPrefilled || !profile) return
    setSsn(profile.ssn ?? '')
    setEin(profile.ein ?? '')
    setIsPrefilled(true)
  }, [isPrefilled, profile])

  useEffect(() => {
    if (isW9Prefilled || !profile) return
    if (profile.w9Record) {
      setLegalName(profile.w9Record.legalName)
      setDbaName(profile.w9Record.dbaName ?? '')
      setAddress(profile.w9Record.address)
      setCity(profile.w9Record.city)
      setState(profile.w9Record.state)
      setZipCode(profile.w9Record.zipCode)
      setTaxClassification(profile.w9Record.taxClassification)
      setLlcTaxClassificationType(profile.w9Record.llcTaxClassificationType ?? '')
      setOtherClassificationDescription(profile.w9Record.otherClassificationDescription ?? '')
      setIsSubjectToBackupWithholding(profile.w9Record.isSubjectToBackupWithholding)
    }
    setIsW9Prefilled(true)
  }, [isW9Prefilled, profile])

  const validateW9 = (): boolean => {
    const next: W9FormErrors = {}
    if (!legalName.trim()) next.legalName = t('taxiq.taxProfile.w9.errors.legalNameRequired')
    if (!address.trim()) next.address = t('taxiq.taxProfile.w9.errors.addressRequired')
    if (!city.trim()) next.city = t('taxiq.taxProfile.w9.errors.cityRequired')
    if (!state.trim()) next.state = t('taxiq.taxProfile.w9.errors.stateRequired')
    if (!zipCode.trim()) next.zipCode = t('taxiq.taxProfile.w9.errors.zipCodeRequired')
    if (taxClassification === 'LLC' && !llcTaxClassificationType) {
      next.llcTaxClassificationType = t('taxiq.taxProfile.w9.errors.llcTaxClassificationTypeRequired')
    }
    if (taxClassification === 'Other' && !otherClassificationDescription.trim()) {
      next.otherClassificationDescription = t('taxiq.taxProfile.w9.errors.otherClassificationDescriptionRequired')
    }
    setW9Errors(next)
    return Object.keys(next).length === 0
  }

  const handleSaveW9 = async () => {
    if (!validateW9()) return
    try {
      await upsertW9Record.mutateAsync({
        legalName: legalName.trim(),
        dbaName: dbaName.trim() || null,
        address: address.trim(),
        city: city.trim(),
        state: state.trim(),
        zipCode: zipCode.trim(),
        taxClassification,
        llcTaxClassificationType: taxClassification === 'LLC' ? llcTaxClassificationType : null,
        otherClassificationDescription:
          taxClassification === 'Other' ? otherClassificationDescription.trim() : null,
        isSubjectToBackupWithholding,
      })
      showToast(t('taxiq.taxProfile.w9.savedNotice'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.taxProfile.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  const handleW9FileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    try {
      await uploadSignedW9.mutateAsync(file)
      showToast(t('taxiq.taxProfile.w9.uploadSuccess'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.taxProfile.w9.errors.uploadFailed'
      showToast(t(i18nKey), 'error')
    }
  }

  const handleCertify = async () => {
    try {
      await certifyW9Record.mutateAsync()
      showToast(t('taxiq.taxProfile.w9.certifySuccess'), 'success')
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.taxProfile.w9.errors.certifyFailed'
      showToast(t(i18nKey), 'error')
    }
  }

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

          <div className="mt-6 border-t border-nexoraRule pt-4">
            <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">{t('taxiq.taxProfile.w9.title')}</h3>
            <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.taxProfile.w9.description')}</p>

            <div className="mt-3 space-y-3">
              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.legalNameLabel')}</label>
                <input
                  type="text"
                  value={legalName}
                  onChange={(e) => setLegalName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {w9Errors.legalName && <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.legalName}</p>}
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.dbaNameLabel')}</label>
                <input
                  type="text"
                  value={dbaName}
                  onChange={(e) => setDbaName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.addressLabel')}</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                />
                {w9Errors.address && <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.cityLabel')}</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {w9Errors.city && <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.city}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.stateLabel')}</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {w9Errors.state && <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.state}</p>}
                </div>
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.zipCodeLabel')}</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {w9Errors.zipCode && <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.zipCode}</p>}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.taxClassificationLabel')}</label>
                <select
                  value={taxClassification}
                  onChange={(e) => setTaxClassification(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                >
                  {TAX_CLASSIFICATION_OPTIONS.map((opt) => (
                    <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>

              {taxClassification === 'LLC' && (
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">
                    {t('taxiq.taxProfile.w9.llcTaxClassificationTypeLabel')}
                  </label>
                  <select
                    value={llcTaxClassificationType}
                    onChange={(e) => setLlcTaxClassificationType(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  >
                    <option value="">{t('taxiq.taxProfile.w9.selectPlaceholder')}</option>
                    {LLC_TAX_CLASSIFICATION_OPTIONS.map((opt) => (
                      <option key={opt.key} value={opt.key}>{t(opt.labelKey)}</option>
                    ))}
                  </select>
                  {w9Errors.llcTaxClassificationType && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.llcTaxClassificationType}</p>
                  )}
                </div>
              )}

              {taxClassification === 'Other' && (
                <div>
                  <label className="text-xs font-bold text-nexoraMuted">
                    {t('taxiq.taxProfile.w9.otherClassificationDescriptionLabel')}
                  </label>
                  <input
                    type="text"
                    value={otherClassificationDescription}
                    onChange={(e) => setOtherClassificationDescription(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-sm"
                  />
                  {w9Errors.otherClassificationDescription && (
                    <p className="mt-1 text-xs font-semibold text-rose-500">{w9Errors.otherClassificationDescription}</p>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <input
                  id="w9-backup-withholding"
                  type="checkbox"
                  checked={isSubjectToBackupWithholding}
                  onChange={(e) => setIsSubjectToBackupWithholding(e.target.checked)}
                  className="h-4 w-4 rounded border-nexoraBorder"
                />
                <label htmlFor="w9-backup-withholding" className="text-xs font-semibold text-nexoraText">
                  {t('taxiq.taxProfile.w9.backupWithholdingLabel')}
                </label>
              </div>

              <button
                type="button"
                onClick={handleSaveW9}
                disabled={upsertW9Record.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                {upsertW9Record.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('taxiq.taxProfile.w9.saveButton')}
              </button>

              <div>
                <label className="text-xs font-bold text-nexoraMuted">{t('taxiq.taxProfile.w9.uploadLabel')}</label>
                <div className="mt-1 flex items-center gap-2">
                  <input
                    id="w9-document-input"
                    type="file"
                    accept="image/*,application/pdf"
                    className="sr-only"
                    onChange={handleW9FileChange}
                    disabled={uploadSignedW9.isPending}
                  />
                  <label
                    htmlFor="w9-document-input"
                    className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-bold text-nexoraText"
                  >
                    {uploadSignedW9.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
                    {t('taxiq.taxProfile.w9.uploadChooseFile')}
                  </label>
                  {profile?.w9Record?.hasSignedDocument && (
                    profile.w9Record.signedDocumentUrl ? (
                      <a
                        href={profile.w9Record.signedDocumentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-bold text-nexoraBrand hover:underline"
                      >
                        {t('taxiq.taxProfile.w9.documentAttached')}
                      </a>
                    ) : (
                      <span className="text-xs text-nexoraMuted">{t('taxiq.taxProfile.w9.documentAttached')}</span>
                    )
                  )}
                </div>
              </div>

              <div className="mt-2 border-t border-nexoraRule pt-3">
                {profile?.w9Record?.certificationAccepted ? (
                  <p className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    {t('taxiq.taxProfile.w9.certifiedNotice', {
                      date: profile.w9Record.certifiedAt
                        ? new Date(profile.w9Record.certifiedAt).toLocaleDateString()
                        : '',
                    })}
                  </p>
                ) : (
                  <>
                    <p className="text-xs text-nexoraMuted">{t('taxiq.taxProfile.w9.notCertifiedNotice')}</p>
                    <button
                      type="button"
                      onClick={handleCertify}
                      disabled={certifyW9Record.isPending}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
                    >
                      {certifyW9Record.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldCheck className="h-3.5 w-3.5" />
                      )}
                      {t('taxiq.taxProfile.w9.certifyButton')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
