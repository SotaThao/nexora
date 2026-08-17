// Technician picker for one service on the kiosk.
//
// A variant of the front desk's SelectTechniciansModal rather than a reuse of it — same drawer
// shape, three deliberate differences:
//   - it reads through the device-token hook, so there is no businessId to pass,
//   - no busy indicator: who is mid-service is floor information, not something a waiting
//     customer should be reading off a screen,
//   - no note field: a note typed here would reach nobody.
// "First Available" is the default and submits a null technician, which the front desk resolves
// in person.
import { useMemo, useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useSelfCheckInTechnicians } from '../../../data/hooks/usePosSelfCheckIn'
import { SkeletonList } from '../../ui/skeleton'

const K = 'components.posDevice.SelfCheckInFlow'

export const FIRST_AVAILABLE = '__first_available__'

export default function KioskTechnicianDrawer({
  serviceId,
  serviceName,
  selectedStaffId,
  onSelect,
  onClose,
}: {
  serviceId: string
  serviceName: string
  // null means First Available.
  selectedStaffId: string | null
  onSelect: (staffId: string | null, displayName: string | null) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { data: technicians = [], isLoading } = useSelfCheckInTechnicians(serviceId)
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query === '' ? technicians : technicians.filter((s) => s.displayName.toLowerCase().includes(query))
  }, [technicians, searchQuery])

  const activeId = selectedStaffId ?? FIRST_AVAILABLE

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div className="absolute inset-0 bg-nexoraText/70 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative flex h-full w-full max-w-md flex-col bg-nexoraSurface p-4 shadow-xl">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-2">
          <h2 className="text-base font-extrabold text-nexoraText">{serviceName}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t(`${K}.drawerClose`)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText hover:border-nexoraBrand"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t(`${K}.drawerSearchPlaceholder`)}
              className="h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-9 pr-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {/* Outside the loading branch on purpose: First Available needs no data, so it must be
                tappable the instant the drawer opens. */}
            <button
              type="button"
              onClick={() => {
                onSelect(null, null)
                onClose()
              }}
              className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                activeId === FIRST_AVAILABLE ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder'
              }`}
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nexoraCanvas text-base">
                ⚡
              </span>
              <span className="text-xs font-bold text-nexoraText">{t(`${K}.firstAvailable`)}</span>
            </button>

            {isLoading ? (
              <div className="col-span-full">
                <SkeletonList count={4} lines={1} />
              </div>
            ) : (
              <>
                {filtered.map((staff) => (
                  <button
                    key={staff.posStaffProfileId}
                    type="button"
                    onClick={() => {
                      onSelect(staff.posStaffProfileId, staff.displayName)
                      onClose()
                    }}
                    className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                      activeId === staff.posStaffProfileId
                        ? 'border-nexoraBrand bg-nexoraBrand/5'
                        : 'border-nexoraBorder'
                    }`}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nexoraCanvas text-xs font-bold text-nexoraText">
                      {staff.photoUrl ? (
                        <img src={staff.photoUrl} alt="" className="h-11 w-11 rounded-full object-cover" />
                      ) : (
                        initialsOf(staff.displayName)
                      )}
                    </span>
                    <span className="truncate text-xs font-bold text-nexoraText">{staff.displayName}</span>
                  </button>
                ))}

                {filtered.length === 0 ? (
                  <p className="col-span-full text-xs text-nexoraMuted">{t(`${K}.drawerNoStaff`)}</p>
                ) : null}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function initialsOf(displayName: string) {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
