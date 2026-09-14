// StaffLinkRequestCard — an incoming salon link request with status + Approve/Reject CTAs.
// Used on staff dashboard surfaces that render pending staff link requests (e.g., "My Salon").
// The request comes straight from GET /staff/link-requests (already filtered server-side to
// WaitingStaffAcceptance), not derived from the notifications feed.
import { Check, Clock, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useAcceptStaffLinkRequest,
  useRejectStaffLinkRequest,
} from '../../../data/hooks/useStaffSelf'
import type { StaffLinkRequestDetail } from '../../../types/domain'
import { isStaffLinkRequestActionable } from '../../../utils/staffLinkRequestStatus'

export default function StaffLinkRequestCard({
  request,
  variant = 'card',
}: {
  request: StaffLinkRequestDetail
  variant?: 'card' | 'list-item'
}) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const acceptMutation = useAcceptStaffLinkRequest()
  const rejectMutation = useRejectStaffLinkRequest()

  if (!isStaffLinkRequestActionable(request.status)) {
    return null
  }

  const isPending = acceptMutation.isPending || rejectMutation.isPending
  const businessName = request.businessName || t('staff_dashboard.notifications.link_request_business_fallback')
  const role = request.roleAtBusiness || null

  const handleAccept = () => {
    acceptMutation.mutate(request.id, {
      onSuccess: () => {
        showToast(t('staff_dashboard.notifications.link_request_accepted'), 'success')
      },
      onError: () => showToast(t('staff_dashboard.notifications.link_request_accept_failed'), 'error'),
    })
  }

  const handleReject = async () => {
    const confirmed = await showConfirm(
      t('staff_dashboard.notifications.reject_link_request_confirm', { business: businessName }),
      t('staff_dashboard.notifications.reject_link_request_confirm_title'),
    )
    if (!confirmed) return
    rejectMutation.mutate(request.id, {
      onSuccess: () => {
        showToast(t('staff_dashboard.notifications.link_request_rejected'), 'success')
      },
      onError: () => showToast(t('staff_dashboard.notifications.link_request_reject_failed'), 'error'),
    })
  }

  const containerClass = variant === 'card'
    ? 'flex flex-col gap-3 rounded-xl border border-nexoraBorder bg-white p-3.5 sm:flex-row sm:items-center sm:justify-between'
    : 'flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between'

  return (
    <div className={containerClass}>
      <div className="flex min-w-0 items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-nexoraBrandSoft text-nexoraBrand">
          {request.businessLogoUrl ? (
            <img src={request.businessLogoUrl} alt={businessName} className="h-full w-full object-cover" />
          ) : (
            <span className="text-sm font-bold uppercase">{businessName.substring(0, 2)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <div className="min-w-0 max-w-full truncate text-sm font-extrabold text-nexoraText">
              {businessName}
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-black uppercase tracking-wider text-amber-600">
              <Clock className="h-2.5 w-2.5" />
              {t('staff_dashboard.qr.link_request_pending')}
            </span>
          </div>
          {role ? (
            <div className="mt-0.5 truncate text-xs text-nexoraMuted">
              {t('staff_dashboard.notifications.link_request_role', { role })}
            </div>
          ) : null}
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center">
        <button
          type="button"
          onClick={handleAccept}
          disabled={isPending}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-3 text-xs font-semibold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <Check className="h-4 w-4 shrink-0" />
          {t('staff_dashboard.notifications.accept_link_request')}
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={isPending}
          className="inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-nexoraDanger/20 bg-nexoraDanger/10 px-3 text-xs font-semibold text-nexoraDanger transition hover:bg-nexoraDanger/15 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          <XCircle className="h-4 w-4 shrink-0" />
          {t('staff_dashboard.notifications.reject_link_request')}
        </button>
      </div>
    </div>
  )
}
