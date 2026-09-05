import BookingTeamPanel from './BookingTeamPanel'
import { BookingHubVoiceProvider } from './BookingHubVoiceContext'
import './booking-hub.css'

interface Props {
  onClose: () => void
  posPayEnabled?: boolean
}

/** Shared AI Hub Technician Info dialog opened in create mode. */
export default function TechnicianInfoModal({ onClose, posPayEnabled = false }: Props) {
  return (
    <BookingHubVoiceProvider enabled={!posPayEnabled}>
      <div className="booking-hub-view fixed inset-0 z-[120]">
        <BookingTeamPanel
          createModalOnly
          posPayEnabled={posPayEnabled}
          onCreateModalClose={onClose}
        />
      </div>
    </BookingHubVoiceProvider>
  )
}
