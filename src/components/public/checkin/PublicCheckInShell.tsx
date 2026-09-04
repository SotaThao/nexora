// Full-viewport chrome for public check-in: background, watermark, language.
// The keypad card (logo + salon name + pad) lives in PhoneCheckInStep (appearance="public").
import type { ReactNode } from 'react'
import LanguageSwitcher from '../../ui/LanguageSwitcher'

export default function PublicCheckInShell({ children }: { children: ReactNode }) {
  return (
    <div className="public-checkin-shell relative overflow-hidden">
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full"
        viewBox="0 0 1440 900"
        fill="none"
        aria-hidden="true"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="publicCheckInWave" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#3d9dff" stopOpacity="0" />
            <stop offset="0.28" stopColor="#4eb4ff" stopOpacity="0.95" />
            <stop offset="0.62" stopColor="#7b6cff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#9b5cff" stopOpacity="0" />
          </linearGradient>
          <filter id="publicCheckInWaveGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g filter="url(#publicCheckInWaveGlow)" stroke="url(#publicCheckInWave)" fill="none">
          <path d="M-120 640C160 520 340 780 640 620C940 460 1180 240 1580 520" strokeWidth="3" />
          <path d="M-80 700C200 560 400 840 720 660C1040 480 1260 300 1600 580" strokeWidth="2.2" />
          <path d="M-40 760C240 600 460 900 800 710C1140 520 1340 360 1620 640" strokeWidth="1.6" />
          <path d="M-100 580C140 460 380 720 680 560C980 400 1220 180 1560 460" strokeWidth="1.4" opacity="0.7" />
        </g>
      </svg>
      <div
        className="pointer-events-none absolute -right-[4%] top-[46%] hidden -translate-y-1/2 select-none font-black leading-none text-[#6b4ae0]/20 lg:block"
        aria-hidden="true"
        style={{ fontSize: '26rem' }}
      >
        N
      </div>

      <div className="relative z-10 flex min-h-dvh flex-col px-5 py-6 sm:px-8 lg:px-12 lg:py-10">
        <div className="flex flex-1 items-center justify-center py-8">{children}</div>

        <div className="shrink-0 lg:absolute lg:bottom-10 lg:left-12">
          <LanguageSwitcher variant="public" />
        </div>
      </div>
    </div>
  )
}
