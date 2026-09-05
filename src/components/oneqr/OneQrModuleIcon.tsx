/**
 * Resolves a backend/merchant-supplied Lucide icon *name* to a real component.
 *
 * `CustomIcon` is free text on the entity (`varchar(40)`), so this must be an
 * allowlist, not a dynamic import: an unknown name falls back to a neutral
 * square rather than crashing the tile grid. Add names here when the backend
 * registry starts emitting them.
 */
import {
  Bot,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  DollarSign,
  ExternalLink,
  Gift,
  HandCoins,
  Heart,
  LayoutDashboard,
  LayoutList,
  Link2,
  List,
  MapPin,
  Megaphone,
  Percent,
  QrCode,
  ScanLine,
  Settings,
  Settings2,
  Share2,
  Sparkles,
  Square,
  Star,
  Tag,
  Ticket,
  User,
  UserCog,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

/**
 * Includes the newer Lucide names the backend registry emits
 * (`circle-check`, `square-arrow-out-up-right`, `user-round`, `users-round`),
 * aliased onto the equivalents that exist in this repo's lucide-react 0.344.
 * Without the aliases those keys would fall through to a blank square.
 */
const ICONS: Record<string, LucideIcon> = {
  bot: Bot,
  'calendar-check': CalendarCheck,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  check: Check,
  'check-circle-2': CheckCircle2,
  'circle-check': CheckCircle2,
  'circle-check-big': CheckCircle2,
  clock: Clock,
  'credit-card': CreditCard,
  crown: Crown,
  'dollar-sign': DollarSign,
  'external-link': ExternalLink,
  'square-arrow-out-up-right': ExternalLink,
  gift: Gift,
  'hand-coins': HandCoins,
  heart: Heart,
  'layout-dashboard': LayoutDashboard,
  'layout-list': LayoutList,
  link: Link2,
  'link-2': Link2,
  list: List,
  'map-pin': MapPin,
  megaphone: Megaphone,
  percent: Percent,
  'qr-code': QrCode,
  'scan-line': ScanLine,
  settings: Settings,
  'settings-2': Settings2,
  'share-2': Share2,
  sparkles: Sparkles,
  square: Square,
  star: Star,
  tag: Tag,
  ticket: Ticket,
  'user-cog': UserCog,
  'user-round': User,
  user: User,
  users: Users,
  'users-round': Users,
  wallet: Wallet,
}

/**
 * Names offered in the icon picker. Curated rather than `Object.keys(ICONS)`,
 * because the map holds aliases that render identically — listing all of them
 * would show the same glyph three times.
 */
export const ONEQR_ICON_CHOICES = [
  'check',
  'circle-check',
  'calendar-days',
  'calendar-check',
  'calendar-clock',
  'clock',
  'list',
  'settings-2',
  'layout-dashboard',
  'layout-list',
  'dollar-sign',
  'credit-card',
  'wallet',
  'hand-coins',
  'heart',
  'star',
  'gift',
  'crown',
  'percent',
  'ticket',
  'tag',
  'megaphone',
  'sparkles',
  'user-round',
  'user-cog',
  'users-round',
  'bot',
  'qr-code',
  'scan-line',
  'map-pin',
  'link',
  'share-2',
  'square-arrow-out-up-right',
  'square',
]

export function resolveOneQrIcon(name?: string | null): LucideIcon {
  if (!name) return Square
  return ICONS[name.trim().toLowerCase()] ?? Square
}

export default function OneQrModuleIcon({
  name,
  className = 'h-4 w-4',
}: {
  name?: string | null
  className?: string
}) {
  const Icon = resolveOneQrIcon(name)
  return <Icon className={className} aria-hidden />
}
