// ChangeTechnicianModal — picks the technician (and note) for one ticket line.
//
// Twin of ChangeServiceModal: both fields on a line now open a popup, so the two controls behave
// the same way instead of one expanding in place and the other opening over the page.
//
// Nothing is persisted here. Picking a card hands the id back and the caller makes the single
// AssignStaffToServiceLine call; the note travels with it, since that endpoint overwrites Note on
// every write.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import TechnicianPickerGrid, { type TechnicianOption } from '../../../../checkin/parts/TechnicianPickerGrid'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

const NOTE_MAX_LENGTH = 500

export default function ChangeTechnicianModal({
  open,
  serviceName,
  technicians,
  isLoading,
  selectedStaffId,
  note,
  onChangeNote,
  onSelect,
  onClose,
}: {
  open: boolean
  serviceName: string
  // Already narrowed to the people who can perform this line's service.
  technicians: TechnicianOption[]
  isLoading?: boolean
  // null = First available, which clears the assignment rather than picking someone.
  selectedStaffId: string | null
  note: string
  onChangeNote: (note: string) => void
  onSelect: (posStaffProfileId: string | null) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.changeTechnicianModalTitle`, { serviceName })}
          </h2>
          <IconButton label={t(`${K}.changeTechnicianModalClose`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-0.5">
          <TechnicianPickerGrid
            technicians={technicians}
            isLoading={isLoading}
            selectedStaffId={selectedStaffId}
            onSelect={onSelect}
            anyoneLabel={t(`${K}.firstAvailableLabel`)}
            searchPlaceholder={t(`${K}.technicianSearchPlaceholder`)}
            emptyLabel={t(`${K}.noTechnicians`)}
            busyLabel={t(`${K}.technicianBusy`)}
            availableLabel={t(`${K}.technicianAvailable`)}
            turnsLabel={(count) => t(`${K}.technicianTurnsToday`, { count })}
            nextTurnLabel={t(`${K}.technicianNextTurn`)}
          />

          <div>
            <label className="mb-1 block text-[10px] font-black uppercase tracking-wide text-nexoraMuted">
              {t(`${K}.noteLabel`)}
            </label>
            {/* Saved by whichever action closes the popup — picking a technician sends both values,
                and closing without picking sends the note on its own. */}
            <textarea
              value={note}
              onChange={(e) => onChangeNote(e.target.value)}
              maxLength={NOTE_MAX_LENGTH}
              rows={2}
              placeholder={t(`${K}.notePlaceholder`)}
              className="w-full rounded-lg border border-nexoraBorder bg-white px-2.5 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
