import { useState, useEffect, useMemo } from 'react'
import { X, HelpCircle, Loader2 } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import {
  getDefaultDialCode,
  isValidPhoneE164,
  normalizePhoneForApi,
} from '../../CountryCodeSelect'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useSearchMerchantStaff } from '../../../data/hooks/useMerchantStaff'
import { isValidEmail } from '../../../utils/validation'
import type { StaffSearchResult } from '../../../types/domain'

function getContactKind(value: string): 'email' | 'phone' | 'unknown' {
  const trimmed = value.trim()
  if (!trimmed) return 'unknown'
  if (trimmed.includes('@')) return 'email'
  if (/[a-zA-Z]/.test(trimmed)) return 'email'
  return 'phone'
}

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
  const { t, currentLanguage } = useTranslation()
  const [activeTab, setActiveTab] = useState<'link' | 'invite'>('invite')
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({})
  const defaultDialCode = useMemo(() => getDefaultDialCode(currentLanguage), [currentLanguage])

  // Link tab
  const [searchInput, setSearchInput] = useState('')
  const [activeSearchQuery, setActiveSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState('')
  const [searchResult, setSearchResult] = useState<StaffSearchResult | null>(null)
  const [searchError, setSearchError] = useState('')

  // Invite tab
  const [inviteName, setInviteName] = useState('')
  const [inviteContact, setInviteContact] = useState('')
  const [inviteRole, setInviteRole] = useState('')
  const [inviteMethod, setInviteMethod] = useState('Email')

  const { data: searchResults, isLoading: isSearching, isFetched } = useSearchMerchantStaff(activeSearchQuery, {
    enabled: open && activeSearchQuery.trim().length > 0,
  })

  useEffect(() => {
    if (!open) {
      setActiveTab('invite')
      setSearchInput('')
      setActiveSearchQuery('')
      setSearchResult(null)
      setSearchError('')
      setSelectedRole('')
      setInviteName('')
      setInviteContact('')
      setInviteRole('')
      setInviteMethod('Email')
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

  const handleSearch = () => {
    const query = searchInput.trim()
    if (!query) {
      setSearchError(t('components.dashboard.modals.AddStaffModal.search_required'))
      return
    }

    const kind = getSearchInputKind(query)
    if (kind === 'email' && !isValidEmail(query)) {
      setSearchError(t('setup.errors.staff_email_invalid'))
      return
    }
    if (kind === 'phone' && !isValidPhoneE164(query, defaultDialCode)) {
      setSearchError(t('setup.errors.staff_phone_invalid'))
      return
    }

    setSearchResult(null)
    setSearchError('')
    setActiveSearchQuery(getSearchQueryPayload(query, defaultDialCode))
  }

  const handleSearchInputChange = (value: string) => {
    setSearchInput(value)
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
  const fieldLabelClass = 'flex min-h-8 items-end gap-1.5 text-[10px] font-extrabold uppercase text-nexoraMuted leading-snug'

  const inputClass = (hasError: boolean, extra = '') =>
    `${extra} h-10 w-full border bg-white text-sm font-semibold text-nexoraText outline-none transition ${
      hasError
        ? 'border-nexoraDanger focus:border-nexoraDanger focus:ring-2 focus:ring-nexoraDanger/20'
        : 'border-nexoraBorder focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20'
    }`

  const handleContactChange = (value: string) => {
    setInviteContact(value)
    clearInviteError('contact')
  }

  const validateInviteContact = () => {
    const trimmed = inviteContact.trim()
    if (!trimmed) {
      return t('components.dashboard.modals.AddStaffModal.contact_required')
    }

    const kind = getContactKind(trimmed)
    if (kind === 'email') {
      if (!isValidEmail(trimmed)) {
        return t('setup.errors.staff_email_invalid')
      }
      return ''
    }

    if (!isValidPhoneE164(trimmed, defaultDialCode)) {
      return t('setup.errors.staff_phone_invalid')
    }
    return ''
  }

  const getInviteContactPayload = () => {
    const trimmed = inviteContact.trim()
    if (getContactKind(trimmed) === 'email') {
      return trimmed.toLowerCase()
    }
    return normalizePhoneForApi(trimmed, defaultDialCode)
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
    } else if (inviteMethod === 'Email' && getContactKind(inviteContact.trim()) !== 'email') {
      nextErrors.contact = t('components.dashboard.modals.AddStaffModal.emailRequiredForMethod')
    }

    if (Object.keys(nextErrors).length) {
      setInviteErrors(nextErrors)
      return
    }

    setInviteErrors({})
    onInviteStaff(inviteName, getInviteContactPayload(), inviteRole, inviteMethod, { onSuccess: onClose })
  }

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
          <form className="mt-5 space-y-2" onSubmit={handleInviteSubmit}>
            <p className="text-sm text-nexoraMuted leading-snug">
              {t('staff_invite.option_b_desc')}
            </p>

            <div>
              <div className="space-y-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <label className={fieldLabelClass}>
                    {t('components.dashboard.modals.AddStaffModal.staff_name')}
                  </label>
                  <label className={fieldLabelClass}>
                    {t('components.dashboard.modals.AddStaffModal.phone_or_email')}
                  </label>
                  <div>
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
                  <div>
                    <input
                      type="text"
                      inputMode={getContactKind(inviteContact) === 'phone' ? 'tel' : 'email'}
                      className={`rounded-lg px-3 ${inputClass(Boolean(inviteErrors.contact))}`}
                      value={inviteContact}
                      onChange={(e) => handleContactChange(e.target.value)}
                      placeholder={t('components.dashboard.modals.AddStaffModal.phone_or_email_placeholder')}
                      autoComplete="off"
                    />
                    {inviteErrors.contact && (
                      <p className={fieldErrorClass}>{inviteErrors.contact}</p>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <label className={fieldLabelClass}>
                    {t('components.dashboard.modals.AddStaffModal.role')}
                  </label>
                  <label className={fieldLabelClass}>
                    {t('staff_invite.invite_method')}
                  </label>
                  <input
                    className={`rounded-lg px-3 ${inputClass(false)}`}
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    placeholder={t('components.dashboard.modals.AddStaffModal.role_placeholder')}
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setInviteMethod('Email')
                        clearInviteError('contact')
                      }}
                      className={`h-10 rounded-lg border text-xs font-bold transition flex items-center justify-center ${
                        inviteMethod === 'Email'
                          ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                          : 'border-nexoraBorder bg-white text-nexoraMuted hover:bg-slate-50'
                      }`}
                    >
                      {t('components.dashboard.modals.InviteShareModal.methodEmail')}
                    </button>
                    <button
                      type="button"
                      disabled
                      className="h-10 rounded-lg border border-nexoraBorder bg-slate-50 text-slate-400 cursor-not-allowed flex flex-col items-center justify-center opacity-80"
                    >
                      <span className="text-xs font-bold">{t('components.dashboard.modals.InviteShareModal.methodSms')}</span>
                      <span className="text-[9px] font-medium normal-case opacity-80 -mt-0.5">
                        {t('components.dashboard.modals.InviteShareModal.methodSmsComingSoon')}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isInviting}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isInviting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('components.dashboard.modals.AddStaffModal.send_setup_link')}
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-xs text-slate-600 leading-relaxed">
              {t('components.dashboard.modals.AddStaffModal.invite_info')}
            </div>
          </form>
        ) : (
          <div className="mt-5 space-y-2">
            <p className="text-sm text-nexoraMuted leading-snug">
              {t('staff_invite.option_a_desc')}
            </p>

            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                <label className={fieldLabelClass}>
                  <span>{t('staff_invite.search_placeholder')}</span>
                  <span className="inline-flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-black text-indigo-600">
                    <HelpCircle className="h-3 w-3" />
                  </span>
                </label>
                <label className={fieldLabelClass}>
                  {t('components.dashboard.modals.AddStaffModal.role_at_business')}
                </label>
                <div>
                  <input
                    className={`rounded-lg px-3 ${inputClass(Boolean(searchError))}`}
                    value={searchInput}
                    onChange={(e) => handleSearchInputChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    placeholder="NEX-STF-839201"
                  />
                  {searchError && (
                    <p className={fieldErrorClass}>{searchError}</p>
                  )}
                </div>
                <input
                  className={`rounded-lg px-3 ${inputClass(false)}`}
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  placeholder={t('components.dashboard.modals.AddStaffModal.role_placeholder')}
                />
              </div>

              <button
                type="button"
                onClick={handleSearch}
                disabled={isSearching}
                className="mt-2 inline-flex items-center gap-2 rounded-lg bg-nexoraBrand px-4 py-2.5 text-xs font-bold text-white transition hover:bg-opacity-95 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSearching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t('staff_invite.search_btn')}
              </button>
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
          </div>
        )}
      </div>
    </div>
  )
}

export default AddStaffModal
