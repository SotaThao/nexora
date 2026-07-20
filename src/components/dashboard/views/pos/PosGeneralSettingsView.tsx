// PosGeneralSettingsView — lets the Owner view/update the salon's Business
// Information from inside the POS section, without leaving it to go to the
// general Settings page. Reuses BusinessInfoCard/useBusinessInfoForm so this
// is the same data and save logic as Settings > Profile > Business Information.
import type { FormEvent } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useMerchantSetup } from '../../../../data/hooks/useMerchantSetup'
import useBusinessInfoForm from '../../../settings/hooks/useBusinessInfoForm'
import BusinessInfoCard from '../../../settings/BusinessInfoCard'

export default function PosGeneralSettingsView({ verificationStatus }: { verificationStatus?: string }) {
  const { t } = useTranslation()
  const { data: setupData } = useMerchantSetup()
  const businessInfoForm = useBusinessInfoForm({ setupData, verificationStatus })

  const saveBusiness = (e: FormEvent) => {
    businessInfoForm.saveBusiness(e)
  }

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-base font-semibold leading-tight text-nexoraText">
          {t('dashboard.menu.pos_settings')}
        </h1>
        <p className="text-xs text-nexoraMuted">
          {t('components.dashboard.views.pos.PosGeneralSettingsView.description')}
        </p>
      </section>

      <div className="grid grid-cols-1 gap-6">
        <BusinessInfoCard
          businessName={businessInfoForm.businessInfo.businessName}
          businessPhone={businessInfoForm.businessInfo.businessPhone}
          businessEmail={businessInfoForm.businessInfo.businessEmail}
          businessWebsite={businessInfoForm.businessInfo.businessWebsite}
          bookingNotificationPhone={businessInfoForm.businessInfo.bookingNotificationPhone}
          salesTaxRatePercent={businessInfoForm.businessInfo.salesTaxRatePercent}
          logoUrl={businessInfoForm.logoUrl}
          onLogoChange={businessInfoForm.handleLogoChange}
          isUploadingLogo={businessInfoForm.isUploadingLogo}
          isEditingBusiness={businessInfoForm.isEditingBusiness}
          setIsEditingBusiness={businessInfoForm.setIsEditingBusiness}
          businessForm={businessInfoForm.businessForm}
          setBusinessForm={businessInfoForm.setBusinessForm}
          businessErrors={businessInfoForm.businessErrors}
          setBusinessErrors={businessInfoForm.setBusinessErrors}
          canEdit={businessInfoForm.canEditProfile}
          startEditBusiness={businessInfoForm.startEditBusiness}
          saveBusiness={saveBusiness}
        />
      </div>
    </div>
  )
}
