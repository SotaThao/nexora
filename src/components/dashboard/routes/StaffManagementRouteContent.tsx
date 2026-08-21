import { useMemo } from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMerchantStaff, useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import { enrichStaffMemberChatIdentity } from '../../staff/staffCommunityChatUtils'
import StaffDetailView from '../../StaffDetailView'
import { SkeletonList } from '../../ui/skeleton'
import { normaliseMember } from '../hooks/useStaffManagement'
import StaffView from '../views/StaffView'
import {
  buildStaffRoutePath,
  type StaffRouteFamily,
} from './staffRoutePaths'

function staffMemberMatchesRouteKey(member: {
  id?: string | null
  staffProfileId?: string | null
  staffCode?: string | null
  linkId?: string | null
}, staffKey: string) {
  return (
    String(member.id) === String(staffKey)
    || String(member.staffProfileId) === String(staffKey)
    || String(member.staffCode) === String(staffKey)
    || String(member.linkId) === String(staffKey)
  )
}

export function StaffListRouteContent({
  routeFamily,
}: {
  routeFamily: StaffRouteFamily
}) {
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
      onViewDetail={(member) =>
        navigate(buildStaffRoutePath(routeFamily, member.staffCode || member.id))
      }
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

export function StaffDetailRouteContent({
  routeFamily,
}: {
  routeFamily: StaffRouteFamily
}) {
  const ctx = useOutletContext<LooseObject>()
  const navigate = useNavigate()
  const { staffId: staffKey } = useParams()
  const {
    data: staffMember,
    isLoading,
    isError,
  } = useMerchantStaffByCode(staffKey)

  const fallbackMember = useMemo(
    () => ctx.staff.find((member) => staffMemberMatchesRouteKey(member, staffKey)),
    [ctx.staff, staffKey],
  )

  // Fallback when detail has no userProfileId (e.g. local staff / older payloads).
  const detailMissingUserProfileId = Boolean(
    staffMember && !String(staffMember.userProfileId ?? '').trim(),
  )
  const { data: staffListLookup } = useMerchantStaff({
    keyword: staffKey || undefined,
    pageSize: 10,
    enabled: Boolean(staffKey)
      && detailMissingUserProfileId
      && staffMember?.isLocalStaff !== true
      && !fallbackMember?.userProfileId,
  })

  const listIdentityMember = useMemo(() => {
    const fromLookup = staffListLookup?.items?.find((member) =>
      staffMemberMatchesRouteKey(member, staffKey),
    )
    return fromLookup ?? fallbackMember ?? null
  }, [staffListLookup?.items, fallbackMember, staffKey])

  const resolvedMember = useMemo(
    () => enrichStaffMemberChatIdentity(staffMember, listIdentityMember) ?? listIdentityMember,
    [staffMember, listIdentityMember],
  )

  if (isLoading || (!resolvedMember && ctx.staffLoading)) {
    return (
      <div className="nexora-card p-6">
        <SkeletonList count={3} showAvatar lines={2} />
      </div>
    )
  }

  if ((isError && !fallbackMember) || !resolvedMember) {
    return <Navigate to={buildStaffRoutePath(routeFamily)} replace />
  }

  return (
    <StaffDetailView
      staffMember={normaliseMember(resolvedMember)}
      staffProfileId={resolvedMember.staffProfileId ?? null}
      onBack={() => navigate(buildStaffRoutePath(routeFamily))}
      onViewStaff={ctx.openViewStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
  )
}
