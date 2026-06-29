/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageCtaSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-slate-50 ds-section">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-indigo-950 to-purple rounded-[48px] p-5 sm:p-8 lg:p-14 text-center text-white relative overflow-hidden premium-shadow">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(22,183,255,0.15),transparent)]">
              </div>
              <div className="absolute -top-32 -left-32 w-64 h-64 bg-white/5 rounded-full blur-2xl"></div>
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight" data-i18n="cta-title">Unlock Beautiful Localized Retentive Networks</h2>
                <p className="text-indigo-100 text-sm sm:text-base leading-relaxed" data-i18n="cta-desc">Empower your technical workforce, collect valuable validated reviews on major search maps, and expand your community reach today.</p>
                <div className="pt-4 flex flex-row flex-wrap justify-center gap-4">
                  <button className="bg-white hover:bg-slate-100 text-purple font-black text-sm px-8 py-4 rounded-full shadow-lg transition-all active:scale-95 ds-control ds-button nx-hero-btn" data-i18n="btn-cta-1" onClick={planCta}>Request Custom Consulting</button>
                  <a className="bg-[rgba(255,255,255,0.10)] hover:bg-[rgba(255,255,255,0.20)] text-white hover:text-white font-extrabold text-sm px-8 py-4 rounded-full border border-white/10 transition-all text-center ds-control ds-button nx-hero-btn" data-i18n="btn-cta-2" href="#simulator">Interact With Live Simulator</a>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
