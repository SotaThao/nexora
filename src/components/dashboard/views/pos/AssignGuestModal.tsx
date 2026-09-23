// Assign Guest — Turn Board's picker for putting a waiting order on a specific technician.
// Only offers guests whose next unassigned service line this technician is qualified for (same
// skill rule as the Order Workspace's own technician picker — see PosOrderWorkspace.techniciansForService).
import { Loader2, X } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../ui/skeleton'
import IconButton from '../../../ui/IconButton'

const TK = 'components.dashboard.views.pos.PosFrontDeskView.'

export interface AssignableGuest {
  orderId: string
  orderNumber: string
  customerName: string
  serviceNames: string[]
  elapsedMinutes: number
  serviceLineId: string
}

export default function AssignGuestModal({
  open,
  technicianName,
  guests,
  isLoading,
  assigningOrderId,
  onAssign,
  onClose,
}: {
  open: boolean
  technicianName: string
  guests: AssignableGuest[]
  isLoading: boolean
  assigningOrderId: string | null
  onAssign: (guest: AssignableGuest) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-md">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-sm font-extrabold text-nexoraText">{t(TK + 'assignGuestTitle')}</h2>
            <p className="mt-0.5 text-xs text-nexoraMuted">{t(TK + 'assignGuestSubtitle', { name: technicianName })}</p>
          </div>
          <IconButton label={t(TK + 'assignGuestClose')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-2 overflow-y-auto">
          {isLoading ? (
            <SkeletonList count={2} lines={2} />
          ) : guests.length === 0 ? (
            <p className="rounded-lg bg-nexoraCanvas p-5 text-center text-xs text-nexoraMuted">
              {t(TK + 'assignGuestEmpty')}
            </p>
          ) : (
            guests.map((guest) => {
              const isAssigning = assigningOrderId === guest.orderId
              return (
                <button
                  key={guest.orderId}
                  type="button"
                  onClick={() => onAssign(guest)}
                  disabled={assigningOrderId !== null}
                  className="flex w-full items-center justify-between gap-3 rounded-lg border border-nexoraBorder px-3.5 py-2.5 text-left transition-colors hover:border-nexoraBrand hover:bg-nexoraBrandSoft disabled:opacity-60"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-extrabold text-nexoraText">
                      #{guest.orderNumber} {guest.customerName}
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-nexoraMuted">
                      {guest.serviceNames.join(', ')} · {t(TK + 'waitMinutes', { minutes: guest.elapsedMinutes })}
                    </span>
                  </span>
                  {isAssigning ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-nexoraBrand" /> : null}
                </button>
              )
            })
          )}
        </div>

        <div className="mt-4 flex shrink-0 justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 items-center rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:border-nexoraBrand hover:text-nexoraBrandDark"
          >
            {t(TK + 'assignGuestClose')}
          </button>
        </div>
      </div>
    </div>
  )
}
