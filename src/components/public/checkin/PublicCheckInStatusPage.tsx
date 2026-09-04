// PublicCheckInStatusPage — "where am I in line?", addressed by the order's ReceiptToken.
// No slug in the route: the token identifies the order on its own (§6). Polls on the same
// 15s cadence the front desk already uses — there is no realtime channel in this pass (§8.4).
import { useParams } from 'react-router-dom'
import { CheckCircle2, Loader2, RefreshCw, Scissors, Users, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { PosOrderStatus } from '../../../constants/posOrderStatus'
import { usePublicCheckInStatus } from '../../../data/hooks/usePublicCheckIn'
import PublicCheckInShell from './PublicCheckInShell'

export default function PublicCheckInStatusPage() {
  const { receiptToken } = useParams<{ receiptToken: string }>()
  const { t } = useTranslation()
  const { data, isLoading, isError, isFetching, refetch } = usePublicCheckInStatus(receiptToken)

  if (isLoading) {
    return (
      <PublicCheckInShell>
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
      </PublicCheckInShell>
    )
  }

  if (isError || !data) {
    return (
      <PublicCheckInShell>
        <div className="public-checkin-card">
          <p className="text-sm font-bold text-white">{t('public.checkIn.statusNotFoundTitle')}</p>
          <p className="mt-2 text-xs text-white/60">{t('public.checkIn.statusNotFoundDesc')}</p>
        </div>
      </PublicCheckInShell>
    )
  }

  const isWaiting = data.status === PosOrderStatus.Waiting
  const isInService = data.status === PosOrderStatus.InService
  const isCompleted = data.status === PosOrderStatus.Completed
  const isCancelled = data.status === PosOrderStatus.Cancelled

  return (
    <PublicCheckInShell>
      <div className="public-checkin-card space-y-4">
        <div className="rounded-2xl border border-white/15 bg-white/5 p-5">
          <p className="text-[10px] font-black uppercase tracking-wider text-white/50">
            {t('public.checkIn.yourNumberLabel')}
          </p>
          <p className="mt-1 text-4xl font-black text-white">{data.orderNumber}</p>
        </div>

        {isWaiting ? (
          <div className="space-y-2">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brandCyan">
              <Users className="h-6 w-6" />
            </span>
            <p className="text-xl font-black text-white">
              {data.peopleAhead === 0
                ? t('public.checkIn.statusYoureNext')
                : t('public.checkIn.statusPeopleAhead', { count: data.peopleAhead })}
            </p>
            <p className="text-sm text-white/60">{t('public.checkIn.statusWaitingDesc')}</p>
          </div>
        ) : null}

        {isInService ? (
          <div className="space-y-2">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brandCyan">
              <Scissors className="h-6 w-6" />
            </span>
            <p className="text-xl font-black text-white">{t('public.checkIn.statusInServiceTitle')}</p>
            <p className="text-sm text-white/60">{t('public.checkIn.statusInServiceDesc')}</p>
          </div>
        ) : null}

        {isCompleted ? (
          <div className="space-y-2">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-brandCyan">
              <CheckCircle2 className="h-6 w-6" />
            </span>
            <p className="text-xl font-black text-white">{t('public.checkIn.statusCompletedTitle')}</p>
            <p className="text-sm text-white/60">{t('public.checkIn.statusCompletedDesc')}</p>
          </div>
        ) : null}

        {isCancelled ? (
          <div className="space-y-2">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-nexoraDanger">
              <XCircle className="h-6 w-6" />
            </span>
            <p className="text-xl font-black text-white">{t('public.checkIn.statusCancelledTitle')}</p>
            <p className="text-sm text-white/60">{t('public.checkIn.statusCancelledDesc')}</p>
          </div>
        ) : null}

        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-white/20 text-sm font-bold text-white hover:border-white/50 disabled:opacity-60"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          {t('public.checkIn.refreshButton')}
        </button>
        <p className="text-[11px] text-white/45">{t('public.checkIn.autoRefreshHint')}</p>
      </div>
    </PublicCheckInShell>
  )
}
