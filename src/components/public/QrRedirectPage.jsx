import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import { useResolveQrCode } from '../../data/hooks/usePublicQr'
import LoadingScreen from '../../app/LoadingScreen'

function getStatusMessageKey(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'not_found') return 'public.qr.not_found'
  if (normalized === 'inactive') return 'public.qr.inactive'
  if (normalized === 'unlinked') return 'public.qr.unlinked'
  return 'public.qr.unavailable'
}

export default function QrRedirectPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const cardCode = code?.trim() ?? ''
  const { data, isLoading, isError } = useResolveQrCode(cardCode, { enabled: Boolean(cardCode) })

  useEffect(() => {
    if (!data?.touchPoint?.businessSlug || !data?.touchPoint?.slug) return
    navigate(
      `/touch/${encodeURIComponent(data.touchPoint.businessSlug)}/${encodeURIComponent(data.touchPoint.slug)}`,
      { replace: true },
    )
  }, [data, navigate])

  if (!cardCode) {
    return (
      <PublicQrError
        title={t('public.qr.invalid_code_title')}
        message={t('public.qr.invalid_code_desc')}
      />
    )
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (isError || !data?.touchPoint) {
    const statusKey = getStatusMessageKey(data?.status)
    return (
      <PublicQrError
        title={t('public.qr.unavailable_title')}
        message={t(statusKey)}
        code={cardCode}
      />
    )
  }

  return <LoadingScreen />
}

function PublicQrError({ title, message, code }) {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-nexoraCanvas px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-nexoraBorder bg-white dark:bg-luxuryCoal p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-nexoraDanger/10 text-nexoraDanger">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h1 className="text-lg font-extrabold text-nexoraText">{title}</h1>
        <p className="mt-2 text-sm text-nexoraMuted leading-relaxed">{message}</p>
        {code ? (
          <p className="mt-4 text-[11px] font-mono uppercase tracking-wider text-nexoraSubtle">{code}</p>
        ) : null}
      </div>
    </div>
  )
}
