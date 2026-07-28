export const errorCodeToI18nKey = {
  // Auth
  USER_LOGIN_INVALID_USERNAME_OR_PASSWORD: 'errors.user_login_invalid_username_or_password',
  USER_ACCOUNT_INACTIVE: 'errors.user_account_inactive',
  USER_ACCOUNT_INCOMPLETE: 'errors.user_account_incomplete',
  USER_EMAIL_ALREADY_EXISTS: 'errors.user_email_already_exists',
  USER_EMAIL_ALREADY_EXIST: 'errors.user_email_already_exists',
  USER_EMAIL_ALREADY_EXISTS_IN_SSO: 'errors.user_email_already_exists',
  USER_INVALID_REFERRAL_CODE: 'errors.user_invalid_referral_code',
  USER_INVALID_POSITION: 'errors.user_invalid_position',
  USER_POSITION_REQUIRES_REFERRAL_CODE: 'errors.user_position_requires_referral_code',
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
  STAFF_POSITION_REQUIRED: 'errors.staff_position_required',
  STAFF_POSITION_TOO_LONG: 'errors.staff_position_too_long',
  STAFF_LIMIT_REACHED: 'errors.staff_limit_reached',
  LOCAL_STAFF_NOT_FOUND: 'errors.local_staff_not_found',
  LOCAL_STAFF_NOT_OWNED: 'errors.local_staff_not_owned',
  STAFF_LINK_HAS_OUTSTANDING_DEBT: 'errors.staff_link_has_outstanding_debt',
  STAFF_PAYMENT_METHOD_NOT_FOUND: 'errors.staff_payment_method_not_found',
  STAFF_PAYMENT_METHOD_ACCESS_DENIED: 'errors.staff_payment_method_access_denied',

  // Physical cards (QR/NFC hardware)
  PHYSICAL_CARD_NOT_FOUND: 'errors.physical_card_not_found',

  // Support / contact requests
  CONTACT_REQUEST_SUPPORT_TYPE_MIN_LENGTH: 'errors.contact_request_support_type_min_length',
  CONTACT_REQUEST_SUPPORT_TYPE_REQUIRED: 'errors.contact_request_support_type_required',
  CONTACT_REQUEST_MESSAGE_MIN_LENGTH: 'errors.contact_request_message_min_length',
  CONTACT_REQUEST_MESSAGE_MAX_LENGTH: 'errors.contact_request_message_max_length',
  CONTACT_REQUEST_MESSAGE_REQUIRED: 'errors.contact_request_message_required',

  // Common
  COMMON_VALIDATION_ERROR: 'errors.common_validation_error',
  COMMON_BAD_REQUEST: 'errors.common_bad_request',
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

  // Nexora Voice tenant staff
  VOICE_TENANT_STAFF_PHONE_NUMBER_REQUIRED: 'errors.voice_tenant_staff_phone_number_required',
  VOICE_TENANT_STAFF_PHONE_NUMBER_ALREADY_EXISTS: 'errors.voice_tenant_staff_phone_number_already_exists',

  // Nexora Voice call log
  VOICE_CALL_NOT_MISSED_CALL: 'errors.voice_call_not_missed_call',
  VOICE_CALL_FOLLOW_UP_SMS_ALREADY_SENT: 'errors.voice_call_follow_up_sms_already_sent',
  VOICE_CALL_CALLER_PHONE_MISSING: 'errors.voice_call_caller_phone_missing',
  VOICE_CALL_NOT_FOUND: 'errors.voice_call_not_found',

  // Nexora Voice customers
  VOICE_CUSTOMER_NAME_MAX_LENGTH: 'errors.voice_customer_name_max_length',
  VOICE_CUSTOMER_EMAIL_INVALID_FORMAT: 'errors.voice_customer_email_invalid_format',
  VOICE_CUSTOMER_EMAIL_MAX_LENGTH: 'errors.voice_customer_email_max_length',
  VOICE_CUSTOMER_ADDRESS_MAX_LENGTH: 'errors.voice_customer_address_max_length',
  VOICE_CUSTOMER_DATE_OF_BIRTH_INVALID: 'errors.voice_customer_date_of_birth_invalid',
  VOICE_CUSTOMER_TYPE_INVALID: 'errors.voice_customer_type_invalid',
  VOICE_CUSTOMER_STATUS_INVALID: 'errors.voice_customer_status_invalid',
  VOICE_CUSTOMER_NOT_FOUND: 'errors.voice_customer_not_found',

  // Nexora Voice tenant
  VOICE_TENANT_NOT_FOUND: 'errors.voice_tenant_not_found',

  // Nexora Voice tenant services / staff (public booking)
  VOICE_TENANT_SERVICE_DURATION_INVALID: 'errors.voice_tenant_service_duration_invalid',
  VOICE_TENANT_SERVICE_NOT_FOUND: 'errors.voice_tenant_service_not_found',
  VOICE_TENANT_STAFF_NOT_FOUND: 'errors.voice_tenant_staff_not_found',

  // Nexora Voice SMS campaigns
  SMS_CAMPAIGN_NOT_FOUND: 'errors.sms_campaign_not_found',
  SMS_CAMPAIGN_INVALID_STATUS_TRANSITION: 'errors.sms_campaign_invalid_status_transition',
  SMS_CAMPAIGN_NOT_EDITABLE: 'errors.sms_campaign_not_editable',
  SMS_CAMPAIGN_NOT_AUTO_CAMPAIGN: 'errors.sms_campaign_not_auto_campaign',
  SMS_CAMPAIGN_NO_RECIPIENTS: 'errors.sms_campaign_no_recipients',
  SMS_CAMPAIGN_INSUFFICIENT_CREDITS: 'errors.sms_campaign_insufficient_credits',
  SMS_CAMPAIGN_MESSAGE_BODY_REQUIRED: 'errors.sms_campaign_message_body_required',
  SMS_CAMPAIGN_SCHEDULED_AT_REQUIRED: 'errors.sms_campaign_scheduled_at_required',
  SMS_CAMPAIGN_SCHEDULED_AT_IN_PAST: 'errors.sms_campaign_scheduled_at_in_past',
  SMS_CREDIT_INVALID_PACKAGE: 'errors.sms_credit_invalid_package',

  // Subscription wallet payment
  SUBSCRIPTION_ALREADY_ON_PAID_PLAN: 'errors.subscription_already_on_paid_plan',
  SUBSCRIPTION_PLAN_NOT_PURCHASABLE: 'errors.subscription_plan_not_purchasable',
  SUBSCRIPTION_PAYMENT_METHOD_NOT_ACCEPTED: 'errors.subscription_payment_method_not_accepted',
  InsufficientBalance: 'errors.subscription_insufficient_balance',
  PaymentFailed: 'errors.subscription_payment_failed',
  GetPaymentMethodsFailed: 'errors.subscription_get_payment_methods_failed',
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
