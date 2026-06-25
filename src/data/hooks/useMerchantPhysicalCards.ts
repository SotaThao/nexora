import { useContext } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { qk } from '../queryKeys'
import merchantPhysicalCardsRepository from '../repositories/merchantPhysicalCards'
import { AuthContext } from '../../auth/AuthContext'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../errorCodes'
import type { PhysicalCardPage, PhysicalCardDetail } from '../../types/domain'
import type {
  LinkPhysicalCardResult,
  SendPhysicalCardSupportResult,
  UnlinkPhysicalCardResult,
} from '../../types/repositories'

interface PhysicalCardQueryParams {
  PageNumber?: number
  PageSize?: number
}

interface LinkPhysicalCardVars {
  cardCode: string
  touchPointId: string
}

interface SendPhysicalCardSupportVars {
  helpCode: string
  message: string
}

function updatePhysicalCardsCache(
  queryClient: ReturnType<typeof useQueryClient>,
  updater: (items: PhysicalCardPage['items']) => PhysicalCardPage['items'],
) {
  queryClient.setQueriesData<PhysicalCardPage>(
    { queryKey: qk.merchantPhysicalCards() },
    (current) => {
      if (!current?.items) return current
      return { ...current, items: updater(current.items) }
    },
  )
}

export function usePhysicalCards(
  params: PhysicalCardQueryParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'

  return useQuery<PhysicalCardPage>({
    queryKey: qk.merchantPhysicalCards(params),
    queryFn: () => merchantPhysicalCardsRepository.getPhysicalCards(params),
    enabled: isOwner && enabled,
  })
}

export function usePhysicalCardDetail(
  helpCode?: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const auth = useContext(AuthContext)
  const isOwner = auth?.status === 'authenticated' && auth?.session?.role === 'owner'
  const normalizedHelpCode = helpCode?.trim() ?? ''

  return useQuery<PhysicalCardDetail>({
    queryKey: qk.merchantPhysicalCardDetail(normalizedHelpCode),
    queryFn: () => merchantPhysicalCardsRepository.getPhysicalCardDetail(normalizedHelpCode),
    enabled: isOwner && enabled && Boolean(normalizedHelpCode),
  })
}

export function useSendPhysicalCardSupport() {
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<SendPhysicalCardSupportResult, Error, SendPhysicalCardSupportVars>({
    mutationFn: ({ helpCode, message }) =>
      merchantPhysicalCardsRepository.sendPhysicalCardSupport(helpCode, message),
    onSuccess: () => {
      showToast(t('dashboard.touchpoints.physical_card.support_success'), 'success')
    },
    onError: (err) => {
      const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))
      showToast(t(i18nKey), 'error')
    },
  })
}

export function useLinkPhysicalCard() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<LinkPhysicalCardResult, Error, LinkPhysicalCardVars>({
    mutationFn: ({ cardCode, touchPointId }) =>
      merchantPhysicalCardsRepository.linkPhysicalCard(cardCode, touchPointId),
    onSuccess: (data, variables) => {
      updatePhysicalCardsCache(queryClient, (items) =>
        items.map((card) => {
          if (card.cardCode === variables.cardCode) {
            return {
              ...card,
              linkedTouchPointId: data.linkedTouchPointId,
              touchPointName: data.touchPointName,
              linkedAt: data.linkedAt,
            }
          }
          if (card.linkedTouchPointId === variables.touchPointId) {
            return {
              ...card,
              linkedTouchPointId: null,
              touchPointName: null,
              linkedAt: null,
            }
          }
          return card
        }),
      )
      queryClient.invalidateQueries({ queryKey: qk.merchantPhysicalCards() })
      showToast(t('dashboard.touchpoints.link_success'), 'success')
    },
    onError: (err) => {
      const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))
      showToast(t(i18nKey), 'error')
    },
  })
}

export function useUnlinkPhysicalCard() {
  const queryClient = useQueryClient()
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<UnlinkPhysicalCardResult, Error, string>({
    mutationFn: (cardCode) => merchantPhysicalCardsRepository.unlinkPhysicalCard(cardCode),
    onSuccess: (_data, cardCode) => {
      updatePhysicalCardsCache(queryClient, (items) =>
        items.map((card) =>
          card.cardCode === cardCode
            ? {
                ...card,
                linkedTouchPointId: null,
                touchPointName: null,
                linkedAt: null,
              }
            : card,
        ),
      )
      queryClient.invalidateQueries({ queryKey: qk.merchantPhysicalCards() })
      showToast(t('dashboard.touchpoints.unlink_success'), 'success')
    },
    onError: (err) => {
      const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))
      showToast(t(i18nKey), 'error')
    },
  })
}
