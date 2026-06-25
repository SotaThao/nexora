import React, { createContext, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { DomainRecord, StaffAccountContextValue } from '../types/contexts'
import { logger } from '../utils/logger'
import { makeDefaultStaffAccount } from '../components/staff-dashboard/data/staffMockData'
import { useSaveStaffAccount as useSaveStaffAccountQuery } from '../data/hooks/useStaffAccount'
import profileSettingsRepository from '../data/repositories/profileSettings'
import staffSelfRepository from '../data/repositories/staffSelf'
import { useUpdateStaffProfile } from '../data/hooks/useProfileSettings'
import { useAuth } from '../auth/useAuth'
import { qk } from '../data/queryKeys'
import { buildUpdateStaffProfileDto, mapStaffProfileView } from '../utils/mapStaffProfileView'

const StaffAccountContext = createContext<StaffAccountContextValue | null>(null)

interface StaffAccountProviderProps {
  staffId?: string | null
  children: ReactNode
}

/**
 * Shared staff shell state: identity from auth cache, local account blob, mutations.
 * Page-specific APIs are fetched inside each route view (lazy per tab).
 */
export function StaffAccountProvider({ staffId = null, children }: StaffAccountProviderProps) {
  const { session } = useAuth()
  const queryClient = useQueryClient()

  const saveStaffAccountMutation = useSaveStaffAccountQuery()
  const updateStaffProfileMutation = useUpdateStaffProfile()

  // Subscribe to auth-bootstrapped profile cache (no network unless cache miss).
  const { data: userProfileRaw = null } = useQuery({
    queryKey: qk.userProfile(),
    queryFn: () => profileSettingsRepository.get(),
    enabled: false,
  })
  const { data: staffProfileRaw = null } = useQuery({
    queryKey: qk.staffProfile(),
    queryFn: () => staffSelfRepository.getMyProfile(),
    enabled: false,
  })
  const userProfile = userProfileRaw as DomainRecord | null
  const staffProfile = staffProfileRaw as DomainRecord | null

  const staffMember = useMemo(() => {
    const mapped = mapStaffProfileView(userProfile as DomainRecord | null, staffProfile as DomainRecord | null)
    return {
      id: staffId || mapped.staffCode || session?.staffId || session?.staffCode || '',
      fullName: mapped.fullName || session?.displayName || '',
      nickname: mapped.displayName || session?.displayName || '',
      email: mapped.email || session?.email || '',
      phone: mapped.phone || '',
      isActive: true,
      showInTipsFlow: true,
      paymentAccounts: {},
    }
  }, [staffId, session, userProfile, staffProfile])

  const account = useMemo(() => {
    const base = makeDefaultStaffAccount(staffMember) as DomainRecord
    const mapped = mapStaffProfileView(userProfile as DomainRecord | null, staffProfile as DomainRecord | null)
    if (!userProfile && !staffProfile) return base

    return {
      ...base,
      fullName: mapped.fullName || base.fullName,
      phone: mapped.phone || base.phone,
      email: mapped.email || base.email,
      defaultDisplayName: mapped.displayName || base.defaultDisplayName,
      bio: mapped.bio || base.bio,
      avatar: mapped.avatar || base.avatar,
      staffCode: mapped.staffCode || base.staffCode || session?.staffCode || null,
      position: mapped.position || base.position || null,
    }
  }, [staffMember, userProfile, staffProfile, session?.staffCode])

  const updateAccount = useCallback(
    (patch) => {
      const base = { ...makeDefaultStaffAccount(staffMember), ...account }
      const nextAccount = { ...base, ...patch }
      saveStaffAccountMutation.mutate({ staffId, data: patch })
      return nextAccount
    },
    [staffId, staffMember, account, saveStaffAccountMutation]
  )

  const confirmTip = useCallback(
    (tipId) => {
      const set = new Set(account.confirmedTipIds || [])
      set.add(tipId)
      updateAccount({ confirmedTipIds: Array.from(set) })
    },
    [account.confirmedTipIds, updateAccount]
  )

  const confirmAllPending = useCallback(
    (tipIds: string[] = []) => {
      const set = new Set(account.confirmedTipIds || [])
      tipIds.forEach((id) => set.add(id))
      updateAccount({ confirmedTipIds: Array.from(set) })
    },
    [account.confirmedTipIds, updateAccount]
  )

  const setPayoutMethod = useCallback(
    (key, patch) => {
      const methods = { ...account.payoutMethods }
      methods[key] = { ...methods[key], ...patch }
      updateAccount({ payoutMethods: methods })
    },
    [account.payoutMethods, updateAccount]
  )

  const saveProfile = useCallback(
    async (patch) => {
      const { avatar, photoUrl, ...accountPatch } = patch
      if (Object.keys(accountPatch).length > 0) {
        updateAccount(accountPatch)
      }

      const hasProfileFields =
        patch.fullName !== undefined
        || patch.phone !== undefined
        || patch.defaultDisplayName !== undefined
        || patch.displayName !== undefined
        || patch.bio !== undefined
        || patch.position !== undefined
        || avatar !== undefined
        || photoUrl !== undefined

      if (!hasProfileFields) return

      const dto = buildUpdateStaffProfileDto(
        { account, userProfile, staffProfile },
        { ...patch, avatar: photoUrl ?? avatar ?? patch.avatar },
      )

      if (!dto.displayName) return

      try {
        await updateStaffProfileMutation.mutateAsync(dto)
      } catch (err) {
        logger.error('[StaffAccountContext] Failed to persist staff profile', err)
        throw err
      }
    },
    [updateAccount, account, userProfile, staffProfile, updateStaffProfileMutation]
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

  const cachedSummary = queryClient.getQueryData<DomainRecord>(qk.staffDashboardSummary())
  const unreadCount = Number(cachedSummary?.pendingTips?.count) || 0

  const value = {
    staffId,
    staffMember,
    businessName: '',
    account,
    unreadCount,
    confirmTip,
    confirmAllPending,
    setPayoutMethod,
    saveProfile,
    setBusinessDisplayName,
    setPushPreference,
    markNotificationRead,
  }

  return <StaffAccountContext.Provider value={value}>{children}</StaffAccountContext.Provider>
}

export function useStaffAccount() {
  const ctx = useContext(StaffAccountContext)
  if (!ctx) throw new Error('useStaffAccount must be used within a StaffAccountProvider')
  return ctx
}
