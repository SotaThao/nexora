import type { ReactNode } from 'react'

// Panel — card surface wrapper. Shared UI atom.
export default function Panel({
  children,
  className = '',
  id,
}: {
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <section id={id} className={`nexora-card ${className}`}>
      {children}
    </section>
  )
}
