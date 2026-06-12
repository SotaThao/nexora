import React, { createContext, useCallback, useContext, useMemo } from 'react'
import { logger } from '../utils/logger'
import { makeDefaultStaffAccount } from '../components/staff-dashboard/data/staffMockData'
import {
  useStaffAccount as useStaffAccountQuery,
  useSaveStaffAccount as useSaveStaffAccountQuery,
} from '../data/hooks/useStaffAccount'
import { useTransactions } from '../data/hooks/useTransactions'
import { useMerchantSetup, useSaveMerchantSetup } from '../data/hooks/useMerchantSetup'
import { useReviews } from '../data/hooks/useReviews'
import { usePendingAccounts } from '../data/hooks/usePendingAccounts'
import { useProfileSettings, useUpdateUserProfile, useUpdateStaffProfile } from '../data/hooks/useProfileSettings'
import { useStaffProfile, useStaffBusinesses } from '../data/hooks/useStaffSelf'

interface StaffKpis {
  todayTips: number
  todayCount: number
  monthTips: number
  monthCount: number
  pendingCount: number
  pendingAmount: number
  rating: number
}

interface StaffAccountContextValue {
  staffId: string | null
  staffMember: LooseObject
  businessName: string
  account: LooseObject
  tips: LooseObject[]
  pendingTips: LooseObject[]
  kpis: StaffKpis
  linkedBusinesses: LooseObject[]
  notifications: LooseObject[]
  unreadCount: number
  confirmTip: (tipId: string) => void
  confirmAllPending: () => void
  setPayoutMethod: (key: string, patch: LooseObject) => void
  saveProfile: (patch: LooseObject) => void
  setBusinessDisplayName: (linkId: string, name: string) => void
  setPushPreference: (key: string, value: unknown) => void
  markNotificationRead: (notiId: string) => void
}

const StaffAccountContext = createContext<StaffAccountContextValue | null>(null)

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function StaffAccountProvider({ staffId = null, children }: { staffId?: string | null, children: React.ReactNode }) {
  const { data: accountData = null } = useStaffAccountQuery(staffId) as { data: LooseObject | null }
  const { data: transactions = null } = useTransactions() as { data: LooseObject[] | null }
  const { data: merchantSetup = null } = useMerchantSetup() as { data: LooseObject | null }
  const { data: reviews = null } = useReviews() as { data: LooseObject[] | null }
  const { data: allPendingAccounts = [] } = usePendingAccounts() as { data: LooseObject[] }

  const saveStaffAccountMutation = useSaveStaffAccountQuery()
  const saveMerchantSetupMutation = useSaveMerchantSetup()

  const { data: userProfile = null } = useProfileSettings() as { data: LooseObject | null }
  const { data: staffProfile = null } = useStaffProfile() as { data: LooseObject | null }
  const { data: staffBusinesses = null } = useStaffBusinesses() as { data: LooseObject[] | null }
  const updateUserProfileMutation = useUpdateUserProfile()
  const updateStaffProfileMutation = useUpdateStaffProfile()

  const staffList: LooseObject[] = useMemo(() => {
    const list = merchantSetup?.staffList
    return Array.isArray(list) && list.length ? list : []
  }, [merchantSetup])

  const registeredStaffAccount = useMemo(() => {
    return allPendingAccounts.find((acc: LooseObject) => acc.role === 'personal' && acc.staffId === staffId)
  }, [allPendingAccounts, staffId])

  const staffMember: LooseObject = useMemo(() => {
    const found = staffList.find((s: LooseObject) => s.id === staffId)
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

  const businessName: string = merchantSetup?.businessInfo?.name || ''

  const account: LooseObject = useMemo(() => {
    const base: LooseObject = accountData || makeDefaultStaffAccount(staffMember)
    if (!userProfile && !staffProfile) return base
    const apiFullName = (userProfile?.fullName || '').trim()
      || `${userProfile?.firstName ?? ''} ${userProfile?.lastName ?? ''}`.trim()
    return {
      ...base,
      fullName: base.fullName || apiFullName,
      phone: base.phone || userProfile?.phoneNumber || '',
      email: base.email || userProfile?.email || '',
      defaultDisplayName: base.defaultDisplayName || staffProfile?.displayName || userProfile?.firstName || apiFullName,
      bio: base.bio || staffProfile?.bio || '',
      avatar: base.avatar || staffProfile?.photoUrl || null,
      staffCode: staffProfile?.staffCode || base.staffCode || null,
    }
  }, [accountData, staffMember, userProfile, staffProfile])

  const updateAccount = useCallback(
    (patch: LooseObject) => {
      const base: LooseObject = accountData || makeDefaultStaffAccount(staffMember)
      const nextAccount: LooseObject = { ...base, ...patch }

      saveStaffAccountMutation.mutate({ staffId, data: patch })

      if (merchantSetup && Array.isArray(merchantSetup.staffList)) {
        try {
          const updatedStaffList = merchantSetup.staffList.map((s: LooseObject) => {
            if (s.id === staffId) {
              const pm: LooseObject = nextAccount.payoutMethods || {}
              return {
                ...s,
                fullName: nextAccount.fullName !== undefined ? nextAccount.fullName : s.fullName,
                nickname: nextAccount.defaultDisplayName !== undefined ? nextAccount.defaultDisplayName : s.nickname,
                avatar: nextAccount.avatar !== undefined ? nextAccount.avatar : s.avatar,
                phone: nextAccount.phone !== undefined ? nextAccount.phone : s.phone,
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
          ;(saveMerchantSetupMutation.mutate as any)({ ...merchantSetup, staffList: updatedStaffList })
        } catch (e) {
          logger.error('[StaffAccountContext] Error syncing to merchant setup:', e)
        }
      }
    },
    [staffId, staffMember, accountData, merchantSetup, saveStaffAccountMutation, saveMerchantSetupMutation]
  )

  const allTx: LooseObject[] = useMemo(() => {
    const list = Array.isArray(transactions) && transactions.length ? transactions : []
    return list.filter((tx: LooseObject) => tx.staffId === staffId)
  }, [transactions, staffId])

  const tips: LooseObject[] = useMemo(() => {
    const confirmed = new Set<string>(account.confirmedTipIds || [])
    return allTx.map((tx: LooseObject) => {
      const method = tx.paymentMethod || ''
      let status = 'Pending'
      if (method.toUpperCase().includes('VLINKPAY')) status = 'Verified'
      else if (confirmed.has(tx.id)) status = 'Completed'
      return { ...tx, status, businessName, displayName: account.defaultDisplayName }
    })
  }, [allTx, account.confirmedTipIds, account.defaultDisplayName, businessName])

  const pendingTips: LooseObject[] = useMemo(() => tips.filter((t: LooseObject) => t.status === 'Pending'), [tips])

  const staffReviews: LooseObject[] = useMemo(() => {
    const list = Array.isArray(reviews) && reviews.length ? reviews : []
    return list.filter((r: LooseObject) => r.staffId === staffId)
  }, [reviews, staffId])

  const kpis: StaffKpis = useMemo(() => {
    const monthTips = tips.reduce((sum, t: LooseObject) => sum + (Number(t.amount) || 0), 0)
    const latestDate = tips.reduce((d, t: LooseObject) => {
      const day = (t.dateTime || '').split(' ')[0]
      return day > d ? day : d
    }, '')
    const todayTips = tips
      .filter((t: LooseObject) => (t.dateTime || '').startsWith(latestDate))
      .reduce((sum, t: LooseObject) => sum + (Number(t.amount) || 0), 0)
    const ratingValues = staffReviews.map((r: LooseObject) => Number(r.rating) || 0)
    const rating = ratingValues.length
      ? Math.round((ratingValues.reduce((a, b) => a + b, 0) / ratingValues.length) * 10) / 10
      : 0
    return {
      todayTips,
      todayCount: tips.filter((t: LooseObject) => (t.dateTime || '').startsWith(latestDate)).length,
      monthTips,
      monthCount: tips.length,
      pendingCount: pendingTips.length,
      pendingAmount: pendingTips.reduce((sum, t: LooseObject) => sum + (Number(t.amount) || 0), 0),
      rating
    }
  }, [tips, pendingTips, staffReviews])

  const linkedBusinesses: LooseObject[] = useMemo(() => {
    if (Array.isArray(staffBusinesses) && staffBusinesses.length) {
      return staffBusinesses.map((b: LooseObject) => ({
        businessStaffLinkId: b.businessId,
        businessName: b.businessName,
        displayName: account.displayNamesByBusiness?.[b.businessId] || account.defaultDisplayName,
        status: b.linkStatusLabel || b.linkStatus || 'Active',
        logoUrl: b.logoUrl,
        role: b.roleLabel || b.role || null,
        linkedAt: b.linkedAt,
      }))
    }

    const isLinked = merchantSetup?.staffList?.some((s: LooseObject) => s.id === staffId)
    const linkedStaff = merchantSetup?.staffList?.find((s: LooseObject) => s.id === staffId)
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
  }, [staffBusinesses, businessName, staffId, account.displayNamesByBusiness, account.defaultDisplayName, staffMember.isActive, merchantSetup])

  const notifications: LooseObject[] = useMemo(() => {
    const read = new Set<string>(account.notificationsRead || [])
    const fromTips = pendingTips.slice(0, 3).map((t: LooseObject) => ({
      id: `noti-tip-${t.id}`,
      type: 'tip',
      amount: t.amount,
      method: t.paymentMethod,
      read: read.has(`noti-tip-${t.id}`)
    }))
    const fromReviews = staffReviews
      .filter((r: LooseObject) => Number(r.rating) >= 4)
      .slice(0, 3)
      .map((r: LooseObject) => ({
        id: `noti-rev-${r.id}`,
        type: 'review',
        rating: r.rating,
        comment: r.comment,
        read: read.has(`noti-rev-${r.id}`)
      }))
    return [...fromTips, ...fromReviews]
  }, [pendingTips, staffReviews, account.notificationsRead])

  const confirmTip = useCallback(
    (tipId: string) => {
      const set = new Set<string>(account.confirmedTipIds || [])
      set.add(tipId)
      updateAccount({ confirmedTipIds: Array.from(set) })
    },
    [account.confirmedTipIds, updateAccount]
  )

  const confirmAllPending = useCallback(() => {
    const set = new Set<string>(account.confirmedTipIds || [])
    pendingTips.forEach((t: LooseObject) => set.add(t.id))
    updateAccount({ confirmedTipIds: Array.from(set) })
  }, [account.confirmedTipIds, pendingTips, updateAccount])

  const setPayoutMethod = useCallback(
    (key: string, patch: LooseObject) => {
      const methods: LooseObject = { ...account.payoutMethods }
      methods[key] = { ...methods[key], ...patch }
      updateAccount({ payoutMethods: methods })
    },
    [account.payoutMethods, updateAccount]
  )

  const saveProfile = useCallback(
    (patch: LooseObject) => {
      updateAccount(patch)

      if (patch.fullName !== undefined || patch.phone !== undefined) {
        const fullName = (patch.fullName ?? account.fullName ?? '').trim()
        ;(updateUserProfileMutation.mutate as any)({
          firstName: fullName.split(' ')[0] || '',
          lastName: fullName.split(' ').slice(1).join(' ') || '',
          phoneNumber: patch.phone ?? account.phone ?? '',
        }, {
          onError: (err: unknown) => logger.error('[StaffAccountContext] Failed to persist user profile', err),
        })
      }
      if (patch.defaultDisplayName !== undefined || patch.bio !== undefined) {
        const displayName = (patch.defaultDisplayName ?? account.defaultDisplayName ?? account.fullName ?? '').trim()
        if (displayName) {
          ;(updateStaffProfileMutation.mutate as any)({
            displayName,
            bio: patch.bio ?? account.bio ?? '',
          }, {
            onError: (err: unknown) => logger.error('[StaffAccountContext] Failed to persist staff profile', err),
          })
        }
      }
    },
    [updateAccount, account, updateUserProfileMutation, updateStaffProfileMutation]
  )

  const setBusinessDisplayName = useCallback(
    (linkId: string, name: string) => {
      const map: LooseObject = { ...(account.displayNamesByBusiness || {}) }
      map[linkId] = name
      updateAccount({ displayNamesByBusiness: map })
    },
    [account.displayNamesByBusiness, updateAccount]
  )

  const setPushPreference = useCallback(
    (key: string, value: unknown) => {
      updateAccount({ pushPreferences: { ...account.pushPreferences, [key]: value } })
    },
    [account.pushPreferences, updateAccount]
  )

  const markNotificationRead = useCallback(
    (notiId: string) => {
      const set = new Set<string>(account.notificationsRead || [])
      set.add(notiId)
      updateAccount({ notificationsRead: Array.from(set) })
    },
    [account.notificationsRead, updateAccount]
  )

  const value: StaffAccountContextValue = {
    staffId,
    staffMember,
    businessName,
    account,
    tips,
    pendingTips,
    kpis,
    linkedBusinesses,
    notifications,
    unreadCount: notifications.filter((n: LooseObject) => !n.read).length,
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

export function useStaffAccount(): StaffAccountContextValue {
  const ctx = useContext(StaffAccountContext)
  if (!ctx) throw new Error('useStaffAccount must be used within a StaffAccountProvider')
  return ctx
}
