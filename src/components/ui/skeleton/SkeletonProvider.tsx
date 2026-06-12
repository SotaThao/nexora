import type { ReactNode } from 'react'
import { SkeletonTheme } from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const SKELETON_BASE = '#E8EDF3'
const SKELETON_HIGHLIGHT = '#F4F7FB'

interface SkeletonProviderProps {
  children: ReactNode
}

/** App-wide skeleton theme aligned with Nexora surface tokens. */
export default function SkeletonProvider({ children }: SkeletonProviderProps) {
  return (
    <SkeletonTheme baseColor={SKELETON_BASE} highlightColor={SKELETON_HIGHLIGHT} borderRadius="0.5rem" duration={1.4}>
      {children}
    </SkeletonTheme>
  )
}
