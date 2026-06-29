/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageDemoModal() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300" id="demo-modal">
          <div className="bg-white rounded-[32px] w-full max-w-lg overflow-hidden shadow-2xl border border-slate-100 transform scale-95 transition-transform duration-300 relative ds-surface">
            <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ds-control ds-button" onClick={() => { hp.closeDemoModal() }}>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
              </svg>
            </button>
            <div className="p-6 sm:p-8 bg-gradient-to-br from-navy to-slate-900 text-white space-y-1.5 ds-content-card relative">
              <button className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-all ds-control ds-button" onClick={() => { hp.closeDemoModal() }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
              </button>
              <h3 className="text-xl sm:text-2xl font-black" data-i18n="modal-demo-title">Book Customized On-Site Demonstration</h3>
              <p className="text-xs text-slate-300" data-i18n="modal-demo-desc">Let's construct tailored high-fidelity QR stand placemats matching your brand parameters.</p>
            </div>
            <form className="p-6 sm:p-8 space-y-4" id="demo-form" onSubmit={(e) => { e.preventDefault(); hp.handleDemoSubmit(e) }} noValidate>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="modal-field-name">Your Full Name</label>
                  <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple ds-field" id="demo-name" data-i18n="ph-demo-name" placeholder="John Smith" type="text" />
                  <p className="text-[10px] text-red-500 hidden" id="demo-name-err" data-i18n="err-required">This field is required</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="modal-field-salon">Salon / Spa Business Name</label>
                  <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple ds-field" id="demo-salon" data-i18n="ph-demo-business" placeholder="Beauty Art Spa" type="text" />
                  <p className="text-[10px] text-red-500 hidden" id="demo-salon-err" data-i18n="err-required">This field is required</p>
                </div>
              </div>
              <div className="space-y-1">
                <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="modal-field-email">E-mail Address Node</label>
                <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple ds-field" id="demo-email" data-i18n="ph-demo-email" placeholder="contact@example.com" type="email" />
                <p className="text-[10px] text-red-500 hidden" id="demo-email-err" data-i18n="err-required">This field is required</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="modal-field-size">Workstation / Team Count</label>
                  <select className="w-full text-xs p-3 border border-slate-200 bg-white rounded-xl focus:outline-none focus:border-purple font-medium ds-field ds-select" defaultValue="opt-size-2">
                    <option data-i18n="opt-size-1" value="opt-size-1">1 - 5 employees</option>
                    <option data-i18n="opt-size-2" value="opt-size-2">6 - 15 employees</option>
                    <option data-i18n="opt-size-3">16 - 30 employees</option>
                    <option data-i18n="opt-size-4">Chain 30+ employees</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[10px] font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="modal-field-state">Location Area (City / State)</label>
                  <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple ds-field" id="demo-city" data-i18n="ph-demo-city" placeholder="Los Angeles, CA" type="text" />
                  <p className="text-[10px] text-red-500 hidden" id="demo-city-err" data-i18n="err-required">This field is required</p>
                </div>
              </div>
              <button className="w-full bg-gradient-to-r from-purple to-indigo-600 text-white font-extrabold py-3.5 rounded-xl text-xs tracking-wider uppercase shadow-lg shadow-purple/20 hover:shadow-xl transition-all  ds-control ds-button" type="submit">
                <span data-i18n="btn-modal-demo-submit">Request Setup Consulting</span>
                
                <span className="block text-[10px] font-medium normal-case tracking-normal opacity-75 mt-0.5" data-i18n="btn-modal-demo-soon">(Coming Soon)</span>
              </button>
            </form>
          </div>
        </div>
    </>
  )
}
