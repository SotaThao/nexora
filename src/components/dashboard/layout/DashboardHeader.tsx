// Platform switcher: desktop (dev UI) vs mobile (app-master UI).
// Both variants receive the same props from Dashboard.
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import DashboardHeaderDesktop from './DashboardHeader.desktop'
import DashboardHeaderMobile from './DashboardHeader.mobile'

export default function DashboardHeader(props: any) {
  return useIsMobileUI()
    ? <DashboardHeaderMobile {...props} />
    : <DashboardHeaderDesktop {...props} />
}
