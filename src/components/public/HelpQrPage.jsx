import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, HelpCircle, Loader2 } from 'lucide-react'
import { useTranslation } from '../../contexts/LanguageContext'
import {
  usePublicPhysicalCardHelp,
  usePublicSendPhysicalCardSupport,
} from '../../data/hooks/usePublicQr'
import { formatTransactionDateTime } from '../dashboard/utils'

function DetailRow({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{label}</p>
      <div className="text-sm font-bold text-nexoraText break-all">{children}</div>
    </div>
  )
}

export default function HelpQrPage() {
  const { code } = useParams()
  const { t, currentLanguage } = useTranslation()
  const helpCode = code?.trim() ?? ''
  const [supportMessage, setSupportMessage] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const { data, isLoading, isError } = usePublicPhysicalCardHelp(helpCode, { enabled: Boolean(helpCode) })
  const sendSupportMutation = usePublicSendPhysicalCardSupport()

  useEffect(() => {
    setSupportMessage('')
    setSubmitted(false)
  }, [helpCode])

  const handleSubmitSupport = async (event) => {
    event.preventDefault()
    const message = supportMessage.trim()
    if (!message || !helpCode) return

    try {
      await sendSupportMutation.mutateAsync({ helpCode, message })
      setSupportMessage('')
      setSubmitted(true)
    } catch {
      // Toast handled in mutation hook
    }
  }

  if (!helpCode) {
    return (
      <HelpQrShell helpCode="">
        <div className="rounded-xl border border-nexoraDanger/20 bg-nexoraDanger/5 px-4 py-6 text-center">
          <p className="text-sm font-bold text-nexoraDanger">{t('public.help_qr.invalid_code')}</p>
        </div>
      </HelpQrShell>
    )
  }

  const linkedAtLabel = data?.linkedAt
    ? formatTransactionDateTime(data.linkedAt, currentLanguage)
    : t('dashboard.touchpoints.physical_card.not_linked_yet')

  const touchPointLabel = data?.touchPointName
    ? data.touchPointName
    : t('dashboard.touchpoints.physical_card.not_linked_yet')

  return (
    <HelpQrShell helpCode={helpCode}>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
        </div>
      ) : submitted ? (
        <div className="rounded-xl border border-nexoraSuccess/20 bg-nexoraSuccess/5 px-4 py-8 text-center space-y-3">
          <CheckCircle2 className="mx-auto h-10 w-10 text-nexoraSuccess" />
          <p className="text-sm font-bold text-nexoraText">{t('public.help_qr.support_success')}</p>
          <p className="text-xs text-nexoraMuted leading-relaxed">{t('public.help_qr.support_success_desc')}</p>
        </div>
      ) : (
        <>
          {isError || !data ? (
            <div className="rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted/40 px-4 py-4 text-center">
              <p className="text-sm font-bold text-nexoraText">{t('public.help_qr.detail_partial_title')}</p>
              <p className="mt-1 text-xs text-nexoraMuted leading-relaxed">
                {t('public.help_qr.detail_partial_desc')}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow label={t('dashboard.touchpoints.physical_card.card_code')}>
                  <span className="font-mono">{data.cardCode || '—'}</span>
                </DetailRow>
                <DetailRow label={t('dashboard.touchpoints.physical_card.help_code')}>
                  <span className="font-mono">{data.helpCode || helpCode}</span>
                </DetailRow>
                <DetailRow label={t('dashboard.touchpoints.physical_card.status')}>
                  <span className={data.isActive ? 'text-nexoraSuccess' : 'text-nexoraSubtle'}>
                    {data.isActive
                      ? t('dashboard.touchpoint_stats.active')
                      : t('dashboard.touchpoint_stats.inactive')}
                  </span>
                </DetailRow>
                <DetailRow label={t('dashboard.touchpoints.physical_card.linked_at')}>
                  <span className={data.linkedAt ? '' : 'text-nexoraSubtle italic font-normal'}>
                    {linkedAtLabel}
                  </span>
                </DetailRow>
              </div>

              <div className="rounded-xl border border-nexoraBorder dark:border-luxuryGold/18 bg-nexoraSurfaceMuted/40 dark:bg-luxuryBlack/40 p-4">
                <DetailRow label={t('dashboard.touchpoints.physical_card.touchpoint')}>
                  <span className={data.touchPointName ? '' : 'text-nexoraSubtle italic font-normal'}>
                    {touchPointLabel}
                  </span>
                </DetailRow>
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmitSupport}
            className="space-y-3 border-t border-nexoraRule dark:border-white/10 pt-5"
          >
            <div className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4 text-nexoraBrand dark:text-luxuryGold shrink-0" />
              <h2 className="text-sm font-extrabold text-nexoraText">
                {t('dashboard.touchpoints.physical_card.support_title')}
              </h2>
            </div>
            <p className="text-xs text-nexoraMuted leading-relaxed">
              {t('public.help_qr.support_desc')}
            </p>
            <textarea
              value={supportMessage}
              onChange={(event) => setSupportMessage(event.target.value)}
              placeholder={t('dashboard.touchpoints.physical_card.support_placeholder')}
              rows={4}
              className="w-full rounded-flox-inputs border border-nexoraBorder dark:border-luxuryGold/18 bg-white dark:bg-luxuryCoal px-3 py-2.5 text-sm text-nexoraText outline-none focus:border-nexoraBrand dark:focus:border-luxuryGold resize-y min-h-[100px]"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!supportMessage.trim() || sendSupportMutation.isPending}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-flox-buttons bg-nexoraBrand dark:bg-luxuryGold px-5 text-xs font-bold uppercase tracking-wide text-white dark:text-luxuryBlack hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendSupportMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {t('dashboard.touchpoints.physical_card.support_submit')}
              </button>
            </div>
          </form>
        </>
      )}
    </HelpQrShell>
  )
}

function HelpQrShell({ helpCode, children }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-qr-title"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto"
      >
        <div className="border-b border-nexoraRule dark:border-white/10 px-5 py-4">
          <h1 id="help-qr-title" className="text-base font-extrabold text-nexoraText">
            {t('public.help_qr.title')}
          </h1>
          {helpCode ? (
            <p className="mt-0.5 text-[11px] font-mono text-nexoraMuted truncate">{helpCode}</p>
          ) : null}
        </div>
        <div className="space-y-5 p-5">{children}</div>
      </div>
    </div>
  )
}
