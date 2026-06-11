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
  useRejectMerchantStaffLink,
  useRemoveMerchantStaff,
  useApproveStaffLink,
  useRejectStaffLink,
} from '../../../data/hooks/useMerchantStaff'

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
    inviteId: member.inviteId ?? null,
    staffProfileId: member.staffProfileId ?? null,
    staffCode: member.staffCode ?? null,
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
export function useStaffManagement({ staffData, isStaffLoading, businessName, viewingStaffDetailId, setViewingStaffDetailId }) {
  const { currentLanguage, t } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  // API mutation hooks — all invalidate qk.merchantStaff() on success
  const inviteStaffMutation = useInviteStaff()
  const resendInviteMutation = useResendStaffInvite()
  const linkRequestMutation = useSendStaffLinkRequest()
  const updateStatusMutation = useUpdateMerchantStaffStatus()
  const rejectLinkMutation = useRejectMerchantStaffLink()
  const removeStaffMutation = useRemoveMerchantStaff()
  const approveLinkMutation = useApproveStaffLink()
  const rejectLinkMutation = useRejectStaffLink()

  // Staff comes from the API query (useMerchantStaff) passed in as staffData.
  // No more local setStaff — the query cache is the source of truth.
  const staff = staffData ?? []

  const [errors, setErrors] = useState({})
  const [staffForm, setStaffForm] = useState({
    fullName: '',
    nickname: '',
    position: 'Nail Tech',
    avatar: '',
    phone: '',
    email: '',
    venmo: '',
    cashapp: '',
    zelle: '',
    vlinkpay: '',
    showInTipsFlow: true,
    payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
  })
  const [editingStaffId, setEditingStaffId] = useState(null)
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false)
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false)
  const [approvingStaffMember, setApprovingStaffMember] = useState(null)
  const [isInviteShareOpen, setIsInviteShareOpen] = useState(false)
  const [inviteShareDefaultName, setInviteShareDefaultName] = useState('')
  const [inviteShareDefaultContact, setInviteShareDefaultContact] = useState('')

  const resetStaffForm = () => {
    setStaffForm({
      fullName: '',
      nickname: '',
      position: 'Nail Tech',
      avatar: '',
      phone: '',
      email: '',
      venmo: '',
      cashapp: '',
      zelle: '',
      vlinkpay: '',
      nexoraStaffId: '',
      showInTipsFlow: true,
      payoutConfigs: { ...DEFAULT_PAYOUT_CONFIGS }
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
   * Save staff — for editing existing staff, this is a local UI operation
   * since Swagger does not expose a merchant endpoint to edit staff profiles.
   * For adding new staff, the merchant should use invite or link request instead.
   */
  const saveStaff = () => {
    const nextErrors = {}
    if (!staffForm.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (staffForm.email?.trim() && !/\S+@\S+\.\S+/.test(staffForm.email.trim())) {
      nextErrors.email = t('setup.errors.staff_email_invalid') || 'Invalid email address format.'
    }
    if (staffForm.phone?.trim() && !isPhoneValid(staffForm.phone.trim())) {
      nextErrors.phone = t('setup.errors.staff_phone_invalid') || 'Invalid phone number.'
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
    const nextErrors = {}
    if (!formDetails.fullName.trim()) nextErrors.fullName = 'Full name is required to invite.'
    if (!formDetails.email.trim() && !formDetails.phone.trim()) {
      nextErrors.email = 'Phone or email is required to send invite link.'
    } else {
      if (formDetails.email?.trim() && !/\S+@\S+\.\S+/.test(formDetails.email.trim())) {
        nextErrors.email = 'Invalid email address format.'
      }
      if (formDetails.phone?.trim() && !isPhoneValid(formDetails.phone.trim())) {
        nextErrors.phone = 'Invalid phone number.'
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
        showToast(
          currentLanguage === 'vi'
            ? `Đã gửi lời mời đến ${formDetails.fullName.trim()} thành công!`
            : `Invite sent to ${formDetails.fullName.trim()} successfully!`,
          'success'
        )
        closeStaffModal()
      },
      onError: (err) => {
        showToast(
          currentLanguage === 'vi'
            ? `Gửi lời mời thất bại: ${err?.errorCode || 'Lỗi không xác định'}`
            : `Failed to send invite: ${err?.errorCode || 'Unknown error'}`,
          'error'
        )
      }
    })
  }

  /**
   * Link an existing staff profile from search results.
   * Calls POST /api/v1/merchant/staff/link-request/{staffProfileId}.
   */
  const handleLinkStaff = (searchResult) => {
    if (!searchResult?.staffProfileId) return

    linkRequestMutation.mutate(searchResult.staffProfileId, {
      onSuccess: () => {
        showToast(
          currentLanguage === 'vi'
            ? `Đã gửi yêu cầu liên kết đến ${searchResult.fullName}!`
            : `Link request sent to ${searchResult.fullName}!`,
          'success'
        )
      },
      onError: (err) => {
        showToast(
          currentLanguage === 'vi'
            ? `Yêu cầu liên kết thất bại: ${err?.errorCode || 'Lỗi'}`
            : `Link request failed: ${err?.errorCode || 'Error'}`,
          'error'
        )
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
        showToast(
          currentLanguage === 'vi'
            ? `Đã gửi lời mời đến ${name.trim()} thành công!`
            : `Invite sent to ${name.trim()} successfully!`,
          'success'
        )
      },
      onError: (err) => {
        showToast(
          currentLanguage === 'vi'
            ? `Gửi lời mời thất bại: ${err?.errorCode || 'Lỗi không xác định'}`
            : `Failed to send invite: ${err?.errorCode || 'Unknown error'}`,
          'error'
        )
      }
    })
  }

  /**
   * Resend a pending invite.
   * Calls POST /api/v1/merchant/staff/{inviteId}/resend.
   */
  const handleResendInvite = (member) => {
    if (!member?.inviteId) {
      showToast(
        currentLanguage === 'vi'
          ? 'Không thể gửi lại lời mời: thiếu inviteId.'
          : 'Cannot resend invite: missing inviteId.',
        'error'
      )
      return
    }

    resendInviteMutation.mutate(member.inviteId, {
      onSuccess: () => {
        showToast(
          currentLanguage === 'vi'
            ? `Đã gửi lại link thiết lập thành công tới ${member.fullName}!`
            : `Setup link successfully resent to ${member.fullName}!`,
          'success'
        )
      },
      onError: (err) => {
        showToast(
          currentLanguage === 'vi'
            ? `Gửi lại thất bại: ${err?.errorCode || 'Lỗi'}`
            : `Resend failed: ${err?.errorCode || 'Error'}`,
          'error'
        )
      }
    })
  }

  /**
   * Accept a join request — update status to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleAcceptJoinRequest = (staffId) => {
    const member = staff.find(s => s.id === staffId)
    const linkId = member?.staffLinkId || member?.id
    if (!linkId) return

    approveLinkMutation.mutate(linkId, {
      onSuccess: () => {
        showToast(currentLanguage === 'vi' 
          ? `Đã chấp nhận thợ ${member.fullName || 'nhân viên'} vào tiệm!` 
          : `Accepted technician ${member.fullName || 'staff'} to salon!`, 'success')
      },
      onError: (err) => {
        showToast(
          currentLanguage === 'vi'
            ? `Chấp nhận thất bại: ${err?.errorCode || 'Lỗi'}`
            : `Accept failed: ${err?.errorCode || 'Error'}`,
          'error'
        )
      }
    })
  }

  /**
   * Decline a join request.
   * Calls PUT /api/v1/merchant/staff/links/{linkId}/reject.
   */
  const handleDeclineJoinRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi'
      ? `Bạn có chắc chắn muốn từ chối yêu cầu tham gia của thợ ${member.fullName}?`
      : `Are you sure you want to decline join request from ${member.fullName}?`)
    if (!ok) return

    const linkId = member.staffLinkId || member.id
    if (linkId) {
      rejectLinkMutation.mutate(linkId, {
        onSuccess: () => {
          showToast(currentLanguage === 'vi' 
            ? `Đã từ chối yêu cầu tham gia của thợ ${member.fullName}!` 
            : `Declined join request from ${member.fullName}!`, 'success')
        },
        onError: (err) => {
          showToast(
            currentLanguage === 'vi'
              ? `Từ chối thất bại: ${err?.errorCode || 'Lỗi'}`
              : `Decline failed: ${err?.errorCode || 'Error'}`,
            'error'
          )
        }
      })
    }
  }

  /**
   * Accept an unlink request — remove the staff link.
   * Calls DELETE /api/v1/merchant/staff/{staffLinkId}.
   */
  const handleAcceptUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn duyệt yêu cầu hủy liên kết của thợ ${member.fullName}?` 
      : `Are you sure you want to approve unlink request from ${member.fullName}?`)
    if (!ok) return

    if (member.id) {
      removeStaffMutation.mutate(member.id, {
        onSuccess: () => {
          showToast(currentLanguage === 'vi' ? 'Đã hủy liên kết nhân viên thành công.' : 'Staff unlinked successfully.', 'success')
        },
        onError: (err) => {
          showToast(
            currentLanguage === 'vi'
              ? `Hủy liên kết thất bại: ${err?.errorCode || 'Lỗi'}`
              : `Unlink failed: ${err?.errorCode || 'Error'}`,
            'error'
          )
        }
      })
    }
  }

  /**
   * Decline an unlink request — update status back to Active.
   * Calls PUT /api/v1/merchant/staff/{staffLinkId}/status.
   */
  const handleDeclineUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn từ chối yêu cầu hủy liên kết của thợ ${member.fullName}?` 
      : `Are you sure you want to decline unlink request from ${member.fullName}?`)
    if (!ok) return

    if (member.id) {
      updateStatusMutation.mutate({ staffLinkId: member.id, status: 'Active' }, {
        onSuccess: () => {
          showToast(currentLanguage === 'vi' ? 'Đã từ chối yêu cầu hủy liên kết.' : 'Declined unlink request.', 'success')
        },
        onError: (err) => {
          showToast(
            currentLanguage === 'vi'
              ? `Từ chối thất bại: ${err?.errorCode || 'Lỗi'}`
              : `Decline failed: ${err?.errorCode || 'Error'}`,
            'error'
          )
        }
      })
    }
  }

  /**
   * Delete/unlink a staff member.
   * For invite items: removes via DELETE /api/v1/merchant/staff/{staffLinkId}
   * For link items: removes via DELETE /api/v1/merchant/staff/{staffLinkId}
   */
  const deleteStaff = async (id) => {
    const member = staff.find(s => s.id === id)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi'
      ? 'Bạn có chắc chắn muốn xóa nhân viên này khỏi Nexora Touch?'
      : 'Delete this staff member from Nexora Touch?')
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
          showToast(
            currentLanguage === 'vi'
              ? `Xóa thất bại: ${err?.errorCode || 'Lỗi'}`
              : `Delete failed: ${err?.errorCode || 'Error'}`,
            'error'
          )
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
        showToast(
          currentLanguage === 'vi'
            ? `Cập nhật trạng thái thất bại: ${err?.errorCode || 'Lỗi'}`
            : `Status update failed: ${err?.errorCode || 'Error'}`,
          'error'
        )
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
        showToast(
          currentLanguage === 'vi'
            ? `Cập nhật tips flow thất bại: ${err?.errorCode || 'Lỗi'}`
            : `Tips flow update failed: ${err?.errorCode || 'Error'}`,
          'error'
        )
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
    handleResendInvite,
    handleAcceptJoinRequest, handleDeclineJoinRequest, deleteStaff, toggleStaff, toggleStaffTipsFlow,
    handleAcceptUnlinkRequest, handleDeclineUnlinkRequest,
    // Expose mutation states for loading indicators
    inviteStaffMutation,
    resendInviteMutation,
    linkRequestMutation,
    updateStatusMutation,
    removeStaffMutation,
  }
}
