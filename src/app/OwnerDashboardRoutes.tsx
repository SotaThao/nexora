import { Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
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
  PackageBillingDetailRoute,
  NewsLibraryRoute,
  TipsRoute,
  TouchpointsRoute,
  TaxIqOverviewRoute,
  TaxIqDeductionsRoute,
  TaxIqIncomeRoute,
  TaxIqReceiptsRoute,
  TaxIqEquipmentRoute,
  TaxIqPayrollRoute,
  TaxIqRemindersRoute,
  TaxIqCpaAccessRoute,
  TaxIqExportRoute,
  TaxIqEmployersRoute,
  TaxIqPayEngineRoute,
  TaxIqWeeklyPayrollRoute,
  TaxIqPayrollRunsRoute,
  TaxIqTaxLedgerRoute,
  TaxIqExceptionsRoute,
  TaxIqDataQualityRoute,
  TaxIqJurisdictionsRoute,
  TaxIqShareLinksRoute,
  TaxIqForm1099NecRoute,
  TaxIqTipLedgerRoute,
  TaxIqFormsReportsRoute,
  TaxIqTaxEstimateRoute,
  PosSalonSettingsRoute,
  PosRolesRoute,
  PosCategoriesRoute,
  PosServicesRoute,
  PosProductsRoute,
  PosPromotionsRoute,
  PosStaffProfileRoute,
  PosFrontDeskRoute,
  PosReportsRoute,
  PosDevicesRoute,
  PosPublicCheckInRoute,
  PosPrinterSetupRoute,
} from '../components/dashboard/routes'
import {
  BOOKING_HUB_LEGACY_PATH_SEGMENT,
  BOOKING_HUB_PATH,
  DASHBOARD_MENU_ID,
  DASHBOARD_SETTINGS_TAB,
  buildDashboardReportsPath,
  DASHBOARD_REPORTS_TAB,
} from '../components/dashboard/constants'
import { useAuth } from '../auth/useAuth'
import lazyWithRetry from './lazyWithRetry'
import PosOnboardingLayout from './PosOnboardingLayout'

const DashboardOwnerShell = lazyWithRetry(
  () => import('../components/dashboard/layout/DashboardOwnerShell'),
)
const OneQrArtworkPage = lazyWithRetry(
  () => import('../components/touchpoints/oneqr/OneQrArtworkPage'),
)

function PaymentsRedirect() {
  const { paymentId } = useParams()
  const target = buildDashboardReportsPath({
    tab: DASHBOARD_REPORTS_TAB.directPayments,
    paymentId: paymentId || undefined,
  })
  return <Navigate to={target} replace />
}

function BookingHubLegacyRedirect() {
  const [searchParams] = useSearchParams()
  const qs = searchParams.toString()
  return <Navigate to={`${BOOKING_HUB_PATH}${qs ? `?${qs}` : ''}`} replace />
}

/**
 * Owner dashboard route tree. Loaded only after /dashboard is visited so the
 * public homepage does not compile POS / TaxIQ / News Library on first paint.
 */
export default function OwnerDashboardRoutes() {
  const { session, logout } = useAuth()

  return (
    <Routes>
      <Route
        element={
          <DashboardOwnerShell
            userEmail={session?.email}
            userRole="owner"
            verificationStatus={
              (session?.verificationStatus as string) || 'unverified'
            }
            hasKyb={session?.verificationStatus === 'kyb_approved'}
            onLogout={logout}
          />
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
          <Route path={`${DASHBOARD_MENU_ID.pos}/settings/:settingsTab?`} element={<PosSalonSettingsRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/report/:reportTab?`} element={<PosReportsRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/roles`} element={<PosRolesRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/categories`} element={<PosCategoriesRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/services`} element={<PosServicesRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/products`} element={<PosProductsRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/promotions`} element={<PosPromotionsRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/staff`} element={<PosStaffProfileRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/devices`} element={<PosDevicesRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/printer`} element={<PosPrinterSetupRoute />} />
          <Route path={`${DASHBOARD_MENU_ID.pos}/public-checkin`} element={<PosPublicCheckInRoute />} />
        </Route>
        <Route path={DASHBOARD_MENU_ID.touchpoints} element={<TouchpointsRoute />} />
        <Route path="touchpoints/oneqr/artwork" element={<OneQrArtworkPage />} />
        <Route path={DASHBOARD_MENU_ID.analytics} element={<AnalyticsRoute />} />
        <Route path={DASHBOARD_MENU_ID.settings} element={<SettingsRoute />} />
        <Route path={`${DASHBOARD_MENU_ID.settings}/:tab`} element={<SettingsRoute />} />
        <Route path={`${DASHBOARD_MENU_ID.settings}/${DASHBOARD_SETTINGS_TAB.staff}/:staffId`} element={<SettingsRoute />} />
        <Route path={DASHBOARD_MENU_ID.subscriptions} element={<SubscriptionsRoute />} />
        <Route path={DASHBOARD_MENU_ID.packageManagement} element={<PackageManagementRoute />} />
        <Route path={`${DASHBOARD_MENU_ID.packageManagement}/billing`} element={<PackageBillingDetailRoute />} />
        <Route path={DASHBOARD_MENU_ID.newsLibrary} element={<NewsLibraryRoute />} />
        <Route path={DASHBOARD_MENU_ID.support} element={<SupportRoute />} />
        <Route path="*" element={<FallbackRoute />} />
      </Route>
    </Routes>
  )
}
