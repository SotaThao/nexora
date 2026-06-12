import type { ReactNode } from 'react'
import Skeleton from './Skeleton'

const panelClass = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

interface SkeletonKpiCardProps {
  className?: string
}

/** Matches compact staff-dashboard KPI tiles. */
export function SkeletonKpiCard({ className = '' }: SkeletonKpiCardProps) {
  return (
    <div className={`${panelClass} ${className}`}>
      <Skeleton width="55%" height={10} borderRadius={6} />
      <Skeleton width="70%" height={28} className="mt-3" borderRadius={8} />
      <Skeleton width="40%" height={12} className="mt-2" borderRadius={6} />
    </div>
  )
}

interface SkeletonKpiGridProps {
  count?: number
  columns?: 1 | 2 | 3 | 4
  className?: string
}

const KPI_GRID_COLS: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

export function SkeletonKpiGrid({ count = 4, columns = 2, className = '' }: SkeletonKpiGridProps) {
  const colClass = KPI_GRID_COLS[columns] || KPI_GRID_COLS[2]
  return (
    <div className={`grid gap-3 ${colClass} ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonKpiCard key={i} />
      ))}
    </div>
  )
}

interface SkeletonListItemProps {
  lines?: number
  showAvatar?: boolean
  showAction?: boolean
  className?: string
}

export function SkeletonListItem({
  lines = 2,
  showAvatar = false,
  showAction = false,
  className = '',
}: SkeletonListItemProps) {
  return (
    <div className={`flex items-center justify-between gap-3 py-3 ${className}`}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {showAvatar ? <Skeleton circle width={40} height={40} /> : null}
        <div className="min-w-0 flex-1 space-y-2">
          {Array.from({ length: lines }, (_, i) => (
            <Skeleton key={i} width={i === 0 ? '65%' : '45%'} height={i === 0 ? 14 : 12} borderRadius={6} />
          ))}
        </div>
      </div>
      {showAction ? <Skeleton width={72} height={28} borderRadius={999} /> : null}
    </div>
  )
}

interface SkeletonListProps extends SkeletonListItemProps {
  count?: number
  divided?: boolean
  className?: string
}

export function SkeletonList({
  count = 3,
  divided = true,
  className = '',
  ...itemProps
}: SkeletonListProps) {
  return (
    <div className={`${divided ? 'divide-y divide-nexoraBorder' : ''} ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <SkeletonListItem key={i} {...itemProps} />
      ))}
    </div>
  )
}

interface SkeletonPanelProps {
  titleWidth?: string | number
  rows?: number
  listProps?: SkeletonListProps
  children?: ReactNode
  className?: string
}

export function SkeletonPanel({
  titleWidth = '45%',
  rows = 3,
  listProps,
  children,
  className = '',
}: SkeletonPanelProps) {
  return (
    <section className={`${panelClass} ${className}`}>
      <Skeleton width={titleWidth} height={18} borderRadius={6} className="mb-3" />
      {children ?? <SkeletonList count={rows} {...listProps} />}
    </section>
  )
}

interface SkeletonTextProps {
  width?: string | number
  height?: number
  count?: number
  className?: string
}

export function SkeletonText({ width = '100%', height = 14, count = 1, className = '' }: SkeletonTextProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} width={i === count - 1 && count > 1 ? '75%' : width} height={height} borderRadius={6} />
      ))}
    </div>
  )
}

interface SkeletonAvatarProps {
  size?: number
  className?: string
}

export function SkeletonAvatar({ size = 40, className = '' }: SkeletonAvatarProps) {
  return <Skeleton circle width={size} height={size} className={className} />
}

export type SkeletonBlockConfig =
  | { type: 'kpi-grid'; count?: number; columns?: 1 | 2 | 3 | 4; className?: string }
  | { type: 'kpi-card'; className?: string }
  | { type: 'list'; count?: number; lines?: number; showAvatar?: boolean; showAction?: boolean; className?: string }
  | { type: 'panel'; titleWidth?: string | number; rows?: number; listProps?: SkeletonListProps; className?: string }
  | { type: 'text'; width?: string | number; height?: number; count?: number; className?: string }
  | { type: 'avatar'; size?: number; className?: string }
  | { type: 'spacer'; size?: 'sm' | 'md' | 'lg' }
  | { type: 'custom'; render: () => ReactNode }

const SPACER_CLASS = {
  sm: 'h-3',
  md: 'h-4',
  lg: 'h-6',
}

interface SkeletonLayoutProps {
  blocks: SkeletonBlockConfig[]
  className?: string
}

/**
 * Declarative skeleton composer — pass a block list to mirror any screen layout
 * without duplicating markup. Extend with new block types as UI patterns grow.
 */
export function SkeletonLayout({ blocks, className = '' }: SkeletonLayoutProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'kpi-grid':
            return <SkeletonKpiGrid key={index} count={block.count} columns={block.columns} className={block.className} />
          case 'kpi-card':
            return <SkeletonKpiCard key={index} className={block.className} />
          case 'list':
            return (
              <SkeletonList
                key={index}
                count={block.count}
                lines={block.lines}
                showAvatar={block.showAvatar}
                showAction={block.showAction}
                className={block.className}
              />
            )
          case 'panel':
            return (
              <SkeletonPanel
                key={index}
                titleWidth={block.titleWidth}
                rows={block.rows}
                listProps={block.listProps}
                className={block.className}
              />
            )
          case 'text':
            return (
              <SkeletonText
                key={index}
                width={block.width}
                height={block.height}
                count={block.count}
                className={block.className}
              />
            )
          case 'avatar':
            return <SkeletonAvatar key={index} size={block.size} className={block.className} />
          case 'spacer':
            return <div key={index} className={SPACER_CLASS[block.size || 'md']} aria-hidden />
          case 'custom':
            return <div key={index}>{block.render()}</div>
          default:
            return null
        }
      })}
    </div>
  )
}
