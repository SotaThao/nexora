import { useState } from 'react'
import { Lock } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useConfirmStaffPayout, useTaxiqStaffPendingPayouts } from '../../../../data/hooks/useTaxiqStaffPayouts'
import type { StaffPendingPayout } from '../../../../data/repositories/taxiqStaffPayouts'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import Tooltip from '../../../ui/Tooltip'
import ConfirmModal from '../../../dashboard/views/taxiq/modals/ConfirmModal'
import DisputePayoutModal from './modals/DisputePayoutModal'
import StaffPayoutHistoryTab from './StaffPayoutHistoryTab'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

type Tab = 'pending' | 'history'

export default function PayoutConfirmationView({ staffTaxYearStatus }: { staffTaxYearStatus: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const listQuery = useTaxiqStaffPendingPayouts()
  const confirmPayout = useConfirmStaffPayout()

  const [activeTab, setActiveTab] = useState<Tab>('pending')
  const [confirmingPayout, setConfirmingPayout] = useState<StaffPendingPayout | null>(null)
  const [disputingPayout, setDisputingPayout] = useState<StaffPendingPayout | null>(null)

  const isLocked = staffTaxYearStatus === 'Locked'
  const items = listQuery.data ?? []

  const handleConfirm = async () => {
    if (!confirmingPayout) return
    try {
      await confirmPayout.mutateAsync(confirmingPayout.id)
      showToast(t('taxiq.staffPayoutConfirmation.confirmSuccess'), 'success')
      setConfirmingPayout(null)
    } catch (err) {
      const i18nKey = isApiError(err) ? getErrorI18nKey(err.errorCode) : 'taxiq.staffPayoutConfirmation.errors.generic'
      showToast(t(i18nKey), 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-extrabold text-nexoraText">{t('taxiq.staffPayoutConfirmation.title')}</h2>
        <p className="mt-1 text-xs text-nexoraMuted">{t('taxiq.staffPayoutConfirmation.subtitle')}</p>
      </div>

      {isLocked && (
        <div className="flex items-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraCanvas px-3 py-2 text-xs font-semibold text-nexoraMuted">
          <Lock className="h-3.5 w-3.5 shrink-0" />
          {t('taxiq.staffPayoutConfirmation.lockedNotice')}
        </div>
      )}

      <div className="flex items-center gap-2 border-b border-nexoraBorder">
        {(['pending', 'history'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`-mb-px border-b-2 px-3 py-2 text-xs font-bold transition ${
              activeTab === tab
                ? 'border-nexoraBrand text-nexoraBrand'
                : 'border-transparent text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t(`taxiq.staffPayoutConfirmation.tabs.${tab}`)}
          </button>
        ))}
      </div>

      {activeTab === 'history' ? (
        <StaffPayoutHistoryTab />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
          <table className="w-full min-w-[860px] text-left text-xs">
            <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
              <tr>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.staffPayoutConfirmation.columns.payPeriod')}
                    <Tooltip content={t('taxiq.payoutCenter.tooltips.payPeriod')} />
                  </span>
                </th>
                <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.period')}</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.staffPayoutConfirmation.columns.servicePayout')}
                    <Tooltip content={t('taxiq.payoutCenter.tooltips.servicePayout')} />
                  </span>
                </th>
                <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.tip')}</th>
                <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.bonus')}</th>
                <th className="px-4 py-3">
                  <span className="inline-flex items-center gap-1">
                    {t('taxiq.staffPayoutConfirmation.columns.reimbursement')}
                    <Tooltip content={t('taxiq.payoutCenter.tooltips.reimbursement')} />
                  </span>
                </th>
                <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.paymentMethod')}</th>
                <th className="px-4 py-3 text-right">{t('taxiq.staffPayoutConfirmation.columns.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {listQuery.isPending ? (
                <tr>
                  <td colSpan={8} className="p-4">
                    <SkeletonList count={4} lines={1} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center font-medium text-nexoraMuted">
                    {t('taxiq.staffPayoutConfirmation.emptyState')}
                  </td>
                </tr>
              ) : (
                items.map((payout) => (
                  <tr key={payout.id} className="border-t border-nexoraRule">
                    <td className="px-4 py-3 font-bold text-nexoraText">{payout.payPeriod}</td>
                    <td className="px-4 py-3 text-nexoraMuted">{payout.periodStart} – {payout.periodEnd}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.servicePayout)}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.tip)}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.bonus)}</td>
                    <td className="px-4 py-3 text-nexoraText">{formatCurrency(payout.reimbursement)}</td>
                    <td className="px-4 py-3 text-nexoraMuted">{payout.paymentMethod}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        {isLocked ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-nexoraBorder px-2 py-0.5 text-[10px] font-bold text-nexoraMuted">
                            <Lock className="h-3 w-3" />
                            {t('taxiq.staffPayoutConfirmation.lockedBadge')}
                          </span>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => setConfirmingPayout(payout)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-nexoraBrand hover:underline"
                            >
                              {t('taxiq.staffPayoutConfirmation.confirmAction')}
                            </button>
                            <button
                              type="button"
                              onClick={() => setDisputingPayout(payout)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                            >
                              {t('taxiq.staffPayoutConfirmation.disputeAction')}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        open={!!confirmingPayout}
        onClose={() => setConfirmingPayout(null)}
        onConfirm={handleConfirm}
        title={t('taxiq.staffPayoutConfirmation.confirmDialog.title')}
        message={t('taxiq.staffPayoutConfirmation.confirmDialog.message')}
        confirmLabel={t('taxiq.staffPayoutConfirmation.confirmDialog.confirmLabel')}
        isPending={confirmPayout.isPending}
      />

      {disputingPayout && (
        <DisputePayoutModal
          open={!!disputingPayout}
          onClose={() => setDisputingPayout(null)}
          onSuccess={() => setDisputingPayout(null)}
          payout={disputingPayout}
        />
      )}
    </div>
  )
}
