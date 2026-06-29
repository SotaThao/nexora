/** Homepage section component */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useHomePageBridge } from '../context/HomePageBridgeContext'
import LucideIcon from '../ui/LucideIcon'
import TermsModal from '../../register/modals/TermsModal'

export default function HomePageFooterSection() {
  const navigate = useNavigate()
  const { hp, planCta, onLogout } = useHomePageBridge()
  const [legalModal, setLegalModal] = useState<{ open: boolean; type: 'terms' | 'privacy' }>({ open: false, type: 'terms' })

  return (
    <>
      <footer className="bg-navy text-white border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 md:gap-10 pb-4 sm:pb-6 border-b border-white/10">
              
              <div className="flex flex-col items-center md:items-start gap-2 sm:gap-4 text-center md:text-left">
                <a className="flex items-center group ds-control ds-link w-fit" href="#" aria-label="NEXORA TOUCH">
                  <img alt="NEXORA TOUCH" className="h-10 sm:h-11 w-auto group-hover:scale-105 transition-transform" src="/homepage/assets/images/logo-dark-mode.png" />
                </a>
                <p className="text-xs text-slate-400 leading-snug max-w-sm" data-i18n="footer-subtext">Assembled with profound devotion for local retail heroes.</p>
              </div>
              
              <div className="flex flex-row items-center justify-center gap-x-3 sm:gap-x-4">
                <h3 className="text-xs font-bold text-slate-500" data-i18n="footer-social">Connect with us</h3>
                <div className="flex items-center gap-2 sm:gap-3">
                  <a className="ds-control ds-link transition-transform duration-200 hover:-translate-y-1" href="https://www.facebook.com/nexoratouch.official" target="_blank" rel="noopener" aria-label="Facebook">
                    <img alt="Facebook" className="w-9 h-9 sm:w-10 sm:h-10" src="/homepage/assets/images/facebook.svg" />
                  </a>
                  
                  <a className="ds-control ds-link transition-transform duration-200 hover:-translate-y-1" href="https://t.me/nexoratouch" target="_blank" rel="noopener" aria-label="Telegram">
                    <img alt="Telegram" className="w-9 h-9 sm:w-10 sm:h-10" src="/homepage/assets/images/telegram.svg" />
                  </a>
                  <a className="ds-control ds-link transition-transform duration-200 hover:-translate-y-1" href="https://www.youtube.com/@nexoratouch.official" target="_blank" rel="noopener" aria-label="YouTube">
                    <img alt="YouTube" className="w-9 h-9 sm:w-10 sm:h-10" src="/homepage/assets/images/youtube.svg" />
                  </a>
                </div>
              </div>
            </div>
            <div className="pt-3 sm:pt-6 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3 text-center">
              <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5 sm:gap-x-5 sm:gap-y-2">
                <a href="#" className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors ds-control ds-link" onClick={(e) => { e.preventDefault(); setLegalModal({ open: true, type: 'terms' }) }}>Terms of Service</a>
                <a href="#" className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors ds-control ds-link" data-i18n="footer-link-1" onClick={(e) => { e.preventDefault(); setLegalModal({ open: true, type: 'privacy' }) }}>Privacy Policy</a>
                <a className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors ds-control ds-link" data-i18n="footer-link-2" href="#">Ecosystem Guidelines</a>
                <a className="text-[10px] sm:text-xs text-slate-400 hover:text-white transition-colors ds-control ds-link" data-i18n="footer-link-3" href="https://cryptomap360.com/#ecosystem" target="_blank" rel="noopener">VLINKPAY Financial Infrastructure</a>
              </div>
              <p className="text-[10px] sm:text-xs leading-snug text-slate-500">
                <span data-i18n="footer-copyright">© 2026 NEXORA TOUCH. Tip Smarter. Review Faster. Grow Stronger.</span> 
              </p>
            </div>
          </div>
        </footer>
      <TermsModal
        open={legalModal.open}
        onClose={() => setLegalModal(prev => ({ ...prev, open: false }))}
        modalType={legalModal.type}
      />
    </>
  )
}
