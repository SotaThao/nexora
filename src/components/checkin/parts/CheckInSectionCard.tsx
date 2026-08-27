import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export default function CheckInSectionCard({
  title,
  subtitle,
  icon: Icon,
  children,
  headingAs: Heading = 'h2',
  relaxed = false,
}: {
  title: string
  subtitle?: string
  icon: LucideIcon
  children: ReactNode
  headingAs?: 'h2' | 'h3'
  relaxed?: boolean
}) {
  return (
    <section
      className={`${relaxed ? 'space-y-4' : 'space-y-3'} rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm`}
    >
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand"
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 pt-0.5">
          <Heading className="text-base font-black leading-5 text-nexoraText">{title}</Heading>
          {subtitle ? (
            <p className="mt-0.5 text-xs leading-4 text-nexoraMuted">{subtitle}</p>
          ) : null}
        </div>
      </div>

      {children}
    </section>
  )
}
