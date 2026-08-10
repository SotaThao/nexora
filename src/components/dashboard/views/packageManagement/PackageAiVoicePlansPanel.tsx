import BookingPlansPanel from '../BookingPlansPanel'
import { BookingHubVoiceProvider } from '../BookingHubVoiceContext'

/** AI Voice buy-package UI reused from AI Hub Plans (no Credits / History switcher). */
export default function PackageAiVoicePlansPanel() {
  return (
    <div className="package-plan-content booking-hub-view">
      <BookingHubVoiceProvider enabled>
        <BookingPlansPanel buyOnlyMode />
      </BookingHubVoiceProvider>
    </div>
  )
}
