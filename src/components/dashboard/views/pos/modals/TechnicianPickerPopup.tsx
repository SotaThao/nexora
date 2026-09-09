// TechnicianPickerPopup — picks a technician for a line that does not exist yet.
//
// Deliberately not ChangeTechnicianModal: that one carries the line's Note field, because
// AssignStaffToServiceLine is the only endpoint that can write a note on an existing line. Here the
// note is already a field on the form underneath, so reusing it would put two note boxes in one
// flow. Nothing is persisted — picking a card hands the id back to the form.
import { X } from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import TechnicianPickerGrid, { type TechnicianOption } from '../../../../checkin/parts/TechnicianPickerGrid'

const K = 'components.dashboard.views.pos.PosOrderWorkspace'

export default function TechnicianPickerPopup({
  open,
  technicians,
  isLoading,
  selectedStaffId,
  onSelect,
  onClose,
}: {
  open: boolean
  technicians: TechnicianOption[]
  isLoading?: boolean
  // null = First available, which leaves the line for someone on the floor to take.
  selectedStaffId: string | null
  onSelect: (posStaffProfileId: string | null) => void
  onClose: () => void
}) {
  const { t } = useTranslation()

  if (!open) return null

  return (
    // Above the custom-service form's own z-[60] overlay.
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-nexoraText/70 p-4 backdrop-blur-sm">
      <div className="nexora-modal-card max-w-lg">
        <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
          <h2 className="min-w-0 truncate text-sm font-extrabold text-nexoraText">
            {t(`${K}.customServiceTechnicianPickerTitle`)}
          </h2>
          <IconButton label={t(`${K}.changeTechnicianModalClose`)} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="flex-1 overflow-y-auto">
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
            offShiftLabel={t(`${K}.technicianOffShift`)}
          />
        </div>
      </div>
    </div>
  )
}
