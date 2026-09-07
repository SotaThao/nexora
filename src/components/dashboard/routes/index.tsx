import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useOutletContext, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import lazyWithRetry from '../../../app/lazyWithRetry'
import { SHOW_HARDWARE_DEVICES } from '../constants'

import {
  buildTouchpointsSearch,
  normalizeTouchpointSection,
} from '../../touchpoints/touchpointSections'
import { useTipPlatformCheckoutFlow } from '../views/packageManagement/useTipPlatformCheckoutFlow'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import {
  buildDashboardSettingsPath,
  DASHBOARD_MENU_ID,
  DASHBOARD_ROOT_PATH,
  DASHBOARD_SETTINGS_TAB,
} from '../constants'
import { SkeletonList } from '../../ui/skeleton'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useOwnerTaxYearByBusiness } from '../../../data/hooks/useTaxiqOwnerTaxYear'
import { formatBusinessAddress } from '../views/pos/posDisplay'
import ResponsiveStaffRoute from './ResponsiveStaffRoute'
import {
  StaffDetailRouteContent,
  StaffListRouteContent,
} from './StaffManagementRouteContent'
import { STAFF_ROUTE_FAMILY } from './staffRoutePaths'
import { POS_FRONT_DESK_TAB_PARAM, PosFrontDeskTab } from '../../../constants/posFrontDesk'
import { posReportPath, PosReportTab } from '../../../constants/posReports'
import { posSalonSettingsPath, PosSalonSettingsTab } from '../../../constants/posSalonSettings'

const Overview = lazyWithRetry(() => import('../overview/Overview'))
const TouchpointsView = lazyWithRetry(() => import('../../TouchpointsView'))
const ReviewsView = lazyWithRetry(() => import('../views/ReviewsView'))
const TipsView = lazyWithRetry(() => import('../../TipsView'))
const ReportsView = lazyWithRetry(() => import('../views/ReportsView'))
const SettingsView = lazyWithRetry(() => import('../../SettingsView'))
const AnalyticsView = lazyWithRetry(() => import('../../AnalyticsView'))
const SupportView = lazyWithRetry(() => import('../../SupportView'))
const ComingSoon = lazyWithRetry(() => import('../views/ComingSoon'))
const ManagePlanView = lazyWithRetry(() => import('../views/ManagePlanView'))
const BookingHubView = lazyWithRetry(() => import('../views/BookingHubView'))
const AiVoiceSetupGuideView = lazyWithRetry(() => import('../views/AiVoiceSetupGuideView'))
const PackageManagementView = lazyWithRetry(() => import('../views/packageManagement/PackageManagementView'))
const PackageBillingDetailView = lazyWithRetry(() => import('../views/packageManagement/PackageBillingDetailView'))
const TipPlatformCheckoutModal = lazyWithRetry(() => import('../views/packageManagement/TipPlatformCheckoutModal'))
const CompleteStoreSetupGateModal = lazyWithRetry(() => import('../modals/CompleteStoreSetupGateModal'))
const NewsLibraryView = lazyWithRetry(() => import('../views/NewsLibraryView'))
const StaffDetailView = lazyWithRetry(() => import('../../StaffDetailView'))
const TaxIqOnboardingWizard = lazyWithRetry(() => import('../views/taxiq/TaxIqOnboardingWizard'))
const TaxIqHomeView = lazyWithRetry(() => import('../views/taxiq/TaxIqHomeView'))
const DeductionCenterView = lazyWithRetry(() => import('../views/taxiq/DeductionCenterView'))
const OwnerIncomeSummaryListView = lazyWithRetry(() => import('../views/taxiq/OwnerIncomeSummaryListView'))
const ReceiptVaultView = lazyWithRetry(() => import('../views/taxiq/ReceiptVaultView'))
const AssetsTrackerView = lazyWithRetry(() => import('../views/taxiq/AssetsTrackerView'))
const YearEndExportView = lazyWithRetry(() => import('../views/taxiq/YearEndExportView'))
const TaxRemindersView = lazyWithRetry(() => import('../views/taxiq/TaxRemindersView'))
const PayoutDisputeCenterView = lazyWithRetry(() => import('../views/taxiq/PayoutDisputeCenterView'))
const CpaAccessSettingsView = lazyWithRetry(() => import('../views/taxiq/CpaAccessSettingsView'))
const EmployerRegistryView = lazyWithRetry(() => import('../views/taxiq/EmployerRegistryView'))
const PayEngineView = lazyWithRetry(() => import('../views/taxiq/PayEngineView'))
const WeeklyPayrollView = lazyWithRetry(() => import('../views/taxiq/WeeklyPayrollView'))
const PayrollRunsView = lazyWithRetry(() => import('../views/taxiq/PayrollRunsView'))
const TaxLedgerView = lazyWithRetry(() => import('../views/taxiq/TaxLedgerView'))
const ExceptionsQueueView = lazyWithRetry(() => import('../views/taxiq/ExceptionsQueueView'))
const DataQualityCenterView = lazyWithRetry(() => import('../views/taxiq/DataQualityCenterView'))
const JurisdictionsView = lazyWithRetry(() => import('../views/taxiq/JurisdictionsView'))
const ShareLinksView = lazyWithRetry(() => import('../views/taxiq/ShareLinksView'))
const Form1099NecView = lazyWithRetry(() => import('../views/taxiq/Form1099NecView'))
const TipLedgerView = lazyWithRetry(() => import('../views/taxiq/TipLedgerView'))
const FormsReportsView = lazyWithRetry(() => import('../views/taxiq/FormsReportsView'))
const TaxEstimateView = lazyWithRetry(() => import('../views/taxiq/TaxEstimateView'))
const PosSalonSettingsView = lazyWithRetry(() => import('../views/pos/PosSalonSettingsView'))
const PosProductsView = lazyWithRetry(() => import('../views/pos/PosProductsView'))
const PosPromotionsView = lazyWithRetry(() => import('../views/pos/PosPromotionsView'))
const PosFrontDeskView = lazyWithRetry(() => import('../views/pos/PosFrontDeskView'))
const PosReportsView = lazyWithRetry(() => import('../views/pos/report/PosReportsView'))
const PosDevicesView = lazyWithRetry(() => import('../views/pos/devices/PosDevicesView'))
const PosPrinterSetupView = lazyWithRetry(() => import('../views/pos/printer/PosPrinterSetupView'))
const PosPublicCheckInView = lazyWithRetry(() => import('../views/pos/PosPublicCheckInView'))

export function OverviewRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  return (
    <Overview
      {...({
        chartRange: ctx.chartRange,
        setChartRange: ctx.handleChartRangeChange,
        chartStartDate: ctx.chartStartDate,
        chartEndDate: ctx.chartEndDate,
        setChartStartDate: ctx.setChartStartDate,
        setChartEndDate: ctx.setChartEndDate,
      } as any)}
      metrics={ctx.metrics}
      kpiDeltas={ctx.kpiDeltas}
      activeKpi={ctx.activeKpi}
      setActiveKpi={ctx.setActiveKpi}
      transactions={ctx.transactions}
      selectedStaff={ctx.selectedLeaderboardStaff}
      setSelectedStaff={ctx.handleSelectLeaderboardStaff}
      onOpenTouchpoints={() => navigate(`/dashboard/touchpoints?${buildTouchpointsSearch()}`)}
      onOpenReviews={() => navigate('/dashboard/reviews')}
      onOpenStaff={() => navigate('/dashboard/staff')}
      onOpenBookings={() => navigate('/dashboard/pos?tab=booking')}
      businessName={ctx.businessName}
      previewQr={ctx.previewQr}
      touchpoints={ctx.touchpoints}
      hasKyb={ctx.hasKyb}
      hasSetup={ctx.hasSetup}
      onStartSetup={ctx.onStartSetup}
      profile={ctx.profile}
      onNavigateMenu={ctx.onNavigateMenu}
      onOpenAddStaff={ctx.openAddStaff}
      onApproveClick={ctx.openApproveStaff}
      pendingStaff={ctx.pendingStaff}
      staff={ctx.staff}
      isLoading={ctx.isOverviewLoading}
      isTransactionsLoading={ctx.isTransactionsLoading}
      isTouchpointsLoading={ctx.isTouchpointsLoading}
      reviewsPage={ctx.reviewsPage}
      isReviewsPending={ctx.isReviewsPending}
      reviewsThisWeekCount={ctx.reviewsThisWeekCount}
      metricsMonth={ctx.metricsMonth}
      metricsYear={ctx.metricsYear}
    />
  )
}


export function StaffRoute() {
  return (
    <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Legacy}>
      <StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Legacy} />
    </ResponsiveStaffRoute>
  )
}

export function StaffDetailRoute() {
  const { staffId } = useParams()
  return (
    <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Legacy} staffId={staffId}>
      <StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Legacy} />
    </ResponsiveStaffRoute>
  )
}

export function StaffRoleRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const member = ctx.staff.find((m) => m.id === ctx.currentStaffId)

  if (!member) {
    return (
      <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
        <div className="text-sm font-semibold text-nexoraMuted">
          {t('components.dashboardRoot.yourStaffProfileWas')}
        </div>
      </div>
    )
  }

  return (
    <StaffDetailView
      staffMember={member}
      staffProfileId={member.staffProfileId ?? null}
      onBack={null}
      onViewStaff={ctx.openViewStaff}
      onQr={ctx.previewQr}
      onDelete={null}
    />
  )
}

export function TouchpointsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const [sp, setSp] = useSearchParams()
  const tab = sp.get('tab') || 'stations'
  const activeSubTab = SHOW_HARDWARE_DEVICES && tab === 'devices' ? 'devices' : 'stations'
  const stationsSection = normalizeTouchpointSection(sp.get('section'))

  useEffect(() => {
    if (!SHOW_HARDWARE_DEVICES && tab === 'devices') {
      setSp({ tab: 'stations', section: stationsSection }, { replace: true })
    }
  }, [tab, stationsSection, setSp])

  return (
    <TouchpointsView
      onOpenAddModal={(prefill) => {
        ctx.setAddTouchpointPrefill(prefill || null)
        ctx.setIsAddTouchpointModalOpen(true)
      }}
      onDelete={(id) => ctx.deleteTouchpoint(id)}
      onQr={ctx.previewQr}
      onToggleStatus={ctx.toggleTouchpointStatus}
      togglingTouchpointId={ctx.togglingTouchpointId}
      onLinkDevice={ctx.linkDevice}
      transactions={ctx.transactions}
      businessName={ctx.businessName}
      businessSlug={ctx.businessSlug}
      inviteLinkSetting={ctx.inviteLinkSetting}
      isInviteLinkSettingLoading={ctx.isInviteLinkSettingLoading}
      devices={ctx.devices}
      onAddDevice={ctx.handleAddDevice}
      onDeleteDevice={ctx.handleDeleteDevice}
      onToggleDeviceStatus={ctx.handleToggleDeviceStatus}
      activeSubTab={activeSubTab}
      stationsSection={stationsSection}
      onStationsSectionChange={(nextSection) => {
        setSp({ tab: 'stations', section: nextSection }, { replace: true })
      }}
      onTabChange={(nextTab) => {
        const resolvedTab = nextTab === 'devices' && !SHOW_HARDWARE_DEVICES ? 'stations' : nextTab
        if (resolvedTab === 'stations') {
          const section = normalizeTouchpointSection(sp.get('section'))
          setSp({ tab: resolvedTab, section }, { replace: true })
        } else {
          setSp({ tab: resolvedTab }, { replace: true })
        }
      }}
    />
  )
}

export function ReviewsRoute() {
  const ctx = useOutletContext<LooseObject>()

  return (
    <ReviewsView
      reviews={ctx.reviewsPage?.items ?? []}
      summary={ctx.reviewsSummary}
      isLoading={ctx.isReviewsPending}
      isFetching={ctx.reviewsListFetching}
      staff={ctx.filteredStaff}
      filter={ctx.reviewFilterStaff}
      setFilter={ctx.setReviewFilterStaff}
      setupData={ctx.setupData}
      pageNumber={ctx.activeReviewsPage}
      pageSize={ctx.activeReviewsPageSize}
      totalPages={ctx.activeReviewsTotalPages}
      totalCount={ctx.activeReviewsTotalCount}
      hasNextPage={ctx.activeReviewsHasNext}
      hasPreviousPage={ctx.activeReviewsHasPrev}
      onPageChange={ctx.setActiveReviewsPage}
    />
  )
}

export function TipsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const [sp, setSp] = useSearchParams()
  const rawTab = sp.get('tab') || 'overview'
  const tab = rawTab === 'transactions' ? 'overview' : rawTab

  useEffect(() => {
    if (rawTab === 'transactions') {
      setSp({ tab: 'overview' }, { replace: true })
    }
  }, [rawTab, setSp])

  return (
    <TipsView
      transactions={ctx.transactions}
      staff={ctx.staff}
      metrics={ctx.metrics}
      activeTab={tab}
      processingFee={ctx.processingFee}
      setProcessingFee={ctx.setProcessingFee}
    />
  )
}

export function ReportsRoute() {
  const ctx = useOutletContext<LooseObject>()
  return <ReportsView staff={ctx.staff} touchpoints={ctx.touchpoints} businessName={ctx.businessName} businessSlug={ctx.businessSlug} />
}

export function BookingHubRoute() {
  return <BookingHubView />
}

export function AiVoiceSetupGuideRoute() {
  return <AiVoiceSetupGuideView />
}

export function ProductManagementRoute() {
  const navigate = useNavigate()
  const { openProductManagement, isOpeningProductManagement } = useOpenProductManagement()
  const { t } = useTranslation()
  const openedRef = useRef(false)

  useEffect(() => {
    if (openedRef.current) return
    openedRef.current = true
    void openProductManagement().finally(() => {
      navigate(DASHBOARD_ROOT_PATH, { replace: true })
    })
  }, [navigate, openProductManagement])

  return (
    <div className="flex min-h-[320px] items-center justify-center">
      <div className="text-center">
        {isOpeningProductManagement ? (
          <span className="mx-auto mb-3 block h-8 w-8 animate-spin rounded-full border-[3px] border-nexoraBorder border-t-nexoraBrand" />
        ) : null}
        <p className="text-sm font-semibold text-nexoraMuted">
          {t('dashboard.menu.product_management')}…
        </p>
      </div>
    </div>
  )
}

export function AnalyticsRoute() {
  return <AnalyticsView />
}

export function NewsLibraryRoute() {
  return <NewsLibraryView />
}

export function SettingsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { tab = 'profile', staffId } = useParams()
  const navigate = useNavigate()
  const isStaffTab = tab === DASHBOARD_SETTINGS_TAB.staff

  if (staffId) {
    return (
      <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Settings} staffId={staffId}>
        <StaffDetailRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
      </ResponsiveStaffRoute>
    )
  }

  const settings = (
    <SettingsView
      {...({ onBlockedFeatureClick: ctx.requireKyb } as any)}
      setupData={ctx.setupData}
      hasKyb={ctx.hasKyb}
      verificationStatus={ctx.verificationStatus}
      userEmail={ctx.userEmail}
      onKybRequired={ctx.requireKyb}
      initialTab={tab}
      onTabChange={(nextTab) => navigate(buildDashboardSettingsPath(nextTab))}
      onKybSuccess={ctx.onKybSuccess}
      staffContent={isStaffTab
        ? <StaffListRouteContent routeFamily={STAFF_ROUTE_FAMILY.Settings} />
        : null}
    />
  )

  return isStaffTab ? (
    <ResponsiveStaffRoute family={STAFF_ROUTE_FAMILY.Settings} staffId={staffId}>
      {settings}
    </ResponsiveStaffRoute>
  ) : settings
}

// POS Owner Setup — sidebar group (US-014). Business Info and Business Hours
// are gated by the same KYB-editability rule as general Settings, so this
// screen takes verificationStatus from the same outlet context as
// SettingsRoute above. Business Hours was previously its own route
// (PosBusinessHoursRoute, /pos/business-hours) — merged into this screen.
export function PosSalonSettingsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return <PosSalonSettingsView verificationStatus={ctx?.verificationStatus} businessId={businessId} />
}

function LegacyPosSalonSettingRedirect({ tab }: { tab: PosSalonSettingsTab }) {
  const location = useLocation()
  return <Navigate to={`${posSalonSettingsPath(tab)}${location.search}`} replace />
}

/** @deprecated Kept as a route-level redirect for bookmarked POS URLs. */
export function PosGeneralSettingsRoute() {
  return <LegacyPosSalonSettingRedirect tab={PosSalonSettingsTab.SalonInformation} />
}

/** @deprecated Kept as a route-level redirect for bookmarked POS URLs. */
export function PosRolesRoute() {
  return <LegacyPosSalonSettingRedirect tab={PosSalonSettingsTab.RolesPermissions} />
}

/** @deprecated Categories are managed inside Salon Setting > Services. */
export function PosCategoriesRoute() {
  return <LegacyPosSalonSettingRedirect tab={PosSalonSettingsTab.Services} />
}

/** @deprecated Kept as a route-level redirect for bookmarked POS URLs. */
export function PosServicesRoute() {
  return <LegacyPosSalonSettingRedirect tab={PosSalonSettingsTab.Services} />
}

// Same rationale as PosCategoriesRoute/PosServicesRoute — Products is
// catalog/menu data, not gated behind verificationStatus/KYB.
export function PosProductsRoute() {
  return <PosProductsView />
}

// Promotions are catalog data like Services/Products — not gated behind verificationStatus/KYB.
// businessId is explicit because the endpoints are per-business (a Staff caller with Operations
// access may be linked to more than one salon).
export function PosPromotionsRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return <PosPromotionsView businessId={businessId} />
}

// Staff profile (role/pay/tips/tax filing) is not salon identity data either —
// not gated behind verificationStatus/KYB, same rationale as the other POS catalog routes.
export function PosStaffProfileRoute() {
  return <LegacyPosSalonSettingRedirect tab={PosSalonSettingsTab.Staff} />
}

// Front Desk (Check-in queue / Turn Board / Checkout, US-12) — shared component
// with the Staff dashboard's salons/:businessId/front-desk route (see AppRouter.tsx).
// For the Owner, businessId always comes from their own merchant setup data.
export function PosFrontDeskRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const [searchParams] = useSearchParams()
  if (searchParams.get(POS_FRONT_DESK_TAB_PARAM) === PosFrontDeskTab.Report) {
    const reportParams = new URLSearchParams(searchParams)
    reportParams.delete(POS_FRONT_DESK_TAB_PARAM)
    const query = reportParams.toString()
    return (
      <Navigate
        to={`${posReportPath(PosReportTab.Technician)}${query ? `?${query}` : ''}`}
        replace
      />
    )
  }
  const businessId = merchantSetupData?.businessInfo?.businessId
  const businessName = merchantSetupData?.businessInfo?.name
  const businessLogoUrl = merchantSetupData?.businessInfo?.logo
  const businessAddress = formatBusinessAddress(merchantSetupData?.businessInfo ?? {})
  const businessPhone = merchantSetupData?.businessInfo?.phone
  const businessSlug = merchantSetupData?.businessInfo?.slug
  const businessTimeZone = merchantSetupData?.businessInfo?.timeZone
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return (
    <PosFrontDeskView
      businessId={businessId}
      businessName={businessName}
      businessLogoUrl={businessLogoUrl}
      businessAddress={businessAddress}
      businessPhone={businessPhone}
      businessSlug={businessSlug}
      businessTimeZone={businessTimeZone ?? null}
    />
  )
}

export function PosReportsRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const businessTimeZone = merchantSetupData?.businessInfo?.timeZone?.trim() || 'UTC'
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return <PosReportsView businessId={businessId} businessTimeZone={businessTimeZone} />
}

// POS > Printer. Device-scoped configuration (which printer this iPad talks to, how many
// copies it prints), so it is not gated on verificationStatus/KYB — same reasoning as the
// other POS catalog routes. Business identity is forwarded so a test print shows the real
// salon header rather than a blank one.
export function PosPrinterSetupRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessInfo = merchantSetupData?.businessInfo
  return (
    <PosPrinterSetupView
      businessName={businessInfo?.name}
      businessAddress={formatBusinessAddress(businessInfo ?? {})}
      businessPhone={businessInfo?.phone}
    />
  )
}

// Check-In Devices (POS Self Check-In) — pairing and managing the tablets customers use to check
// themselves in. Gated server-side on manage_checkin_devices, not on being the Owner.
export function PosDevicesRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return <PosDevicesView businessId={businessId} />
}

export function PosPublicCheckInRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return (
    <PosPublicCheckInView
      businessId={businessId}
      businessSlug={merchantSetupData?.businessInfo?.slug}
      businessName={merchantSetupData?.businessInfo?.name}
      businessLogo={merchantSetupData?.businessInfo?.logo}
    />
  )
}

export function TaxIqOverviewRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return <TaxIqOnboardingWizard businessId={businessId as string} taxYear={currentTaxYear} />
  }

  return <TaxIqHomeView ownerTaxYear={ownerTaxYear} />
}
export function TaxIqDeductionsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.deductionCenter.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <DeductionCenterView ownerTaxYearId={ownerTaxYear.id} ownerTaxYearStatus={ownerTaxYear.status} />
}
export function TaxIqIncomeRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.ownerIncome.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.ownerIncome.goToSetup')}
        </button>
      </div>
    )
  }

  return (
    <OwnerIncomeSummaryListView
      ownerTaxYearId={ownerTaxYear.id}
      taxYear={ownerTaxYear.taxYear}
      ownerTaxYearStatus={ownerTaxYear.status}
    />
  )
}
export function TaxIqReceiptsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.receiptVault.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.receiptVault.goToSetup')}
        </button>
      </div>
    )
  }

  return <ReceiptVaultView scope="owner" ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqEquipmentRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.assetsTracker.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <AssetsTrackerView ownerTaxYearId={ownerTaxYear.id} ownerTaxYearStatus={ownerTaxYear.status} />
}
export function TaxIqPayrollRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.payoutCenter.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <PayoutDisputeCenterView ownerTaxYearId={ownerTaxYear.id} ownerTaxYearStatus={ownerTaxYear.status} />
}
// Employer is 1:1 with Business, not OwnerTaxYear — this route only needs businessId,
// unlike every other TaxIq*Route above which also resolve an OwnerTaxYear.
export function TaxIqEmployersRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <EmployerRegistryView businessId={businessId} />
}
// Pay Engine (mục 13) is keyed by BusinessStaffLink/POS staff profile, not OwnerTaxYear —
// same businessId-only shape as TaxIqEmployersRoute above.
export function TaxIqPayEngineRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <PayEngineView businessId={businessId} />
}
// Weekly Payroll (mục 14) is keyed by BusinessStaffLink/POS staff profile, not OwnerTaxYear —
// same businessId-only shape as TaxIqPayEngineRoute above.
export function TaxIqWeeklyPayrollRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <WeeklyPayrollView businessId={businessId} />
}
// Payroll Runs (mục 12) is keyed by Employer (resolved inside PayrollRunsView itself via
// useTaxiqEmployers), same businessId-only shape as TaxIqWeeklyPayrollRoute above.
export function TaxIqPayrollRunsRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <PayrollRunsView businessId={businessId} />
}
// Tax Ledger (mục 16) is keyed by Employer too, same businessId-only shape as
// TaxIqPayrollRunsRoute above.
export function TaxIqTaxLedgerRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <TaxLedgerView businessId={businessId} />
}
// Exceptions Queue (mục 17) + Data Quality Center (mục 18) are keyed by Employer too, same
// businessId-only shape as TaxIqTaxLedgerRoute above.
export function TaxIqExceptionsRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <ExceptionsQueueView businessId={businessId} />
}
export function TaxIqDataQualityRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <DataQualityCenterView businessId={businessId} />
}
export function TaxIqJurisdictionsRoute() {
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId

  if (isMerchantLoading) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  if (!businessId) {
    return null
  }

  return <JurisdictionsView businessId={businessId} />
}
export function TaxIqShareLinksRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.shareLinks.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.shareLinks.goToSetup')}
        </button>
      </div>
    )
  }

  return <ShareLinksView ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqForm1099NecRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.form1099nec.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.form1099nec.goToSetup')}
        </button>
      </div>
    )
  }

  return <Form1099NecView ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqTipLedgerRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.tipLedger.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.tipLedger.goToSetup')}
        </button>
      </div>
    )
  }

  return <TipLedgerView ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqFormsReportsRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.tipLedger.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.tipLedger.goToSetup')}
        </button>
      </div>
    )
  }

  return <FormsReportsView ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqTaxEstimateRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.tipLedger.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.tipLedger.goToSetup')}
        </button>
      </div>
    )
  }

  return <TaxEstimateView ownerTaxYearId={ownerTaxYear.id} />
}
export function TaxIqRemindersRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.reminders.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <TaxRemindersView ownerTaxYearId={ownerTaxYear.id} ownerTaxYearStatus={ownerTaxYear.status} />
}
export function TaxIqCpaAccessRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.cpaAccess.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <CpaAccessSettingsView scope="owner" ownerTaxYearId={ownerTaxYear.id} />
}

export function TaxIqExportRoute() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { data: merchantSetupData, isLoading: isMerchantLoading } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const currentTaxYear = new Date().getFullYear()
  const { data: ownerTaxYearPage, isLoading: isTaxYearLoading } = useOwnerTaxYearByBusiness(
    businessId,
    currentTaxYear,
  )

  if (isMerchantLoading || (!!businessId && isTaxYearLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={2} />
      </div>
    )
  }

  const ownerTaxYear = ownerTaxYearPage?.items?.[0] ?? null

  if (!ownerTaxYear) {
    return (
      <div className="nexora-card flex flex-col items-start gap-3 p-6">
        <p className="text-sm font-semibold text-nexoraMuted">{t('taxiq.yearEndExport.noOwnerTaxYear')}</p>
        <button
          type="button"
          onClick={() => navigate('/dashboard/taxiq')}
          className="rounded-lg bg-nexoraBrand px-4 py-2 text-xs font-bold text-white"
        >
          {t('taxiq.deductionCenter.goToSetup')}
        </button>
      </div>
    )
  }

  return <YearEndExportView ownerTaxYear={ownerTaxYear} />
}

export function SupportRoute() {
  return <SupportView />
}

export function PackageManagementRoute() {
  return <PackageManagementView />
}

export function PackageBillingDetailRoute() {
  return <PackageBillingDetailView />
}

export function SubscriptionsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    tipPlatformSubscription,
    currentPeriodInMonths,
    packages,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice,
    checkoutBillingCycle,
    clearCheckout,
    handleSelectPlan,
    storeSetupGateOpen,
    closeStoreSetupGate,
  } = useTipPlatformCheckoutFlow({
    profile: ctx?.profile,
    searchParams,
    setSearchParams,
    packagesEnabled: true,
    deepLinkEnabled: true,
  })

  return (
    <>
      <ManagePlanView
        currentSubscription={tipPlatformSubscription}
        currentPeriodInMonths={currentPeriodInMonths}
        packages={packages}
        onSelectPlan={handleSelectPlan}
      />
      <TipPlatformCheckoutModal
        paymentPlan={paymentPlan}
        selectedPackage={selectedPackage}
        paymentPlanPrice={paymentPlanPrice}
        billingCycle={checkoutBillingCycle}
        currentSubscription={tipPlatformSubscription}
        currentPeriodInMonths={currentPeriodInMonths}
        catalogPackages={packages}
        onClose={clearCheckout}
      />
      <CompleteStoreSetupGateModal
        open={storeSetupGateOpen}
        onClose={closeStoreSetupGate}
      />
    </>
  )
}

export function FallbackRoute() {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()
  return <ComingSoon activeMenu={currentPath} onBack={() => navigate('/dashboard')} />
}
