import { useContext } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { AuthContext } from '../../auth/AuthContext'
import { tokenStore } from '../../auth/tokenStore'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { qk } from '../queryKeys'
import publicQrRepository from '../repositories/publicQr'
import merchantPhysicalCardsRepository from '../repositories/merchantPhysicalCards'
import { getApiErrorCode } from '../../types/domain'
import { getErrorI18nKey } from '../errorCodes'
import type { PhysicalCardDetail, ResolveQrCodePayload } from '../../types/domain'
import type { SendPhysicalCardSupportResult } from '../../types/repositories'

interface SendPublicPhysicalCardSupportVars {
  helpCode: string
  message: string
}

function hasStoredAccessToken(): boolean {
  return Boolean(tokenStore.get()?.accessToken)
}

export function useResolveQrCode(
  cardCode?: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const normalizedCode = cardCode?.trim() ?? ''

  return useQuery<ResolveQrCodePayload>({
    queryKey: qk.resolveQrCode(normalizedCode),
    queryFn: () => publicQrRepository.resolveQrCode(normalizedCode),
    enabled: enabled && Boolean(normalizedCode),
    retry: false,
    staleTime: 0,
  })
}

export function usePublicPhysicalCardHelp(
  helpCode?: string | null,
  { enabled = true }: { enabled?: boolean } = {},
) {
  const auth = useContext(AuthContext)
  const authStatus = auth?.status ?? 'loading'
  const authReady = authStatus !== 'loading'
  const normalizedHelpCode = helpCode?.trim() ?? ''

  return useQuery<PhysicalCardDetail>({
    queryKey: qk.publicPhysicalCardHelp(normalizedHelpCode, authStatus),
    queryFn: () =>
      merchantPhysicalCardsRepository.getPhysicalCardDetail(normalizedHelpCode, {
        anonymous: !hasStoredAccessToken(),
      }),
    enabled: enabled && Boolean(normalizedHelpCode) && authReady,
    retry: false,
  })
}

export function usePublicSendPhysicalCardSupport() {
  const { showToast } = useNotification()
  const { t } = useTranslation()

  return useMutation<SendPhysicalCardSupportResult, Error, SendPublicPhysicalCardSupportVars>({
    mutationFn: ({ helpCode, message }) =>
      merchantPhysicalCardsRepository.sendPhysicalCardSupport(helpCode, message, {
        anonymous: !hasStoredAccessToken(),
      }),
    onSuccess: () => {
      showToast(t('public.help_qr.support_success'), 'success')
    },
    onError: (err) => {
      const i18nKey = getErrorI18nKey(getApiErrorCode(err, 'unknown_error'))
      showToast(t(i18nKey), 'error')
    },
  })
}
