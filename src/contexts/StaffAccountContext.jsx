import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { storage } from '../utils/storage'
import { INITIAL_TRANSACTIONS, INITIAL_REVIEWS, INITIAL_STAFF } from '../components/dashboard/data/mockData'
import { DEMO_STAFF_ID, makeDefaultStaffAccount } from '../components/staff-dashboard/data/staffMockData'

const StaffAccountContext = createContext(null)

const STAFF_KEY = 'nexora_staff_account'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Read a dynamic key from storage and JSON-parse it, falling back to a default.
function readJSON(key, fallback) {
  try {
    const raw = storage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw)
    return parsed ?? fallback
  } catch (e) {
    return fallback
  }
}

export function StaffAccountProvider({ staffId = DEMO_STAFF_ID, children }) {
  // Raw synced blobs (merchant-owned + staff-owned). Re-read on storage events.
  const [merchantSetup, setMerchantSetup] = useState(() => readJSON('nexora_merchant_setup', null))
  const [transactions, setTransactions] = useState(() => readJSON('nexora_transactions', null))
  const [reviews, setReviews] = useState(() => readJSON('nexora_reviews', null))
  const [staffMap, setStaffMap] = useState(() => readJSON(STAFF_KEY, {}))

  const refreshFromStorage = useCallback(() => {
    setMerchantSetup(readJSON('nexora_merchant_setup', null))
    setTransactions(readJSON('nexora_transactions', null))
    setReviews(readJSON('nexora_reviews', null))
    setStaffMap(readJSON(STAFF_KEY, {}))
  }, [])

  // Realtime: the storage/supabase sync layer dispatches a `storage` event on change.
  useEffect(() => {
    refreshFromStorage()
    window.addEventListener('storage', refreshFromStorage)
    return () => window.removeEventListener('storage', refreshFromStorage)
  }, [refreshFromStorage])

  // --- Derived: merchant staff list + the signed-in staff member -----------
  const staffList = useMemo(() => {
    const list = merchantSetup?.staffList
    return Array.isArray(list) && list.length ? list : INITIAL_STAFF
  }, [merchantSetup])

  // Look up registered pending accounts to see if this staff matches a manually registered staff account
  const registeredStaffAccount = useMemo(() => {
    const allAccounts = readJSON('nexora_pending_accounts', [])
    return allAccounts.find(acc => acc.role === 'personal' && acc.staffId === staffId)
  }, [staffId])

  const staffMember = useMemo(() => {
    const found = staffList.find((s) => s.id === staffId)
    if (found) return found
    if (registeredStaffAccount) {
      return {
        id: registeredStaffAccount.staffId,
        fullName: registeredStaffAccount.fullName,
        nickname: registeredStaffAccount.fullName,
        email: registeredStaffAccount.email,
        isActive: true,
        showInTipsFlow: true,
        paymentAccounts: {}
      }
    }
    return staffList[0] || {}
  }, [staffList, staffId, registeredStaffAccount])

  const businessName = merchantSetup?.businessInfo?.name || 'Golden Glow Nail Spa'

  // --- Staff-owned blob (with default init) --------------------------------
  const account = useMemo(
    () => staffMap?.[staffId] || makeDefaultStaffAccount(staffMember),
    [staffMap, staffId, staffMember]
  )

  // Persist a partial update to the signed-in staff's owned blob.
  const updateAccount = useCallback(
    (patch) => {
      setStaffMap((prev) => {
        const base = prev?.[staffId] || makeDefaultStaffAccount(staffMember)
        const nextAccount = { ...base, ...patch }
        const next = { ...prev, [staffId]: nextAccount }
        storage.setItem(STAFF_KEY, JSON.stringify(next))

        // Synchronize back to merchant setup roster
        try {
          const savedSetup = storage.getItem('nexora_merchant_setup')
          if (savedSetup) {
            const parsed = JSON.parse(savedSetup)
            if (Array.isArray(parsed.staffList)) {
              const updatedStaffList = parsed.staffList.map((s) => {
                if (s.id === staffId) {
                  const pm = nextAccount.payoutMethods || {}
                  return {
                    ...s,
                    fullName: nextAccount.defaultDisplayName || s.fullName,
                    nickname: nextAccount.defaultDisplayName || s.nickname,
                    avatar: nextAccount.avatar || s.avatar,
                    paymentAccounts: {
                      ...s.paymentAccounts,
                      venmo: pm.venmo?.enabled ? pm.venmo.value || '' : '',
                      cashapp: pm.cashapp?.enabled ? pm.cashapp.value || '' : '',
                      zelle: pm.zelle?.enabled ? pm.zelle.value || '' : '',
                      vlinkpay: pm.vlinkpay?.enabled ? pm.vlinkpay.value || '' : '',
                      paypal: pm.paypal?.enabled ? pm.paypal.value || '' : '',
                      bankwire: pm.bankwire?.enabled ? pm.bankwire.value || '' : '',
                      applecash: pm.applecash?.enabled ? pm.applecash.value || '' : '',
                    },
                    payoutConfigs: pm
                  }
                }
                return s
              })
              parsed.staffList = updatedStaffList
              storage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
            }
          }
        } catch (e) {
          console.error('[StaffAccountContext] Error syncing to merchant setup:', e)
        }

        window.dispatchEvent(new Event('storage'))
        return next
      })
    },
    [staffId, staffMember]
  )

  // --- Derived: tips for this staff (with status) --------------------------
  const allTx = useMemo(() => {
    const list = Array.isArray(transactions) && transactions.length ? transactions : INITIAL_TRANSACTIONS
    return list.filter((tx) => tx.staffId === staffId)
  }, [transactions, staffId])

  const tips = useMemo(() => {
    const confirmed = new Set(account.confirmedTipIds || [])
    return allTx.map((tx) => {
      const method = tx.paymentMethod || ''
      let status = 'Pending'
      if (method.toUpperCase().includes('VLINKPAY')) status = 'Verified'
      else if (confirmed.has(tx.id)) status = 'Completed'
      return { ...tx, status, businessName, displayName: account.defaultDisplayName }
    })
  }, [allTx, account.confirmedTipIds, account.defaultDisplayName, businessName])

  const pendingTips = useMemo(() => tips.filter((t) => t.status === 'Pending'), [tips])

  // --- Derived: KPIs -------------------------------------------------------
  const staffReviews = useMemo(() => {
    const list = Array.isArray(reviews) && reviews.length ? reviews : INITIAL_REVIEWS
    return list.filter((r) => r.staffId === staffId)
  }, [reviews, staffId])

  const kpis = useMemo(() => {
    const monthTips = tips.reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const latestDate = tips.reduce((d, t) => {
      const day = (t.dateTime || '').split(' ')[0]
      return day > d ? day : d
    }, '')
    const todayTips = tips
      .filter((t) => (t.dateTime || '').startsWith(latestDate))
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0)
    const ratingValues = staffReviews.map((r) => Number(r.rating) || 0)
    const rating = ratingValues.length
      ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
      : 0
    return {
      todayTips,
      todayCount: tips.filter((t) => (t.dateTime || '').startsWith(latestDate)).length,
      monthTips,
      pendingCount: pendingTips.length,
      rating
    }
  }, [tips, pendingTips, staffReviews])

  // --- Derived: linked businesses ------------------------------------------
  const linkedBusinesses = useMemo(() => {
    const isLinked = merchantSetup?.staffList?.some((s) => s.id === staffId)
    const linkedStaff = merchantSetup?.staffList?.find((s) => s.id === staffId)
    const linkId = `${slugify(businessName)}__${staffId}`
    
    let status = 'Pending Link'
    if (isLinked) {
      if (linkedStaff?.status === 'Pending Acceptance') {
        status = 'Pending Approval'
      } else if (linkedStaff?.status === 'Pending Unlink') {
        status = 'Pending Unlink'
      } else if (linkedStaff?.isActive === false) {
        status = 'Inactive'
      } else {
        status = 'Active'
      }
    }

    return [
      {
        businessStaffLinkId: linkId,
        businessName,
        displayName: account.displayNamesByBusiness?.[linkId] || account.defaultDisplayName,
        status
      }
    ]
  }, [businessName, staffId, account.displayNamesByBusiness, account.defaultDisplayName, staffMember.isActive, merchantSetup])

  // --- Derived: notifications (from pending tips + recent good reviews) -----
  const notifications = useMemo(() => {
    const read = new Set(account.notificationsRead || [])
    // Return structured data only; display strings are composed via i18n in the view.
    const fromTips = pendingTips.slice(0, 3).map((t) => ({
      id: `noti-tip-${t.id}`,
      type: 'tip',
      amount: t.amount,
      method: t.paymentMethod,
      read: read.has(`noti-tip-${t.id}`)
    }))
    const fromReviews = staffReviews
      .filter((r) => Number(r.rating) >= 4)
      .slice(0, 3)
      .map((r) => ({
        id: `noti-rev-${r.id}`,
        type: 'review',
        rating: r.rating,
        comment: r.comment,
        read: read.has(`noti-rev-${r.id}`)
      }))
    return [...fromTips, ...fromReviews]
  }, [pendingTips, staffReviews, account.notificationsRead])

  // --- Actions -------------------------------------------------------------
  const confirmTip = useCallback(
    (tipId) => {
      const set = new Set(account.confirmedTipIds || [])
      set.add(tipId)
      updateAccount({ confirmedTipIds: Array.from(set) })
    },
    [account.confirmedTipIds, updateAccount]
  )

  const confirmAllPending = useCallback(() => {
    const set = new Set(account.confirmedTipIds || [])
    pendingTips.forEach((t) => set.add(t.id))
    updateAccount({ confirmedTipIds: Array.from(set) })
  }, [account.confirmedTipIds, pendingTips, updateAccount])

  const setPayoutMethod = useCallback(
    (key, patch) => {
      const methods = { ...account.payoutMethods }
      methods[key] = { ...methods[key], ...patch }
      updateAccount({ payoutMethods: methods })
    },
    [account.payoutMethods, updateAccount]
  )

  const saveProfile = useCallback(
    (patch) => updateAccount(patch),
    [updateAccount]
  )

  const setBusinessDisplayName = useCallback(
    (linkId, name) => {
      const map = { ...(account.displayNamesByBusiness || {}) }
      map[linkId] = name
      updateAccount({ displayNamesByBusiness: map })
    },
    [account.displayNamesByBusiness, updateAccount]
  )

  const setPushPreference = useCallback(
    (key, value) => {
      updateAccount({ pushPreferences: { ...account.pushPreferences, [key]: value } })
    },
    [account.pushPreferences, updateAccount]
  )

  const markNotificationRead = useCallback(
    (notiId) => {
      const set = new Set(account.notificationsRead || [])
      set.add(notiId)
      updateAccount({ notificationsRead: Array.from(set) })
    },
    [account.notificationsRead, updateAccount]
  )

  const value = {
    staffId,
    staffMember,
    businessName,
    account,
    tips,
    pendingTips,
    kpis,
    linkedBusinesses,
    notifications,
    unreadCount: notifications.filter((n) => !n.read).length,
    confirmTip,
    confirmAllPending,
    setPayoutMethod,
    saveProfile,
    setBusinessDisplayName,
    setPushPreference,
    markNotificationRead
  }

  return <StaffAccountContext.Provider value={value}>{children}</StaffAccountContext.Provider>
}

export function useStaffAccount() {
  const ctx = useContext(StaffAccountContext)
  if (!ctx) throw new Error('useStaffAccount must be used within a StaffAccountProvider')
  return ctx
}
