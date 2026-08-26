// TemplateBuilderPreviewPage — Direct Standalone Access for Vercel Demo (US-107)
import React from 'react'
import { Link } from 'react-router-dom'
import {
  Sparkles,
  Layout,
  ExternalLink,
  Flame,
  Globe,
  ShieldCheck
} from 'lucide-react'
import SiteEditorView from '../../dashboard/views/site/SiteEditorView'

export default function TemplateBuilderPreviewPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Top Demo Navigation Bar */}
      <header className="sticky top-0 z-50 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Badge */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-sm tracking-tight text-white">NEXORA</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Template Studio (US-107)
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Route Switcher */}
          <nav className="flex items-center flex-wrap gap-2 text-xs">
            <Link
              to="/preview/builder"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/30 transition-all hover:bg-indigo-500"
            >
              <Layout className="w-3.5 h-3.5" />
              <span>🎨 Template Builder</span>
            </Link>

            <Link
              to="/b/nexora-luxury"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 font-semibold transition-all"
            >
              <Globe className="w-3.5 h-3.5 text-emerald-400" />
              <span>🌐 Public Salon Site</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </Link>

            <Link
              to="/preview/menu"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 font-semibold transition-all"
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>💅 Smart Upsell (US-108)</span>
            </Link>

            <Link
              to="/login"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 font-bold transition-all ml-1"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>⚡ Login Demo</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Studio Editor Workspace */}
      <main className="flex-1 bg-slate-50 text-slate-900 py-6 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <SiteEditorView />
        </div>
      </main>
    </div>
  )
}
