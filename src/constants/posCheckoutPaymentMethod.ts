import { PayoutApiType } from '../data/payoutUiKeys'
import type { TFunction } from '../types/contexts'

export const PosCheckoutPaymentMethod = {
  Card: 'Card',
  Cash: 'Cash',
  GiftCard: 'GiftCard',
  SplitPay: 'SplitPay',
  Zelle: PayoutApiType.Zelle,
  CashApp: PayoutApiType.CashApp,
  Venmo: PayoutApiType.Venmo,
  VlinkPay: PayoutApiType.VlinkPay,
  AppleCash: PayoutApiType.AppleCash,
  PayPal: PayoutApiType.PayPal,
} as const

export type PosCheckoutPaymentMethodType =
  (typeof PosCheckoutPaymentMethod)[keyof typeof PosCheckoutPaymentMethod]

export const POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX =
  'components.dashboard.views.pos.PosOrderWorkspace.paymentMethod'

export const POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS: Record<
  PosCheckoutPaymentMethodType,
  string
> = {
  [PosCheckoutPaymentMethod.Card]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.Card`,
  [PosCheckoutPaymentMethod.Cash]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.Cash`,
  [PosCheckoutPaymentMethod.GiftCard]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.GiftCard`,
  [PosCheckoutPaymentMethod.SplitPay]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.SplitPay`,
  [PosCheckoutPaymentMethod.Zelle]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.Zelle`,
  [PosCheckoutPaymentMethod.CashApp]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.CashApp`,
  [PosCheckoutPaymentMethod.Venmo]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.Venmo`,
  [PosCheckoutPaymentMethod.VlinkPay]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.VlinkPay`,
  [PosCheckoutPaymentMethod.AppleCash]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.AppleCash`,
  [PosCheckoutPaymentMethod.PayPal]: `${POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX}.PayPal`,
}

export const POS_CHECKOUT_PAYMENT_METHOD_ICON_SOURCES: Partial<
  Record<PosCheckoutPaymentMethodType, string>
> = {
  [PosCheckoutPaymentMethod.Card]: '/assets/images/pos-payment/credit-debit-card-icon.png',
  [PosCheckoutPaymentMethod.Cash]: '/assets/images/pos-payment/cash.png',
  [PosCheckoutPaymentMethod.GiftCard]: '/assets/images/pos-payment/gift_card.png',
  [PosCheckoutPaymentMethod.SplitPay]: '/assets/images/pos-payment/split_pay.png',
  [PosCheckoutPaymentMethod.Zelle]: '/assets/images/pos-payment/zelle.png',
  [PosCheckoutPaymentMethod.CashApp]: '/assets/images/pos-payment/cash_app.png',
  [PosCheckoutPaymentMethod.Venmo]: '/assets/images/pos-payment/venmo.png',
  [PosCheckoutPaymentMethod.VlinkPay]: '/assets/vlinkpay-logo.png',
  [PosCheckoutPaymentMethod.AppleCash]: '/assets/images/pos-payment/apple_cash.png',
  [PosCheckoutPaymentMethod.PayPal]: '/assets/images/pos-payment/paypal.png',
}

export const POS_CHECKOUT_PAYMENT_METHOD_OPTIONS = [
  PosCheckoutPaymentMethod.Cash,
  PosCheckoutPaymentMethod.Card,
  PosCheckoutPaymentMethod.GiftCard,
  PosCheckoutPaymentMethod.SplitPay,
  PosCheckoutPaymentMethod.Zelle,
  PosCheckoutPaymentMethod.CashApp,
  PosCheckoutPaymentMethod.Venmo,
  PosCheckoutPaymentMethod.VlinkPay,
  PosCheckoutPaymentMethod.AppleCash,
  PosCheckoutPaymentMethod.PayPal,
].map((value) => ({
  value,
  labelKey: POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS[value],
  iconSrc: POS_CHECKOUT_PAYMENT_METHOD_ICON_SOURCES[value],
}))

export function isPosCheckoutPaymentMethod(
  value: string | null | undefined,
): value is PosCheckoutPaymentMethodType {
  return Boolean(value) && Object.prototype.hasOwnProperty.call(
    POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEYS,
    value,
  )
}

export function getPosCheckoutPaymentMethodLabel(
  value: string | null | undefined,
  t: TFunction,
  emptyFallback = '—',
  labelKeyPrefix = POS_CHECKOUT_PAYMENT_METHOD_LABEL_KEY_PREFIX,
): string {
  if (!value) return emptyFallback
  return isPosCheckoutPaymentMethod(value)
    ? t(`${labelKeyPrefix}.${value}`)
    : value
}
