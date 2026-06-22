// MenuIcon — renders a menu item's lucide icon with active/inactive styling. Shared UI atom.
// Wraps image icons in a .sidebar-icon-wrap for neon glow background on hover/active.
export default function MenuIcon({ item, active = false }) {
  if (item.image) {
    return (
      <span className="sidebar-icon-wrap">
        <img
          src={item.image}
          alt=""
          className={`sidebar-icon shrink-0 object-contain transition-all ${active ? 'sidebar-icon--active' : ''}`}
          aria-hidden="true"
        />
      </span>
    )
  }

  const Icon = item.icon
  return <Icon className={`h-5 w-5 shrink-0 ${active ? 'text-white' : 'text-white/60'}`} />
}
