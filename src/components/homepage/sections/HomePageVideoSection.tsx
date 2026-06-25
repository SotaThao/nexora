/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageVideoSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-20 bg-slate-100 border-b border-line ds-section" id="video-tour">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
            <div className="max-w-3xl mx-auto space-y-3">
              <span className="text-xs font-extrabold text-purple uppercase tracking-widest" data-i18n="vt-eyebrow">PLAY OVERVIEW WALKTHROUGH</span>
              <h2 className="text-3xl sm:text-4xl font-black text-navy" data-i18n="vt-title">How Nexora Touch Drives Growth</h2>
              <p className="text-base text-slate-500 leading-relaxed" data-i18n="vt-desc">Discover how standard retail stores scale technician tips by 40%, lock in thousands of organic Google stars, and drive repeat visits via co-ops.</p>
            </div>
            
            <div className="max-w-4xl mx-auto rounded-[32px] overflow-hidden bg-slate-900 aspect-video shadow-2xl border border-white/20 relative group premium-shadow">
              
              <div className="absolute inset-0 z-10 flex flex-col justify-center items-center text-white bg-cover bg-center transition-all duration-500 p-6" id="video-cover" style={{ backgroundImage: 'linear-gradient(rgba(15, 22, 56, 0.8), rgba(15, 22, 56, 0.5)), url(\'https://images.unsplash.com/photo-1604654894610-df4906b1716f?auto=format&amp' }}>
                <button className="w-20 h-20 rounded-full bg-white text-purple flex items-center justify-center shadow-2xl transform hover:scale-110 active:scale-95 transition-all glow-purple relative z-20 animate-bounce ds-control ds-button" onClick={() => { hp.playIntroVideo() }}>
                  <svg className="w-8 h-8 ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z"></path>
                  </svg>
                </button>
                <p className="mt-4 font-extrabold tracking-wide text-sm sm:text-base uppercase text-white" data-i18n="vt-start">PLAY INTRODUCTORY BRIEF (1 MIN)</p>
                <span className="text-xs mt-1 max-w-sm text-center" data-i18n="vt-start-sub">Walk through instant peer QR routing, Google ratings optimization, and B2B workflows.</span>
              </div>
              
              <iframe allow="autoplay; encrypted-media; picture-in-picture" allowFullScreen className="w-full h-full absolute inset-0" frameBorder="0" id="intro-video-iframe" src="https://www.youtube.com/embed/ghegM-w3NAM?autoplay=0&amp;loop=1&amp;playlist=ghegM-w3NAM"></iframe>
            </div>
          </div>
        </section>
    </>
  )
}
