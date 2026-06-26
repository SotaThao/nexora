// Staff roster + staff-modal/form state and all staff CRUD handlers for the
// Dashboard. Refactored to use API mutation hooks instead of local setStaff().
// Extracted from Dashboard.jsx (Group 5).
import { useState, useEffect } from 'react'
import { DEFAULT_PAYOUT_CONFIGS } from '../constants'
import { getPayoutConfigsFromMember } from '../utils'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  useInviteStaff,
  useResendStaffInvite,
  useSendStaffLinkRequest,
  useUpdateMerchantStaffStatus,
  useApproveMerchantStaffLink,
  useRejectMerchantStaffLink,
  useRemoveMerchantStaff,
  useCancelStaffInvite,
} from '../../../data/hooks/useMerchantStaff'
import { EMPTY_STAFF_FORM, type StaffFormState } from '../../../types/forms'
import { getApiErrorCode } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { isValidEmail, isValidPhone } from '../../../utils/validation'

/**
 * Normalise a raw staff-list member into the shape the dashboard uses.
 * Shared by the useState initialiser and the Dashboard seeding effects.
 */
export function normaliseMember(member) {
  return {
    id: member.id,
    fullName: member.fullName,
    nickname: member.nickname,
    position: member.position,
    avatar: member.avatar || '',
    phone: member.phone || member.invitedPhone || '',
    email: member.email || member.invitedEmail || '',
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
    payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member),
    // Preserve API identifiers
    staffLinkId: member.staffLinkId ?? null,
    linkId: member.linkId ?? member.staffLinkId ?? member.id ?? null,
    inviteId: member.inviteId ?? null,
    staffProfileId: member.staffProfileId ?? null,
    staffCode: member.staffCode ?? null,
    refCode: member.refCode ?? null,
    source: member.source ?? null,
    itemType: member.itemType ?? null,
    sortOrder: member.sortOrder ?? 0,
    tipCount: member.tipCount ?? 0,
    averageRating: member.averageRating ?? 0,
    joinedDate: member.joinedDate ?? null,
    roleAtBusiness: member.roleAtBusiness ?? null,
  }
}

/**
 * @param {object} opts
 * @param {Array} opts.staffData - Staff data from useMerchantStaff() query
 * @param {boolean} opts.isStaffLoading - Loading state from useMerchantStaff()
 * @param {string} opts.businessName
 * @param {string|null} opts.viewingStaffDetailId
 * @param {Function} opts.setViewingStaffDetailId
 */
export function useStaffManagement({
  staffData,
  isStaffLoading,
  businessName,
  viewingStaffDetailId = null,
  setViewingStaffDetailId = (_id: string | null) => {},
}) {
  const { t } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  // API mutation hooks — all invalidate qk.merchantStaff() on success
  const inviteStaffMutation = useInviteStaff()
  const resendInviteMutation = useResendStaffInvite()
  const linkRequestMutation = useSendStaffLinkRequest()
  const updateStatusMutation = useUpdateMerchantStaffStatus()
  const approveLinkMutation = useApproveMerchantStaffLink()
  const rejectLinkMutation = useRejectMerchantStaffLink()
  const removeStaffMutation = useRemoveMerchantStaff()
  const cancelInviteMutation = useCancelStaffInvite()

  // Map an API error to a localized, human-readable message (US-014 AC #11/#12).
  // Falls back to errors.unknown_error for unmapped server codes.
  const errMsg = (err: unknown) => t(getErrorI18nKey(getApiErrorCode(err)))

  const resolveStaffMember = (memberOrId: unknown) => {
    if (memberOrId && typeof memberOrId === 'object') return memberOrId
    const id = String(memberOrId ?? '')
    if (!id) return null
    return staff.find((item) =>
      item.id === id ||
      item.staffLinkId === id ||
      item.linkId === id ||
      item.inviteId === id,
    ) ?? null
  }

  const getStaffLinkId = (member: { staffLinkId?: string | null; linkId?: string | null; id?: string | null }) =>
    member.staffLinkId || member.linkId || member.id || null

  // Staff comes from the API query (useMerchantStaff) passed in as staffData.
  // No more local setStaff — the query cache is the source of truth.
  const staff = Array.isArray(staffData) ? staffData : (staffData?.items ?? [])

  const [errors, setErrors] = useState<LooseObject>({})
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    ...EMPTY_STAFF_FORM,
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS },
  })
  const [editingStaffId, setEditingStaffId] = useState<any | null>(null)
  const [isStaffViewOnly, setIsStaffViewOnly] = useState(false)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [approvingStaffMember, setApprovingStaffMember] = useState<any | null>(null)
  const [isInviteShareOpen, setIsInviteShareOpen] = useState(false)
  const [inviteShareDefaultName, setInviteShareDefaultName] = useState('')
  const [inviteShareDefaultContact, setInviteShareDefaultContact] = useState('')

  const resetStaffForm = () => {
    setStaffForm({
      ...EMPTY_STAFF_FORM,
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS },
    })
    setEditingStaffId(null)
    setIsStaffViewOnly(false)
    setErrors({})
  }

  const openAddStaff = () => {
    setIsAddStaffModalOpen(true)
  }

  const closeAddStaffModal = () => {
    setIsAddStaffModalOpen(false)
  }

  const openApproveStaff = (member) => {
    setApprovingStaffMember(member)
    setStaffForm({
      fullName: member.fullName,
      nickname: member.nickname || member.fullName?.split(' ')[0] || '',
      position: member.position,
      avatar: member.avatar || '',
      phone: member.phone || '',
      email: member.email || '',
      venmo: member.paymentAccounts?.venmo || '',
      cashapp: member.paymentAccounts?.cashapp || '',
      zelle: member.paymentAccounts?.zelle || '',
      vlinkpay: member.paymentAccounts?.vlinkpay || '',
      nexoraStaffId: member.staffCode || '',
      showInTipsFlow: member.showInTipsFlow !== false,
      payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
    })
    setErrors({})
    setIsApproveModalOpen(true)
  }

  const populateStaffForm = (member) => {
    setStaffForm({
      fullName: member.fullName,
      nickname: member.nickname || member.fullName?.split(' ')[0] || '',
      position: member.position,
      avatar: member.avatar || '',
      phone: member.phone || '',
      email: member.email || '',
      venmo: member.paymentAccounts?.venmo || '',
      cashapp: member.paymentAccounts?.cashapp || '',
      zelle: member.paymentAccounts?.zelle || '',
      vlinkpay: member.paymentAccounts?.vlinkpay || '',
      nexoraStaffId: member.staffCode || '',
      showInTipsFlow: member.showInTipsFlow !== false,
      payoutConfigs: member.payoutConfigs || getPayoutConfigsFromMember(member)
    })
    setErrors({})
  }

  const openEditStaff = (member) => {
    setIsStaffViewOnly(false)
    setEditingStaffId(member.id)
    populateStaffForm(member)
    setIsStaffModalOpen(true)
  }

  const openViewStaff = (member) => {
    setIsStaffViewOnly(true)
    setEditingStaffId(member.id)
    populateStaffForm(member)
    setIsStaffModalOpen(true)
  }

  const closeStaffModal = () => {
    setIsStaffModalOpen(false)
    resetStaffForm()
  }

  /**
   * Save staff — for editing existing staff, this is a local UI operation
   * since Swagger does not expose a merchant endpoint to edit staff profiles.
   * For adding new staff, the merchant should use invite or link request instead.
   */
  const saveStaff = () => {
    const nextErrors: LooseObject = {}
    if (!staffForm.fullName.trim()) nextErrors.fullName = t('components.dashboard.hooks.useStaffManagement.fullNameRequired')
    if (staffForm.email?.trim() && !isValidEmail(staffForm.email)) {
      nextErrors.email = t('setup.errors.staff_email_invalid')
    }
    if (staffForm.phone?.trim() && !isValidPhone(staffForm.phone)) {
      nextErrors.phone = t('setup.errors.staff_phone_invalid')
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    // Editing is view-only in API mode since merchant cannot mutate staff profiles.
    // New staff creation should go through invite or link request flows.
    closeStaffModal()
  }

  /**
   * Send invite via the InviteShareModal (from StaffModal).
   * Calls POST /api/v1/merchant/staff/invite — no local state mutation.
   */
  const sendSetupLinkFromModal = (formDetails) => {
    const nextErrors: LooseObject = {}
    if (!formDetails.fullName.trim()) nextErrors.fullName = t('components.dashboard.hooks.useStaffManagement.fullNameRequiredToInvite')
    if (!formDetails.email.trim() && !formDetails.phone.trim()) {
      nextErrors.email = t('components.dashboard.hooks.useStaffManagement.phoneOrEmailRequired')
    } else {
      if (formDetails.email?.trim() && !isValidEmail(formDetails.email)) {
        nextErrors.email = t('setup.errors.staff_email_invalid')
      }
      if (formDetails.phone?.trim() && !isValidPhone(formDetails.phone)) {
        nextErrors.phone = t('setup.errors.staff_phone_invalid')
      }
    }
    
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const isEmail = formDetails.email?.trim()

    inviteStaffMutation.mutate({
      name: formDetails.fullName.trim(),
      email: isEmail || null,
      phone: formDetails.phone?.trim() || null,
      position: formDetails.position?.trim() || 'Nail Tech',
    }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteSent', { name: formDetails.fullName.trim() }), 'success')
        closeStaffModal()
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Link an existing staff profile from search results.
   * Calls POST /api/v1/merchant/staff/link-request/{staffProfileId}.
   */
  const handleLinkStaff = (searchResult, role?, { onSuccess } = {}) => {
    if (!searchResult?.staffProfileId) return

    const roleAtBusiness =
      (typeof role === 'string' ? role.trim() : '') ||
      String(searchResult.position || searchResult.roleAtBusiness || '').trim() ||
      'Nail Technician'

    linkRequestMutation.mutate({
      staffProfileId: searchResult.staffProfileId,
      staffCode: searchResult.staffCode ?? null,
      roleAtBusiness,
    }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.linkRequestSent', { name: searchResult.fullName }), 'success')
        onSuccess?.()
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.linkRequestFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Invite new staff (from Add Staff modal).
   * Calls POST /api/v1/merchant/staff/invite.
   */
  const handleInviteStaff = (name, contact, role, _method?, { onSuccess } = {}) => {
    const isEmail = contact.includes('@')

    inviteStaffMutation.mutate({
      name: name.trim(),
      email: isEmail ? contact.trim() : null,
      phone: isEmail ? null : contact.trim(),
      position: role || 'Nail Tech',
    }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteSent', { name: name.trim() }), 'success')
        onSuccess?.()
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Cancel/revoke a pending invite (US-014).
   * Calls DELETE /api/v1/merchant/staff/invites/{inviteId} (v3.3 dedicated endpoint).
   */
  const handleCancelInvite = async (member) => {
    if (!member?.inviteId) {
      showToast(t('components.dashboard.hooks.useStaffManagement.cancelInviteMissingId'), 'error')
      return
    }

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.cancelInviteConfirm', {
      name: member.fullName || member.invitedEmail || t('components.dashboard.hooks.useStaffManagement.thisPerson'),
    }))
    if (!ok) return

    cancelInviteMutation.mutate(member.inviteId, {
      onSuccess: () => {
        if (viewingStaffDetailId === member.id) {
          setViewingStaffDetailId(null)
        }
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteCancelled'), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.cancelInviteFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Resend a pending invite.
   * Calls POST /api/v1/merchant/staff/{inviteId}/resend.
   */
  const handleResendInvite = (member) => {
    if (!member?.inviteId) {
      showToast(t('components.dashboard.hooks.useStaffManagement.resendInviteMissingId'), 'error')
      return
    }

    resendInviteMutation.mutate(member.inviteId, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.resendInviteSuccess', { name: member.fullName }), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.resendInviteFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Accept a join request — update status to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleAcceptJoinRequest = (memberOrId) => {
    const member = resolveStaffMember(memberOrId)
    const linkId = member ? getStaffLinkId(member) : null
    if (!member || !linkId) return

    approveLinkMutation.mutate(linkId, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.joinAccepted', { name: member.fullName }), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.acceptFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Decline a join request.
   * - Pending invite  -> DELETE /api/v1/merchant/staff/invites/{inviteId}
   * - Pending link    -> PUT /api/v1/merchant/staff/links/{linkId}/reject
   */
  const handleDeclineJoinRequest = async (memberOrId) => {
    const member = resolveStaffMember(memberOrId)
    if (!member) return

    if (member.itemType === 'invite' && member.inviteId) {
      await handleCancelInvite(member)
      return
    }

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.declineJoinConfirm', { name: member.fullName }))
    if (!ok) return

    const linkId = getStaffLinkId(member)
    if (!linkId) return

    rejectLinkMutation.mutate(linkId, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.joinDeclined', { name: member.fullName }), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.declineFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Accept an unlink request — remove the staff link.
   * Calls DELETE /api/v1/merchant/staff/{staffLinkId}.
   */
  const handleAcceptUnlinkRequest = async (memberOrId) => {
    const member = resolveStaffMember(memberOrId)
    if (!member) return

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.approveUnlinkConfirm', { name: member.fullName }))
    if (!ok) return

    const staffLinkId = getStaffLinkId(member)
    if (!staffLinkId) return

    removeStaffMutation.mutate(staffLinkId, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.staffUnlinkedSuccessfully'), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.unlinkFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Decline an unlink request — update status back to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleDeclineUnlinkRequest = async (memberOrId) => {
    const member = resolveStaffMember(memberOrId)
    if (!member) return

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.declineUnlinkConfirm', { name: member.fullName }))
    if (!ok) return

    const staffLinkId = getStaffLinkId(member)
    if (!staffLinkId) return

    updateStatusMutation.mutate({ staffLinkId, status: 'Active' }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.declinedUnlinkRequest'), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.declineFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Delete a staff roster entry.
   * - Pending invite items ΓåÆ cancel via DELETE /api/v1/merchant/staff/invites/{inviteId}
   *   (v3.3 dedicated endpoint).
   * - Linked staff items ΓåÆ unlink via DELETE /api/v1/merchant/staff/{staffLinkId}.
   */
  const deleteStaff = async (id) => {
    const member = staff.find(s => s.id === id)
    if (!member) return

    // Pending invites use the dedicated cancel endpoint (handles its own confirm/toast).
    if (member.itemType === 'invite' && member.inviteId) {
      await handleCancelInvite(member)
      return
    }

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.deleteThisStaffMember'))
    if (!ok) return

    const linkId = member.id
    if (linkId) {
      removeStaffMutation.mutate(linkId, {
        onSuccess: () => {
          if (viewingStaffDetailId === id) {
            setViewingStaffDetailId(null)
          }
        },
        onError: (err) => {
          showToast(t('components.dashboard.hooks.useStaffManagement.deleteFailed', { error: errMsg(err) }), 'error')
        }
      })
    }
  }

  /**
   * Toggle staff active/inactive status.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const toggleStaff = (id) => {
    const member = staff.find(s => s.id === id)
    if (!member?.id) return
    if (updateStatusMutation.isPending && updateStatusMutation.variables?.staffLinkId === member.id) {
      return
    }

    const newStatus = member.isActive ? 'Inactive' : 'Active'
    updateStatusMutation.mutate({ staffLinkId: member.id, status: newStatus }, {
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.statusUpdateFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Toggle staff tips flow visibility.
   * In API mode, tips flow is derived from active status (showInTipsFlow = isActive).
   * Toggling tips flow is equivalent to toggling status.
   */
  const toggleStaffTipsFlow = (id) => {
    const member = staff.find(s => s.id === id)
    if (!member?.id) return
    if (updateStatusMutation.isPending && updateStatusMutation.variables?.staffLinkId === member.id) {
      return
    }

    const willShowInTipsFlow = member.showInTipsFlow === false
    const newStatus = member.showInTipsFlow !== false ? 'Inactive' : 'Active'
    const displayName = member.fullName || member.nickname || t('components.dashboard.hooks.useStaffManagement.thisPerson')

    updateStatusMutation.mutate({ staffLinkId: member.id, status: newStatus }, {
      onSuccess: () => {
        showToast(
          willShowInTipsFlow
            ? t('components.dashboard.hooks.useStaffManagement.tipsFlowShown', { name: displayName })
            : t('components.dashboard.hooks.useStaffManagement.tipsFlowHidden', { name: displayName }),
          'success',
        )
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.tipsFlowUpdateFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  useEffect(() => {
    if (!isStaffModalOpen || !editingStaffId) return
    const member = staff.find((item) => item.id === editingStaffId)
    if (!member) return
    setStaffForm((prev) => ({
      ...prev,
      showInTipsFlow: member.showInTipsFlow !== false,
    }))
  }, [staff, editingStaffId, isStaffModalOpen])

  return {
    staff,
    isStaffLoading,
    staffForm, setStaffForm,
    errors, setErrors,
    editingStaffId, setEditingStaffId,
    isStaffViewOnly,
    isStaffModalOpen, setIsStaffModalOpen,
    isAddStaffModalOpen, setIsAddStaffModalOpen,
    isApproveModalOpen, setIsApproveModalOpen,
    approvingStaffMember, setApprovingStaffMember,
    isInviteShareOpen, setIsInviteShareOpen,
    inviteShareDefaultName, setInviteShareDefaultName,
    inviteShareDefaultContact, setInviteShareDefaultContact,
    resetStaffForm, openAddStaff, closeAddStaffModal, openApproveStaff, openEditStaff, openViewStaff, closeStaffModal,
    saveStaff, sendSetupLinkFromModal, handleLinkStaff, handleInviteStaff,
    handleResendInvite, handleCancelInvite,
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    // Expose mutation states for loading indicators
    inviteStaffMutation,
    resendInviteMutation,
    linkRequestMutation,
    approveLinkMutation,
    updateStatusMutation,
    removeStaffMutation,
    cancelInviteMutation,
  }
}
