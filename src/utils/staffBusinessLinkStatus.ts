type StaffBusinessLinkStatusSource = {
  linkStatusLabel?: string | null
  linkStatus?: string | number | null
  status?: string | number | null
}

const LINK_STATUS_LABEL_BY_CODE: Record<number, string> = {
  0: 'Pending',
  1: 'Active',
  2: 'Inactive',
  3: 'Rejected',
  5: 'Inactive',
}

export function resolveStaffBusinessLinkStatusLabel(
  source: StaffBusinessLinkStatusSource,
): string {
  const label = source.linkStatusLabel?.trim()
  if (label) return label

  const raw = source.status ?? source.linkStatus
  if (typeof raw === 'string') {
    const trimmed = raw.trim()
    if (trimmed && Number.isNaN(Number(trimmed))) return trimmed
  }

  const code = Number(raw)
  if (!Number.isNaN(code) && LINK_STATUS_LABEL_BY_CODE[code] != null) {
    return LINK_STATUS_LABEL_BY_CODE[code]
  }

  return 'Active'
}

export function getStaffBusinessLinkStatusPresentation(label: string): {
  className: string
  translationKey: string | null
} {
  const normalized = label.trim().toLowerCase()

  if (normalized === 'active') {
    return {
      className: 'bg-emerald-50 text-emerald-600',
      translationKey: 'staff_dashboard.status.active',
    }
  }

  if (normalized === 'pending' || normalized.includes('pending link')) {
    return {
      className: 'bg-amber-50 text-amber-700',
      translationKey: 'staff_dashboard.status.pending',
    }
  }

  if (normalized.includes('pending approval')) {
    return {
      className: 'bg-amber-50 text-amber-700',
      translationKey: 'staff_dashboard.status.pending_approval',
    }
  }

  if (normalized.includes('pending unlink')) {
    return {
      className: 'bg-rose-50 text-rose-600',
      translationKey: 'staff_dashboard.status.pending_unlink',
    }
  }

  if (normalized === 'rejected' || normalized.includes('rejected')) {
    return {
      className: 'bg-rose-50 text-rose-700',
      translationKey: 'staff_dashboard.status.rejected',
    }
  }

  if (normalized === 'inactive' || normalized.includes('inactive')) {
    return {
      className: 'bg-nexoraCanvas text-nexoraMuted',
      translationKey: 'staff_dashboard.status.inactive',
    }
  }

  return {
    className: 'bg-nexoraCanvas text-nexoraMuted',
    translationKey: null,
  }
}
