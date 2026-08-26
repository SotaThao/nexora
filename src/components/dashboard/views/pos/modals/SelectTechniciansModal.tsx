// SelectTechniciansModal — Order Workspace (US-17): opens immediately when a manager taps
// a service in the catalog (adding a new line) or taps "Edit" on an existing service line
// (changing technician/note). Nothing is persisted here — OK only commits the choice into
// the parent's local draft; the actual API call (bulk check-in or AssignStaffToServiceLine)
// happens later, when the draft itself is saved.
//
// POS iPad redesign, Ticket 4 — renders as a side drawer sliding in from the right edge
// (not a centered modal) so the catalog column of Order Workspace stays visible/in-context
// behind it. Closes via the backdrop click or the X button — no swipe gesture (out of scope,
// same click-to-close pattern as every other overlay in this codebase).
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useAssignableStaffForService } from '../../../../../data/hooks/usePosOrders'
import { SkeletonList } from '../../../../ui/skeleton'
import IconButton from '../../../../ui/IconButton'

const NEXT_AVAILABLE = '__next_available__'

export interface SelectTechniciansSelection {
  posStaffProfileId?: string
  // Resolved display name for the immediate local draft row — undefined when
  // posStaffProfileId is also undefined (Next Available, resolved later server-side).
  technicianName?: string
  note?: string
}

export default function SelectTechniciansModal({
  open,
  businessId,
  posServiceId,
  serviceName,
  initialStaffId,
  initialNote,
  onConfirm,
  onClose,
}: {
  open: boolean
  businessId: string
  posServiceId: string
  serviceName: string
  initialStaffId?: string
  initialNote?: string
  onConfirm: (selection: SelectTechniciansSelection) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: assignableStaff = [], isLoading } = useAssignableStaffForService(
    businessId,
    open ? posServiceId : undefined,
  )
  const [selectedStaffId, setSelectedStaffId] = useState(initialStaffId ?? NEXT_AVAILABLE)
  const [note, setNote] = useState(initialNote ?? '')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredStaff = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query === ''
      ? assignableStaff
      : assignableStaff.filter((staff) => staff.displayName.toLowerCase().includes(query))
  }, [assignableStaff, searchQuery])

  if (!open) return null

  const handleConfirm = () => {
    const matchedStaff = assignableStaff.find((staff) => staff.posStaffProfileId === selectedStaffId)
    onConfirm({
      posStaffProfileId: selectedStaffId === NEXT_AVAILABLE ? undefined : selectedStaffId,
      technicianName: selectedStaffId === NEXT_AVAILABLE ? undefined : matchedStaff?.displayName,
      note: note.trim() || undefined,
    })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-nexoraText/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-nexoraSurface p-4 shadow-xl">
        <div className="mb-4 flex shrink-0 items-center justify-between">
          <h2 className="text-sm font-extrabold text-nexoraText">
            {t('components.dashboard.views.pos.SelectTechniciansModal.title', { serviceName })}
          </h2>
          <IconButton label={t('components.dashboard.views.pos.SelectTechniciansModal.close')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('components.dashboard.views.pos.SelectTechniciansModal.searchPlaceholder')}
              className="h-9 w-full rounded-lg border border-nexoraBorder bg-white pl-8 pr-2.5 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>

          {/* "Next Available" doesn't depend on the assignable-staff query at all, so it
              must not sit behind its loading skeleton — previously it did, meaning a tap
              right after opening this modal (before that query resolves) landed on the
              skeleton instead of a button and appeared to do nothing. */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => setSelectedStaffId(NEXT_AVAILABLE)}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                selectedStaffId === NEXT_AVAILABLE
                  ? 'border-nexoraBrand bg-nexoraBrand/5'
                  : 'border-nexoraBorder hover:border-nexoraBrand'
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-bold text-nexoraText">
                ⚡
              </span>
              <span className="text-[11px] font-bold text-nexoraText">
                {t('components.dashboard.views.pos.SelectTechniciansModal.nextAvailable')}
              </span>
            </button>

            {isLoading ? (
              <div className="col-span-full">
                <SkeletonList count={4} lines={1} />
              </div>
            ) : (
              <>
              {filteredStaff.map((staff) => (
                <button
                  key={staff.posStaffProfileId}
                  type="button"
                  onClick={() => setSelectedStaffId(staff.posStaffProfileId)}
                  className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                    selectedStaffId === staff.posStaffProfileId
                      ? 'border-nexoraBrand bg-nexoraBrand/5'
                      : 'border-nexoraBorder hover:border-nexoraBrand'
                  }`}
                >
                  <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-nexoraCanvas text-[11px] font-bold text-nexoraText">
                    {staff.photoUrl ? (
                      <img src={staff.photoUrl} alt="" className="h-9 w-9 rounded-full object-cover" />
                    ) : (
                      staff.displayName
                        .split(' ')
                        .filter(Boolean)
                        .slice(0, 2)
                        .map((part) => part[0]?.toUpperCase())
                        .join('')
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        staff.isBusy ? 'bg-rose-500' : 'bg-emerald-500'
                      }`}
                    />
                  </span>
                  <span className="truncate text-[11px] font-bold text-nexoraText">{staff.displayName}</span>
                  {staff.isBusy ? (
                    <span className="text-[9px] font-extrabold uppercase text-rose-600">
                      {t('components.dashboard.views.pos.SelectTechniciansModal.busy')}
                    </span>
                  ) : null}
                </button>
              ))}

              {filteredStaff.length === 0 ? (
                <p className="col-span-full text-[11px] text-nexoraMuted">
                  {t('components.dashboard.views.pos.SelectTechniciansModal.noStaff')}
                </p>
              ) : null}
              </>
            )}
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t('components.dashboard.views.pos.SelectTechniciansModal.noteLabel')}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder={t('components.dashboard.views.pos.SelectTechniciansModal.notePlaceholder')}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        </div>

        <div className="mt-4 flex shrink-0 gap-2">
          <button
            type="button"
            onClick={onClose}
            className="h-10 flex-1 rounded-lg border border-nexoraBorder text-xs font-bold text-nexoraText hover:border-nexoraBrand"
          >
            {t('components.dashboard.views.pos.SelectTechniciansModal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="h-10 flex-1 rounded-lg bg-nexoraBrand text-xs font-bold text-white hover:bg-nexoraBrandDark"
          >
            {t('components.dashboard.views.pos.SelectTechniciansModal.ok')}
          </button>
        </div>
      </div>
    </div>
  )
}
