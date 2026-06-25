import { useEffect, useState } from 'react'
import { X, Loader2, ExternalLink, HelpCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import {
  usePhysicalCardDetail,
  useSendPhysicalCardSupport,
} from '../../../data/hooks/useMerchantPhysicalCards'
import { getApiErrorCode } from '../../../types/domain'
import { getErrorI18nKey } from '../../../data/errorCodes'
import { toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'
import { formatTransactionDateTime } from '../utils'

function DetailRow({ label, children }) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-black uppercase tracking-wider text-nexoraSubtle">{label}</p>
      <div className="text-sm font-bold text-nexoraText break-all">{children}</div>
    </div>
  )
}

export default function PhysicalCardDetailModal({ helpCode, onClose }) {
  const { t, currentLanguage } = useTranslation()
  const [supportMessage, setSupportMessage] = useState('')
  const { data, isLoading, isError, error } = usePhysicalCardDetail(helpCode)
  const sendSupportMutation = useSendPhysicalCardSupport()

  useEffect(() => {
    setSupportMessage('')
  }, [helpCode])

  const handleSubmitSupport = async (event) => {
    event.preventDefault()
    const message = supportMessage.trim()
    if (!message || !helpCode) return

    try {
      await sendSupportMutation.mutateAsync({ helpCode, message })
      setSupportMessage('')
      onClose()
    } catch {
      // Toast handled in mutation hook
    }
  }

  const touchPointUrl = data?.touchPointUrl
    ? toLocalCustomerTouchUrl(String(data.touchPointUrl))
    : null

  const linkedAtLabel = data?.linkedAt
    ? formatTransactionDateTime(data.linkedAt, currentLanguage)
    : t('dashboard.touchpoints.physical_card.not_linked_yet')

  const touchPointLabel = data?.touchPointName
    ? data.touchPointName
    : t('dashboard.touchpoints.physical_card.not_linked_yet')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="physical-card-detail-title"
        className="w-full max-w-lg rounded-2xl bg-white dark:bg-luxuryCoal border border-nexoraBorder dark:border-luxuryGold/18 shadow-2xl animate-scaleUp max-h-[90vh] overflow-y-auto"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-nexoraRule dark:border-white/10 bg-white dark:bg-luxuryCoal px-5 py-4">
          <div className="min-w-0">
            <h3 id="physical-card-detail-title" className="text-base font-extrabold text-nexoraText truncate">
              {t('dashboard.touchpoints.physical_card.detail_title')}
            </h3>
            {helpCode ? (
              <p className="mt-0.5 text-[11px] font-mono text-nexoraMuted truncate">{helpCode}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('dashboard.touchpoints.physical_card.close')}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-nexoraMuted hover:bg-nexoraSurfaceMuted dark:hover:bg-white/10 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-7 w-7 animate-spin text-nexoraBrand" />
            </div>
          ) : isError || !data ? (
            <div className="rounded-xl border border-nexoraDanger/20 bg-nexoraDanger/5 px-4 py-6 text-center">
              <p className="text-sm font-bold text-nexoraDanger">
                {isError
                  ? t(getErrorI18nKey(getApiErrorCode(error, 'unknown_error')))
                  : t('dashboard.touchpoints.physical_card.detail_error')}
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <DetailRow label={t('dashboard.touchpoints.physical_card.card_code')}>
                  <span className="font-mono">{data.cardCode || '—'}</span>
                </DetailRow>
                <DetailRow label={t('dashboard.touchpoints.physical_card.help_code')}>
                  <span className="font-mono">{data.helpCode || '—'}</span>
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

              <div className="space-y-3 rounded-xl border border-nexoraBorder dark:border-luxuryGold/18 bg-nexoraSurfaceMuted/40 dark:bg-luxuryBlack/40 p-4">
                <DetailRow label={t('dashboard.touchpoints.physical_card.touchpoint')}>
                  <span className={data.touchPointName ? '' : 'text-nexoraSubtle italic font-normal'}>
                    {touchPointLabel}
                  </span>
                </DetailRow>
                {touchPointUrl ? (
                  <a
                    href={touchPointUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-nexoraBrand dark:text-luxuryGold hover:underline break-all"
                  >
                    <span>{touchPointUrl.replace(/^https?:\/\//, '')}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  </a>
                ) : null}
              </div>

              <form onSubmit={handleSubmitSupport} className="space-y-3 border-t border-nexoraRule dark:border-white/10 pt-5">
                <div className="flex items-center gap-2">
                  <HelpCircle className="h-4 w-4 text-nexoraBrand dark:text-luxuryGold shrink-0" />
                  <h4 className="text-sm font-extrabold text-nexoraText">
                    {t('dashboard.touchpoints.physical_card.support_title')}
                  </h4>
                </div>
                <p className="text-xs text-nexoraMuted leading-relaxed">
                  {t('dashboard.touchpoints.physical_card.support_desc')}
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
        </div>
      </div>
    </div>
  )
}
