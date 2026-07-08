export function mapTouchpointTypeToApi(uiType) {
  if (uiType === 'Table QR') return 'Table'
  if (uiType === 'Front Desk') return 'FrontDesk'
  if (uiType === 'Receipt QR') return 'Receipt'
  if (uiType === 'Staff QR' || uiType === 'StaffCard') return 'StaffCard'
  if (uiType === 'Business Main') return 'Table'
  return uiType
}

export function isStaffCardTouchpointType(uiType) {
  return uiType === 'Staff QR' || uiType === 'StaffCard'
}

export function getAssignableActiveStaff(staffList = []) {
  return staffList.filter((member) => {
    if (!member?.staffProfileId) return false
    if (member.isActive === false) return false
    return true
  })
}

export function resolveAssignedStaffProfileId(apiType, selectedStaffProfileId) {
  if (apiType === 'StaffCard' && selectedStaffProfileId) {
    return selectedStaffProfileId
  }
  return null
}

export function buildStaffProfileSelectOptions(staffList = [], placeholder = '') {
  const options = getAssignableActiveStaff(staffList).map((member) => ({
    value: member.staffProfileId,
    label: member.nickname || member.fullName || member.staffProfileId,
  }))

  if (placeholder) {
    return [{ value: '', label: placeholder }, ...options]
  }

  return options
}
