// Mirrors of the backend enums behind POS > Salon Settings > SMS Settings, plus the editor's
// fixed content (insert chips, quick templates). Wait Care and Automation Settings are deferred
// to a later ticket, so they have no entries here.

export const PosSmsSendMode = {
  Automatic: 'Automatic',
  // Only a setting for now: messages wait as PendingManual until the manual-send screen exists.
  Manual: 'Manual',
} as const
export type PosSmsSendMode = (typeof PosSmsSendMode)[keyof typeof PosSmsSendMode]

export const PosSmsTemplateType = {
  Welcome: 'Welcome',
  AfterCheckout: 'AfterCheckout',
} as const
export type PosSmsTemplateType = (typeof PosSmsTemplateType)[keyof typeof PosSmsTemplateType]

export const PosSmsSettingsSubTab = {
  Welcome: 'welcome',
  AfterCheckout: 'after-checkout',
  Link: 'link',
} as const
export type PosSmsSettingsSubTab = (typeof PosSmsSettingsSubTab)[keyof typeof PosSmsSettingsSubTab]

export const PosVisitLandingMode = {
  DuringVisit: 'DuringVisit',
  AfterVisit: 'AfterVisit',
  Cancelled: 'Cancelled',
  Expired: 'Expired',
} as const
export type PosVisitLandingMode = (typeof PosVisitLandingMode)[keyof typeof PosVisitLandingMode]

// The `/q/:token/:section` shortcuts the After Checkout message links to.
export const PosVisitSection = {
  Review: 'review',
  Tip: 'tip',
  Feedback: 'feedback',
} as const
export type PosVisitSection = (typeof PosVisitSection)[keyof typeof PosVisitSection]

export const POS_VISIT_ROUTE = {
  path: '/q/:token',
  sectionPath: '/q/:token/:section',
} as const

// Tokens exactly as the backend renders them. The chip label is translated; the token is not.
export const PosSmsPlaceholder = {
  CustomerName: '[Customer Name]',
  SalonName: '[Salon Name]',
  VisitLink: '[OneQR Link]',
  SalonPhone: '[Salon Phone]',
  TicketNumber: '[Ticket Number]',
  TicketTotal: '[Ticket Total]',
  ReceiptLink: '[Receipt Link]',
  ReviewLink: '[Review Link]',
  TipLink: '[Tip Link]',
  FeedbackLink: '[Feedback Link]',
  BookingLink: '[Booking Link]',
} as const
export type PosSmsPlaceholder = (typeof PosSmsPlaceholder)[keyof typeof PosSmsPlaceholder]

export type PosSmsInsertChip = { labelKey: string; token: PosSmsPlaceholder }

export const POS_SMS_INSERT_CHIPS: Record<PosSmsTemplateType, PosSmsInsertChip[]> = {
  [PosSmsTemplateType.Welcome]: [
    { labelKey: 'customerName', token: PosSmsPlaceholder.CustomerName },
    { labelKey: 'shopName', token: PosSmsPlaceholder.SalonName },
    { labelKey: 'visitLink', token: PosSmsPlaceholder.VisitLink },
    { labelKey: 'phoneNumber', token: PosSmsPlaceholder.SalonPhone },
  ],
  [PosSmsTemplateType.AfterCheckout]: [
    { labelKey: 'shopName', token: PosSmsPlaceholder.SalonName },
    { labelKey: 'ticketNumber', token: PosSmsPlaceholder.TicketNumber },
    { labelKey: 'ticketTotal', token: PosSmsPlaceholder.TicketTotal },
    { labelKey: 'reviewLink', token: PosSmsPlaceholder.ReviewLink },
    { labelKey: 'tipLink', token: PosSmsPlaceholder.TipLink },
    { labelKey: 'feedbackLink', token: PosSmsPlaceholder.FeedbackLink },
    { labelKey: 'bookingLink', token: PosSmsPlaceholder.BookingLink },
    { labelKey: 'receiptLink', token: PosSmsPlaceholder.ReceiptLink },
  ],
}

// Quick templates are English starting points; whatever the manager types is what gets sent.
export type PosSmsQuickTemplate = { id: string; labelKey: string; body: string }

export const POS_SMS_QUICK_TEMPLATES: Record<PosSmsTemplateType, PosSmsQuickTemplate[]> = {
  [PosSmsTemplateType.Welcome]: [
    {
      id: 'welcomeMessage',
      labelKey: 'welcomeMessage',
      body: 'Hi [Customer Name], welcome to [Salon Name]! You\'re checked in. View your visit: [OneQR Link]',
    },
    {
      id: 'checkInConfirmed',
      labelKey: 'checkInConfirmed',
      body: 'Hi [Customer Name], you\'re checked in at [Salon Name]. Follow your visit: [OneQR Link]',
    },
  ],
  [PosSmsTemplateType.AfterCheckout]: [
    {
      id: 'ticketReceipt',
      labelKey: 'ticketReceipt',
      body: 'Thanks for visiting [Salon Name]! Ticket [Ticket Number]: [Ticket Total]. Receipt: [Receipt Link]',
    },
    {
      id: 'reviewRequest',
      labelKey: 'reviewRequest',
      body: 'Thanks for visiting [Salon Name]! How was your visit? Leave a review: [Review Link]',
    },
    {
      id: 'tipFollowUp',
      labelKey: 'tipFollowUp',
      body: 'Thanks for visiting [Salon Name]! If you haven\'t tipped yet, add one here: [Tip Link]',
    },
    {
      id: 'privateFeedback',
      labelKey: 'privateFeedback',
      body: 'Thanks for visiting [Salon Name]! Share private feedback: [Feedback Link]',
    },
    {
      id: 'bookNextVisit',
      labelKey: 'bookNextVisit',
      body: 'Thanks for visiting [Salon Name]! Book your next visit: [Booking Link]',
    },
  ],
}

// Example values for the phone preview. The backend fills real ones when it sends.
export const POS_SMS_PREVIEW_VALUES: Record<PosSmsPlaceholder, string> = {
  [PosSmsPlaceholder.CustomerName]: 'Sarah',
  [PosSmsPlaceholder.SalonName]: '',
  [PosSmsPlaceholder.VisitLink]: 'nexora.app/q/••••',
  [PosSmsPlaceholder.SalonPhone]: '(713) 555-0123',
  [PosSmsPlaceholder.TicketNumber]: '#12',
  [PosSmsPlaceholder.TicketTotal]: '$45.00',
  [PosSmsPlaceholder.ReceiptLink]: 'nexora.app/receipt/••••',
  [PosSmsPlaceholder.ReviewLink]: 'nexora.app/q/••••/review',
  [PosSmsPlaceholder.TipLink]: 'nexora.app/q/••••/tip',
  [PosSmsPlaceholder.FeedbackLink]: 'nexora.app/q/••••/feedback',
  [PosSmsPlaceholder.BookingLink]: 'nexora.app/booking/••••',
}

export const POS_SMS_BODY_MAX_LENGTH = 3200
