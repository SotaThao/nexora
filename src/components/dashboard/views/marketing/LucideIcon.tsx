import type { ComponentType } from 'react'
import * as Icons from 'lucide-react'
import type { LucideProps } from 'lucide-react'

export type LucideIconProps = LucideProps & {
  name: string
}

function kebabToPascal(str: string): string {
  return str
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join('')
}

export function LucideIcon({ name, className, ...props }: LucideIconProps) {
  const iconName = kebabToPascal(name)
  const IconComponent = (Icons as unknown as Record<string, ComponentType<LucideProps>>)[iconName]

  if (!IconComponent) {
    return <span className={className} aria-hidden />
  }

  return <IconComponent className={className} {...props} />
}

export default LucideIcon
