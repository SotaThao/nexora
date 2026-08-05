/**
 * Owner-area onboarding gate — historically redirected to /onboarding when
 * hasCompletedOnboarding===false. Disabled (pass-through) so merchants reach
 * /dashboard right after email verification, same as the staff flow (see
 * RequireStaffReady). Profile completion and payout setup are optional now,
 * surfaced via SetupGuideBanner / PayoutSetupWarningBanner instead of a hard
 * gate.
 */
export default function RequireOnboarded({ children }) {
  return children
}
