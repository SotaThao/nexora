import { useState } from 'react'
import { AlertCircle, Lock } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { useConfirmStaffPayout, useTaxiqStaffPendingPayouts } from '../../../../data/hooks/useTaxiqStaffPayouts'
import type { StaffPendingPayout } from '../../../../data/repositories/taxiqStaffPayouts'
import { isApiError } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { SkeletonList } from '../../../ui/skeleton'
import ConfirmModal from '../../../dashboard/views/taxiq/modals/ConfirmModal'
import DisputePayoutModal from './modals/DisputePayoutModal'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value)
}

export default function PayoutConfirmationView({ staffTaxYearStatus }: { staffTaxYearStatus: string }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const listQuery = useTaxiqStaffPendingPayouts()
  const confirmPayout = useConfirmStaffPayout()

  const [confirmingPayout, setConfirmingPayout] = useState<StaffPendingPayout | null>(null)
  const [disputingPayout, setDisputingPayout] = useState<StaffPendingPayout | null>(null)
  // Local-only: BE has no "history" endpoint (only /pending), so once a dispute is
  // submitted the record drops out of the next /pending fetch. We keep it visible with
  // a "Dispute Reported" badge for the rest of this session per the AC; it will no
  // longer appear after a page reload (see ticket's open question re: history tab).
  const [disputedIds, setDisputedIds] = useState<Set<string>>(new Set())

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

  const handleDisputeSuccess = (payoutId: string) => {
    setDisputedIds((prev) => new Set(prev).add(payoutId))
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

      <div className="overflow-x-auto rounded-xl border border-nexoraBorder bg-white">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-nexoraCanvas text-[10px] font-extrabold uppercase text-nexoraMuted">
            <tr>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.payPeriod')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.period')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.servicePayout')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.tip')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.bonus')}</th>
              <th className="px-4 py-3">{t('taxiq.staffPayoutConfirmation.columns.reimbursement')}</th>
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
              items.map((payout) => {
                const isDisputed = disputedIds.has(payout.id)
                return (
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
                        {isDisputed ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:border-rose-500/20 dark:bg-rose-500/10 dark:text-rose-400">
                            <AlertCircle className="h-3 w-3" />
                            {t('taxiq.staffPayoutConfirmation.disputeReportedBadge')}
                          </span>
                        ) : isLocked ? (
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
                )
              })
            )}
          </tbody>
        </table>
      </div>

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
          onSuccess={() => handleDisputeSuccess(disputingPayout.id)}
          payout={disputingPayout}
        />
      )}
    </div>
  )
}
