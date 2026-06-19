// Platform switcher: desktop (original/dev UI) vs mobile (app-master "Pro" UI).
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import StaffHomeDesktop from './StaffHome.desktop'
import StaffHomeMobile from './StaffHome.mobile'

export default function StaffHome() {
  return useIsMobileUI() ? <StaffHomeMobile /> : <StaffHomeDesktop />
}
