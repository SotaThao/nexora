/**
 * Opens Merchant Portal Product Management via ecosystem SSO:
 * 1. GET /api/v1/Client/ecosystem
 * 2. Find name === merchantportal
 * 3. POST signin with that id + path /gift-voucher/product-management
 */
import { useCallback, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../../auth/useAuth'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import { qk } from '../queryKeys'
import ecosystemRepository from '../repositories/ecosystem'
import {
  closeWindowIfOpen,
  isValidEcosystemRedirectUrl,
  openUrlInNewTab,
  openWindowOrFallback,
  updateWindowUrl,
} from '../../utils/ecosystem'
import {
  PRODUCT_MANAGEMENT_PAGE_NAME,
  PRODUCT_MANAGEMENT_PATH,
  buildProductManagementUrl,
  findMerchantPortalEcosystem,
} from '../../utils/productManagementSso'
import { useEcosystemSignIn } from './useEcosystem'

function navigateOpenedTab(newTab: Window | null, url: string) {
  if (newTab && !newTab.closed) {
    updateWindowUrl(newTab, url)
  } else {
    openUrlInNewTab(url)
  }
}

export function useOpenProductManagement() {
  const { status } = useAuth()
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const queryClient = useQueryClient()
  const signInMutation = useEcosystemSignIn()
  const [isOpening, setIsOpening] = useState(false)
  const openingRef = useRef(false)

  const openProductManagement = useCallback(async () => {
    if (openingRef.current) return
    openingRef.current = true
    setIsOpening(true)

    // Open blank tab first so mobile Safari does not block the popup after await.
    const newTab = openWindowOrFallback('about:blank')

    const fail = () => {
      closeWindowIfOpen(newTab)
      showToast(t('dashboard.menu.product_management_error'), 'error')
    }

    try {
      const ecosystems = await queryClient.fetchQuery({
        queryKey: qk.ecosystems(),
        queryFn: () => ecosystemRepository.list(),
        staleTime: 5 * 60_000,
      })

      const merchantPortal = findMerchantPortalEcosystem(ecosystems)
      if (!merchantPortal?.id) {
        fail()
        return
      }

      const fallbackUrl = buildProductManagementUrl(merchantPortal.url)

      if (status !== 'authenticated') {
        if (fallbackUrl && isValidEcosystemRedirectUrl(fallbackUrl)) {
          navigateOpenedTab(newTab, fallbackUrl)
          return
        }
        fail()
        return
      }

      const response = await signInMutation.mutateAsync({
        id: merchantPortal.id,
        path: PRODUCT_MANAGEMENT_PATH,
        pageName: PRODUCT_MANAGEMENT_PAGE_NAME,
      })

      if (isValidEcosystemRedirectUrl(response.redirectUrl)) {
        navigateOpenedTab(newTab, response.redirectUrl)
        return
      }

      if (fallbackUrl && isValidEcosystemRedirectUrl(fallbackUrl)) {
        navigateOpenedTab(newTab, fallbackUrl)
        return
      }

      fail()
    } catch {
      fail()
    } finally {
      openingRef.current = false
      setIsOpening(false)
    }
  }, [queryClient, showToast, signInMutation, status, t])

  return { openProductManagement, isOpeningProductManagement: isOpening }
}
