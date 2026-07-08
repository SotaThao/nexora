import { useEffect, useMemo, useState } from 'react'
import { HelpCircle, Loader2, Plus, Upload } from 'lucide-react'
import CountryCodeSelect, {
  formatNationalNumber,
  getDefaultDialCode,
  isValidPhoneE164,
  normalizePhoneE164,
  parsePhone,
} from '../../CountryCodeSelect'
import { useTranslation, renderLabel } from '../../../contexts/LanguageContext'
import { WalletLogos } from '../constants'
import { PAYOUT_UI_LABELS } from '../../../data/paymentMethodTypes'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { getStaffDisplayNameErrorCode } from '../../../utils/staffDisplayName'
import { isValidEmail } from '../../../utils/validation'
import PayoutSetupModal from './PayoutSetupModal'

const MANUAL_STAFF_PAYOUT_KEYS = [
  'zelle',
  'cashapp',
  'venmo',
  'vlinkpay',
  'applecash',
  'paypal',
] as const

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

function createEmptyPayoutConfigs(): PayoutConfigMap {
  return Object.fromEntries(
    MANUAL_STAFF_PAYOUT_KEYS.map((key) => [
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
  const defaultDialCode = useMemo(() => getDefaultDialCode(undefined), [])

  const [fullName, setFullName] = useState('')
  const [displayNickname, setDisplayNickname] = useState('')
  const [position, setPosition] = useState(DEFAULT_ROLE)
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [dialCode, setDialCode] = useState(defaultDialCode)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [payoutConfigs, setPayoutConfigs] = useState<PayoutConfigMap>(createEmptyPayoutConfigs)
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
    setPayoutConfigs(createEmptyPayoutConfigs())
    setErrors({})
    setEditingWalletKey(null)
  }, [open, defaultDialCode])

  useEffect(() => {
    return () => {
      if (avatarPreview?.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview)
      }
    }
  }, [avatarPreview])

  const fieldLabelClass = 'block text-[10px] font-extrabold uppercase text-nexoraMuted leading-snug mb-1'
  const fieldErrorClass = 'mt-1 text-xs font-semibold leading-snug text-nexoraDanger'
  const inputClass = (hasError: boolean, extra = '') =>
    `${extra} h-10 w-full border bg-white text-sm font-semibold text-nexoraText outline-none transition ${
      hasError
        ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20'
        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
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
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt=""
                  className="h-16 w-16 shrink-0 rounded-full border border-nexoraBorder object-cover"
                />
              ) : (
                <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-nexoraBorder bg-nexoraCanvas text-lg font-extrabold text-nexoraMuted">
                  {avatarInitial}
                </div>
              )}
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-3 py-2 text-xs font-bold text-nexoraText transition hover:bg-nexoraCanvas">
                <Upload className="h-3.5 w-3.5" />
                <span>{t('common.upload_photo')}</span>
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

            <div>
              <label className={fieldLabelClass}>
                {renderLabel(t('components.dashboard.modals.AddStaffModal.manual_full_name'))}
              </label>
              <input
                className={`rounded-lg px-3 ${inputClass(Boolean(errors.fullName))}`}
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

            <div>
              <label className={`${fieldLabelClass} flex items-center gap-1.5`}>
                {renderLabel(t('components.dashboard.modals.AddStaffModal.manual_display_nickname'))}
                <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                  <HelpCircle className="h-3 w-3" />
                </span>
              </label>
              <input
                className={`rounded-lg px-3 ${inputClass(Boolean(errors.displayNickname))}`}
                value={displayNickname}
                onChange={(event) => {
                  setDisplayNickname(event.target.value)
                  clearError('displayNickname')
                }}
                placeholder={t('components.dashboard.modals.AddStaffModal.manual_display_nickname_placeholder')}
              />
              {errors.displayNickname && <p className={fieldErrorClass}>{errors.displayNickname}</p>}
            </div>

            <div>
              <label className={fieldLabelClass}>
                {t('components.dashboard.modals.AddStaffModal.role')}
              </label>
              <input
                className={`rounded-lg px-3 ${inputClass(false)}`}
                value={position}
                onChange={(event) => setPosition(event.target.value)}
                placeholder={t('components.dashboard.modals.AddStaffModal.manual_position_placeholder')}
              />
            </div>

            <div>
              <label className={fieldLabelClass}>
                {t('components.dashboard.modals.AddStaffModal.manual_phone')}
              </label>
              <div className="flex h-10 w-full rounded-lg">
                <CountryCodeSelect
                  value={dialCode}
                  onChange={(nextCode) => {
                    const formatted = formatNationalNumber(phoneParsed.nationalNumber, nextCode)
                    setDialCode(nextCode)
                    setPhone(formatted)
                    clearError('phone')
                  }}
                />
                <input
                  type="tel"
                  className={`rounded-r-lg px-3 ${inputClass(Boolean(errors.phone), 'border-l-0')}`}
                  value={formatNationalNumber(phoneParsed.nationalNumber, dialCode)}
                  onChange={(event) => {
                    setPhone(formatNationalNumber(event.target.value, dialCode))
                    clearError('phone')
                  }}
                  placeholder={t('components.dashboard.modals.AddStaffModal.manual_phone_placeholder')}
                  autoComplete="off"
                />
              </div>
              {errors.phone && <p className={fieldErrorClass}>{errors.phone}</p>}
            </div>

            <div>
              <label className={fieldLabelClass}>
                {t('components.dashboard.modals.AddStaffModal.staff_email')}
              </label>
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                className={`rounded-lg px-3 ${inputClass(Boolean(errors.email))}`}
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value)
                  clearError('email')
                }}
                placeholder={t('components.dashboard.modals.AddStaffModal.manual_email_placeholder')}
              />
              {errors.email && <p className={fieldErrorClass}>{errors.email}</p>}
            </div>
          </div>

          <div className="space-y-3">
            <label className={fieldLabelClass}>
              {t('setup.payout_methods')}
            </label>
            <div className="divide-y divide-nexoraRule rounded-xl border border-nexoraBorder bg-white px-4">
              {MANUAL_STAFF_PAYOUT_KEYS.map((walletKey) => {
                const config = payoutConfigs[walletKey] || {
                  enabled: false,
                  value: '',
                  qrCode: '',
                  accountName: '',
                }
                const label = PAYOUT_UI_LABELS[walletKey] || walletKey

                return (
                  <div key={walletKey} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleToggleWallet(walletKey)}
                        aria-label={`Toggle ${label}`}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          config.enabled ? 'bg-nexoraBrand' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            config.enabled ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-nexoraBorder bg-nexoraCanvas">
                          {WalletLogos[walletKey]}
                        </span>
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-nexoraText">{label}</div>
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
                      <Plus className="h-3 w-3 stroke-[2.5]" />
                      <span>{t('components.dashboard.modals.AddStaffModal.manual_add_account')}</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-nexoraRule pt-4">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-nexoraBorder bg-white px-4 py-2.5 text-xs font-bold text-nexoraMuted transition hover:bg-nexoraCanvas"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
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
