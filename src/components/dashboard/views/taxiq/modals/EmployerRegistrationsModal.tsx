import { useEffect, useRef, useState } from 'react'
import { Loader2, Plus, X } from 'lucide-react'
import IconButton from '../../../../ui/IconButton'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import {
  useTaxiqEmployerRegistrations,
  useUpsertEmployerRegistration,
} from '../../../../../data/hooks/useTaxiqEmployer'
import {
  DEPOSIT_SCHEDULES,
  KNOWN_JURISDICTIONS,
  REGISTRATION_STATUSES,
  type DepositSchedule,
  type Employer,
  type EmployerRegistration,
  type RegistrationStatus,
} from '../../../../../data/repositories/taxiqEmployer'
import { isApiError } from '../../../../../types/domain'
import { getErrorI18nKey } from '../../../../../data/errorCodes'
import { SkeletonList } from '../../../../ui/skeleton'

const CUSTOM_JURISDICTION_VALUE = '__custom__'

const REGISTRATION_STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Review: 'bg-amber-50 text-amber-600',
  MissingSetup: 'bg-rose-50 text-rose-600',
}

function RegistrationStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const style = REGISTRATION_STATUS_BADGE_STYLES[status] ?? 'bg-nexoraCanvas text-nexoraMuted'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${style}`}>
      {t(`taxiq.employerRegistry.registrations.statuses.${status}`)}
    </span>
  )
}

function toDateInputValue(value: string | null): string {
  return value ? value.slice(0, 10) : ''
}

export default function EmployerRegistrationsModal({
  employer,
  businessId,
  onClose,
  initialFocusJurisdiction,
}: {
  employer: Employer
  businessId: string
  onClose: () => void
  // Opens straight into the Edit form for this jurisdiction — used by JurisdictionsView's
  // per-row Edit link so Owner doesn't have to find the row again inside this modal's own list.
  initialFocusJurisdiction?: string
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const listQuery = useTaxiqEmployerRegistrations(employer.id)
  const upsert = useUpsertEmployerRegistration(businessId)

  const items = listQuery.data ?? []
  const existingJurisdictions = new Set(items.map((i) => i.jurisdiction))
  const availableJurisdictions = KNOWN_JURISDICTIONS.filter((j) => !existingJurisdictions.has(j))

  const [formOpen, setFormOpen] = useState(false)
  const [isEditingExisting, setIsEditingExisting] = useState(false)
  const [jurisdiction, setJurisdiction] = useState<string>('')
  const [customJurisdiction, setCustomJurisdiction] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus>('MissingSetup')
  const [depositSchedule, setDepositSchedule] = useState<DepositSchedule>('Monthly')
  const [nextDue, setNextDue] = useState('')
  const [registeredDate, setRegisteredDate] = useState('')
  const [agencyName, setAgencyName] = useState('')
  const [expirationDate, setExpirationDate] = useState('')
  const [alertBeforeDepositDueEnabled, setAlertBeforeDepositDueEnabled] = useState(true)
  const [alertOnRegistrationExpiryEnabled, setAlertOnRegistrationExpiryEnabled] = useState(true)
  const [sutaRatePercent, setSutaRatePercent] = useState('0')
  const [sutaWageBaseCap, setSutaWageBaseCap] = useState('0')
  const [error, setError] = useState('')

  const openAddForm = () => {
    setIsEditingExisting(false)
    setJurisdiction(availableJurisdictions[0] ?? CUSTOM_JURISDICTION_VALUE)
    setCustomJurisdiction('')
    setAccountNumber('')
    setRegistrationStatus('MissingSetup')
    setDepositSchedule('Monthly')
    setNextDue('')
    setRegisteredDate('')
    setAgencyName('')
    setExpirationDate('')
    setAlertBeforeDepositDueEnabled(true)
    setAlertOnRegistrationExpiryEnabled(true)
    setSutaRatePercent('0')
    setSutaWageBaseCap('0')
    setError('')
    setFormOpen(true)
  }

  const openEditForm = (reg: EmployerRegistration) => {
    setIsEditingExisting(true)
    setJurisdiction(reg.jurisdiction)
    setCustomJurisdiction('')
    setAccountNumber('')
    setRegistrationStatus(reg.registrationStatus as RegistrationStatus)
    setDepositSchedule(reg.depositSchedule as DepositSchedule)
    setNextDue(toDateInputValue(reg.nextDue))
    setRegisteredDate(toDateInputValue(reg.registeredDate))
    setAgencyName(reg.agencyName ?? '')
    setExpirationDate(toDateInputValue(reg.expirationDate))
    setAlertBeforeDepositDueEnabled(reg.alertBeforeDepositDueEnabled)
    setAlertOnRegistrationExpiryEnabled(reg.alertOnRegistrationExpiryEnabled)
    setSutaRatePercent(String(reg.sutaRatePercent))
    setSutaWageBaseCap(String(reg.sutaWageBaseCap))
    setError('')
    setFormOpen(true)
  }

  // Auto-open the Edit form once for the jurisdiction JurisdictionsView linked in from — the
  // "once" guard matters because closing the inline form after Save flips formOpen back to
  // false, and the refetched `items` would otherwise re-trigger this effect and reopen the
  // same Edit form right after every successful save.
  const hasAutoOpenedRef = useRef(false)
  useEffect(() => {
    if (!initialFocusJurisdiction || hasAutoOpenedRef.current) return
    const target = items.find((i) => i.jurisdiction === initialFocusJurisdiction)
    if (target) {
      openEditForm(target)
      hasAutoOpenedRef.current = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFocusJurisdiction, items])

  const effectiveJurisdiction =
    jurisdiction === CUSTOM_JURISDICTION_VALUE ? customJurisdiction.trim().toUpperCase() : jurisdiction

  const handleSubmit = async () => {
    if (upsert.isPending) return
    if (!effectiveJurisdiction) {
      setError(t('taxiq.employerRegistry.registrations.errors.jurisdictionRequired'))
      return
    }
    setError('')
    try {
      await upsert.mutateAsync({
        employerId: employer.id,
        jurisdiction: effectiveJurisdiction,
        accountNumber: accountNumber.trim() || undefined,
        registrationStatus,
        depositSchedule,
        nextDue: nextDue || null,
        registeredDate: registeredDate || null,
        agencyName: agencyName.trim() || null,
        expirationDate: expirationDate || null,
        alertBeforeDepositDueEnabled,
        alertOnRegistrationExpiryEnabled,
        sutaRatePercent: Number(sutaRatePercent) || 0,
        sutaWageBaseCap: Number(sutaWageBaseCap) || 0,
      })
      showToast(t('taxiq.employerRegistry.registrations.savedNotice'), 'success')
      setFormOpen(false)
    } catch (err) {
      const fallback = t('taxiq.employerRegistry.errors.generic')
      let message = fallback
      if (isApiError(err)) {
        const i18nKey = getErrorI18nKey(err.errorCode)
        const translated = t(i18nKey)
        message = translated !== i18nKey ? translated : (err.message || fallback)
      }
      setError(message)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {t('taxiq.employerRegistry.registrations.modalTitle', { name: employer.businessName })}
          </h2>
          <IconButton label={t('common.cancel')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {listQuery.isPending ? (
            <SkeletonList count={3} lines={1} />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-nexoraBorder">
              <table className="w-full min-w-[640px] text-left text-xs">
                <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
                  <tr>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.jurisdiction')}</th>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.accountNumber')}</th>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.status')}</th>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.depositSchedule')}</th>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.nextDue')}</th>
                    <th className="px-3 py-2">{t('taxiq.employerRegistry.registrations.columns.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-3 py-6 text-center font-medium text-nexoraMuted">
                        {t('taxiq.employerRegistry.registrations.emptyState')}
                      </td>
                    </tr>
                  ) : (
                    items.map((reg) => (
                      <tr key={reg.id} className="border-t border-nexoraRule">
                        <td className="px-3 py-2 font-bold text-nexoraText">{reg.jurisdiction}</td>
                        <td className="px-3 py-2 font-mono text-nexoraText">
                          {reg.accountNumberMasked ?? t('taxiq.employerRegistry.registrations.notSet')}
                        </td>
                        <td className="px-3 py-2">
                          <RegistrationStatusBadge status={reg.registrationStatus} />
                        </td>
                        <td className="px-3 py-2 text-nexoraText">
                          {t(`taxiq.employerRegistry.depositSchedules.${reg.depositSchedule}`)}
                        </td>
                        <td className="px-3 py-2 text-nexoraText">{toDateInputValue(reg.nextDue) || '—'}</td>
                        <td className="px-3 py-2">
                          <button
                            type="button"
                            onClick={() => openEditForm(reg)}
                            className="text-[11px] font-bold text-nexoraBrand hover:underline"
                          >
                            {t('common.edit')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!formOpen ? (
            <button
              type="button"
              onClick={openAddForm}
              disabled={availableJurisdictions.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraText disabled:opacity-60"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('taxiq.employerRegistry.registrations.addButton')}
            </button>
          ) : (
            <div className="space-y-3 rounded-xl border border-nexoraBorder p-4">
              <h3 className="text-xs font-extrabold uppercase text-nexoraMuted">
                {isEditingExisting
                  ? t('taxiq.employerRegistry.registrations.editFormTitle')
                  : t('taxiq.employerRegistry.registrations.addFormTitle')}
              </h3>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.jurisdiction')}
                  </label>
                  {isEditingExisting ? (
                    <input
                      type="text"
                      value={jurisdiction}
                      disabled
                      className="w-full rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs"
                    />
                  ) : (
                    <select
                      value={jurisdiction}
                      onChange={(e) => setJurisdiction(e.target.value)}
                      className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                    >
                      {availableJurisdictions.map((j) => (
                        <option key={j} value={j}>
                          {j}
                        </option>
                      ))}
                      <option value={CUSTOM_JURISDICTION_VALUE}>
                        {t('taxiq.employerRegistry.registrations.fields.customJurisdiction')}
                      </option>
                    </select>
                  )}
                  {!isEditingExisting && jurisdiction === CUSTOM_JURISDICTION_VALUE && (
                    <input
                      type="text"
                      value={customJurisdiction}
                      onChange={(e) => setCustomJurisdiction(e.target.value.toUpperCase())}
                      placeholder="US-XX"
                      className="mt-2 w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.registrationStatus')}
                  </label>
                  <select
                    value={registrationStatus}
                    onChange={(e) => setRegistrationStatus(e.target.value as RegistrationStatus)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                  >
                    {REGISTRATION_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {t(`taxiq.employerRegistry.registrations.statuses.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.accountNumber')}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    placeholder={t('taxiq.employerRegistry.registrations.fields.accountNumberPlaceholder')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                  {isEditingExisting && (
                    <p className="mt-1 text-[11px] text-nexoraMuted">
                      {t('taxiq.employerRegistry.registrations.fields.accountNumberKeepNotice')}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.depositSchedule')}
                  </label>
                  <select
                    value={depositSchedule}
                    onChange={(e) => setDepositSchedule(e.target.value as DepositSchedule)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs font-semibold"
                  >
                    {DEPOSIT_SCHEDULES.map((s) => (
                      <option key={s} value={s}>
                        {t(`taxiq.employerRegistry.depositSchedules.${s}`)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.registeredDate')}
                  </label>
                  <input
                    type="date"
                    value={registeredDate}
                    onChange={(e) => setRegisteredDate(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.nextDue')}
                  </label>
                  <input
                    type="date"
                    value={nextDue}
                    onChange={(e) => setNextDue(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.agencyName')}
                  </label>
                  <input
                    type="text"
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    placeholder={t('taxiq.employerRegistry.registrations.fields.agencyNamePlaceholder')}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.expirationDate')}
                  </label>
                  <input
                    type="date"
                    value={expirationDate}
                    onChange={(e) => setExpirationDate(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.sutaRatePercent')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={sutaRatePercent}
                    onChange={(e) => setSutaRatePercent(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-bold text-nexoraMuted">
                    {t('taxiq.employerRegistry.registrations.fields.sutaWageBaseCap')}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={sutaWageBaseCap}
                    onChange={(e) => setSutaWageBaseCap(e.target.value)}
                    className="w-full rounded-lg border border-nexoraBorder px-3 py-2 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
                  <input
                    type="checkbox"
                    checked={alertBeforeDepositDueEnabled}
                    onChange={(e) => setAlertBeforeDepositDueEnabled(e.target.checked)}
                  />
                  {t('taxiq.employerRegistry.registrations.fields.alertBeforeDepositDue')}
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-nexoraText">
                  <input
                    type="checkbox"
                    checked={alertOnRegistrationExpiryEnabled}
                    onChange={(e) => setAlertOnRegistrationExpiryEnabled(e.target.checked)}
                  />
                  {t('taxiq.employerRegistry.registrations.fields.alertOnRegistrationExpiry')}
                </label>
              </div>

              {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setFormOpen(false)}
                  className="rounded-lg px-4 py-2 text-xs font-bold text-nexoraMuted"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={upsert.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:opacity-60"
                >
                  {upsert.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('taxiq.employerRegistry.registrations.saveButton')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
