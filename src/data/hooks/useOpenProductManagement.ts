/**
 * Opens Merchant Portal Product Management via ecosystem SSO:
 * 1. GET /api/v1/Client/ecosystem
 * 2. Find name === merchantportal
 * 3. POST signin with that id + destination path
 *
 * Uses repository calls directly (not useMutation/fetchQuery) so a one-shot
 * click handler does not touch Query observers.
 */
import { useCallback, useRef, useState } from 'react'
import { useAuth } from '../../auth/useAuth'
import { useNotification } from '../../contexts/NotificationContext'
import { useTranslation } from '../../contexts/LanguageContext'
import ecosystemRepository from '../repositories/ecosystem'
import {
  closeWindowIfOpen,
  isValidEcosystemRedirectUrl,
  openUrlInNewTab,
  openWindowOrFallback,
  updateWindowUrl,
} from '../../utils/ecosystem'
import {
  PRODUCT_MANAGEMENT_DESTINATIONS,
  applyDeepLinkToRedirectUrl,
  buildMerchantPortalDeepLink,
  findMerchantPortalEcosystem,
  type ProductManagementDestination,
} from '../../utils/productManagementSso'

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
  const [openingDestination, setOpeningDestination] = useState<ProductManagementDestination | null>(null)
  const openingRef = useRef(false)

  const openProductManagement = useCallback(async (
    destination: ProductManagementDestination = 'gift-card',
  ) => {
    if (openingRef.current) return
    openingRef.current = true
    setOpeningDestination(destination)

    // Open blank tab first so mobile Safari does not block the popup after await.
    const newTab = openWindowOrFallback('about:blank')

    const fail = () => {
      closeWindowIfOpen(newTab)
      showToast(t('dashboard.menu.product_management_error'), 'error')
    }

    const destinationConfig = PRODUCT_MANAGEMENT_DESTINATIONS[destination]
    if (!destinationConfig) {
      fail()
      openingRef.current = false
      setOpeningDestination(null)
      return
    }
    const { path, pageName } = destinationConfig

    try {
      const ecosystems = await ecosystemRepository.list()
      const merchantPortal = findMerchantPortalEcosystem(ecosystems)
      if (!merchantPortal?.id) {
        fail()
        return
      }

      const fallbackUrl = buildMerchantPortalDeepLink(merchantPortal.url, path)

      if (status !== 'authenticated') {
        if (fallbackUrl && isValidEcosystemRedirectUrl(fallbackUrl)) {
          navigateOpenedTab(newTab, fallbackUrl)
          return
        }
        fail()
        return
      }

      const response = await ecosystemRepository.signIn({
        id: merchantPortal.id,
        path,
        pageName,
      })

      if (isValidEcosystemRedirectUrl(response.redirectUrl)) {
        // Gift Card: use BE redirect as-is (SSO token URL must not be rewritten).
        // Membership: keep token URL pathname, inject returnUrl → issue-digital?type=membership.
        const finalUrl = destination === 'membership-card'
          ? applyDeepLinkToRedirectUrl(response.redirectUrl, path)
          : response.redirectUrl
        navigateOpenedTab(newTab, finalUrl)
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
      setOpeningDestination(null)
    }
  }, [showToast, status, t])

  return {
    openProductManagement,
    isOpeningProductManagement: openingDestination !== null,
    openingProductManagementDestination: openingDestination,
  }
}
