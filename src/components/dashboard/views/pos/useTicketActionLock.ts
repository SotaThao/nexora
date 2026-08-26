import { useCallback, useRef, useState } from 'react'
import { TicketBusySurface } from '../../../../constants/posTicketAction'

export function useTicketActionLock(isMutationPending: boolean) {
  const actionLockRef = useRef(false)
  const [busySurface, setBusySurface] = useState<TicketBusySurface | null>(null)

  const startTicketAction = useCallback(
    (surface: TicketBusySurface) => {
      if (isMutationPending || actionLockRef.current) return false
      actionLockRef.current = true
      setBusySurface(surface)
      return true
    },
    [isMutationPending],
  )

  const endTicketAction = useCallback(() => {
    actionLockRef.current = false
    setBusySurface(null)
  }, [])

  return {
    busySurface,
    isBusy: busySurface !== null || isMutationPending,
    startTicketAction,
    endTicketAction,
  }
}
