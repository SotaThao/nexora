/** Homepage section component */
import { useEffect, useState, useSyncExternalStore } from 'react'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import { getInitialHomePageLanguage } from '../homepageLogic.js'
import {
  getIntroVideoThumbnailPath,
  INTRO_VIDEO_WATCH_URL,
  INTRO_VIDEO_YOUTUBE_THUMB_URL,
  openIntroYouTubeVideo,
  shouldOpenYouTubeExternally,
  shouldUseYouTubeVideoThumbnail,
} from '../../../utils/youtubeIntroVideo.js'

function getHomePageLang() {
  if (typeof document === 'undefined') return getInitialHomePageLanguage()
  return document.documentElement.lang === 'vi' ? 'vi' : 'en'
}

function subscribeHomePageLang(onStoreChange: () => void) {
  if (typeof document === 'undefined') return () => {}
  const observer = new MutationObserver(onStoreChange)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  return () => observer.disconnect()
}

function PlayButtonIcon() {
  return (
    <svg className="ml-1 h-8 w-8" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 5v14l11-7z" />
    </svg>
  )
}

export default function HomePageVideoSection() {
  const { hp } = useHomePageBridge()
  const homepageLang = useSyncExternalStore(
    subscribeHomePageLang,
    getHomePageLang,
    getInitialHomePageLanguage,
  )
  const useExternalYouTube = shouldOpenYouTubeExternally()
  const preferYouTubeThumbnail = useExternalYouTube || shouldUseYouTubeVideoThumbnail()
  const [videoThumbnailSrc, setVideoThumbnailSrc] = useState(() =>
    getIntroVideoThumbnailPath(homepageLang, { preferYouTube: preferYouTubeThumbnail }),
  )

  useEffect(() => {
    setVideoThumbnailSrc(
      getIntroVideoThumbnailPath(homepageLang, { preferYouTube: preferYouTubeThumbnail }),
    )
  }, [homepageLang, preferYouTubeThumbnail])

  const handleThumbnailError = () => {
    setVideoThumbnailSrc((current) =>
      current === INTRO_VIDEO_YOUTUBE_THUMB_URL ? current : INTRO_VIDEO_YOUTUBE_THUMB_URL,
    )
  }

  const handlePlayClick = () => {
    if (useExternalYouTube) {
      openIntroYouTubeVideo()
      return
    }
    hp.playIntroVideo()
  }

  return (
    <section className="ds-section border-b border-line bg-slate-100 py-16 sm:py-20" id="video-tour">
      <div className="mx-auto max-w-7xl space-y-6 px-4 text-center sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple" data-i18n="vt-eyebrow">
            PLAY OVERVIEW WALKTHROUGH
          </span>
          <h2 className="text-3xl font-black text-navy sm:text-4xl" data-i18n="vt-title">
            How Nexora Touch Drives Growth
          </h2>
          <p className="text-base leading-relaxed text-slate-500" data-i18n="vt-desc">
            Discover how standard retail stores scale technician tips by 40%, lock in thousands of organic Google
            stars, and drive repeat visits via co-ops.
          </p>
        </div>

        <div className="premium-shadow group relative mx-auto aspect-video max-w-4xl overflow-hidden rounded-[32px] border border-white/20 bg-slate-900 shadow-2xl">
          <img
            src={videoThumbnailSrc}
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover"
            onError={handleThumbnailError}
          />
          <div
            className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/55 via-slate-900/35 to-slate-900/65 p-6 text-white transition-all duration-500"
            id="video-cover"
          >
            {useExternalYouTube ? (
              <a
                href={INTRO_VIDEO_WATCH_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="relative z-20 flex w-20 h-20 items-center justify-center rounded-full bg-white text-purple shadow-2xl transition-all glow-purple animate-bounce hover:scale-110 active:scale-95 ds-control ds-button"
                aria-label="Watch on YouTube"
              >
                <PlayButtonIcon />
              </a>
            ) : (
              <button
                type="button"
                className="relative z-20 flex w-20 h-20 items-center justify-center rounded-full bg-white text-purple shadow-2xl transition-all glow-purple animate-bounce hover:scale-110 active:scale-95 ds-control ds-button"
                onClick={handlePlayClick}
                aria-label="Play introductory video"
              >
                <PlayButtonIcon />
              </button>
            )}
            <p className="mt-4 text-sm font-extrabold uppercase tracking-wide text-white sm:text-base" data-i18n="vt-start">
              PLAY INTRODUCTORY BRIEF (1 MIN)
            </p>
            <span className="mt-1 max-w-sm text-center text-xs" data-i18n="vt-start-sub">
              Walk through instant peer QR routing, Google ratings optimization, and B2B workflows.
            </span>
            {useExternalYouTube ? (
              <span className="mt-3 text-[11px] font-bold uppercase tracking-wide text-white/80" data-i18n="vt-open-youtube">
                Opens in YouTube
              </span>
            ) : null}
          </div>

          {!useExternalYouTube ? (
            <iframe
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
              frameBorder={0}
              id="intro-video-iframe"
              title="Nexora Touch overview video"
            />
          ) : null}
        </div>
      </div>
    </section>
  )
}
