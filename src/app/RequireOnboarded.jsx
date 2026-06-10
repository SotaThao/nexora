import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

/**
 * Owner-area onboarding gate.
 *
 * Renders INSIDE <RequireAuth role="owner">, so auth status, anonymous, and
 * role mismatch are already handled — by the time this runs we have an
 * authenticated owner session. This gate only checks whether the owner has
 * finished onboarding.
 *
 * Onboarding completion is independent of KYB/verification status: an owner
 * who completed the wizard but hasn't done KYB still belongs in the dashboard
 * (KYB has its own gate). We therefore key off `hasCompletedOnboarding`
 * (derived in apiAuthAdapter from account status Active / kyb_approved /
 * explicit flag) and only redirect when it is explicitly false.
 *
 * Note: SetupWizard refreshes the auth session after completing onboarding so
 * `hasCompletedOnboarding` flips to true before navigating to /dashboard,
 * preventing a redirect loop back to /onboarding.
 */
export default function RequireOnboarded({ children }) {
  const { session } = useAuth()

  if (session && session.hasCompletedOnboarding === false) {
    return <Navigate to="/onboarding" replace />
  }

  return children
}
