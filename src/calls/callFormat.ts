/**
 * callFormat.ts — small formatting helpers shared by CallOverlay (live ticking timer) and the
 * chat-history bubble text (US-06). mm:ss to match the backend's own `FormatDuration` (business
 * doc Luồng 3 example: "Cuộc gọi thoại — 05:32").
 */

function pad2(value: number): string {
  return String(value).padStart(2, '0')
}

export function formatCallDuration(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) && totalSeconds > 0 ? Math.floor(totalSeconds) : 0
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${pad2(minutes)}:${pad2(seconds)}`
}

/** Elapsed time since `startedAt` (ISO timestamp), for the active-call ticking counter. */
export function formatElapsedSince(startedAt: string | null): string {
  if (!startedAt) return formatCallDuration(0)
  const startMs = new Date(startedAt).getTime()
  if (!Number.isFinite(startMs)) return formatCallDuration(0)
  const elapsedSeconds = Math.max(0, Math.floor((Date.now() - startMs) / 1000))
  return formatCallDuration(elapsedSeconds)
}
