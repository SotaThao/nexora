/**
 * Incoming-call ringtone and outgoing-call ringback (US-05/US-06) — both synthesized via Web Audio
 * (no ringtone audio asset exists in this repo), started/stopped centrally from `callState.ts`'s
 * `setState` on every transition into/out of `'incoming-ringing'` / `'outgoing-ringing'` so neither
 * can be left playing regardless of which exit path ends the call (answer, decline, cancel,
 * cancel-by-peer, tab-race loss, no-answer timeout, error).
 *
 * Best-effort: browsers can block audio without a prior user gesture (same constraint noted in
 * `StaffBeepAlert.tsx`) — `AudioContext.resume()` failures are swallowed so blocked audio never
 * breaks the call flow. `navigator.vibrate` runs in parallel as a mobile fallback signal for the
 * incoming ringtone only — the caller's own device has no reason to vibrate while dialing out.
 */
import { logger } from '../utils/logger'

const RING_ON_MS = 1200
const RING_OFF_MS = 3000
const RING_CYCLE_MS = RING_ON_MS + RING_OFF_MS
const TONE_FREQUENCY_A = 440
const TONE_FREQUENCY_B = 480
const TONE_GAIN = 0.18
const VIBRATE_PATTERN = [RING_ON_MS, RING_OFF_MS]

// Single lower tone with a slower cadence — mirrors traditional telephony ringback so it reads as
// distinctly different from the two-tone incoming ringtone above.
const RINGBACK_ON_MS = 2000
const RINGBACK_OFF_MS = 4000
const RINGBACK_CYCLE_MS = RINGBACK_ON_MS + RINGBACK_OFF_MS
const RINGBACK_TONE_FREQUENCY = 425

let audioContext: AudioContext | null = null
let ringTimer: ReturnType<typeof setTimeout> | null = null
let vibrateTimer: ReturnType<typeof setInterval> | null = null
let isRinging = false

let ringbackTimer: ReturnType<typeof setTimeout> | null = null
let isRingingBack = false

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext
  const AudioContextCtor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  audioContext = new AudioContextCtor()
  return audioContext
}

/** One tone burst: the given frequencies faded in/out over `durationMs`. */
function playToneBurst(ctx: AudioContext, frequencies: number[], durationMs: number) {
  const now = ctx.currentTime
  const onSeconds = durationMs / 1000
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(TONE_GAIN, now + 0.05)
  gain.gain.setValueAtTime(TONE_GAIN, now + onSeconds - 0.05)
  gain.gain.linearRampToValueAtTime(0.0001, now + onSeconds)
  gain.connect(ctx.destination)

  for (const frequency of frequencies) {
    const oscillator = ctx.createOscillator()
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    oscillator.start(now)
    oscillator.stop(now + onSeconds)
  }
}

function scheduleNextBurst() {
  if (!isRinging) return
  const ctx = getAudioContext()
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => { if (isRinging) playToneBurst(ctx, [TONE_FREQUENCY_A, TONE_FREQUENCY_B], RING_ON_MS) })
        .catch((error: unknown) => logger.warn('Community call: ringtone playback blocked', error))
    } else {
      playToneBurst(ctx, [TONE_FREQUENCY_A, TONE_FREQUENCY_B], RING_ON_MS)
    }
  }
  ringTimer = setTimeout(scheduleNextBurst, RING_CYCLE_MS)
}

export function startRingtone(): void {
  if (isRinging) return
  isRinging = true
  scheduleNextBurst()
  if (navigator.vibrate) {
    navigator.vibrate(VIBRATE_PATTERN)
    vibrateTimer = setInterval(() => {
      if (isRinging) navigator.vibrate?.(VIBRATE_PATTERN)
    }, RING_CYCLE_MS)
  }
}

export function stopRingtone(): void {
  if (!isRinging) return
  isRinging = false
  if (ringTimer) {
    clearTimeout(ringTimer)
    ringTimer = null
  }
  if (vibrateTimer) {
    clearInterval(vibrateTimer)
    vibrateTimer = null
  }
  navigator.vibrate?.(0)
}

function scheduleNextRingbackBurst() {
  if (!isRingingBack) return
  const ctx = getAudioContext()
  if (ctx) {
    if (ctx.state === 'suspended') {
      ctx.resume()
        .then(() => { if (isRingingBack) playToneBurst(ctx, [RINGBACK_TONE_FREQUENCY], RINGBACK_ON_MS) })
        .catch((error: unknown) => logger.warn('Community call: ringback playback blocked', error))
    } else {
      playToneBurst(ctx, [RINGBACK_TONE_FREQUENCY], RINGBACK_ON_MS)
    }
  }
  ringbackTimer = setTimeout(scheduleNextRingbackBurst, RINGBACK_CYCLE_MS)
}

export function startRingback(): void {
  if (isRingingBack) return
  isRingingBack = true
  scheduleNextRingbackBurst()
}

export function stopRingback(): void {
  if (!isRingingBack) return
  isRingingBack = false
  if (ringbackTimer) {
    clearTimeout(ringbackTimer)
    ringbackTimer = null
  }
}
