import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqEmployers } from '../../../../data/hooks/useTaxiqEmployer'
import { useJurisdictionSummary } from '../../../../data/hooks/useJurisdictions'
import { SkeletonList } from '../../../ui/skeleton'
import { formatCurrency } from '../../utils'
import EmployerRegistrationsModal from './modals/EmployerRegistrationsModal'

const REGISTRATION_STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Review: 'bg-amber-50 text-amber-600',
  MissingSetup: 'bg-rose-50 text-rose-600',
  Inactive: 'bg-nexoraCanvas text-nexoraMuted',
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

function AlertBadge({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation()
  return (
    <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
      {t(labelKey)}
    </span>
  )
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export default function JurisdictionsView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const [manageOpen, setManageOpen] = useState(false)
  const [focusJurisdiction, setFocusJurisdiction] = useState<string | undefined>(undefined)

  const employersQuery = useTaxiqEmployers(businessId)
  const employer = employersQuery.data?.items?.[0]

  const summaryQuery = useJurisdictionSummary(businessId, employer?.id)
  const rows = summaryQuery.data ?? []

  const openManage = (jurisdiction?: string) => {
    setFocusJurisdiction(jurisdiction)
    setManageOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.jurisdictions.title')}</h1>
          <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.jurisdictions.subtitle')}</p>
        </div>
        {rows.length > 0 && (
          <button
            type="button"
            onClick={() => openManage(undefined)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            {t('taxiq.jurisdictions.manageButton')}
          </button>
        )}
      </div>

      {!employersQuery.isPending && !employer && (
        <div className="nexora-card p-4 text-xs font-semibold text-amber-700">{t('taxiq.jurisdictions.noEmployer')}</div>
      )}

      {summaryQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={4} lines={2} />
        </div>
      ) : rows.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.jurisdictions.emptyState')}</p>
          {employer && (
            <button
              type="button"
              onClick={() => openManage(undefined)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.jurisdictions.manageButton')}
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[900px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.name')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.employeeTax')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.employerTax')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.registration')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.schedule')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.nextDue')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.alerts')}</th>
                <th className="px-3 py-2">{t('taxiq.jurisdictions.columns.action')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t border-nexoraRule align-top">
                  <td className="px-3 py-2">
                    <div className="font-bold text-nexoraText">{row.name}</div>
                    <div className="text-[11px] text-nexoraMuted">{row.jurisdiction}</div>
                  </td>
                  <td className="px-3 py-2 text-nexoraText">{formatCurrency(row.employeeTaxYtd)}</td>
                  <td className="px-3 py-2 text-nexoraText">{formatCurrency(row.employerTaxYtd)}</td>
                  <td className="px-3 py-2">
                    <RegistrationStatusBadge status={row.registrationStatus} />
                  </td>
                  <td className="px-3 py-2 text-nexoraText">
                    {t(`taxiq.employerRegistry.depositSchedules.${row.depositSchedule}`)}
                  </td>
                  <td className="px-3 py-2 text-nexoraText">{formatDate(row.nextDue)}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-col items-start gap-1">
                      {row.isDepositDueSoon && <AlertBadge labelKey="taxiq.jurisdictions.alerts.depositDueSoon" />}
                      {row.isRegistrationExpiringSoon && (
                        <AlertBadge labelKey="taxiq.jurisdictions.alerts.registrationExpiringSoon" />
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      onClick={() => openManage(row.jurisdiction)}
                      className="text-[11px] font-bold text-nexoraBrand hover:underline"
                    >
                      {t('common.edit')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {manageOpen && employer && (
        <EmployerRegistrationsModal
          employer={employer}
          businessId={businessId}
          initialFocusJurisdiction={focusJurisdiction}
          onClose={() => setManageOpen(false)}
        />
      )}
    </div>
  )
}
