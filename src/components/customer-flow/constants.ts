/**
 * Shared constants for the customer tipping flow.
 */

/**
 * Wallet identifier keys used across the customer flow (and the dashboard
 * payout configs). Use these instead of bare string literals when matching
 * on a wallet so the values stay consistent in one place.
 */
export const WALLET_KEYS = Object.freeze({
  ZELLE: 'zelle',
  BANKWIRE: 'bankwire',
  PAYPAL: 'paypal',
  VENMO: 'venmo',
  CASHAPP: 'cashapp',
  APPLECASH: 'applecash',
})
