import { useState } from 'react'
import { Edit2, Eye, Wallet } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import {
  useMerchantPaymentMethods,
  useToggleMerchantPaymentMethod,
  useUpdateMerchantPaymentMethod,
} from '../../data/hooks/useMerchantPaymentMethods'
import {
  getPaymentMethodDisplayName,
  isHiddenPayoutConfigType,
  payoutTypeToUiKey,
  supportsPayoutAccountName,
  toPayoutAccountNameDto,
} from '../../data/paymentMethodTypes'
import type { PaymentMethodDto } from '../../types/domain'
import { WalletLogos } from '../dashboard/constants'
import ToggleSwitch from '../ui/ToggleSwitch'
import { formatPaymentMethodAccountDisplay } from './bankWireAccount'
import PayoutMethodDetailModal from './PayoutMethodDetailModal'
import PayoutSetupModal from './PayoutSetupModal'

interface MerchantPayoutMethodsPanelProps {
  className?: string
}

const getMethodUiKey = (method: PaymentMethodDto) =>
  method.uiKey || payoutTypeToUiKey(method.type || '')

function PayoutMethodLogo({ method }: { method: PaymentMethodDto }) {
  const uiKey = getMethodUiKey(method)
  const label = method.name || getPaymentMethodDisplayName(method.type || '')
  const logo = WalletLogos[uiKey as keyof typeof WalletLogos]

  return (
    <span
      role="img"
      aria-label={`${label} logo`}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas text-[10px] font-black uppercase text-nexoraBrand"
    >
      <span aria-hidden="true" className="flex items-center justify-center">
        {logo || label.slice(0, 2)}
      </span>
    </span>
  )
}

export default function MerchantPayoutMethodsPanel({
  className = '',
}: MerchantPayoutMethodsPanelProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const { data: paymentMethods = [] } = useMerchantPaymentMethods()
  const toggleMutation = useToggleMerchantPaymentMethod()
  const updateMutation = useUpdateMerchantPaymentMethod()
  const [viewingMethod, setViewingMethod] = useState<PaymentMethodDto | null>(null)
  const [editingMethod, setEditingMethod] = useState<string | null>(null)

  const displayedPaymentMethods = paymentMethods.filter(
    (method) =>
      getMethodUiKey(method) !== 'bankwire' && !isHiddenPayoutConfigType(method),
  )

  const getMethod = (key: string): PaymentMethodDto =>
    paymentMethods.find((method) => getMethodUiKey(method) === key) || {
      type: key,
      isActive: false,
      isConfigured: false,
      accountInfo: '',
      id: undefined,
      imageUrl: null,
      accountName: null,
    }

  const handleEdit = (key: string) => setEditingMethod(key)

  const handleToggle = (key: string, isCurrentlyActive: boolean) => {
    const method = getMethod(key)
    const nextActive = !isCurrentlyActive

    if (nextActive && !(method.isConfigured && method.accountInfo?.trim())) {
      handleEdit(key)
      return
    }

    if (!method.id) {
      showToast(t('components.settings.tabs.ProfileTab.methodNotConfigured'), 'error')
      return
    }

    toggleMutation.mutate(method.id)
  }

  const handleSave = (
    value: string,
    qrCode: string,
    accountName: string,
    qrFile?: File | null,
  ) => {
    if (!editingMethod) return
    const method = getMethod(editingMethod)

    if (!method.id) {
      showToast(t('components.settings.tabs.ProfileTab.methodIdMissing'), 'error')
      return
    }

    updateMutation.mutate(
      {
        id: method.id,
        accountInfo: value.trim(),
        accountName: toPayoutAccountNameDto(editingMethod, accountName),
        imageUrl: qrFile ? null : qrCode || null,
        imageFile: qrFile || undefined,
      },
      {
        onSuccess: () => {
          setEditingMethod(null)
          if (!method.isActive) {
            toggleMutation.mutate({ id: method.id, silentSuccessToast: true })
          }
        },
      },
    )
  }

  const editingMethodData = editingMethod ? getMethod(editingMethod) : null

  return (
    <>
      <div
        className={`rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-6 ${className}`}
      >
        <div className="mb-4 flex items-center gap-2 border-b border-nexoraRule pb-3">
          <Wallet className="h-4 w-4 text-nexoraBrand" />
          <h3 className="text-xs font-black uppercase tracking-wider text-nexoraText">
            {t('components.settings.tabs.ProfileTab.payoutMethods')}
          </h3>
        </div>

        <div className="space-y-2">
          {displayedPaymentMethods.map((method) => {
            const uiKey = getMethodUiKey(method)
            const label = method.name || getPaymentMethodDisplayName(method.type || '')
            const accountDisplay = formatPaymentMethodAccountDisplay(
              uiKey,
              method.accountInfo,
            )

            return (
              <div
                key={method.id || uiKey}
                className="flex flex-col gap-3 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex w-full min-w-0 items-center gap-3 sm:flex-1">
                  <ToggleSwitch
                    checked={Boolean(method.isActive)}
                    onChange={() => handleToggle(uiKey, Boolean(method.isActive))}
                    ariaLabel={`Toggle ${label}`}
                    activeColor="bg-amber-600"
                    inactiveColor="bg-slate-200"
                  />

                  <div className="flex min-w-0 flex-1 items-center gap-2.5">
                    <PayoutMethodLogo method={method} />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-nexoraText">{label}</div>
                      {method.isConfigured ? (
                        <div className="mt-0.5 max-w-full truncate font-mono text-[10px] text-nexoraMuted sm:max-w-[220px]">
                          {supportsPayoutAccountName(uiKey) && method.accountName ? (
                            <span className="font-sans font-semibold">
                              {method.accountName} ·{' '}
                            </span>
                          ) : null}
                          {accountDisplay}
                        </div>
                      ) : (
                        <div className="mt-0.5 text-[10px] font-medium italic text-nexoraSubtle">
                          {t('components.settings.tabs.ProfileTab.notConfigured')}
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
                    className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] font-bold text-sky-700 transition hover:text-sky-800"
                  >
                    <Eye className="h-3 w-3" />
                    <span className="truncate">
                      {t('components.settings.tabs.ProfileTab.view')}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleEdit(uiKey)}
                    aria-label={`Edit ${label} Payout Account`}
                    className="flex min-w-0 items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-amber-700 transition hover:text-amber-800"
                  >
                    <Edit2 className="h-3 w-3" />
                    <span className="truncate">
                      {t('components.settings.tabs.ProfileTab.payoutAccount')}
                    </span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <PayoutMethodDetailModal
        method={viewingMethod}
        logo={viewingMethod ? <PayoutMethodLogo method={viewingMethod} /> : null}
        onClose={() => setViewingMethod(null)}
      />

      <PayoutSetupModal
        open={Boolean(editingMethod)}
        walletKey={editingMethod || ''}
        initialValue={editingMethodData?.accountInfo || ''}
        initialQrCode={editingMethodData?.imageUrl || ''}
        initialAccountName={editingMethodData?.accountName || ''}
        onClose={() => setEditingMethod(null)}
        onSubmit={handleSave}
        isSaving={updateMutation.isPending}
      />
    </>
  )
}
