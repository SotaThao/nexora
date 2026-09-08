import { MerchantVoiceConfigLanguage, type MerchantVoiceLanguageOptionsDto, type MerchantVoiceSelectionDto } from '../../../../data/repositories/merchantVoice'

export function voiceSelectionsForSave(drafts: Record<string, string>, language: MerchantVoiceConfigLanguage, offeredLanguages: readonly string[]): MerchantVoiceSelectionDto[] {
  const active = language === MerchantVoiceConfigLanguage.Auto
    ? [MerchantVoiceConfigLanguage.EnUS, MerchantVoiceConfigLanguage.ViVN]
    : [language]
  return Object.entries(drafts)
    .filter(([code]) => active.includes(code as MerchantVoiceConfigLanguage) && offeredLanguages.includes(code))
    .map(([languageCode, voiceTtsVoiceId]) => ({ languageCode, voiceTtsVoiceId }))
}

export function prepareVoiceSelectionsForSave(
  drafts: Record<string, string>, language: MerchantVoiceConfigLanguage,
  lastKnownLanguages: readonly string[] | undefined, groups: MerchantVoiceLanguageOptionsDto[],
): { selections: MerchantVoiceSelectionDto[]; unavailable: boolean } {
  const expectedLanguages = language === MerchantVoiceConfigLanguage.Auto
    ? lastKnownLanguages ?? groups.map((group) => group.languageCode)
    : [language]
  const selections = voiceSelectionsForSave(drafts, language, expectedLanguages)
  const unavailable = selections.some((selection) => !groups.some((group) =>
    group.languageCode === selection.languageCode && group.canSelect && group.voices.some((voice) => voice.id === selection.voiceTtsVoiceId)))
  return { selections, unavailable }
}
