// 1. React
import React, { useEffect, useMemo, useRef, useState } from 'react'

// 2. Third-party
import { Filter, Moon, Settings, ShieldAlert, Sun, Check, Link } from 'lucide-react'

// 3. Internal — utils → contexts → data/constants → hooks → layout → views → modals → ui
import { logger } from '../utils/logger'
import { storage } from '../utils/storage'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { INITIAL_TRANSACTIONS, INITIAL_REVIEWS, INITIAL_TOUCHPOINTS, STAFF_PERFORMANCE } from './dashboard/data/mockData'
import { DEFAULT_PAYOUT_CONFIGS, MENU_ITEMS } from './dashboard/constants'
import { slugify, getPayoutConfigsFromMember } from './dashboard/utils'
import { useDashboardNavigation } from './dashboard/hooks/useDashboardNavigation'
import { useDevices } from './dashboard/hooks/useDevices'
import { useStaffManagement } from './dashboard/hooks/useStaffManagement'
import { useChartDateRange } from '../hooks/useChartDateRange'
import DashboardHeader from './dashboard/layout/DashboardHeader'
import DashboardSidebar from './dashboard/layout/DashboardSidebar'
import MobileMenuDrawer from './dashboard/layout/MobileMenuDrawer'
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

// Storage aliases (const declarations must follow all imports)
const localStorage = storage
const sessionStorage = storage

const areStaffListsEqual = (list1, list2) => {
  if (!list1 || !list2) return list1 === list2
  if (list1.length !== list2.length) return false
  
  for (let i = 0; i < list1.length; i++) {
    const s1 = list1[i]
    const s2 = list2[i]
    if (!s1 || !s2) return s1 === s2
    if (s1.id !== s2.id) return false
    if (s1.fullName !== s2.fullName) return false
    if (s1.nickname !== s2.nickname) return false
    if (s1.position !== s2.position) return false
    if ((s1.avatar || '') !== (s2.avatar || '')) return false
    if ((s1.phone || '') !== (s2.phone || '')) return false
    if ((s1.email || '') !== (s2.email || '')) return false
    if ((s1.bio || '') !== (s2.bio || '')) return false
    if ((s1.status || 'Active') !== (s2.status || 'Active')) return false
    if ((s1.flowType || '') !== (s2.flowType || '')) return false
    if ((s1.isActive !== undefined ? s1.isActive : true) !== (s2.isActive !== undefined ? s2.isActive : true)) return false
    if ((s1.showInTipsFlow !== undefined ? s1.showInTipsFlow : true) !== (s2.showInTipsFlow !== undefined ? s2.showInTipsFlow : true)) return false
    
    // Compare payment accounts
    const pa1 = s1.paymentAccounts || {}
    const pa2 = s2.paymentAccounts || {}
    const keys = ['venmo', 'cashapp', 'zelle', 'vlinkpay', 'paypal', 'bankwire', 'applecash']
    for (const key of keys) {
      if ((pa1[key] || '') !== (pa2[key] || '')) return false
    }
  }
  return true
}

const areTouchpointsEqual = (list1, list2) => {
  if (!list1 || !list2) return list1 === list2
  if (list1.length !== list2.length) return false
  
  for (let i = 0; i < list1.length; i++) {
    const t1 = list1[i]
    const t2 = list2[i]
    if (!t1 || !t2) return t1 === t2
    if (t1.id !== t2.id) return false
    if ((t1.name || '') !== (t2.name || '')) return false
    if ((t1.type || '') !== (t2.type || '')) return false
    if ((t1.deviceId || '') !== (t2.deviceId || '')) return false
    if ((t1.isActive !== undefined ? t1.isActive : true) !== (t2.isActive !== undefined ? t2.isActive : true)) return false
    if ((t1.scans || 0) !== (t2.scans || 0)) return false
    if ((t1.staffId || '') !== (t2.staffId || '')) return false
  }
  return true
}

export default function Dashboard({ 
  setupData, 
  verificationStatus = 'kyb_approved',
  hasKyb = verificationStatus === 'kyb_approved', 
  userEmail = '', 
  onKybRequired, 
  onKybSuccess, 
  initialMenu = 'overview', 
  initialSettingsTab = 'profile', 
  onLogout,
  userRole = 'owner',
  currentStaffId = null
}) {
  const { currentLanguage, t } = useTranslation()
  const { showToast, showConfirm } = useNotification()
  const {
    activeMenu, setActiveMenu,
    isMobileMenuOpen, setIsMobileMenuOpen,
    tipsTab, setTipsTab,
    isTipsMobileExpanded, setIsTipsMobileExpanded,
    touchpointsTab, setTouchpointsTab,
    isTouchpointsMobileExpanded, setIsTouchpointsMobileExpanded,
    settingsTab, setSettingsTab,
    isProfileExpanded, setIsProfileExpanded,
    viewingStaffDetailId, setViewingStaffDetailId,
    handleNavigateMenu, navigateMenu
  } = useDashboardNavigation(initialMenu, initialSettingsTab)
  const [showKybWarningModal, setShowKybWarningModal] = useState(false)
  const [processingFee, setProcessingFee] = useState(3.0)

  const lastProcessedSetupData = useRef(null)
  const ignoreNextSync = useRef(false)


  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_profile_settings')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      logger.error(e)
    }
    // Fallback if not saved yet
    const setupDataStr = localStorage.getItem('nexora_merchant_setup')
    let parsedSetup = null
    if (setupDataStr) {
      try {
        parsedSetup = JSON.parse(setupDataStr)
      } catch (err) {}
    }
    const storeInfo = setupData?.businessInfo || parsedSetup?.businessInfo
    const reviewInfo = setupData?.reviewLinks || parsedSetup?.reviewLinks
    return {
      fullName: storeInfo?.ownerName || (hasKyb ? 'Elena Rostova' : ''),
      email: storeInfo?.businessEmail || userEmail || (hasKyb ? 'owner@goldenglownails.com' : ''),
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
      businessName: storeInfo?.name || (hasKyb ? 'Golden Glow Nail Spa & Salon' : ''),
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
    }
  })

  const [transactions, setTransactions] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_transactions')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      logger.error(e)
    }
    localStorage.setItem('nexora_transactions', JSON.stringify(INITIAL_TRANSACTIONS))
    return INITIAL_TRANSACTIONS
  })

  const [reviews, setReviews] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_reviews')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      logger.error(e)
    }
    localStorage.setItem('nexora_reviews', JSON.stringify(INITIAL_REVIEWS))
    return INITIAL_REVIEWS
  })

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('nexora_notifications')
      if (saved) return JSON.parse(saved)
    } catch (e) {
      logger.error(e)
    }
    const initial = [
      { id: '1', type: 'feedback_alert', title: 'New Internal Feedback (2★)', message: 'Customer left feedback for Ashley P. at Pedicure Chair 02: "Great polish, but I waited 20 minutes after my appointment time."', time: '10 mins ago', read: false, linkTab: 'reviews' },
      { id: '2', type: 'tip_success', title: 'New Tip Received ($28.00)', message: 'Mia Tran received $28.00 tip via Venmo at Manicure Station 03.', time: '25 mins ago', read: true, linkTab: 'reports' },
      { id: '3', type: 'feedback_alert', title: 'New Internal Feedback (1★)', message: 'Customer left feedback for Vivian L. at Front Desk: "My color chipped after one day. I need someone to contact me."', time: '1 day ago', read: true, linkTab: 'reviews' }
    ]
    localStorage.setItem('nexora_notifications', JSON.stringify(initial))
    return initial
  })

  const [isNotiDropdownOpen, setIsNotiDropdownOpen] = useState(false)
  const [touchpoints, setTouchpoints] = useState(() => {
    const saved = localStorage.getItem('nexora_merchant_setup')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.touchPoints?.length) {
          return parsed.touchPoints
        }
      } catch (e) {}
    }
    if (setupData?.touchPoints?.length) {
      return setupData.touchPoints
    }
    return INITIAL_TOUCHPOINTS
  })
  const { devices, setDevices, handleAddDevice, handleDeleteDevice, handleToggleDeviceStatus } = useDevices()
  const [qrTarget, setQrTarget] = useState(null)
  const [reviewFilterStaff, setReviewFilterStaff] = useState('all')
  const [newTouchpoint, setNewTouchpoint] = useState({ name: '', type: 'Table QR' })
  const [searchQuery, setSearchQuery] = useState('')
  const [activeKpi, setActiveKpi] = useState('tips')
  const { chartRange, chartStartDate, chartEndDate, setChartStartDate, setChartEndDate, handleChartRangeChange } = useChartDateRange(transactions)

  const [selectedLeaderboardStaff, setSelectedLeaderboardStaff] = useState(STAFF_PERFORMANCE[0].nickname)

  const businessName = profile?.businessName || setupData?.businessInfo?.name || 'Golden Glow Nail Spa'

  const {
    staff, setStaff,
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
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest
  } = useStaffManagement({ setupData, businessName, setTouchpoints, viewingStaffDetailId, setViewingStaffDetailId })

  // Initialize sessionStorage with initial profile and setupData on mount
  useEffect(() => {
    if (profile) {
      const sessionProfile = sessionStorage.getItem('nexora_profile_settings')
      if (!sessionProfile) {
        sessionStorage.setItem('nexora_profile_settings', JSON.stringify(profile))
      }
    }
  }, [profile])

  useEffect(() => {
    if (setupData) {
      const sessionSetup = sessionStorage.getItem('nexora_merchant_setup')
      if (!sessionSetup) {
        sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(setupData))
      }
    }
  }, [setupData])

  useEffect(() => {
    if (setupData) {
      lastProcessedSetupData.current = setupData
      ignoreNextSync.current = true
    }
    if (setupData?.staffList?.length) {
      setStaff(setupData.staffList.map((member) => ({
        id: member.id,
        fullName: member.fullName,
        nickname: member.nickname,
        position: member.position,
        avatar: member.avatar || '',
        phone: member.phone || '',
        email: member.email || '',
        bio: member.bio || '',
        status: member.status || 'Active',
        flowType: member.flowType || '',
        isActive: member.isActive !== undefined ? member.isActive : true,
        showInTipsFlow: member.showInTipsFlow !== undefined ? member.showInTipsFlow : true,
        paymentAccounts: {
          venmo: member.paymentAccounts?.venmo || '',
          cashapp: member.paymentAccounts?.cashapp || '',
          zelle: member.paymentAccounts?.zelle || '',
          vlinkpay: member.paymentAccounts?.vlinkpay || '',
          paypal: member.paymentAccounts?.paypal || '',
          bankwire: member.paymentAccounts?.bankwire || '',
          applecash: member.paymentAccounts?.applecash || ''
        },
        payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
      })))
    }
    if (setupData?.touchPoints?.length) {
      setTouchpoints(setupData.touchPoints)
    }
  }, [setupData])

  // Sync edits in dashboard to storage so simulator/customer flow gets the updates
  useEffect(() => {
    if (ignoreNextSync.current) {
      ignoreNextSync.current = false
      return
    }

    // If setupData changed but we haven't processed it in Hook 1 yet,
    // skip syncing to avoid overwriting the storage with stale local states.
    if (setupData && lastProcessedSetupData.current !== setupData) {
      return
    }

    // Also, if local staff list is empty but setupData has staff, don't overwrite storage with empty staff list!
    if (setupData?.staffList?.length && !staff.length) {
      return
    }

    // Check if the current local state matches what is already in setupData.
    // If it does, we don't need to push any updates, breaking the sync loop and preventing flickering.
    if (setupData) {
      const isStaffEqual = areStaffListsEqual(staff, setupData.staffList)
      const isTouchpointsEqual = areTouchpointsEqual(touchpoints, setupData.touchPoints)
      if (isStaffEqual && isTouchpointsEqual) {
        return
      }
    }

    const saved = localStorage.getItem('nexora_merchant_setup') || sessionStorage.getItem('nexora_merchant_setup')
    let parsed = null
    if (saved) {
      try {
        parsed = JSON.parse(saved)
      } catch (e) {}
    }
    if (!parsed && setupData) {
      parsed = { ...setupData }
    }
    if (parsed) {
      parsed.staffList = staff
      parsed.touchPoints = touchpoints
      localStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
      sessionStorage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
    }
  }, [staff, touchpoints, setupData])

  // Listen for storage events (e.g. from customer flow tipping or settings edits)
  useEffect(() => {
    const handleStorageChange = (e) => {
      try {
        if (!e || !e.key) {
          const val = localStorage.getItem('nexora_profile_settings') || sessionStorage.getItem('nexora_profile_settings')
          if (val) setProfile(JSON.parse(val))
          
          const txs = localStorage.getItem('nexora_transactions')
          if (txs) setTransactions(JSON.parse(txs))

          const revs = localStorage.getItem('nexora_reviews')
          if (revs) setReviews(JSON.parse(revs))

          const notis = localStorage.getItem('nexora_notifications')
          if (notis) setNotifications(JSON.parse(notis))
          return
        }

        if (e.key === 'nexora_transactions' && e.newValue) {
          setTransactions(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_reviews' && e.newValue) {
          setReviews(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_notifications' && e.newValue) {
          setNotifications(JSON.parse(e.newValue))
        } else if (e.key === 'nexora_profile_settings') {
          const val = e.newValue || localStorage.getItem('nexora_profile_settings') || sessionStorage.getItem('nexora_profile_settings')
          if (val) {
            setProfile(JSON.parse(val))
          }
        }
      } catch (err) {
        logger.error('Error parsing synced storage key', e?.key, err)
      }
    }
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Handle profile reset or load when hasKyb changes
  useEffect(() => {
    const saved = localStorage.getItem('nexora_profile_settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (!hasKyb) {
          parsed.fullName = ''
          parsed.email = userEmail || ''
          parsed.businessName = ''
          parsed.paymentAccounts = {
            zelle: '',
            bankwire: '',
            paypal: '',
            venmo: '',
            cashapp: '',
            applecash: '',
            vlinkpay: ''
          }
        }
        setProfile(parsed)
      } catch (err) {}
    } else {
      const setupDataStr = localStorage.getItem('nexora_merchant_setup')
      let parsedSetup = null
      if (setupDataStr) {
        try {
          parsedSetup = JSON.parse(setupDataStr)
        } catch (err) {}
      }
      const storeInfo = setupData?.businessInfo || parsedSetup?.businessInfo
      const reviewInfo = setupData?.reviewLinks || parsedSetup?.reviewLinks
      setProfile({
        fullName: storeInfo?.ownerName || (hasKyb ? 'Elena Rostova' : ''),
        email: storeInfo?.businessEmail || userEmail || (hasKyb ? 'owner@goldenglownails.com' : ''),
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
        businessName: storeInfo?.name || (hasKyb ? 'Golden Glow Nail Spa & Salon' : ''),
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
    }
  }, [hasKyb, userEmail, setupData])

  // For staff dashboard: populate profile info from their staff profile
  useEffect(() => {
    if (userRole === 'staff' && currentStaffId && staff.length > 0) {
      const currentStaff = staff.find(s => s.id === currentStaffId)
      if (currentStaff) {
        setProfile({
          fullName: currentStaff.fullName,
          email: currentStaff.email,
          avatar: currentStaff.avatar || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=200&h=200',
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
        { id: 'overview', label: currentLanguage === 'vi' ? 'Tài khoản của tôi' : 'My Dashboard', icon: MENU_ITEMS.find(i => i.id === 'overview')?.icon, image: MENU_ITEMS.find(i => i.id === 'overview')?.image },
        { id: 'support', label: t('dashboard.menu.support') || 'Support', icon: MENU_ITEMS.find(i => i.id === 'support')?.icon }
      ]
    : MENU_ITEMS

  // Filter lists based on searchQuery
  const filteredStaff = useMemo(() => {
    const visibleStaff = staff.filter(member => member.status !== 'Pending Acceptance')
    if (!searchQuery) return visibleStaff
    const query = searchQuery.toLowerCase().trim()
    return visibleStaff.filter(member => 
      member.fullName.toLowerCase().includes(query) ||
      member.nickname.toLowerCase().includes(query) ||
      member.position.toLowerCase().includes(query)
    )
  }, [staff, searchQuery])

  const pendingStaff = useMemo(() => {
    return staff.filter(member => member.status === 'Pending Acceptance')
  }, [staff])

  const filteredTouchpoints = useMemo(() => {
    if (!searchQuery) return touchpoints
    const query = searchQuery.toLowerCase().trim()
    return touchpoints.filter(point => 
      point.name.toLowerCase().includes(query) ||
      point.type.toLowerCase().includes(query) ||
      (point.staffName && point.staffName.toLowerCase().includes(query))
    )
  }, [touchpoints, searchQuery])

  const filteredReviews = useMemo(() => {
    if (!searchQuery) return reviews
    const query = searchQuery.toLowerCase().trim()
    return reviews.filter(rev => 
      rev.comment.toLowerCase().includes(query) ||
      rev.staffName.toLowerCase().includes(query) ||
      rev.category.toLowerCase().includes(query) ||
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

  const filteredTxsForMetrics = useMemo(() => {
    return transactions.filter(tx => {
      if (!tx.dateTime) return false;
      const date = tx.dateTime.split(' ')[0];
      return date >= chartStartDate && date <= chartEndDate;
    });
  }, [transactions, chartStartDate, chartEndDate]);

  const metrics = useMemo(() => {
    const totalTips = filteredTxsForMetrics
      .filter(tx => tx.status === 'Success')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);
    const totalTransactions = filteredTxsForMetrics.length;
    const averageTip = totalTransactions === 0 ? 0 : totalTips / totalTransactions;

    // Standard fallbacks to keep UI looking premium if empty/zero in range
    return {
      totalTips: totalTips || 4785.00,
      totalTransactions: totalTransactions || 312,
      averageTip: averageTip || 15.34,
      totalReviews: 128,
      googleRating: 4.8,
      googleReviews: 96,
      yelpRating: 4.5,
      yelpReviews: 32,
      responseRate: 68,
      returningCustomers: 68,
      returningCustomersDelta: 12
    }
  }, [filteredTxsForMetrics]);


  const addTouchpoint = (name, type, deviceId) => {
    const finalName = typeof name === 'string' ? name.trim() : (newTouchpoint.name || '').trim()
    const finalType = typeof type === 'string' ? type : (newTouchpoint.type || 'Table QR')
    const finalDeviceId = typeof deviceId === 'string' ? deviceId.trim() : ''

    if (!finalName) return
    setTouchpoints((current) => [...current, {
      id: `tp-${Date.now()}`,
      name: finalName,
      type: finalType,
      deviceId: finalDeviceId || undefined,
      isActive: true,
      scans: 0
    }])
    setNewTouchpoint({ name: '', type: 'Table QR' })
  }

  const linkDevice = (id, deviceId) => {
    setTouchpoints((current) =>
      current.map((point) =>
        point.id === id ? { ...point, deviceId: deviceId.trim() || undefined } : point
      )
    )
  }

  const toggleTouchpointStatus = (id) => {
    setTouchpoints((current) => current.map((point) => point.id === id ? { ...point, isActive: point.isActive === false ? true : false } : point))
  }

  const previewQr = (target) => {
    setQrTarget({
      name: target.name || `Personal QR - ${target.nickname}`,
      subtitle: target.position || target.type || 'Staff QR',
      slug: target.nickname ? `staff/${slugify(target.nickname)}` : `tp/${target.id}`,
      isActive: target.isActive !== undefined ? target.isActive : true
    })
  }

  const handleSelectLeaderboardStaff = (nickname) => {
    setSelectedLeaderboardStaff(nickname)
    const member = staff.find((s) => s.nickname === nickname || s.fullName.toLowerCase().includes(nickname.toLowerCase().split(' ')[0]))
    if (member) {
      setViewingStaffDetailId(member.id)
    }
  }

  const renderContent = () => {
    if (userRole === 'staff') {
      const activeDetailStaff = staff.find((member) => member.id === currentStaffId)
      if (activeDetailStaff) {
        return (
          <StaffDetailView
            staffMember={activeDetailStaff}
            onBack={null}
            transactions={transactions}
            reviews={reviews}
            onEdit={openEditStaff}
            onQr={previewQr}
            onDelete={null}
          />
        )
      } else {
        return (
          <div className="flex h-64 flex-col items-center justify-center space-y-3 nexora-card p-6">
            <div className="text-sm font-semibold text-nexoraMuted">
              {currentLanguage === 'vi' ? 'Không tìm thấy hồ sơ thợ của bạn.' : 'Your staff profile was not found.'}
            </div>
          </div>
        )
      }
    }

    if (viewingStaffDetailId) {
      const activeDetailStaff = staff.find((member) => member.id === viewingStaffDetailId)
      if (activeDetailStaff) {
        return (
          <StaffDetailView
            staffMember={activeDetailStaff}
            onBack={() => setViewingStaffDetailId(null)}
            transactions={transactions}
            reviews={reviews}
            onEdit={openEditStaff}
            onQr={previewQr}
            onDelete={deleteStaff}
          />
        )
      }
    }
    if (activeMenu === 'overview') {
      return (
        <Overview
          metrics={metrics}
          activeKpi={activeKpi}
          setActiveKpi={setActiveKpi}
          chartRange={chartRange}
          setChartRange={handleChartRangeChange}
          chartStartDate={chartStartDate}
          chartEndDate={chartEndDate}
          setChartStartDate={setChartStartDate}
          setChartEndDate={setChartEndDate}
          transactions={transactions}
          selectedStaff={selectedLeaderboardStaff}
          setSelectedStaff={handleSelectLeaderboardStaff}
          onOpenTouchpoints={() => setActiveMenu('touchpoints')}
          onOpenReviews={() => setActiveMenu('reviews')}
          businessName={businessName}
          previewQr={previewQr}
          hasKyb={hasKyb}
        />
      )
    }
    if (activeMenu === 'staff') return (
      <StaffView 
        staff={filteredStaff} 
        pendingStaff={pendingStaff}
        allStaff={staff}
        onApproveClick={openApproveStaff}
        onAdd={openAddStaff} 
        onEdit={openEditStaff} 
        onDelete={deleteStaff} 
        onQr={previewQr} 
        onToggle={toggleStaff} 
        onToggleTipsFlow={toggleStaffTipsFlow} 
        onViewDetail={setViewingStaffDetailId} 
        onLinkStaff={handleLinkStaff}
        onInviteStaff={handleInviteStaff}
        businessName={businessName}
        onAcceptJoin={handleAcceptJoinRequest}
        onDeclineJoin={handleDeclineJoinRequest}
        onAcceptUnlink={handleAcceptUnlinkRequest}
        onDeclineUnlink={handleDeclineUnlinkRequest}
        onOpenInviteShare={() => {
          setInviteShareDefaultName('')
          setInviteShareDefaultContact('')
          setIsInviteShareOpen(true)
        }}
      />
    )
    if (activeMenu === 'touchpoints') {
      return (
        <TouchpointsView
          touchpoints={filteredTouchpoints}
          newTouchpoint={newTouchpoint}
          setNewTouchpoint={setNewTouchpoint}
          onAdd={addTouchpoint}
          onDelete={(id) => setTouchpoints((current) => current.filter((point) => point.id !== id))}
          onQr={previewQr}
          onToggleStatus={toggleTouchpointStatus}
          onLinkDevice={linkDevice}
          transactions={transactions}
          businessName={businessName}
          devices={devices}
          onAddDevice={handleAddDevice}
          onDeleteDevice={handleDeleteDevice}
          onToggleDeviceStatus={handleToggleDeviceStatus}
          activeSubTab={touchpointsTab}
          onTabChange={setTouchpointsTab}
        />
      )
    }
    if (activeMenu === 'reviews') return (
      <ReviewsView
        reviews={filteredReviews}
        staff={staff}
        filter={reviewFilterStaff}
        setFilter={setReviewFilterStaff}
        setupData={setupData}
      />
    )
    if (activeMenu === 'tips') return (
      <TipsView 
        transactions={transactions} 
        staff={staff} 
        activeTab={tipsTab} 
        onTabChange={setTipsTab}
        processingFee={processingFee}
        setProcessingFee={setProcessingFee}
      />
    )
    if (activeMenu === 'reports') return <ReportsView transactions={filteredTransactions} staff={staff} touchpoints={touchpoints} />
    if (activeMenu === 'settings') {
      return (
        <SettingsView
          setupData={setupData}
          hasKyb={hasKyb}
          verificationStatus={verificationStatus}
          onBlockedFeatureClick={() => setShowKybWarningModal(true)}
          userEmail={userEmail}
          onKybRequired={onKybRequired}
          initialTab={settingsTab}
          onTabChange={setSettingsTab}
          onKybSuccess={onKybSuccess}
        />
      )
    }
    if (activeMenu === 'analytics') {
      return (
        <AnalyticsView
          transactions={transactions}
          staff={staff}
          touchpoints={touchpoints}
          processingFee={processingFee}
        />
      )
    }
    if (activeMenu === 'support') {
      return (
        <SupportView />
      )
    }
    return <ComingSoon activeMenu={activeMenu} onBack={() => setActiveMenu('overview')} />
  }

  return (
    <div className="min-h-dvh bg-nexoraCanvas font-sans text-nexoraText">
      <DashboardSidebar 
        activeMenu={activeMenu} 
        setActiveMenu={handleNavigateMenu} 
        businessName={businessName} 
        profile={profile}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        isProfileExpanded={isProfileExpanded}
        setIsProfileExpanded={setIsProfileExpanded}
        hasKyb={hasKyb}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
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
          onAddTouchpoint={() => setActiveMenu('touchpoints')}
          profile={profile}
          businessName={businessName}
          onNavigateSettingsTab={(tab) => {
            setActiveMenu('settings')
            setSettingsTab(tab)
          }}
          onLogout={onLogout}
          notifications={notifications}
          setNotifications={setNotifications}
          isNotiDropdownOpen={isNotiDropdownOpen}
          setIsNotiDropdownOpen={setIsNotiDropdownOpen}
          onNavigateMenu={handleNavigateMenu}
          staff={staff}
          transactions={transactions}
          reviews={reviews}
          touchpoints={touchpoints}
          onViewStaffDetail={setViewingStaffDetailId}
          onApproveStaff={openApproveStaff}
          userRole={userRole}
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
        />

        <main className="min-h-dvh p-4 sm:p-6 lg:p-7">
          {activeMenu !== 'overview' && !viewingStaffDetailId && (
            <button
              onClick={() => handleNavigateMenu('overview')}
              className="mb-5 inline-flex h-9 items-center rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-extrabold text-nexoraText shadow-nexora-soft transition hover:bg-nexoraSurfaceMuted"
            >
              Back to Dashboard
            </button>
          )}
          {renderContent()}
        </main>
      </div>

      <button
        onClick={() => document.documentElement.classList.toggle('dark')}
        className="fixed bottom-4 right-4 z-40 flex h-10 w-10 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraSurface text-nexoraMuted shadow-lg"
        title="Toggle theme hook"
        aria-label="Toggle theme hook"
      >
        <Sun className="h-4 w-4 dark:hidden" />
        <Moon className="hidden h-4 w-4 dark:block" />
      </button>

      <MobileMenuDrawer
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        profile={profile}
        businessName={businessName}
        activeMenu={activeMenu}
        setActiveMenu={setActiveMenu}
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
        viewingStaffDetailId={viewingStaffDetailId}
        setViewingStaffDetailId={setViewingStaffDetailId}
        navigateMenu={navigateMenu}
      />

      <StaffModal
        open={isStaffModalOpen}
        editing={Boolean(editingStaffId)}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onClose={closeStaffModal}
        onSave={saveStaff}
        onOpenInviteShare={(formDetails) => {
          setInviteShareDefaultName(formDetails.fullName || '')
          setInviteShareDefaultContact(formDetails.email || formDetails.phone || '')
          setIsInviteShareOpen(true)
        }}
      />

      <StaffModal
        open={isApproveModalOpen}
        editing={false}
        isApproveMode={true}
        onDecline={() => {
          if (approvingStaffMember) {
            handleDeclineJoinRequest(approvingStaffMember.id)
          }
          setIsApproveModalOpen(false)
        }}
        form={staffForm}
        errors={errors}
        setForm={setStaffForm}
        verificationStatus={verificationStatus}
        onBlockedFeatureClick={() => setShowKybWarningModal(true)}
        onClose={() => {
          setIsApproveModalOpen(false)
          resetStaffForm()
        }}
        onSave={() => {
          if (approvingStaffMember) {
            handleAcceptJoinRequest(approvingStaffMember.id, staffForm)
          }
          setIsApproveModalOpen(false)
        }}
      />
      <QrModal target={qrTarget} businessName={businessName} onClose={() => setQrTarget(null)} />

      <InviteShareModal
        open={isInviteShareOpen}
        businessName={businessName}
        defaultName={inviteShareDefaultName}
        defaultContact={inviteShareDefaultContact}
        onClose={() => setIsInviteShareOpen(false)}
        onSendInvite={(name, contact, role) => {
          const isEmail = contact.includes('@')
          const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
          
          const newMember = {
            id: tempId,
            fullName: name.trim() || 'New Technician',
            nickname: name.trim() ? name.trim().split(' ')[0] + '.' : 'Tech.',
            position: role || 'Nail Technician',
            avatar: '',
            phone: isEmail ? '' : contact.trim(),
            email: isEmail ? contact.trim() : '',
            isActive: false,
            status: 'Pending Setup',
            flowType: 'Invite New Staff',
            paymentAccounts: {},
            payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
          }

          setStaff((current) => [...current, newMember])
          setTouchpoints((current) => [...current, {
            id: `tp-staff-${newMember.id}`,
            name: `Personal QR - ${newMember.nickname}`,
            type: 'Staff QR',
            staffId: newMember.id,
            staffName: newMember.nickname
          }])

          const event = new CustomEvent('showSimulationInvite', {
            detail: {
              id: tempId,
              name: newMember.fullName,
              email: newMember.email,
              phone: newMember.phone,
              role: role || 'Nail Technician',
              biz: businessName
            }
          })
          window.dispatchEvent(event)
          setIsInviteShareOpen(false)
          closeStaffModal()
        }}
      />

      {/* KYB Verification Warning Modal for gated features */}
      {showKybWarningModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-nexoraBorder max-w-md w-full shadow-2xl p-6 relative overflow-hidden animate-scaleUp text-center space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-nexoraWarning/10 text-nexoraWarning mx-auto shrink-0 shadow-sm">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-base font-black text-nexoraText uppercase tracking-wider">
                {currentLanguage === 'vi' ? 'Yêu cầu xác thực KYB' : 'KYB Verification Required'}
              </h3>
              <p className="text-xs text-nexoraSubtle font-medium leading-relaxed">
                {currentLanguage === 'vi'
                  ? 'Tính năng này yêu cầu hồ sơ doanh nghiệp đã được xác thực KYB bởi VLINKPAY. Nhấp vào nút bên dưới để chuyển hướng đến trang Cài đặt > KYB để gửi thông tin doanh nghiệp của bạn.'
                  : 'This feature requires your business profile to be KYB verified by VLINKPAY. Click below to navigate to Settings > KYB tab and submit your compliance information.'}
              </p>
            </div>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-center">
              <button
                type="button"
                onClick={() => setShowKybWarningModal(false)}
                className="px-5 py-2.5 border border-nexoraBorder hover:bg-nexoraCanvas text-nexoraSubtle text-xs font-bold uppercase tracking-wider rounded-lg transition-all"
              >
                {currentLanguage === 'vi' ? 'Hủy bỏ' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowKybWarningModal(false)
                  setActiveMenu('settings')
                  setSettingsTab('kyb')
                  setIsMobileMenuOpen(false)
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-nexoraElectric to-nexoraViolet hover:opacity-90 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all animate-pulse"
              >
                {currentLanguage === 'vi' ? 'Xác thực ngay' : 'Verify Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
