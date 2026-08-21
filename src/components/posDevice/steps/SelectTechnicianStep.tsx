// Step 3 — who the customer would like, asked before what they want.
//
// This order matches how people actually arrive ("is Chloe in today?" comes before the menu), and
// it means the following step can assign every service they tap without asking again. A technician
// who cannot perform a chosen service is not an error here: that line simply falls back to Anyone
// and the front desk assigns it in person.
//
// Frame and grid are the shared check-in components, so this screen and the front desk's
// technician step cannot drift apart.
import { useTranslation } from '../../../contexts/LanguageContext'
import CheckInStepFrame from '../../checkin/parts/CheckInStepFrame'
import TechnicianPickerGrid from '../../checkin/parts/TechnicianPickerGrid'
import type { SelfCheckInTechnicianApiDto } from '../../../types/repositories'

const K = 'components.posDevice.SelfCheckInFlow'

export default function SelectTechnicianStep({
  technicians,
  isLoading,
  selectedStaffId,
  onSelect,
  onBack,
  onContinue,
  anyoneHint,
}: {
  technicians: SelfCheckInTechnicianApiDto[]
  isLoading: boolean
  // null means no preference — every service will go to the front desk to assign.
  selectedStaffId: string | null
  onSelect: (staffId: string | null) => void
  onBack: () => void
  onContinue: () => void
  anyoneHint?: string
}) {
  const { t } = useTranslation()

  return (
    <CheckInStepFrame
      title={t(`${K}.preferredTechnicianTitle`)}
      subtitle={t(`${K}.preferredTechnicianSubtitle`)}
      backLabel={t(`${K}.back`)}
      onBack={onBack}
      primaryLabel={t(`${K}.continue`)}
      onPrimary={onContinue}
    >
      <TechnicianPickerGrid
        technicians={technicians}
        isLoading={isLoading}
        selectedStaffId={selectedStaffId}
        onSelect={onSelect}
        anyoneLabel={t(`${K}.anyone`)}
        searchPlaceholder={t(`${K}.technicianSearchPlaceholder`)}
        emptyLabel={t(`${K}.noTechnicians`)}
        anyoneHint={anyoneHint}
        busyLabel={t(`${K}.technicianBusy`)}
        availableLabel={t(`${K}.technicianAvailable`)}
      />
    </CheckInStepFrame>
  )
}
