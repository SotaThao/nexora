import { useState, type MouseEvent } from 'react'
import { Check, CheckCircle2, Copy, Eye, FileImage } from 'lucide-react'
import type { TFunction } from '../../../types/contexts'
import type { PayoutRecord } from '../../../types/domain'
import { PayoutStatus } from '../../../data/payoutConstants'
import { copyTextToClipboard } from '../../../utils/clipboard'
import { formatCurrency, formatTransactionDateTime } from '../../dashboard/utils'
import {
  formatPayoutPeriodRange,
  getPayoutTypeI18nKeys,
  staffInitials,
} from '../../../utils/payoutDisplay'
import PayoutMethodBadge from './PayoutMethodBadge'
import PayoutStatusBadge from './PayoutStatusBadge'

function CopyablePayoutCode({
  code,
  t,
  className = '',
}: {
  code: string
  t: TFunction
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!code) return

    try {
      await copyTextToClipboard(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  if (!code) return null

  const label = copied ? t('common.copied') : t('dashboard.tips.payouts_manager.copy_payout_code')

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label}
      aria-label={label}
      className={`inline-flex min-w-0 max-w-full items-center gap-1 rounded-md px-1 py-0.5 font-mono text-[11px] font-bold text-nexoraBrand transition hover:bg-nexoraBrand/5 ${className}`.trim()}
    >
      <span className="truncate">{code}</span>
      {copied ? (
        <Check className="h-3 w-3 shrink-0 text-emerald-600" />
      ) : (
        <Copy className="h-3 w-3 shrink-0" />
      )}
    </button>
  )
}

type PayoutCardProps = {
  payout: PayoutRecord
  currentLanguage: string
  t: TFunction
  onSelectPayout: (payoutId: string) => void
  audience?: 'merchant' | 'staff'
}

export default function PayoutCard({
  payout,
  currentLanguage,
  t,
  onSelectPayout,
  audience = 'merchant',
}: PayoutCardProps) {
  const isStaffAudience = audience === 'staff'
  const canConfirm = isStaffAudience && payout.status === PayoutStatus.Pending
  const identityName = payout.staffDisplayName
  const identityPhotoUrl = payout.staffPhotoUrl
  const identitySecondary = payout.staffCode
  const hasEvidence = !isStaffAudience && payout.evidenceCount > 0
  const payoutTypeKeys = getPayoutTypeI18nKeys(payout.payoutTypes)
  const actionTitle = isStaffAudience
    ? t(canConfirm ? 'staff_payouts.confirm_receipt' : 'staff_payments.view_detail')
    : t('common.view_detail')
  const actionLabel = isStaffAudience
    ? t(canConfirm ? 'staff_payouts.action_confirm' : 'staff_payouts.action_view')
    : t('common.view_detail')

  return (
    <article className="space-y-3 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm transition hover:border-nexoraBrand/20 hover:shadow-md">
      <div className="flex items-center justify-between gap-2">
        <p className="text-lg font-black text-inkBlue">{formatCurrency(payout.amount)}</p>
        <PayoutStatusBadge status={payout.status} audience={audience} className="shrink-0" />
      </div>

      {isStaffAudience ? (
        <div
          data-testid="staff-payout-card-metadata"
          className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-nexoraBorder/70 bg-slate-50 px-3 py-3"
        >
          <div className="min-w-0">
            <PayoutMethodBadge method={payout.payoutMethodType} variant="featured" />
          </div>
          <div className="min-w-0 text-right">
            <CopyablePayoutCode code={payout.payoutCode} t={t} className="ml-auto" />
            <p className="mt-0.5 text-[11px] font-semibold text-[#5f6d82]">
              {formatTransactionDateTime(payout.createdAt, currentLanguage)}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex min-w-0 items-center gap-2 rounded-xl border border-nexoraBorder/70 bg-slate-50 p-3">
          {identityPhotoUrl ? (
            <img src={identityPhotoUrl} alt={identityName} className="h-9 w-9 shrink-0 rounded-full object-cover" />
          ) : (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-nexoraBrand text-[11px] font-black text-white">
              {staffInitials(identityName)}
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold leading-tight text-inkBlue">{identityName}</p>
            {identitySecondary ? <p className="mt-0.5 text-xs text-[#5f6d82]">{identitySecondary}</p> : null}
          </div>
          <div className="shrink-0 text-right">
            <CopyablePayoutCode code={payout.payoutCode} t={t} className="ml-auto" />
            <p className="mt-0.5 text-[11px] font-semibold text-[#5f6d82]">
              {formatTransactionDateTime(payout.createdAt, currentLanguage)}
            </p>
          </div>
        </div>
      )}

      {isStaffAudience ? (
        <div data-testid="staff-payout-coverage" className="flex min-w-0 items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[9px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.tips.payouts_manager.card_coverage')}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#5f6d82]">
              {formatPayoutPeriodRange(payout.periodStart, payout.periodEnd, currentLanguage)}
            </p>
          </div>
          <div data-testid="staff-payout-types" className="flex max-w-[45%] shrink-0 flex-wrap justify-end gap-1">
            {payoutTypeKeys.map((key) => (
              <span
                key={key}
                className="rounded-md border border-nexoraBorder bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold"
              >
                {t(key)}
              </span>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[minmax(0,1.35fr)_minmax(7rem,0.65fr)]">
          <div className="min-w-0 pr-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.tips.payouts_manager.card_coverage')}
            </p>
            <p className="mt-1 text-xs font-semibold text-[#5f6d82]">
              {formatPayoutPeriodRange(payout.periodStart, payout.periodEnd, currentLanguage)}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {payoutTypeKeys.map((key) => (
                <span
                  key={key}
                  className="rounded-md border border-nexoraBorder bg-slate-50 px-1.5 py-0.5 text-[10px] font-bold"
                >
                  {t(key)}
                </span>
              ))}
            </div>
          </div>
          <div className="min-w-0 border-l border-nexoraBorder pl-3">
            <p className="text-[9px] font-black uppercase tracking-wider text-nexoraSubtle">
              {t('dashboard.tips.payouts_manager.card_payout_to')}
            </p>
            <div className="mt-2">
              <PayoutMethodBadge method={payout.payoutMethodType} />
            </div>
          </div>
        </div>
      )}

      {hasEvidence ? (
        <button
          type="button"
          onClick={() => onSelectPayout(payout.id)}
          className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 text-xs font-bold text-nexoraMuted transition hover:border-nexoraBrand/40 hover:bg-nexoraBrand/5 hover:text-nexoraBrand"
        >
          <FileImage className="h-4 w-4 shrink-0" />
          <span>{t('dashboard.tips.payouts_manager.evidence_count', { count: payout.evidenceCount })}</span>
        </button>
      ) : null}

      <div className="border-t border-nexoraBorder/60 pt-3">
        <button
          type="button"
          onClick={() => onSelectPayout(payout.id)}
          title={actionTitle}
          aria-label={actionTitle}
          className={`inline-flex h-10 w-full items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-xs font-bold transition ${
            canConfirm
              ? 'bg-nexoraBrand text-white hover:bg-[#393bc8]'
              : 'border border-nexoraBorder bg-white text-inkBlue hover:border-nexoraBrand/40 hover:bg-nexoraBrand/5'
          }`}
        >
          {canConfirm ? <CheckCircle2 className="h-4 w-4 shrink-0" /> : <Eye className="h-4 w-4 shrink-0" />}
          <span>{actionLabel}</span>
        </button>
      </div>
    </article>
  )
}
