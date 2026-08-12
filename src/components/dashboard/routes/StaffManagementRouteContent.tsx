import { useMemo } from 'react'
import { Navigate, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { useMerchantStaffByCode } from '../../../data/hooks/useMerchantStaff'
import StaffDetailView from '../../StaffDetailView'
import { SkeletonList } from '../../ui/skeleton'
import { normaliseMember } from '../hooks/useStaffManagement'
import StaffView from '../views/StaffView'
import {
  buildStaffRoutePath,
  type StaffRouteFamily,
} from './staffRoutePaths'

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
  const { staffId: staffKey } = useParams()
  const {
    data: staffMember,
    isLoading,
    isError,
  } = useMerchantStaffByCode(staffKey)

  const fallbackMember = useMemo(
    () => ctx.staff.find((member) =>
      String(member.id) === String(staffKey) ||
      String(member.staffProfileId) === String(staffKey) ||
      String(member.staffCode) === String(staffKey) ||
      String(member.linkId) === String(staffKey)),
    [ctx.staff, staffKey],
  )
  const resolvedMember = staffMember ?? fallbackMember

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
      onBack={null}
      onViewStaff={ctx.openViewStaff}
      onQr={ctx.previewQr}
      onDelete={ctx.deleteStaff}
    />
  )
}
