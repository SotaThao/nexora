import { Palette } from 'lucide-react'

// Local sample art only; no user image, upload, or externally hosted asset.
export default function TechnicianPortfolioTile({ sample }: { sample: string }) {
  const variant = Number(sample.slice(-1)) % 3
  return <span aria-hidden className="relative flex h-full w-full items-center justify-center gap-1.5 overflow-hidden rounded-lg bg-nexoraBrandSoft p-3">{[0, 1, 2].map((nail) => <span key={nail} className={`h-12 w-5 rotate-12 rounded-full border-2 border-white shadow-sm ${variant === 0 ? 'bg-nexoraViolet' : variant === 1 ? 'bg-nexoraBrand' : 'bg-nexoraSuccess'}`} style={{ transform: `translateY(${nail === 1 ? -5 : 5}px) rotate(12deg)` }} />)}<Palette className="absolute bottom-1 right-1 h-4 w-4 text-nexoraBrand" /></span>
}
