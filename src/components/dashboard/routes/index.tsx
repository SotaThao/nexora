import React, { useEffect, useMemo, useRef, useState } from 'react'
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
import SubscriptionPaymentModal from '../modals/SubscriptionPaymentModal'
import type { PurchasableSubscriptionPlan } from '../../../data/repositories/subscriptionPayments'
import { useSubscriptionPackages } from '../../../data/hooks/useSubscriptionPayments'
import BookingHubView from '../views/BookingHubView'
import StaffDetailView from '../../StaffDetailView'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import { useOpenProductManagement } from '../../../data/hooks/useOpenProductManagement'
import { DASHBOARD_ROOT_PATH } from '../constants'
import { normaliseMember } from '../hooks/useStaffManagement'
import { SkeletonList } from '../../ui/skeleton'

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

export function SupportRoute() {
  return <SupportView />
}

function planIdToPurchasablePlan(planId: string): PurchasableSubscriptionPlan | null {
  if (planId === 'starter') return 'Starter'
  if (planId === 'pro') return 'Pro'
  return null
}

export function SubscriptionsRoute() {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const currentPlanId = ctx?.profile?.subscription?.packageCode ?? null
  const [paymentPlan, setPaymentPlan] = useState<PurchasableSubscriptionPlan | null>(null)
  const { data: packages = [] } = useSubscriptionPackages()
  const billingDefaults = useMemo(() => {
    const profile = ctx?.profile as LooseObject | undefined
    if (!profile) return undefined
    return {
      name: profile.fullName || [profile.firstName, profile.lastName].filter(Boolean).join(' '),
      email: profile.email,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zipCode: profile.zipCode,
      country: profile.country,
    }
  }, [ctx?.profile])

  useEffect(() => {
    const deepLinkPlan = planIdToPurchasablePlan(searchParams.get('plan') ?? '')
    if (deepLinkPlan) setPaymentPlan(deepLinkPlan)
  }, [searchParams])

  const selectedPackage = paymentPlan
    ? packages.find((p) => p.packageCode === paymentPlan.toLowerCase())
    : undefined
  const paymentPlanPrice = selectedPackage?.price ?? 0

  return (
    <>
      <ManagePlanView
        currentPlanId={currentPlanId}
        packages={packages}
        onSelectPlan={(planId) => {
          const purchasablePlan = planIdToPurchasablePlan(planId)
          if (purchasablePlan) {
            setPaymentPlan(purchasablePlan)
            return
          }
          navigate('/dashboard/support')
        }}
      />
      {paymentPlan && selectedPackage ? (
        <SubscriptionPaymentModal
          isOpen
          plan={paymentPlan}
          packageId={selectedPackage.id}
          price={paymentPlanPrice}
          billingDefaults={billingDefaults}
          onClose={() => setPaymentPlan(null)}
        />
      ) : null}
    </>
  )
}

export function FallbackRoute() {
  const navigate = useNavigate()
  const { '*': currentPath } = useParams()
  return <ComingSoon activeMenu={currentPath} onBack={() => navigate('/dashboard')} />
}
