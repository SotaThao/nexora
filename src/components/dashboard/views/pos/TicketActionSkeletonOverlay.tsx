import { SkeletonList } from '../../../ui/skeleton'

export const TICKET_SKELETON_ROW_COUNT = {
  tip: 2,
  summary: 3,
} as const

export default function TicketActionSkeletonOverlay({
  visible,
  label,
  count = TICKET_SKELETON_ROW_COUNT.summary,
}: {
  visible: boolean
  label: string
  count?: number
}) {
  if (!visible) return null

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      aria-label={label}
      className="absolute inset-0 z-10 cursor-wait overflow-hidden rounded-xl bg-nexoraSurface/90 p-3"
    >
      <SkeletonList count={count} lines={2} showAction />
    </div>
  )
}
