import { Outlet, useOutletContext } from "react-router-dom";
import PosOnboardingRequiredPage from "../components/dashboard/views/pos/PosOnboardingRequiredPage";
import { useAuth } from "../auth/useAuth";

/**
 * Gates every POS route behind onboarding completion. While the merchant
 * has not finished onboarding, this replaces the actual POS screen with a
 * single required page instead of rendering it — the POS sidebar submenu is
 * hidden for the same reason (DashboardSidebar.tsx / MobileMenuDrawer.tsx),
 * so no matter which pos/* URL is hit, only this page is reachable.
 *
 * Forwards DashboardOwnerShell's outlet context through its own <Outlet/>
 * once onboarding is complete — PosGeneralSettingsRoute reads
 * ctx.verificationStatus via useOutletContext(), which would otherwise
 * resolve to this layout's own (unset) outlet context instead of piercing
 * through to the shell's.
 */
export default function PosOnboardingLayout() {
  const ctx = useOutletContext();
  const { session } = useAuth();

  if (session?.hasCompletedOnboarding === false) {
    return <PosOnboardingRequiredPage />;
  }

  return <Outlet context={ctx} />;
}
