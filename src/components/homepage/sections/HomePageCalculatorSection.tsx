/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageCalculatorSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="py-16 sm:py-24 bg-navy text-white relative overflow-hidden ds-section" id="calculator">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue/10 rounded-full blur-[120px] pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
              <div className="inline-flex items-center gap-1 bg-white/10 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-blue tracking-wider" data-i18n="calc-eyebrow">💵 RECOVER INTERCHANGE REVENUES</div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight" data-i18n="calc-title">Reclaim Merchant Processing Costs on Tips</h2>
              <p className="text-sm text-slate-300" data-i18n="calc-desc">Saddling technician tips onto standard checkouts forces boutique owners to bleed average 3.0% interchange fees. Swap to direct P2P routing to completely bypass merchant terminal fees.</p>
            </div>
            
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-8 relative z-10 shadow-2xl">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm font-bold text-slate-300">
                  <label data-i18n="calc-slider-label" htmlFor="tips-volume-slider">Total Monthly Tip Volume across Business:</label>
                  <span className="text-xl sm:text-2xl font-black text-blue" id="slider-val-label">$15,000</span>
                </div>
                <input className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple ds-field" id="tips-volume-slider" max="100000" min="2000" onInput={(e) => hp.updateSavingsCalc(e.currentTarget.value)} step="1000" type="range" defaultValue={15000} />
                <div className="flex justify-between text-[11px] font-bold text-slate-500">
                  <span>$2,000 / <span data-i18n="calc-mo">mo</span></span>
                  <span>$50,000 / <span data-i18n="calc-mo">mo</span></span>
                  <span>$100,000 / <span data-i18n="calc-mo">mo</span></span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-800">
                <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800 text-center">
                  <span className="block text-xs font-extrabold text-slate-500 uppercase tracking-widest mb-1" data-i18n="calc-stat-1">Average Terminal Processing Rate</span>
                  <strong className="text-xl sm:text-2xl font-black text-red-400">3.0%</strong>
                </div>
                <div className="bg-gradient-to-br from-indigo-900/40 to-slate-950 p-4 rounded-2xl border border-indigo-500/20 text-center relative overflow-hidden ds-surface">
                  <span className="block text-xs font-extrabold text-indigo-300 uppercase tracking-widest mb-1" data-i18n="calc-stat-2">Annual Lost Revenue on Standard Checkout</span>
                  <strong className="text-xl sm:text-2xl font-black text-slate-100" id="lost-annual-label">$5,400</strong>
                </div>
                <div className="bg-gradient-to-br from-purple/20 to-slate-950 p-4 rounded-2xl border border-purple/30 text-center relative overflow-hidden ds-surface">
                  <span className="block text-xs font-extrabold text-purple uppercase tracking-widest mb-1" data-i18n="calc-stat-3">ESTIMATED NET ANNUAL MERCHANT SAVINGS</span>
                  <strong className="text-xl sm:text-2xl font-black text-green" id="saved-annual-label">$5,400</strong>
                  <div className="absolute inset-0 bg-green/5 animate-pulse pointer-events-none"></div>
                </div>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
