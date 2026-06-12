import SkeletonLib, { type SkeletonProps } from 'react-loading-skeleton'

export type { SkeletonProps }

/** Thin wrapper so screens import skeleton from our UI layer, not the library directly. */
export default function Skeleton(props: SkeletonProps) {
  return <SkeletonLib {...props} />
}
