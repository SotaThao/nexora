// Shared re-ring cooldown: one rate limit on the server (a beep aimed at a tech who already has an
// open call is treated as a nudge on that same row), so every UI entry point that can re-ring a
// tech — the Beeper cell's Nudge button and the primary Beep button (roster Actions column, Turn
// Board station card) — reads the same `canNudge`/`nextNudgeAllowedAt` fields off one helper
// instead of drifting into two copies of the same logic.
import { useEffect, useState } from 'react'
import type { PosBeepApiDto } from '../../../../../types/repositories'
import { parseApiDateTime } from '../../../utils'

// Epoch ms at which the re-ring cooldown ends, or 0 when there is none. The server is still the
// real gate — this only feeds the label and the local re-enable below.
export function beepCooldownUntil(beep: PosBeepApiDto | undefined): number {
  if (!beep || beep.canNudge) return 0
  const allowedAt = parseApiDateTime(beep.nextNudgeAllowedAt)
  return allowedAt ? allowedAt.getTime() : 0
}

// Ticks once a second while a cooldown is running, then stops. Without this the label only moved
// when the feed poll happened to re-render the row, so a "Nudge 6s" (or "Beep 6s") label sat frozen
// and then jumped. Only rows actually counting down hold an interval, so an idle roster costs
// nothing.
export function useCooldownSeconds(cooldownUntil: number): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!cooldownUntil) return
    setNow(Date.now())
    if (cooldownUntil <= Date.now()) return

    const id = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= cooldownUntil) window.clearInterval(id)
    }, 1000)

    return () => window.clearInterval(id)
  }, [cooldownUntil])

  if (!cooldownUntil) return 0
  return Math.max(0, Math.ceil((cooldownUntil - now) / 1000))
}
