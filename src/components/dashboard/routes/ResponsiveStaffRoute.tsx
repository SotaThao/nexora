import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import {
  buildStaffRoutePath,
  STAFF_ROUTE_FAMILY,
  type StaffRouteFamily,
} from './staffRoutePaths'

type ResponsiveStaffRouteProps = {
  family: StaffRouteFamily
  staffId?: string | null
  children: ReactNode
}

export default function ResponsiveStaffRoute({
  family,
  staffId,
  children,
}: ResponsiveStaffRouteProps) {
  const isMobile = useIsMobileUI()
  const targetFamily = isMobile
    ? STAFF_ROUTE_FAMILY.Legacy
    : STAFF_ROUTE_FAMILY.Settings

  if (family !== targetFamily) {
    return <Navigate to={buildStaffRoutePath(targetFamily, staffId)} replace />
  }

  return <>{children}</>
}
