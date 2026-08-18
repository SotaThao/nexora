import { Suspense, useEffect } from "react";
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
import { useAuth } from "../auth/useAuth";
import {
  AnalyticsRoute,
  BookingHubRoute,
  AiVoiceSetupGuideRoute,
  FallbackRoute,
  OverviewRoute,
  ProductManagementRoute,
  ReportsRoute,
  ReviewsRoute,
  SettingsRoute,
  StaffDetailRoute,
  StaffRoute,
  SubscriptionsRoute,
  SupportRoute,
  PackageManagementRoute,
  NewsLibraryRoute,
  TipsRoute,
  TouchpointsRoute,
  TaxIqOverviewRoute, TaxIqDeductionsRoute, TaxIqIncomeRoute, TaxIqReceiptsRoute, TaxIqEquipmentRoute,
  TaxIqPayrollRoute, TaxIqRemindersRoute, TaxIqCpaAccessRoute, TaxIqExportRoute, TaxIqEmployersRoute,
  TaxIqPayEngineRoute, TaxIqWeeklyPayrollRoute, TaxIqPayrollRunsRoute, TaxIqTaxLedgerRoute,
  TaxIqExceptionsRoute, TaxIqDataQualityRoute, TaxIqJurisdictionsRoute, TaxIqShareLinksRoute,
  TaxIqForm1099NecRoute, TaxIqTipLedgerRoute, TaxIqFormsReportsRoute, TaxIqTaxEstimateRoute,
  PosGeneralSettingsRoute, PosRolesRoute, PosCategoriesRoute, PosServicesRoute, PosProductsRoute,
  PosStaffProfileRoute, PosFrontDeskRoute
} from "../components/dashboard/routes";
import { DASHBOARD_MENU_ID, DASHBOARD_SETTINGS_TAB, BOOKING_HUB_PATH, BOOKING_HUB_LEGACY_PATH_SEGMENT, buildDashboardReportsPath, DASHBOARD_REPORTS_TAB } from "../components/dashboard/constants";
import ErrorBoundary from "../components/ui/ErrorBoundary";
import { isDemoToolsEnabled } from "./demoTools";
import lazyWithRetry from "./lazyWithRetry";
import LoadingScreen from "./LoadingScreen";
import RequireAuth from "./RequireAuth";
import RequireOnboarded from "./RequireOnboarded";
import RequireStaffReady from "./RequireStaffReady";
import PosOnboardingLayout from "./PosOnboardingLayout";
import RootRedirect from "./RootRedirect";
import { VoiceCallPlanRoute } from "../data/voiceTrial/domain";
import { PUBLIC_BOOKING_ROUTE } from "../components/public/booking/constants";

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
const PublicPosBookingPage = lazyWithRetry(
  () => import("../components/public/PublicBookingPage"),
);
const ManageBookingPage = lazyWithRetry(
  () => import("../components/public/ManageBookingPage"),
);
const PublicBookingPage = lazyWithRetry(
  () => import("../components/public/booking/PublicBookingPage"),
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

function BookingHubLegacyRedirect() {
  const [searchParams] = useSearchParams();
  const qs = searchParams.toString();
  return <Navigate to={`${BOOKING_HUB_PATH}${qs ? `?${qs}` : ''}`} replace />;
}

function StaffFallbackRoute() {
  return <Navigate to="/staff" replace />;
}

function StaffTransactionsLegacyRedirect() {
  return <Navigate to="/staff/payments?tab=tips" replace />;
}

function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  useEffect(() => {
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
          <Route path={PUBLIC_BOOKING_ROUTE.path} element={<PublicBookingPage />} />
          <Route path="/booking/:businessSlug" element={<PublicPosBookingPage />} />
          <Route path="/booking/manage/:manageToken" element={<ManageBookingPage />} />
          <Route path="/cpa/access" element={<CpaViewerPage />} />
          <Route path="/share/access" element={<ShareLinkViewerPage />} />
          <Route path="/w4-invite" element={<StaffW4InvitePage />} />
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
            <Route path={DASHBOARD_MENU_ID.staff} element={<StaffRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.staff}/:staffId`} element={<StaffDetailRoute />} />
            <Route path={DASHBOARD_MENU_ID.tips} element={<TipsRoute />} />
            <Route path={DASHBOARD_MENU_ID.payments} element={<PaymentsRedirect />} />
            <Route path={`${DASHBOARD_MENU_ID.payments}/:paymentId`} element={<PaymentsRedirect />} />
            <Route path={DASHBOARD_MENU_ID.reviews} element={<ReviewsRoute />} />
            <Route path={DASHBOARD_MENU_ID.reports} element={<ReportsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.bookingHub}/setup-guide`} element={<AiVoiceSetupGuideRoute />} />
            <Route path={DASHBOARD_MENU_ID.bookingHub} element={<BookingHubRoute />} />
            <Route path={BOOKING_HUB_LEGACY_PATH_SEGMENT} element={<BookingHubLegacyRedirect />} />
            <Route path={DASHBOARD_MENU_ID.taxiq} element={<TaxIqOverviewRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/deductions`} element={<TaxIqDeductionsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/income`} element={<TaxIqIncomeRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/receipts`} element={<TaxIqReceiptsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/equipment`} element={<TaxIqEquipmentRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/payroll`} element={<TaxIqPayrollRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/employers`} element={<TaxIqEmployersRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/pay-engine`} element={<TaxIqPayEngineRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/weekly-payroll`} element={<TaxIqWeeklyPayrollRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/payroll-runs`} element={<TaxIqPayrollRunsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/tax-ledger`} element={<TaxIqTaxLedgerRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/exceptions`} element={<TaxIqExceptionsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/data-quality`} element={<TaxIqDataQualityRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/jurisdictions`} element={<TaxIqJurisdictionsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/reminders`} element={<TaxIqRemindersRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/cpa-access`} element={<TaxIqCpaAccessRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/share-links`} element={<TaxIqShareLinksRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/1099nec`} element={<TaxIqForm1099NecRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/tip-ledger`} element={<TaxIqTipLedgerRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/forms-reports`} element={<TaxIqFormsReportsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/tax-estimate`} element={<TaxIqTaxEstimateRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.taxiq}/export`} element={<TaxIqExportRoute />} />
            <Route path={DASHBOARD_MENU_ID.productManagement} element={<ProductManagementRoute />} />
            <Route element={<PosOnboardingLayout />}>
              <Route path={DASHBOARD_MENU_ID.pos} element={<PosFrontDeskRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/settings`} element={<PosGeneralSettingsRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/roles`} element={<PosRolesRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/categories`} element={<PosCategoriesRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/services`} element={<PosServicesRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/products`} element={<PosProductsRoute />} />
              <Route path={`${DASHBOARD_MENU_ID.pos}/staff`} element={<PosStaffProfileRoute />} />
            </Route>
            <Route path={DASHBOARD_MENU_ID.touchpoints} element={<TouchpointsRoute />} />
            <Route path={DASHBOARD_MENU_ID.analytics} element={<AnalyticsRoute />} />
            <Route path={DASHBOARD_MENU_ID.settings} element={<SettingsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.settings}/:tab`} element={<SettingsRoute />} />
            <Route path={`${DASHBOARD_MENU_ID.settings}/${DASHBOARD_SETTINGS_TAB.staff}/:staffId`} element={<SettingsRoute />} />
            <Route path={DASHBOARD_MENU_ID.subscriptions} element={<SubscriptionsRoute />} />
            <Route path={DASHBOARD_MENU_ID.packageManagement} element={<PackageManagementRoute />} />
            <Route path={DASHBOARD_MENU_ID.newsLibrary} element={<NewsLibraryRoute />} />
            <Route path={DASHBOARD_MENU_ID.support} element={<SupportRoute />} />
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
