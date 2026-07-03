/** Homepage section component */
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'

const APP_STORE_URL = 'https://apps.apple.com/us/app/nexora-touch/id6775340468'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=net.vlinkgroup.nexora'

export default function HomePageDownloadSection() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-br from-cyan-400 to-blue-500 relative overflow-hidden ds-section" id="download-app">
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-32 -left-16 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-7 space-y-4 text-white text-center lg:text-left">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight leading-tight" data-i18n="dl-title">
                Download and enjoy the experience
              </h2>
              <p className="text-white/90 text-sm sm:text-base leading-relaxed max-w-xl mx-auto lg:mx-0" data-i18n="dl-desc">
                Don't miss out! Download now for seamless functionalities and endless possibilities.
              </p>
            </div>

            <div className="lg:col-span-5">
              <div className="flex flex-wrap justify-center lg:justify-end gap-5 sm:gap-6">
                <div className="flex flex-col items-center gap-3">
                  <a
                    className="bg-white p-3 rounded-2xl shadow-lg ds-control ds-link transition-transform hover:-translate-y-1"
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener"
                    aria-label="Download on the App Store"
                  >
                    <img
                      alt="App Store QR code"
                      className="w-28 h-28 sm:w-32 sm:h-32"
                      src={buildPublicQrImageUrl(APP_STORE_URL, 240)}
                      width={128}
                      height={128}
                      loading="lazy"
                    />
                  </a>
                  <a
                    className="ds-control ds-link transition-transform hover:-translate-y-0.5"
                    href={APP_STORE_URL}
                    target="_blank"
                    rel="noopener"
                    aria-label="Download on the App Store"
                  >
                    <span className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 shadow-md">
                      <svg className="w-6 h-6" viewBox="0 0 384 512" fill="currentColor" aria-hidden="true">
                        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"/>
                      </svg>
                      <span className="flex flex-col leading-none text-left">
                        <span className="text-[9px] font-medium">Download on the</span>
                        <span className="text-base font-semibold -mt-0.5">App Store</span>
                      </span>
                    </span>
                  </a>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <a
                    className="bg-white p-3 rounded-2xl shadow-lg ds-control ds-link transition-transform hover:-translate-y-1"
                    href={GOOGLE_PLAY_URL}
                    target="_blank"
                    rel="noopener"
                    aria-label="Get it on Google Play"
                  >
                    <img
                      alt="Google Play QR code"
                      className="w-28 h-28 sm:w-32 sm:h-32"
                      src={buildPublicQrImageUrl(GOOGLE_PLAY_URL, 240)}
                      width={128}
                      height={128}
                      loading="lazy"
                    />
                  </a>
                  <a
                    className="ds-control ds-link transition-transform hover:-translate-y-0.5"
                    href={GOOGLE_PLAY_URL}
                    target="_blank"
                    rel="noopener"
                    aria-label="Get it on Google Play"
                  >
                    <span className="flex items-center gap-2 bg-black text-white rounded-xl px-4 py-2.5 shadow-md">
                      <svg className="w-6 h-6" viewBox="0 0 512 512" fill="currentColor" aria-hidden="true">
                        <path d="M325.3 234.3 104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z"/>
                      </svg>
                      <span className="flex flex-col leading-none text-left">
                        <span className="text-[9px] font-medium">GET IT ON</span>
                        <span className="text-base font-semibold -mt-0.5">Google Play</span>
                      </span>
                    </span>
                  </a>
                </div>
              </div>
            </div>
          </div>
      </div>
    </section>
  )
}
