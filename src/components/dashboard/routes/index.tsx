import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useOutletContext, useNavigate, useParams, Navigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from '../../../contexts/LanguageContext'
import { SHOW_HARDWARE_DEVICES } from '../constants'

import Overview from '../overview/Overview'
import StaffView from '../views/StaffView'
import TouchpointsView from '../../TouchpointsView'
import ReviewsView from '../views/ReviewsView'
import TipsView from '../../TipsView'
import ReportsView from '../views/ReportsView'
import SettingsView from '../../SettingsView'
import AnalyticsView from '../../AnalyticsView'
import SupportView from '../../SupportView'
import ComingSoon from '../views/ComingSoon'
import ManagePlanView from '../views/ManagePlanView'
import BookingHubView from '../views/BookingHubView'
import AiVoiceSetupGuideView from '../views/AiVoiceSetupGuideView'
import PackageManagementView from '../views/packageManagement/PackageManagementView'
import TipPlatformCheckoutModal from '../views/packageManagement/TipPlatformCheckoutModal'
import { useTipPlatformCheckoutFlow } from '../views/packageManagement/useTipPlatformCheckoutFlow'
import StaffDetailView from '../../StaffDetailView'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import { DASHBOARD_MENU_ID, DASHBOARD_ROOT_PATH } from '../constants'
import { normaliseMember } from '../hooks/useStaffManagement'
import { SkeletonList } from '../../ui/skeleton'
import { useMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useOwnerTaxYearByBusiness } from '../../../data/hooks/useTaxiqOwnerTaxYear'
import TaxIqOnboardingWizard from '../views/taxiq/TaxIqOnboardingWizard'
import TaxIqHomeView from '../views/taxiq/TaxIqHomeView'
import DeductionCenterView from '../views/taxiq/DeductionCenterView'
import OwnerIncomeSummaryListView from '../views/taxiq/OwnerIncomeSummaryListView'
import ReceiptVaultView from '../views/taxiq/ReceiptVaultView'
import AssetsTrackerView from '../views/taxiq/AssetsTrackerView'
import YearEndExportView from '../views/taxiq/YearEndExportView'
import TaxRemindersView from '../views/taxiq/TaxRemindersView'
import PayoutDisputeCenterView from '../views/taxiq/PayoutDisputeCenterView'
import CpaAccessSettingsView from '../views/taxiq/CpaAccessSettingsView'
import EmployerRegistryView from '../views/taxiq/EmployerRegistryView'
import PayEngineView from '../views/taxiq/PayEngineView'
import WeeklyPayrollView from '../views/taxiq/WeeklyPayrollView'
import PayrollRunsView from '../views/taxiq/PayrollRunsView'
import TaxLedgerView from '../views/taxiq/TaxLedgerView'
import ExceptionsQueueView from '../views/taxiq/ExceptionsQueueView'
import DataQualityCenterView from '../views/taxiq/DataQualityCenterView'
import JurisdictionsView from '../views/taxiq/JurisdictionsView'
import ShareLinksView from '../views/taxiq/ShareLinksView'
import Form1099NecView from '../views/taxiq/Form1099NecView'
import TipLedgerView from '../views/taxiq/TipLedgerView'
import FormsReportsView from '../views/taxiq/FormsReportsView'
import TaxEstimateView from '../views/taxiq/TaxEstimateView'
import PosGeneralSettingsView from '../views/pos/PosGeneralSettingsView'
import PosRolesView from '../views/pos/PosRolesView'
import PosCategoriesView from '../views/pos/PosCategoriesView'
import PosServicesView from '../views/pos/PosServicesView'
import PosProductsView from '../views/pos/PosProductsView'
import PosStaffProfileView from '../views/pos/PosStaffProfileView'
import PosFrontDeskView from '../views/pos/PosFrontDeskView'

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
      onOpenTouchpoints={() => navigate('/dashboard/touchpoints')}
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
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  return (
    <StaffView
      staff={ctx.filteredStaff}
      pendingStaff={ctx.pendingStaff}
      allStaff={ctx.staff}
      isLoading={ctx.staffListLoading ?? ctx.staffLoading}
      isFetching={ctx.staffListFetching}
      onApproveClick={ctx.openApproveStaff}
      onAdd={ctx.openAddStaff}
      onViewStaff={ctx.openViewStaff}
      onDelete={ctx.deleteStaff}
      onQr={ctx.previewQr}
      onToggle={ctx.toggleStaff}
      onToggleTipsFlow={ctx.toggleStaffTipsFlow}
      onViewDetail={(member) => navigate(`/dashboard/staff/${member.staffCode || member.id}`)}
      onResendInvite={ctx.handleResendInvite}
      businessName={ctx.businessName}
      businessSlug={ctx.businessSlug}
      inviteLinkSetting={ctx.inviteLinkSetting}
      isInviteLinkSettingLoading={ctx.isInviteLinkSettingLoading}
      onAcceptJoin={ctx.handleAcceptJoinRequest}
      onDeclineJoin={ctx.handleDeclineJoinRequest}
      onAcceptUnlink={ctx.handleAcceptUnlinkRequest}
      onDeclineUnlink={ctx.handleDeclineUnlinkRequest}
      onOpenInviteShare={() => {
        ctx.setInviteShareDefaultName('')
        ctx.setInviteShareDefaultContact('')
        ctx.setIsInviteShareOpen(true)
      }}
      // Pagination props
      pageNumber={ctx.activeStaffPage}
      pageSize={ctx.activeStaffPageSize}
      totalPages={ctx.activeStaffTotalPages}
      totalCount={ctx.activeStaffTotalCount}
      hasNextPage={ctx.activeStaffHasNext}
      hasPreviousPage={ctx.activeStaffHasPrev}
      onPageChange={ctx.setActiveStaffPage}
      togglingStaffId={ctx.togglingStaffId}
    />
  )
}

export function StaffDetailRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { staffId: staffKey } = useParams()
  const navigate = useNavigate()

  const {
    data: staffMember,
    isLoading: isStaffDetailLoading,
    isError: isStaffDetailError,
  } = useMerchantStaffByCode(staffKey)

  const fallbackMember = useMemo(
    () => ctx.staff.find((m) =>
      String(m.id) === String(staffKey) ||
      String(m.staffProfileId) === String(staffKey) ||
      String(m.staffCode) === String(staffKey) ||
      String(m.linkId) === String(staffKey),
    ),
    [ctx.staff, staffKey],
  )

  const resolvedMember = staffMember ?? fallbackMember
  const staffProfileId = resolvedMember?.staffProfileId ?? null

  if (isStaffDetailLoading || (!resolvedMember && ctx.staffLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} showAvatar lines={2} />
      </div>
    )
  }

  if ((isStaffDetailError && !fallbackMember) || !resolvedMember) {
    return <Navigate to="/dashboard/staff" replace />
  }

  return (
    <StaffDetailView
      staffMember={normaliseMember(resolvedMember)}
      staffProfileId={staffProfileId}
      onBack={null}
      onViewStaff={ctx.openViewStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
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
  const stationsSection = sp.get('section') === 'payment' ? 'payment' : 'tip'

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
          const section = sp.get('section') === 'payment' ? 'payment' : 'tip'
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

export function SettingsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { tab = 'profile' } = useParams()
  const navigate = useNavigate()

  return (
    <SettingsView
      {...({ onBlockedFeatureClick: ctx.requireKyb } as any)}
      setupData={ctx.setupData}
      hasKyb={ctx.hasKyb}
      verificationStatus={ctx.verificationStatus}
      userEmail={ctx.userEmail}
      onKybRequired={ctx.requireKyb}
      initialTab={tab}
      onTabChange={(nextTab) => navigate(`/dashboard/settings/${nextTab}`)}
      onKybSuccess={ctx.onKybSuccess}
    />
  )
}

// POS Owner Setup — sidebar group (US-014). Business Info and Business Hours
// are gated by the same KYB-editability rule as general Settings, so this
// screen takes verificationStatus from the same outlet context as
// SettingsRoute above. Business Hours was previously its own route
// (PosBusinessHoursRoute, /pos/business-hours) — merged into this screen.
export function PosGeneralSettingsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  return <PosGeneralSettingsView verificationStatus={ctx.verificationStatus} businessId={businessId} />
}

export function PosRolesRoute() {
  return <PosRolesView />
}

// Categories are catalog/menu data (not salon identity fields, no payment
// processing), so unlike PosGeneralSettingsRoute this route is not gated
// behind verificationStatus/KYB.
export function PosCategoriesRoute() {
  return <PosCategoriesView />
}

// Same rationale as PosCategoriesRoute — Services is catalog/menu data, not
// gated behind verificationStatus/KYB.
export function PosServicesRoute() {
  return <PosServicesView />
}

// Same rationale as PosCategoriesRoute/PosServicesRoute — Products is
// catalog/menu data, not gated behind verificationStatus/KYB.
export function PosProductsRoute() {
  return <PosProductsView />
}

// Staff profile (role/pay/tips/tax filing) is not salon identity data either —
// not gated behind verificationStatus/KYB, same rationale as the other POS catalog routes.
export function PosStaffProfileRoute() {
  return <PosStaffProfileView />
}

// Front Desk (Check-in queue / Turn Board / Checkout, US-12) — shared component
// with the Staff dashboard's salons/:businessId/front-desk route (see AppRouter.tsx).
// For the Owner, businessId always comes from their own merchant setup data.
export function PosFrontDeskRoute() {
  const { data: merchantSetupData } = useMerchantSetup()
  const businessId = merchantSetupData?.businessInfo?.businessId
  const businessName = merchantSetupData?.businessInfo?.name
  const businessSlug = merchantSetupData?.businessInfo?.slug
  if (!businessId) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} lines={1} />
      </div>
    )
  }
  return <PosFrontDeskView businessId={businessId} businessName={businessName} businessSlug={businessSlug} />
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

export function SubscriptionsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    tipPlatformSubscription,
    packages,
    billingDefaults,
    paymentPlan,
    selectedPackage,
    paymentPlanPrice,
    clearCheckout,
    handleSelectPlan,
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
        packages={packages}
        onSelectPlan={handleSelectPlan}
      />
      <TipPlatformCheckoutModal
        paymentPlan={paymentPlan}
        selectedPackage={selectedPackage}
        paymentPlanPrice={paymentPlanPrice}
        billingDefaults={billingDefaults}
        onClose={clearCheckout}
      />
    </>
  )
}

export function FallbackRoute() {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()
  return <ComingSoon activeMenu={currentPath} onBack={() => navigate('/dashboard')} />
}
