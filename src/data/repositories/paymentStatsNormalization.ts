import type {
  MerchantPaymentMethodStat,
  MerchantPaymentStats,
  MerchantPaymentStatusBucket,
} from '../../types/domain'

function readField<T>(raw: Record<string, unknown>, camel: string, pascal: string): T | undefined {
  return (raw[camel] ?? raw[pascal]) as T | undefined
}

function normalizeStatusBucket(raw: Record<string, unknown> | null | undefined): MerchantPaymentStatusBucket {
  const source = raw ?? {}
  return {
    count: Number(readField<number>(source, 'count', 'Count') ?? 0),
    totalAmount: Number(readField<number>(source, 'totalAmount', 'TotalAmount') ?? 0),
  }
}

function normalizePaymentMethodStat(raw: Record<string, unknown>): MerchantPaymentMethodStat | null {
  const method =
    readField<string>(raw, 'method', 'Method')
    ?? readField<string>(raw, 'paymentMethodType', 'PaymentMethodType')
    ?? readField<string>(raw, 'paymentMethod', 'PaymentMethod')
    ?? ''
  if (!method) return null
  return {
    method,
    count: Number(readField<number>(raw, 'count', 'Count') ?? 0),
    totalAmount: Number(readField<number>(raw, 'totalAmount', 'TotalAmount') ?? 0),
  }
}

export function normalizePaymentStats(raw: Record<string, unknown> | null | undefined): MerchantPaymentStats {
  const source = raw ?? {}
  const byStatusRaw = (readField<Record<string, unknown>>(source, 'byStatus', 'ByStatus') ?? {}) as Record<
    string,
    Record<string, unknown>
  >
  const methodsRawValue = source.byPaymentMethod ?? source.ByPaymentMethod
  const methodsRaw = (Array.isArray(methodsRawValue) ? methodsRawValue : []) as Record<string, unknown>[]

  return {
    totalCount: Number(readField<number>(source, 'totalCount', 'TotalCount') ?? 0),
    totalAmount: Number(readField<number>(source, 'totalAmount', 'TotalAmount') ?? 0),
    averageAmount: Number(readField<number>(source, 'averageAmount', 'AverageAmount') ?? 0),
    conversionRate: Number(readField<number>(source, 'conversionRate', 'ConversionRate') ?? 0),
    mostUsedMethod: readField<string | null>(source, 'mostUsedMethod', 'MostUsedMethod') ?? null,
    byStatus: {
      initiated: normalizeStatusBucket(byStatusRaw.initiated ?? byStatusRaw.Initiated),
      confirmed: normalizeStatusBucket(byStatusRaw.confirmed ?? byStatusRaw.Confirmed),
      completed: normalizeStatusBucket(byStatusRaw.completed ?? byStatusRaw.Completed),
    },
    byPaymentMethod: methodsRaw
      .map((item) => normalizePaymentMethodStat(item))
      .filter((item): item is MerchantPaymentMethodStat => Boolean(item)),
  }
}
