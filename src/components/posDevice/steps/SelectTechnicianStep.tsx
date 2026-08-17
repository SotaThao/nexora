// Step 3 — who the customer would like, asked before what they want.
//
// This order matches how people actually arrive ("is Chloe in today?" comes before the menu), and
// it means the following step can assign every service they tap without asking again. A technician
// who cannot perform a chosen service is not an error here: that line simply falls back to Anyone
// and the front desk assigns it in person.
import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { SkeletonList } from '../../ui/skeleton'
import { initialsOf } from './technicianDisplay'
import type { SelfCheckInTechnicianApiDto } from '../../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

export default function SelectTechnicianStep({
  technicians,
  isLoading,
  selectedStaffId,
  onSelect,
  onBack,
  onContinue,
}: {
  technicians: SelfCheckInTechnicianApiDto[]
  isLoading: boolean
  // null means no preference — every service will go to the front desk to assign.
  selectedStaffId: string | null
  onSelect: (staffId: string | null) => void
  onBack: () => void
  onContinue: () => void
}) {
  const { t } = useTranslation()
  const [searchQuery, setSearchQuery] = useState('')

  const filtered = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return query === '' ? technicians : technicians.filter((s) => s.displayName.toLowerCase().includes(query))
  }, [technicians, searchQuery])

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 rounded-2xl border border-nexoraBorder bg-nexoraSurface p-6">
      <div className="text-center">
        <h1 className="text-xl font-black text-nexoraText">{t(`${K}.preferredTechnicianTitle`)}</h1>
        <p className="mt-1 text-sm text-nexoraMuted">{t(`${K}.preferredTechnicianSubtitle`)}</p>
      </div>

      {technicians.length > 6 ? (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraMuted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(`${K}.technicianSearchPlaceholder`)}
            className="h-11 w-full rounded-lg border border-nexoraBorder bg-white pl-9 pr-3 text-sm text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {/* Outside the loading branch: "Anyone" needs no data, so it is tappable immediately. */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
            selectedStaffId === null ? 'border-nexoraBrand bg-nexoraBrand/5' : 'border-nexoraBorder'
          }`}
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-nexoraCanvas text-base">⚡</span>
          <span className="text-xs font-bold text-nexoraText">{t(`${K}.anyone`)}</span>
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
                onClick={() => onSelect(staff.posStaffProfileId)}
                className={`flex flex-col items-center gap-1 rounded-xl border p-3 text-center ${
                  selectedStaffId === staff.posStaffProfileId
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
              <p className="col-span-full text-xs text-nexoraMuted">{t(`${K}.noTechnicians`)}</p>
            ) : null}
          </>
        )}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onBack}
          className="h-14 flex-1 rounded-lg border border-nexoraBorder text-base font-bold text-nexoraText hover:border-nexoraBrand"
        >
          {t(`${K}.back`)}
        </button>
        <button
          type="button"
          onClick={onContinue}
          className="h-14 flex-[2] rounded-lg bg-nexoraBrand text-base font-bold text-white hover:bg-nexoraBrandDark"
        >
          {t(`${K}.continue`)}
        </button>
      </div>
    </div>
  )
}
