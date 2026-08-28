import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Sparkles, ShoppingBag, Settings, MessageCircle, Home, ChevronUp, ChevronDown } from 'lucide-react'

export default function GlobalDemoQuickNav() {
  const [isExpanded, setIsExpanded] = useState(true)
  const location = useLocation()
  const path = location.pathname

  return (
    <div className="fixed bottom-4 right-4 z-[9999] font-sans antialiased">
      {isExpanded ? (
        <div className="flex flex-col items-end gap-1.5 rounded-2xl border border-white/20 bg-[#0B1C30]/95 p-2 shadow-2xl backdrop-blur-md text-white animate-fadeIn">
          <div className="flex items-center justify-between w-full gap-3 px-2 pb-1.5 border-b border-white/10 text-[11px] font-black text-amber-400">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>NEXORA DEMO HUB</span>
            </span>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-white/60 hover:text-white p-0.5 rounded transition"
              title="Thu nhỏ"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1.5 w-full pt-0.5">
            <Link
              to="/preview/builder"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path.includes('builder')
                  ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/40 border border-amber-500/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>🎨 Studio Builder</span>
            </Link>

            <Link
              to="/b/nexora-luxury"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path.startsWith('/b/') || path.startsWith('/site/')
                  ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                  : 'bg-rose-500/20 text-rose-300 hover:bg-rose-500/40 border border-rose-500/30'
              }`}
            >
              <span>💅 Web Salon</span>
            </Link>

            <Link
              to="/preview/menu"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path === '/preview/menu'
                  ? 'bg-emerald-500 text-white ring-2 ring-emerald-300'
                  : 'bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600/50 border border-emerald-500/30'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>🛒 Menu Khách</span>
            </Link>

            <Link
              to="/pos/services"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path.includes('/pos')
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400'
                  : 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50 border border-indigo-500/30'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>⚙️ POS Admin</span>
            </Link>

            <Link
              to="/community"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path.startsWith('/community')
                  ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                  : 'bg-white/10 text-white/80 hover:bg-white/20 border border-white/10'
              }`}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>💬 Community</span>
            </Link>

            <Link
              to="/manual-activity"
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm ${
                path.includes('manual-activity') || path.includes('manual-payment') || path.includes('activity')
                  ? 'bg-purple-600 text-white ring-2 ring-purple-400'
                  : 'bg-purple-600/30 text-purple-300 hover:bg-purple-600/50 border border-purple-500/30'
              }`}
            >
              <span>💳 Ghi nhận GD</span>
            </Link>

            <Link
              to="/login"
              className="col-span-2 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-sm bg-white/10 text-white/80 hover:bg-white/20 border border-white/10"
            >
              <span>⚡ Đăng nhập</span>
            </Link>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-[#0B1C30]/95 px-3.5 py-2 text-xs font-extrabold text-amber-300 shadow-2xl backdrop-blur-md hover:scale-105 hover:bg-[#0B1C30] transition"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>⚡ Demo Hub</span>
          <ChevronUp className="w-3.5 h-3.5 text-white/60" />
        </button>
      )}
    </div>
  )
}
