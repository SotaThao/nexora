import { Link } from 'react-router-dom'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useMerchantVoiceTenantStatus } from '../../../../data/hooks/useMerchantVoiceBookings'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { getApiErrorCode } from '../../../../types/domain'
import { packageManagementPath } from '../../constants'
import CreditsUsagePanel from '../CreditsUsagePanel'
import { BookingCreditsUsageSkeleton } from '../BookingHubSkeletons'
import { BookingHubVoiceProvider } from '../BookingHubVoiceContext'
import { PACKAGE_MANAGEMENT_TAB_QUERY, PACKAGE_MANAGEMENT_TK, PackageManagementTab } from './constants'

export default function PackageCreditsPanel() {
  const { t } = useTranslation()
  const { data: tenantStatus, isLoading, isError, error, refetch } = useMerchantVoiceTenantStatus()

  return (
    <div className="package-plan-content booking-hub-view">
      {isLoading ? (
        <BookingCreditsUsageSkeleton />
      ) : isError ? (
        <div className="booking-empty-cell" role="alert">
          <p>{t(getErrorI18nKey(getApiErrorCode(error)))}</p>
          <button className="booking-mini-button" type="button" onClick={() => void refetch()}>
            {t(`${PACKAGE_MANAGEMENT_TK}.credits.retry`)}
          </button>
        </div>
      ) : tenantStatus?.hasVoiceTenant ? (
        <BookingHubVoiceProvider enabled>
          <CreditsUsagePanel queryOptions={PACKAGE_MANAGEMENT_TAB_QUERY} />
        </BookingHubVoiceProvider>
      ) : (
        <div className="booking-empty-cell">
          <p>{t(`${PACKAGE_MANAGEMENT_TK}.credits.setupRequired`)}</p>
          <Link className="booking-mini-button" to={packageManagementPath(PackageManagementTab.AiVoice)}>
            {t(`${PACKAGE_MANAGEMENT_TK}.tabs.aiVoice`)}
          </Link>
        </div>
      )}
    </div>
  )
}
