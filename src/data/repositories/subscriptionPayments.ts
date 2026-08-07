import httpClient from '../../lib/httpClient'

type HttpClient = typeof httpClient

export interface SubscriptionPaymentMethod {
  name: string
  symbol: string
  balance: number
  rate: number
  icon: string
}

/** Query `packageType` for subscription package catalog (MD VoiceAI purchase flow). */
export enum SubscriptionPackageType {
  TipPlatform = 'TipPlatform',
  VoiceAI = 'VoiceAI',
}

export type PurchasableSubscriptionPlan = 'Starter' | 'Pro'

/** Wire enum — POST purchase / GET purchase-history `paymentStatus`. */
export enum SubscriptionPaymentStatus {
  Pending = 'Pending',
  Paid = 'Paid',
  Failed = 'Failed',
}

/**
 * UI badge for Package History rows.
 * Paid + validUntil in the future → Active; Paid + past → Expired.
 */
export enum PackageHistoryUiStatus {
  Active = 'active',
  Expired = 'expired',
  Pending = 'pending',
  Failed = 'failed',
}

/** Crypto / wallet purchase response. */
export interface PurchaseSubscriptionResult {
  orderId: string
  referenceId: string
  paymentStatus: SubscriptionPaymentStatus
  packageCode: string
}

export interface InitializeCardPaymentResult {
  orderId: string
  referenceId: string
  clientSecret: string
  publishableKey: string
}

/** PATCH `/api/v1/merchant/subscriptions/{id}/auto-renew` result. */
export interface UpdateSubscriptionAutoRenewResult {
  subscriptionId: string
  autoRenew: boolean
}

/** VoiceAI / MD purchase response (`packageId` + `symbol` body). */
export interface PurchasePackageByIdResult {
  orderId: string
  referenceId: string
  paymentStatus: SubscriptionPaymentStatus
  packageCode: string
}

export interface SubscriptionPackage {
  /** GUID — required as `packageId` for VoiceAI / card POST purchase. */
  id: string
  packageCode: string
  name: string
  /**
   * Touch catalog field. VoiceAI DTOs may omit it — derive UI key from
   * `packageCode` / `name` instead.
   */
  plan: string | null
  featuresEn: string[]
  featuresVi: string[]
  price: number | null
  originalPrice: number | null
  periodInMonths: number | null
}

/** Wire enum from GET `/api/v1/merchant/subscriptions/my-packages` `packageType`. */
export enum SubscriptionMyPackageType {
  TipPlatform = 'TipPlatform',
  VoiceAI = 'VoiceAI',
  Unknown = 'Unknown',
}

/** Wire enum from GET `/api/v1/merchant/subscriptions/my-packages` `status`. */
export enum SubscriptionMyPackageStatus {
  Active = 'Active',
  Trialing = 'Trialing',
  PastDue = 'PastDue',
  Cancelled = 'Cancelled',
  Paused = 'Paused',
  Unknown = 'Unknown',
}

/**
 * Normalized GET `/api/v1/merchant/subscriptions/my-packages` row
 * (`MerchantPackageDto` + live `level`).
 */
export interface SubscriptionMyPackage {
  id: string
  packageType: SubscriptionMyPackageType
  packageCode: string
  name: string
  /** Tier rank within `packageType` (live API; may be absent on older BE). */
  level: number | null
  status: SubscriptionMyPackageStatus
  activatedAt: string | null
  expiresAt: string | null
  autoRenew: boolean
}

/** Normalized GET `/api/v1/merchant/subscriptions/purchase-history` row. */
export interface SubscriptionPurchaseHistoryItem {
  orderId: string
  referenceId: string
  packageCode: string
  planName: string
  periodInMonths: number
  amount: number
  currency: string
  paymentStatus: SubscriptionPaymentStatus
  createdAt: string
  paidAt: string | null
  validUntil: string | null
  uiStatus: PackageHistoryUiStatus
}

function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function readNumber(value: unknown, fallback = 0): number {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : fallback
}

function readNullableNumber(value: unknown): number | null {
  if (value == null) return null
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

function readNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

function normalizePaymentStatus(value: unknown): SubscriptionPaymentStatus {
  const match = Object.values(SubscriptionPaymentStatus).find(
    (status) => status.toLowerCase() === String(value ?? '').trim().toLowerCase(),
  )
  return match ?? SubscriptionPaymentStatus.Failed
}

function resolvePackageHistoryUiStatus(
  paymentStatus: SubscriptionPaymentStatus,
  validUntil: string | null,
  now = new Date(),
): PackageHistoryUiStatus {
  if (paymentStatus === SubscriptionPaymentStatus.Pending) {
    return PackageHistoryUiStatus.Pending
  }
  if (paymentStatus === SubscriptionPaymentStatus.Failed) {
    return PackageHistoryUiStatus.Failed
  }
  if (!validUntil) return PackageHistoryUiStatus.Active
  const end = new Date(validUntil)
  if (Number.isNaN(end.getTime())) return PackageHistoryUiStatus.Active
  return end.getTime() >= now.getTime()
    ? PackageHistoryUiStatus.Active
    : PackageHistoryUiStatus.Expired
}

function normalizePackage(raw: unknown): SubscriptionPackage | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const id = readString(item.id).trim()
  const packageCode = readString(item.packageCode).trim()
  const plan = typeof item.plan === 'string' && item.plan.trim() ? item.plan.trim() : null
  const name = readString(item.name).trim()
  // Touch rows may only have `plan`; VoiceAI rows have `id` + `packageCode`.
  if (!id && !plan && !packageCode) return null
  return {
    id,
    packageCode,
    name: name || plan || packageCode,
    plan,
    featuresEn: Array.isArray(item.featuresEn)
      ? item.featuresEn.filter((f): f is string => typeof f === 'string')
      : [],
    featuresVi: Array.isArray(item.featuresVi)
      ? item.featuresVi.filter((f): f is string => typeof f === 'string')
      : [],
    price: readNullableNumber(item.price),
    originalPrice: readNullableNumber(item.originalPrice),
    periodInMonths: readNullableNumber(item.periodInMonths),
  }
}

function normalizePackages(res: unknown): SubscriptionPackage[] {
  const list = Array.isArray(res) ? res : []
  return list
    .map(normalizePackage)
    .filter((pkg): pkg is SubscriptionPackage => pkg != null)
}

function readBoolean(value: unknown, fallback = false): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  if (typeof value === 'string') {
    const v = value.trim().toLowerCase()
    if (v === 'true' || v === '1') return true
    if (v === 'false' || v === '0') return false
  }
  return fallback
}

function normalizeMyPackageType(value: unknown): SubscriptionMyPackageType {
  const raw = readString(value).trim().toLowerCase()
  const match = Object.values(SubscriptionMyPackageType).find(
    (type) => type !== SubscriptionMyPackageType.Unknown && type.toLowerCase() === raw,
  )
  return match ?? SubscriptionMyPackageType.Unknown
}

function normalizeMyPackageStatus(value: unknown): SubscriptionMyPackageStatus {
  const raw = readString(value).trim().toLowerCase()
  const match = Object.values(SubscriptionMyPackageStatus).find(
    (status) => status.toLowerCase() === raw,
  )
  return match ?? SubscriptionMyPackageStatus.Unknown
}

function normalizeMyPackage(raw: unknown): SubscriptionMyPackage | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>

  const id = readString(item.id).trim()
  if (!id) return null

  const packageCode =
    readString(item.packageCode).trim() || readString(item.name).trim()
  if (!packageCode) return null

  return {
    id,
    packageType: normalizeMyPackageType(item.packageType),
    packageCode,
    name: readString(item.name).trim() || packageCode,
    level: readNullableNumber(item.level),
    status: normalizeMyPackageStatus(item.status),
    activatedAt: readNullableString(item.activatedAt),
    expiresAt: readNullableString(item.expiresAt),
    autoRenew: readBoolean(item.autoRenew, false),
  }
}

function normalizeMyPackages(res: unknown): SubscriptionMyPackage[] {
  const list = Array.isArray(res) ? res : []
  return list
    .map(normalizeMyPackage)
    .filter((pkg): pkg is SubscriptionMyPackage => pkg != null)
}

function normalizePaymentMethod(raw: unknown): SubscriptionPaymentMethod | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const symbol = readString(item.symbol).trim()
  if (!symbol) return null
  return {
    name: readString(item.name) || symbol,
    symbol,
    balance: readNumber(item.balance),
    rate: readNumber(item.rate, 1),
    icon: readString(item.icon),
  }
}

function normalizePaymentMethods(res: unknown): SubscriptionPaymentMethod[] {
  const list = Array.isArray(res) ? res : []
  return list
    .map(normalizePaymentMethod)
    .filter((method): method is SubscriptionPaymentMethod => method != null)
}

function normalizePurchaseHistoryItem(
  raw: unknown,
): SubscriptionPurchaseHistoryItem | null {
  if (!raw || typeof raw !== 'object') return null
  const item = raw as Record<string, unknown>
  const orderId = readString(item.orderId)
  const referenceId = readString(item.referenceId)
  if (!orderId && !referenceId) return null

  const paymentStatus = normalizePaymentStatus(item.paymentStatus)
  const validUntil = readNullableString(item.validUntil)

  return {
    orderId,
    referenceId,
    packageCode: readString(item.packageCode),
    planName: readString(item.planName) || readString(item.packageCode),
    periodInMonths: Math.max(0, Math.trunc(readNumber(item.periodInMonths, 1))),
    amount: readNumber(item.amount, 0),
    currency: readString(item.currency, 'USD') || 'USD',
    paymentStatus,
    createdAt: readString(item.createdAt),
    paidAt: readNullableString(item.paidAt),
    validUntil,
    uiStatus: resolvePackageHistoryUiStatus(paymentStatus, validUntil),
  }
}

function normalizePurchaseHistory(
  res: unknown,
): SubscriptionPurchaseHistoryItem[] {
  const list = Array.isArray(res) ? res : []
  return list
    .map(normalizePurchaseHistoryItem)
    .filter((row): row is SubscriptionPurchaseHistoryItem => row != null)
}

function normalizePurchaseResult(raw: unknown): PurchaseSubscriptionResult {
  const item = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    orderId: readString(item.orderId),
    referenceId: readString(item.referenceId),
    paymentStatus: normalizePaymentStatus(item.paymentStatus),
    packageCode: readString(item.packageCode),
  }
}

function packagesPath(packageType?: SubscriptionPackageType): string {
  if (!packageType) return '/api/v1/merchant/subscriptions/packages'
  return `/api/v1/merchant/subscriptions/packages?packageType=${encodeURIComponent(packageType)}`
}

function myPackagesPath(): string {
  return '/api/v1/merchant/subscriptions/my-packages'
}

function autoRenewPath(subscriptionId: string): string {
  return `/api/v1/merchant/subscriptions/${encodeURIComponent(subscriptionId)}/auto-renew`
}

function normalizeAutoRenewResult(
  raw: unknown,
  fallback: UpdateSubscriptionAutoRenewResult,
): UpdateSubscriptionAutoRenewResult {
  if (!raw || typeof raw !== 'object') return fallback
  const item = raw as Record<string, unknown>
  return {
    subscriptionId: readString(item.subscriptionId).trim() || fallback.subscriptionId,
    autoRenew:
      'autoRenew' in item ? readBoolean(item.autoRenew, fallback.autoRenew) : fallback.autoRenew,
  }
}

function publicPackagesPath(packageType?: SubscriptionPackageType): string {
  if (!packageType) return '/api/v1/public/subscription-packages'
  return `/api/v1/public/subscription-packages?packageType=${encodeURIComponent(packageType)}`
}

export function createSubscriptionPaymentsRepository(client: HttpClient = httpClient) {
  return {
    async getPackages(
      packageType?: SubscriptionPackageType,
    ): Promise<SubscriptionPackage[]> {
      const res = await client.get<unknown>(packagesPath(packageType))
      return normalizePackages(res)
    },

    async getPublicPackages(
      packageType?: SubscriptionPackageType,
    ): Promise<SubscriptionPackage[]> {
      const res = await client.get<unknown>(publicPackagesPath(packageType))
      return normalizePackages(res)
    },

    /** GET `/api/v1/merchant/subscriptions/my-packages` */
    async getMyPackages(): Promise<SubscriptionMyPackage[]> {
      const res = await client.get<unknown>(myPackagesPath())
      return normalizeMyPackages(res)
    },

    /** PATCH `/api/v1/merchant/subscriptions/{id}/auto-renew` */
    async updateAutoRenew(
      subscriptionId: string,
      autoRenew: boolean,
    ): Promise<UpdateSubscriptionAutoRenewResult> {
      const id = String(subscriptionId || '').trim()
      const requested: UpdateSubscriptionAutoRenewResult = {
        subscriptionId: id,
        autoRenew,
      }
      const res = await client.patch<unknown>(autoRenewPath(id), requested)
      return normalizeAutoRenewResult(res, requested)
    },

    async getPaymentMethods(): Promise<SubscriptionPaymentMethod[]> {
      const res = await client.get<unknown>(
        '/api/v1/merchant/subscriptions/payment-methods',
      )
      return normalizePaymentMethods(res)
    },

    /** Tip Platform / wallet: body `{ packageId, symbol }`. */
    async purchase(
      packageId: string,
      symbol: string,
    ): Promise<PurchaseSubscriptionResult> {
      const res = await client.post<unknown>(
        '/api/v1/merchant/subscriptions/purchase',
        { packageId, symbol },
      )
      return normalizePurchaseResult(res)
    },

    /** VoiceAI MD: body `{ packageId, symbol }`. */
    async purchaseByPackageId(
      packageId: string,
      symbol: string,
    ): Promise<PurchasePackageByIdResult> {
      const res = await client.post<unknown>(
        '/api/v1/merchant/subscriptions/purchase',
        { packageId, symbol },
      )
      return normalizePurchaseResult(res)
    },

    async initializeCardPayment(packageId: string): Promise<InitializeCardPaymentResult> {
      return client.post<InitializeCardPaymentResult>(
        '/api/v1/merchant/subscriptions/purchase/card/initialize',
        { packageId },
      )
    },

    /** GET `/api/v1/merchant/subscriptions/purchase-history` */
    async getPurchaseHistory(): Promise<SubscriptionPurchaseHistoryItem[]> {
      const res = await client.get<unknown>(
        '/api/v1/merchant/subscriptions/purchase-history',
      )
      return normalizePurchaseHistory(res)
    },
  }
}

export const subscriptionPaymentsRepository = createSubscriptionPaymentsRepository()
export default subscriptionPaymentsRepository
