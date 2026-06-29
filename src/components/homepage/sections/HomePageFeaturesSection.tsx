/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'
import { IconBox } from '../ui/IconBox'
import { HandCoins, Star, Gift, QrCode, UserRound, LayoutDashboard } from 'lucide-react'

export default function HomePageFeaturesSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-white border-b border-line ds-section" id="features">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-extrabold text-purple uppercase tracking-widest" data-i18n="feat-eyebrow">COMPREHENSIVE CORE SUITE</span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-navy" data-i18n="feat-title">Engineered Specifically for High-Growth Brands</h2>
              <p className="text-base text-slate-500 leading-relaxed" data-i18n="feat-desc">Tackle every client transaction. Automate feedback pipelines, save processing costs, and engage customers seamlessly.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-8">
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={HandCoins} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-1-title">Direct Tip Routing</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-1-desc">Let customers send gratuity directly to each technician's personal wallet (Zelle, Venmo, Cash App). Eliminates end-of-day tip pooling disputes and interchange fees entirely.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={Star} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-2-title">Automated Google / Yelp Reviews</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-2-desc">Detects high satisfaction scores and routes clients to Google to amplify 5-star ratings organically, while redirecting critical feedback to a private internal inbox.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={Gift} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-3-title">Gamification Loyalty Points</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-3-desc">Automatically awards XP points when customers tip, leave reviews, check in, or refer friends. Points redeem instantly for free perks and exclusive partner vouchers.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={QrCode} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-4-title">Multi-Function Smart QR</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-4-desc">Replaces scattered legacy QR boards at the front desk. One unified code handles payments, staff profile links, loyalty sign-in, and review routing for the entire salon.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={UserRound} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-5-title">Personalized Staff Profiles</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-5-desc">Each technician gets a private performance dashboard with instant tip notifications, star-rating history tracking, and fast links to their connected payout wallets.</p>
              </div>
              
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-8 hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group ds-surface ds-content-card">
                <div className="mb-3 sm:mb-6 group-hover:scale-110 transition-transform">
                  <IconBox icon={LayoutDashboard} size={28} />
                </div>
                <h3 className="text-xs sm:text-xl font-extrabold text-navy mb-1 sm:mb-2 leading-tight" data-i18n="feat-6-title">Owner Analytics Dashboard</h3>
                <p className="text-slate-500 text-[10px] sm:text-sm leading-relaxed" data-i18n="feat-6-desc">Gives salon owners a full operational overview: estimated processing fee savings, staff performance management, and loyalty multiplier controls to maximize customer retention.</p>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
