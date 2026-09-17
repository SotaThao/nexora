// StaffPay — staff self-managed payout methods (owner cannot edit these).
import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bitcoin, Edit2, Wallet, ArrowRight, AlertCircle, Loader2, Eye } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  useStaffPaymentMethods,
  useUpdateStaffPaymentMethod,
  useToggleStaffPaymentMethod
} from '../../../data/hooks/useStaffPaymentMethods'
import { useStaffProfile } from '../../../data/hooks/useStaffSelf'
import { useCreateStaffProfile, useProfileSettings } from '../../../data/hooks/useProfileSettings'
import type { PaymentMethodDto } from '../../../types/domain'
import { SkeletonLayout } from '../../ui/skeleton'
import PayoutSetupModal from '../../payout/PayoutSetupModal'
import ToggleSwitch from '../../ui/ToggleSwitch'
import { formatPaymentMethodAccountDisplay } from '../../payout/bankWireAccount'
import {
  isHiddenPayoutConfigType,
  isPaymentMethodConfigured,
  supportsPayoutAccountName,
  toPayoutAccountNameDto,
} from '../../../data/paymentMethodTypes'
import {
  parseVlinkpayAddresses,
  parseVlinkpayAddressesFromMethod,
  serializeVlinkpayAddresses,
  toVlinkpayCryptoAddressesPayload,
  toVlinkpayCryptoAddressImagesPayload,
  type VlinkpayImagePendingMap,
} from '../../payout/vlinkpayWallet'
import { PayoutUiKey } from '../../../data/payoutUiKeys'
import { getUserProfileImageUrl } from '../../../utils/userProfileImage'
import { useQueryClient } from '@tanstack/react-query'
import { qk } from '../../../data/queryKeys'
import PayoutMethodDetailModal from '../../payout/PayoutMethodDetailModal'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const PayoutLogos = {
  zelle: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletZelle" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.559 24h-2.841a.483.483 0 0 1-.483-.483v-2.765H5.638a.667.667 0 0 1-.666-.666v-2.234a.67.67 0 0 1 .142-.412l8.139-10.382h-7.25a.667.667 0 0 1-.667-.667V3.914c0-.367.299-.666.666-.666h4.23V.483c0-.266.217-.483.483-.483h2.841c.266 0 .483.217.483.483v2.765h4.323c.367 0 .666.299.666.666v2.137a.67.67 0 0 1-.141.41l-8.19 10.481h7.665c.367 0 .666.299.666.666v2.477a.667.667 0 0 1-.666.667h-4.32v2.765a.483.483 0 0 1-.483.483Z" />
    </svg>
  ),
  bankwire: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-slate-600" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L1 7v2h22V7L12 2zm0 18H3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h3v-8h3v8h-3zm-11 2h22v2H1v-2z" />
    </svg>
  ),
  paypal: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletPaypal" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.09 6.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H6.22c-.65 0-1.13-.59-.99-1.22L8.53 5.4c.14-.63.7-.1 1.33-.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" />
      <path d="M16.92 3.85c-.45 2.24-1.93 7.82-2.18 8.87-.24 1.05-1.12 1.77-2.22 1.77h-3.32l-.96 6.02c-.08.5-.52.87-1.03.87H3.06c-.65 0-1.13-.59-.99-1.22L5.37 2.4c.14-.63.7-1.1 1.33-1.1h5.8c2.81 0 4.88 1.48 4.43 3.7.22-1.07.13-2.15-.36-3.05z" opacity="0.6" />
    </svg>
  ),
  venmo: (
    <svg viewBox="0 0 448 512" className="h-[18px] w-[18px] fill-walletVenmo" xmlns="http://www.w3.org/2000/svg">
      <path d="M381.4 105.3c11 18.1 15.9 36.7 15.9 60.3 0 75.1-64.1 172.7-116.2 241.2h-118.8l-47.6-285 104.1-9.9 25.3 202.8c23.5-38.4 52.6-98.7 52.6-139.7 0-22.5-3.9-37.8-9.9-50.4z" />
    </svg>
  ),
  cashapp: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-walletCashapp" xmlns="http://www.w3.org/2000/svg">
      <path d="M23.59 3.475a5.1 5.1 0 00-3.05-3.05c-1.31-.42-2.5-.42-4.92-.42H8.36c-2.4 0-3.61 0-4.9.4a5.1 5.1 0 00-3.05 3.06C0 4.765 0 5.965 0 8.365v7.27c0 2.41 0 3.6.4 4.9a5.1 5.1 0 003.05 3.05c1.3.41 2.5.41 4.9.41h7.28c2.41 0 3.61 0 4.9-.4a5.1 5.1 0 003.06-3.06c.41-1.3.41-2.5.41-4.9v-7.25c0-2.41 0-3.61-.41-4.91zm-6.17 4.63l-.93.93a.5.5 0 01-.67.01 5 5 0 00-3.22-1.18c-.97 0-1.94.32-1.94 1.21 0 .9 1.04 1.2 2.24 1.65 2.1.7 3.84 1.58 3.84 3.64 0 2.24-1.74 3.78-4.58 3.95l-.26 1.2a.49.49 0 01-.48.39H9.63l-.09-.01a.5.5 0 01-.38-.59l.28-1.27a6.54 6.54 0 01-2.88-1.57v-.01a.48.48 0 010-.68l1-.97a.49.49 0 01.67 0c.91.86 2.13 1.34 3.39 1.32c1.3 0 2.17-.55 2.17-1.42 0-.87-.88-1.1-2.54-1.72-1.76-.63-3.43-1.52-3.43-3.6 0-2.42 2.01-3.6 4.39-3.71l.25-1.23a.48.48 0 01.48-.38h1.78l.1.01c.26.06.43.31.37.57l-.27 1.37c.9.3 1.75.77 2.48 1.39l.02.02c.19.2.19.5 0 .68z" />
    </svg>
  ),
  applecash: (
    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-black" xmlns="http://www.w3.org/2000/svg">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83zM15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.73-1.16 1.87-1.02 2.98 1.11.09 2.25-.56 2.97-1.43z" />
    </svg>
  ),
  vlinkpay: (
    <img src="/assets/vlinkpay-logo.png" alt="VLINKPAY Logo" className="h-[18px] w-[18px] object-contain shrink-0" />
  ),
  crypto: (
    <Bitcoin className="h-[18px] w-[18px] text-amber-500 shrink-0" />
  )
}

export default function StaffPay() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const {
    data: apiPaymentMethods = [],
    isPending,
    isFetching,
  } = useStaffPaymentMethods()
  const {
    data: staffProfile,
    isPending: isProfilePending,
    isFetching: isProfileFetching,
  } = useStaffProfile()
  const { data: userProfile } = useProfileSettings()
  const createStaffProfileMutation = useCreateStaffProfile()
  const toggleMutation = useToggleStaffPaymentMethod()
  const updateMutation = useUpdateStaffPaymentMethod()

  const [activeMethod, setActiveMethod] = useState<PaymentMethodDto | null>(null)
  const [viewingMethod, setViewingMethod] = useState<PaymentMethodDto | null>(null)

  const visiblePaymentMethods = useMemo(
    () => apiPaymentMethods.filter((method) => !isHiddenPayoutConfigType(method)),
    [apiPaymentMethods],
  )

  const isLoading = isPending || isFetching || isProfilePending || isProfileFetching
  const isKYCVerified =
    userProfile?.isKYCVerified === true || userProfile?.isKycVerified === true

  // Case 1: no staff profile yet (GET /api/v1/staff/profile → 404). Methods are
  // only seeded on profile creation, so send the user through onboarding first
  // — unless KYC is already verified, in which case we unlock payment setup
  // directly on this screen.
  const profileMissing = staffProfile === null
  // Case 2: profile + seeded methods exist, but none is activated & configured.
  const hasUnconfiguredPayout =
    visiblePaymentMethods.length > 0 &&
    !visiblePaymentMethods.some(
      (method) => method.isActive && isPaymentMethodConfigured(method),
    )

  const isMethodSetUp = (method: PaymentMethodDto) => isPaymentMethodConfigured(method)

  const handleToggleMethod = (method: PaymentMethodDto, nextActive: boolean) => {
    if (!method.id) return

    if (!nextActive) {
      toggleMutation.mutate(method.id)
      return
    }

    if (!isMethodSetUp(method)) {
      setActiveMethod(method)
      return
    }

    toggleMutation.mutate(method.id)
  }

  const handleEditPayout = (method: PaymentMethodDto) => {
    setActiveMethod(method)
  }

  const handleCloseModal = () => {
    setActiveMethod(null)
  }

  const handleSavePayout = (
    value,
    qrCode,
    accountName,
    qrFile,
    vlinkpayImages?: VlinkpayImagePendingMap,
  ) => {
    if (!activeMethod?.id) return
    const uiKey = activeMethod.uiKey || ''
    const isVlinkpay = uiKey === PayoutUiKey.VlinkPay
    const cryptoAddresses = isVlinkpay
      ? toVlinkpayCryptoAddressesPayload(parseVlinkpayAddresses(value))
      : undefined
    updateMutation.mutate(
      {
        id: activeMethod.id,
        ...(isVlinkpay
          ? { accountInfo: null, cryptoAddresses }
          : { accountInfo: value.trim() }),
        accountName: toPayoutAccountNameDto(uiKey, accountName),
        imageUrl: qrFile ? null : (qrCode || null),
        imageFile: qrFile || undefined,
        cryptoAddressImages: isVlinkpay && vlinkpayImages
          ? toVlinkpayCryptoAddressImagesPayload(vlinkpayImages)
          : undefined,
      },
      {
        onSuccess: () => {
          setActiveMethod(null)
          if (!activeMethod.isActive) {
            toggleMutation.mutate({ id: activeMethod.id!, silentSuccessToast: true })
          }
        },
      },
    )
  }

  const handleEmptySetupClick = async () => {
    if (!isKYCVerified) {
      navigate('/onboarding')
      return
    }

    const firstName = String(userProfile?.firstName || '').trim()
    const lastName = String(userProfile?.lastName || '').trim()
    const fullName = `${firstName} ${lastName}`.trim()
      || String(userProfile?.fullName || '').trim()
    const displayName =
      String(userProfile?.nickname || '').trim()
      || fullName
      || String(userProfile?.email || '').split('@')[0]
      || 'Staff'
    const phone = String(userProfile?.phoneNumber || userProfile?.phone || '').trim()
    const photoUrl = getUserProfileImageUrl(userProfile) || undefined

    try {
      await createStaffProfileMutation.mutateAsync({
        displayName,
        firstName: firstName || displayName.split(' ')[0] || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        photoUrl,
      })
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: qk.staffProfile() }),
        queryClient.invalidateQueries({ queryKey: qk.staffPaymentMethods() }),
      ])
    } catch {
      // Mutation toast/error handling is owned by the hook caller context;
      // keep the empty-state CTA available for retry.
    }
  }

  if (isLoading || createStaffProfileMutation.isPending) {
    return (
      <SkeletonLayout
        blocks={[
          {
            type: 'panel',
            rows: 5,
            listProps: { showAction: true, lines: 2 },
          },
        ]}
      />
    )
  }

  return (
    <div className="space-y-4">
      <section className={panel}>
        <p className="text-xs text-nexoraMuted">{t('staff_dashboard.pay.owner_note')}</p>

        {profileMissing ? (
          <div className="mt-4 flex flex-col items-center gap-3 py-8 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-nexoraBrand/10">
              <Wallet className="h-6 w-6 text-nexoraBrand" />
            </span>
            <p className="text-sm font-semibold text-nexoraText">
              {t('staff_dashboard.pay.empty')}
            </p>
            <p className="max-w-xs text-nexoraSubtle text-[13px] font-normal leading-5">
              {t(
                isKYCVerified
                  ? 'staff_dashboard.pay.empty_hint_payment'
                  : 'staff_dashboard.pay.empty_hint',
              )}
            </p>
            <button
              type="button"
              onClick={() => void handleEmptySetupClick()}
              disabled={createStaffProfileMutation.isPending}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-nexoraBrand px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-nexoraBrand/25 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {createStaffProfileMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : null}
              <span>{t('staff_dashboard.pay.empty_cta')}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ) : visiblePaymentMethods.length === 0 ? (
          <p className="mt-4 py-6 text-center text-xs text-nexoraSubtle">
            {t('staff_dashboard.pay.empty')}
          </p>
        ) : (
          <div className="mt-4">
            {hasUnconfiguredPayout && (
              <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <p className="text-amber-700 text-[13px] font-normal leading-5">{t('staff_dashboard.pay.setup_hint')}</p>
              </div>
            )}
            <div className="divide-y divide-nexoraBorder">
              {visiblePaymentMethods.map((method) => {
              const uiKey = method.uiKey || ''
              const label = method.name || method.type
              return (
                <div key={method.id} className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
                    <ToggleSwitch
                      checked={!!method.isActive}
                      onChange={() => handleToggleMethod(method, !method.isActive)}
                      ariaLabel={`Toggle ${label}`}
                      activeColor="bg-emerald-500"
                      inactiveColor="bg-nexoraBorder"
                    />

                    <div className="flex min-w-0 flex-1 items-center gap-2.5">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas">
                        {PayoutLogos[uiKey] || <Bitcoin className="h-[18px] w-[18px] shrink-0 text-amber-500" />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-nexoraText">{label}</div>
                        {isPaymentMethodConfigured(method) ? (
                          <div className="mt-0.5 min-w-0 truncate font-mono text-xs text-nexoraMuted">
                            {supportsPayoutAccountName(uiKey) && method.accountName ? (
                              <span className="font-sans font-semibold">{method.accountName} · </span>
                            ) : null}
                            {formatPaymentMethodAccountDisplay(
                              method.uiKey || '',
                              method.accountInfo,
                              method.cryptoAddresses,
                            )}
                          </div>
                        ) : (
                          <div className="mt-0.5 text-xs font-medium italic text-slate-300">
                            {t('staff_dashboard.pay.not_set')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 sm:ml-2 sm:flex sm:w-auto sm:shrink-0 sm:items-center sm:gap-1.5">
                    <button
                      type="button"
                      onClick={() => setViewingMethod(method)}
                      aria-label={`View ${label} Payout Details`}
                      className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-xs font-semibold text-sky-700 transition hover:text-sky-800"
                    >
                      <Eye className="h-3 w-3" />
                      <span className="truncate">{t('components.staff_dashboard.views.StaffPay.view')}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEditPayout(method)}
                      aria-label={`Edit ${label} Payout Account`}
                      className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-xs font-semibold text-amber-700 transition hover:text-amber-800"
                    >
                      <Edit2 className="h-3 w-3" />
                      <span className="truncate">{t('components.staff_dashboard.views.StaffPay.editAccount')}</span>
                    </button>
                  </div>
                </div>
              )
            })}
            </div>
          </div>
        )}
      </section>

      {activeMethod?.uiKey && (
        <PayoutSetupModal
        className="[&_button]:text-xs [&_button]:font-semibold [&_button_span]:text-xs [&_button_span]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_h3]:normal-case [&_h3]:tracking-normal [&_h3]:leading-snug"
          open={Boolean(activeMethod)}
          walletKey={activeMethod.uiKey}
          initialAccountName={activeMethod.accountName || ''}
          initialValue={
            activeMethod.uiKey === PayoutUiKey.VlinkPay
              ? serializeVlinkpayAddresses(parseVlinkpayAddressesFromMethod(activeMethod))
              : (activeMethod.accountInfo || '')
          }
          initialQrCode={activeMethod.imageUrl || ''}
          initialCryptoAddresses={activeMethod.uiKey === PayoutUiKey.VlinkPay ? activeMethod.cryptoAddresses : null}
          onClose={handleCloseModal}
          onSubmit={handleSavePayout}
          readOnly={false}
          isSaving={updateMutation.isPending}
        />
      )}

      <PayoutMethodDetailModal
        className="[&_button]:text-xs [&_button]:font-semibold [&_button_span]:text-xs [&_button_span]:font-semibold [&_h3]:text-base [&_h3]:font-semibold [&_h3]:normal-case [&_h3]:tracking-normal [&_h3]:leading-snug"
        method={viewingMethod}
        logo={viewingMethod ? PayoutLogos[viewingMethod.uiKey || ''] : null}
        onClose={() => setViewingMethod(null)}
      />
    </div>
  )
}
