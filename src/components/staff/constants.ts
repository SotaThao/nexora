export const STAFF_ROLE_AT_BUSINESS_MAX_LENGTH = 100 as const

export const STAFF_ROLE_ERROR_KEYS = {
  required: 'errors.staff_position_required',
  tooLong: 'errors.staff_position_too_long',
  linkNotActive: 'errors.staff_business_role_link_not_active',
  unauthorized: 'errors.staff_business_role_unauthorized',
  merchantLinkNotFound: 'errors.staff_role_link_not_found',
} as const
