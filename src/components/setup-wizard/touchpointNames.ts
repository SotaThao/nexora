interface TouchpointNameSource {
  id?: unknown
  name?: string
  type?: string
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function buildTouchpointAutoName(
  type: string,
  touchPoints: TouchpointNameSource[],
  excludeId?: unknown,
) {
  const normalizedType = type.trim() || 'Station'
  const suffixPattern = new RegExp(`^${escapeRegExp(normalizedType)}\\s+(\\d+)$`, 'i')
  const usedNumbers = new Set<number>()

  touchPoints.forEach((touchpoint) => {
    if (touchpoint.id === excludeId || touchpoint.type !== type) return
    const match = touchpoint.name?.trim().match(suffixPattern)
    if (match) usedNumbers.add(Number(match[1]))
  })

  let sequence = 1
  while (usedNumbers.has(sequence)) sequence += 1

  return `${normalizedType} ${String(sequence).padStart(2, '0')}`
}
