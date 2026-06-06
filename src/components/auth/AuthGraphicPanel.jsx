import React from 'react'
import { CreditCard, QrCode, Radio, ShieldCheck, Sparkles } from 'lucide-react'

export default function AuthGraphicPanel() {
  return (
    <aside className="relative hidden min-h-full overflow-hidden rounded-xl border border-nexoraBorder bg-nexoraSidebar text-white shadow-nexora-soft lg:flex">
      <img
        src="/assets/nexora-auth-graphic.png"
        alt="Nexora Touch merchant workspace"
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-nexoraSidebar/5 via-nexoraSidebar/30 to-nexoraSidebar/95" />
      <div className="absolute inset-0 bg-gradient-to-r from-nexoraSidebar/10 via-transparent to-transparent" />

      <div className="relative z-10 flex min-h-full w-full flex-col justify-between p-6">
        <div className="flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-3 py-2 text-[11px] font-bold uppercase text-white shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-brandCyan" />
            NEXORA TOUCH
          </div>
          <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-brandCyan backdrop-blur-md">
            <Radio className="h-4 w-4" />
          </div>
        </div>

        <div className="space-y-3">
          <div className="max-w-sm rounded-xl border border-white/15 bg-white/12 p-4 shadow-premium backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase text-white/65">Merchant OS</p>
                <p className="mt-1 text-2xl font-black text-white">Tips, QR, NFC</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white text-nexoraBrand shadow-nexora-card">
                <QrCode className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                ['12.8k', 'Tips'],
                ['98%', 'Reviews'],
                ['24/7', 'Flow'],
              ].map(([value, label]) => (
                <div key={label} className="rounded-lg border border-white/10 bg-white/10 px-3 py-2">
                  <p className="text-sm font-black text-white">{value}</p>
                  <p className="text-[10px] font-semibold uppercase text-white/55">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-semibold text-white/75">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brandCyan/15 text-brandCyan">
              <CreditCard className="h-4 w-4" />
            </span>
            <span>VLINKPAY-ready merchant authentication</span>
            <ShieldCheck className="h-4 w-4 text-nexoraSuccess" />
          </div>
        </div>
      </div>
    </aside>
  )
}
