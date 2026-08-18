import { useCallback, useState } from 'react'
import { useHasStoreSetup } from './useHasStoreSetup'

/**
 * Gates package purchase CTAs until store setup is complete
 * (same `hasSetup` as dashboard SetupGuideBanner).
 */
export function useStoreSetupPurchaseGate({ enabled = true }: { enabled?: boolean } = {}) {
  const { hasSetup, isLoading, isResolved } = useHasStoreSetup({ enabled })
  const [gateOpen, setGateOpen] = useState(false)

  const closeGate = useCallback(() => setGateOpen(false), [])
  const openGate = useCallback(() => setGateOpen(true), [])

  /**
   * Runs `action` only when setup is complete. Otherwise opens the setup gate dialog.
   * While setup status is still loading, the click is ignored (no checkout flash).
   */
  const requireSetup = useCallback(
    (action: () => void): boolean => {
      if (!enabled) {
        action()
        return true
      }
      if (!isResolved || isLoading) return false
      if (!hasSetup) {
        setGateOpen(true)
        return false
      }
      action()
      return true
    },
    [enabled, hasSetup, isLoading, isResolved],
  )

  return {
    hasSetup,
    isSetupLoading: isLoading,
    isSetupResolved: isResolved,
    gateOpen,
    openGate,
    closeGate,
    requireSetup,
  }
}
