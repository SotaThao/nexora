import { useEffect, useMemo, useState } from 'react'
import { Edit2, Eye, HelpCircle, Loader2, Plus, Upload } from 'lucide-react'
import CountryCodeSelect, {
  formatNationalNumber,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { renderLabel } from '../../../utils/renderLabel'
import { WalletLogos } from '../constants'
import ToggleSwitch from '../../ui/ToggleSwitch'
import {
  buildPaymentMethodFromPayoutConfig,
  EMPTY_STAFF_PAYOUT_CONFIG,
  isPaymentMethodConfigured,
  orderedStaffPayoutUiKeysFromSupported,
  PAYOUT_UI_LABELS,
  STAFF_CONFIGURABLE_PAYOUT_UI_KEYS,
  supportsPayoutAccountName,
} from '../../../data/paymentMethodTypes'
import { useSupportedPaymentMethods } from '../../../data/hooks/useSupportedPaymentMethods'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getStaffDisplayNameErrorCode } from '../../../utils/staffDisplayName'
import { isValidEmail } from '../../../utils/validation'
import type { PaymentMethodDto } from '../../../types/domain'
import { formatPaymentMethodAccountDisplay } from '../../payout/bankWireAccount'
import PayoutMethodDetailModal from '../../payout/PayoutMethodDetailModal'
import PayoutSetupModal from './PayoutSetupModal'

type PayoutConfig = {
  enabled: boolean
  value: string
  qrCode: string
  accountName: string
  qrFile?: File | null
}

type PayoutConfigMap = Record<string, PayoutConfig>

export type ManualStaffFormPayload = {
  fullName: string
  displayNickname: string
  position: string
  phone: string
  phoneNumber: string | null
  email: string
  photoUrl: string | null
  avatarFile: File | null
  payoutConfigs: PayoutConfigMap
}

type AddManualStaffTabProps = {
  open: boolean
  onCancel: () => void
  onSave?: (payload: ManualStaffFormPayload, options?: { onSuccess?: () => void }) => void
  isSaving?: boolean
}

function createEmptyPayoutConfigs(keys: readonly string[]): PayoutConfigMap {
  return Object.fromEntries(
    keys.map((key) => [
      key,
      { enabled: false, value: '', qrCode: '', accountName: '' },
    ]),
  )
}

const DEFAULT_ROLE = 'Nail Technician'

function AddManualStaffTab({
  open,
  onCancel,
  onSave,
  isSaving = false,
}: AddManualStaffTabProps) {
  const { t } = useTranslation()
  const defaultDialCode = PhoneDialCode.US
  const { data: supportedPaymentMethods = [] } = useSupportedPaymentMethods({ enabled: open })

  const manualStaffPayoutKeys = useMemo(
    () => orderedStaffPayoutUiKeysFromSupported(supportedPaymentMethods),
    [supportedPaymentMethods],
  )

  const [fullName, setFullName] = useState('')
  const [displayNickname, setDisplayNickname] = useState('')
  const [position, setPosition] = useState(DEFAULT_ROLE)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dialCode, setDialCode] = useState(defaultDialCode)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [payoutConfigs, setPayoutConfigs] = useState<PayoutConfigMap>(() =>
    createEmptyPayoutConfigs(STAFF_CONFIGURABLE_PAYOUT_UI_KEYS),
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [editingWalletKey, setEditingWalletKey] = useState<string | null>(null)
  const [viewingMethod, setViewingMethod] = useState<PaymentMethodDto | null>(null)

  const phoneParsed = parsePhone(
    phone.trim().startsWith('+') ? phone : `${dialCode}${phone.replace(/\D/g, '')}`,
  )

  useEffect(() => {
    if (!open) return
    setFullName('')
    setDisplayNickname('')
    setPosition(DEFAULT_ROLE)
    setPhone('')
    setEmail('')
    setDialCode(defaultDialCode)
    setAvatarPreview(null)
    setAvatarFile(null)
    setPayoutConfigs(createEmptyPayoutConfigs(manualStaffPayoutKeys))
    setErrors({})
    setEditingWalletKey(null)
    setViewingMethod(null)
    // Only reset when the modal opens — not when payment-method order arrives from API.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: avoid wiping form when keys update
  }, [open, defaultDialCode])

  useEffect(() => {
    if (!open) return
    setPayoutConfigs((prev) => {
      const next = { ...prev }
      let changed = false
      for (const key of manualStaffPayoutKeys) {
        if (!next[key]) {
          next[key] = { enabled: false, value: '', qrCode: '', accountName: '' }
          changed = true
        }
      }
      return changed ? next : prev
    })
  }, [open, manualStaffPayoutKeys])

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const fieldLabelClass = 'text-[10px] font-extrabold uppercase text-nexoraMuted'
  const fieldErrorClass = 'mt-1 text-[10px] font-bold text-nexoraDanger'
  const inputClass = (hasError: boolean, extra = '') =>
    `mt-1 h-10 w-full rounded-lg border px-3 text-sm font-semibold text-nexoraText outline-none transition ${extra} ${
      hasError
        ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20'
        : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
    }`

  const clearError = (field: string) => {
    setErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const resolveDisplayNameError = (value: string) => {
    const errorCode = getStaffDisplayNameErrorCode(value)
    return errorCode ? t(getErrorI18nKey(errorCode)) : ''
  }

  const handleAvatarPick = (file: File) => {
    if (avatarPreview?.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview)
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleToggleWallet = (walletKey: string) => {
    const config = payoutConfigs[walletKey] || { enabled: false, value: '', qrCode: '', accountName: '' }
    if (!config.enabled && !config.value.trim()) {
      setEditingWalletKey(walletKey)
      return
    }
    setPayoutConfigs((prev) => {
      const current = prev[walletKey] || { enabled: false, value: '', qrCode: '', accountName: '' }
      return {
        ...prev,
        [walletKey]: { ...current, enabled: !current.enabled },
      }
    })
  }

  const handlePayoutSubmit = (value: string, qrCode: string, accountName: string, qrFile?: File | null) => {
    if (!editingWalletKey) return
    setPayoutConfigs((prev) => ({
      ...prev,
      [editingWalletKey]: {
        enabled: true,
        value: value.trim(),
        qrCode: qrCode || '',
        accountName: accountName || '',
        qrFile: qrFile || null,
      },
    }))
    setEditingWalletKey(null)
  }

  const handleSave = (event: { preventDefault: () => void }) => {
    event.preventDefault()
    const nextErrors: Record<string, string> = {}

    const fullNameError = resolveDisplayNameError(fullName)
    if (fullNameError) nextErrors.fullName = fullNameError

    const nicknameError = resolveDisplayNameError(displayNickname)
    if (nicknameError) nextErrors.displayNickname = nicknameError

    const phoneNumber = normalizePhoneE164(phone, dialCode)
    if (phoneNumber && !isValidPhoneE164(phoneNumber, dialCode)) {
      nextErrors.phone = t('setup.errors.staff_phone_invalid')
    }
    if (email.trim() && !isValidEmail(email.trim())) {
      nextErrors.email = t('setup.errors.staff_email_invalid')
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    setErrors({})
    onSave?.(
      {
        fullName: fullName.trim(),
        displayNickname: displayNickname.trim(),
        position: position.trim(),
        phone: phone.trim(),
        phoneNumber: phoneNumber || null,
        email: email.trim(),
        photoUrl: avatarPreview,
        avatarFile,
        payoutConfigs,
      },
      { onSuccess: onCancel },
    )
  }

  const avatarInitial = (displayNickname || fullName || 'N').charAt(0).toUpperCase()
  const editingConfig = editingWalletKey ? payoutConfigs[editingWalletKey] : null

  return (
    <>
      <form className="mt-5" onSubmit={handleSave}>
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div className="space-y-4">
            <div>
              <label className={fieldLabelClass}>{t('setup.staff_avatar')}</label>
              <div className="mt-2 flex items-center gap-4">
                {avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt=""
                    className="h-16 w-16 rounded-full object-cover ring-1 ring-nexoraBorder"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-nexoraCanvas text-lg font-extrabold text-nexoraBrand ring-1 ring-nexoraBorder">
                    {avatarInitial}
                  </div>
                )}
                <label className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder px-3 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas">
                  <Upload className="h-4 w-4 text-nexoraBrand" />
                  {t('common.upload_photo')}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) handleAvatarPick(file)
                      event.target.value = ''
                    }}
                  />
                </label>
              </div>
            </div>

            <div>
              <label className={fieldLabelClass}>
                {renderLabel(t('setup.staff_fullname'))}
              </label>
              <input
                className={inputClass(Boolean(errors.fullName))}
                value={fullName}
                onChange={(event) => {
                  const nextValue = event.target.value
                  setFullName(nextValue)
                  clearError('fullName')
                  if (!displayNickname && nextValue.trim()) {
                    const first = nextValue.trim().split(' ')[0]
                    setDisplayNickname(first ? `${first}.` : '')
                  }
                }}
                placeholder={t('components.dashboard.modals.AddStaffModal.manual_full_name_placeholder')}
              />
              {errors.fullName && <p className={fieldErrorClass}>{errors.fullName}</p>}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
              <div className="min-w-0">
                <label className={`flex h-4 items-center gap-1 ${fieldLabelClass}`}>
                  <span>{renderLabel(t('setup.staff_displayname'))}</span>
                  <div className="group relative inline-block font-normal normal-case text-nexoraSubtle">
                    <HelpCircle className="h-3.5 w-3.5 cursor-help transition-colors hover:text-nexoraBrand" />
                    <div className="absolute bottom-full left-1/2 z-50 mb-2 hidden w-48 -translate-x-1/2 rounded-lg bg-black p-2.5 text-center text-[10px] leading-normal text-white shadow-xl group-hover:block">
                      {t('setup.nickname_tooltip')}
                      <div className="absolute left-1/2 top-full -mt-1.5 -translate-x-1/2 border-4 border-transparent border-t-black" />
                    </div>
                  </div>
                </label>
                <input
                  className={`min-w-0 ${inputClass(Boolean(errors.displayNickname))}`}
                  value={displayNickname}
                  onChange={(event) => {
                    setDisplayNickname(event.target.value)
                    clearError('displayNickname')
                  }}
                  placeholder={t('components.dashboard.modals.AddStaffModal.manual_display_nickname_placeholder')}
                />
                {errors.displayNickname && <p className={fieldErrorClass}>{errors.displayNickname}</p>}
              </div>

              <div className="min-w-0">
                <label className={`flex h-4 items-center ${fieldLabelClass}`}>
                  {t('setup.staff_position')}
                </label>
                <input
                  className={`min-w-0 ${inputClass(false)}`}
                  value={position}
                  onChange={(event) => setPosition(event.target.value)}
                  placeholder={t('components.dashboard.modals.AddStaffModal.manual_position_placeholder')}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="min-w-0">
                <label className={`flex h-4 items-center ${fieldLabelClass}`}>
                  {t('setup.staff_phone')}
                </label>
                <div className="relative z-20 mt-1 flex h-10 w-full overflow-visible rounded-lg shadow-sm">
                  <CountryCodeSelect
                    value={dialCode}
                    showSearch={false}
                    onChange={(nextCode) => {
                      const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                      setDialCode(nextCode)
                      setPhone(formatted)
                      clearError('phone')
                    }}
                  />
                  <input
                    type="tel"
                    className={`h-10 w-full min-w-0 rounded-r-lg border border-l-0 px-3 text-sm font-semibold text-nexoraText outline-none transition ${
                      errors.phone
                        ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20'
                        : 'border-nexoraBorder bg-white focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
                    }`}
                    value={formatNationalNumber(phoneParsed.nationalNumber, dialCode)}
                    onChange={(event) => {
                      setPhone(formatNationalNumber(event.target.value, dialCode))
                      clearError('phone')
                    }}
                    placeholder={t('setup.staff_phone_placeholder')}
                    autoComplete="off"
                  />
                </div>
                {errors.phone && <p className={fieldErrorClass}>{errors.phone}</p>}
              </div>

              <div className="min-w-0">
                <label className={`flex h-4 items-center ${fieldLabelClass}`}>
                  {t('setup.staff_email')}
                </label>
                <input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputClass(Boolean(errors.email))}
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value)
                    clearError('email')
                  }}
                  placeholder={t('setup.staff_email_placeholder')}
                />
                {errors.email && <p className={fieldErrorClass}>{errors.email}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className={fieldLabelClass}>{t('setup.payout_methods')}</label>
              <div className="mt-2 space-y-2">
                {manualStaffPayoutKeys.map((walletKey) => {
                  const config = payoutConfigs[walletKey] || EMPTY_STAFF_PAYOUT_CONFIG
                  const walletName = PAYOUT_UI_LABELS[walletKey] || walletKey
                  const method = buildPaymentMethodFromPayoutConfig(
                    walletKey,
                    config,
                    displayNickname || fullName,
                  )
                  const accountDisplay = formatPaymentMethodAccountDisplay(
                    walletKey,
                    method.accountInfo,
                    method.cryptoAddresses,
                  )
                  const hasAccount = isPaymentMethodConfigured(method)
                  const actionLabel = hasAccount
                    ? t('components.settings.tabs.ProfileTab.payoutAccount')
                    : t('components.dashboard.modals.AddStaffModal.manual_add_account')

                  return (
                    <div
                      key={walletKey}
                      className="flex min-w-0 items-center justify-between gap-2 rounded-xl border border-nexoraBorder bg-white px-3 py-2.5 shadow-sm"
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <ToggleSwitch
                          checked={Boolean(config.enabled)}
                          onChange={() => handleToggleWallet(walletKey)}
                          ariaLabel={`Toggle ${walletName}`}
                          activeColor="bg-amber-600"
                          inactiveColor="bg-slate-200"
                        />
                        <div className="flex min-w-0 flex-1 items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas">
                            {WalletLogos[walletKey]}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-xs font-bold text-nexoraText">{walletName}</div>
                            {hasAccount ? (
                              <div className="mt-0.5 truncate font-mono text-[10px] text-nexoraMuted">
                                {supportsPayoutAccountName(walletKey) && config.accountName ? (
                                  <span className="font-sans font-semibold">
                                    {config.accountName} ·{' '}
                                  </span>
                                ) : null}
                                {accountDisplay}
                              </div>
                            ) : (
                              <div className="mt-0.5 truncate text-[10px] font-medium italic text-nexoraSubtle">
                                {t('components.settings.tabs.ProfileTab.notConfigured')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        {hasAccount ? (
                          <button
                            type="button"
                            onClick={() => setViewingMethod(method)}
                            className="inline-flex max-w-[7.5rem] items-center justify-center gap-1 rounded-lg border border-sky-200 bg-sky-50 px-2 py-1.5 text-[10px] font-bold text-sky-700 transition hover:text-sky-800"
                          >
                            <Eye className="h-3 w-3 shrink-0" />
                            <span className="truncate">{t('components.settings.tabs.ProfileTab.view')}</span>
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setEditingWalletKey(walletKey)}
                          className="inline-flex max-w-[8.5rem] items-center justify-center gap-1 rounded-lg border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] font-bold text-amber-700 transition hover:text-amber-800"
                        >
                          {hasAccount ? (
                            <Edit2 className="h-3 w-3 shrink-0" />
                          ) : (
                            <Plus className="h-3 w-3 shrink-0" />
                          )}
                          <span className="truncate">{actionLabel}</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-nexoraBorder px-4 py-2 text-xs font-bold text-nexoraMuted"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-5 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSaving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {t('common.save')}
          </button>
        </div>
      </form>

      <PayoutSetupModal
        lockBackground
        open={Boolean(editingWalletKey)}
        walletKey={editingWalletKey || ''}
        staffName={displayNickname || fullName}
        initialValue={editingConfig?.value || ''}
        initialQrCode={editingConfig?.qrCode || ''}
        initialAccountName={editingConfig?.accountName || ''}
        onClose={() => setEditingWalletKey(null)}
        onSubmit={handlePayoutSubmit}
      />

      <PayoutMethodDetailModal
        method={viewingMethod}
        logo={
          viewingMethod ? (
            <span className="flex h-7 w-7 items-center justify-center">
              {WalletLogos[viewingMethod.uiKey || '']}
            </span>
          ) : null
        }
        onClose={() => setViewingMethod(null)}
      />
    </>
  )
}

export default AddManualStaffTab
