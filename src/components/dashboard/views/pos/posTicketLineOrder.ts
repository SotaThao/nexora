import type { OrderServiceLineApiDto } from '../../../../types/repositories'

/**
 * Reading order for the service lines on a ticket: technicians in the order they were put on the
 * ticket, and inside each technician the services in the order the front desk rang them up.
 *
 * Lines with nobody assigned yet come first — they are the ones still needing a decision before
 * Start Service, and a line just added sits there until it gets a technician.
 *
 * A technician's block is placed by the EARLIEST assignment in it, not by each line's own
 * timestamp, so adding a second service for a technician already on the ticket joins their existing
 * block instead of opening a new one further down.
 */
type OrderableServiceLine = Pick<
  OrderServiceLineApiDto,
  'id' | 'addedAt' | 'assignedAt' | 'assignedPosStaffProfileId' | 'technicianName'
>

const UNASSIGNED_GROUP_KEY = ''

interface LineGroup<TLine> {
  lines: TLine[]
  assignedAt: number
  addedAt: number
  technicianName: string
}

// A timestamp that cannot be read sorts as "unknown, therefore oldest": it keeps the comparison
// total instead of letting NaN make the order depend on the input sequence.
function toTime(value: string | null | undefined): number {
  if (!value) return Number.NEGATIVE_INFINITY
  const time = Date.parse(value)
  return Number.isNaN(time) ? Number.NEGATIVE_INFINITY : time
}

export function sortTicketServiceLines<TLine extends OrderableServiceLine>(
  serviceLines: readonly TLine[],
): TLine[] {
  const groups = new Map<string, LineGroup<TLine>>()

  for (const line of serviceLines) {
    const key = line.assignedPosStaffProfileId ?? UNASSIGNED_GROUP_KEY
    const addedAt = toTime(line.addedAt)
    // Rows written before AssignedAt existed fall back to when the line was added, so a legacy
    // ticket still groups sensibly instead of collapsing to one "unknown" block.
    const assignedAt = line.assignedPosStaffProfileId ? toTime(line.assignedAt ?? line.addedAt) : 0
    const existing = groups.get(key)

    if (existing) {
      existing.lines.push(line)
      existing.assignedAt = Math.min(existing.assignedAt, assignedAt)
      existing.addedAt = Math.min(existing.addedAt, addedAt)
      continue
    }

    groups.set(key, {
      lines: [line],
      assignedAt,
      addedAt,
      technicianName: line.technicianName ?? '',
    })
  }

  return [...groups.entries()]
    .sort(([leftKey, left], [rightKey, right]) => {
      if (leftKey === UNASSIGNED_GROUP_KEY) return -1
      if (rightKey === UNASSIGNED_GROUP_KEY) return 1
      // Check-in stamps every line it creates at the same instant, so the tie-breaks below are the
      // normal path for a ticket booked in advance, not a rare one.
      return left.assignedAt - right.assignedAt
        || left.addedAt - right.addedAt
        || left.technicianName.localeCompare(right.technicianName)
    })
    .flatMap(([, group]) =>
      [...group.lines].sort((left, right) =>
        toTime(left.addedAt) - toTime(right.addedAt) || left.id.localeCompare(right.id)),
    )
}
