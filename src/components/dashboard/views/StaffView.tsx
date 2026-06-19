// Platform switcher: desktop (dev UI) vs mobile (app-master UI).
// Both variants receive the same props from StaffRoute.
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import StaffViewDesktop from './StaffView.desktop'
import StaffViewMobile from './StaffView.mobile'

export default function StaffView(props: any) {
  return useIsMobileUI()
    ? <StaffViewMobile {...props} />
    : <StaffViewDesktop {...props} />
}
