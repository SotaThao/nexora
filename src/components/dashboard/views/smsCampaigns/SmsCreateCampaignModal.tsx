import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreateMerchantVoiceSmsCampaign,
  useEstimateMerchantVoiceSmsCampaign,
  useMerchantVoiceSmsCampaign,
  useUpdateMerchantVoiceSmsCampaign,
} from '../../../../data/hooks/useMerchantVoiceSmsCampaigns'
import {
  SmsCampaignAudience,
  SmsCampaignScheduleMode,
} from '../../../../data/merchantVoice/domain'
import type { SmsCampaignAudienceSummaryDto } from '../../../../data/repositories/merchantVoiceSmsCampaigns'
import { getApiErrorCode } from '../../../../types/domain'
import {
  AlertTriangleIcon,
  CalendarTabIcon,
  ClockIcon,
  CloseIcon,
  GiftIcon,
  LinkIcon,
  MegaphoneIcon,
  PhoneIcon,
  PlusIcon,
  RefreshCwIcon,
  SendIcon,
  SmartphoneIcon,
  SparklesIcon,
  StarIcon,
  StoreIcon,
  UserIcon,
  UserPlusIcon,
  ZapIcon,
} from '../BookingHubIcons'
import {
  getAudienceCount,
  SMS_API_MODE_TO_COMPOSER,
  SMS_CAMPAIGN_SEGMENT_CARDS,
  SMS_CAMPAIGN_TEMPLATES,
  SMS_CAMPAIGN_TK,
  SMS_COMPOSER_MODE_TO_API,
  SMS_COMPOSER_TAG_SAMPLES,
  SMS_COMPOSER_TAGS,
  SMS_LANDING_PAGE_OPTIONS,
  SMS_PRICE_PER_SMS,
  SmsComposerScheduleMode,
} from './constants'
import { getSmsCharInfo } from './smsCharInfo'

const TK = SMS_CAMPAIGN_TK

const SEGMENT_ICON: Record<SmsCampaignAudience, React.ReactNode> = {
  [SmsCampaignAudience.New]: <UserPlusIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days15]: <CalendarTabIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days30]: <ClockIcon className="marketing-icon" />,
  [SmsCampaignAudience.Days60]: <RefreshCwIcon className="marketing-icon" />,
  [SmsCampaignAudience.Vip]: <StarIcon className="marketing-icon" />,
  [SmsCampaignAudience.Birthday]: <GiftIcon className="marketing-icon" />,
}

const TAG_ICON: Record<string, React.ReactNode> = {
  '{TenKhach}': <UserIcon className="marketing-icon is-compact" />,
  '{TenTiem}': <StoreIcon className="marketing-icon is-compact" />,
  '{Link}': <LinkIcon className="marketing-icon is-compact" />,
  '{SoDT}': <PhoneIcon className="marketing-icon is-compact" />,
}

type Props = {
  open: boolean
  initialAudience?: SmsCampaignAudience
  campaignId?: string | null
  availableCredits: number
  audienceSummary?: SmsCampaignAudienceSummaryDto
  onClose: () => void
  onSaved: (message: string) => void
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] ?? char
  ))
}

function renderPreviewHtml(text: string): string {
  if (!text.trim()) return ''
  let safe = escapeHtml(text)
  for (const [tag, sample] of Object.entries(SMS_COMPOSER_TAG_SAMPLES)) {
    const safeTag = escapeHtml(tag)
    const rendered = tag === '{Link}'
      ? `<span class="lnk">${escapeHtml(sample)}</span>`
      : `<strong>${escapeHtml(sample)}</strong>`
    safe = safe.split(safeTag).join(rendered)
  }
  return safe.replace(/\n/g, '<br>')
}

function toScheduledAtUtc(date: string, time: string): string | undefined {
  if (!date || !time) return undefined
  const local = new Date(`${date}T${time}`)
  if (Number.isNaN(local.getTime())) return undefined
  return local.toISOString()
}

function splitUtcToLocalInputs(iso: string | null | undefined): { date: string; time: string } {
  if (!iso) return { date: '', time: '10:00' }
  const parsed = new Date(iso)
  if (Number.isNaN(parsed.getTime())) return { date: '', time: '10:00' }
  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')
  return { date: `${year}-${month}-${day}`, time: `${hours}:${minutes}` }
}

export default function SmsCreateCampaignModal({
  open,
  initialAudience = SmsCampaignAudience.New,
  campaignId = null,
  availableCredits,
  audienceSummary,
  onClose,
  onSaved,
}: Props) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const confirmBoxRef = useRef<HTMLDivElement | null>(null)
  const closeBtnRef = useRef<HTMLButtonElement | null>(null)

  const isEdit = !!campaignId
  const campaignQuery = useMerchantVoiceSmsCampaign(campaignId, { enabled: open && isEdit })
  const estimateMutation = useEstimateMerchantVoiceSmsCampaign()
  const createMutation = useCreateMerchantVoiceSmsCampaign()
  const updateMutation = useUpdateMerchantVoiceSmsCampaign()
  const { mutate: estimateCampaign } = estimateMutation

  const [audience, setAudience] = useState(initialAudience)
  const [campaignName, setCampaignName] = useState('')
  const [message, setMessage] = useState('')
  const [landingPage, setLandingPage] = useState('')
  const [scheduleMode, setScheduleMode] = useState(SmsComposerScheduleMode.Now)
  const [scheduleDate, setScheduleDate] = useState('')
  const [scheduleTime, setScheduleTime] = useState('10:00')
  const [confirming, setConfirming] = useState(false)
  const [hydratedId, setHydratedId] = useState<string | null>(null)

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const isHydrating = isEdit && campaignQuery.isLoading && hydratedId !== campaignId

  useEffect(() => {
    if (!open) {
      document.body.style.overflow = ''
      return undefined
    }

    document.body.style.overflow = 'hidden'
    if (!isEdit) {
      setAudience(initialAudience)
      setCampaignName('')
      setMessage('')
      setLandingPage('')
      setScheduleMode(SmsComposerScheduleMode.Now)
      setScheduleDate('')
      setScheduleTime('10:00')
      setConfirming(false)
      setHydratedId(null)
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !isSubmitting) onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    requestAnimationFrame(() => closeBtnRef.current?.focus())

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [open, initialAudience, isEdit, isSubmitting, onClose])

  useEffect(() => {
    if (!open || !isEdit || !campaignQuery.data || hydratedId === campaignQuery.data.id) return
    const detail = campaignQuery.data
    const scheduleInputs = splitUtcToLocalInputs(detail.scheduledAtUtc)
    setAudience(detail.audienceSegment)
    setCampaignName(detail.name)
    setMessage(detail.messageBody)
    setLandingPage(detail.linkUrl ?? '')
    setScheduleMode(SMS_API_MODE_TO_COMPOSER[detail.scheduleMode])
    setScheduleDate(scheduleInputs.date)
    setScheduleTime(scheduleInputs.time)
    setConfirming(false)
    setHydratedId(detail.id)
  }, [open, isEdit, campaignQuery.data, hydratedId])

  useEffect(() => {
    if (!confirming) return
    confirmBoxRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [confirming])

  useEffect(() => {
    if (!open) return undefined
    const text = message.trim()
    if (!text) return undefined

    const timer = window.setTimeout(() => {
      estimateCampaign({
        audienceSegment: audience,
        messageBody: text,
        linkUrl: landingPage || undefined,
      })
    }, 400)

    return () => window.clearTimeout(timer)
  }, [open, audience, message, landingPage, estimateCampaign])

  const numberLocale = currentLanguage === 'vi' ? 'vi-VN' : 'en-US'
  const segmentCard = useMemo(
    () => SMS_CAMPAIGN_SEGMENT_CARDS.find((item) => item.id === audience) ?? SMS_CAMPAIGN_SEGMENT_CARDS[0],
    [audience],
  )
  const templates = SMS_CAMPAIGN_TEMPLATES[audience]
  const localCharInfo = useMemo(() => getSmsCharInfo(message), [message])
  const estimate = estimateMutation.data

  const audienceCount = estimate?.recipients
    ?? getAudienceCount(audienceSummary, audience)
  const parts = Math.max(estimate?.segmentsPerMessage ?? localCharInfo.parts, 1)
  const totalSms = estimate?.totalSegments ?? audienceCount * parts
  const cost = (estimate?.estimatedCostUsd ?? totalSms * SMS_PRICE_PER_SMS).toFixed(2)
  const spendableCredits = estimate?.creditBalance ?? availableCredits
  const enoughCredits = estimate?.hasEnoughCredits ?? spendableCredits >= totalSms
  const encodingLabel = estimate?.encoding ?? localCharInfo.encoding
  const previewHtml = useMemo(() => renderPreviewHtml(message), [message])

  const insertTag = (tag: string) => {
    const el = textareaRef.current
    if (!el) {
      setMessage((prev) => prev + tag)
      setConfirming(false)
      return
    }
    const start = el.selectionStart ?? message.length
    const end = el.selectionEnd ?? message.length
    const next = `${message.slice(0, start)}${tag}${message.slice(end)}`
    setMessage(next)
    setConfirming(false)
    requestAnimationFrame(() => {
      el.focus()
      const cursor = start + tag.length
      el.setSelectionRange(cursor, cursor)
    })
  }

  const buildDefaultName = () => {
    const short = t(`${TK}.${segmentCard.shortNameKey}`)
    const stamp = new Date().toLocaleDateString(numberLocale)
    return `${short} · ${stamp}`
  }

  const handleSend = async () => {
    const text = message.trim()
    if (!text) {
      showToast(t(`${TK}.alertEmptyMessage`), 'warning')
      return
    }

    const name = campaignName.trim() || buildDefaultName()
    if (!name) {
      showToast(t(`${TK}.alertNameRequired`), 'warning')
      return
    }

    const apiMode = SMS_COMPOSER_MODE_TO_API[scheduleMode]
    let scheduledAtUtc: string | undefined
    if (apiMode === SmsCampaignScheduleMode.Scheduled) {
      if (!scheduleDate || !scheduleTime) {
        showToast(t(`${TK}.alertScheduleRequired`), 'warning')
        return
      }
      scheduledAtUtc = toScheduledAtUtc(scheduleDate, scheduleTime)
      if (!scheduledAtUtc) {
        showToast(t(`${TK}.alertScheduleRequired`), 'warning')
        return
      }
      if (new Date(scheduledAtUtc).getTime() <= Date.now()) {
        showToast(t(getErrorI18nKey('SMS_CAMPAIGN_SCHEDULED_AT_IN_PAST')), 'error')
        return
      }
    }

    if (!enoughCredits && apiMode !== SmsCampaignScheduleMode.Auto) {
      showToast(
        t(`${TK}.alertInsufficientCredits`, { need: totalSms, have: spendableCredits }),
        'error',
      )
      return
    }

    if (!confirming) {
      setConfirming(true)
      return
    }

    try {
      if (isEdit && campaignId) {
        await updateMutation.mutateAsync({
          id: campaignId,
          body: {
            name,
            audienceSegment: audience,
            messageBody: text,
            linkUrl: landingPage || undefined,
            scheduledAtUtc,
          },
        })
        onSaved(t(`${TK}.updateSuccess`, { name }))
        return
      }

      await createMutation.mutateAsync({
        name,
        audienceSegment: audience,
        messageBody: text,
        linkUrl: landingPage || undefined,
        scheduleMode: apiMode,
        scheduledAtUtc,
      })

      if (apiMode === SmsCampaignScheduleMode.SendNow) {
        onSaved(t(`${TK}.sendSuccessNow`, {
          total: totalSms,
          count: audienceCount,
          segment: t(`${TK}.${segmentCard.nameKey}`),
        }))
        return
      }
      if (apiMode === SmsCampaignScheduleMode.Scheduled) {
        onSaved(t(`${TK}.sendSuccessSchedule`, {
          total: totalSms,
          date: scheduleDate,
          time: scheduleTime,
        }))
        return
      }
      onSaved(t(`${TK}.sendSuccessAuto`, {
        segment: t(`${TK}.${segmentCard.nameKey}`),
      }))
    } catch (error) {
      showToast(t(getErrorI18nKey(getApiErrorCode(error))), 'error')
    }
  }

  if (!open) return null

  if (isEdit && campaignQuery.isError) {
    return (
      <div className="modal-overlay open" role="presentation" onClick={onClose}>
        <div className="modal" role="dialog" aria-modal="true">
          <div className="modal-header">
            <div className="modal-title">{t(`${TK}.composerTitle`)}</div>
            <button className="modal-close" type="button" onClick={onClose}>
              <CloseIcon className="marketing-icon" />
            </button>
          </div>
          <div className="modal-body">
            <p>{t(getErrorI18nKey(getApiErrorCode(campaignQuery.error)))}</p>
          </div>
        </div>
      </div>
    )
  }

  const whenLabel = scheduleMode === SmsComposerScheduleMode.Now
    ? t(`${TK}.confirmWhenNow`)
    : scheduleMode === SmsComposerScheduleMode.Schedule
      ? t(`${TK}.confirmWhenSchedule`, { date: scheduleDate, time: scheduleTime })
      : t(`${TK}.confirmWhenAuto`)

  const countLabel = new Intl.NumberFormat(numberLocale).format(audienceCount)
  const controlsDisabled = isSubmitting || isHydrating

  return (
    <div
      className="modal-overlay open"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget && !isSubmitting) onClose()
      }}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="composerModalTitle"
        aria-busy={controlsDisabled}
      >
        <div className="modal-header">
          <div className="modal-title" id="composerModalTitle">
            <MegaphoneIcon className="marketing-icon" />
            <span>{isEdit ? t(`${TK}.composerEditTitle`) : t(`${TK}.composerTitle`)}</span>
          </div>
          <button
            ref={closeBtnRef}
            className="modal-close"
            type="button"
            aria-label={t(`${TK}.closeComposer`)}
            disabled={isSubmitting}
            onClick={onClose}
          >
            <CloseIcon className="marketing-icon" />
          </button>
        </div>

        <div className="modal-body">
          <div className="field-group">
            <div className="field-label">{t(`${TK}.campaignNameLabel`)}</div>
            <input
              className="form-input"
              type="text"
              maxLength={200}
              value={campaignName}
              disabled={controlsDisabled}
              placeholder={t(`${TK}.campaignNamePlaceholder`)}
              onChange={(event) => {
                setCampaignName(event.target.value)
                setConfirming(false)
              }}
            />
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepSegment`)}</div>
            <div className="segment-grid">
              {SMS_CAMPAIGN_SEGMENT_CARDS.map((item) => {
                const count = getAudienceCount(audienceSummary, item.id)
                return (
                  <button
                    key={item.id}
                    className={`segment-btn${item.id === audience ? ' selected' : ''}`}
                    type="button"
                    disabled={controlsDisabled}
                    onClick={() => {
                      setAudience(item.id)
                      setConfirming(false)
                    }}
                  >
                    <span className="segment-btn-icon">{SEGMENT_ICON[item.id]}</span>
                    <span className="segment-btn-name">{t(`${TK}.${item.shortNameKey}`)}</span>
                    <span className="segment-btn-count">
                      {count.toLocaleString(numberLocale)} {t(`${TK}.countCustomers`)}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepTemplate`)}</div>
            <div className="template-list">
              {templates.map((tpl) => (
                <button
                  key={tpl.titleKey}
                  className="template-item"
                  type="button"
                  disabled={controlsDisabled}
                  onClick={() => {
                    setMessage(t(`${TK}.${tpl.textKey}`))
                    setConfirming(false)
                  }}
                >
                  <div className="template-item-title">
                    <SparklesIcon className="marketing-icon is-compact" />
                    <span>{t(`${TK}.${tpl.titleKey}`)}</span>
                  </div>
                  <div className="template-item-text">{t(`${TK}.${tpl.textKey}`)}</div>
                </button>
              ))}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepCompose`)}</div>
            <div className="sms-composer">
              <div className="sms-toolbar">
                <span>{t(`${TK}.insertTag`)}</span>
                {SMS_COMPOSER_TAGS.map((item) => (
                  <button
                    key={item.tag}
                    className="tag-btn"
                    type="button"
                    disabled={controlsDisabled}
                    onClick={() => insertTag(item.tag)}
                  >
                    {TAG_ICON[item.tag]}
                    <span>{t(`${TK}.${item.labelKey}`)}</span>
                  </button>
                ))}
              </div>
              <textarea
                ref={textareaRef}
                className="sms-textarea"
                value={message}
                disabled={controlsDisabled}
                placeholder={t(`${TK}.composePlaceholder`)}
                onChange={(event) => {
                  setMessage(event.target.value)
                  setConfirming(false)
                }}
              />
              <div className="sms-footer">
                <span>{t(`${TK}.stopDisclaimer`)}</span>
                <span className={`char-count${parts > 1 ? ' multi' : ''}`}>
                  {t(`${TK}.charCount`, {
                    units: estimate?.characterCount ?? localCharInfo.units,
                    parts,
                    encoding: encodingLabel,
                    perPart: estimate?.maxCharactersPerSegment ?? localCharInfo.perPart,
                  })}
                </span>
              </div>
            </div>

            <div className="sms-preview">
              <div className="sms-preview-label">
                <SmartphoneIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.previewLabel`)}</span>
              </div>
              <div className="sms-bubble">
                {previewHtml ? (
                  <span dangerouslySetInnerHTML={{ __html: previewHtml }} />
                ) : (
                  <span className="sms-preview-empty">{t(`${TK}.previewEmpty`)}</span>
                )}
              </div>
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepLanding`)}</div>
            <div className="lp-attach-row">
              <select
                className="form-select"
                value={landingPage}
                disabled={controlsDisabled}
                onChange={(event) => {
                  setLandingPage(event.target.value)
                  setConfirming(false)
                }}
              >
                {SMS_LANDING_PAGE_OPTIONS.map((option) => (
                  <option key={option.value || 'none'} value={option.value}>
                    {t(`${TK}.${option.labelKey}`)}
                  </option>
                ))}
              </select>
              <button
                className="btn-outline"
                type="button"
                disabled
                title={t(`${TK}.createLandingPageSoon`)}
                aria-label={t(`${TK}.createLandingPageSoon`)}
              >
                <PlusIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.createLandingPage`)}</span>
              </button>
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">{t(`${TK}.stepSchedule`)}</div>
            <div className="schedule-options">
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Now ? ' selected' : ''}`}
                type="button"
                disabled={controlsDisabled || isEdit}
                onClick={() => {
                  setScheduleMode(SmsComposerScheduleMode.Now)
                  setConfirming(false)
                }}
              >
                <span className="schedule-opt-icon"><ZapIcon className="marketing-icon" /></span>
                <span className="schedule-opt-label">{t(`${TK}.scheduleNow`)}</span>
              </button>
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Schedule ? ' selected' : ''}`}
                type="button"
                disabled={controlsDisabled || isEdit}
                onClick={() => {
                  setScheduleMode(SmsComposerScheduleMode.Schedule)
                  setConfirming(false)
                }}
              >
                <span className="schedule-opt-icon"><ClockIcon className="marketing-icon" /></span>
                <span className="schedule-opt-label">{t(`${TK}.scheduleLater`)}</span>
              </button>
              <button
                className={`schedule-opt${scheduleMode === SmsComposerScheduleMode.Auto ? ' selected' : ''}`}
                type="button"
                disabled={controlsDisabled || isEdit}
                onClick={() => {
                  setScheduleMode(SmsComposerScheduleMode.Auto)
                  setConfirming(false)
                }}
              >
                <span className="schedule-opt-icon"><RefreshCwIcon className="marketing-icon" /></span>
                <span className="schedule-opt-label">{t(`${TK}.scheduleAuto`)}</span>
              </button>
            </div>
            {scheduleMode === SmsComposerScheduleMode.Schedule ? (
              <div className="time-input-row">
                <input
                  className="form-input"
                  type="date"
                  value={scheduleDate}
                  disabled={controlsDisabled}
                  onChange={(event) => {
                    setScheduleDate(event.target.value)
                    setConfirming(false)
                  }}
                />
                <input
                  className="form-input"
                  type="time"
                  value={scheduleTime}
                  disabled={controlsDisabled}
                  onChange={(event) => {
                    setScheduleTime(event.target.value)
                    setConfirming(false)
                  }}
                />
              </div>
            ) : null}
          </div>

          {confirming ? (
            <div className="confirm-box show" ref={confirmBoxRef}>
              <div className="confirm-title">
                <AlertTriangleIcon className="marketing-icon is-compact" />
                <span>{t(`${TK}.confirmTitle`)}</span>
              </div>
              <div className="confirm-detail">
                {t(`${TK}.confirmDetailSegment`)}{' '}
                <strong>{t(`${TK}.${segmentCard.nameKey}`)}</strong> ({countLabel} {t(`${TK}.countCustomers`)})
                <br />
                {t(`${TK}.confirmDetailSms`)}{' '}
                <strong>{totalSms} SMS</strong>{' '}
                ({parts} {t(`${TK}.perCustomer`)}, {encodingLabel})
                <br />
                {t(`${TK}.confirmDetailCost`)}{' '}
                <strong>${cost}</strong> — {t(`${TK}.confirmDetailDeduct`, { count: totalSms })}
                <br />
                {t(`${TK}.confirmDetailWhen`)} <strong>{whenLabel}</strong>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer">
          <div className={`cost-preview${enoughCredits ? '' : ' warn'}`}>
            <div className="cost-preview-label">
              {enoughCredits
                ? t(`${TK}.costEstimate`)
                : t(`${TK}.costInsufficient`, { credits: spendableCredits })}
            </div>
            <div className="cost-preview-amount">
              {t(`${TK}.costBreakdown`, {
                customers: audienceCount,
                parts,
                total: totalSms,
                cost,
              })}
            </div>
          </div>
          <div className="modal-footer-actions">
            <button
              className="btn-outline"
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
            >
              {t(`${TK}.cancel`)}
            </button>
            <button
              className="btn-primary"
              type="button"
              disabled={controlsDisabled || (!enoughCredits && scheduleMode !== SmsComposerScheduleMode.Auto)}
              onClick={() => void handleSend()}
            >
              <SendIcon className="marketing-icon" />
              <span>
                {isSubmitting
                  ? t(`${TK}.saving`)
                  : confirming
                    ? t(`${TK}.confirmSend`)
                    : isEdit
                      ? t(`${TK}.saveCampaign`)
                      : t(`${TK}.sendCampaign`)}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
