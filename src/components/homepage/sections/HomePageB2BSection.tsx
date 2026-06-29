/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'
import { IconBox } from '../ui/IconBox'
import { Handshake, BarChart2, ShieldCheck, Megaphone } from 'lucide-react'

export default function HomePageB2BSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-white border-b border-line relative overflow-hidden ds-section" id="b2b-alliance">
          <div className="absolute right-0 top-0 w-80 h-80 bg-purple/5 rounded-full blur-[80px] pointer-events-none"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6">
                <span className="text-xs font-extrabold text-purple uppercase tracking-widest bg-purple/10 px-3.5 py-1.5 rounded-full" data-i18n="b2b-section-eyebrow">B2B LOCAL CO-OP NETWORKS</span>
                <h2 className="text-3xl sm:text-4xl font-black text-navy leading-tight" data-i18n="b2b-section-title">Cross-promote with adjacent brands.<br />Scale business volumes together.</h2>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed" data-i18n="b2b-section-desc-1">Stop marketing your storefront alone. Nexora Touch allows non-competing merchants (e.g., nail salons, neighboring cafes, flower studios) to connect operations under one cooperative alliance.</p>
                <p className="text-slate-600 text-sm sm:text-base leading-relaxed" data-i18n="b2b-section-desc-2">Customers earn points while tipping technicians but can redeem those points for delicious drinks or boutique gifts next door. This drives organic foot traffic and shares premium localized client pools automatically.</p>
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
                  <div className="space-y-1">
                    <strong className="text-2xl font-extrabold text-navy">+45%</strong>
                    <p className="text-xs text-slate-500 font-bold uppercase" data-i18n="b2b-metric-1">Cross-Referral Traffic Spikes</p>
                  </div>
                  <div className="space-y-1">
                    <strong className="text-2xl font-extrabold text-navy" data-i18n="b2b-metric-2-title">1 Unified Card Ledger</strong>
                    <p className="text-xs text-slate-500 font-bold uppercase" data-i18n="b2b-metric-2-sub">Unites Entire Neighborhood</p>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-6 grid grid-cols-2 gap-4 sm:gap-6">
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-6 rounded-2xl sm:rounded-[24px] space-y-1.5 sm:space-y-3 hover:shadow-lg transition-all ds-surface ds-content-card group">
                  <div className="mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><IconBox icon={Handshake} size={28} /></div>
                  <h3 className="font-extrabold text-navy text-sm sm:text-base leading-tight" data-i18n="b2b-feat-1-title">One-Click Co-op Partnerships</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed" data-i18n="b2b-feat-1-desc">Instantly establish alliances by typing in neighboring partner business codes.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-6 rounded-2xl sm:rounded-[24px] space-y-1.5 sm:space-y-3 hover:shadow-lg transition-all ds-surface ds-content-card group">
                  <div className="mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><IconBox icon={BarChart2} size={28} /></div>
                  <h3 className="font-extrabold text-navy text-sm sm:text-base leading-tight" data-i18n="b2b-feat-2-title">Automated Monthly Audits</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed" data-i18n="b2b-feat-2-desc">Our secure backend ledger keeps track of points, balances, and cross-redemptions accurately.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-6 rounded-2xl sm:rounded-[24px] space-y-1.5 sm:space-y-3 hover:shadow-lg transition-all ds-surface ds-content-card group">
                  <div className="mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><IconBox icon={ShieldCheck} size={28} /></div>
                  <h3 className="font-extrabold text-navy text-sm sm:text-base leading-tight" data-i18n="b2b-feat-3-title">Category Exclusivity Protects</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed" data-i18n="b2b-feat-3-desc">Only one merchant per retail vertical is allowed in each local alliance node to safeguard sales.</p>
                </div>
                <div className="bg-slate-50 border border-slate-200/80 p-3 sm:p-6 rounded-2xl sm:rounded-[24px] space-y-1.5 sm:space-y-3 hover:shadow-lg transition-all ds-surface ds-content-card group">
                  <div className="mb-2 sm:mb-4 group-hover:scale-110 transition-transform"><IconBox icon={Megaphone} size={28} /></div>
                  <h3 className="font-extrabold text-navy text-sm sm:text-base leading-tight" data-i18n="b2b-feat-4-title">Co-op Weekend Block Promos</h3>
                  <p className="text-[10px] sm:text-xs text-slate-500 leading-relaxed" data-i18n="b2b-feat-4-desc">Coordinate block-wide joint marketing drives dynamically to captivate the local demographic.</p>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
