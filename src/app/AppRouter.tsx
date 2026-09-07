import { Suspense, useEffect, useRef } from "react";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { scrollToPageTop } from "../utils/scrollToPageTop";
import { searchHasStaffChatStartHint, isStaffChatStartHintOnlySearchChange } from "../components/staff/constants";
import { useAuth } from "../auth/useAuth";
import { buildDashboardReportsPath, DASHBOARD_REPORTS_TAB } from "../components/dashboard/constants";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { isDemoToolsEnabled } from "./demoTools";
import lazyWithRetry from "./lazyWithRetry";
import LoadingScreen from "./LoadingScreen";
import RequireAuth from "./RequireAuth";
import RequireOnboarded from "./RequireOnboarded";
import RequireStaffReady from "./RequireStaffReady";
import RootRedirect from "./RootRedirect";
import { VoiceCallPlanRoute } from "../data/voiceTrial/domain";
import { PUBLIC_BOOKING_ROUTE } from "../components/public/booking/constants";
import { ONEQR_ROUTE } from "../constants/oneQr";

const OwnerDashboardRoutes = lazyWithRetry(() => import("./OwnerDashboardRoutes"));

const SetupWizard = lazyWithRetry(() => import("../components/SetupWizard"));
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
const StaffTaxIqOverviewRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqOverviewRoute'))
const StaffTaxIqCpaAccessRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqCpaAccessRoute'))
const StaffTaxIqDeductionsRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqDeductionsRoute'))
const StaffTaxIqReceiptsRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqReceiptsRoute'))
const StaffTaxIqLogsRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqLogsRoute'))
const StaffTaxIqIncomeRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqIncomeRoute'))
const StaffTaxIqPayoutsRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqPayoutsRoute'))
const StaffTaxIqExportRoute = lazyWithRetry(() => import('../components/staff-dashboard/views/taxiq/StaffTaxIqExportRoute'))
const CpaViewerPage = lazyWithRetry(() => import('../components/taxiq/CpaViewer/CpaViewerPage'))
const ShareLinkViewerPage = lazyWithRetry(() => import('../components/taxiq/ShareLinkViewer/ShareLinkViewerPage'))
const StaffW4InvitePage = lazyWithRetry(() => import('../components/taxiq/W4Invite/StaffW4InvitePage'))
// Self Check-In kiosk. Both routes sit outside the auth gate on purpose — a paired tablet
// authenticates with its own device token and never has a user session.
const PosDevicePairPage = lazyWithRetry(() => import('../components/posDevice/PosDevicePairPage'))
const SelfCheckInPage = lazyWithRetry(() => import('../components/posDevice/SelfCheckInPage'))
const StaffMyEarnings = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffMyEarnings"),
);
const StaffMySalons = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffMySalons"),
);
const StaffSalonReport = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffSalonReport"),
);
const StaffClockScan = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffClockScan"),
);
const StaffFrontDesk = lazyWithRetry(
  () => import("../components/staff-dashboard/views/StaffFrontDesk"),
);
const StaffWorkOrders = lazyWithRetry(
  () => import("../components/staff-dashboard/work-orders/StaffWorkOrders"),
);
const StaffMyCalendar = lazyWithRetry(
  () => import("../components/staff-dashboard/calendar/StaffMyCalendar"),
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
const OneQrLandingPage = lazyWithRetry(
  () => import("../components/public/oneqr/OneQrLandingPage"),
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
const PublicPosBookingPage = lazyWithRetry(
  () => import("../components/public/PublicBookingPage"),
);
const ManageBookingPage = lazyWithRetry(
  () => import("../components/public/ManageBookingPage"),
);
const ReceiptPage = lazyWithRetry(
  () => import("../components/public/ReceiptPage"),
);
const PublicBookingPage = lazyWithRetry(
  () => import("../components/public/booking/PublicBookingPage"),
);
const PublicCheckInPage = lazyWithRetry(
  () => import("../components/public/checkin/PublicCheckInPage"),
);
const PublicCheckInStatusPage = lazyWithRetry(
  () => import("../components/public/checkin/PublicCheckInStatusPage"),
);
const VoiceCallPlanPage = lazyWithRetry(
  () => import("../components/public/VoiceCallPlanPage"),
);
const SmsConsentReferencePage = lazyWithRetry(
  () => import("../components/public/SmsConsentReferencePage"),
);
const PublicNewsLibraryPage = lazyWithRetry(
  () => import("../components/public/PublicNewsLibraryPage"),
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
  const target = buildDashboardReportsPath({
    tab: DASHBOARD_REPORTS_TAB.directPayments,
    paymentId: paymentId || undefined,
  });
  return <Navigate to={target} replace />;
}

function StaffFallbackRoute() {
  return <Navigate to="/staff" replace />;
}

function StaffTransactionsLegacyRedirect() {
  return <Navigate to="/staff/payments?tab=tips" replace />;
}

function isTabOnlySearchChange(previousSearch: string, nextSearch: string) {
  if (previousSearch === nextSearch) return false;

  const previous = new URLSearchParams(previousSearch);
  const next = new URLSearchParams(nextSearch);
  const previousTab = previous.get('tab');
  const nextTab = next.get('tab');
  previous.delete('tab');
  next.delete('tab');

  return previousTab !== nextTab && previous.toString() === next.toString();
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const previousLocationRef = useRef<{ pathname: string; search: string; hash: string } | null>(null);

  useEffect(() => {
    const previousLocation = previousLocationRef.current;
    previousLocationRef.current = { pathname, search, hash };

    if (hash) {
      const targetId = decodeURIComponent(hash.slice(1));
      let observer: MutationObserver | null = null;

      const scrollToHashTarget = () => {
        const target = document.getElementById(targetId);
        if (!target) return false;

        target.scrollIntoView({ behavior: 'auto', block: 'start' });
        return true;
      };

      if (!scrollToHashTarget()) {
        observer = new MutationObserver(() => {
          if (scrollToHashTarget()) observer?.disconnect();
        });
        observer.observe(document.getElementById('root') ?? document.body, {
          childList: true,
          subtree: true,
        });
      }

      return () => observer?.disconnect();
    }

    if (
      previousLocation?.pathname === pathname &&
      previousLocation.hash === hash &&
      (
        isTabOnlySearchChange(previousLocation.search, search)
        || isStaffChatStartHintOnlySearchChange(previousLocation.search, search)
      )
    ) {
      return undefined;
    }

    if (searchHasStaffChatStartHint(search)) {
      window.scrollTo(0, 0);
      return undefined;
    }

    scrollToPageTop();
    return undefined;
  }, [pathname, search, hash]);
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
          <Route path={ONEQR_ROUTE.path} element={<OneQrLandingPage />} />
          <Route path={PUBLIC_BOOKING_ROUTE.path} element={<PublicBookingPage />} />
          <Route path="/booking/:businessSlug" element={<PublicPosBookingPage />} />
          <Route path="/booking/manage/:manageToken" element={<ManageBookingPage />} />
          <Route path="/receipt/:receiptToken" element={<ReceiptPage />} />
          {/* POS Public Check-In — customer checks in from their own phone (POS-Public-Check-In-Technical.md §9). */}
          <Route path="/checkin/status/:receiptToken" element={<PublicCheckInStatusPage />} />
          <Route path="/checkin/:businessSlug" element={<PublicCheckInPage />} />
          <Route path="/cpa/access" element={<CpaViewerPage />} />
          <Route path="/share/access" element={<ShareLinkViewerPage />} />
          <Route path="/w4-invite" element={<StaffW4InvitePage />} />
          <Route path="/pos-device/pair" element={<PosDevicePairPage />} />
          <Route path="/self-checkin" element={<SelfCheckInPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/sms-consent" element={<SmsConsentReferencePage />} />
          <Route path="/news-library" element={<PublicNewsLibraryPage />} />
          <Route
            path={VoiceCallPlanRoute.path}
            element={<VoiceCallPlanPage />}
          />
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
            path="/dashboard/*"
            element={
              <RequireAuth role="owner">
                <RequireOnboarded>
                  <OwnerDashboardRoutes />
                </RequireOnboarded>
              </RequireAuth>
            }
          />

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
            <Route path="taxiq" element={<StaffTaxIqOverviewRoute />} />
            <Route path="taxiq/deductions" element={<StaffTaxIqDeductionsRoute />} />
            <Route path="taxiq/receipts" element={<StaffTaxIqReceiptsRoute />} />
            <Route path="taxiq/logs" element={<StaffTaxIqLogsRoute />} />
            <Route path="taxiq/income" element={<StaffTaxIqIncomeRoute />} />
            <Route path="taxiq/payouts" element={<StaffTaxIqPayoutsRoute />} />
            <Route path="taxiq/export" element={<StaffTaxIqExportRoute />} />
            <Route path="taxiq/cpa-access" element={<StaffTaxIqCpaAccessRoute />} />
            <Route path="earnings" element={<StaffMyEarnings />} />
            <Route path="salons" element={<StaffMySalons />} />
            <Route path="salons/report" element={<StaffSalonReport />} />
            <Route path="salons/:businessId/front-desk" element={<StaffFrontDesk />} />
            <Route path="work-orders/:salonId?/:ticketId?" element={<StaffWorkOrders />} />
            <Route path="calendar" element={<StaffMyCalendar />} />
            {/* Landing page for the rotating clock-in QR — salon id and token arrive as ?b=&t= */}
            <Route path="clock-scan" element={<StaffClockScan />} />
            <Route path="profile" element={<StaffProfile />} />
            <Route path="notifications" element={<StaffNotifications />} />
            <Route path="*" element={<StaffFallbackRoute />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}
