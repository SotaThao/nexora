import { useEffect, useMemo, useState } from 'react'
import { HelpCircle, Loader2, Pencil, Plus, Upload } from 'lucide-react'
import CountryCodeSelect, {
  formatNationalNumber,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
  PhoneDialCode,
} from '../../CountryCodeSelect'
import { useTranslation, renderLabel } from '../../../contexts/LanguageContext'
import { WalletLogos } from '../constants'
import {
  orderedPayoutUiKeysFromMethods,
  PAYOUT_UI_LABELS,
  STAFF_CONFIGURABLE_PAYOUT_UI_KEYS,
} from '../../../data/paymentMethodTypes'
import { useMerchantPaymentMethods } from '../../../data/hooks/useMerchantPaymentMethods'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getStaffDisplayNameErrorCode } from '../../../utils/staffDisplayName'
import { isValidEmail } from '../../../utils/validation'
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
  const { data: merchantPaymentMethods = [] } = useMerchantPaymentMethods({ enabled: open })

  const manualStaffPayoutKeys = useMemo(
    () => orderedPayoutUiKeysFromMethods(merchantPaymentMethods, STAFF_CONFIGURABLE_PAYOUT_UI_KEYS),
    [merchantPaymentMethods],
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
              <label className={fieldLabelClass}>Avatar</label>
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
              <div className="mt-2 space-y-4">
                <div className="divide-y divide-nexoraRule rounded-xl border border-nexoraBorder bg-white px-4">
                  {manualStaffPayoutKeys.map((walletKey) => {
                    const config = payoutConfigs[walletKey] || {
                      enabled: false,
                      value: '',
                      qrCode: '',
                      accountName: '',
                    }
                    const label = PAYOUT_UI_LABELS[walletKey] || walletKey

                    return (
                      <div key={walletKey} className="flex items-center justify-between py-3">
                        <div className="flex min-w-0 items-center gap-3">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={config.enabled}
                            aria-label={`${label} — ${t('setup.payout_methods')}`}
                            onClick={() => handleToggleWallet(walletKey)}
                            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand/40 focus-visible:ring-offset-1 ${
                              config.enabled ? 'bg-nexoraBrand' : 'bg-nexoraBorder'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                                config.enabled ? 'translate-x-5' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <div className="flex min-w-0 items-center gap-2">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-nexoraCanvas">
                              {WalletLogos[walletKey]}
                            </span>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-nexoraText">{label}</span>
                              {config.value ? (
                                <div className="mt-0.5 truncate text-[10px] font-mono text-nexoraMuted">
                                  {config.value}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditingWalletKey(walletKey)}
                          className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-nexoraBrand transition hover:text-nexoraBrandDark"
                        >
                          {config.value ? (
                            <Pencil className="h-3 w-3 stroke-[2.5]" />
                          ) : (
                            <Plus className="h-3 w-3 stroke-[2.5]" />
                          )}
                          <span>
                            {config.value
                              ? t('components.dashboard.modals.StaffModal.editAccount')
                              : t('components.dashboard.modals.AddStaffModal.manual_add_account')}
                          </span>
                        </button>
                      </div>
                    )
                  })}
                </div>
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
        open={Boolean(editingWalletKey)}
        walletKey={editingWalletKey || ''}
        staffName={displayNickname || fullName}
        initialValue={editingConfig?.value || ''}
        initialQrCode={editingConfig?.qrCode || ''}
        onClose={() => setEditingWalletKey(null)}
        onSubmit={handlePayoutSubmit}
      />
    </>
  )
}

export default AddManualStaffTab
