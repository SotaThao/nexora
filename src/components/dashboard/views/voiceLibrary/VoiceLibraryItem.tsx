import { Play, Square } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { MerchantVoiceOptionDto } from '../../../../data/repositories/merchantVoice'

export const VOICE_TK = 'components.dashboard.views.BookingHubView.settings.voiceLibrary'
export function voiceInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join('').toUpperCase()
}
export function VoiceLibraryItem({ voice, selected, playing, loading, onSelect, onPlay }: {
  voice: MerchantVoiceOptionDto; selected: boolean; playing: boolean; loading: boolean
  onSelect: () => void; onPlay: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const description = currentLanguage === 'vi' ? voice.descriptionVi || voice.descriptionEn : voice.descriptionEn || voice.descriptionVi
  return <div className={`voice-library-row ${selected ? 'is-selected' : ''}`}>
    <label className="voice-library-choice">
      <input type="radio" name="library-voice" value={voice.id} checked={selected} onChange={onSelect} />
      <span className="voice-library-avatar" aria-hidden="true">{voiceInitials(voice.displayName)}</span>
      <span className="voice-library-copy">
        <span className="voice-library-name">{voice.displayName} <span className="voice-library-gender">{t(`${VOICE_TK}.gender.${voice.gender}`)}</span></span>
        <span className="voice-library-description">{description}</span>
      </span>
    </label>
    <button type="button" className="booking-secondary-button voice-library-play" onClick={onPlay} disabled={!voice.sampleAudioUrl}
      aria-label={t(`${VOICE_TK}.${playing ? 'stopName' : 'playName'}`, { name: voice.displayName })}
      title={!voice.sampleAudioUrl ? t(`${VOICE_TK}.noSample`) : undefined}>
      {playing ? <Square size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
      <span>{t(`${VOICE_TK}.${!voice.sampleAudioUrl ? 'noSample' : playing ? (loading ? 'loading' : 'stop') : 'play'}`)}</span>
    </button>
  </div>
}
