// Platform switcher: desktop (dev UI) vs mobile (app-master UI).
// Both variants receive the same props from StaffDashboard.
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import StaffHeaderDesktop from './StaffHeader.desktop'
import StaffHeaderMobile from './StaffHeader.mobile'

export default function StaffHeader(props) {
  return useIsMobileUI()
    ? <StaffHeaderMobile {...props} />
    : <StaffHeaderDesktop {...props} />
}
