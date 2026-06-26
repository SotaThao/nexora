import { useMemo } from 'react'
import { useStaffBusinesses } from '../../../data/hooks/useStaffSelf'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { resolveStaffBusinessLinkStatusLabel } from '../../../utils/staffBusinessLinkStatus'

/** Linked businesses for staff — fetch only when the calling screen is mounted. */
export function useStaffLinkedBusinesses({ enabled = true } = {}) {
  const { account } = useStaffAccount()
  const {
    data: staffBusinesses = null,
    isPending,
    isFetching,
  } = useStaffBusinesses({ enabled })

  const linkedBusinesses = useMemo(() => {
    if (!Array.isArray(staffBusinesses) || !staffBusinesses.length) return []
    return staffBusinesses.map((b) => ({
      businessStaffLinkId: b.businessId,
      businessName: b.businessName,
      businessSlug: b.businessSlug ?? null,
      touchPointSlug: b.touchPointSlug ?? null,
      tipUrl: b.tipUrl ?? null,
      qrImageUrl: b.qrImageUrl ?? null,
      displayName: account.displayNamesByBusiness?.[b.businessId] || account.defaultDisplayName,
      status: resolveStaffBusinessLinkStatusLabel(b),
      linkStatus: b.linkStatus,
      linkStatusLabel: b.linkStatusLabel,
      logoUrl: b.logoUrl,
      role: b.roleLabel || b.role || null,
      linkedAt: b.linkedAt,
    }))
  }, [staffBusinesses, account.displayNamesByBusiness, account.defaultDisplayName])

  return {
    linkedBusinesses,
    isLoading: isPending || isFetching,
  }
}
