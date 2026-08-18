/** Canonical payout / wallet UI keys (API type → UI). One owner — do not re-declare twins. */
export const PayoutUiKey = {
  Zelle: 'zelle',
  BankWire: 'bankwire',
  PayPal: 'paypal',
  Venmo: 'venmo',
  CashApp: 'cashapp',
  AppleCash: 'applecash',
  VlinkPay: 'vlinkpay',
  Crypto: 'crypto',
  Other: 'other',
} as const

/** Backend payment-method `type` wire values. */
export const PayoutApiType = {
  Zelle: 'Zelle',
  BankWire: 'BankWire',
  PayPal: 'PayPal',
  Venmo: 'Venmo',
  CashApp: 'CashApp',
  AppleCash: 'AppleCash',
  VlinkPay: 'VlinkPay',
  Crypto: 'Crypto',
} as const

export type PayoutUiKeyValue = (typeof PayoutUiKey)[keyof typeof PayoutUiKey]
