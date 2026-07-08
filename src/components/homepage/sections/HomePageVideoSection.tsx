/** Homepage section component */
import { useEffect, useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { homepageTranslations } from '../i18n/homepageTranslations'
import type { HomePageTranslationKey } from '../i18n/homepageTranslations'

const VIDEO_IDS: Record<string, string> = {
  en: 'ghegM-w3NAM',
  vi: 'SCMEBiQHIsk',
}

const VIDEO_THUMBNAILS: Record<string, string> = {
  en: '/homepage/assets/images/video-thumb-en.svg',
  vi: '/homepage/assets/images/video-thumb-vi.svg',
}

function buildEmbedUrl(videoId: string, autoplay: 0 | 1) {
  return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay}&mute=1&loop=1&playlist=${videoId}`
}

function getYoutubeThumbnailFallback(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export default function HomePageVideoSection() {
  const { currentLanguage } = useTranslation()
  const lang = currentLanguage === 'vi' ? 'vi' : 'en'
  const videoId = VIDEO_IDS[lang] ?? VIDEO_IDS.en
  const thumbnailSrc = VIDEO_THUMBNAILS[lang] ?? VIDEO_THUMBNAILS.en

  const t = (key: HomePageTranslationKey) =>
    homepageTranslations[lang][key] ?? homepageTranslations.en[key]

  const [isPlaying, setIsPlaying] = useState(false)
  const [iframeSrc, setIframeSrc] = useState(() => buildEmbedUrl(videoId, 0))
  const [thumbSrc, setThumbSrc] = useState(thumbnailSrc)

  useEffect(() => {
    setThumbSrc(thumbnailSrc)
  }, [thumbnailSrc])

  useEffect(() => {
    setIframeSrc((prev) => {
      const autoplay = prev.includes('autoplay=1') ? 1 : 0
      return buildEmbedUrl(videoId, autoplay)
    })
  }, [videoId])

  function handlePlay() {
    setIsPlaying(true)
    setIframeSrc(buildEmbedUrl(videoId, 1))
  }

  function handleThumbError() {
    setThumbSrc(getYoutubeThumbnailFallback(videoId))
  }

  return (
    <>
      <section className="py-16 sm:py-20 bg-slate-100 border-b border-line ds-section" id="video-tour">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="max-w-3xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-purple uppercase tracking-widest" data-i18n="vt-eyebrow">
              {t('vt-eyebrow')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-navy" data-i18n="vt-title">
              {t('vt-title')}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 leading-relaxed" data-i18n="vt-desc">
              {t('vt-desc')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto rounded-[32px] overflow-hidden bg-slate-900 aspect-video shadow-2xl border border-white/20 relative group premium-shadow">
            <div
              className="absolute inset-0 z-10 transition-all duration-500"
              id="video-cover"
              style={{
                opacity: isPlaying ? 0 : 1,
                pointerEvents: isPlaying ? 'none' : 'auto',
              }}
            >
              <img
                src={thumbSrc}
                alt={t('vt-thumb-alt')}
                className="absolute inset-0 w-full h-full object-cover"
                onError={handleThumbError}
              />

              <div className="absolute inset-0 bg-gradient-to-t from-[#0f1638]/85 via-[#0f1638]/35 to-[#0f1638]/15" />

              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-white">
                <button
                  type="button"
                  className="w-20 h-20 rounded-full bg-white text-purple flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all glow-purple relative z-20 ds-control ds-button"
                  onClick={handlePlay}
                  aria-label={t('vt-start')}
                >
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <p className="mt-4 font-extrabold tracking-wide text-sm sm:text-base uppercase" data-i18n="vt-start">
                  {t('vt-start')}
                </p>
                <span className="text-xs mt-1 max-w-sm text-center text-indigo-100" data-i18n="vt-start-sub">
                  {t('vt-start-sub')}
                </span>
              </div>

              <div className="absolute top-4 left-4 sm:top-5 sm:left-5">
                <span
                  className="inline-flex items-center rounded-full bg-white/15 border border-white/25 px-3 py-1 text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-sm"
                  data-i18n="vt-thumb-duration"
                >
                  {t('vt-thumb-duration')}
                </span>
              </div>
            </div>

            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="w-full h-full absolute inset-0"
              frameBorder="0"
              id="intro-video-iframe"
              src={iframeSrc}
              title={t('vt-thumb-alt')}
            />
          </div>
        </div>
      </section>
    </>
  )
}
