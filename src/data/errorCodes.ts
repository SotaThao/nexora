export const errorCodeToI18nKey = {
  // Auth
  USER_LOGIN_INVALID_USERNAME_OR_PASSWORD: 'errors.user_login_invalid_username_or_password',
  USER_ACCOUNT_INACTIVE: 'errors.user_account_inactive',
  USER_ACCOUNT_INCOMPLETE: 'errors.user_account_incomplete',
  USER_EMAIL_ALREADY_EXISTS: 'errors.user_email_already_exists',
  USER_EMAIL_ALREADY_EXIST: 'errors.user_email_already_exists',
  USER_EMAIL_ALREADY_EXISTS_IN_SSO: 'errors.user_email_already_exists',
  USER_INVALID_REFERRAL_CODE: 'errors.user_invalid_referral_code',
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
  BUSINESS_NOT_FOUND: 'errors.business_not_found',
  BUSINESS_NAME_REQUIRED: 'errors.business_name_required',
  BUSINESS_INVALID_SLUG_FORMAT: 'errors.business_invalid_slug_format',
  USER_NOT_MERCHANT: 'errors.user_not_merchant',
  TOUCHPOINT_STARTER_LIMIT_REACHED: 'errors.touchpoint_starter_limit_reached',

  // Direct payment (US-60 / direct-payment-qr-flow)
  PAYMENT_NOT_FOUND: 'errors.payment_not_found',
  PAYMENT_INVALID_STATUS: 'errors.payment_invalid_status',
  PAYMENT_AMOUNT_TOO_LOW: 'errors.payment_amount_too_low',
  PAYMENT_AMOUNT_TOO_HIGH: 'errors.payment_amount_too_high',
  PAYMENT_INVALID_PAYMENT_METHOD: 'errors.payment_invalid_payment_method',

  // Payout management (US-55)
  PAYOUT_AMOUNT_MUST_BE_POSITIVE: 'errors.payout_amount_must_be_positive',
  PAYOUT_PERIOD_START_BEFORE_END: 'errors.payout_period_start_before_end',
  PAYOUT_EVIDENCE_URLS_MAX_10: 'errors.payout_evidence_urls_max_10',
  PAYOUT_TYPES_REQUIRED: 'errors.payout_types_required',
  PAYOUT_UPDATE_NOT_ALLOWED: 'errors.payout_update_not_allowed',
  PAYOUT_DELETE_NOT_ALLOWED: 'errors.payout_delete_not_allowed',
  PAYOUT_CANCEL_NOT_ALLOWED: 'errors.payout_cancel_not_allowed',
  PAYOUT_CONFIRM_NOT_ALLOWED: 'errors.payout_confirm_not_allowed',
  PAYOUT_AMOUNT_EXCEEDS_DEBT: 'errors.payout_amount_exceeds_debt',

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
  STAFF_LIMIT_REACHED: 'errors.staff_limit_reached',
  LOCAL_STAFF_NOT_FOUND: 'errors.local_staff_not_found',
  LOCAL_STAFF_NOT_OWNED: 'errors.local_staff_not_owned',
  STAFF_LINK_HAS_OUTSTANDING_DEBT: 'errors.staff_link_has_outstanding_debt',
  STAFF_PAYMENT_METHOD_NOT_FOUND: 'errors.staff_payment_method_not_found',
  STAFF_PAYMENT_METHOD_ACCESS_DENIED: 'errors.staff_payment_method_access_denied',

  // Physical cards (QR/NFC hardware)
  PHYSICAL_CARD_NOT_FOUND: 'errors.physical_card_not_found',

  // POS Owner Setup — Roles & Permissions (US-015)
  POS_ROLE_NOT_FOUND: 'errors.pos_role_not_found',
  POS_ROLE_NAME_REQUIRED: 'errors.pos_role_name_required',
  POS_ROLE_NAME_TOO_LONG: 'errors.pos_role_name_too_long',
  POS_ROLE_NAME_DUPLICATE: 'errors.pos_role_name_duplicate',
  POS_PERMISSION_OWNER_ONLY: 'errors.pos_permission_owner_only',
  POS_CANNOT_EDIT_OWNER_ROLE_PERMISSIONS: 'errors.pos_cannot_edit_owner_role_permissions',
  POS_CANNOT_DELETE_OWNER_ROLE: 'errors.pos_cannot_delete_owner_role',
  POS_ROLE_IN_USE: 'errors.pos_role_in_use',
  POS_PERMISSION_DEFINITION_NOT_FOUND: 'errors.pos_permission_definition_not_found',

  // POS Owner Setup — Categories (US-016)
  POS_CATEGORY_NOT_FOUND: 'errors.pos_category_not_found',
  POS_CATEGORY_NAME_REQUIRED: 'errors.pos_category_name_required',
  POS_CATEGORY_NAME_TOO_LONG: 'errors.pos_category_name_too_long',
  POS_CATEGORY_IN_USE: 'errors.pos_category_in_use',

  // POS Owner Setup — Services (US-017)
  POS_SERVICE_NOT_FOUND: 'errors.pos_service_not_found',
  POS_SERVICE_NAME_REQUIRED: 'errors.pos_service_name_required',
  POS_SERVICE_NAME_TOO_LONG: 'errors.pos_service_name_too_long',
  POS_SERVICE_DESCRIPTION_TOO_LONG: 'errors.pos_service_description_too_long',
  POS_SERVICE_DURATION_INVALID: 'errors.pos_service_duration_invalid',
  POS_SERVICE_PRICE_INVALID: 'errors.pos_service_price_invalid',
  POS_SERVICE_TAG_TOO_LONG: 'errors.pos_service_tag_too_long',
  POS_SERVICE_CATEGORY_INVALID: 'errors.pos_service_category_invalid',
  POS_SERVICE_PHOTO_INVALID_TYPE: 'errors.pos_service_photo_invalid_type',

  // POS Owner Setup — Products (US-018)
  POS_PRODUCT_NOT_FOUND: 'errors.pos_product_not_found',
  POS_PRODUCT_NAME_REQUIRED: 'errors.pos_product_name_required',
  POS_PRODUCT_NAME_TOO_LONG: 'errors.pos_product_name_too_long',
  POS_PRODUCT_DESCRIPTION_TOO_LONG: 'errors.pos_product_description_too_long',
  POS_PRODUCT_PRICE_INVALID: 'errors.pos_product_price_invalid',
  POS_PRODUCT_TAG_TOO_LONG: 'errors.pos_product_tag_too_long',
  POS_PRODUCT_CATEGORY_INVALID: 'errors.pos_product_category_invalid',
  POS_PRODUCT_PHOTO_INVALID_TYPE: 'errors.pos_product_photo_invalid_type',

  // POS Owner Setup — Staff Profile (US-019)
  POS_STAFF_LINK_NOT_ACTIVE: 'errors.pos_staff_link_not_active',
  POS_STAFF_PAY_STRUCTURE_TYPE_INVALID: 'errors.pos_staff_pay_structure_type_invalid',
  POS_STAFF_PAY_STRUCTURE_FIELD_CONFLICT: 'errors.pos_staff_pay_structure_field_conflict',
  POS_STAFF_COMMISSION_PERCENT_INVALID: 'errors.pos_staff_commission_percent_invalid',
  POS_STAFF_PAY_AMOUNT_INVALID: 'errors.pos_staff_pay_amount_invalid',
  POS_STAFF_CONTRACT_TYPE_INVALID: 'errors.pos_staff_contract_type_invalid',
  POS_STAFF_CONTRACT_TYPE_NOT_ALLOWED: 'errors.pos_staff_contract_type_not_allowed',
  POS_STAFF_TAX_YEAR_NOT_AVAILABLE: 'errors.pos_staff_tax_year_not_available',
  POS_STAFF_NO_LINKED_ACCOUNT: 'errors.pos_staff_no_linked_account',
  POS_STAFF_PROFILE_NOT_FOUND: 'errors.pos_staff_profile_not_found',
  POS_STAFF_SERVICE_ASSIGNMENT_SERVICE_INVALID: 'errors.pos_staff_service_assignment_service_invalid',
  TAXIQ_STAFF_TIN_ALREADY_SET: 'errors.taxiq_staff_tin_already_set',

  // POS Owner Setup — Staff Weekly Schedule (US-09/US-021)
  POS_STAFF_SCHEDULE_DUPLICATE_DAY: 'errors.pos_staff_schedule_duplicate_day',
  POS_STAFF_SCHEDULE_INVALID_TIME_RANGE: 'errors.pos_staff_schedule_invalid_time_range',

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
  TAXIQ_OWNER_TAX_YEAR_UNLOCK_BLOCKED_BY_CPA_ACCESS: 'errors.taxiq_owner_tax_year_unlock_blocked_by_cpa_access',
  TAXIQ_UNSUPPORTED_ADJUSTMENT_FIELD: 'errors.taxiq_unsupported_adjustment_field',
  TAXIQ_ADJUSTMENT_ENTITY_NOT_FOUND: 'errors.taxiq_adjustment_entity_not_found',

  // Tax IQ — Tax Payment Reminders (US-08)
  TAXIQ_TAX_PAYMENT_REMINDER_NOT_FOUND: 'errors.taxiq_tax_payment_reminder_not_found',
  TAXIQ_TAX_REMINDER_SNOOZE_LIMIT_REACHED: 'errors.taxiq_tax_reminder_snooze_limit_reached',
  TAXIQ_TAX_REMINDER_NOT_EDITABLE: 'errors.taxiq_tax_reminder_not_editable',

  // Tax IQ — Owner Payout & Dispute Center (US-09)
  TAXIQ_PAYOUT_RECORD_NOT_FOUND: 'errors.taxiq_payout_record_not_found',
  TAXIQ_PAYOUT_RECORD_NOT_EDITABLE: 'errors.taxiq_payout_record_not_editable',
  TAXIQ_PAYOUT_ACCESS_DENIED: 'errors.taxiq_payout_access_denied',
  TAXIQ_STAFF_TAX_YEAR_REQUIRED_FOR_PAYOUT: 'errors.taxiq_staff_tax_year_required_for_payout',
  TAXIQ_STAFF_TAX_YEAR_ALREADY_EXISTS: 'errors.taxiq_staff_tax_year_already_exists',
  STAFF_LINK_NOT_FOUND: 'errors.staff_link_not_found',

  // Tax IQ — Staff Self-Reported Income (US-13)
  TAXIQ_SELF_REPORTED_INCOME_NOT_FOUND: 'errors.taxiq_self_reported_income_not_found',

  // Tax IQ — Delete Record (Deduction, Mileage/Cash Tip Log, Payout)
  TAXIQ_DEDUCTION_RECORD_HAS_RECEIPTS: 'errors.taxiq_deduction_record_has_receipts',
  TAXIQ_PAYOUT_RECORD_HAS_RECEIPTS: 'errors.taxiq_payout_record_has_receipts',

  // Tax IQ — Receipt Vault delete / unlink
  TAXIQ_RECEIPT_NOT_FOUND: 'errors.taxiq_receipt_not_found',
  TAXIQ_RECEIPT_NOT_LINKED_TO_DEDUCTION: 'errors.taxiq_receipt_not_linked_to_deduction',

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

  VOICE_LEAD_CONFIRMATION_SMS_ALREADY_SENT: 'errors.voice_lead_confirmation_sms_already_sent',

  // Nexora Voice trial requests
  VOICE_TRIAL_SHOP_NAME_REQUIRED: 'errors.voice_trial_shop_name_required',
  VOICE_TRIAL_OWNER_NAME_REQUIRED: 'errors.voice_trial_owner_name_required',
  VOICE_TRIAL_PHONE_NUMBER_REQUIRED: 'errors.voice_trial_phone_number_required',
  VOICE_TRIAL_PHONE_NUMBER_ALREADY_EXISTS: 'errors.voice_trial_phone_number_already_exists',
  VOICE_TRIAL_REQUEST_ALREADY_EXISTS: 'errors.voice_trial_phone_number_already_exists',
  VOICE_TRIAL_EMAIL_REQUIRED: 'errors.voice_trial_email_required',
  VOICE_TRIAL_EMAIL_INVALID_FORMAT: 'errors.voice_trial_email_invalid_format',
  VOICE_TRIAL_SERVICES_REQUIRED: 'errors.voice_trial_services_required',
  VOICE_TRIAL_OPENING_DAYS_REQUIRED: 'errors.voice_trial_opening_days_required',
  VOICE_TRIAL_SERVICE_HOURS_FROM_REQUIRED: 'errors.voice_trial_service_hours_from_required',
  VOICE_TRIAL_SERVICE_HOURS_TO_REQUIRED: 'errors.voice_trial_service_hours_to_required',
  VOICE_TRIAL_BIGGEST_PROBLEM_REQUIRED: 'errors.voice_trial_biggest_problem_required',
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
