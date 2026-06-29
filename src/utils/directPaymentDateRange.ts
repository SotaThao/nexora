function toIsoDate(date: Date) {
  return date.toISOString().split('T')[0]
}

export function toApiDateTime(dateStr: string, endOfDay = false) {
  if (!dateStr) return undefined
  if (dateStr.includes('T')) return dateStr
  return endOfDay ? `${dateStr}T23:59:59` : `${dateStr}T00:00:00`
}

export function resolveDirectPaymentDateRange(
  preset: string,
  startDate = '',
  endDate = '',
): { from?: string; to?: string } {
  const today = new Date()

  if (preset === 'today') {
    const value = toIsoDate(today)
    return { from: toApiDateTime(value), to: toApiDateTime(value, true) }
  }
  if (preset === '7days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 7)
    return {
      from: toApiDateTime(toIsoDate(limit)),
      to: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === '30days') {
    const limit = new Date(today)
    limit.setDate(limit.getDate() - 30)
    return {
      from: toApiDateTime(toIsoDate(limit)),
      to: toApiDateTime(toIsoDate(today), true),
    }
  }
  if (preset === 'custom') {
    return {
      from: startDate ? toApiDateTime(startDate) : undefined,
      to: endDate ? toApiDateTime(endDate, true) : undefined,
    }
  }
  return {}
}
