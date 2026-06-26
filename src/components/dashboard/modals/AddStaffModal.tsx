import { useState, useEffect, useMemo } from 'react'
import { X, HelpCircle, Loader2, Camera } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import StaffQrScannerModal from './StaffQrScannerModal'
import CountryCodeSelect, {
  formatNationalNumber,
  getDefaultDialCode,
  isValidPhoneE164,
  normalizePhoneForApi,
  parsePhone,
} from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useSearchMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import { isValidEmail } from '../../../utils/validation'
import type { StaffSearchResult } from '../../../types/domain'

const DEFAULT_ROLE = 'Nail Technician'

function getSearchInputKind(value: string): 'email' | 'phone' | 'staffId' | 'unknown' {
  const trimmed = value.trim()
  if (!trimmed) return 'unknown'
  if (trimmed.includes('@')) return 'email'
  if (/^\+?[\d\s\-().]+$/.test(trimmed) && /\d/.test(trimmed)) return 'phone'
  return 'staffId'
}

function getSearchQueryPayload(value: string, fallbackDialCode: string) {
  const trimmed = value.trim()
  const kind = getSearchInputKind(trimmed)
  if (kind === 'phone') return normalizePhoneForApi(trimmed, fallbackDialCode)
  if (kind === 'email') return trimmed.toLowerCase()
  return trimmed
}

function formatInvitePhoneNational(nationalNumber: string, dialCode: string): string {
  const formatted = formatNationalNumber(nationalNumber, dialCode)
  // Keep VN display consistent with requested style: 0385-478-857
  if (dialCode === '+84') return formatted.replace(/[\s\u2009]+/g, '-')
  return formatted
}

function resolveDialCodeFromInput(value: string, fallbackDialCode: string): string {
  const trimmed = value.trim()
  if (!trimmed) return fallbackDialCode
  if (trimmed.startsWith('+')) {
    return parsePhone(trimmed).countryCode || fallbackDialCode
  }
  const digits = trimmed.replace(/\D/g, '')
  if (digits.startsWith('0')) return '+84'
  return fallbackDialCode
}

type AddStaffModalProps = {
  open: boolean
  onClose: () => void
  onLinkStaff: (result: StaffSearchResult, role: string, options?: { onSuccess?: () => void }) => void
  onInviteStaff: (name: string, contact: string, role: string, method: string, options?: { onSuccess?: () => void }) => void
  isLinking?: boolean
  isInviting?: boolean
}

function AddStaffModal({
  open,
  onClose,
  onLinkStaff,
  onInviteStaff,
  isLinking = false,
  isInviting = false,
}: AddStaffModalProps) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState<'link' | 'invite'>('invite')
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({})
  // Default phone country should follow device/browser locale, not UI language.
  const defaultDialCode = useMemo(() => getDefaultDialCode(undefined), [])

  // Link tab
  const [searchInput, setSearchInput] = useState('')
  const [searchDialCode, setSearchDialCode] = useState(defaultDialCode)
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState(DEFAULT_ROLE)
  const [searchResult, setSearchResult] = useState<StaffSearchResult | null>(null)
  const [searchError, setSearchError] = useState('')
  const [showScanner, setShowScanner] = useState(false)

  // Invite tab
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteRole, setInviteRole] = useState(DEFAULT_ROLE)
  const [inviteMethod, setInviteMethod] = useState('Email')
  const [inviteDialCode, setInviteDialCode] = useState(defaultDialCode)

  const {
    data: searchResults,
    isLoading,
    isFetching,
    isFetched,
    refetch: refetchSearchResults,
  } = useSearchMerchantStaff(activeSearchQuery, {
    enabled: open && activeSearchQuery.trim().length > 0,
  })
  const isSearching = isLoading || isFetching

  useEffect(() => {
    if (!open) {
      setActiveTab('invite')
      setSearchInput('')
      setSearchDialCode(defaultDialCode)
      setActiveSearchQuery('')
      setSearchResult(null)
      setSearchError('')
      setShowScanner(false)
      setSelectedRole(DEFAULT_ROLE)
      setInviteName('')
      setInviteContact('')
      setInviteRole(DEFAULT_ROLE)
      setInviteMethod('Email')
      setInviteDialCode(defaultDialCode)
      setInviteErrors({})
    }
  }, [open, defaultDialCode])

  useEffect(() => {
    if (!activeSearchQuery || isSearching) return
    if (searchResults && searchResults.length > 0) {
      setSearchResult(searchResults[0])
      setSearchError('')
      return
    }
    if (isFetched) {
      setSearchResult(null)
      setSearchError(t('components.dashboard.views.StaffView.noStaffProfileFound'))
    }
  }, [activeSearchQuery, searchResults, isSearching, isFetched, t])

  if (!open) return null

  const triggerStaffSearch = (query: string) => {
    const trimmed = query.trim()
    if (!trimmed) {
      setSearchError(t('components.dashboard.modals.AddStaffModal.search_required'))
      return
    }

    const kind = getSearchInputKind(trimmed)
    const searchFallbackDialCode = resolveDialCodeFromInput(trimmed, searchDialCode || defaultDialCode)
    if (kind === 'email' && !isValidEmail(trimmed)) {
      setSearchError(t('setup.errors.staff_email_invalid'))
      return
    }
    if (kind === 'phone' && !isValidPhoneE164(trimmed, searchFallbackDialCode)) {
      setSearchError(t('setup.errors.staff_phone_invalid'))
      return
    }

    const nextQuery = getSearchQueryPayload(trimmed, searchFallbackDialCode)
    setSearchResult(null)
    setSearchError('')

    if (nextQuery === activeSearchQuery) {
      void refetchSearchResults()
      return
    }
    setActiveSearchQuery(nextQuery)
  }

  const handleSearch = () => {
    triggerStaffSearch(searchInput)
  }

  const handleQrScanResult = (staffCode: string) => {
    setShowScanner(false)
    setSearchInput(staffCode)
    triggerStaffSearch(staffCode)
  }

  const handleSearchInputChange = (value: string) => {
    const kind = getSearchInputKind(value)
    if (kind === 'phone') {
      const nextDialCode = resolveDialCodeFromInput(value, searchDialCode || defaultDialCode)
      const parsed = parsePhone(
        value.trim().startsWith('+') ? value : `${nextDialCode}${value.replace(/\D/g, '')}`,
      )
      const formatted = formatInvitePhoneNational(parsed.nationalNumber, nextDialCode)
      setSearchDialCode(nextDialCode)
      setSearchInput(formatted)
    } else {
      setSearchInput(value)
    }
    if (searchError) setSearchError('')
  }

  const clearInviteError = (field: string) => {
    setInviteErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const fieldErrorClass = 'mt-1 text-xs font-semibold leading-snug text-nexoraDanger'
  const fieldLabelClass = 'block text-[10px] font-extrabold uppercase text-nexoraMuted leading-snug mb-1'
  const fieldWrapClass = 'min-w-0'

  const inputClass = (hasError: boolean, extra = '') =>
    `${extra} h-10 w-full border bg-white text-sm font-semibold text-nexoraText outline-none transition ${
      hasError
        ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20'
        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
    }`

  const handleInviteContactChange = (value: string) => {
    if (inviteMethod === 'Email') {
      setInviteContact(value)
      clearInviteError('contact')
      return
    }

    const nextDialCode = resolveDialCodeFromInput(value, inviteDialCode || defaultDialCode)
    const parsed = parsePhone(
      value.trim().startsWith('+') ? value : `${nextDialCode}${value.replace(/\D/g, '')}`,
    )
    const formatted = formatInvitePhoneNational(parsed.nationalNumber, nextDialCode)
    setInviteDialCode(nextDialCode)
    setInviteContact(formatted)
    clearInviteError('contact')
  }

  const handlePhoneContactChange = (value: string) => {
    const formatted = formatInvitePhoneNational(value, inviteDialCode)
    setInviteContact(formatted)
    clearInviteError('contact')
  }

  const validateInviteContact = () => {
    const trimmed = inviteContact.trim()
    if (!trimmed) {
      return inviteMethod === 'Email'
        ? t('components.dashboard.modals.AddStaffModal.email_required')
        : t('components.dashboard.modals.AddStaffModal.contact_required')
    }

    if (inviteMethod === 'Email') {
      if (!isValidEmail(trimmed)) {
        return t('components.dashboard.modals.AddStaffModal.emailRequiredForMethod')
      }
      return ''
    }

    if (!isValidPhoneE164(trimmed, inviteDialCode)) {
      return t('components.dashboard.modals.AddStaffModal.phoneRequiredForMethod')
    }
    return ''
  }

  const getInviteContactPayload = () => {
    const trimmed = inviteContact.trim()
    if (inviteMethod === 'Email') return trimmed.toLowerCase()
    return normalizePhoneForApi(trimmed, inviteDialCode)
  }

  const handleLinkRequest = () => {
    if (!searchResult) return
    onLinkStaff(searchResult, selectedRole, { onSuccess: onClose })
  }

  const handleInviteSubmit = (e) => {
    e.preventDefault()
    const nextErrors: Record<string, string> = {}

    if (!inviteName.trim()) {
      nextErrors.name = t('components.dashboard.modals.AddStaffModal.staff_name_required')
    }

    const contactError = validateInviteContact()
    if (contactError) {
      nextErrors.contact = contactError
    }

    if (Object.keys(nextErrors).length) {
      setInviteErrors(nextErrors)
      return
    }

    setInviteErrors({})
    onInviteStaff(inviteName, getInviteContactPayload(), inviteRole, inviteMethod, { onSuccess: onClose })
  }

  const activeSearchPaymentMethods = (searchResult?.paymentMethods ?? []).filter((method) => method.isActive)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 p-4 py-6 backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-2xl transition-all">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-lg font-extrabold text-nexoraText">
            {t('components.dashboard.modals.AddStaffModal.title')}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mt-5 flex gap-2 border-b border-nexoraRule">
          <button
            type="button"
            onClick={() => {
              setActiveTab('invite')
              setSearchError('')
            }}
            className={`px-3.5 py-3 text-xs font-extrabold border-b-[3px] transition-colors ${
              activeTab === 'invite'
                ? 'border-nexoraBrand text-nexoraBrand'
                : 'border-transparent text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t('components.dashboard.modals.AddStaffModal.tab_invite')}
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('link')
              setInviteErrors({})
            }}
            className={`px-3.5 py-3 text-xs font-extrabold border-b-[3px] transition-colors ${
              activeTab === 'link'
                ? 'border-nexoraBrand text-nexoraBrand'
                : 'border-transparent text-nexoraMuted hover:text-nexoraText'
            }`}
          >
            {t('components.dashboard.modals.AddStaffModal.tab_link')}
          </button>
        </div>

        {activeTab === 'invite' ? (
          <form className="mt-5 space-y-4" onSubmit={handleInviteSubmit}>
            <p className="text-sm text-nexoraMuted leading-snug">
              {t('staff_invite.option_b_desc')}
            </p>

            <div>
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrapClass}>
                    <label className={fieldLabelClass}>
                      {t('components.dashboard.modals.AddStaffModal.staff_name')}
                    </label>
                    <input
                      className={`rounded-lg px-3 ${inputClass(Boolean(inviteErrors.name))}`}
                      value={inviteName}
                      onChange={(e) => {
                        setInviteName(e.target.value)
                        clearInviteError('name')
                      }}
                      placeholder={t('components.dashboard.modals.AddStaffModal.staff_name_placeholder')}
                    />
                    {inviteErrors.name && (
                      <p className={fieldErrorClass}>{inviteErrors.name}</p>
                    )}
                  </div>
                  <div className={fieldWrapClass}>
                    <label className={fieldLabelClass}>
                      {t('components.dashboard.modals.AddStaffModal.phone_or_email')}
                    </label>
                    {inviteMethod === 'SMS' ? (
                      <div className="flex h-10 w-full overflow-hidden rounded-lg">
                        <CountryCodeSelect
                          value={inviteDialCode}
                          onChange={(newCode) => {
                            const phoneParsed = parsePhone(inviteContact)
                            const reFormatted = formatInvitePhoneNational(phoneParsed.nationalNumber, newCode)
                            setInviteDialCode(newCode)
                            setInviteContact(reFormatted)
                            clearInviteError('contact')
                          }}
                        />
                        <input
                          type="tel"
                          className={`rounded-r-lg px-3 ${inputClass(Boolean(inviteErrors.contact), 'border-l-0')}`}
                          value={formatNationalNumber(parsePhone(inviteContact).nationalNumber, inviteDialCode)}
                          onChange={(e) => handlePhoneContactChange(e.target.value)}
                          placeholder={t('components.dashboard.modals.InviteShareModal.phExamplePhone')}
                          autoComplete="off"
                        />
                      </div>
                    ) : (
                      <input
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        className={`rounded-lg px-3 ${inputClass(Boolean(inviteErrors.contact))}`}
                        value={inviteContact}
                        onChange={(e) => handleInviteContactChange(e.target.value)}
                        placeholder={t('components.dashboard.modals.AddStaffModal.phone_or_email_placeholder')}
                      />
                    )}
                    {inviteErrors.contact && (
                      <p className={fieldErrorClass}>{inviteErrors.contact}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={fieldWrapClass}>
                    <label className={fieldLabelClass}>
                      {t('components.dashboard.modals.AddStaffModal.role')}
                    </label>
                    <input
                      className={`rounded-lg px-3 ${inputClass(false)}`}
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value)}
                      placeholder={t('components.dashboard.modals.AddStaffModal.role_placeholder')}
                    />
                  </div>
                  <div className={fieldWrapClass}>
                    <label className={fieldLabelClass}>
                      {t('staff_invite.invite_method')}
                    </label>
                    <select
                      className={`rounded-lg px-3 ${inputClass(false)}`}
                      value={inviteMethod}
                      onChange={(e) => {
                        const nextMethod = e.target.value
                        setInviteMethod(nextMethod)
                        clearInviteError('contact')
                        setInviteContact('')

                        if (nextMethod === 'SMS') {
                          setInviteDialCode(defaultDialCode)
                        }
                      }}
                    >
                      <option value="Email">{t('components.dashboard.modals.InviteShareModal.methodEmail')}</option>
                      <option value="SMS" disabled>
                        {`${t('components.dashboard.modals.InviteShareModal.methodSms')} (${t('components.dashboard.modals.InviteShareModal.methodSmsComingSoon')})`}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
              {t('components.dashboard.modals.AddStaffModal.invite_info')}
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isInviting}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('components.dashboard.modals.AddStaffModal.send_setup_link')}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-4">
            <p className="text-sm text-nexoraMuted leading-snug">
              {t('staff_invite.option_a_desc')}
            </p>

            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className={fieldWrapClass}>
                  <label className={`${fieldLabelClass} flex items-center gap-1.5`}>
                    <span>{t('staff_invite.search_placeholder')}</span>
                    <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                      <HelpCircle className="h-3 w-3" />
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      className={`min-w-0 flex-1 rounded-lg px-3 ${inputClass(Boolean(searchError))}`}
                      value={searchInput}
                      onChange={(e) => handleSearchInputChange(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="NEX-STF-839201"
                    />
                    <IconButton
                      label={t('components.dashboard.modals.StaffModal.scanQrCode')}
                      onClick={() => setShowScanner(true)}
                      className="shrink-0 border border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand hover:bg-nexoraBrand/10"
                    >
                      <Camera className="h-4 w-4" />
                    </IconButton>
                  </div>
                  {searchError && (
                    <p className={fieldErrorClass}>{searchError}</p>
                  )}
                </div>
                <div className={fieldWrapClass}>
                  <label className={fieldLabelClass}>
                    {t('components.dashboard.modals.AddStaffModal.role_at_business')}
                  </label>
                  <input
                    className={`rounded-lg px-3 ${inputClass(false)}`}
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    placeholder={t('components.dashboard.modals.AddStaffModal.role_placeholder')}
                  />
                </div>
              </div>
            </div>

            {searchResult && (
              <div className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-2xl border border-nexoraBorder bg-slate-50/80 p-4">
                <div className="h-14 w-14 shrink-0 rounded-full bg-gradient-to-br from-orange-200 to-nexoraBrand" />
                <div className="flex-1 min-w-0">
                  <p className="font-extrabold text-nexoraText">{searchResult.fullName}</p>
                  <p className="text-xs text-nexoraMuted mt-0.5">
                    {t('components.dashboard.modals.AddStaffModal.staff_id_label', {
                      code: searchResult.staffCode || searchResult.staffProfileId,
                    })}
                    {searchResult.position ? ` • ${searchResult.position}` : ''}
                  </p>
                  {activeSearchPaymentMethods.length > 0 && (
                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {activeSearchPaymentMethods.map((method, idx) => (
                        <span
                          key={`${method.type || 'method'}-${idx}`}
                          className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700"
                        >
                          {method.type || 'Payment'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleLinkRequest}
                  disabled={isLinking}
                  className="shrink-0 inline-flex items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLinking && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  {t('staff_invite.link_request_btn')}
                </button>
              </div>
            )}

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
              {t('components.dashboard.modals.AddStaffModal.link_info')}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('staff_invite.search_btn')}
              </button>
            </div>
          </div>
        )}
      </div>

      <StaffQrScannerModal
        open={showScanner}
        scanTarget="staff"
        onClose={() => setShowScanner(false)}
        onScan={handleQrScanResult}
      />
    </div>
  )
}

export default AddStaffModal
