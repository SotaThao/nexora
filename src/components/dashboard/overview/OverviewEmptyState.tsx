import type { LucideIcon } from 'lucide-react'

interface OverviewEmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}

export default function OverviewEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: OverviewEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas/70 px-5 py-10 text-center ${className}`}
    >
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-nexoraBrand shadow-sm">
        <Icon className="h-7 w-7" />
      </div>
      <h4 className="text-sm font-extrabold text-nexoraText">{title}</h4>
      <p className="mt-2 max-w-sm text-xs leading-relaxed text-nexoraMuted">{description}</p>
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-nexoraBrand px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-nexoraBrandDark"
        >
          {actionLabel}
        </button>
      ) : null}
    </div>
  )
}
