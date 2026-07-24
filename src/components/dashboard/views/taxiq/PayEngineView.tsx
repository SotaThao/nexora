import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { usePayRuleList } from '../../../../data/hooks/usePosStaffProfile'
import { SkeletonList } from '../../../ui/skeleton'
import EmployeePaymentSetupModal from './modals/EmployeePaymentSetupModal'

function ReadyBadge({ ready }: { ready: boolean }) {
  const { t } = useTranslation()
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
        ready ? 'bg-emerald-50 text-emerald-600' : 'bg-nexoraCanvas text-nexoraMuted'
      }`}
    >
      {ready ? t('taxiq.payEngine.ready') : t('taxiq.payEngine.notReady')}
    </span>
  )
}

export default function PayEngineView({ businessId }: { businessId: string }) {
  const { t } = useTranslation()
  const listQuery = usePayRuleList(businessId)
  const [configureTarget, setConfigureTarget] = useState<{ businessStaffLinkId: string; displayName: string } | null>(null)

  const items = listQuery.data?.items ?? []

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-extrabold text-nexoraText">{t('taxiq.payEngine.title')}</h1>
        <p className="text-xs font-medium text-nexoraMuted">{t('taxiq.payEngine.subtitle')}</p>
      </div>

      {listQuery.isPending ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : items.length === 0 ? (
        <div className="nexora-card flex flex-col items-center gap-3 p-10 text-center">
          <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.payEngine.emptyState')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[880px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.employee')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.contractType')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.payFormula')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.paySchedule')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.payoutMethod')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.overallReady')}</th>
                <th className="px-4 py-3">{t('taxiq.payEngine.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.businessStaffLinkId} className="border-t border-nexoraRule">
                  <td className="px-4 py-3 font-bold text-nexoraText">{item.displayName}</td>
                  <td className="px-4 py-3 text-nexoraText">
                    {item.contractType ? t(`taxiq.payoutCenter.contractTypes.${item.contractType}`) : '—'}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">
                    {item.hasPayRule && item.payStructureType ? t(`taxiq.payEngine.payFormulas.${item.payStructureType}`) : t('taxiq.payEngine.notSet')}
                  </td>
                  <td className="px-4 py-3 text-nexoraText">
                    {item.paySchedule ? t(`taxiq.payEngine.paySchedules.${item.paySchedule}`) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <ReadyBadge ready={item.payoutMethodReady} />
                  </td>
                  <td className="px-4 py-3">
                    <ReadyBadge ready={item.overallReady} />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => setConfigureTarget({ businessStaffLinkId: item.businessStaffLinkId, displayName: item.displayName })}
                      className="text-[11px] font-bold text-nexoraBrand hover:underline"
                    >
                      {t('taxiq.payEngine.configureButton')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {configureTarget && (
        <EmployeePaymentSetupModal
          businessId={businessId}
          businessStaffLinkId={configureTarget.businessStaffLinkId}
          displayName={configureTarget.displayName}
          onClose={() => setConfigureTarget(null)}
        />
      )}
    </div>
  )
}
