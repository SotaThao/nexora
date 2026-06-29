/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'

export default function HomePageAuthModal() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 opacity-0 pointer-events-none transition-all duration-300" id="auth-modal">
          <div className="bg-white rounded-[28px] w-full max-w-sm overflow-hidden shadow-2xl transform scale-95 transition-transform duration-300 relative">
            
            <div className="bg-navy px-7 pt-7 pb-5 relative">
              <button className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-lg leading-none transition-all ds-control ds-button" onClick={() => { hp.closeAuthModal() }}><LucideIcon name="x" className="w-4 h-4" /></button>
              <div className="flex items-center gap-2 mb-5">
                <img alt="Nexora" className="w-7 h-7" src="/homepage/assets/images/icon-nexora.png" />
                <span className="text-white font-extrabold text-sm tracking-tight">NEXORA TOUCH</span>
              </div>
              
              <div className="flex gap-1 bg-white/10 rounded-2xl p-1">
                <button className="flex-1 py-2.5 text-center font-extrabold text-sm rounded-xl bg-white text-navy shadow-sm transition-all ds-control ds-button" data-i18n="tab-login-btn" id="auth-tab-login" onClick={() => { hp.switchAuthTab('login') }}>Login</button>
                <button className="flex-1 py-2.5 text-center font-extrabold text-sm text-white/60 hover:text-white rounded-xl transition-all ds-control ds-button" data-i18n="tab-register-btn" id="auth-tab-register" onClick={() => { hp.switchAuthTab('register') }}>Register Profile</button>
              </div>
            </div>
            
            <div className="p-6 space-y-0">
              
              <form className="space-y-4" id="auth-form-login" onSubmit={(e) => { e.preventDefault(); hp.handleAuthLogin(e) }}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="auth-email-label">Email</label>
                  <input className="w-full text-sm p-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium text-slate-900 placeholder:text-slate-400 ds-field" id="auth-login-email" placeholder="contact@example.com" required type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="auth-pass-label">Password</label>
                  <input className="w-full text-sm p-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple text-slate-900 placeholder:text-slate-400 ds-field" placeholder="••••••••" required type="password" />
                </div>
                <button className="w-full bg-purple hover:bg-[#563bd8] text-white font-extrabold py-3.5 rounded-xl text-sm tracking-wide shadow-md transition-all ds-control ds-button" type="submit">
                  <span data-i18n="btn-auth-confirm-login">Confirm Login</span>
                  <span className="block text-[10px] font-medium normal-case tracking-normal opacity-75 mt-0.5" data-i18n="btn-auth-confirm-login-soon">(Coming Soon)</span>
                </button>
              </form>
              
              <form className="space-y-4 hidden" id="auth-form-register" onSubmit={(e) => { e.preventDefault(); hp.handleAuthRegister(e) }}>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="auth-reg-email-label">Email</label>
                  <input className="w-full text-sm p-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium text-slate-900 placeholder:text-slate-400 ds-field" id="auth-reg-email" placeholder="contact@example.com" required type="email" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="auth-reg-pass-label">Password</label>
                  <input className="w-full text-sm p-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple text-slate-900 placeholder:text-slate-400 ds-field" placeholder="••••••••" required type="password" />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider" data-i18n="auth-reg-ref-label">Referral Code</label>
                  <input className="w-full text-sm p-3.5 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium text-slate-900 placeholder:text-slate-400 ds-field" id="auth-reg-ref" placeholder="REF-XXXXX" type="text" />
                </div>
                <button className="w-full bg-purple hover:bg-[#563bd8] text-white font-extrabold py-3.5 rounded-xl text-sm tracking-wide shadow-md transition-all ds-control ds-button" type="submit">
                  <span data-i18n="btn-auth-confirm-reg">Create Account</span>
                  <span className="block text-[10px] font-medium normal-case tracking-normal opacity-75 mt-0.5" data-i18n="btn-auth-confirm-reg-soon">(Coming Soon)</span>
                </button>
              </form>
            </div>
          </div>
        </div>
    </>
  )
}
