import React from 'react'
import { TrendingUp, Sparkles } from 'lucide-react'
import { SitePalette } from '../palettes'

interface CryptoTickerRibbonProps {
  palette: SitePalette
  isMobileView?: boolean
}

interface TickerItem {
  id: string
  type: 'crypto' | 'promo'
  symbol?: string
  price?: string
  change?: string
  text?: string
  isPositive?: boolean
}

const DEFAULT_TICKERS: TickerItem[] = [
  { id: 'btc', type: 'crypto', symbol: 'BTC/USD', price: '$74,510.00', change: '+6.60%', isPositive: true },
  { id: 'eth', type: 'crypto', symbol: 'ETH/USD', price: '$2,348.34', change: '+3.40%', isPositive: true },
  { id: 'usdt', type: 'crypto', symbol: 'USDT/USD', price: '$1.00', change: '0.00%', isPositive: true },
  { id: 'p1', type: 'promo', text: '🎁 GROUP BOOKING (5+ GUESTS): COMPLIMENTARY BOTTLE OF CHAMPAGNE' },
  { id: 'sol', type: 'crypto', symbol: 'SOL/USD', price: '$89.21', change: '+4.60%', isPositive: true },
  { id: 'vlink', type: 'promo', text: '⚡ VLINKPAY: BITCOIN & CONTACTLESS POS 0% TRANSACTION FEES' },
  { id: 'p2', type: 'promo', text: '✨ BIRTHDAY PERK: ENJOY 15% OFF ALL SERVICES DURING YOUR BIRTHDAY MONTH' }
]

export const CryptoTickerRibbon: React.FC<CryptoTickerRibbonProps> = ({
  palette,
  isMobileView
}) => {
  return (
    <div
      className="w-full bg-[#050811] border-b border-amber-500/20 py-1.5 px-4 overflow-hidden relative z-30 select-none"
      style={{ borderColor: `${palette.accentColor}30` }}
    >
      <div className="flex items-center gap-8 animate-marquee whitespace-nowrap text-[11px] font-mono">
        {/* Render twice for seamless continuous loop */}
        {[...DEFAULT_TICKERS, ...DEFAULT_TICKERS].map((item, idx) => (
          <div key={`${item.id}-${idx}`} className="inline-flex items-center gap-2 shrink-0">
            {item.type === 'crypto' ? (
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10">
                <span className="font-bold text-amber-400">{item.symbol}</span>
                <span className="text-white font-semibold">{item.price}</span>
                <span className={`inline-flex items-center text-[10px] font-bold ${item.isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                  <TrendingUp className="w-2.5 h-2.5 mr-0.5" />
                  {item.change}
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-amber-200/90 font-sans font-semibold">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0 animate-pulse" />
                <span>{item.text}</span>
              </div>
            )}
            <span className="text-slate-600 ml-4 font-normal">·</span>
          </div>
        ))}
      </div>
    </div>
  )
}
