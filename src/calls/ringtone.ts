/**
 * Incoming-call ringtone (US-05/US-06) — synthesized via Web Audio (no ringtone audio asset exists
 * in this repo), started/stopped centrally from `callState.ts`'s `setState` on every transition
 * into/out of `'incoming-ringing'` so it can never be left playing regardless of which exit path
 * ends the call (answer, decline, cancel-by-peer, tab-race loss, error).
 *
 * Best-effort: browsers can block audio without a prior user gesture (same constraint noted in
 * `StaffBeepAlert.tsx`) — `AudioContext.resume()` failures are swallowed so a blocked ringtone never
 * breaks the call flow. `navigator.vibrate` runs in parallel as a mobile fallback signal.
 */
import { logger } from '../utils/logger'

const RING_ON_MS = 1200
const RING_OFF_MS = 3000
const RING_CYCLE_MS = RING_ON_MS + RING_OFF_MS
const TONE_FREQUENCY_A = 440
const TONE_FREQUENCY_B = 480
const TONE_GAIN = 0.18
const VIBRATE_PATTERN = [RING_ON_MS, RING_OFF_MS]

let audioContext: AudioContext | null = null
let ringTimer: ReturnType<typeof setTimeout> | null = null
let vibrateTimer: ReturnType<typeof setInterval> | null = null
let isRinging = false

function getAudioContext(): AudioContext | null {
  if (audioContext) return audioContext
  const AudioContextCtor = window.AudioContext
    ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextCtor) return null
  audioContext = new AudioContextCtor()
  return audioContext
}

/** One ring "brrring" burst: two tones faded in/out over `RING_ON_MS`. */
function playToneBurst(ctx: AudioContext) {
  const now = ctx.currentTime
  const onSeconds = RING_ON_MS / 1000
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.linearRampToValueAtTime(TONE_GAIN, now + 0.05)
  gain.gain.setValueAtTime(TONE_GAIN, now + onSeconds - 0.05)
  gain.gain.linearRampToValueAtTime(0.0001, now + onSeconds)
  gain.connect(ctx.destination)

  for (const frequency of [TONE_FREQUENCY_A, TONE_FREQUENCY_B]) {
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
        .then(() => { if (isRinging) playToneBurst(ctx) })
        .catch((error: unknown) => logger.warn('Community call: ringtone playback blocked', error))
    } else {
      playToneBurst(ctx)
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
