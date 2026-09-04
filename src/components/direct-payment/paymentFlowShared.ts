import { payoutTypeToUiKey } from '../../data/paymentMethodTypes'
import {
  formatVlinkpayViaLabel,
  getSingleConfiguredVlinkpayCoin,
  listAvailableVlinkpayCoins,
  normalizeVlinkpayCryptoSymbol,
  resolveVlinkpayAddresses,
  withWalletCryptoSymbol,
  type VlinkpayCryptoAddressDto,
} from '../payout/vlinkpayWallet'
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
  cryptoSymbol?: string
  apiMethod?: PagePaymentMethod
}

type PaymentFlowWallet = SelectedWallet & {
  apiMethod?: PagePaymentMethod | unknown
}

type SelectWalletFlowDeps = {
  validateAmount: () => boolean
  setSelectedWalletObj: (wallet: PaymentFlowWallet) => void
  setSelectedWallet: (name: string) => void
  setStep: (step: DirectPaymentStep) => void
  createPaymentForWallet: (
    wallet: PaymentFlowWallet,
    cryptoSymbol?: string,
  ) => Promise<boolean>
  onCreatePaymentError: (err: unknown) => void
  onVlinkpayAwaitAsset: (wallet: PaymentFlowWallet) => void
  logCreatePaymentError: (err: unknown) => void
}

export function mapPageMethodsToWalletOptions(methods: PagePaymentMethod[] | null | undefined) {
  const ordered = (methods ?? [])
    .map((method) => ({
      ...method,
      uiKey: method.uiKey || payoutTypeToUiKey(method.type),
    }))
    .filter((method) => method.uiKey !== WALLET_KEYS.BANKWIRE)

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
  return String(wallet?.key || '').toLowerCase() === WALLET_KEYS.VLINKPAY
}

/** Count configured VlinkPay assets on a public payment-page method row. */
export function listVlinkpayCoinsFromPageMethod(method?: PagePaymentMethod | null) {
  if (!method) return []
  return listAvailableVlinkpayCoins(resolvePageMethodVlinkpayAddresses(method))
}

function resolvePageMethodVlinkpayAddresses(method?: PagePaymentMethod | null) {
  return resolveVlinkpayAddresses({
    accountInfo: method?.accountInfo ?? null,
    cryptoAddresses: method?.cryptoAddresses as VlinkpayCryptoAddressDto[] | null | undefined,
  })
}

/** Sole configured coin on a payment-page method row, if any. */
export function getSingleConfiguredVlinkpayCoinFromPageMethod(method?: PagePaymentMethod | null) {
  return getSingleConfiguredVlinkpayCoin(resolvePageMethodVlinkpayAddresses(method))
}

/** Apply create-payment result onto wallet + selected-crypto state. */
export function applyCreatedPaymentWalletState<T extends Record<string, unknown>>(
  wallet: T,
  cryptoSymbol: string | null | undefined,
  setters: {
    setSelectedCryptoSymbol: (symbol: string | null) => void
    setSelectedWalletObj: (wallet: T & { cryptoSymbol?: string }) => void
  },
) {
  const normalized = cryptoSymbol ? normalizeVlinkpayCryptoSymbol(cryptoSymbol) : null
  setters.setSelectedCryptoSymbol(normalized)
  setters.setSelectedWalletObj(withWalletCryptoSymbol(wallet, normalized) ?? wallet)
}

/**
 * Shared wallet-select branch for merchant/staff direct payment:
 * single VLINKPAY asset → create payment immediately; multiple → asset picker.
 */
export async function runDirectPaymentWalletSelect(
  wallet: PaymentFlowWallet,
  deps: SelectWalletFlowDeps,
): Promise<void> {
  if (!deps.validateAmount()) return
  if (!wallet.methodId) return

  deps.setSelectedWalletObj(wallet)
  deps.setSelectedWallet(wallet.name || '')

  if (isVlinkpayWallet(wallet)) {
    const singleCoin = getSingleConfiguredVlinkpayCoinFromPageMethod(
      wallet.apiMethod as PagePaymentMethod | null | undefined,
    )

    if (singleCoin) {
      try {
        await deps.createPaymentForWallet(wallet, singleCoin.symbol)
        deps.setStep(DIRECT_PAYMENT_STEP.WalletDetails)
      } catch (err) {
        deps.logCreatePaymentError(err)
        deps.onCreatePaymentError(err)
      }
      return
    }

    deps.onVlinkpayAwaitAsset(wallet)
    deps.setStep(DIRECT_PAYMENT_STEP.WalletDetails)
    return
  }

  try {
    await deps.createPaymentForWallet(wallet)
    deps.setStep(DIRECT_PAYMENT_STEP.WalletDetails)
  } catch (err) {
    deps.logCreatePaymentError(err)
    deps.onCreatePaymentError(err)
  }
}

/** Method name shown opposite VIA — VLINKPAY · USDV (VRC20) when a coin is selected. */
export function resolvePaymentMethodViaDisplay(
  wallet?: {
    key?: string
    name?: string
    cryptoSymbol?: string
    apiMethod?: PagePaymentMethod
  } | null,
  cryptoSymbol?: string | null,
): string {
  if (!wallet) return ''
  if (!isVlinkpayWallet(wallet)) return wallet.name || ''

  const selected = normalizeVlinkpayCryptoSymbol(cryptoSymbol || wallet.cryptoSymbol)
  if (selected) return formatVlinkpayViaLabel(selected)

  const singleCoin = getSingleConfiguredVlinkpayCoinFromPageMethod(wallet.apiMethod ?? null)
  if (singleCoin) return formatVlinkpayViaLabel(singleCoin.symbol)
  return formatVlinkpayViaLabel(null)
}

export type DirectPaymentAmountError = 'too_low' | 'too_high' | null

/**
 * Inline validation for the amount field, shared by the merchant and staff
 * payment screens. Stays silent while the field is untouched — an empty input
 * is "not filled in yet", not an error — then flags anything the API would
 * reject (min $1.00, max $10,000.00) as the customer types.
 */
export function resolveDirectPaymentAmountError(
  rawInput: string,
  amount: number,
  minAmount: number,
  maxAmount: number,
): DirectPaymentAmountError {
  if (!String(rawInput ?? '').trim()) return null
  if (!Number.isFinite(amount) || amount < minAmount) return 'too_low'
  if (amount > maxAmount) return 'too_high'
  return null
}
