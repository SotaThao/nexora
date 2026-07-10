export const INTRO_VIDEO_ID = 'ghegM-w3NAM'

export const INTRO_VIDEO_WATCH_URL = `https://www.youtube.com/watch?v=${INTRO_VIDEO_ID}`

export const INTRO_VIDEO_EMBED_URL =
  `https://www.youtube.com/embed/${INTRO_VIDEO_ID}?autoplay=0&loop=1&playlist=${INTRO_VIDEO_ID}`

export const INTRO_VIDEO_YOUTUBE_THUMB_URL =
  `https://img.youtube.com/vi/${INTRO_VIDEO_ID}/hqdefault.jpg`

/** Local homepage poster art (language-specific SVG). */
export function getIntroVideoThumbnailPath(lang = 'en', options = {}) {
  const { preferYouTube = false } = options
  if (preferYouTube) {
    return INTRO_VIDEO_YOUTUBE_THUMB_URL
  }

  const suffix = lang === 'vi' ? 'vi' : 'en'
  const base = (import.meta.env.BASE_URL || '/').replace(/\/?$/, '')
  return `${base}/homepage/assets/images/video-thumb-${suffix}.png`
}

/** WKWebView on iOS/native shells often fails to render large SVG posters via <img>. */
export function shouldUseYouTubeVideoThumbnail() {
  return isIOSDevice()
}

/** iPhone, iPad, and iPadOS (desktop UA with touch). */
export function isIOSDevice() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || ''
  const platform = navigator.platform || ''
  if (/iPad|iPhone|iPod/i.test(ua)) return true
  return platform === 'MacIntel' && navigator.maxTouchPoints > 1
}

/** YouTube embeds fail in iOS WKWebView (Error 153) — open the watch URL instead. */
export function shouldOpenYouTubeExternally() {
  return isIOSDevice()
}

export function openIntroYouTubeVideo() {
  const link = document.createElement('a')
  link.href = INTRO_VIDEO_WATCH_URL
  link.target = '_blank'
  link.rel = 'noopener noreferrer'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
