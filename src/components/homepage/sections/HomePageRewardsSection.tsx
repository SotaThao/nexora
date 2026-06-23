/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageRewardsSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-white border-b border-line ds-section" id="customer-rewards">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-extrabold text-purple uppercase tracking-widest" data-i18n="cr-eyebrow">CLIENT LOYALTY PORTAL</span>
                <h2 className="text-3xl sm:text-4xl font-black text-navy leading-tight" data-i18n="cr-title">Instant Membership Points Lookup Hub</h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed" data-i18n="cr-desc">Nexora operates cleanly without forcing complex application installs on customer phones. Enter any registered phone below to check active tiers, cross-alliance point totals, and ready vouchers.</p>
                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex gap-3 items-start shadow-sm ds-elevate">
                  <span className="text-xl">⭐</span>
                  <p className="text-xs text-indigo-950 font-medium">
                    <span data-i18n="cr-tips-prompt">Try registered demo phone numbers:</span> <span className="text-purple font-extrabold">(714) 555-0199</span>, <span className="text-purple font-extrabold">(626)
                      555-0144</span> <span data-i18n="cr-tips-prompt-sub">to observe instant updates rendering directly in the mockup screen.</span>
                  </p>
                </div>
              </div>
              
              <div className="lg:col-span-6 bg-slate-50 border border-slate-200 rounded-[32px] p-6 sm:p-8 shadow-xl ds-surface">
                <div className="space-y-4">
                  <h3 className="font-extrabold text-navy text-lg text-center" data-i18n="cr-card-title">Enter Customer Phone Number to Query</h3>
                  <div className="flex gap-2">
                    <input className="flex-1 text-sm p-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-purple font-medium shadow-sm ds-field" data-i18n="ph-cr-lookup" id="external-lookup-phone" placeholder="(714) 555-0199" type="tel" maxLength={14} onInput={(e) => hp.maskUSPhone(e.currentTarget)} />
                    <button className="bg-purple text-white hover:bg-indigo-700 px-5 rounded-xl text-xs font-extrabold transition-all ds-control ds-button" data-i18n="btn-cr-lookup" onClick={() => { hp.lookupExternalLoyalty() }}>Check Profile</button>
                  </div>
                  
                  <div className="bg-gradient-to-br from-[#111633] to-[#34237a] text-white p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-lg hidden animate-fadeIn" id="lookup-result-card">
                    <div className="relative z-10 flex justify-between items-start">
                      <div>
                        <h4 className="font-extrabold text-sm" id="res-cust-name">Jennifer H.</h4>
                        <span className="text-[9px] text-slate-300 font-bold uppercase tracking-wider block mt-1" id="res-cust-phone">Tel: (714) 555-0199</span>
                      </div>
                      <span className="text-[10px] bg-white/20 text-white font-extrabold px-2.5 py-1 rounded-full uppercase" id="res-cust-tier">Gold</span>
                    </div>
                    <div className="space-y-1 relative z-10">
                      <div className="flex justify-between text-xs font-bold">
                        <span data-i18n="cr-card-progress">Next reward unlock milestone:</span>
                        <span className="text-gold" id="res-cust-points">2,450 XP / 3000 XP</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-gold to-blue h-full" id="res-cust-progressbar" style={{ width: '81%' }}>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/10 relative z-10 flex justify-between items-center text-[10px]">
                      <span className="text-slate-300" data-i18n="cr-card-perk">Exclusive Connected Alliance Perk:</span>
                      <span className="text-gold font-extrabold" id="res-cust-reward">Voucher FREE Gel nghệ thuật</span>
                    </div>
                    <div className="absolute -right-8 -bottom-8 w-20 h-20 bg-purple/30 rounded-full blur-xl"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
