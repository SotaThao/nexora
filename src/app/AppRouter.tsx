import { Suspense, useEffect, useLayoutEffect } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useNavigationType,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { scrollToPageTop } from "../utils/scrollToPageTop";
import { useAuth } from "../auth/useAuth";
import {
  AnalyticsRoute,
  BookingHubRoute,
  FallbackRoute,
  OverviewRoute,
  PosServicesRoute,
  SiteEditorRoute,
  ReportsRoute,
  ReviewsRoute,
  SettingsRoute,
  StaffDetailRoute,
  StaffRoute,
  SubscriptionsRoute,
  SupportRoute,
  TipsRoute,
  TouchpointsRoute,
} from "../components/dashboard/routes";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import GlobalDemoQuickNav from "../components/ui/GlobalDemoQuickNav";
import { isDemoToolsEnabled } from "./demoTools";
import lazyWithRetry from "./lazyWithRetry";
import LoadingScreen from "./LoadingScreen";
import RequireAuth from "./RequireAuth";
import RequireOnboarded from "./RequireOnboarded";
import RequireStaffReady from "./RequireStaffReady";
import RootRedirect from "./RootRedirect";
import {
  CommunityChatInbox,
  CommunityCreateWizard,
  CommunityDetail,
  CommunityHome,
  CommunityJoinPreview,
  CommunityRouteRoot,
  CommunityStaffPage,
} from "../components/community/CommunityScreens";
import { CommunityChat } from "../components/community/CommunityChat";
import { CommunityDirectChat } from "../components/community/CommunityDirectChat";

const PosMenuUpsellPreviewPage = lazyWithRetry(
  () => import("../components/public/booking/PosMenuUpsellPreviewPage"),
);

const scrollStoragePrefix = "nexora:route-scroll:";

function routeScrollStorageKey(pathname: string, search: string) {
  return `${scrollStoragePrefix}${pathname}${search}`;
}

function readRouteScrollPosition(storageKey: string) {
  try {
    const value = window.sessionStorage.getItem(storageKey);
    if (!value) return null;
    const position = JSON.parse(value) as { left?: unknown; top?: unknown };
    if (typeof position.left !== "number" || typeof position.top !== "number") {
      return null;
    }
    return { left: position.left, top: position.top };
  } catch {
    return null;
  }
}

const SetupWizard = lazyWithRetry(() => import("../components/SetupWizard"));
const DashboardOwnerShell = lazyWithRetry(
  () => import("../components/dashboard/layout/DashboardOwnerShell"),
);
const CustomerFlow = lazyWithRetry(() => import("../components/CustomerFlow"));
const DirectPaymentFlow = lazyWithRetry(
  () => import("../components/DirectPaymentFlow"),
);
const StaffDirectPaymentFlow = lazyWithRetry(
  () => import("../components/StaffDirectPaymentFlow"),
);
const RegisterWizard = lazyWithRetry(
  () => import("../components/RegisterWizard"),
);
const StaffRegistrationWizard = lazyWithRetry(
  () => import("../components/StaffRegistrationWizard"),
);
const StaffDashboard = lazyWithRetry(
  () => import("../components/staff-dashboard/StaffDashboard"),
);
const StaffHome = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffHome"),
);
const StaffMyQR = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffMyQR"),
);
const StaffTips = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffTips"),
);
const StaffReviews = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffReviews"),
);
const StaffPay = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffPay"),
);
const StaffProfile = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffProfile"),
);
const StaffNotifications = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffNotifications"),
);
const StaffTransactions = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffTransactions"),
);
const StaffMyEarnings = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffMyEarnings"),
);
const StaffMySalons = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffMySalons"),
);
const ForgotPassword = lazyWithRetry(
  () => import("../components/ForgotPassword"),
);
const ResetPassword = lazyWithRetry(
  () => import("../components/ResetPassword"),
);
const LoginScreen = lazyWithRetry(() => import("./LoginScreen"));
const QrRedirectPage = lazyWithRetry(
  () => import("../components/public/QrRedirectPage"),
);
const PrivacyPolicyPage = lazyWithRetry(
  () => import("../components/legal/PrivacyPolicyPage"),
);
const TermsOfServicePage = lazyWithRetry(
  () => import("../components/legal/TermsOfServicePage"),
);
const HelpQrPage = lazyWithRetry(
  () => import("../components/public/HelpQrPage"),
);
const CommunityDesignDemo = lazyWithRetry(
  () => import("../components/community/demo/CommunityDesignDemo"),
);
const CommunityBusinessDemo = lazyWithRetry(
  () => import("../components/community/demo/CommunityBusinessDemo"),
);
const TemplateBuilderPreviewPage = lazyWithRetry(
  () => import("../components/public/builder/TemplateBuilderPreviewPage"),
);
const PublicPosBookingPage = lazyWithRetry(
  () => import("../components/public/PublicBookingPage"),
);

// Bridges the URL (path token / legacy ?flow=staff-invite biz) to the wizard's
// inviteData prop. A real token → API-backed invite; otherwise the legacy
// simulation/biz path (matches the pre-router ?flow=staff-invite payload shape).
function InviteRoute() {
  const { token, businessSlug } = useParams();
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const refCode = searchParams.get("ref") || searchParams.get("refCode") || "";
  const source =
    searchParams.get("source") ||
    (businessSlug ? "public_link" : token ? "email_invite" : "public_link");
  const email = searchParams.get("email") || "";
  const biz = state?.biz || businessSlug || "";
  const inviteData = token
    ? { token, biz, email, refCode, source }
    : {
        id: "",
        name: "",
        email,
        phone: "",
        role: "Nail Technician",
        biz,
        businessSlug: businessSlug || "",
        refCode,
        source,
      };
  return (
    <StaffRegistrationWizard
      inviteData={inviteData}
      isDemoToolsEnabled={isDemoToolsEnabled}
      onReturnToMerchant={() => navigate("/dashboard", { replace: true })}
    />
  );
}

function PaymentsRedirect() {
  const { paymentId } = useParams();
  const target = paymentId
    ? `/dashboard/reports?tab=direct_payments&paymentId=${encodeURIComponent(paymentId)}`
    : "/dashboard/reports?tab=direct_payments";
  return <Navigate to={target} replace />;
}

function StaffFallbackRoute() {
  return <Navigate to="/staff" replace />;
}

function StaffTransactionsLegacyRedirect() {
  return <Navigate to="/staff/payments?tab=tips" replace />;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  const navigationType = useNavigationType();
  const storageKey = routeScrollStorageKey(pathname, search);

  useLayoutEffect(() => {
    return () => {
      try {
        window.sessionStorage.setItem(
          storageKey,
          JSON.stringify({ left: window.scrollX, top: window.scrollY }),
        );
      } catch {
        // Scroll restoration remains optional when session storage is unavailable.
      }
    };
  }, [storageKey]);

  useEffect(() => {
    if (navigationType === "POP") {
      const position = readRouteScrollPosition(storageKey);
      if (position) {
        requestAnimationFrame(() => window.scrollTo(position));
      }
      return;
    }
    scrollToPageTop();
  }, [navigationType, pathname, search, storageKey]);
  return null;
}

export default function AppRouter() {
  const { session, logout } = useAuth();
  const location = useLocation();

  return (
    <ErrorBoundary resetKey={location.pathname}>
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/register" element={<RegisterWizard />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/account/reset-password" element={<ResetPassword />} />

          <Route
            path="/touch/:businessSlug/:touchPointSlug"
            element={<CustomerFlow />}
          />
          <Route path="/pay/staff/:staffProfileId" element={<StaffDirectPaymentFlow />} />
          <Route path="/pay/:businessId" element={<DirectPaymentFlow />} />
          <Route path="/merchant/payments/:paymentId" element={<PaymentsRedirect />} />
          <Route path="/qr/:code" element={<QrRedirectPage />} />
          <Route path="/help/qr/:code" element={<HelpQrPage />} />
          <Route path="/preview/menu" element={<PosMenuUpsellPreviewPage />} />
          <Route path="/booking/preview" element={<PosMenuUpsellPreviewPage />} />
          <Route path="/preview/builder" element={<TemplateBuilderPreviewPage />} />
          <Route path="/builder" element={<TemplateBuilderPreviewPage />} />
          <Route path="/preview/site" element={<Navigate to="/b/nexora-luxury" replace />} />
          <Route path="/site/:businessSlug" element={<PublicPosBookingPage />} />
          <Route path="/b/:businessSlug" element={<PublicPosBookingPage />} />
          <Route path="/booking/:businessSlug" element={<PublicPosBookingPage />} />
          <Route path="/pos/services" element={<PosServicesRoute />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/design-demo/community" element={<CommunityDesignDemo />} />
          <Route
            path="/design-demo/community-business"
            element={<CommunityBusinessDemo />}
          />
          <Route path="/community" element={<CommunityRouteRoot />}>
            <Route index element={<CommunityHome />} />
            <Route path="chat" element={<CommunityChatInbox />} />
            <Route path="chat/dm/:channelId" element={<CommunityDirectChat />} />
            <Route path="new" element={<CommunityCreateWizard />} />
            <Route path="join/:token" element={<CommunityJoinPreview />} />
            <Route path="staff" element={<CommunityStaffPage />} />
            <Route path=":id/chat" element={<CommunityChat />} />
            <Route path=":id" element={<CommunityDetail />} />
          </Route>
          <Route path="/invite" element={<InviteRoute />} />
          <Route path="/invite/:token" element={<InviteRoute />} />
          <Route
            path="/invite/public/:businessSlug"
            element={<InviteRoute />}
          />
          <Route path="/join/:businessSlug" element={<InviteRoute />} />
          <Route path="/staff/invite/:token" element={<InviteRoute />} />

          <Route
            path="/onboarding"
            element={
              <RequireAuth>
                <SetupWizard />
              </RequireAuth>
            }
          />

          <Route
            path="/dashboard"
            element={
              <RequireAuth role="owner">
                <RequireOnboarded>
                  <DashboardOwnerShell
                    userEmail={session?.email}
                    userRole="owner"
                    verificationStatus={
                      (session?.verificationStatus as string) || "unverified"
                    }
                    hasKyb={session?.verificationStatus === "kyb_approved"}
                    onLogout={logout}
                  />
                </RequireOnboarded>
              </RequireAuth>
            }
          >
            <Route index element={<OverviewRoute />} />
            <Route path="staff" element={<StaffRoute />} />
            <Route path="staff/:staffId" element={<StaffDetailRoute />} />
            <Route path="tips" element={<TipsRoute />} />
            <Route path="payments" element={<PaymentsRedirect />} />
            <Route path="payments/:paymentId" element={<PaymentsRedirect />} />
            <Route path="reviews" element={<ReviewsRoute />} />
            <Route path="reports" element={<ReportsRoute />} />
            <Route path="booking-hub" element={<BookingHubRoute />} />
            <Route path="pos/services" element={<PosServicesRoute />} />
            <Route path="pos" element={<Navigate to="/dashboard/pos/services" replace />} />
            <Route path="site" element={<SiteEditorRoute />} />
            <Route path="builder" element={<SiteEditorRoute />} />
            <Route path="site/builder" element={<SiteEditorRoute />} />
            <Route path="touchpoints" element={<TouchpointsRoute />} />
            <Route path="analytics" element={<AnalyticsRoute />} />
            <Route path="settings" element={<SettingsRoute />} />
            <Route path="settings/:tab" element={<SettingsRoute />} />
            <Route path="subscriptions" element={<SubscriptionsRoute />} />
            <Route path="support" element={<SupportRoute />} />
            <Route path="*" element={<FallbackRoute />} />
          </Route>

          <Route
            path="/staff"
            element={
              <RequireAuth role="staff">
                <RequireStaffReady>
                  <StaffDashboard
                    staffId={session?.staffId}
                    onLogout={logout}
                  />
                </RequireStaffReady>
              </RequireAuth>
            }
          >
            <Route index element={<StaffHome />} />
            <Route path="qr" element={<StaffMyQR />} />
            <Route path="tips" element={<StaffTips />} />
            <Route path="transactions" element={<StaffTransactionsLegacyRedirect />} />
            <Route path="reviews" element={<StaffReviews />} />
            <Route path="pay" element={<StaffPay />} />
            <Route path="payments" element={<StaffTransactions />} />
            <Route path="payments/:paymentId" element={<StaffTransactions />} />
            <Route path="earnings" element={<StaffMyEarnings />} />
            <Route path="salons" element={<StaffMySalons />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="*" element={<StaffFallbackRoute />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <GlobalDemoQuickNav />
    </ErrorBoundary>
  );
}
