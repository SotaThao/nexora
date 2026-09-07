import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { VoiceSelectionState } from '../../../../constants/voiceCatalog'
import { useMerchantVoiceOptions } from '../../../../data/hooks/useMerchantVoiceOptions'
import type { MerchantVoiceConfigLanguage } from '../../../../data/repositories/merchantVoice'
import { VoiceLibraryModal } from './VoiceLibraryModal'
import { voiceInitials, VOICE_TK } from './VoiceLibraryItem'

export function VoiceSelectionCard({ language, drafts, disabled, onConfirm, onOpen }: {
  language: MerchantVoiceConfigLanguage; drafts: Record<string, string>; disabled: boolean
  onConfirm: (language: string, id: string) => void; onOpen: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const options = useMerchantVoiceOptions(language)
  const [openLanguage, setOpenLanguage] = useState<string | null>(null)
  const group = options.data?.languages.find((item) => item.languageCode === openLanguage)
  const retry = () => { void options.refetch() }
  return <div className="voice-selection-cards">
    {options.isPending && <p role="status">{t(`${VOICE_TK}.${options.fetchStatus === 'idle' ? 'unavailable' : 'loading'}`)}</p>}
    {options.isError && <p role="alert">{t(`${VOICE_TK}.loadError`)} <button type="button" className="booking-secondary-button" onClick={retry}>{t(`${VOICE_TK}.retry`)}</button></p>}
    {!options.isPending && !options.isError && !options.data?.languages.length && <p>{t(`${VOICE_TK}.empty`)}</p>}
    {options.data?.languages.map((item) => {
      const draftId = drafts[item.languageCode]
      const draftVoice = item.voices.find((voice) => voice.id === draftId)
      const voice = draftVoice || item.effectiveVoice
      const unsaved = Boolean(draftId)
      const state = unsaved ? 'unsaved' : item.selectionState === VoiceSelectionState.Assigned ? 'active' : item.selectionState === VoiceSelectionState.Fallback ? 'fallback' : 'default'
      const description = currentLanguage === 'vi' ? voice?.descriptionVi || voice?.descriptionEn : voice?.descriptionEn || voice?.descriptionVi
      return <section className="voice-selection-card" key={item.languageCode} aria-label={t(`${VOICE_TK}.cardLabel`, { language: item.languageCode })}>
        <span className="voice-library-avatar" aria-hidden="true">{voiceInitials(voice?.displayName || '?')}</span>
        <div className="voice-library-copy">
          <div className="voice-library-name">{voice?.displayName || t(`${VOICE_TK}.systemVoice`)} <span className={`voice-library-badge is-${state}`}>{t(`${VOICE_TK}.${state}`)}</span></div>
          <div className="voice-library-gender">{item.languageCode}{voice && ` · ${t(`${VOICE_TK}.gender.${voice.gender}`)}`}</div>
          <p className="voice-library-description">{description}</p>
          {unsaved && !draftVoice && <p role="alert">{t(`${VOICE_TK}.draftUnavailable`)}</p>}
          {!item.canSelect && <p>{t(`${VOICE_TK}.unavailable`)}</p>}
        </div>
        <button type="button" className="booking-secondary-button" disabled={disabled || !item.canSelect || options.isFetching || options.isError} onClick={() => { onOpen(); setOpenLanguage(item.languageCode); retry() }}>{t(`${VOICE_TK}.change`)}</button>
      </section>
    })}
    {group && <VoiceLibraryModal key={openLanguage} group={group} selectedId={drafts[group.languageCode] ?? group.effectiveVoice?.id ?? null}
      refreshing={options.isFetching} failed={options.isError} onRetry={retry} onClose={() => setOpenLanguage(null)}
      onConfirm={(id) => { onConfirm(group.languageCode, id); setOpenLanguage(null) }} />}
  </div>
}
