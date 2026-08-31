import { CatalogErrorCode } from '../constants/catalogErrorCode'
import { getApiErrorCode, isApiError } from '../types/domain'

/** Deleting a local staff member is blocked by open orders/bookings still assigned to them. */
export const LOCAL_STAFF_HAS_ACTIVE_WORK = 'LOCAL_STAFF_HAS_ACTIVE_WORK'

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
  // Normally surfaced as StaffActiveWorkModal, not a toast — this mapping is the fallback
  // for any other caller that only shows a message.
  [LOCAL_STAFF_HAS_ACTIVE_WORK]: 'errors.local_staff_has_active_work',
  STAFF_LINK_HAS_OUTSTANDING_DEBT: 'errors.staff_link_has_outstanding_debt',
  STAFF_PAYMENT_METHOD_NOT_FOUND: 'errors.staff_payment_method_not_found',
  STAFF_PAYMENT_METHOD_ACCESS_DENIED: 'errors.staff_payment_method_access_denied',
  STAFF_PAYMENT_METHOD_CRYPTO_ADDRESSES_ONLY_FOR_VLINKPAY:
    'errors.staff_payment_method_crypto_addresses_only_for_vlinkpay',
  STAFF_PAYMENT_METHOD_CRYPTO_ADDRESS_UNSUPPORTED_NETWORK:
    'errors.staff_payment_method_crypto_address_unsupported_network',
  STAFF_PAYMENT_METHOD_CRYPTO_ADDRESS_UNSUPPORTED_SYMBOL:
    'errors.staff_payment_method_crypto_address_unsupported_symbol',
  STAFF_PAYMENT_METHOD_CRYPTO_ADDRESS_DUPLICATE_SYMBOL:
    'errors.staff_payment_method_crypto_address_duplicate_symbol',
  STAFF_PAYMENT_METHOD_CRYPTO_ADDRESS_INVALID: 'errors.staff_payment_method_crypto_address_invalid',
  BUSINESS_PAYMENT_METHOD_CRYPTO_ADDRESSES_ONLY_FOR_VLINKPAY:
    'errors.business_payment_method_crypto_addresses_only_for_vlinkpay',
  BUSINESS_PAYMENT_METHOD_CRYPTO_ADDRESS_UNSUPPORTED_NETWORK:
    'errors.business_payment_method_crypto_address_unsupported_network',
  BUSINESS_PAYMENT_METHOD_CRYPTO_ADDRESS_UNSUPPORTED_SYMBOL:
    'errors.business_payment_method_crypto_address_unsupported_symbol',
  BUSINESS_PAYMENT_METHOD_CRYPTO_ADDRESS_DUPLICATE_SYMBOL:
    'errors.business_payment_method_crypto_address_duplicate_symbol',
  BUSINESS_PAYMENT_METHOD_CRYPTO_ADDRESS_INVALID: 'errors.business_payment_method_crypto_address_invalid',

  // Tip crypto symbol (VlinkPay wallet tip / payment-link)
  TIP_CRYPTO_SYMBOL_REQUIRED: 'errors.TIP_CRYPTO_SYMBOL_REQUIRED',
  TIP_CRYPTO_ADDRESS_NOT_FOUND: 'errors.TIP_CRYPTO_ADDRESS_NOT_FOUND',

  // Multi-staff tip (POST /api/v1/tips/multi-staff)
  TIP_MINIMUM_STAFF_COUNT: 'errors.tip_minimum_staff_count',
  TIP_BUSINESS_PAYMENT_METHOD_REQUIRED: 'errors.tip_business_payment_method_required',

  // Physical cards (QR/NFC hardware)
  PHYSICAL_CARD_NOT_FOUND: 'errors.physical_card_not_found',

  // Business Holidays & Closures
  HOLIDAY_NOT_FOUND: 'errors.holiday_not_found',
  HOLIDAY_DATE_ALREADY_EXISTS: 'errors.holiday_date_already_exists',
  HOLIDAY_REASON_REQUIRED: 'errors.holiday_reason_required',
  HOLIDAY_REASON_TOO_LONG: 'errors.holiday_reason_too_long',
  HOLIDAY_INVALID_TYPE: 'errors.holiday_invalid_type',
  HOLIDAY_ADJUSTED_TIME_REQUIRED: 'errors.holiday_adjusted_time_required',
  HOLIDAY_ADJUSTED_INVALID_TIME_RANGE: 'errors.holiday_adjusted_invalid_time_range',
  HOLIDAY_CLOSED_TIME_MUST_BE_NULL: 'errors.holiday_closed_time_must_be_null',
  HOLIDAY_DATE_IN_PAST: 'errors.holiday_date_in_past',
  HOLIDAY_ADJUSTED_TIME_ALREADY_PASSED: 'errors.holiday_adjusted_time_already_passed',

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

  // Shared Catalog — Categories & Services (delete guards)
  [CatalogErrorCode.ServiceInUse]: 'errors.catalog_service_in_use',
  [CatalogErrorCode.ServiceDeleted]: 'errors.catalog_service_deleted',
  [CatalogErrorCode.CategoryInUse]: 'errors.catalog_category_in_use',

  // Shared Catalog — Service Add-Ons
  [CatalogErrorCode.ServiceAddOnNotFound]: 'errors.catalog_service_addon_not_found',
  [CatalogErrorCode.ServiceAddOnNameRequired]: 'errors.catalog_service_addon_name_required',
  [CatalogErrorCode.ServiceAddOnNameTooLong]: 'errors.catalog_service_addon_name_too_long',
  [CatalogErrorCode.ServiceAddOnNameDuplicate]: 'errors.catalog_service_addon_name_duplicate',
  [CatalogErrorCode.ServiceAddOnPriceInvalid]: 'errors.catalog_service_addon_price_invalid',
  [CatalogErrorCode.ServiceAddOnInUse]: 'errors.catalog_service_addon_in_use',
  [CatalogErrorCode.ServiceAddOnCopySourceInvalid]: 'errors.catalog_service_addon_copy_source_invalid',

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
  POS_STAFF_NO_USABLE_ROLE: 'errors.pos_staff_no_usable_role',
  POS_STAFF_STATUS_INVALID: 'errors.pos_staff_status_invalid',
  POS_STAFF_STATUS_NOT_ACTIVE: 'errors.pos_staff_status_not_active',
  POS_STAFF_CANNOT_CHANGE_STATUS_WHILE_IN_SERVICE: 'errors.pos_staff_cannot_change_status_while_in_service',
  TAXIQ_STAFF_TIN_ALREADY_SET: 'errors.taxiq_staff_tin_already_set',

  // POS Owner Setup — Staff Weekly Schedule (US-09/US-021)
  POS_STAFF_SCHEDULE_DUPLICATE_DAY: 'errors.pos_staff_schedule_duplicate_day',
  POS_STAFF_SCHEDULE_INVALID_TIME_RANGE: 'errors.pos_staff_schedule_invalid_time_range',

  // POS Front Desk — Time Clock (rotating QR, clock in/out, beep)
  POS_STAFF_CLOCK_PROFILE_NOT_SET_UP: 'errors.pos_staff_clock_profile_not_set_up',
  POS_STAFF_CLOCK_ACCESS_DENIED: 'errors.pos_staff_clock_access_denied',
  POS_STAFF_CLOCK_ACCOUNT_LOCKED: 'errors.pos_staff_clock_account_locked',
  POS_STAFF_CLOCK_ALREADY_CLOCKED_IN: 'errors.pos_staff_clock_already_clocked_in',
  POS_STAFF_CLOCK_NOT_CLOCKED_IN: 'errors.pos_staff_clock_not_clocked_in',
  POS_STAFF_CLOCK_ENTRY_NOT_FOUND: 'errors.pos_staff_clock_entry_not_found',
  POS_STAFF_CLOCK_CORRECTION_INVALID: 'errors.pos_staff_clock_correction_invalid',
  POS_STAFF_CLOCK_QR_TOKEN_INVALID: 'errors.pos_staff_clock_qr_token_invalid',
  POS_STAFF_CLOCK_QR_TOKEN_EXPIRED: 'errors.pos_staff_clock_qr_token_expired',
  POS_STAFF_CLOCK_QR_BUSINESS_MISMATCH: 'errors.pos_staff_clock_qr_business_mismatch',
  POS_STAFF_CLOCK_TOO_SOON: 'errors.pos_staff_clock_too_soon',
  POS_STAFF_CLOCK_BEEP_TARGET_INVALID: 'errors.pos_staff_clock_beep_target_invalid',
  POS_STAFF_CLOCK_BEEP_NOT_FOUND: 'errors.pos_staff_clock_beep_not_found',
  POS_STAFF_CLOCK_BEEP_ALREADY_RESOLVED: 'errors.pos_staff_clock_beep_already_resolved',
  POS_STAFF_CLOCK_BEEP_EXPIRED: 'errors.pos_staff_clock_beep_expired',
  POS_STAFF_CLOCK_BEEP_NUDGE_TOO_SOON: 'errors.pos_staff_clock_beep_nudge_too_soon',
  POS_STAFF_CLOCK_BEEP_RESPONSE_FORBIDDEN: 'errors.pos_staff_clock_beep_response_forbidden',
  POS_STAFF_CLOCK_BEEP_DELAY_INVALID: 'errors.pos_staff_clock_beep_delay_invalid',

  // POS Merchant Ops — Check-in, Turn Board & Checkout (US-12..US-17)
  POS_ORDER_NOT_FOUND: 'errors.pos_order_not_found',
  POS_WORK_ORDER_ACCESS_DENIED: 'errors.pos_work_order_access_denied',
  POS_WORK_ORDER_NOTHING_TO_COMPLETE: 'errors.pos_work_order_nothing_to_complete',
  POS_WORK_ORDER_START_DATE_NOT_REACHED: 'errors.pos_work_order_start_date_not_reached',
  POS_ORDER_NOT_WAITING: 'errors.pos_order_not_waiting',
  POS_ORDER_CUSTOMER_NAME_REQUIRED: 'errors.pos_order_customer_name_required',
  POS_ORDER_CUSTOMER_NAME_TOO_LONG: 'errors.pos_order_customer_name_too_long',
  POS_ORDER_CUSTOMER_EMAIL_TOO_LONG: 'errors.pos_order_customer_email_too_long',
  POS_ORDER_CUSTOMER_PHONE_TOO_LONG: 'errors.pos_order_customer_phone_too_long',
  POS_ORDER_CUSTOMER_PHONE_REQUIRED: 'errors.pos_order_customer_phone_required',
  POS_ORDER_SERVICE_INVALID: 'errors.pos_order_service_invalid',
  POS_ORDER_PRODUCT_INVALID: 'errors.pos_order_product_invalid',
  POS_ORDER_NUMBER_CONFLICT: 'errors.pos_order_number_conflict',
  STATION_NOT_EMPTY: 'errors.pos_station_not_empty',
  ORDER_NOT_WAITING_OR_IN_SERVICE: 'errors.pos_order_not_waiting_or_in_service',
  ORDER_CLOSED_FOR_EDITS: 'errors.pos_order_closed_for_edits',
  POS_ORDER_DISCOUNT_INVALID: 'errors.pos_order_discount_invalid',
  POS_ORDER_DISCOUNT_NOTE_TOO_LONG: 'errors.pos_order_discount_note_too_long',
  POS_PROMOTION_NOT_FOUND: 'errors.pos_promotion_not_found',
  POS_PROMOTION_NOT_ELIGIBLE: 'errors.pos_promotion_not_eligible',
  POS_PROMOTION_INACTIVE: 'errors.pos_promotion_inactive',
  POS_PROMOTION_SCHEDULE_INVALID: 'errors.pos_promotion_schedule_invalid',
  POS_PROMOTION_NAME_REQUIRED: 'errors.pos_promotion_name_required',
  POS_PROMOTION_NAME_TOO_LONG: 'errors.pos_promotion_name_too_long',
  POS_PROMOTION_BADGE_TOO_LONG: 'errors.pos_promotion_badge_too_long',
  POS_PROMOTION_VALUE_INVALID: 'errors.pos_promotion_value_invalid',
  POS_PROMOTION_IN_USE: 'errors.pos_promotion_in_use',
  ORDER_NOT_IN_SERVICE: 'errors.pos_order_not_in_service',
  ORDER_ALREADY_COMPLETED: 'errors.pos_order_already_completed',
  POS_ORDER_HAS_NO_LINES: 'errors.pos_order_has_no_lines',
  SERVICE_LINE_NOT_FOUND: 'errors.pos_service_line_not_found',
  SERVICE_LINE_ALREADY_ASSIGNED: 'errors.pos_service_line_already_assigned',
  SERVICE_LINE_NOT_ASSIGNED: 'errors.pos_service_line_not_assigned',
  SERVICE_LINE_ALREADY_COMPLETED: 'errors.pos_service_line_already_completed',
  SERVICE_LINE_NOTE_TOO_LONG: 'errors.pos_service_line_note_too_long',
  PRODUCT_LINE_NOT_FOUND: 'errors.pos_product_line_not_found',
  NO_STAFF_ASSIGNED_TO_START_SERVICE: 'errors.pos_no_staff_assigned_to_start_service',
  NOT_ALL_SERVICE_LINES_ASSIGNED: 'errors.pos_not_all_service_lines_assigned',
  POS_ORDER_HAS_NO_SERVICE_TO_START: 'errors.pos_order_has_no_service_to_start',
  TIP_SPLIT_MISMATCH: 'errors.pos_tip_split_mismatch',
  TIP_SPLIT_STAFF_INVALID: 'errors.pos_tip_split_staff_invalid',

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

  // Tax IQ — Owner Income Summary (US-014)
  TAXIQ_OWNER_INCOME_RECORD_NOT_FOUND: 'errors.taxiq_owner_income_record_not_found',

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

  // Tax IQ — Staff W-4 Invite Link (US-028)
  TAXIQ_STAFF_W4_INVITE_STAFF_NOT_LOCAL: 'errors.taxiq_staff_w4_invite_staff_not_local',
  TAXIQ_STAFF_W4_INVITE_EMAIL_REQUIRED: 'errors.taxiq_staff_w4_invite_email_required',
  TAXIQ_STAFF_W4_INVITE_STAFF_LINK_NOT_ACTIVE: 'errors.taxiq_staff_w4_invite_staff_link_not_active',
  TAXIQ_STAFF_W4_INVITE_TOKEN_INVALID: 'errors.taxiq_staff_w4_invite_token_invalid',
  TAXIQ_STAFF_W4_INVITE_LINK_EXPIRED: 'errors.taxiq_staff_w4_invite_link_expired',
  TAXIQ_STAFF_W4_INVITE_LINK_REVOKED: 'errors.taxiq_staff_w4_invite_link_revoked',

  // Tax IQ — Employer Registry (US-029 / backend US-21)
  TAXIQ_EMPLOYER_NOT_FOUND: 'errors.taxiq_employer_not_found',
  TAXIQ_EMPLOYER_ALREADY_EXISTS: 'errors.taxiq_employer_already_exists',
  TAXIQ_EMPLOYER_REGISTRATION_NOT_FOUND: 'errors.taxiq_employer_registration_not_found',

  // Tax IQ — Employees core (US-030 / backend US-22)
  TAXIQ_STAFF_TAX_PROFILE_NOT_FOUND: 'errors.taxiq_staff_tax_profile_not_found',
  TAXIQ_STAFF_TIN_VERIFICATION_NOT_ALLOWED: 'errors.taxiq_staff_tin_verification_not_allowed',

  // Tax IQ — W-9 full form + self-certification (US-034)
  TAXIQ_W9_NOT_READY_FOR_CERTIFICATION: 'errors.taxiq_w9_not_ready_for_certification',

  // Tax IQ / POS — Pay Engine (US-031 / backend US-23)
  POS_STAFF_PAY_RULE_PROFILE_NOT_SET_UP: 'errors.pos_staff_pay_rule_profile_not_set_up',
  POS_STAFF_PAY_SCHEDULE_INVALID: 'errors.pos_staff_pay_schedule_invalid',
  POS_STAFF_PAY_RULE_FIELD_REQUIRED: 'errors.pos_staff_pay_rule_field_required',
  POS_STAFF_PAY_RULE_COMMISSION_PERCENT_INVALID: 'errors.pos_staff_pay_rule_commission_percent_invalid',
  POS_STAFF_PAY_RULE_OVERTIME_THRESHOLD_INVALID: 'errors.pos_staff_pay_rule_overtime_threshold_invalid',
  POS_STAFF_PAY_RULE_TIERED_RATES_INVALID: 'errors.pos_staff_pay_rule_tiered_rates_invalid',
  POS_STAFF_PAY_RULE_BONUS_FIELD_INVALID: 'errors.pos_staff_pay_rule_bonus_field_invalid',
  POS_STAFF_PAYOUT_DESTINATION_FIELD_INVALID: 'errors.pos_staff_payout_destination_field_invalid',
  POS_STAFF_PRE_TAX_DEDUCTION_PROFILE_NOT_SET_UP: 'errors.pos_staff_pre_tax_deduction_profile_not_set_up',
  POS_STAFF_PRE_TAX_DEDUCTION_FIELD_INVALID: 'errors.pos_staff_pre_tax_deduction_field_invalid',
  POS_STAFF_PRE_TAX_DEDUCTION_NOT_FOUND: 'errors.pos_staff_pre_tax_deduction_not_found',

  // POS Booking — Staff/Owner creates a booking (Ticket 3)
  POS_BOOKING_SERVICE_INVALID: 'errors.pos_booking_service_invalid',
  POS_BOOKING_OUTSIDE_BUSINESS_HOURS: 'errors.pos_booking_outside_business_hours',
  POS_BOOKING_BUSINESS_CLOSED_ON_DATE: 'errors.pos_booking_business_closed_on_date',
  POS_BOOKING_LEAD_TIME_VIOLATION: 'errors.pos_booking_lead_time_violation',
  POS_BOOKING_ADVANCE_LIMIT_EXCEEDED: 'errors.pos_booking_advance_limit_exceeded',
  POS_BOOKING_STAFF_OUTSIDE_SCHEDULE: 'errors.pos_booking_staff_outside_schedule',
  POS_BOOKING_SLOT_CONFLICT: 'errors.pos_booking_slot_conflict',
  POS_BOOKING_PHONE_ALREADY_ACTIVE: 'errors.pos_booking_phone_already_active',
  POS_BOOKING_CUSTOMER_PHONE_REQUIRED: 'errors.pos_booking_customer_phone_required',
  POS_BOOKING_NOT_FOUND: 'errors.pos_booking_not_found',

  // Tax IQ / POS — Weekly Payroll (mục 14, backend US-25)
  POS_PAYROLL_NOT_READY: 'errors.pos_payroll_not_ready',
  POS_PAYROLL_ALREADY_PAID: 'errors.pos_payroll_already_paid',
  POS_PAYROLL_PROOF_REQUIRED: 'errors.pos_payroll_proof_required',
  POS_PAYROLL_TAX_PROFILE_BLOCKED: 'errors.pos_payroll_tax_profile_blocked',
  POS_PAYROLL_PAYOUT_METHOD_MISSING: 'errors.pos_payroll_payout_method_missing',
  POS_PAYROLL_NOT_WEEKLY_SCHEDULE: 'errors.pos_payroll_not_weekly_schedule',
  POS_PAYROLL_IS_W2: 'errors.pos_payroll_is_w2',
  POS_PAYROLL_OVERRIDE_NOTE_REQUIRED: 'errors.pos_payroll_override_note_required',
  POS_PAYROLL_AMOUNT_ZERO: 'errors.pos_payroll_amount_zero',

  // Tax IQ — Payroll Runs (mục 12, backend US-26)
  TAXIQ_PAYROLL_RUN_NOT_FOUND: 'errors.taxiq_payroll_run_not_found',
  TAXIQ_PAYROLL_RUN_PERIOD_INVALID: 'errors.taxiq_payroll_run_period_invalid',
  TAXIQ_PAYROLL_RUN_INVALID_STATUS_FOR_ACTION: 'errors.taxiq_payroll_run_invalid_status_for_action',
  TAXIQ_PAYROLL_RUN_APPROVAL_NOTE_REQUIRED: 'errors.taxiq_payroll_run_approval_note_required',
  TAXIQ_PAYROLL_RUN_VALIDATION_BLOCKING: 'errors.taxiq_payroll_run_validation_blocking',
  TAXIQ_PAYROLL_RUN_CANCEL_REASON_REQUIRED: 'errors.taxiq_payroll_run_cancel_reason_required',
  TAXIQ_PAYROLL_RUN_CANNOT_CANCEL_POSTED: 'errors.taxiq_payroll_run_cannot_cancel_posted',

  // Tax IQ — Tax Ledger (mục 16, backend US-27/28/29)
  TAXIQ_TAX_LEDGER_ENTRY_NOT_FOUND: 'errors.taxiq_tax_ledger_entry_not_found',

  // Tax IQ — Exceptions Queue + Data Quality Center (mục 17/18, backend US-036)
  TAXIQ_EXCEPTION_NOT_FOUND: 'errors.taxiq_exception_not_found',
  TAXIQ_EXCEPTION_ALREADY_CLOSED: 'errors.taxiq_exception_already_closed',
  TAXIQ_CLEANUP_TASK_NOT_FOUND: 'errors.taxiq_cleanup_task_not_found',
  TAXIQ_CLEANUP_TASK_ALREADY_CLOSED: 'errors.taxiq_cleanup_task_already_closed',

  // Tax IQ — Share Links (mục 23, generalized from CpaAccessGrant)
  TAXIQ_SHARE_LINK_NOT_FOUND: 'errors.taxiq_share_link_not_found',
  TAXIQ_SHARE_LINK_TOKEN_INVALID: 'errors.taxiq_share_link_token_invalid',
  TAXIQ_SHARE_LINK_EXPIRED: 'errors.taxiq_share_link_expired',
  TAXIQ_SHARE_LINK_REVOKED: 'errors.taxiq_share_link_revoked',
  TAXIQ_SHARE_LINK_NOT_DRAFT: 'errors.taxiq_share_link_not_draft',
  TAXIQ_SHARE_LINK_ALREADY_REVOKED: 'errors.taxiq_share_link_already_revoked',
  TAXIQ_SHARE_LINK_PASSCODE_REQUIRED: 'errors.taxiq_share_link_passcode_required',
  TAXIQ_SHARE_LINK_PASSCODE_INVALID: 'errors.taxiq_share_link_passcode_invalid',
  TAXIQ_SHARE_LINK_ACCESS_MODE_NOT_ALLOWED: 'errors.taxiq_share_link_access_mode_not_allowed',
  TAXIQ_SHARE_LINK_DOWNLOAD_DISABLED: 'errors.taxiq_share_link_download_disabled',
  TAXIQ_SHARE_LINK_DOWNLOAD_FORMAT_NOT_ALLOWED: 'errors.taxiq_share_link_download_format_not_allowed',
  TAXIQ_SHARE_LINK_INVALID_DATA_ANCHOR: 'errors.taxiq_share_link_invalid_data_anchor',
  TAXIQ_SHARE_LINK_FILE_TOO_LARGE: 'errors.taxiq_share_link_file_too_large',
  TAXIQ_SHARE_LINK_FILE_TYPE_NOT_ALLOWED: 'errors.taxiq_share_link_file_type_not_allowed',

  // Tax IQ — Tax Center 1099-NEC (mục 21)
  TAXIQ_FORM_1099_NEC_NOT_FOUND: 'errors.taxiq_form_1099_nec_not_found',
  TAXIQ_FORM_1099_NEC_NOT_READY: 'errors.taxiq_form_1099_nec_not_ready',
  TAXIQ_FORM_1099_NEC_ALREADY_DELIVERED: 'errors.taxiq_form_1099_nec_already_delivered',
  TAXIQ_FORM_1099_NEC_NOT_DELIVERED: 'errors.taxiq_form_1099_nec_not_delivered',
  TAXIQ_FORM_1099_NEC_RECIPIENT_EMAIL_REQUIRED: 'errors.taxiq_form_1099_nec_recipient_email_required',

  // Tax IQ — Tip Ledger (mục 26)
  TAXIQ_TIP_LEDGER_ENTRY_NOT_FOUND: 'errors.taxiq_tip_ledger_entry_not_found',

  // Tax IQ — Forms & Reports (mục 20)
  TAXIQ_FORMS_REPORT_NOT_FOUND: 'errors.taxiq_forms_report_not_found',
  TAXIQ_FORMS_REPORT_NEEDS_REVIEW: 'errors.taxiq_forms_report_needs_review',
  TAXIQ_FORMS_REPORT_NOT_READY_TO_CONFIRM: 'errors.taxiq_forms_report_not_ready_to_confirm',
  TAXIQ_FORMS_REPORT_NOT_READY_TO_ARCHIVE: 'errors.taxiq_forms_report_not_ready_to_archive',

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
  VOICE_TRIAL_SHOP_NAME_MAX_LENGTH: 'errors.voice_trial_shop_name_max_length',
  VOICE_TRIAL_OWNER_NAME_REQUIRED: 'errors.voice_trial_owner_name_required',
  VOICE_TRIAL_OWNER_NAME_MAX_LENGTH: 'errors.voice_trial_owner_name_max_length',
  VOICE_TRIAL_PHONE_NUMBER_REQUIRED: 'errors.voice_trial_phone_number_required',
  VOICE_TRIAL_PHONE_NUMBER_MAX_LENGTH: 'errors.voice_trial_phone_number_max_length',
  VOICE_TRIAL_PHONE_NUMBER_ALREADY_EXISTS: 'errors.voice_trial_phone_number_already_exists',
  VOICE_TRIAL_REQUEST_ALREADY_EXISTS: 'errors.voice_trial_phone_number_already_exists',
  VOICE_TRIAL_OWNER_PHONE_NUMBER_MAX_LENGTH: 'errors.voice_trial_owner_phone_number_max_length',
  VOICE_TRIAL_EMAIL_REQUIRED: 'errors.voice_trial_email_required',
  VOICE_TRIAL_EMAIL_INVALID_FORMAT: 'errors.voice_trial_email_invalid_format',
  VOICE_TRIAL_EMAIL_MAX_LENGTH: 'errors.voice_trial_email_max_length',
  VOICE_TRIAL_CITY_AREA_MAX_LENGTH: 'errors.voice_trial_city_area_max_length',
  VOICE_TRIAL_WEBSITE_MAX_LENGTH: 'errors.voice_trial_website_max_length',
  VOICE_TRIAL_SERVICES_REQUIRED: 'errors.voice_trial_services_required',
  VOICE_TRIAL_PRICE_LIST_IMAGE_URLS_MAX_COUNT: 'errors.voice_trial_price_list_image_urls_max_count',
  VOICE_TRIAL_PRICE_LIST_IMAGE_URL_MAX_LENGTH: 'errors.voice_trial_price_list_image_url_max_length',
  VOICE_TRIAL_PRICE_LIST_IMAGE_URL_INVALID: 'errors.voice_trial_price_list_image_url_invalid',
  VOICE_TRIAL_OPERATING_HOURS_DUPLICATE_DAY: 'errors.voice_trial_operating_hours_duplicate_day',
  VOICE_TRIAL_OPERATING_HOURS_NO_OPEN_DAY: 'errors.voice_trial_operating_hours_no_open_day',
  VOICE_TRIAL_OPERATING_HOURS_INVALID_TIME_RANGE: 'errors.voice_trial_operating_hours_invalid_time_range',
  VOICE_TRIAL_OPENING_DAYS_REQUIRED: 'errors.voice_trial_opening_days_required',
  VOICE_TRIAL_SERVICE_HOURS_FROM_REQUIRED: 'errors.voice_trial_service_hours_from_required',
  VOICE_TRIAL_SERVICE_HOURS_FROM_MAX_LENGTH: 'errors.voice_trial_service_hours_from_max_length',
  VOICE_TRIAL_SERVICE_HOURS_TO_REQUIRED: 'errors.voice_trial_service_hours_to_required',
  VOICE_TRIAL_SERVICE_HOURS_TO_MAX_LENGTH: 'errors.voice_trial_service_hours_to_max_length',
  VOICE_TRIAL_BIGGEST_PROBLEM_REQUIRED: 'errors.voice_trial_biggest_problem_required',
  VOICE_TRIAL_BIGGEST_PROBLEM_MAX_LENGTH: 'errors.voice_trial_biggest_problem_max_length',
  VOICE_TRIAL_REFERRAL_CODE_MAX_LENGTH: 'errors.voice_trial_referral_code_max_length',

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
  VOICE_SERVICE_CATEGORY_CANNOT_MODIFY_DEFAULT:
    'errors.voice_service_category_cannot_modify_default',

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

  // Community Chat (US-101 → US-107)
  CHAT_SESSION_NOT_FOUND: 'errors.chat_session_not_found',
  CHAT_NOT_A_PARTICIPANT: 'errors.chat_not_a_participant',
  CHAT_NOT_ALLOWED_TO_MANAGE_GROUP: 'errors.chat_not_allowed_to_manage_group',
  CHAT_PARTICIPANT_MUST_HAVE_ACCOUNT: 'errors.chat_participant_must_have_account',
  CHAT_MESSAGE_NOT_FOUND: 'errors.chat_message_not_found',
  CHAT_CANNOT_DELETE_OTHERS_MESSAGE: 'errors.chat_cannot_delete_others_message',
  CHAT_IMAGE_INVALID_EXTENSION: 'errors.chat_image_invalid_extension',
  CHAT_IMAGE_TOO_LARGE: 'errors.chat_image_too_large',
  CHAT_CANNOT_REMOVE_SELF: 'errors.chat_cannot_remove_self',
  CHAT_RENAME_ONLY_FOR_GROUP: 'errors.chat_rename_only_for_group',

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

/**
 * Resolves the best user-facing message for an API error.
 * - If the error code has an i18n mapping, returns the translated, friendly copy.
 * - Otherwise, falls back to the raw message the backend returned (errorDetail[].message,
 *   or the RFC 7807 detail/title) so an unmapped error code still shows something useful
 *   instead of the generic "unknown error" text.
 * - Only falls back to the generic translation when the backend gave no message at all.
 *
 * @param {unknown} err
 * @param {(key: string) => string} t
 * @param {string} [fallbackCode]
 * @returns {string}
 */
export function getErrorMessage(err, t, fallbackCode = 'ERROR') {
  const errorCode = getApiErrorCode(err, fallbackCode)
  const mappedKey = errorCodeToI18nKey[errorCode]
  if (mappedKey) return t(mappedKey)

  const rawMessage = isApiError(err) ? err.message : ''
  return rawMessage || t('errors.unknown_error')
}

export default errorCodeToI18nKey
