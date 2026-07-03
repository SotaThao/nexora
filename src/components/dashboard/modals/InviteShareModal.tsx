import { useState, useEffect, useMemo } from 'react'
import { X, QrCode, Send, Copy } from 'lucide-react'
import IconButton from '../../ui/IconButton'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { buildPublicInviteLink } from '../../../utils/inviteRef'
import { getWebUrlOrigin } from '../../../utils/webUrlBase'
import { buildPublicQrImageUrl } from '../../../data/repositories/publicQr'

function InviteShareModal({
  open,
  businessName,
  businessSlug,
  inviteLinkSetting,
  isInviteLinkSettingLoading = false,
  defaultName,
  defaultContact,
  onClose,
  onSendInvite,
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')
  const [role, setRole] = useState('Nail Technician')
  const [inviteMethod, setInviteMethod] = useState('Email') // 'SMS' | 'Email'
  const [errors, setErrors] = useState<LooseObject>({})
  const [largeQrOpen, setLargeQrOpen] = useState(false)

  useEffect(() => {
    if (open) {
      setName(defaultName || '')
      setContact(defaultContact || '')
      setErrors({})
      if (defaultContact && !defaultContact.includes('@')) {
        setInviteMethod('SMS')
      } else {
        setInviteMethod('Email')
      }
    }
  }, [open, defaultName, defaultContact])

  const publicInviteEnabled = Boolean(inviteLinkSetting?.isEnabled && inviteLinkSetting?.referralCode)
  const publicJoinLink = useMemo(
    () => publicInviteEnabled
      ? buildPublicInviteLink({
        origin: getWebUrlOrigin(),
        businessName,
        businessSlug,
        referralCode: inviteLinkSetting?.referralCode ?? '',
        email: null,
        source: 'public_link',
      })
      : '',
    [businessName, businessSlug, inviteLinkSetting?.referralCode, publicInviteEnabled],
  )
  const publicJoinQrSmallUrl = useMemo(
    () => (publicInviteEnabled && publicJoinLink ? buildPublicQrImageUrl(publicJoinLink, 150) : ''),
    [publicInviteEnabled, publicJoinLink],
  )
  const publicJoinQrLargeUrl = useMemo(
    () => (publicInviteEnabled && publicJoinLink ? buildPublicQrImageUrl(publicJoinLink, 300) : ''),
    [publicInviteEnabled, publicJoinLink],
  )
  const publicInviteUnavailableText = isInviteLinkSettingLoading
    ? t('components.dashboard.modals.InviteShareModal.inviteLinkLoading')
    : t('components.dashboard.modals.InviteShareModal.inviteLinkDisabled')

  if (!open) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors: LooseObject = {}
    if (!name.trim()) nextErrors.name = t('components.dashboard.modals.InviteShareModal.technicianNameRequired')
    if (!contact.trim()) nextErrors.contact = t('components.dashboard.modals.InviteShareModal.contactRequired')

    if (inviteMethod === 'Email' && contact.trim() && !/\S+@\S+\.\S+/.test(contact.trim())) {
      nextErrors.contact = t('components.dashboard.modals.InviteShareModal.invalidEmailFormat')
    }

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }

    onSendInvite(name, contact, role)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-nexoraText/70 modal-overlay-safe backdrop-blur-sm sm:items-center">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl transition-all relative">
        <div className="flex items-center justify-between border-b border-nexoraRule pb-4">
          <h2 className="text-sm font-extrabold text-nexoraText uppercase tracking-wider font-sans">
            {t('components.dashboard.modals.InviteShareModal.shareInvitationLinkAnd')}
          </h2>
          <IconButton label={t('common.close')} onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>

        <div className="mt-4 space-y-5">
          {/* QR Code Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col items-center text-center space-y-3">
            <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider font-sans">
              {t('components.dashboard.modals.InviteShareModal.scanQrToJoin')}
            </span>
            <div
              onClick={() => publicInviteEnabled && setLargeQrOpen(true)}
              className={`h-32 w-32 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center shadow-inner bg-white transition duration-200 group relative ${publicInviteEnabled ? 'cursor-zoom-in hover:scale-105' : 'cursor-not-allowed opacity-60'}`}
              title={t('components.dashboard.modals.InviteShareModal.clickToEnlarge')}
            >
              {publicInviteEnabled ? (
                <img
                  src={publicJoinQrSmallUrl}
                  alt={t('components.dashboard.modals.InviteShareModal.joinQrAlt')}
                  className="h-full w-full object-contain"
                />
              ) : (
                <QrCode className="h-10 w-10 text-slate-300" />
              )}
              {/* Magnifier icon overlay on hover */}
              <div className="absolute inset-0 bg-nexoraBrand/80 rounded-xl flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white select-none">
                <QrCode className="h-5 w-5" />
                <span className="text-[9px] font-black uppercase tracking-wider">{t('components.dashboard.modals.InviteShareModal.preview')}</span>
              </div>
            </div>

            <div className="w-full space-y-1.5">
              <span className="text-[9px] text-slate-400 font-bold block uppercase font-sans">
                {t('components.dashboard.modals.InviteShareModal.joinLink')}
              </span>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  readOnly
                  value={publicInviteEnabled ? publicJoinLink : publicInviteUnavailableText}
                  className="h-8 flex-grow bg-white border border-slate-200 rounded px-2.5 text-[10px] text-slate-500 font-mono focus:outline-none"
                />
                <button
                  type="button"
                  disabled={!publicInviteEnabled}
                  onClick={() => {
                    if (!publicInviteEnabled) return
                    navigator.clipboard.writeText(publicJoinLink)
                    showToast(t('components.dashboard.modals.InviteShareModal.joinLinkCopiedTo'), 'success')
                  }}
                  className={`h-8 px-3 bg-slate-800 text-white rounded text-[10px] font-black uppercase transition font-sans ${publicInviteEnabled ? 'hover:bg-slate-700' : 'cursor-not-allowed opacity-50'}`}
                >
                  {t('components.dashboard.modals.InviteShareModal.copy')}
                </button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                <span className="rounded bg-white px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 border border-slate-200">
                  public_link
                </span>
                <span className="rounded bg-white px-2 py-0.5 text-[9px] font-black uppercase text-slate-500 border border-slate-200">
                  {inviteLinkSetting?.referralCode || t('components.dashboard.modals.InviteShareModal.disabled')}
                </span>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
            <span className="relative bg-white pr-3 text-[9px] text-slate-400 font-black uppercase tracking-wider font-sans">
              {t('components.dashboard.modals.InviteShareModal.orSendDirectly')}
            </span>
          </div>

          {/* Send Invite Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {t('components.dashboard.modals.InviteShareModal.technicianName')}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand"
                placeholder={t('components.dashboard.modals.InviteShareModal.phExampleName')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              {errors.name && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setInviteMethod('Email')
                  setErrors({})
                }}
                className={`h-10 rounded-lg border text-xs font-bold transition flex items-center justify-center gap-1.5 font-sans ${
                  inviteMethod === 'Email'
                    ? 'border-nexoraBrand bg-nexoraBrandSoft text-nexoraBrand'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {t('components.dashboard.modals.InviteShareModal.methodEmail')}
              </button>
              <button
                type="button"
                disabled
                onClick={() => {
                  setInviteMethod('SMS')
                  setErrors({})
                }}
                className={`h-10 rounded-lg border text-xs font-bold transition flex flex-col items-center justify-center font-sans ${
                  inviteMethod === 'SMS'
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-80'
                }`}
              >
                <span>{t('components.dashboard.modals.InviteShareModal.methodSms')}</span>
                <span className="text-[9px] font-medium normal-case opacity-80 -mt-0.5">{t('components.dashboard.modals.InviteShareModal.methodSmsComingSoon')}</span>
              </button>
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {inviteMethod === 'SMS'
                  ? t('components.dashboard.modals.InviteShareModal.phoneNumber')
                  : t('components.dashboard.modals.InviteShareModal.emailAddress')}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand font-mono"
                placeholder={inviteMethod === 'SMS'
                  ? t('components.dashboard.modals.InviteShareModal.phExamplePhone')
                  : t('components.dashboard.modals.InviteShareModal.phExampleEmail')}
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
              {errors.contact && <p className="mt-1 text-[10px] font-bold text-rose-600">{errors.contact}</p>}
            </div>

            <div>
              <label className="text-[10px] font-extrabold uppercase text-nexoraMuted font-sans">
                {t('components.dashboard.modals.InviteShareModal.rolePosition')}
              </label>
              <input
                type="text"
                className="mt-1 h-9 w-full rounded-lg border border-nexoraBorder px-3 text-xs outline-none focus:border-nexoraBrand"
                placeholder={t('components.dashboard.modals.InviteShareModal.phExampleRole')}
                value={role}
                onChange={(e) => setRole(e.target.value)}
              />
            </div>

            <button
              type="submit"
              className="w-full h-10 mt-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider rounded-lg transition shadow-md flex items-center justify-center gap-1.5 font-sans"
            >
              <Send className="h-4 w-4" />
              {t('components.dashboard.modals.InviteShareModal.sendInviteLink')}
            </button>
          </form>
        </div>
      </div>

      {/* Large Join QR Modal inside InviteShareModal */}
      {largeQrOpen && publicInviteEnabled && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm modal-overlay-safe cursor-zoom-out animate-fadeIn"
          onClick={() => setLargeQrOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 flex flex-col items-center cursor-default animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-full flex justify-between items-center mb-4">
              <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider font-sans">
                {t('components.dashboard.modals.InviteShareModal.joinQrCode')}
              </h3>
              <button
                type="button"
                onClick={() => setLargeQrOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="h-64 w-64 rounded-2xl bg-slate-50 border border-slate-200 p-4 flex items-center justify-center shadow-inner bg-white mb-4">
              <img
                src={publicJoinQrLargeUrl}
                alt={t('components.dashboard.modals.InviteShareModal.scanToJoinAlt')}
                className="h-full w-full object-contain"
              />
            </div>

            <p className="text-[11px] text-slate-500 font-medium text-center leading-relaxed max-w-xs mb-4 font-sans">
              {t('components.dashboard.modals.InviteShareModal.haveTechniciansScanThis')}
            </p>

            <div className="w-full bg-slate-50 rounded-xl border border-slate-200 p-2.5 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400 font-mono truncate max-w-[210px]">
                {publicJoinLink}
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(publicJoinLink)
                  showToast(t('components.dashboard.modals.InviteShareModal.joinLinkCopiedTo'), 'success')
                }}
                className="h-7 px-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 shrink-0 font-sans"
              >
                <Copy className="h-3 w-3" />
                <span>{t('components.dashboard.modals.InviteShareModal.copy')}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InviteShareModal
