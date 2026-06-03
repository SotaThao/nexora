// Staff roster + staff-modal/form state and all staff CRUD handlers for the
// Dashboard. Staff mutations also create/remove each staff personal-QR touch
// point, so setTouchpoints is injected. Extracted from Dashboard.jsx (Group 5).
import { useState } from 'react'
import { INITIAL_STAFF } from '../data/mockData'
import { DEFAULT_PAYOUT_CONFIGS } from '../constants'
import { getPayoutConfigsFromMember } from '../utils'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { storage } from '../../../utils/storage'

const localStorage = storage
const sessionStorage = storage

export function useStaffManagement({ setupData, businessName, setTouchpoints, viewingStaffDetailId, setViewingStaffDetailId }) {
  const { currentLanguage, t } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const [staff, setStaff] = useState(() => {
    const saved = localStorage.getItem('nexora_merchant_setup')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.staffList?.length) {
          return parsed.staffList.map((member) => ({
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
          }))
        }
      } catch (e) {}
    }
    if (setupData?.staffList?.length) {
      return setupData.staffList.map((member) => ({
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
      }))
    }
    return INITIAL_STAFF.map(member => ({
      ...member,
      payoutConfigs: getPayoutConfigsFromMember(member)
    }))
  })

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
      nickname: member.nickname,
      position: member.position,
      avatar: member.avatar || '',
      phone: member.phone || '',
      email: member.email || '',
      venmo: member.paymentAccounts?.venmo || '',
      cashapp: member.paymentAccounts?.cashapp || '',
      zelle: member.paymentAccounts?.zelle || '',
      vlinkpay: member.paymentAccounts?.vlinkpay || '',
      nexoraStaffId: member.id || '',
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
      nickname: member.nickname,
      position: member.position,
      avatar: member.avatar || '',
      phone: member.phone || '',
      email: member.email || '',
      venmo: member.paymentAccounts?.venmo || '',
      cashapp: member.paymentAccounts?.cashapp || '',
      zelle: member.paymentAccounts?.zelle || '',
      vlinkpay: member.paymentAccounts?.vlinkpay || '',
      nexoraStaffId: member.id || '',
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

  const saveStaff = () => {
    const nextErrors = {}
    if (!staffForm.fullName.trim()) nextErrors.fullName = 'Full name is required.'
    if (!staffForm.nickname.trim()) nextErrors.nickname = 'Public nickname is required.'
    if (staffForm.email?.trim() && !/\S+@\S+\.\S+/.test(staffForm.email.trim())) {
      nextErrors.email = t('setup.errors.staff_email_invalid') || 'Invalid email address format.'
    }
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    const configs = staffForm.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
    const payload = {
      fullName: staffForm.fullName.trim(),
      nickname: staffForm.nickname.trim(),
      position: staffForm.position.trim() || 'Nail Tech',
      avatar: staffForm.avatar || '',
      phone: staffForm.phone.trim(),
      email: staffForm.email.trim(),
      showInTipsFlow: staffForm.showInTipsFlow !== false,
      paymentAccounts: {
        venmo: configs.venmo?.enabled ? configs.venmo.value.trim() : '',
        cashapp: configs.cashapp?.enabled ? configs.cashapp.value.trim() : '',
        zelle: configs.zelle?.enabled ? configs.zelle.value.trim() : '',
        vlinkpay: staffForm.vlinkpay.trim(),
        paypal: configs.paypal?.enabled ? configs.paypal.value.trim() : '',
        bankwire: configs.bankwire?.enabled ? configs.bankwire.value.trim() : '',
        applecash: configs.applecash?.enabled ? configs.applecash.value.trim() : ''
      },
      payoutConfigs: configs
    }

    if (editingStaffId) {
      setStaff((current) => current.map((member) => member.id === editingStaffId ? { ...member, ...payload } : member))
    } else {
      const finalStaffId = staffForm.nexoraStaffId.trim() || `NEX-STAFF-${staffForm.fullName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`
      const newMember = { id: finalStaffId, isActive: true, showInTipsFlow: true, status: 'Active', flowType: 'Direct Addition', joinedDate: new Date().toISOString().split('T')[0], ...payload }
      setStaff((current) => [...current, newMember])
      setTouchpoints((current) => [...current, {
        id: `tp-staff-${newMember.id}`,
        name: `Personal QR - ${newMember.nickname}`,
        type: 'Staff QR',
        staffId: newMember.id,
        staffName: newMember.nickname
      }])
    }
    closeStaffModal()
  }

  const sendSetupLinkFromModal = (formDetails) => {
    const nextErrors = {}
    if (!formDetails.fullName.trim()) nextErrors.fullName = 'Full name is required to invite.'
    if (!formDetails.email.trim() && !formDetails.phone.trim()) {
      nextErrors.email = 'Phone or email is required to send invite link.'
    }
    
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
    const newMember = {
      id: tempId,
      fullName: formDetails.fullName.trim(),
      nickname: formDetails.nickname.trim() || formDetails.fullName.trim().split(' ')[0] + '.',
      position: formDetails.position.trim() || 'Nail Tech',
      avatar: formDetails.avatar || '',
      phone: formDetails.phone.trim(),
      email: formDetails.email.trim(),
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

    closeStaffModal()

    // Dispatch simulation event
    const inviteEvt = new CustomEvent('showSimulationInvite', {
      detail: {
        id: tempId,
        name: newMember.fullName,
        email: newMember.email,
        phone: newMember.phone,
        role: newMember.position,
        biz: businessName
      }
    })
    window.dispatchEvent(inviteEvt)
  }

  const handleLinkStaff = (globalMember, role) => {
    if (staff.some(s => s.id === globalMember.id)) {
      showToast('This technician is already linked to your salon.', 'error');
      return;
    }

    const newMember = {
      id: globalMember.id,
      fullName: globalMember.fullName,
      nickname: globalMember.nickname,
      position: role,
      avatar: globalMember.avatar || '',
      phone: globalMember.phone || '',
      email: globalMember.email || '',
      isActive: false,
      status: 'Pending Acceptance',
      flowType: 'Link Existing Staff ID',
      joinedDate: new Date().toISOString().split('T')[0],
      paymentAccounts: globalMember.paymentAccounts || {},
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

    // Trigger simulation alert
    const event = new CustomEvent('showSimulationInvite', {
      detail: {
        id: globalMember.id,
        name: globalMember.fullName,
        email: globalMember.email,
        phone: globalMember.phone,
        role: role,
        biz: businessName,
        isLinkOnly: true
      }
    })
    window.dispatchEvent(event)
  }

  const handleInviteStaff = (name, contact, role, method) => {
    const isEmail = contact.includes('@');
    const tempId = `NEX-STAFF-${Math.floor(100000 + Math.random() * 900000)}`
    
    const newMember = {
      id: tempId,
      fullName: name.trim(),
      nickname: name.trim().split(' ')[0] + '.',
      position: role,
      avatar: '',
      phone: isEmail ? '' : contact.trim(),
      email: isEmail ? contact.trim() : '',
      isActive: false,
      status: 'Pending Setup',
      flowType: 'Invite New Staff',
      joinedDate: new Date().toISOString().split('T')[0],
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

    // Trigger simulation setup
    const event = new CustomEvent('showSimulationInvite', {
      detail: {
        id: tempId,
        name: newMember.fullName,
        email: newMember.email,
        phone: newMember.phone,
        role: role,
        biz: businessName
      }
    })
    window.dispatchEvent(event)
  }

  const handleAcceptJoinRequest = (staffId, updatedFormPayload = null) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    let mergedPayload = {}
    if (updatedFormPayload) {
      const configs = updatedFormPayload.payoutConfigs || DEFAULT_PAYOUT_CONFIGS
      mergedPayload = {
        fullName: updatedFormPayload.fullName.trim(),
        nickname: updatedFormPayload.nickname.trim(),
        position: updatedFormPayload.position.trim(),
        avatar: updatedFormPayload.avatar || '',
        phone: updatedFormPayload.phone.trim(),
        email: updatedFormPayload.email.trim(),
        showInTipsFlow: updatedFormPayload.showInTipsFlow !== false,
        paymentAccounts: {
          venmo: configs.venmo?.enabled ? configs.venmo.value.trim() : '',
          cashapp: configs.cashapp?.enabled ? configs.cashapp.value.trim() : '',
          zelle: configs.zelle?.enabled ? configs.zelle.value.trim() : '',
          vlinkpay: updatedFormPayload.vlinkpay.trim(),
          paypal: configs.paypal?.enabled ? configs.paypal.value.trim() : '',
          bankwire: configs.bankwire?.enabled ? configs.bankwire.value.trim() : '',
          applecash: configs.applecash?.enabled ? configs.applecash.value.trim() : ''
        },
        payoutConfigs: configs
      }
    }

    setStaff((current) => current.map((m) => {
      if (m.id === staffId) {
        return {
          ...m,
          ...mergedPayload,
          status: 'Active',
          isActive: true,
          joinedDate: m.joinedDate || new Date().toISOString().split('T')[0]
        }
      }
      return m
    }))

    setTouchpoints((current) => {
      const hasTp = current.some(tp => tp.staffId === staffId)
      if (!hasTp) {
        return [...current, {
          id: `tp-staff-${staffId}`,
          name: `Personal QR - ${updatedFormPayload?.nickname || member.nickname}`,
          type: 'Staff QR',
          staffId: staffId,
          staffName: updatedFormPayload?.nickname || member.nickname
        }]
      }
      return current
    })

    showToast(currentLanguage === 'vi' 
      ? `Đã chấp nhận và lưu thông tin thợ ${updatedFormPayload?.fullName || member.fullName} vào tiệm!` 
      : `Accepted and saved technician ${updatedFormPayload?.fullName || member.fullName} to salon!`, 'success')
  }

  const handleDeclineJoinRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn từ chối yêu cầu tham gia của thợ ${member.fullName}?` 
      : `Are you sure you want to decline join request from ${member.fullName}?`)
    if (ok) {
      setStaff((current) => current.filter((m) => m.id !== staffId))
      setTouchpoints((current) => current.filter((tp) => tp.staffId !== staffId))
    }
  }

  const handleAcceptUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn duyệt yêu cầu hủy liên kết của thợ ${member.fullName}?` 
      : `Are you sure you want to approve unlink request from ${member.fullName}?`)
    if (ok) {
      setStaff((current) => current.filter((m) => m.id !== staffId))
      setTouchpoints((current) => current.filter((tp) => tp.staffId !== staffId))
      showToast(currentLanguage === 'vi' ? 'Đã hủy liên kết nhân viên thành công.' : 'Staff unlinked successfully.', 'success')
    }
  }

  const handleDeclineUnlinkRequest = async (staffId) => {
    const member = staff.find(s => s.id === staffId)
    if (!member) return

    const ok = await showConfirm(currentLanguage === 'vi' 
      ? `Bạn có chắc chắn muốn từ chối yêu cầu hủy liên kết của thợ ${member.fullName}?` 
      : `Are you sure you want to decline unlink request from ${member.fullName}?`)
    if (ok) {
      setStaff((current) => current.map((m) => m.id === staffId ? { ...m, status: 'Active', isActive: true } : m))
      showToast(currentLanguage === 'vi' ? 'Đã từ chối yêu cầu hủy liên kết.' : 'Declined unlink request.', 'success')
    }
  }

  const deleteStaff = async (id) => {
    const ok = await showConfirm(currentLanguage === 'vi'
      ? 'Bạn có chắc chắn muốn xóa nhân viên này khỏi Nexora Touch?'
      : 'Delete this staff member from Nexora Touch?')
    if (!ok) return
    setStaff((current) => current.filter((member) => member.id !== id))
    setTouchpoints((current) => current.filter((point) => !(point.type === 'Staff QR' && point.staffId === id)))
    if (viewingStaffDetailId === id) {
      setViewingStaffDetailId(null)
    }
  }

  const toggleStaff = (id) => {
    setStaff((current) => current.map((member) => member.id === id ? { ...member, isActive: !member.isActive } : member))
  }

  const toggleStaffTipsFlow = (id) => {
    setStaff((current) => current.map((member) => member.id === id ? { ...member, showInTipsFlow: member.showInTipsFlow === false ? true : false } : member))
  }

  return {
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
  }
}
