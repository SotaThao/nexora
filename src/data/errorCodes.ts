export const errorCodeToI18nKey = {
  // Auth
  USER_LOGIN_INVALID_USERNAME_OR_PASSWORD: 'errors.user_login_invalid_username_or_password',
  USER_ACCOUNT_INACTIVE: 'errors.user_account_inactive',
  USER_ACCOUNT_INCOMPLETE: 'errors.user_account_incomplete',
  USER_EMAIL_ALREADY_EXISTS: 'errors.user_email_already_exists',
  USER_SIGNUP_FAILED: 'errors.user_signup_failed',
  AUTH_PASSWORDS_DO_NOT_MATCH: 'errors.auth_passwords_do_not_match',
  USER_FEATURE_SIGNUP_DISABLED: 'errors.user_feature_signup_disabled',
  USER_INVALID_EMAIL_VERIFICATION_TOKEN: 'errors.user_invalid_email_verification_token',
  USER_EMAIL_VERIFICATION_TOKEN_EXPIRED: 'errors.user_email_verification_token_expired',
  USER_EMAIL_ALREADY_VERIFIED: 'errors.user_email_already_verified',
  USER_NOT_FOUND: 'errors.user_not_found',
  USER_PASSWORD_RESET_TOKEN_EXPIRED: 'errors.user_password_reset_token_expired',
  USER_PASSWORD_RESET_TOKEN_REQUIRED: 'errors.user_password_reset_token_required',
  USER_FAILED_TO_RESET_PASSWORD: 'errors.user_failed_to_reset_password',
  USER_INVALID_REFRESH_TOKEN: 'errors.user_invalid_refresh_token',
  AUTH_USER_NOT_AUTHENTICATED: 'errors.auth_user_not_authenticated',

  // Business
  BUSINESS_ALREADY_EXISTS: 'errors.business_already_exists',
  BUSINESS_NAME_REQUIRED: 'errors.business_name_required',
  BUSINESS_INVALID_SLUG_FORMAT: 'errors.business_invalid_slug_format',
  USER_NOT_MERCHANT: 'errors.user_not_merchant',
  TOUCHPOINT_STARTER_LIMIT_REACHED: 'errors.touchpoint_starter_limit_reached',

  // Image
  IMAGE_FILE_SIZE_EXCEEDED: 'errors.image_file_size_exceeded',
  IMAGE_UNSUPPORTED_FILE_TYPE: 'errors.image_unsupported_file_type',
  IMAGE_UPLOAD_FAILED: 'errors.image_upload_failed',
  IMAGE_INVALID_IMAGE_FILE: 'errors.image_invalid_image_file',
  BUSINESS_LOGO_UPLOAD_FAILED: 'errors.business_logo_upload_failed',

  // Staff invite & public referral (US-014). Exact server codes pending BE
  // confirmation on live Swagger; mapped here so the UI shows friendly text and
  // falls back to errors.unknown_error for any unmapped variant.
  REFERRAL_CODE_REQUIRED: 'errors.referral_code_required',
  REFERRAL_CODE_INVALID: 'errors.referral_code_invalid',
  REFERRAL_CODE_EXPIRED: 'errors.referral_code_expired',
  REFERRAL_CODE_REVOKED: 'errors.referral_code_revoked',
  INVITE_LINK_DISABLED: 'errors.invite_link_disabled',
  STAFF_INVITE_ALREADY_EXISTS: 'errors.staff_invite_already_exists',
  STAFF_ALREADY_LINKED: 'errors.staff_already_linked',
  STAFF_ALREADY_LINKED_TO_BUSINESS: 'errors.staff_already_linked_to_business',
  STAFF_INVITE_NOT_FOUND: 'errors.staff_invite_not_found',
  STAFF_INVITE_EXPIRED: 'errors.staff_invite_expired',
  STAFF_PROFILE_NOT_FOUND: 'errors.staff_profile_not_found',
  STAFF_DISPLAY_NAME_REQUIRED: 'errors.staff_display_name_required',
  STAFF_DISPLAY_NAME_TOO_SHORT: 'errors.staff_display_name_too_short',
  STAFF_DISPLAY_NAME_TOO_LONG: 'errors.staff_display_name_too_long',

  // Physical cards (QR/NFC hardware)
  PHYSICAL_CARD_NOT_FOUND: 'errors.physical_card_not_found',

  // Support / contact requests
  CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH: 'errors.contact_request_support_type_min_length',
  CONTACT_REQUEST_SUPPORT_TYPE_REQUIRED: 'errors.contact_request_support_type_required',
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH: 'errors.contact_request_message_min_length',
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH: 'errors.contact_request_message_max_length',
  CONTACT_REQUEST_MESSAGE_REQUIRED: 'errors.contact_request_message_required',

  // Tax IQ — Owner Year-End Export & Lock Tax Year (US-06)
  TAXIQ_EXPORT_CONSENT_REQUIRED: 'errors.taxiq_export_consent_required',
  TAXIQ_EXPORT_BLOCKED_BY_HIGH_PRIORITY_ITEMS: 'errors.taxiq_export_blocked_by_high_priority_items',
  TAXIQ_EXPORT_REQUIRES_LOCKED_TAX_YEAR: 'errors.taxiq_export_requires_locked_tax_year',
  TAXIQ_EXPORT_PACKAGE_NOT_FOUND: 'errors.taxiq_export_package_not_found',
  TAXIQ_EXPORT_UPLOAD_FAILED: 'errors.taxiq_export_upload_failed',
  TAXIQ_LOCK_BLOCKED_BY_HIGH_PRIORITY_ITEMS: 'errors.taxiq_lock_blocked_by_high_priority_items',
  TAXIQ_OWNER_TAX_YEAR_LOCKED: 'errors.taxiq_owner_tax_year_locked',
  TAXIQ_STAFF_TAX_YEAR_LOCKED: 'errors.taxiq_staff_tax_year_locked',
  TAXIQ_OWNER_TAX_YEAR_NOT_LOCKED: 'errors.taxiq_owner_tax_year_not_locked',
  TAXIQ_UNSUPPORTED_ADJUSTMENT_FIELD: 'errors.taxiq_unsupported_adjustment_field',
  TAXIQ_ADJUSTMENT_ENTITY_NOT_FOUND: 'errors.taxiq_adjustment_entity_not_found',

  // Tax IQ — Tax Payment Reminders (US-08)
  TAXIQ_TAX_PAYMENT_REMINDER_NOT_FOUND: 'errors.taxiq_tax_payment_reminder_not_found',
  TAXIQ_TAX_REMINDER_SNOOZE_LIMIT_REACHED: 'errors.taxiq_tax_reminder_snooze_limit_reached',

  // Tax IQ — Owner Payout & Dispute Center (US-09)
  TAXIQ_PAYOUT_RECORD_NOT_FOUND: 'errors.taxiq_payout_record_not_found',
  TAXIQ_PAYOUT_RECORD_NOT_EDITABLE: 'errors.taxiq_payout_record_not_editable',
  TAXIQ_PAYOUT_ACCESS_DENIED: 'errors.taxiq_payout_access_denied',
  TAXIQ_STAFF_TAX_YEAR_REQUIRED_FOR_PAYOUT: 'errors.taxiq_staff_tax_year_required_for_payout',
  TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS: 'errors.taxiq_staff_tax_year_already_exists',
  STAFF_LINK_NOT_FOUND: 'errors.staff_link_not_found',

  // Tax IQ — Staff Self-Reported Income (US-13)
  TAXIQ_SELF_REPORTED_INCOME_NOT_FOUND: 'errors.taxiq_self_reported_income_not_found',

  // Tax IQ — CPA Access Grant (US-10)
  TAXIQ_CPA_ACCESS_GRANT_NOT_FOUND: 'errors.taxiq_cpa_access_grant_not_found',
  TAXIQ_CPA_ACCESS_TOKEN_INVALID: 'errors.taxiq_cpa_access_token_invalid',
  TAXIQ_CPA_ACCESS_GRANT_EXPIRED: 'errors.taxiq_cpa_access_grant_expired',
  TAXIQ_CPA_ACCESS_GRANT_REVOKED: 'errors.taxiq_cpa_access_grant_revoked',
  TAXIQ_CPA_ACCESS_UNAUTHORIZED: 'errors.taxiq_cpa_access_unauthorized',
  TAXIQ_CPA_CONSENT_REQUIRED: 'errors.taxiq_cpa_consent_required',
  TAXIQ_DEDUCTION_NOT_IN_GRANT_SCOPE: 'errors.taxiq_deduction_not_in_grant_scope',

  // Common
  COMMON_VALIDATION_ERROR: 'errors.common_validation_error',
  COMMON_NOT_FOUND: 'errors.common_not_found',
  COMMON_UNAUTHORIZED: 'errors.common_unauthorized',
  COMMON_FORBIDDEN: 'errors.common_forbidden',
  COMMON_RATE_LIMIT_EXCEEDED: 'errors.common_rate_limit_exceeded',
  COMMON_INTERNAL_SERVER_ERROR: 'errors.common_internal_server_error',
}

/**
 * Resolves an errorCode to its i18n translation key.
 * Falls back to a generic error key if the code is unknown.
 *
 * @param {string} errorCode
 * @returns {string} i18n key
 */
export function getErrorI18nKey(errorCode) {
  return errorCodeToI18nKey[errorCode] || 'errors.unknown_error'
}

export default errorCodeToI18nKey
