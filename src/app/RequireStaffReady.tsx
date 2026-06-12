import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/**
 * Staff-area readiness gate.
 *
 * Renders INSIDE <RequireAuth role="staff">, so auth/role are already
 * handled. Business rule: the staff dashboard is only for users who
 * (a) actually became staff — a StaffProfile exists on the backend
 * (created by accepting a business invite), AND
 * (b) completed personal onboarding — their profile data was persisted
 * to the backend (PUT /userprofile/update in the invite/register wizard).
 *
 * Anyone else is sent back to /register to finish the flow.
 */
export default function RequireStaffReady({ children }) {
  const { session } = useAuth()

  const isStaffReady =
    Boolean(session?.staffId) ||
    (session?.hasStaffProfile && session?.hasCompletedOnboarding)

  if (session && !isStaffReady) {
    return <Navigate to="/register" replace />
  }

  return children
}
