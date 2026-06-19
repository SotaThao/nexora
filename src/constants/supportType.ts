/** Values sent as `supportType` to POST /api/v1/Client/contact-requests */
export enum SupportType {
  PaymentGateway = 'Payment Gateway',
  POS = 'Free POS System Info',
  BusinessWebsite = 'Business Website',
  Marketing = 'Marketing',
  TechnicalSupport = 'Technical Support',
  Partnership = 'Becoming a Partner',
  Other = 'Other',
}

export const SUPPORT_TYPE_OPTIONS = [
  SupportType.PaymentGateway,
  SupportType.POS,
  SupportType.BusinessWebsite,
  SupportType.Marketing,
  SupportType.Other,
] as const

export const SUPPORT_TYPE_I18N_KEYS: Record<(typeof SUPPORT_TYPE_OPTIONS)[number], string> = {
  [SupportType.PaymentGateway]: 'payment',
  [SupportType.POS]: 'pos',
  [SupportType.BusinessWebsite]: 'website',
  [SupportType.Marketing]: 'marketing',
  [SupportType.Other]: 'other',
}
