/** Homepage section component */
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'
import { ScanLine, HandCoins, Star, Gift, ReceiptText, HeartHandshake, UserRound, Store, Zap, MapPin, Coffee, Activity, Paintbrush, Sparkles } from 'lucide-react'

export default function HomePageHeroSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100/50 py-12 lg:py-20 border-b border-line ds-section">
          
          <div className="absolute top-1/4 right-0 w-[450px] h-[450px] bg-blue/15 rounded-full blur-[100px] pointer-events-none">
          </div>
          <div className="absolute top-10 left-0 w-[400px] h-[400px] bg-purple/15 rounded-full blur-[100px] pointer-events-none">
          </div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-6 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-full py-1.5 px-4 text-xs font-extrabold text-purple tracking-wide" data-i18n="hero-eyebrow">✨ CLIENT &amp; STAFF SYNERGY ENGAGEMENT HUB</div>
                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.1] lg:leading-[1.05]">
                  <span data-i18n="hero-title-1">Tip Smarter.</span><br />
                  <span data-i18n="hero-title-2">Review Faster.</span><br />
                  <span className="text-grad" data-i18n="hero-title-grad">Grow Stronger.</span>
                </h2>
                <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto lg:mx-0" data-i18n="hero-desc">NEXORA TOUCH bridges connections between customers, specialists, and salon owners through unified QR nodes. Empower technicians with zero interchange fee direct tip margins, scale verified Google 5-star cards organically, and build reliable neighborhood co-op rewards.</p>
                <div className="flex flex-row gap-4 justify-center lg:justify-start flex-wrap">
                  <a className="inline-flex items-center justify-center gap-2 rounded-full bg-navy text-white px-7 py-4 text-base font-bold shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02] ds-control ds-button nx-hero-btn" href="#simulator">
                    <span data-i18n="hero-btn-primary">Test Live Simulator</span>
                    <svg className="h-5 w-5 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 13l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5"></path>
                    </svg>
                  </a>
                  <a className="inline-flex items-center justify-center gap-2 rounded-full bg-white border border-slate-200 px-7 py-4 text-base font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all ds-control ds-button nx-hero-btn btn-light" data-i18n="hero-btn-secondary" href="#calculator">Calculate Net Savings</a>
                </div>
                
                <div className="pt-6 border-t border-slate-200/80">
                  <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase mb-3 text-center lg:text-left" data-i18n="hero-badge-title">CORE ARCHITECTURE NODES</p>
                  <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex items-center gap-2 ds-surface ds-elevate">
                      <ScanLine size={18} strokeWidth={2} className="text-purple flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-bold text-slate-700">Smart QR</span>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex items-center gap-2 ds-surface ds-elevate">
                      <HandCoins size={18} strokeWidth={2} className="text-purple flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-bold text-slate-700">Direct Tips</span>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex items-center gap-2 ds-surface ds-elevate">
                      <Star size={18} strokeWidth={2} className="text-purple flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-bold text-slate-700">Review Support</span>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex items-center gap-2 ds-surface ds-elevate">
                      <Gift size={18} strokeWidth={2} className="text-purple flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-bold text-slate-700">Loyalty Rewards</span>
                    </div>
                    <div className="bg-white border border-slate-200/60 shadow-sm rounded-xl p-3 flex items-center gap-2 ds-surface ds-elevate">
                      <ReceiptText size={18} strokeWidth={2} className="text-purple flex-shrink-0" aria-hidden="true" />
                      <span className="text-xs font-bold text-slate-700">Tax IQ</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="lg:col-span-6 flex flex-col items-center" id="simulator">
                <div className="w-full max-w-md bg-slate-900 rounded-[50px] p-4 shadow-2xl border-4 border-slate-800 relative premium-shadow">
                  
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-6 w-36 bg-slate-800 rounded-b-3xl z-30 flex items-center justify-center gap-1.5">
                    <div className="w-12 h-1 bg-slate-700 rounded-full"></div>
                    <div className="w-2.5 h-2.5 bg-slate-900 rounded-full border border-slate-700"></div>
                  </div>
                  
                  <div className="flex items-center bg-slate-950/90 gap-1 backdrop-blur-md p-1 rounded-2xl mb-4 relative z-10 text-[11px] sm:text-xs font-bold border border-slate-800/80 shadow-inner">
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 bg-purple text-white shadow-md shadow-purple/20 font-extrabold ds-control ds-button h-[34px]" id="tab-customer" onClick={() => { hp.switchSimulatorMode('customer') }}>
                      <HeartHandshake size={18} strokeWidth={2} className="flex-shrink-0" />
                      <span className="hidden xs:inline" data-i18n="tab-cust">Customer View</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 text-slate-400 hover:text-white font-semibold ds-control ds-button h-[34px]" id="tab-staff" onClick={() => { hp.switchSimulatorMode('staff') }}>
                      <UserRound size={18} strokeWidth={2} className="flex-shrink-0" />
                      <span className="hidden xs:inline" data-i18n="tab-staff">Staff Portal</span>
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-1.5 py-0 rounded-xl transition-all duration-300 text-slate-400 hover:text-white font-semibold ds-control ds-button h-[34px]" id="tab-owner" onClick={() => { hp.switchSimulatorMode('owner') }}>
                      <Store size={18} strokeWidth={2} className="flex-shrink-0" />
                      <span className="hidden xs:inline" data-i18n="tab-owner">Salon Admin</span>
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 rounded-[34px] overflow-hidden min-h-[530px] relative text-ink transition-all duration-300 flex flex-col justify-between">
                    
                    <div className="absolute top-3 left-4 right-4 bg-slate-900 text-white py-2.5 px-4 rounded-2xl shadow-xl flex items-center gap-2 transform -translate-y-16 opacity-0 transition-all duration-300 z-50 text-xs font-semibold border border-slate-800" id="toast-banner">
                      <Zap size={14} className="text-green flex-shrink-0" />
                      <span className="flex-1" id="toast-message">Thông báo</span>
                    </div>
                    
                    <div className="p-4 space-y-4 h-full overflow-y-auto max-h-[510px] flex-1" id="screen-customer">
                      
                      <div className="space-y-4 hidden" id="cust-register-view">
                        <div className="bg-gradient-to-br from-indigo-900 to-purple text-white p-4 rounded-2xl shadow-md text-center space-y-2">
                          <h4 className="font-extrabold text-sm" data-i18n="sim-reg-banner">🎁 Join Program &amp; Claim +100 XP Welcome Perk</h4>
                          <p className="text-[10px] text-slate-200" data-i18n="sim-reg-desc">Earn loyalty points for tipping, leaving star reviews, and referring local friends on checkout!</p>
                        </div>
                        <div className="bg-white p-4 border border-slate-200 rounded-2xl shadow-sm space-y-3 ds-surface ds-elevate">
                          <div className="space-y-2">
                            <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium ds-field" data-i18n="ph-reg-name" id="cust-reg-name" placeholder="Enter your name..." type="text" />
                            <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium ds-field" data-i18n="ph-reg-phone" id="cust-reg-phone" placeholder="(714) 555-0199" type="tel" />
                            <input className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-purple font-medium ds-field" data-i18n="ph-reg-ref" id="cust-reg-ref" placeholder="Referral code (if any)..." type="text" />
                          </div>
                          <button className="w-full bg-purple text-white font-extrabold text-xs py-3 rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-purple/10 ds-control ds-button" data-i18n="btn-sim-reg" onClick={() => { hp.registerSimulatorUser() }}>Create Loyalty Profile (+100 XP)</button>
                          <div className="text-center">
                            <span className="text-[10px] text-slate-400"><span data-i18n="has-account">Already registered?</span>
                              <button className="text-purple font-bold underline ds-control ds-button" data-i18n="login-now" onClick={() => { hp.openAuthModal('login') }}>Log in here</button></span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-4 animate-fadeIn" id="cust-dashboard-view">
                        
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple text-white font-extrabold flex items-center justify-center text-xs shadow-sm ds-elevate" id="cust-avatar">H</div>
                            <div>
                              <h4 className="font-black text-xs text-navy leading-none" id="cust-name-label">Jennifer H.</h4>
                              <span className="text-[9px] text-slate-400 font-bold uppercase mt-1 block" id="cust-phone-label">Tel: (714) 555-0199</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] bg-purple/10 text-purple font-extrabold px-2.5 py-1 rounded-full shadow-sm block" id="cust-points-label">2,450 XP</span>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-2.5 rounded-2xl shadow-sm flex items-center justify-between ds-surface ds-elevate">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-500 flex-shrink-0" />
                            <span className="text-[11px] font-bold text-navy"><span data-i18n="sim-checkin">Check-in Placed:</span> <span className="text-purple font-black">Downtown Branch</span></span>
                          </div>
                          <button className="text-[9px] bg-slate-100 hover:bg-slate-200 px-2 py-1 rounded-lg font-bold text-slate-500 transition-all ds-control ds-button" data-i18n="btn-sim-change" onClick={() => { hp.changeBranch() }}>Switch Store</button>
                        </div>
                        
                        <div className="bg-gradient-to-r from-navy to-slate-900 border border-slate-800 text-white p-3.5 rounded-2xl space-y-2 shadow-md relative overflow-hidden ds-surface">
                          <div className="relative z-10">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-black text-blue tracking-wide uppercase" data-i18n="sim-b2b-gifts">🎁 B2B Alliance Rewards</span>
                              <span className="text-[8px] bg-green/20 text-green font-bold px-1.5 py-0.5 rounded" data-i18n="sim-b2b-redeem">Swap Partner Perks</span>
                            </div>
                            <p className="text-[10px] text-slate-300 mt-1 leading-normal" data-i18n="sim-b2b-desc">Exchange accumulated boutique points for delicious drinks or boutique fitness trials with adjacent neighborhood entities.</p>
                            
                            <div className="space-y-1.5 pt-2">
                              <div className="w-full flex items-center justify-between p-2 bg-white/10 hover:bg-black rounded-xl border border-white/5 text-left transition-all ds-control ds-button" onClick={() => { hp.redeemPartnerGift('Free Specialty Coffee', 'Glow Coffee', 150) }}>
                                <div className="flex items-center gap-2">
                                  <Coffee size={14} className="text-white flex-shrink-0" />
                                  <div>
                                    <strong className="block text-[10px] text-white" data-i18n="sim-gift-1">1 Free Latte at Glow Coffee</strong>
                                    <span className="text-[8px] text-slate-300" data-i18n="sim-gift-1-sub">Connected coffee shop across screen</span>
                                  </div>
                                </div>
                                <span className="text-[9px] bg-purple text-white px-2 py-1 rounded-md font-extrabold">-150
                                  XP</span>
                                </div>
                              <div className="w-full flex items-center justify-between p-2 bg-white/10 hover:bg-black rounded-xl border border-white/5 text-left transition-all ds-control ds-button" onClick={() => { hp.redeemPartnerGift('25% Off Herbal Yoga Class', 'Serene Yoga', 300) }}>
                                <div className="flex items-center gap-2">
                                  <Activity size={14} className="text-white flex-shrink-0" />
                                  <div>
                                    <strong className="block text-[10px] text-white" data-i18n="sim-gift-2">25% Off Herbal Yoga Session</strong>
                                    <span className="text-[8px] text-slate-300" data-i18n="sim-gift-2-sub">Active yoga studio 2 doors down</span>
                                  </div>
                                </div>
                                <span className="text-[9px] bg-purple text-white px-2 py-1 rounded-md font-extrabold">-300
                                  XP</span>
                              </div>
                            </div>
                            
                            <div className="hidden mt-3 p-3 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 rounded-xl space-y-1.5 animate-fadeIn border border-amber-300 relative shadow-inner ds-surface" id="sim-targeted-campaign-box">
                              <div className="flex justify-between items-center">
                                <strong className="text-[10px] uppercase font-black tracking-wide text-amber-950" data-i18n="sim-targeted-title">🌟 Targeted B2B Alliance Offer</strong>
                                <span className="text-[8px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded font-black" data-i18n="sim-targeted-badge">Gold Tier Member</span>
                              </div>
                              <p className="text-[9px] font-bold leading-normal text-amber-900">
                                <span data-i18n="sim-targeted-congrats">Congratulations</span> <span className="underline" id="sim-targeted-user-name">Khách</span><span data-i18n="sim-targeted-vip-msg">! You're in our VIP segment and qualify for:</span> <span className="font-extrabold text-slate-950" id="sim-targeted-gift-text">Quà tặng đặc quyền</span> <span data-i18n="sim-targeted-from">from partner</span> <span className="font-black" id="sim-targeted-partner-name">Glow Coffee</span>.
                              </p>
                              <button className="w-full bg-slate-950 hover:bg-black text-white font-extrabold text-[10px] py-1.5 rounded-lg active:scale-95 transition-all ds-control ds-button" data-i18n="sim-targeted-claim" onClick={() => { hp.redeemPartnerGift('Exclusive B2B Gift', 'Glow Coffee', 0) }}>Claim Now (FREE 0 XP)</button>
                            </div>
                          </div>
                          <div className="absolute -right-8 -bottom-8 w-24 h-24 bg-blue/10 rounded-full blur-xl"></div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="block text-[10px] uppercase font-extrabold tracking-wider text-slate-400" data-i18n="sim-choose-staff">Select served workstation:</label>
                          <div className="grid grid-cols-3 gap-2">
                            <button className="bg-white border-2 border-purple p-2 rounded-xl text-center shadow-sm transition-all relative ds-control ds-button" id="staff-chloe" onClick={() => { hp.selectStaff('Chloe') }}>
                              <div className="w-10 h-10 rounded-full bg-purple/10 mx-auto mb-1 flex items-center justify-center text-sm">
                                <Paintbrush size={16} className="text-purple" /></div>
                              <p className="font-extrabold text-[11px] text-navy leading-none">Chloe</p>
                              <p className="text-[9px] text-slate-400 mt-0.5" data-i18n="role-nail">Nails Artist</p>
                              <div className="absolute top-1 right-1 bg-purple text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] font-bold">
                                ✓</div>
                            </button>
                            <button className="bg-white border border-slate-200 p-2 rounded-xl text-center shadow-sm transition-all hover:border-purple/50 ds-control ds-button" id="staff-marcus" onClick={() => { hp.selectStaff('Marcus') }}>
                              <div className="w-10 h-10 rounded-full bg-blue/10 mx-auto mb-1 flex items-center justify-center text-sm">
                                <Activity size={16} className="text-blue" /></div>
                              <p className="font-extrabold text-[11px] text-navy leading-none">Marcus</p>
                              <p className="text-[9px] text-slate-400 mt-0.5" data-i18n="role-spa">Massage Pro</p>
                            </button>
                            <button className="bg-white border border-slate-200 p-2 rounded-xl text-center shadow-sm transition-all hover:border-purple/50 ds-control ds-button" id="staff-sarah" onClick={() => { hp.selectStaff('Sarah') }}>
                              <div className="w-10 h-10 rounded-full bg-rose-500/10 mx-auto mb-1 flex items-center justify-center text-sm">
                                <Sparkles size={16} className="text-rose-500" /></div>
                              <p className="font-extrabold text-[11px] text-navy leading-none">Sarah</p>
                              <p className="text-[9px] text-slate-400 mt-0.5" data-i18n="role-skincare">Skincare Lead</p>
                            </button>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-navy"><span data-i18n="sim-tip-for">Tipping workstation</span> <span className="text-purple font-black" id="selected-staff-label">Chloe</span>:</span>
                            <span className="text-[9px] text-slate-400"><span data-i18n="sim-receive">Receive</span> <span className="text-purple font-bold" id="tip-points-multiplier">10x</span> <span data-i18n="sim-reward-pts">reward points</span></span>
                          </div>
                          <div className="grid grid-cols-4 gap-1.5">
                            <button className="tip-btn bg-slate-100 font-extrabold text-xs py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ds-control ds-button" onClick={() => { hp.setTipAmount(5) }}>$5</button>
                            <button className="tip-btn bg-purple text-white font-extrabold text-xs py-1.5 rounded-lg transition-all shadow-md shadow-purple/20 ds-control ds-button" onClick={() => { hp.setTipAmount(10) }}>$10</button>
                            <button className="tip-btn bg-slate-100 font-extrabold text-xs py-1.5 rounded-lg text-slate-700 hover:bg-slate-200 transition-all ds-control ds-button" onClick={() => { hp.setTipAmount(15) }}>$15</button>
                            <input className="w-full text-center text-xs font-bold border border-slate-200 rounded-lg p-1 focus:outline-none focus:ring-1 focus:ring-purple ds-field" data-i18n="ph-custom" id="custom-tip" onInput={(e) => hp.setCustomTip(e.currentTarget.value)} placeholder="Custom" type="number" />
                          </div>
                          
                          <div className="pt-2 border-t border-slate-100 grid grid-cols-3 gap-1.5">
                            <button className="flex items-center justify-center gap-1 bg-[#6D1ED4] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Zelle') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5h-5.67l5.42-7H8.5v-2h7.5l-5.42 7H16.5v2z"></path></svg>
                              Zelle</button>
                            <button className="flex items-center justify-center gap-1 bg-[#008CFF] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Venmo') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M19.5 3.5c.83 1.37 1.2 2.78 1.2 4.57 0 5.69-4.86 13.08-8.8 13.08-1.82 0-3.36-1.69-3.99-4.5L6.6 10.9C6.17 9.05 5.43 7.5 4 7.5L4.74 6c2.06 0 4.26 2.64 4.94 5.81l.85 3.83c.4 1.77 1.1 2.5 1.8 2.5 1.66 0 4.37-5.38 4.37-8.08 0-1.72-.64-2.86-1.35-3.56L19.5 3.5z"></path></svg>
                              Venmo</button>
                            <button className="flex items-center justify-center gap-1 bg-[#00D632] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Cash App') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm.88 14.76v.74h-1.5v-.72c-1.33-.18-2.28-.87-2.38-2.07h1.44c.09.55.52.92 1.35.92.87 0 1.3-.42 1.3-.98 0-.5-.32-.78-1.3-1.01l-.76-.18c-1.37-.32-2.09-1.01-2.09-2.17 0-1.14.85-1.95 2.14-2.14v-.76h1.5v.76c1.3.2 2.13.95 2.2 2.08h-1.41c-.08-.54-.48-.9-1.22-.9-.77 0-1.2.37-1.2.92 0 .49.33.76 1.22.97l.78.19c1.43.35 2.16 1.04 2.16 2.22 0 1.16-.84 2.03-2.23 2.23z"></path></svg>
                              Cash App</button>
                            <button className="flex items-center justify-center gap-1 bg-[#1a1a1a] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Apple Pay') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"></path></svg>
                              Apple Pay</button>
                            <button className="flex items-center justify-center gap-1 bg-[#1565C0] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Bank Transfer') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z"></path></svg>
                              Bank Transfer</button>
                            <button className="flex items-center justify-center gap-1 bg-[#2e7d32] text-white py-1.5 rounded-xl text-[9px] font-black hover:opacity-90 transition-all ds-control ds-button" onClick={() => { hp.confirmTip('Cash') }}>
                              <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z"></path></svg>
                              Cash</button>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-navy" data-i18n="sim-rate-service">Rate current visit score:</span>
                            <span className="text-[9px] bg-amber-50 text-amber-600 font-extrabold px-1.5 py-0.5 rounded border border-amber-200">+15
                              XP</span>
                          </div>
                          
                          <div className="flex items-center justify-center gap-1.5 py-1" id="rating-stars-container">
                            <button className="text-2xl text-slate-300 hover:scale-110 transition-transform ds-control ds-button" onClick={() => { hp.handleRating(1) }}>★</button>
                            <button className="text-2xl text-slate-300 hover:scale-110 transition-transform ds-control ds-button" onClick={() => { hp.handleRating(2) }}>★</button>
                            <button className="text-2xl text-slate-300 hover:scale-110 transition-transform ds-control ds-button" onClick={() => { hp.handleRating(3) }}>★</button>
                            <button className="text-2xl text-slate-300 hover:scale-110 transition-transform ds-control ds-button" onClick={() => { hp.handleRating(4) }}>★</button>
                            <button className="text-2xl text-slate-300 hover:scale-110 transition-transform ds-control ds-button" onClick={() => { hp.handleRating(5) }}>★</button>
                          </div>
                          
                          <div className="hidden space-y-1.5 animate-fadeIn" id="private-feedback-box">
                            <p className="text-[9px] text-red-500 font-bold" data-i18n="sim-rate-unsatisfied">Direct suggestions privately to shop owner:</p>
                            <textarea className="w-full text-[11px] p-2 border border-slate-200 rounded-lg h-12 focus:outline-none focus:border-red-400 ds-field" data-i18n="ph-rate-private" id="private-feedback-text" placeholder="Constructive details route straight to secure executive inbox..."></textarea>
                            <button className="w-full bg-slate-900 text-white text-[10px] py-1.5 rounded-lg font-bold ds-control ds-button" data-i18n="btn-sim-submit-fb" onClick={() => { hp.submitPrivateFeedback() }}>Submit Safe Review</button>
                          </div>
                          
                          <div className="hidden space-y-1 px-1 py-1.5 bg-green-50 border border-green-100 rounded-xl text-center animate-fadeIn" id="public-routing-box">
                            <p className="text-[11px] text-green font-extrabold" data-i18n="sim-perfect-score">Perfect Score!</p>
                            <p className="text-[9px] text-slate-500" data-i18n="sim-redirect-msg">Redirecting smoothly to Google Map cards to scale organic business visibility.</p>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold text-navy" data-i18n="sim-refer-friends">Refer adjacent friends:</span>
                            <span className="text-[9px] text-purple font-bold" data-i18n="sim-refer-perks">You earn +50 XP - Friend gets +100 XP</span>
                          </div>
                          <div className="flex gap-2">
                            <input className="flex-1 text-xs p-2 border border-slate-200 rounded-xl focus:outline-none ds-field" data-i18n="ph-refer-phone" id="referral-phone" placeholder="(714) 555-0199" type="tel" maxLength={14} onInput={(e) => hp.maskUSPhone(e.currentTarget)} />
                            <button className="bg-purple text-white px-3 py-2 rounded-xl text-xs font-bold ds-control ds-button" data-i18n="btn-sim-send" onClick={() => { hp.submitReferral() }}>Send</button>
                          </div>
                          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-xl">
                            <span className="text-[9px] text-slate-400" data-i18n="sim-your-ref">Your referral code tag:</span>
                            <div className="flex items-center gap-1.5">
                              <strong className="text-[10px] text-navy font-mono" id="cust-ref-code-label">REF-HONG</strong>
                              <button className="bg-purple hover:bg-purple/20 text-black text-[8px] font-black px-1.5 py-0.5 rounded transition-all ds-control ds-button" onClick={() => { hp.copyReferralCode() }}>COPY</button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                          <span className="text-xs font-bold text-navy block" data-i18n="sim-chat-desk">Ping live receptionist desk:</span>
                          <div className="flex gap-1.5">
                            <input className="flex-1 text-xs p-2 border border-slate-200 rounded-xl focus:outline-none focus:border-purple ds-field" data-i18n="ph-chat-desk" id="interaction-message" placeholder="Submit visit schedule or desk help notes..." type="text" />
                            <button className="bg-navy text-white px-3 py-2 rounded-xl text-xs font-bold ds-control ds-button" data-i18n="btn-sim-send" onClick={() => { hp.sendInteractionMessage() }}>Send</button>
                          </div>
                        </div>
                        
                        <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                          <span className="text-xs font-bold text-navy block" data-i18n="sim-history-title">📜 Validated Service History Ledger</span>
                          <div className="space-y-2 max-h-24 overflow-y-auto pr-1 text-[10px]">
                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                              <div>
                                <strong className="text-slate-700 block" data-i18n="history-serv-1">Premium Gel Nails Overlay</strong>
                                <span className="text-slate-400"><span data-i18n="history-tech">Staff:</span> <span className="text-purple font-bold">Chloe</span> - 02/06/2026</span>
                              </div>
                              <span className="text-green font-bold">+100 XP</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-dashed border-slate-100 pb-1">
                              <div>
                                <strong className="text-slate-700 block" data-i18n="history-serv-2">Upper Back &amp; Shoulder Massages</strong>
                                <span className="text-slate-400"><span data-i18n="history-tech">Staff:</span> <span className="text-blue font-bold">Marcus</span> - 28/05/2026</span>
                              </div>
                              <span className="text-green font-bold">+150 XP</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 h-full overflow-y-auto max-h-[510px] flex-1 hidden" id="screen-staff">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-purple/15 flex items-center justify-center font-bold text-purple text-sm">
                            👩‍🎨</div>
                          <div>
                            <h4 className="font-bold text-xs text-navy leading-none">Chloe Carter</h4>
                            <span className="text-[9px] text-muted font-bold" data-i18n="staff-role">LEAD NAIL ART SPECIALIST</span>
                          </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input defaultChecked className="sr-only peer ds-field" id="staff-active-toggle" onChange={(e) => hp.toggleStaffStatus('Chloe', e.currentTarget.checked)} type="checkbox" />
                          <div className="w-7 h-4 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:bg-green after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all">
                          </div>
                          <span className="ml-1 text-[9px] font-extrabold text-slate-500 uppercase">ONLINE</span>
                        </label>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple to-indigo-600 text-white p-4 rounded-2xl shadow-md space-y-2">
                        <p className="text-[9px] text-indigo-100 font-extrabold uppercase tracking-wider" data-i18n="staff-today-tip">Total Tips Today (Avoided interchange: $14.50)</p>
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-3xl font-black tracking-tight" id="staff-earnings-label">$385.00</h3>
                          <span className="text-[10px] bg-white/20 px-2.5 py-0.5 rounded-full font-extrabold cursor-pointer hover:bg-white/30 transition-all" data-i18n="staff-withdraw" onClick={() => { hp.showToast('Instant payout initiated.') }}>Instant Cashout</span>
                        </div>
                        <div className="pt-2 border-t border-white/15 grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <span className="block text-indigo-200 text-[8px] font-bold" data-i18n="staff-tips-count">TOTAL TRANSACTIONS</span>
                            <strong className="text-xs" id="staff-tx-count">14 lượt</strong>
                          </div>
                          <div>
                            <span className="block text-indigo-200 text-[8px] font-bold" data-i18n="staff-score-title">RATING AVERAGE</span>
                            <strong className="text-xs" data-i18n="sim-staff-rating">4.9 ★ (42 reviews)</strong>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 animate-fadeIn ds-surface ds-elevate">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-extrabold text-purple uppercase tracking-wider flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                            <span data-i18n="sim-taxiq-assistant">📊 NEXORA TAX IQ ASSISTANT</span>
                          </span>
                          <span className="text-[8px] bg-purple/10 text-purple font-black px-1.5 py-0.5 rounded" data-i18n="sim-taxiq-mode">1099 Mode</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-slate-600">
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase" data-i18n="tax-est-withholding">Est. Tip Withholding (15%)</span>
                            <strong className="text-slate-800 text-xs font-bold" id="staff-tax-estimate">$57.75</strong>
                          </div>
                          <div className="bg-slate-50 p-2 rounded-xl">
                            <span className="block text-[8px] text-slate-400 font-bold uppercase" data-i18n="tax-legal-deductions">Legal Deductions Found</span>
                            <strong className="text-green text-xs font-black" id="staff-tax-deductions">$42.50</strong>
                          </div>
                        </div>
                        <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[9px] py-1.5 rounded-lg shadow-sm transition-all uppercase tracking-wider ds-control ds-button" data-i18n="btn-tax-optimize" onClick={() => { hp.optimizeStaffDeductions() }}>Optimize Legal Write-Offs</button>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm text-center space-y-2 ds-surface ds-elevate">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider" data-i18n="staff-smartqr">Personalized Desk Smart QR</p>
                        <div className="w-24 h-24 bg-slate-100 mx-auto rounded-xl flex items-center justify-center border border-slate-200 relative">
                          <div className="grid grid-cols-5 gap-0.5 p-2 bg-white rounded shadow-sm w-20 h-20 ds-elevate">
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                            <div className="bg-white"></div>
                            <div className="bg-black"></div>
                            <div className="bg-black"></div>
                          </div>
                          <div className="absolute -bottom-1 -right-1 bg-purple text-white p-1 rounded-full text-[8px] font-bold">
                            NEXORA</div>
                        </div>
                        <p className="text-[10px] text-slate-500" data-i18n="staff-qr-desc">Each technician desk holds one multi-wallet QR card. Mobile scans resolve directly to personal wallets.</p>
                      </div>
                    </div>
                    
                    <div className="p-4 space-y-4 h-full overflow-y-auto max-h-[510px] flex-1 hidden" id="screen-owner">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-xs text-navy leading-none">Golden Glow Spa</h4>
                          <span className="text-[9px] text-muted font-bold" data-i18n="owner-header-role">OWNER PORTAL CONTROL</span>
                        </div>
                        <span className="text-[9px] bg-green/10 text-green font-extrabold px-2 py-0.5 rounded-full" data-i18n="owner-sys-live">Ecosystem Live</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm text-center ds-surface ds-elevate">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase" data-i18n="owner-savings-est">Processing Fees Avoided</span>
                          <strong className="text-xl font-extrabold text-navy" id="dashboard-savings-label">$415.50</strong>
                          <span className="block text-[8px] text-green font-extrabold" id="dashboard-tips-total">$13,850
                            routed</span>
                        </div>
                        <div className="bg-white border border-slate-200 p-2.5 rounded-xl shadow-sm text-center ds-surface ds-elevate">
                          <span className="block text-[8px] font-bold text-slate-400 uppercase" data-i18n="owner-b2b-alliance">Active B2B Alliance</span>
                          <strong className="text-xl font-extrabold text-navy" id="dashboard-partners-count">2 Cửa Hàng</strong>
                          <span className="block text-[8px] text-purple font-extrabold">142 Shared Scans</span>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 animate-fadeIn ds-surface ds-elevate">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <svg className="w-3.5 h-3.5 text-purple" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                              <path d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" strokeLinecap="round" strokeLinejoin="round"></path>
                            </svg>
                            <span data-i18n="sim-taxiq-compliance">🛡️ NEXORA TAX IQ COMPLIANCE</span>
                          </span>
                          <span className="text-green bg-green/10 text-[8px] font-extrabold px-1.5 py-0.5 rounded" data-i18n="sim-taxiq-irs">IRS Compliant</span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-700">
                          <span data-i18n="tax-safety-rating">Audit Risk Rating:</span>
                          <span className="text-green font-extrabold">98% Audit-Safe</span>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl space-y-1 text-[9px] text-slate-500 leading-normal">
                          <div className="flex justify-between">
                            <span data-i18n="tax-staff-reported">Active Contractor Logs:</span>
                            <strong className="text-navy">18 Staff Active</strong>
                          </div>
                          <div className="flex justify-between">
                            <span data-i18n="tax-automated-forms">Regulatory Filing Compliance:</span>
                            <strong className="text-purple">1099-NEC &amp; 1099-K Ready</strong>
                          </div>
                        </div>
                        <button className="w-full bg-purple hover:bg-indigo-700 text-white font-extrabold text-[9px] py-1.5 rounded-lg shadow-sm transition-all uppercase tracking-wider ds-control ds-button" data-i18n="btn-tax-export-reports" onClick={() => { hp.downloadTaxReport() }}>Export 1099 &amp; Co-op Statements</button>
                      </div>
                      
                      <div className="bg-gradient-to-br from-indigo-50 to-purple/10 border border-purple/20 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                        <span className="text-[10px] font-black text-purple uppercase tracking-wider block" data-i18n="owner-b2b-create-title">🎯 Formulate Targeted B2B Campaigns</span>
                        <div className="space-y-1.5 text-[10px]">
                          
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="font-bold text-slate-600" data-i18n="owner-b2b-select-partner">1. Select alliance entity:</span>
                            <select className="bg-white border border-slate-200 rounded p-1 text-[9px] font-bold focus:outline-none focus:border-purple ds-field ds-select" id="owner-b2b-partner">
                              <option value="Glow Coffee">☕ Glow Coffee</option>
                              <option value="Serene Yoga">🧘‍♀️ Serene Yoga</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="font-bold text-slate-600" data-i18n="owner-b2b-select-tier">2. Choose client segment:</span>
                            <select className="bg-white border border-slate-200 rounded p-1 text-[9px] font-bold focus:outline-none focus:border-purple ds-field ds-select" id="owner-b2b-tier">
                              <option data-i18n="opt-tier-gold" value="Gold">Gold Tier (VIP)</option>
                              <option data-i18n="opt-tier-silver" value="Silver">Silver Tier</option>
                              <option data-i18n="opt-tier-diamond" value="Diamond">Diamond Tier</option>
                            </select>
                          </div>
                          
                          <div className="flex justify-between items-center gap-1.5">
                            <span className="font-bold text-slate-600" data-i18n="owner-b2b-set-gift">3. Promotion reward gift:</span>
                            <input className="bg-white border border-slate-200 rounded p-1 text-[9px] w-28 focus:outline-none focus:border-purple ds-field" data-i18n="ph-b2b-gift" id="owner-b2b-gift" placeholder="Complimentary cookies / Free Gel Dry..." type="text" />
                          </div>
                        </div>
                        <button className="w-full bg-purple hover:bg-indigo-700 text-white font-extrabold text-[9px] py-1.5 rounded-lg shadow-sm transition-all uppercase tracking-wider ds-control ds-button" data-i18n="owner-b2b-btn-activate" onClick={() => { hp.activateB2BTargetedCampaign() }}>Activate B2B Campaign Node</button>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider" data-i18n="owner-b2b-partners">🤝 Local Neighborhood Alliances</span>
                          <span className="text-green bg-green/10 text-[8px] font-bold px-1.5 py-0.5 rounded">Online</span>
                        </div>
                        
                        <div className="space-y-1.5" id="owner-b2b-list">
                          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[10px]">
                            <span className="font-bold text-slate-700" data-i18n="owner-partner-1">☕ Glow Coffee (Directly opposite)</span>
                            <span className="text-green bg-green/10 text-[8px] font-bold px-1.5 py-0.5 rounded" data-i18n="owner-status-linked">Connected Node</span>
                          </div>
                          <div className="flex items-center justify-between p-1.5 bg-slate-50 rounded-lg text-[10px]">
                            <span className="font-bold text-slate-700" data-i18n="owner-partner-2">🧘‍♀️ Serene Yoga (2 doors down)</span>
                            <span className="text-green bg-green/10 text-[8px] font-bold px-1.5 py-0.5 rounded" data-i18n="owner-status-linked">Connected Node</span>
                          </div>
                          
                          <div className="bg-amber-50 border border-amber-200/80 p-2 rounded-xl space-y-1.5 animate-fadeIn" id="b2b-pending-request">
                            <div className="flex justify-between items-center">
                              <span className="text-[9px] font-bold text-amber-800" data-i18n="owner-b2b-pending">🌸 Connection request from Bloom Florist</span>
                              <span className="text-[8px] bg-amber-100 text-amber-700 font-extrabold px-1" data-i18n="owner-b2b-waiting">Pending Approval</span>
                            </div>
                            <p className="text-[8px] text-slate-500" data-i18n="owner-b2b-pending-desc">Cross exchange points so client profiles can trade florist goods.</p>
                            <div className="flex gap-1.5 justify-end">
                              <button className="bg-purple text-white text-[8px] font-extrabold px-2.5 py-1 rounded shadow-sm hover:opacity-95 ds-control ds-button" data-i18n="owner-b2b-approve" onClick={() => { hp.approveB2BPartner() }}>Accept Link</button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider" data-i18n="owner-live-log">Real-time Operations Log feed</span>
                          <span className="w-1.5 h-1.5 rounded-full bg-green animate-pulse"></span>
                        </div>
                        <div className="space-y-1.5 text-[10px] max-h-24 overflow-y-auto pr-1" id="dashboard-log">
                          <div className="flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100">
                            <span data-i18n="log-redeem">Client swapped partner points</span>
                            <span className="text-purple font-bold" data-i18n="log-gift-1">1 free coffee at Glow Coffee</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-600 py-1 border-b border-dashed border-slate-100">
                            <span>Chloe ($10 Tip)</span>
                            <span className="text-green font-bold">Via Zelle</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-white border border-slate-200 p-3 rounded-2xl shadow-sm space-y-2 ds-surface ds-elevate">
                        <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block" data-i18n="owner-multiplier">Adjust Loyalty Point Scale</span>
                        <div className="flex items-center justify-between gap-2 bg-slate-50 p-2 rounded-xl">
                          <span className="text-[11px] text-slate-700 font-bold" data-i18n="owner-multiplier-sub">Loyalty points per tipped dollar:</span>
                          <div className="flex items-center gap-1.5">
                            <button className="w-5 h-5 rounded bg-slate-200 font-extrabold text-xs text-navy ds-control ds-button" onClick={() => { hp.changePointsRule(-1) }}>-</button>
                            <strong className="text-xs font-black text-purple" id="points-multiplier-label">10x</strong>
                            <button className="w-5 h-5 rounded bg-slate-200 font-extrabold text-xs text-navy ds-control ds-button" onClick={() => { hp.changePointsRule(1) }}>+</button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="w-28 h-1 bg-slate-800 rounded-full mx-auto mb-3 mt-1 shrink-0"></div>
                  </div>
                </div>
                <p className="text-xs font-semibold text-slate-500 mt-3 flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-full custom-gradient"></span> <span data-i18n="sim-tabs-footer">Switch active tabs above to interact with staff &amp; salon manager panels!</span>
                </p>
              </div>
            </div>
          </div>
        </section>
    </>
  )
}
