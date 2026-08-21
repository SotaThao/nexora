import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  DASHBOARD_SETTINGS_QUERY_TAB,
  buildDashboardSettingsQueryPath,
} from '../dashboard/constants'
import MerchantPayoutMethodsPanel from '../payout/MerchantPayoutMethodsPanel'
import SettingsTipQrPanel from '../settings/SettingsTipQrPanel'

export default function ReceivePaymentsQrContent({
  businessName = '',
}: {
  businessName?: string
}) {
  const navigate = useNavigate()
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = useCallback(async (text: string, id: string) => {
    if (!text) return

    try {
      await navigator.clipboard.writeText(text)
      setCopiedId(id)
      showToast(t('components.settings.tabs.ProfileTab.copied'), 'success')
      window.setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showToast(t('components.dashboard.overview.Overview.copy_failed'), 'error')
    }
  }, [showToast, t])

  return (
    <div className="space-y-4">
      <p className="text-xs leading-relaxed text-nexoraMuted">
        {t('dashboard.touchpoints.stations_sections.payment_desc')}
      </p>
      <section className="rounded-flox-cards border border-nexoraBorder bg-white p-4 shadow-premium dark:border-luxuryGold/18 dark:bg-luxuryCoal sm:p-6">
        <SettingsTipQrPanel
          variant="compact"
          businessName={businessName}
          showToast={showToast}
          handleCopy={handleCopy}
          copiedId={copiedId}
          t={t}
          onConfigurePayoutMethods={() =>
            navigate(
              buildDashboardSettingsQueryPath(
                DASHBOARD_SETTINGS_QUERY_TAB.payout,
              ),
            )
          }
        />
      </section>
      <MerchantPayoutMethodsPanel />
    </div>
  )
}
