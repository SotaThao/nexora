import { useLocation } from 'react-router-dom'
import { STAFF_SCREENS } from '../constants'

export type StaffScreenId = (typeof STAFF_SCREENS)[number]

/** Active staff dashboard screen derived from `/staff[/:screen]`. */
export function useStaffActiveScreen(): StaffScreenId {
  const { pathname } = useLocation()
  const segment = pathname.split('/')[2] || 'home'
  return (STAFF_SCREENS.includes(segment as StaffScreenId) ? segment : 'home') as StaffScreenId
}
