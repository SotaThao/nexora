import { PayoutUiKey } from '../../data/payoutUiKeys'

/**
 * Shared constants for the customer tipping flow.
 */

/**
 * Wallet identifier keys used across the customer flow (and the dashboard
 * payout configs). Use these instead of bare string literals when matching
 * on a wallet so the values stay consistent in one place.
 */
export const WALLET_KEYS = Object.freeze({
  ZELLE: PayoutUiKey.Zelle,
  BANKWIRE: PayoutUiKey.BankWire,
  PAYPAL: PayoutUiKey.PayPal,
  VENMO: PayoutUiKey.Venmo,
  CASHAPP: PayoutUiKey.CashApp,
  APPLECASH: PayoutUiKey.AppleCash,
  VLINKPAY: PayoutUiKey.VlinkPay,
})
