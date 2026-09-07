import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { VoiceSelectionState } from '../../../../constants/voiceCatalog'
import { useMerchantVoiceOptions } from '../../../../data/hooks/useMerchantVoiceOptions'
import type { MerchantVoiceConfigLanguage } from '../../../../data/repositories/merchantVoice'
import { VoiceLibraryModal } from './VoiceLibraryModal'
import { VOICE_TK } from './VoiceLibraryItem'

function VoiceWaveIcon() {
  return <svg className="voice-library-avatar-icon" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="8.25" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M8 10.2v3.6M10.7 8v8M13.3 9.2v5.6M16 10.6v2.8" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
  </svg>
}

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
        <span className="voice-library-avatar" aria-hidden="true"><VoiceWaveIcon /></span>
        <div className="voice-library-copy">
          <div className="voice-library-heading">
            <span className="voice-library-name">{voice?.displayName || t(`${VOICE_TK}.systemVoice`)}</span>
            <span className={`voice-library-badge is-${state}`}>{t(`${VOICE_TK}.${state}`)}</span>
          </div>
          <div className="voice-library-meta">
            {voice && <span className="voice-library-gender">{t(`${VOICE_TK}.gender.${voice.gender}`)}</span>}
            {voice && description && <span className="voice-library-meta-separator" aria-hidden="true">·</span>}
            {description && <p className="voice-library-description">{description}</p>}
          </div>
          {unsaved && !draftVoice && <p role="alert">{t(`${VOICE_TK}.draftUnavailable`)}</p>}
          {!item.canSelect && <p>{t(`${VOICE_TK}.unavailable`)}</p>}
        </div>
        <button type="button" className="booking-secondary-button" disabled={disabled || !item.canSelect || options.isFetching || options.isError} onClick={() => { onOpen(); setOpenLanguage(item.languageCode); retry() }}>
          <SlidersHorizontal size={16} aria-hidden="true" />
          {t(`${VOICE_TK}.change`)}
        </button>
      </section>
    })}
    {group && <VoiceLibraryModal key={openLanguage} group={group} selectedId={drafts[group.languageCode] ?? group.effectiveVoice?.id ?? null}
      refreshing={options.isFetching} failed={options.isError} onRetry={retry} onClose={() => setOpenLanguage(null)}
      onConfirm={(id) => { onConfirm(group.languageCode, id); setOpenLanguage(null) }} />}
  </div>
}
