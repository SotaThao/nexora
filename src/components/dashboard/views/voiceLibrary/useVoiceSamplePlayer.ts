import { useCallback, useEffect, useRef, useState } from 'react'
import { stopBookingPreview } from '../../../../utils/bookingVoicePreview'

export function useVoiceSamplePlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const generation = useRef(0)
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const stop = useCallback(() => {
    generation.current += 1
    const audio = audioRef.current
    if (audio) {
      audio.pause()
      audio.currentTime = 0
      audio.onended = null
      audio.onerror = null
      audio.onplaying = null
      audio.removeAttribute('src')
      audio.load()
    }
    setPlayingVoiceId(null)
    setLoading(false)
  }, [])
  useEffect(() => stop, [stop])
  const toggle = (id: string, url: string) => {
    const wasPlaying = playingVoiceId === id
    stop()
    setError(false)
    if (wasPlaying) return
    stopBookingPreview()
    const audio = audioRef.current ?? new Audio()
    audioRef.current = audio
    audio.preload = 'none'
    audio.src = url
    const request = generation.current
    setPlayingVoiceId(id)
    setLoading(true)
    const fail = () => {
      if (request !== generation.current) return
      stop()
      setError(true)
    }
    audio.onended = () => { if (request === generation.current) stop() }
    audio.onerror = fail
    audio.onplaying = () => { if (request === generation.current) setLoading(false) }
    try { void audio.play().catch(fail) } catch { fail() }
  }
  return { playingVoiceId, loading, error, toggle, stop }
}
