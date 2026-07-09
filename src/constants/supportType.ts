/** Values sent as `supportType` to POST /api/v1/Client/contact-requests */
export enum SupportType {
  TipPaymentIssue = 'Tip Payment Issue',
  QrCodeSetup = 'QR Code Setup',
  StaffAccount = 'Staff Account',
  BillingPlan = 'Billing & Plan',
  ReviewRouting = 'Review Routing',
  TechnicalBug = 'Technical Bug',
  Other = 'Other',
}

export const SUPPORT_TYPE_OPTIONS = [
  SupportType.TipPaymentIssue,
  SupportType.QrCodeSetup,
  SupportType.StaffAccount,
  SupportType.BillingPlan,
  SupportType.ReviewRouting,
  SupportType.TechnicalBug,
  SupportType.Other,
] as const

export const SUPPORT_TYPE_I18N_KEYS: Record<(typeof SUPPORT_TYPE_OPTIONS)[number], string> = {
  [SupportType.TipPaymentIssue]: 'tip_payment',
  [SupportType.QrCodeSetup]: 'qr_code',
  [SupportType.StaffAccount]: 'staff_account',
  [SupportType.BillingPlan]: 'billing_plan',
  [SupportType.ReviewRouting]: 'review_routing',
  [SupportType.TechnicalBug]: 'technical_bug',
  [SupportType.Other]: 'other',
}

export const DEFAULT_SUPPORT_TYPE = SupportType.TipPaymentIssue
