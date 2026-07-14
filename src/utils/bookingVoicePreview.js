const EN_VOICE_HINTS = [
  'samantha',
  'karen',
  'moira',
  'tessa',
  'google us english',
  'microsoft aria',
  'jenny',
  'zira',
  'daniel',
  'google uk english female',
  'premium',
  'natural',
  'enhanced',
]

const VI_VOICE_HINTS = [
  'google tiếng việt',
  'google vietnamese',
  'linh',
  'ban mai',
  'chi',
  'female',
  'premium',
  'natural',
]

const SPEECH_TUNING = {
  'en-US': { rate: 0.9, pitch: 1, volume: 1 },
  'vi-VN': { rate: 0.93, pitch: 1, volume: 1 },
}

function normalizeLang(lang) {
  if (!lang) return 'en-US'
  const lower = lang.toLowerCase()
  if (lower.startsWith('vi')) return 'vi-VN'
  if (lower.startsWith('en')) return 'en-US'
  return lang
}

function scoreVoice(voice, lang, hints) {
  let score = 0
  const name = voice.name.toLowerCase()
  const voiceLang = voice.lang.toLowerCase()
  const targetLang = lang.toLowerCase()

  if (voiceLang === targetLang) score += 12
  else if (voiceLang.startsWith(targetLang.split('-')[0])) score += 6

  if (!voice.localService) score += 14

  hints.forEach((hint, index) => {
    if (name.includes(hint)) score += 18 - index
  })

  if (name.includes('compact')) score -= 8
  if (name.includes('cellos')) score -= 6

  return score
}

export function pickBookingVoice(lang, voices = []) {
  const normalizedLang = normalizeLang(lang)
  const hints = normalizedLang.startsWith('vi') ? VI_VOICE_HINTS : EN_VOICE_HINTS
  const langPrefix = normalizedLang.split('-')[0]

  const matches = voices.filter((voice) => voice.lang.toLowerCase().startsWith(langPrefix))
  const pool = matches.length ? matches : voices

  const ranked = pool
    .map((voice) => ({ voice, score: scoreVoice(voice, normalizedLang, hints) }))
    .sort((a, b) => b.score - a.score)

  return ranked[0]?.voice ?? null
}

export function detectSpeechLang(text, fallback = 'en-US') {
  const sample = String(text || '').trim()
  if (!sample) return fallback
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i.test(sample)) {
    return 'vi-VN'
  }
  return 'en-US'
}

export function resolvePreviewSpeechLang(language, text) {
  if (language === 'vi') return 'vi-VN'
  if (language === 'en') return 'en-US'
  return detectSpeechLang(text, 'vi-VN')
}

export function getSpeechTuning(lang) {
  const normalizedLang = normalizeLang(lang)
  return SPEECH_TUNING[normalizedLang] || SPEECH_TUNING['en-US']
}

export function loadSpeechVoices() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return Promise.resolve([])
  }

  const existing = window.speechSynthesis.getVoices()
  if (existing.length) return Promise.resolve(existing)

  return new Promise((resolve) => {
    let settled = false

    const finish = () => {
      if (settled) return
      settled = true
      window.speechSynthesis.removeEventListener('voiceschanged', finish)
      resolve(window.speechSynthesis.getVoices())
    }

    window.speechSynthesis.addEventListener('voiceschanged', finish)
    window.setTimeout(finish, 600)
  })
}

export async function speakBookingPreview({
  text,
  language,
  onStart,
  onEnd,
  onError,
}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    throw new Error('speech-not-supported')
  }

  const trimmed = String(text || '').trim()
  if (!trimmed) throw new Error('speech-empty')

  const voices = await loadSpeechVoices()
  const speechLang = resolvePreviewSpeechLang(language, trimmed)
  const tuning = getSpeechTuning(speechLang)
  const voice = pickBookingVoice(speechLang, voices)

  const utterance = new SpeechSynthesisUtterance(trimmed)
  utterance.lang = speechLang
  utterance.rate = tuning.rate
  utterance.pitch = tuning.pitch
  utterance.volume = tuning.volume
  if (voice) utterance.voice = voice

  utterance.onstart = onStart
  utterance.onend = onEnd
  utterance.onerror = onError

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)

  return utterance
}

export function stopBookingPreview() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
}
