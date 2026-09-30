import { useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  Check,
  ChevronDown,
  DollarSign,
  Hash,
  Link2,
  MessageCircle,
  Phone,
  Receipt,
  Sparkles,
  Star,
  Store,
  User,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import { useNotification } from '../../../../../contexts/NotificationContext'
import { useUpdatePosSmsMessageSettings } from '../../../../../data/hooks/usePosSmsSettings'
import { useAnalyzeMerchantVoiceSmsText } from '../../../../../data/hooks/useMerchantVoiceSmsCampaigns'
import { getErrorMessage } from '../../../../../data/errorCodes'
import { TOAST_SNACK_DURATION_MS } from '../../../../../constants/toast'
import {
  POS_SMS_BODY_MAX_LENGTH,
  POS_SMS_INSERT_CHIPS,
  POS_SMS_QUICK_TEMPLATES,
  PosSmsPlaceholder,
  PosSmsSendMode,
  PosSmsTemplateType,
} from '../../../../../constants/posSmsSettings'
import { SmsEncoding } from '../../../../../data/merchantVoice/domain'
import type { PosSmsMessageSettingsApiDto, PosSmsPhoneApiDto } from '../../../../../types/posSms'
import ToggleSwitch from '../../../../ui/ToggleSwitch'
import PosSmsTestSender from './PosSmsTestSender'
import { renderPosSmsEstimateText, renderPosSmsPreview } from './posSmsPreview'

const K = 'components.dashboard.views.pos.PosSmsSettings'
const ANALYZE_DEBOUNCE_MS = 300

const EXPIRING_LINKS: PosSmsPlaceholder[] = [
  PosSmsPlaceholder.VisitLink,
  PosSmsPlaceholder.ReviewLink,
  PosSmsPlaceholder.TipLink,
  PosSmsPlaceholder.FeedbackLink,
]

const INSERT_CHIP_ICONS: Record<PosSmsPlaceholder, LucideIcon> = {
  [PosSmsPlaceholder.CustomerName]: User,
  [PosSmsPlaceholder.SalonName]: Store,
  [PosSmsPlaceholder.VisitLink]: Link2,
  [PosSmsPlaceholder.SalonPhone]: Phone,
  [PosSmsPlaceholder.TicketNumber]: Hash,
  [PosSmsPlaceholder.TicketTotal]: DollarSign,
  [PosSmsPlaceholder.ReceiptLink]: Receipt,
  [PosSmsPlaceholder.ReviewLink]: Star,
  [PosSmsPlaceholder.TipLink]: Wallet,
  [PosSmsPlaceholder.FeedbackLink]: MessageCircle,
  [PosSmsPlaceholder.BookingLink]: CalendarDays,
}

type Props = {
  businessId: string
  type: PosSmsTemplateType
  settings: PosSmsMessageSettingsApiDto
  salonName: string
  estimateValues: Record<string, string>
  visitLinkTtlDays: number
  defaultTestPhone: PosSmsPhoneApiDto | null
}

export default function PosSmsMessagePanel({
  businessId,
  type,
  settings,
  salonName,
  estimateValues,
  visitLinkTtlDays,
  defaultTestPhone,
}: Props) {
  const { t } = useTranslation()
  const { showToast: notify } = useNotification()
  const updateSettings = useUpdatePosSmsMessageSettings(businessId, type)
  const { mutate: analyzeText } = useAnalyzeMerchantVoiceSmsText()

  const [enabled, setEnabled] = useState(settings.enabled)
  const [sendMode, setSendMode] = useState(settings.sendMode)
  const [body, setBody] = useState(settings.body)
  const [estimate, setEstimate] = useState({
    encoding: settings.textAnalysis.encoding,
    characterCount: settings.textAnalysis.characterCount,
    segmentCount: settings.textAnalysis.segmentCount,
  })
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const analyzeRequestIdRef = useRef(0)

  const isWelcome = type === PosSmsTemplateType.Welcome
  const section = isWelcome ? 'welcome' : 'afterCheckout'
  const noticeKey = isWelcome ? 'marketingConsent' : 'customerProtection'
  const preview = useMemo(() => renderPosSmsPreview(body, salonName), [body, salonName])
  const estimateText = useMemo(() => renderPosSmsEstimateText(body, estimateValues), [body, estimateValues])
  const isEmpty = body.trim().length === 0
  const canSave = !isEmpty && !updateSettings.isPending
  const hasExpiringLink = EXPIRING_LINKS.some((token) => body.includes(token))
  const ttlPeriod = t(visitLinkTtlDays === 1 ? `${K}.link.oneDay` : `${K}.link.days`, { count: visitLinkTtlDays })
  const encodingLabel = t(
    estimate.encoding === SmsEncoding.Ucs2 ? `${K}.message.encodingUnicode` : `${K}.message.encodingGsm7`,
  )

  useEffect(() => {
    const requestId = ++analyzeRequestIdRef.current
    const timer = window.setTimeout(() => {
      analyzeText(
        { text: estimateText.slice(0, POS_SMS_BODY_MAX_LENGTH) },
        {
          onSuccess: (data) => {
            if (requestId === analyzeRequestIdRef.current) {
              setEstimate({
                encoding: data.encoding,
                characterCount: data.characterCount,
                segmentCount: data.segmentCount,
              })
            }
          },
        },
      )
    }, ANALYZE_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [estimateText, analyzeText])

  const insertToken = (token: string) => {
    const textarea = textareaRef.current
    const start = textarea?.selectionStart ?? body.length
    const end = textarea?.selectionEnd ?? body.length
    const next = `${body.slice(0, start)}${token}${body.slice(end)}`
    setBody(next)
    requestAnimationFrame(() => {
      if (!textarea) return
      const caret = start + token.length
      textarea.focus()
      textarea.setSelectionRange(caret, caret)
    })
  }

  const save = () => {
    if (!canSave) return
    updateSettings.mutate(
      { enabled, sendMode, body: body.trim() },
      {
        onSuccess: () =>
          notify(t('components.settings.hooks.useSettingsForm.settingsUpdatedSuccessfully'), 'success', TOAST_SNACK_DURATION_MS),
        onError: (err) => notify(getErrorMessage(err, t), 'error', TOAST_SNACK_DURATION_MS),
      },
    )
  }

  const quickTemplates = POS_SMS_QUICK_TEMPLATES[type]
  const insertChips = POS_SMS_INSERT_CHIPS[type]

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-4 rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
        <h3 className="text-sm font-extrabold text-nexoraText">{t(`${K}.${section}.title`)}</h3>

        <div className="flex min-h-11 items-center justify-between gap-3 rounded-lg border border-nexoraBorder px-3 py-2">
          <span className="text-xs font-bold text-nexoraText">{t(`${K}.${section}.enableLabel`)}</span>
          <ToggleSwitch
            checked={enabled}
            onChange={() => setEnabled((current) => !current)}
            ariaLabel={t(`${K}.${section}.enableLabel`)}
            size="md"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`pos-sms-send-mode-${type}`} className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
            {t(`${K}.sendMode.label`)}
          </label>
          <div className="relative">
            <select
              id={`pos-sms-send-mode-${type}`}
              value={sendMode}
              onChange={(e) => setSendMode(e.target.value as PosSmsSendMode)}
              className="h-10 w-full appearance-none rounded-lg border border-nexoraBorder bg-white pl-3 pr-9 text-xs font-semibold text-nexoraText outline-none focus:border-nexoraBrand"
            >
              <option value={PosSmsSendMode.Automatic}>{t(`${K}.${section}.sendModeAutomatic`)}</option>
              <option value={PosSmsSendMode.Manual}>{t(`${K}.sendMode.manual`)}</option>
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-nexoraMuted"
              aria-hidden
            />
          </div>
          {sendMode === PosSmsSendMode.Manual ? (
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
              {t(`${K}.sendMode.manualNote`)}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
            {t(`${K}.quickTemplate.label`)}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {quickTemplates.map((template) => {
              const isActive = body === template.body
              return (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setBody(template.body)}
                  className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition ${
                    isActive ? 'border-nexoraBrand bg-nexoraBrandSoft/30' : 'border-nexoraBorder hover:border-nexoraLavender'
                  }`}
                >
                  <span className="flex items-center gap-1 text-xs font-bold text-nexoraBrand">
                    <Sparkles className="h-3.5 w-3.5" aria-hidden />
                    {t(`${K}.quickTemplate.${template.labelKey}`)}
                  </span>
                  <span className="break-words text-[11px] text-nexoraMuted">{template.body}</span>
                </button>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor={`pos-sms-body-${type}`} className="text-[10px] font-extrabold uppercase tracking-wide text-nexoraMuted">
            {t(`${K}.message.label`)}
          </label>
          <div className={`rounded-lg border ${isEmpty ?'border-rose-400' : 'border-nexoraBorder focus-within:border-nexoraBrand'}`}>
            <div className="flex items-start gap-1.5 border-b border-nexoraBorder px-3 py-2">
              <span className="shrink-0 py-1 text-[11px] font-bold text-nexoraText">{t(`${K}.message.insert`)}</span>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {insertChips.map((chip) => {
                  const ChipIcon = INSERT_CHIP_ICONS[chip.token]
                  return (
                    <button
                      key={chip.token}
                      type="button"
                      onClick={() => insertToken(chip.token)}
                      className="inline-flex items-center gap-1 rounded-md border border-nexoraBorder bg-nexoraSurfaceMuted px-2 py-1 text-[11px] font-bold text-nexoraBrand hover:border-nexoraBrand"
                    >
                      <ChipIcon className="h-3 w-3 shrink-0" aria-hidden />
                      {t(`${K}.chips.${chip.labelKey}`)}
                    </button>
                  )
                })}
              </div>
            </div>
            <textarea
              id={`pos-sms-body-${type}`}
              ref={textareaRef}
              value={body}
              maxLength={POS_SMS_BODY_MAX_LENGTH}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t(`${K}.message.placeholder`)}
              rows={4}
              className="w-full resize-y border-0 bg-transparent px-3 py-2 text-xs font-semibold text-nexoraText outline-none"
            />
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-nexoraBorder px-3 py-1.5 text-[11px]">
              <span className="text-nexoraMuted">{t(`${K}.message.estimateHint`)}</span>
              <span className={`font-bold ${estimate.segmentCount > 1 ? 'text-amber-700' : 'text-nexoraBrand'}`}>
                {t(`${K}.message.estimate`, {
                  chars: estimate.characterCount,
                  segments: estimate.segmentCount,
                  encoding: encodingLabel,
                })}
              </span>
            </div>
          </div>
          {isEmpty ? <p className="text-[11px] font-semibold text-rose-600">{t(`${K}.message.required`)}</p> : null}
          {estimate.segmentCount > 1 ? (
            <p className="text-[11px] text-amber-700">
              {t(`${K}.message.multiSegmentWarning`, { segments: estimate.segmentCount })}
            </p>
          ) : null}
        </div>

        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
          <span className="font-bold">{t(`${K}.${noticeKey}.title`)}</span> {t(`${K}.${noticeKey}.body`)}
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end">
          <button
            type="button"
            onClick={save}
            disabled={!canSave}
            className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrandDark disabled:opacity-60"
          >
            <Check className="h-3.5 w-3.5" aria-hidden />
            {t(`${K}.${section}.save`)}
          </button>
          <div className="min-w-0 sm:min-w-[300px] sm:max-w-[480px] sm:flex-1">
            <PosSmsTestSender
              businessId={businessId}
              type={type}
              body={body}
              defaultTestPhone={defaultTestPhone}
              disabled={isEmpty}
            />
          </div>
        </div>
      </section>

      <aside className="self-start rounded-xl border border-nexoraBorder bg-white p-4 shadow-sm sm:p-5">
        <h3 className="mb-3 text-sm font-extrabold text-nexoraText">{t(`${K}.${section}.previewTitle`)}</h3>
        <div className="mx-auto w-[62%] min-w-[200px] max-w-[280px] overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-nexora-card">
          <div className="h-4 bg-nexoraText" />
          <div className="px-3 pb-4 pt-3">
            <p className="mb-3 text-center text-xs font-bold text-nexoraText">{t(`${K}.preview.messages`)}</p>
            <p className="whitespace-pre-wrap break-words rounded-lg bg-blue-50 px-3 py-2.5 text-[11px] leading-relaxed text-nexoraText">
              {preview || '—'}
            </p>
            {hasExpiringLink ? (
              <p className="mt-2 text-[10px] leading-snug text-nexoraMuted">
                {t(`${K}.preview.linkActive`, { period: ttlPeriod })}
              </p>
            ) : null}
          </div>
        </div>
        {!enabled ? (
          <p className="mt-3 text-center text-[11px] font-medium text-nexoraMuted">{t(`${K}.preview.disabled`)}</p>
        ) : null}
      </aside>
    </div>
  )
}
