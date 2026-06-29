import {
  BarChart2,
  Check,
  CircleUser,
  Gift,
  LayoutDashboard,
  Link2,
  Megaphone,
  QrCode,
  ShieldCheck,
  X,
  type LucideIcon as LucideIconType,
} from 'lucide-react'

const ICONS: Record<string, LucideIconType> = {
  check: Check,
  gift: Gift,
  'qr-code': QrCode,
  'circle-user': CircleUser,
  'layout-dashboard': LayoutDashboard,
  'link-2': Link2,
  'bar-chart-2': BarChart2,
  'shield-check': ShieldCheck,
  megaphone: Megaphone,
  x: X,
}

interface LucideIconProps {
  name: string
  className?: string
}

export default function LucideIcon({ name, className = '' }: LucideIconProps) {
  const Icon = ICONS[name]
  if (!Icon) return <i data-lucide={name} className={className} aria-hidden />
  return <Icon className={className} aria-hidden />
}
