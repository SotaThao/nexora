import { useCallback, useMemo } from 'react'
import { Copy, QrCode, Share2, UserPlus } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useNotification } from '../../contexts/NotificationContext'
import { buildPublicQrImageUrl } from '../../data/repositories/publicQr'
import type { InviteLinkSettingDto } from '../../types/repositories'
import { copyTextToClipboard } from '../../utils/clipboard'
import { buildPublicInviteLink } from '../../utils/inviteRef'
import { QR_IMAGE_SIZES } from '../../utils/qrUtils'
import { shareUrl } from '../../utils/shareUrl'
import { getWebUrlOrigin } from '../../utils/webUrlBase'
import QrImage from '../ui/QrImage'

type StaffInviteQrPanelProps = {
  businessName?: string
  businessSlug?: string
  inviteLinkSetting?: InviteLinkSettingDto | null
  isLoading?: boolean
  className?: string
}

const TK = 'components.dashboard.views.StaffView'

export default function StaffInviteQrPanel({
  businessName = '',
  businessSlug = '',
  inviteLinkSetting,
  isLoading = false,
  className = '',
}: StaffInviteQrPanelProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()

  const publicInviteEnabled = Boolean(
    inviteLinkSetting?.isEnabled && inviteLinkSetting.referralCode,
  )

  const publicInviteLink = useMemo(
    () =>
      publicInviteEnabled
        ? buildPublicInviteLink({
            origin: getWebUrlOrigin(),
            businessName,
            businessSlug,
            referralCode: inviteLinkSetting?.referralCode ?? '',
            source: 'public_link',
          })
        : '',
    [
      businessName,
      businessSlug,
      inviteLinkSetting?.referralCode,
      publicInviteEnabled,
    ],
  )

  const qrImageSrc = useMemo(
    () =>
      publicInviteLink
        ? buildPublicQrImageUrl(publicInviteLink, QR_IMAGE_SIZES.panel)
        : '',
    [publicInviteLink],
  )

  const unavailableText = isLoading
    ? t(`${TK}.inviteLinkLoading`)
    : t(`${TK}.inviteLinkDisabled`)

  const handleCopy = useCallback(async () => {
    if (!publicInviteLink) return
    try {
      await copyTextToClipboard(publicInviteLink)
      showToast(t(`${TK}.joinLinkCopiedTo`), 'success')
    } catch {
      showToast(t('common.error'), 'error')
    }
  }, [publicInviteLink, showToast, t])

  const handleShare = useCallback(async () => {
    if (!publicInviteLink) return
    try {
      const result = await shareUrl({
        url: publicInviteLink,
        title: t(`${TK}.shareTitle`),
        text: t(`${TK}.shareText`, { businessName }),
      })
      if (result === 'copied') {
        showToast(t(`${TK}.joinLinkCopiedTo`), 'success')
      }
    } catch {
      showToast(t('common.error'), 'error')
    }
  }, [businessName, publicInviteLink, showToast, t])

  return (
    <section
      className={`mx-auto w-full max-w-2xl rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm sm:p-6 ${className}`}
    >
      <div className="text-center">
        <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <UserPlus className="h-5 w-5" aria-hidden />
        </span>
        <h3 className="mt-3 text-base font-extrabold text-nexoraText">
          {t(`${TK}.technicianJoinLinkAnd`)}
        </h3>
        <p className="mx-auto mt-1 max-w-lg text-xs leading-relaxed text-nexoraMuted">
          {t(`${TK}.shareThisReferralLink`)}
        </p>
      </div>

      <div className="mx-auto my-5 flex h-44 w-44 items-center justify-center overflow-hidden rounded-2xl border border-nexoraBorder bg-white p-3 shadow-sm">
        {publicInviteEnabled ? (
          <QrImage
            src={qrImageSrc}
            alt={t(`${TK}.scanToJoinAlt`)}
            className="h-full w-full"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-xl bg-nexoraSurfaceMuted text-nexoraSubtle"
            aria-hidden
          >
            <QrCode className="h-12 w-12" />
          </div>
        )}
      </div>

      {!publicInviteEnabled ? (
        <p className="mb-3 text-center text-xs font-semibold text-nexoraMuted">
          {unavailableText}
        </p>
      ) : null}

      <input
        type="text"
        readOnly
        value={publicInviteEnabled ? publicInviteLink : unavailableText}
        aria-label={t(`${TK}.technicianJoinLinkAnd`)}
        className="h-11 w-full rounded-flox-inputs border border-nexoraBorder bg-nexoraCanvas px-3 text-center font-mono text-[11px] text-nexoraMuted outline-none"
      />

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          disabled={!publicInviteEnabled}
          onClick={() => void handleCopy()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-flox-buttons border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText transition hover:bg-nexoraSurfaceMuted disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t(`${TK}.copy`)}
        >
          <Copy className="h-4 w-4" aria-hidden />
          {t(`${TK}.copy`)}
        </button>
        <button
          type="button"
          disabled={!publicInviteEnabled}
          onClick={() => void handleShare()}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={t(`${TK}.share`)}
        >
          <Share2 className="h-4 w-4" aria-hidden />
          {t(`${TK}.share`)}
        </button>
      </div>
    </section>
  )
}
