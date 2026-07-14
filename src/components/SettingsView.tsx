// Platform switcher: desktop (business dashboard UI) vs mobile (app UI).
// Desktop rolls Settings back to the pre-mobile-merge tab layout (US-092);
// mobile keeps the current app UI. Both variants receive the same props.
import { useIsMobileUI } from '../hooks/useIsMobileUI'
import SettingsViewDesktop from './SettingsView.desktop'
import SettingsViewMobile from './SettingsView.mobile'

export default function SettingsView(props) {
  return useIsMobileUI()
    ? <SettingsViewMobile {...props} />
    : <SettingsViewDesktop {...props} />
}
