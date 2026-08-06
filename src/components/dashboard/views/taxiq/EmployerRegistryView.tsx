import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useTaxiqEmployers } from '../../../../data/hooks/useTaxiqEmployer'
import type { Employer } from '../../../../data/repositories/taxiqEmployer'
import { SkeletonList } from '../../../ui/skeleton'
import AddEditEmployerModal from './modals/AddEditEmployerModal'
import EmployerRegistrationsModal from './modals/EmployerRegistrationsModal'

const STATUS_BADGE_STYLES: Record<string, string> = {
  Active: 'bg-emerald-50 text-emerald-600',
  Degraded: 'bg-amber-50 text-amber-600',
  Inactive: 'bg-nexoraCanvas text-nexoraMuted',
  Suspended: 'bg-rose-50 text-rose-600',
}

function EmployerStatusBadge({ status }: { status: string }) {
  const { t } = useTranslation()
  const style = STATUS_BADGE_STYLES[status] ?? 'bg-nexoraCanvas text-nexoraMuted'
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${style}`}>
      {t(`taxiq.employerRegistry.statuses.${status}`)}
    </span>
  )
}

function formatDate(value: string | null): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString()
}

export default function EmployerRegistryView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const listQuery = useTaxiqEmployers(businessId)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editTarget, setEditTarget] = useState<Employer | null>(null)
  const [registrationsTarget, setRegistrationsTarget] = useState<Employer | null>(null)

  const items = listQuery.data?.items ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.employerRegistry.title')}</h1>
          <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.employerRegistry.subtitle')}</p>
        </div>
        {items.length > 0 && (
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.employerRegistry.addButton')}
          </button>
        )}
      </div>

      {listQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.employerRegistry.emptyState')}</p>
          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('taxiq.employerRegistry.addButton')}
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[960px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.employer')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.industry')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.employees')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.registrations')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.depositSchedule')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.nextDeposit')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.health')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.status')}</th>
                <th className="px-4 py-3">{t('taxiq.employerRegistry.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((employer) => (
                <tr key={employer.id} className="border-t border-nexoraRule">
                  <td className="px-4 py-3">
                    <div className="font-bold text-nexoraText">{employer.businessName}</div>
                    <div className="text-[11px] text-nexoraMuted">{employer.einMasked ?? t('taxiq.employerRegistry.einNotSet')}</div>
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{employer.industry ?? '—'}</td>
                  <td className="px-4 py-3 text-nexoraText">{employer.employeeCount}</td>
                  <td className="px-4 py-3 text-nexoraText">{employer.registrationsSummary || '—'}</td>
                  <td className="px-4 py-3 text-nexoraText">
                    {t(`taxiq.employerRegistry.depositSchedules.${employer.federalDepositSchedule}`)}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">{formatDate(employer.nextDeposit)}</td>
                  <td className="px-4 py-3 text-nexoraText">{employer.healthPercent}%</td>
                  <td className="px-4 py-3">
                    <EmployerStatusBadge status={employer.status} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setEditTarget(employer)}
                        className="text-[11px] font-bold text-nexoraBrand hover:underline"
                      >
                        {t('common.edit')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRegistrationsTarget(employer)}
                        className="text-[11px] font-bold text-nexoraBrand hover:underline"
                      >
                        {t('taxiq.employerRegistry.registrationsButton')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddModal && (
        <AddEditEmployerModal mode="create" businessId={businessId} onClose={() => setShowAddModal(false)} />
      )}

      {editTarget && (
        <AddEditEmployerModal
          mode="edit"
          businessId={businessId}
          employer={editTarget}
          onClose={() => setEditTarget(null)}
        />
      )}

      {registrationsTarget && (
        <EmployerRegistrationsModal
          employer={registrationsTarget}
          businessId={businessId}
          onClose={() => setRegistrationsTarget(null)}
        />
      )}
    </div>
  )
}
