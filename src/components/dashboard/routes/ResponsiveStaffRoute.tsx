import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useIsMobileUI } from '../../../hooks/useIsMobileUI'
import {
  buildStaffRoutePath,
  resolveStaffRouteFamily,
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
  const location = useLocation()
  const targetFamily = resolveStaffRouteFamily(isMobile)

  if (family !== targetFamily) {
    return (
      <Navigate
        to={`${buildStaffRoutePath(targetFamily, staffId)}${location.search}`}
        replace
      />
    )
  }

  return <>{children}</>
}
