// Platform switcher: desktop (dev UI) vs mobile (app-master UI).
// Both variants receive the same props from OverviewRoute.
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import OverviewDesktop from './Overview.desktop'
import OverviewMobile from './Overview.mobile'

export default function Overview(props: any) {
  return useIsMobileUI()
    ? <OverviewMobile {...props} />
    : <OverviewDesktop {...props} />
}
