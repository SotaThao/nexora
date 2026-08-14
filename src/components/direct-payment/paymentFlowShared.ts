import { payoutTypeToUiKey, sortPaymentMethodsByUiOrder } from '../../data/paymentMethodTypes'
import { WALLET_KEYS } from '../customer-flow/constants'
import { getWalletOptions } from '../customer-flow/steps/Payment'

export const DIRECT_PAYMENT_STEP = {
  Review: 'review',
  Processing: 'processing',
  WalletDetails: 'wallet_details',
  Success: 'success',
} as const

export type DirectPaymentStep = (typeof DIRECT_PAYMENT_STEP)[keyof typeof DIRECT_PAYMENT_STEP]

type PagePaymentMethod = {
  id?: string
  type?: string
  uiKey?: string
  accountInfo?: string | null
  accountName?: string | null
  cryptoAddresses?: unknown
  imageUrl?: string | null
}

type SelectedWallet = {
  methodId?: string
  name?: string
  key?: string
  apiMethod?: PagePaymentMethod
}

export function mapPageMethodsToWalletOptions(methods: PagePaymentMethod[] | null | undefined) {
  const ordered = sortPaymentMethodsByUiOrder(
    (methods ?? []).map((method) => ({
      ...method,
      uiKey: method.uiKey || payoutTypeToUiKey(method.type),
    })),
  ).filter((method) => method.uiKey !== WALLET_KEYS.BANKWIRE)

  return ordered
    .map((method) => {
      const wallet = getWalletOptions([method.uiKey || ''])[0]
      if (!wallet) return null
      return {
        ...wallet,
        methodId: method.id,
        apiMethod: method,
      }
    })
    .filter(Boolean)
}

export function toWalletTipPaymentMethodsData(activePaymentMethod?: PagePaymentMethod | null) {
  if (!activePaymentMethod) return null
  return [
    {
      type: activePaymentMethod.type,
      uiKey: activePaymentMethod.uiKey || payoutTypeToUiKey(activePaymentMethod.type),
      accountInfo: activePaymentMethod.accountInfo,
      accountName: activePaymentMethod.accountName ?? null,
      cryptoAddresses: activePaymentMethod.cryptoAddresses ?? null,
    },
  ]
}

export function mergeCreatedPaymentMethod(
  pageMethod?: PagePaymentMethod | null,
  createdMethod?: PagePaymentMethod | null,
): PagePaymentMethod | null {
  if (!createdMethod) return pageMethod ?? null
  return {
    ...pageMethod,
    ...createdMethod,
    accountName: createdMethod.accountName ?? pageMethod?.accountName ?? null,
    cryptoAddresses: createdMethod.cryptoAddresses ?? pageMethod?.cryptoAddresses ?? null,
  }
}

export function resolveWalletVlinkpayCryptoAddresses(
  activePaymentMethod?: PagePaymentMethod | null,
  selectedWallet?: SelectedWallet | null,
) {
  return activePaymentMethod?.cryptoAddresses
    ?? selectedWallet?.apiMethod?.cryptoAddresses
    ?? null
}

export function isVlinkpayWallet(wallet?: { key?: string } | null): boolean {
  return wallet?.key === WALLET_KEYS.VLINKPAY
}
