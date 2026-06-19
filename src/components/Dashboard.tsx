import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'

// 2. Third-party
import { Filter, Moon, Settings, ShieldAlert, Sun, Check, Link } from 'lucide-react'

// 3. Internal — utils → contexts → data/constants → hooks → layout → views → modals → ui
import { logger } from '../utils/logger'
import { resolveMerchantStaffTipQr, toLocalCustomerTouchUrl } from '../utils/staffTipUrl'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { DEFAULT_PAYOUT_CONFIGS, MENU_ITEMS } from './dashboard/constants'
import { slugify, getPayoutConfigsFromMember } from './dashboard/utils'
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation'
import { useDevices } from './dashboard/hooks/useDevices'
import { useKybGate } from '../contexts/KybGateContext'
import { useStaffManagement } from './dashboard/hooks/useStaffManagement'
import { useTouchpoints, useCreateTouchpoint, useDeleteTouchpoint, useToggleTouchpoint, useDownloadTouchpointQr } from '../data/hooks/useMerchantTouchpoints'
import { useMerchantStaff, StatusFilter } from '../data/hooks/useMerchantStaff'
import { useChartDateRange } from '../hooks/useChartDateRange'
import { useTransactions } from '../data/hooks/useTransactions'
import { useDashboardOverview, useDashboardTipsChart, useDashboardOverviewCurrentMonth, useDashboardOverviewCurrentYear } from '../data/hooks/useDashboard'
import { useDashboardReviews, DASHBOARD_REVIEWS_LIST_QUERY } from '../data/hooks/useReviews'
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useUnreadCount } from '../data/hooks/useNotifications'
import { useProfileSettings, useSaveProfileSettings } from '../data/hooks/useProfileSettings'
import { useMerchantSetup, useSaveMerchantSetup } from '../data/hooks/useMerchantSetup'
import { useMerchantInviteLinkSetting } from '../data/hooks/useMerchantSettings'
import DashboardHeader from './dashboard/layout/DashboardHeader'
import DashboardSidebar from './dashboard/layout/DashboardSidebar'
import MobileMenuDrawer from './dashboard/layout/MobileMenuDrawer'
import MobileBottomNav from './dashboard/layout/MobileBottomNav'
import Overview from './dashboard/overview/Overview'
import StaffView from './dashboard/views/StaffView'
import ReviewsView from './dashboard/views/ReviewsView'
import ReportsView from './dashboard/views/ReportsView'
import ComingSoon from './dashboard/views/ComingSoon'
import AnalyticsView from './AnalyticsView'
import SettingsView from './SettingsView'
import SupportView from './SupportView'
import TipsView from './TipsView'
import TouchpointsView from './TouchpointsView'
import StaffDetailView from './StaffDetailView'
import StaffModal from './dashboard/modals/StaffModal'
import QrModal from './dashboard/modals/QrModal'
import InviteShareModal from './dashboard/modals/InviteShareModal'
import AddTouchpointModal from './dashboard/modals/AddTouchpointModal'
import { usePagination } from '../hooks/usePagination'
import { DEFAULT_PAGE_SIZE, STAFF_FILTER_LIST_PAGE_SIZE } from '../constants/pagination'


export default function Dashboard({
  setupData = null,
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved',
  userEmail = '',
  onKybSuccess = () => {},
  initialMenu = 'overview',
  initialSettingsTab = 'profile',
  onLogout,
  userRole = 'owner',
  currentStaffId = null,
  onStartSetup = null,
}) {
  const { currentLanguage, t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const { requireKyb } = useKybGate()
  const {
    activeMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    touchpointsTab, setTouchpointsTab,
    isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    handleNavigateMenu, navigateMenu
  } = useDashboardNavigation()
  const navigate = useNavigate()
  const handleStartSetup = useCallback(() => {
    if (typeof onStartSetup === 'function') {
      onStartSetup()
      return
    }

    navigate('/onboarding')
  }, [navigate, onStartSetup])
  const [processingFee, setProcessingFee] = useState(3.0)
  const [isNotiDropdownOpen, setIsNotiDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [reviewsPageNumber, setReviewsPageNumber] = useState(1)

  const hasSearchQuery = Boolean(searchQuery.trim())
  const needsMerchantStaffList =
    hasSearchQuery ||
    ['staff', 'reviews', 'reports', 'tips', 'analytics'].includes(activeMenu)
  const needsNotificationsList = isNotiDropdownOpen
  const needsTransactions =
    hasSearchQuery ||
    ['tips', 'reports', 'analytics'].includes(activeMenu)
  const needsDashboardReviews =
    activeMenu === 'overview' ||
    activeMenu === 'reviews' ||
    hasSearchQuery ||
    activeMenu === 'staff'
  const needsInviteLink = activeMenu === 'staff'
  const isStaffTab = activeMenu === 'staff'
  const isReviewsTab = activeMenu === 'reviews'
  const isTouchpointsTab = activeMenu === 'touchpoints'
  const staffPagination = usePagination({ pageSize: DEFAULT_PAGE_SIZE })
  const reviewsPagination = usePagination({ pageSize: DEFAULT_PAGE_SIZE })

  useEffect(() => {
    if (!isStaffTab) staffPagination.reset()
  }, [isStaffTab, staffPagination.reset])

  useEffect(() => {
    if (!isReviewsTab) reviewsPagination.reset()
  }, [isReviewsTab, reviewsPagination.reset])

  const reviewsListQuery = useMemo(
    () => ({
      pageNumber: isReviewsTab ? reviewsPagination.pageNumber : 1,
      pageSize: isReviewsTab ? reviewsPagination.pageSize : DASHBOARD_REVIEWS_LIST_QUERY.pageSize,
    }),
    [isReviewsTab, reviewsPagination.pageNumber, reviewsPagination.pageSize],
  )

  const needsTouchpointsList =
    (activeMenu === 'overview' || hasSearchQuery) && !isTouchpointsTab

  const touchpointsListQuery = useMemo(() => {
    const trimmedName = searchQuery.trim()
    return {
      PageNumber: 1,
      PageSize: STAFF_FILTER_LIST_PAGE_SIZE,
      ...(trimmedName ? { Name: trimmedName } : {}),
    }
  }, [searchQuery])

  // ---------------------------------------------------------------------------
  // Server-state hooks (TanStack Query) — lazy per active tab where possible
  // ---------------------------------------------------------------------------
  const { data: transactionsData, isLoading: isTransactionsLoading } = useTransactions({
    enabled: needsTransactions,
  })
  const {
    data: reviewsPage,
    isPending: isReviewsPending,
    isFetching: isReviewsFetching,
  } = useDashboardReviews(reviewsListQuery, { enabled: needsDashboardReviews })
  const { data: apiUnreadCount = 0 } = useUnreadCount()
  const { data: notificationsData, isLoading: isNotificationsLoading, isFetching: isNotificationsFetching } = useNotifications({
    enabled: needsNotificationsList,
  })
  const { data: profileSettingsData } = useProfileSettings()
  const { data: merchantSetupData } = useMerchantSetup()
  const { data: merchantStaffData, isLoading: isStaffLoading, isFetching: isStaffFetching } = useMerchantStaff({
    enabled: needsMerchantStaffList,
    pageNumber: isStaffTab ? staffPagination.pageNumber : 1,
    pageSize: isStaffTab ? staffPagination.pageSize : STAFF_FILTER_LIST_PAGE_SIZE,
  })
  const { data: pendingStaffPage } = useMerchantStaff({
    enabled: isStaffTab,
    statusFilter: StatusFilter.Pending,
    pageNumber: 1,
    pageSize: 50,
  })
  const {
    data: inviteLinkSetting,
    isLoading: isInviteLinkSettingLoading,
  } = useMerchantInviteLinkSetting({ enabled: userRole === 'owner' && needsInviteLink })

  const markNotificationReadMutation = useMarkNotificationRead()
  const markAllNotificationsReadMutation = useMarkAllNotificationsRead()
  const saveMerchantSetupMutation = useSaveMerchantSetup()

  // ---------------------------------------------------------------------------
  // Derived read data (with fallbacks so UI is never empty on first load)
  // ---------------------------------------------------------------------------
  const transactions = transactionsData ?? []
  const reviews = reviewsPage?.items ?? []

  // Notifications — thin local mirror so UI updates optimistically.
  // Server-generated notifications come from GET /api/v1/notifications.
  const [notifications, setNotifications] = useState(() => notificationsData ?? [])

  // Keep local notification mirror in sync when query data arrives / changes
  // (e.g. bridge-triggered refetch after a cross-tab update).
  useEffect(() => {
    if (notificationsData === undefined) return
    setNotifications(notificationsData)
  }, [notificationsData])

  const unreadCount = notifications.length > 0
    ? notifications.filter((n) => !n.read).length
    : apiUnreadCount

  // Profile — thin local mirror with complex initialisation / override rules.
  const buildFallbackProfile = (storeInfo, reviewInfo) => ({
    fullName: storeInfo?.ownerName || '',
    email: storeInfo?.businessEmail || userEmail || '',
    avatar: storeInfo?.logo || null,
    businessName: storeInfo?.name || '',
    businessPhone: storeInfo?.phone || '',
    businessWebsite: storeInfo?.website || '',
    street: storeInfo?.address || '',
    googleReview: reviewInfo?.googleReview || '',
    yelpReview: reviewInfo?.yelpReview || '',
    paymentAccounts: storeInfo?.paymentAccounts || {
      zelle: '',
      bankwire: '',
      paypal: '',
      venmo: '',
      cashapp: '',
      applecash: '',
      vlinkpay: ''
    }
  })

  const businessLogo = merchantSetupData?.businessInfo?.logo || setupData?.businessInfo?.logo || null

  const [profile, setProfile] = useState(() => {
    // Prefer saved profile settings, fall back to business info from setupData.
    if (profileSettingsData) return { ...profileSettingsData, avatar: profileSettingsData.avatar || businessLogo }
    const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
    const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
    return buildFallbackProfile(storeInfo, reviewInfo)
  })

  // Sync profile when query data arrives (bridge-triggered refetch).
  useEffect(() => {
    if (profileSettingsData) {
      if (!hasKyb && verificationStatus !== 'basic') {
        setProfile({
          ...profileSettingsData,
          avatar: profileSettingsData.avatar || businessLogo,
          fullName: '',
          email: userEmail || '',
          businessName: '',
          paymentAccounts: {
            zelle: '', bankwire: '', paypal: '',
            venmo: '', cashapp: '', applecash: '', vlinkpay: ''
          }
        })
      } else {
        setProfile({ ...profileSettingsData, avatar: profileSettingsData.avatar || businessLogo })
      }
    } else {
      // No saved settings — build from setup data / merchant setup query.
      const storeInfo = setupData?.businessInfo || merchantSetupData?.businessInfo
      const reviewInfo = setupData?.reviewLinks || merchantSetupData?.reviewLinks
      setProfile((prev) => ({
        ...buildFallbackProfile(storeInfo, reviewInfo),
        subscription: prev?.subscription ?? null,
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileSettingsData, hasKyb, userEmail, verificationStatus, businessLogo])

  // Use API hooks for Touchpoints
  const {
    data: touchpointsData,
    isLoading: isTouchpointsLoading,
  } = useTouchpoints(touchpointsListQuery, { enabled: needsTouchpointsList })
  const touchpoints = touchpointsData?.items || []
  const createTouchpointMutation = useCreateTouchpoint()
  const deleteTouchpointMutation = useDeleteTouchpoint()
  const toggleTouchpointMutation = useToggleTouchpoint()

  const { devices, setDevices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus } = useDevices()
  const [qrTarget, setQrTarget] = useState<any | null>(null)
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const handleReviewFilterStaffChange = useCallback((value) => {
    setReviewFilterStaff(value)
    reviewsPagination.setPage(1)
  }, [reviewsPagination.setPage])
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
  const [isAddTouchpointModalOpen, setIsAddTouchpointModalOpen] = useState(false)
  const [addTouchpointPrefill, setAddTouchpointPrefill] = useState<any | null>(null)
  const [activeKpi, setActiveKpi] = useState('tips')
  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } = useChartDateRange(transactions)

  const { data: overviewMetricsData, isLoading: isOverviewApiLoading } = useDashboardOverview({
    startDate: chartStartDate,
    endDate: chartEndDate,
  })
  const { data: metricsMonthData } = useDashboardOverviewCurrentMonth()
  const { data: metricsYearData } = useDashboardOverviewCurrentYear()

  const { data: tipsChartData, isLoading: isTipsChartLoading } = useDashboardTipsChart({
    startDate: chartStartDate,
    endDate: chartEndDate,
  })

  const isOverviewLoading = isOverviewApiLoading || (needsTransactions && isTransactionsLoading)

  const [selectedLeaderboardStaff, setSelectedLeaderboardStaff] = useState<any | null>(null)

  const businessName = profile?.businessName || setupData?.businessInfo?.name || merchantSetupData?.businessInfo?.name || ''
  const userSubscription = profileSettingsData?.subscription ?? profile?.subscription ?? null
  const businessSlug =
    merchantSetupData?.businessInfo?.slug ||
    setupData?.businessInfo?.slug ||
    slugify(businessName || 'business')

  const {
    staff,
    isStaffLoading: staffLoading,
    staffForm, setStaffForm,
    errors, setErrors,
    editingStaffId, setEditingStaffId,
    isStaffModalOpen, setIsStaffModalOpen,
    isApproveModalOpen, setIsApproveModalOpen,
    approvingStaffMember, setApprovingStaffMember,
    isInviteShareOpen, setIsInviteShareOpen,
    inviteShareDefaultName, setInviteShareDefaultName,
    inviteShareDefaultContact, setInviteShareDefaultContact,
    resetStaffForm, openAddStaff, openApproveStaff, openEditStaff, closeStaffModal,
    saveStaff, sendSetupLinkFromModal, handleLinkStaff, handleInviteStaff,
    handleResendInvite,
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    inviteStaffMutation,
  } = useStaffManagement({ staffData: merchantStaffData, isStaffLoading, businessName })

  // Sync touchpoints removed (now handled by React Query cache)

  // Define hasSetup state
  const hasSetup = !!(merchantSetupData || setupData)

  // For staff dashboard: populate profile info from their staff profile.
  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && staff.length > 0) {
      const currentStaff = staff.find(s => s.id === currentStaffId)
      if (currentStaff) {
        setProfile({
          fullName: currentStaff.fullName,
          email: currentStaff.email,
          avatar: currentStaff.avatar || null,
          businessName: businessName,
          businessPhone: currentStaff.phone || '',
          businessWebsite: '',
          street: '',
          googleReview: '',
          yelpReview: '',
          paymentAccounts: currentStaff.paymentAccounts || {
            zelle: '',
            bankwire: '',
            paypal: '',
            venmo: '',
            cashapp: '',
            applecash: '',
            vlinkpay: ''
          }
        })
      }
    }
  }, [userRole, currentStaffId, staff, businessName])

  const menuItemsToDisplay = userRole === 'staff'
    ? [
        { id: 'overview', label: t('components.dashboardRoot.myDashboard'), icon: MENU_ITEMS.find(i => i.id === 'overview')?.icon, image: MENU_ITEMS.find(i => i.id === 'overview')?.image },
        { id: 'support', label: t('dashboard.menu.support'), icon: MENU_ITEMS.find(i => i.id === 'support')?.icon }
      ]
    : MENU_ITEMS

  // Filter lists based on searchQuery
  const filteredStaff = useMemo(() => {
    const isPendingRequest = (member) => 
      (member.status === 'Pending Acceptance' || member.status === 'Pending') && 
      (member.itemType === 'link' || member.itemType === 'invite')
      
    const visibleStaff = staff.filter(member => !isPendingRequest(member))
    
    if (!searchQuery) return visibleStaff
    const query = searchQuery.toLowerCase().trim()
    return visibleStaff.filter(member =>
      member.fullName?.toLowerCase().includes(query) ||
      (member.nickname && member.nickname.toLowerCase().includes(query)) ||
      member.position?.toLowerCase().includes(query)
    )
  }, [staff, searchQuery])

  const pendingStaff = useMemo(() => {
    const source = isStaffTab ? (pendingStaffPage?.items ?? []) : staff
    return source.filter((member) =>
      (member.status === 'Pending Acceptance' || member.status === 'Pending' || member.status === 'Pending Setup') &&
      (member.itemType === 'link' || member.itemType === 'invite')
    )
  }, [isStaffTab, pendingStaffPage, staff])

  const filteredTouchpoints = touchpoints

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase().trim()
    return reviews.filter(rev =>
      String(rev.comment ?? '').toLowerCase().includes(query) ||
      String(rev.staffName ?? '').toLowerCase().includes(query) ||
      String(rev.category ?? '').toLowerCase().includes(query) ||
      String(rev.rating).includes(query)
    )
  }, [reviews, searchQuery])

  const filteredTransactions = useMemo(() => {
    if (!searchQuery) return transactions
    const query = searchQuery.toLowerCase().trim()
    return transactions.filter(tx =>
      tx.id.toLowerCase().includes(query) ||
      tx.staffName.toLowerCase().includes(query) ||
      tx.touchpoint.toLowerCase().includes(query) ||
      tx.paymentMethod.toLowerCase().includes(query) ||
      tx.status.toLowerCase().includes(query) ||
      String(tx.amount).includes(query)
    )
  }, [transactions, searchQuery])

  const emptyOverviewMetrics = {
    totalTips: 0,
    totalTransactions: 0,
    averageTip: 0,
    totalReviews: 0,
    scans: 0,
    conversionRate: 0,
    averageRating: 0,
    googleClicks: 0,
    yelpClicks: 0,
    count4To5Stars: 0,
    count1To3Stars: 0,
    responseRate: 0,
    responseRateLabel: null,
    googleAvgRating: null,
    googleReviewCount: null,
    yelpAvgRating: null,
    yelpReviewCount: null,
    returningCustomerRate: 0,
    returningCustomerRateChangeVsLastWeek: 0,
    previousPeriodComparison: null,
  }

  const metrics = useMemo(() => {
    if (!overviewMetricsData) {
      return emptyOverviewMetrics
    }

    return overviewMetricsData
  }, [overviewMetricsData])

  const kpiDeltas = useMemo(() => ({
    totalTips: metrics.previousPeriodComparison,
    totalTransactions: null,
    averageTip: null,
    totalReviews: null,
  }), [metrics.previousPeriodComparison]);


  const addTouchpoint = async (name, type, deviceId) => {
    const finalName = typeof name === 'string' ? name.trim() : (newTouchpoint.name || '').trim()
    const finalType = typeof type === 'string' ? type : (newTouchpoint.type || 'Table QR')
    const finalDeviceId = typeof deviceId === 'string' ? deviceId.trim() : ''

    if (!finalName) return

    await createTouchpointMutation.mutateAsync({
      name: finalName,
      type: finalType === 'Table QR' ? 'Table' : finalType === 'Front Desk' ? 'FrontDesk' : finalType === 'Receipt QR' ? 'Receipt' : finalType === 'Staff QR' ? 'StaffCard' : 'Table',
      // If we supported hardware linkage, we would map finalDeviceId here.
    })
    
    setNewTouchpoint({ name: '', type: 'Table QR' })
  }

  const linkDevice = (id, deviceId) => {
    // API not yet supported for device linking in touchpoints
  }

  const toggleTouchpointStatus = (id) => {
    if (toggleTouchpointMutation.isPending) return
    toggleTouchpointMutation.mutate(id)
  }

  const deleteTouchpoint = (id) => {
    deleteTouchpointMutation.mutate(id)
  }

  const previewQr = (target) => {
    const staffName = target.nickname || target.fullName
    const masterTouchpoint =
      touchpoints.find((tp) => tp.type === 'FrontDesk') || touchpoints[0] || null

    // Staff personal QR → master touch URL + ?staffProfileId=… (skip staff picker).
    const staffTipQr = resolveMerchantStaffTipQr(target.staffProfileId, {
      businessName,
      masterTouchpoint,
    })
    if (staffTipQr?.tipUrl) {
      setQrTarget({
        name: target.name || `Personal QR - ${staffName}`,
        subtitle: target.position || 'Staff QR',
        slug: staffTipQr.touchPointSlug,
        url: staffTipQr.tipUrl,
        qrImageUrl: target.qrImageUrl || staffTipQr.qrImageUrl || null,
        isActive: target.isActive !== undefined ? target.isActive : true,
        isStaffQr: true,
      })
      return
    }

    const finalSlug = target.slug
      ? target.slug
      : (staffName ? `staff-${slugify(staffName)}` : slugify(target.name || target.id || 'general'))

    setQrTarget({
      name: target.name || `Personal QR - ${staffName}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: finalSlug,
      url: target.url ? toLocalCustomerTouchUrl(target.url) : null,
      qrImageUrl: target.qrImageUrl || null,
      isActive: target.isActive !== undefined ? target.isActive : true,
      isStaffQr: Boolean(staffName && target.staffProfileId),
    })
  }

  const handleSelectLeaderboardStaff = (staffKey) => {
    setSelectedLeaderboardStaff(staffKey)
    if (!staffKey) return

    const member = staff.find((s) =>
      String(s.id) === String(staffKey) ||
      String(s.staffProfileId) === String(staffKey) ||
      s.nickname === staffKey ||
      s.fullName?.toLowerCase().includes(String(staffKey).toLowerCase().split(' ')[0])
    )
    navigate(`/dashboard/staff/${member?.id || staffKey}`)
  }

  // ---------------------------------------------------------------------------
  // Notification handlers — write via mutations; update local mirror optimistically
  // ---------------------------------------------------------------------------
  const handleSetNotifications = (updater) => {
    const next = typeof updater === 'function' ? updater(notifications) : updater
    // Persist read-state transitions to the API (PUT /notifications/{id}/read).
    next.forEach((n) => {
      const prev = notifications.find((p) => p.id === n.id)
      const nowRead = Boolean(n.read || n.isRead)
      const wasRead = Boolean(prev && (prev.read || prev.isRead))
      if (prev && nowRead && !wasRead) {
        markNotificationReadMutation.mutate(n.id)
      }
    })
    setNotifications(next)
  }

  const handleMarkAllNotificationsRead = () => {
    const hasUnread = notifications.some((n) => !n.read && !n.isRead)
    if (!hasUnread || markAllNotificationsReadMutation.isPending) return
    markAllNotificationsReadMutation.mutate()
    setNotifications((current) =>
      current.map((n) => ({ ...n, read: true, isRead: true })),
    )
  }

  const dashboardCtx = {
    profile, onNavigateMenu: handleNavigateMenu,
    metrics, tipsChartData, activeKpi, setActiveKpi, chartRange, handleChartRangeChange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate,
    metricsMonth: metricsMonthData ?? null,
    metricsYear: metricsYearData ?? null,
    kpiDeltas,
    transactions, selectedLeaderboardStaff, handleSelectLeaderboardStaff, businessName, businessSlug, previewQr, hasKyb, hasSetup, onStartSetup: handleStartSetup,
    isOverviewLoading, isTransactionsLoading, isTouchpointsLoading,
    reviewsPage, isReviewsPending,
    inviteLinkSetting, isInviteLinkSettingLoading,
    filteredStaff, pendingStaff, staff, staffLoading, openApproveStaff, openAddStaff, openEditStaff, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleLinkStaff, handleInviteStaff, handleResendInvite, handleAcceptJoinRequest, handleDeclineJoinRequest, handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    setInviteShareDefaultName, setInviteShareDefaultContact, setIsInviteShareOpen,
    filteredTouchpoints, setAddTouchpointPrefill, setIsAddTouchpointModalOpen, deleteTouchpoint, toggleTouchpointStatus, togglingTouchpointId: toggleTouchpointMutation.isPending ? toggleTouchpointMutation.variables : null, linkDevice, devices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus,
    reviews, filteredReviews, reviewFilterStaff, setReviewFilterStaff: handleReviewFilterStaffChange, setupData: setupData ?? merchantSetupData,
    activeReviewsPage: reviewsPagination.pageNumber,
    activeReviewsPageSize: reviewsPagination.pageSize,
    activeReviewsTotalPages: reviewsPage?.totalPages ?? 1,
    activeReviewsTotalCount: reviewsPage?.totalCount ?? 0,
    activeReviewsHasNext: reviewsPage?.hasNextPage ?? false,
    activeReviewsHasPrev: reviewsPage?.hasPreviousPage ?? false,
    setActiveReviewsPage: reviewsPagination.setPage,
    reviewsListFetching: isReviewsFetching,
    tipsTab, setTipsTab, processingFee, setProcessingFee,
    filteredTransactions, touchpoints,
    verificationStatus, requireKyb, userEmail, onKybSuccess, settingsTab, setSettingsTab,
    currentStaffId,
    activeStaffPage: staffPagination.pageNumber,
    activeStaffPageSize: staffPagination.pageSize,
    activeStaffTotalPages: merchantStaffData?.totalPages ?? 1,
    activeStaffTotalCount: merchantStaffData?.totalCount ?? 0,
    activeStaffHasNext: merchantStaffData?.hasNextPage ?? false,
    activeStaffHasPrev: merchantStaffData?.hasPreviousPage ?? false,
    setActiveStaffPage: staffPagination.setPage,
    staffListLoading: isStaffLoading,
    staffListFetching: isStaffFetching,
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas font-sans text-nexoraText">
      <DashboardSidebar
        activeMenu={activeMenu}
        setActiveMenu={handleNavigateMenu}
        businessName={businessName}
        profile={profile}
        subscription={userSubscription}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        hasKyb={hasKyb}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onLogout={onLogout}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        touchpointsTab={touchpointsTab}
        setTouchpointsTab={setTouchpointsTab}
        userRole={userRole}
      />

      <div className="lg:pl-72">
        <DashboardHeader
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onAddTouchpoint={() => {
            setAddTouchpointPrefill(null)
            setIsAddTouchpointModalOpen(true)
          }}
          profile={profile}
          businessName={businessName}
          onNavigateSettingsTab={(tab) => {
            handleNavigateMenu('settings')
            setSettingsTab(tab)
          }}
          onLogout={onLogout}
          notifications={notificationsData ?? notifications}
          setNotifications={handleSetNotifications}
          onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
          isMarkAllNotificationsReadPending={markAllNotificationsReadMutation.isPending}
          unreadCount={unreadCount}
          isNotiDropdownOpen={isNotiDropdownOpen}
          setIsNotiDropdownOpen={setIsNotiDropdownOpen}
          isNotificationsLoading={isNotificationsLoading || isNotificationsFetching}
          onNavigateMenu={handleNavigateMenu}
          staff={staff}
          transactions={transactions}
          reviews={reviews}
          touchpoints={touchpoints}
          onViewStaffDetail={(id) => navigate(`/dashboard/staff/${id}`)}
          onApproveStaff={openApproveStaff}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="min-h-dvh p-4 pb-24 sm:p-6 sm:pb-24 lg:p-7 lg:pb-7">
          {activeMenu !== 'overview' && (
            <button
              onClick={() => handleNavigateMenu('overview')}
              className="mb-5 inline-flex h-9 items-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-extrabold text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            >
              {t('dashboard.back_to_dashboard')}
            </button>
          )}
          <Outlet context={dashboardCtx} />
        </main>
      </div>

      <button
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="fixed bottom-4 right-4 z-40 hidden lg:flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraSurface text-nexoraMuted shadow-lg"
        title="Toggle theme hook"
        aria-label="Toggle theme hook"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </button>

      <MobileBottomNav activeMenu={activeMenu} onNavigate={handleNavigateMenu} />

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        subscription={userSubscription}
        businessName={businessName}
        activeMenu={activeMenu}
        setActiveMenu={handleNavigateMenu}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        tipsTab={tipsTab}
        setTipsTab={setTipsTab}
        touchpointsTab={touchpointsTab}
        setTouchpointsTab={setTouchpointsTab}
        isTipsMobileExpanded={isTipsMobileExpanded}
        setIsTipsMobileExpanded={setIsTipsMobileExpanded}
        isTouchpointsMobileExpanded={isTouchpointsMobileExpanded}
        setIsTouchpointsMobileExpanded={setIsTouchpointsMobileExpanded}
        hasKyb={hasKyb}
        userRole={userRole}
        onLogout={onLogout}
        menuItemsToDisplay={menuItemsToDisplay}
        navigateMenu={navigateMenu}
      />

      <StaffModal
        open={isStaffModalOpen}
        editing={Boolean(editingStaffId)}
        onDecline={closeStaffModal}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onClose={closeStaffModal}
        onSave={saveStaff}
        onLinkStaff={handleLinkStaff}
        onOpenInviteShare={(formDetails) => {
          setInviteShareDefaultName(formDetails.fullName || '')
          setInviteShareDefaultContact(formDetails.email || formDetails.phone || '')
          setIsInviteShareOpen(true)
        }}
        reviews={reviews}
        merchantSetupData={merchantSetupData}
      />

      <StaffModal
        open={isApproveModalOpen}
        editing={false}
        isApproveMode={true}
        onDecline={() => {
          if (approvingStaffMember) {
            handleDeclineJoinRequest(approvingStaffMember)
          }
          setIsApproveModalOpen(false)
        }}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={requireKyb}
        onClose={() => {
          setIsApproveModalOpen(false)
          resetStaffForm()
        }}
        onSave={() => {
          if (approvingStaffMember) {
            handleAcceptJoinRequest(approvingStaffMember)
          }
          setIsApproveModalOpen(false)
        }}
        onOpenInviteShare={() => {}}
        reviews={reviews}
        merchantSetupData={merchantSetupData}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />

      <AddTouchpointModal
        open={isAddTouchpointModalOpen}
        initialValues={addTouchpointPrefill}
        onClose={() => setIsAddTouchpointModalOpen(false)}
        onAdd={async (name, type, deviceId) => {
          await addTouchpoint(name, type, deviceId)
          handleNavigateMenu('touchpoints')
          setTouchpointsTab('stations')
        }}
      />

      <InviteShareModal
        open={isInviteShareOpen}
        businessName={businessName}
        businessSlug={businessSlug}
        inviteLinkSetting={inviteLinkSetting}
        isInviteLinkSettingLoading={isInviteLinkSettingLoading}
        defaultName={inviteShareDefaultName}
        defaultContact={inviteShareDefaultContact}
        onClose={() => setIsInviteShareOpen(false)}
        onSendInvite={(name, contact, role) => {
          handleInviteStaff(name, contact, role)
          setIsInviteShareOpen(false)
          closeStaffModal()
        }}
      />
    </div>
  )
}
