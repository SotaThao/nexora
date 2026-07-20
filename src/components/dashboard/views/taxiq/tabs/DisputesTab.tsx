import { useState } from 'react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useTaxiqOwnerDisputedPayouts } from '../../../../../data/hooks/useTaxiqOwnerPayouts'
import type { DisputedPayout } from '../../../../../data/repositories/taxiqOwnerPayouts'
import { SkeletonList } from '../../../../ui/skeleton'
import { formatCurrency } from '../../../utils'
import ResolveDisputeModal from '../modals/ResolveDisputeModal'

export default function DisputesTab({
  ownerTaxYearId,
}: {
  ownerTaxYearId: string
}) {
  const { t } = useTranslation()
  const [resolvingDispute, setResolvingDispute] = useState<DisputedPayout | null>(null)

  const listQuery = useTaxiqOwnerDisputedPayouts(ownerTaxYearId)
  const items = listQuery.data ?? []

  if (listQuery.isPending) {
    return (
      <div className="nexora-card p-4">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="nexora-card p-8 text-center text-xs font-medium text-nexoraMuted">
        {t('taxiq.payoutCenter.disputes.emptyState')}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((dispute) => (
        <div key={dispute.id} className="nexora-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-sm font-extrabold text-nexoraText">{dispute.staffName}</div>
              <div className="text-[11px] text-nexoraMuted">{dispute.periodStart} – {dispute.periodEnd}</div>
            </div>
            <button
              type="button"
              onClick={() => setResolvingDispute(dispute)}
              className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
            >
              {t('taxiq.payoutCenter.disputes.resolveButton')}
            </button>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-lg border border-nexoraBorder p-3">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                {t('taxiq.payoutCenter.resolveDispute.ownerEnteredLabel')}
              </div>
              <div className="mt-1 text-sm font-bold text-nexoraText">{formatCurrency(dispute.grossPayout)}</div>
              <div className="text-[11px] text-nexoraMuted">
                {t('taxiq.payoutCenter.form.servicePayoutLabel')}: {formatCurrency(dispute.servicePayout)} ·{' '}
                {t('taxiq.payoutCenter.form.tipCardAmountLabel')}: {formatCurrency(dispute.tipCardAmount)} ·{' '}
                {t('taxiq.payoutCenter.form.tipCashAmountLabel')}: {formatCurrency(dispute.tipCashAmount)} ·{' '}
                {t('taxiq.payoutCenter.form.bonusLabel')}: {formatCurrency(dispute.bonus)}
              </div>
            </div>
            <div className="rounded-lg border border-rose-200 bg-rose-50/40 p-3 dark:border-rose-500/20">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-nexoraMuted">
                {t('taxiq.payoutCenter.resolveDispute.staffReportedLabel')}
              </div>
              <div className="mt-1 text-sm font-bold text-nexoraText">{formatCurrency(dispute.staffDisputeAmount)}</div>
              <div className="text-[11px] text-nexoraMuted">{dispute.staffDisputeNote}</div>
            </div>
          </div>
        </div>
      ))}

      {resolvingDispute && (
        <ResolveDisputeModal
          open={!!resolvingDispute}
          onClose={() => setResolvingDispute(null)}
          ownerTaxYearId={ownerTaxYearId}
          dispute={resolvingDispute}
        />
      )}
    </div>
  )
}
