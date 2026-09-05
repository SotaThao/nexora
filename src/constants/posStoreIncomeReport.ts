export const PosStoreIncomeReportMode = {
  Day: 'Day',
  Week: 'Week',
  Year: 'Year',
  Range: 'Range',
} as const

export type PosStoreIncomeReportMode =
  (typeof PosStoreIncomeReportMode)[keyof typeof PosStoreIncomeReportMode]

export const POS_STORE_INCOME_PAYMENT_METHODS = [
  'Card',
  'Cash',
  'GiftCard',
  'Zelle',
  'CashApp',
  'Venmo',
  'VlinkPay',
  'AppleCash',
  'PayPal',
] as const

export const POS_STORE_INCOME_SPLIT_PAYMENT_METHOD = 'SplitPay' as const

export type PosStoreIncomePaymentMethod =
  | (typeof POS_STORE_INCOME_PAYMENT_METHODS)[number]
  | typeof POS_STORE_INCOME_SPLIT_PAYMENT_METHOD
