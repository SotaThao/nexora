// MenuIcon — renders a menu item's lucide icon with active/inactive styling. Shared UI atom.
export default function MenuIcon({ item, active = false }) {
  const Icon = item.icon
  return <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-white/60'}`} />
}
