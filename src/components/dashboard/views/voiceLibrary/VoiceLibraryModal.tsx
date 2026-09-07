import { useEffect, useRef, useState } from 'react'
import { X, Search } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { VoiceGender } from '../../../../constants/voiceCatalog'
import type { MerchantVoiceLanguageOptionsDto } from '../../../../data/repositories/merchantVoice'
import { stopBookingPreview } from '../../../../utils/bookingVoicePreview'
import { VoiceLibraryItem, VOICE_TK } from './VoiceLibraryItem'
import { useVoiceSamplePlayer } from './useVoiceSamplePlayer'

export function VoiceLibraryModal({ group, selectedId, refreshing, failed, onRetry, onClose, onConfirm }: {
  group: MerchantVoiceLanguageOptionsDto; selectedId: string | null; refreshing: boolean; failed: boolean
  onRetry: () => void; onClose: () => void; onConfirm: (id: string) => void
}) {
  const { t } = useTranslation()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [pendingVoiceId, setPendingVoiceId] = useState(selectedId)
  const [search, setSearch] = useState('')
  const [gender, setGender] = useState<VoiceGender | ''>('')
  const player = useVoiceSamplePlayer()
  useEffect(() => {
    stopBookingPreview()
    const opener = document.activeElement as HTMLElement | null
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => { dialog?.close(); if (opener?.isConnected) opener.focus() }
  }, [])
  const close = () => { player.stop(); onClose() }
  const query = search.trim().toLocaleLowerCase()
  const voices = group.voices.filter((voice) => (!gender || voice.gender === gender) &&
    [voice.displayName, voice.descriptionEn, voice.descriptionVi].some((text) => text?.toLocaleLowerCase().includes(query)))
  const canConfirm = !refreshing && !failed && group.canSelect && group.voices.some((voice) => voice.id === pendingVoiceId)
  return <dialog ref={dialogRef} className="voice-library-modal" aria-labelledby="voice-library-title"
    onCancel={(event) => { event.preventDefault(); close() }}>
    <header className="voice-library-header">
      <div><h2 id="voice-library-title">{t(`${VOICE_TK}.title`)}</h2><p>{t(`${VOICE_TK}.subtitle`)} · {group.languageCode}</p></div>
      <button type="button" className="voice-library-close" onClick={close} aria-label={t(`${VOICE_TK}.close`)}><X size={20} /></button>
    </header>
    <div className="voice-library-filters">
      <label className="voice-library-search"><Search size={18} aria-hidden="true" /><input autoFocus value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(`${VOICE_TK}.search`)} aria-label={t(`${VOICE_TK}.search`)} /></label>
      <select className="voice-library-gender-filter" value={gender} aria-label={t(`${VOICE_TK}.filterGender`)} onChange={(event) => setGender(event.target.value as VoiceGender | '')}>
        {(['', ...Object.values(VoiceGender)] as const).map((value) => <option key={value} value={value}>{value ? t(`${VOICE_TK}.gender.${value}`) : t(`${VOICE_TK}.allVoices`)}</option>)}
      </select>
    </div>
    <div className="voice-library-list" aria-busy={refreshing}>
      <div aria-live="polite">
        {refreshing && <p>{t(`${VOICE_TK}.loading`)}</p>}
        {failed && <p role="alert">{t(`${VOICE_TK}.loadError`)} <button type="button" onClick={onRetry}>{t(`${VOICE_TK}.retry`)}</button></p>}
        {player.error && <p role="alert">{t(`${VOICE_TK}.sampleError`)}</p>}
      </div>
      {voices.map((voice) => <VoiceLibraryItem key={voice.id} voice={voice} selected={pendingVoiceId === voice.id}
        playing={player.playingVoiceId === voice.id} loading={player.loading} onSelect={() => setPendingVoiceId(voice.id)}
        onPlay={() => player.toggle(voice.id, voice.sampleAudioUrl)} />)}
      {!voices.length && !refreshing && !failed && <div className="voice-library-empty"><p>{t(`${VOICE_TK}.${group.voices.length ? 'noResults' : 'empty'}`)}</p>
        {group.voices.length > 0 && <button type="button" onClick={() => { setSearch(''); setGender('') }}>{t(`${VOICE_TK}.clear`)}</button>}
      </div>}
    </div>
    <footer className="voice-library-footer"><span><strong>{t(`${VOICE_TK}.selected`, { name: group.voices.find((voice) => voice.id === pendingVoiceId)?.displayName || t(`${VOICE_TK}.noneSelected`) })}</strong><br />{t(`${VOICE_TK}.saveHint`)}</span><div>
      <button type="button" className="booking-secondary-button" onClick={close}>{t(`${VOICE_TK}.cancel`)}</button>
      <button type="button" className="booking-primary-button" disabled={!canConfirm} onClick={() => { player.stop(); onConfirm(pendingVoiceId) }}>{t(`${VOICE_TK}.useVoice`)}</button>
    </div></footer>
  </dialog>
}
