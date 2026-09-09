import { Check, Play, Square } from 'lucide-react'
import type { CSSProperties } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { MerchantVoiceOptionDto } from '../../../../data/repositories/merchantVoice'

export const VOICE_TK = 'components.dashboard.views.BookingHubView.settings.voiceLibrary'
const AVATAR_PAIRS = [
  ['var(--nexora-brand)', 'var(--nexora-electric)'],
  ['var(--nexora-violet)', 'var(--nexora-brand)'],
  ['var(--nexora-success)', 'color-mix(in srgb, var(--nexora-success) 35%, var(--nexora-text))'],
  ['var(--nexora-electric)', 'var(--nexora-violet)'],
  ['var(--nexora-brand-dark)', 'var(--nexora-violet)'],
  ['color-mix(in srgb, var(--nexora-violet) 70%, var(--nexora-text))', 'var(--nexora-violet)'],
] as const

export function voiceInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return parts.slice(0, 2).map((part) => part[0]).join('').toUpperCase()
  return name.trim().slice(0, 2).toUpperCase()
}
export function voiceAvatarGradient(name: string) {
  const index = [...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % AVATAR_PAIRS.length
  const [from, to] = AVATAR_PAIRS[index]
  return `linear-gradient(145deg, ${from}, ${to})`
}
export function VoiceLibraryItem({ voice, selected, playing, loading, onSelect, onPlay }: {
  voice: MerchantVoiceOptionDto; selected: boolean; playing: boolean; loading: boolean
  onSelect: () => void; onPlay: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const description = currentLanguage === 'vi' ? voice.descriptionVi || voice.descriptionEn : voice.descriptionEn || voice.descriptionVi
  return <div className={`voice-library-row ${selected ? 'is-selected' : ''}`}>
    <label className="voice-library-choice">
      <input type="radio" className="sr-only" name="library-voice" value={voice.id} checked={selected} onChange={onSelect} />
      <span className="voice-library-avatar" style={{ '--voice-avatar': voiceAvatarGradient(voice.displayName) } as CSSProperties} aria-hidden="true">{voiceInitials(voice.displayName)}</span>
      <span className="voice-library-copy">
        <span className="voice-library-heading">
          <span className="voice-library-name">{voice.displayName}</span>
          <span className="voice-library-gender">{t(`${VOICE_TK}.gender.${voice.gender}`)}</span>
        </span>
        <span className="voice-library-description">{description}</span>
      </span>
      <span className="voice-library-radio" aria-hidden="true">{selected && <Check size={12} strokeWidth={3} />}</span>
    </label>
    <button type="button" className="booking-secondary-button voice-library-play" onClick={() => { onSelect(); onPlay() }} disabled={!voice.sampleAudioUrl}
      aria-label={t(`${VOICE_TK}.${playing ? 'stopName' : 'playName'}`, { name: voice.displayName })}
      title={!voice.sampleAudioUrl ? t(`${VOICE_TK}.noSample`) : undefined}>
      {playing ? <Square size={16} aria-hidden="true" /> : <Play size={16} fill="currentColor" aria-hidden="true" />}
      <span className="sr-only">{t(`${VOICE_TK}.${!voice.sampleAudioUrl ? 'noSample' : playing ? (loading ? 'loading' : 'stop') : 'play'}`)}</span>
    </button>
  </div>
}
