import React from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import { isStaffSession } from '../components/homepage/utils/sessionRouting'
import LoadingScreen from './LoadingScreen'

export default function RequireAuth({
  role,
  children,
}: {
  role?: string
  children?: React.ReactNode
}) {
  const { session, status } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status !== 'authenticated' || !session) {
    const returnPath = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to={`/login?returnPath=${encodeURIComponent(returnPath)}`} replace />
  }

  const isStaff = isStaffSession(session)

  if (role === 'owner' && isStaff) {
    return <Navigate to="/staff" replace />
  }

  if (role === 'staff' && !isStaff) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}
