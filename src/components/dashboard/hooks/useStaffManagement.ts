// Staff roster + staff-modal/form state and all staff CRUD handlers for the
// Dashboard. Refactored to use API mutation hooks instead of local setStaff().
// Extracted from Dashboard.jsx (Group 5).
import { useState } from 'react'
import { DEFAULT_PAYOUT_CONFIGS } from '../constants'
import { getPayoutConfigsFromMember } from '../utils'
import { isPhoneValid } from '../../CountryCodeSelect'
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

  // API mutation hooks ΓÇö all invalidate qk.merchantStaff() on success
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

  // Staff comes from the API query (useMerchantStaff) passed in as staffData.
  // No more local setStaff ΓÇö the query cache is the source of truth.
  const staff = staffData ?? []

  const [errors, setErrors] = useState<LooseObject>({})
  const [staffForm, setStaffForm] = useState<StaffFormState>({
    ...EMPTY_STAFF_FORM,
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS },
  })
  const [editingStaffId, setEditingStaffId] = useState<any | null>(null)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
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
    setErrors({})
  }

  const openAddStaff = () => {
    resetStaffForm()
    setIsStaffModalOpen(true)
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

  const openEditStaff = (member) => {
    setEditingStaffId(member.id)
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
    setIsStaffModalOpen(true)
  }

  const closeStaffModal = () => {
    setIsStaffModalOpen(false)
    resetStaffForm()
  }

  /**
   * Save staff ΓÇö for editing existing staff, this is a local UI operation
   * since Swagger does not expose a merchant endpoint to edit staff profiles.
   * For adding new staff, the merchant should use invite or link request instead.
   */
  const saveStaff = () => {
    const nextErrors: LooseObject = {}
    if (!staffForm.fullName.trim()) nextErrors.fullName = t('components.dashboard.hooks.useStaffManagement.fullNameRequired')
    if (staffForm.email?.trim() && !/\S+@\S+\.\S+/.test(staffForm.email.trim())) {
      nextErrors.email = t('setup.errors.staff_email_invalid')
    }
    if (staffForm.phone?.trim() && !isPhoneValid(staffForm.phone.trim())) {
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
   * Calls POST /api/v1/merchant/staff/invite ΓÇö no local state mutation.
   */
  const sendSetupLinkFromModal = (formDetails) => {
    const nextErrors: LooseObject = {}
    if (!formDetails.fullName.trim()) nextErrors.fullName = t('components.dashboard.hooks.useStaffManagement.fullNameRequiredToInvite')
    if (!formDetails.email.trim() && !formDetails.phone.trim()) {
      nextErrors.email = t('components.dashboard.hooks.useStaffManagement.phoneOrEmailRequired')
    } else {
      if (formDetails.email?.trim() && !/\S+@\S+\.\S+/.test(formDetails.email.trim())) {
        nextErrors.email = t('setup.errors.staff_email_invalid')
      }
      if (formDetails.phone?.trim() && !isPhoneValid(formDetails.phone.trim())) {
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
  const handleLinkStaff = (searchResult) => {
    if (!searchResult?.staffProfileId) return

    linkRequestMutation.mutate({
      staffProfileId: searchResult.staffProfileId,
      staffCode: searchResult.staffCode ?? null,
    }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.linkRequestSent', { name: searchResult.fullName }), 'success')
      },
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.linkRequestFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  /**
   * Invite new staff (from StaffView invite tab).
   * Calls POST /api/v1/merchant/staff/invite.
   */
  const handleInviteStaff = (name, contact, role) => {
    const isEmail = contact.includes('@')

    inviteStaffMutation.mutate({
      name: name.trim(),
      email: isEmail ? contact.trim() : null,
      phone: isEmail ? null : contact.trim(),
      position: role || 'Nail Tech',
    }, {
      onSuccess: () => {
        showToast(t('components.dashboard.hooks.useStaffManagement.inviteSent', { name: name.trim() }), 'success')
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
   * Accept a join request ΓÇö update status to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleAcceptJoinRequest = (staffId) => {
    const member = staff.find(s => s.id === staffId)
    const linkId = member?.staffLinkId || member?.id
    if (!linkId) return

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
   * Decline a join request ΓÇö reject the pending link.
   * Calls PUT /api/v1/merchant/staff/links/{linkId}/reject (the status-update
   * route only accepts "Active" | "Inactive" and 400s on "Rejected").
   */
  const handleDeclineJoinRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.declineJoinConfirm', { name: member.fullName }))
    if (!ok) return

    const linkId = member.staffLinkId || member.id
    if (linkId) {
      rejectLinkMutation.mutate(linkId, {
        onError: (err) => {
          showToast(t('components.dashboard.hooks.useStaffManagement.declineFailed', { error: errMsg(err) }), 'error')
        }
      })
    }
  }

  /**
   * Accept an unlink request ΓÇö remove the staff link.
   * Calls DELETE /api/v1/merchant/staff/{staffLinkId}.
   */
  const handleAcceptUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.approveUnlinkConfirm', { name: member.fullName }))
    if (!ok) return

    if (member.id) {
      removeStaffMutation.mutate(member.id, {
        onSuccess: () => {
          showToast(t('components.dashboard.hooks.useStaffManagement.staffUnlinkedSuccessfully'), 'success')
        },
        onError: (err) => {
          showToast(t('components.dashboard.hooks.useStaffManagement.unlinkFailed', { error: errMsg(err) }), 'error')
        }
      })
    }
  }

  /**
   * Decline an unlink request ΓÇö update status back to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleDeclineUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(t('components.dashboard.hooks.useStaffManagement.declineUnlinkConfirm', { name: member.fullName }))
    if (!ok) return

    if (member.id) {
      updateStatusMutation.mutate({ staffLinkId: member.id, status: 'Active' }, {
        onSuccess: () => {
          showToast(t('components.dashboard.hooks.useStaffManagement.declinedUnlinkRequest'), 'success')
        },
        onError: (err) => {
          showToast(t('components.dashboard.hooks.useStaffManagement.declineFailed', { error: errMsg(err) }), 'error')
        }
      })
    }
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

    const newStatus = member.showInTipsFlow ? 'Inactive' : 'Active'
    updateStatusMutation.mutate({ staffLinkId: member.id, status: newStatus }, {
      onError: (err) => {
        showToast(t('components.dashboard.hooks.useStaffManagement.tipsFlowUpdateFailed', { error: errMsg(err) }), 'error')
      }
    })
  }

  return {
    staff,
    isStaffLoading,
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
