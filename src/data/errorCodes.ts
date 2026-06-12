export const errorCodeToI18nKey = {
  // Auth
  USER_LOGIN_INVALID_USERNAME_OR_PASSWORD: 'errors.user_login_invalid_username_or_password',
  USER_ACCOUNT_INACTIVE: 'errors.user_account_inactive',
  USER_EMAIL_ALREADY_EXISTS: 'errors.user_email_already_exists',
  AUTH_PASSWORDS_DO_NOT_MATCH: 'errors.auth_passwords_do_not_match',
  USER_FEATURE_SIGNUP_DISABLED: 'errors.user_feature_signup_disabled',
  USER_INVALID_EMAIL_VERIFICATION_TOKEN: 'errors.user_invalid_email_verification_token',
  USER_EMAIL_VERIFICATION_TOKEN_EXPIRED: 'errors.user_email_verification_token_expired',
  USER_EMAIL_ALREADY_VERIFIED: 'errors.user_email_already_verified',
  USER_NOT_FOUND: 'errors.user_not_found',
  USER_PASSWORD_RESET_TOKEN_EXPIRED: 'errors.user_password_reset_token_expired',
  USER_INVALID_REFRESH_TOKEN: 'errors.user_invalid_refresh_token',
  AUTH_USER_NOT_AUTHENTICATED: 'errors.auth_user_not_authenticated',

  // Business
  BUSINESS_ALREADY_EXISTS: 'errors.business_already_exists',
  BUSINESS_NAME_REQUIRED: 'errors.business_name_required',
  BUSINESS_INVALID_SLUG_FORMAT: 'errors.business_invalid_slug_format',
  USER_NOT_MERCHANT: 'errors.user_not_merchant',

  // Image
  IMAGE_FILE_SIZE_EXCEEDED: 'errors.image_file_size_exceeded',
  IMAGE_UNSUPPORTED_FILE_TYPE: 'errors.image_unsupported_file_type',
  IMAGE_UPLOAD_FAILED: 'errors.image_upload_failed',
  BUSINESS_LOGO_UPLOAD_FAILED: 'errors.business_logo_upload_failed',

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
