import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'
import LoadingScreen from './LoadingScreen'

export default function RequireAuth({ role, children }) {
  const { session, status } = useAuth()

  if (status === 'loading') {
    return <LoadingScreen />
  }

  if (status !== 'authenticated' || !session) {
    return <Navigate to="/login" replace />
  }

  const isStaffSession = session.flag === '!personal' || session.role === 'personal' || session.role === 'staff'

  if (role === 'owner' && isStaffSession) {
    return <Navigate to="/staff" replace />
  }

  if (role === 'staff' && !isStaffSession) {
    return <Navigate to="/dashboard" replace />
  }

  return children ? children : <Outlet />
}
