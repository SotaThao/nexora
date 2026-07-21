/**
 * Overview banner count for tips awaiting owner confirmation.
 * Uses API Confirmed totalCount so it matches Reports `?status=Confirmed`.
 */
import { DEFAULT_PAGE_NUMBER } from '../../../constants/pagination'
import { TipStatus } from '../../../constants/tipStatus'
import { useTransactionsPaginated } from '../../../data/hooks/useTransactions'

export function useAwaitingShopConfirmationCount({ enabled = true } = {}) {
  const { data: confirmedTipsPage } = useTransactionsPaginated(
    {
      pageNumber: DEFAULT_PAGE_NUMBER,
      pageSize: 1,
      status: TipStatus.Confirmed,
    },
    { enabled },
  )

  return confirmedTipsPage?.totalCount ?? 0
}
