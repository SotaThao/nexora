/**
 * Overview banner count for tips awaiting owner shop confirmation (US-025).
 *
 * Must match Reports `?status=AwaitingShopConfirmation`: fetch Confirmed tips
 * (not the unfiltered tips page) and apply the same local-staff resolution.
 */
import { useMemo } from 'react'
import {
  AWAITING_SHOP_CONFIRMATION_PAGE_SIZE,
  DEFAULT_PAGE_NUMBER,
  STAFF_FILTER_LIST_PAGE_SIZE,
} from '../../../constants/pagination'
import { TipStatus } from '../../../constants/tipStatus'
import { useMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import { useTransactionsPaginated } from '../../../data/hooks/useTransactions'
import { countAwaitingShopConfirmation } from '../utils'

export function useAwaitingShopConfirmationCount({ enabled = true } = {}) {
  const { data: staffPage } = useMerchantStaff({
    pageNumber: DEFAULT_PAGE_NUMBER,
    pageSize: STAFF_FILTER_LIST_PAGE_SIZE,
    enabled,
  })
  const { data: confirmedTipsPage } = useTransactionsPaginated(
    {
      pageNumber: DEFAULT_PAGE_NUMBER,
      pageSize: AWAITING_SHOP_CONFIRMATION_PAGE_SIZE,
      status: TipStatus.Confirmed,
    },
    { enabled },
  )

  return useMemo(
    () =>
      countAwaitingShopConfirmation(
        confirmedTipsPage?.items ?? [],
        staffPage?.items ?? [],
      ),
    [confirmedTipsPage?.items, staffPage?.items],
  )
}
