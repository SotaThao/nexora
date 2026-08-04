import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import DOMPurify from 'dompurify'
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle,
  DollarSign,
  Download,
  FileText,
  Gift,
  Link2,
  Printer,
  Search,
  Settings,
  Smartphone,
  Tablet,
  UploadCloud,
  Users,
  X,
  XCircle,
} from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { buildPublicQrImageUrl } from '../../../../data/repositories/publicQr'
import { downloadQrCode, QR_IMAGE_SIZES } from '../../../../utils/qrUtils'
import { buildQrPosterHtml, buildQrPreviewHtml } from './buildQrPreviewHtml'
import {
  buildQrAbsoluteUrl,
  buildQrPublicPath,
  getQrLeadTime,
  getQrPromoLabel,
  QR_CODES_TK,
  QR_FORM_DEFAULT_PROMO_ID,
  QR_FORM_DEFAULT_SLUG,
  QR_LEAD_STATUS_CLASS,
  QR_LEAD_STATUS_I18N_KEY,
  QR_LEADS_MOCK,
  QR_PREVIEW_TOAST_MESSAGE,
  QR_PROMOS_MOCK,
  QR_RICH_TEXT_ATTR,
  QR_RICH_TEXT_TAGS,
  QrLeadStatus,
  type QrLeadMock,
  type QrPromoMock,
} from './constants'

const TK = QR_CODES_TK

function richHtml(html: string) {
  return {
    __html: DOMPurify.sanitize(html, {
      ALLOWED_TAGS: [...QR_RICH_TEXT_TAGS],
      ALLOWED_ATTR: [...QR_RICH_TEXT_ATTR],
    }),
  }
}

type VerifyResultState =
  | { kind: 'empty' }
  | { kind: 'bad'; messageKey: 'verifyEmpty' | 'verifyNotFound'; code?: string }
  | { kind: 'used'; lead: QrLeadMock }
  | { kind: 'ok'; lead: QrLeadMock; promo: QrPromoMock }
  | { kind: 'marked'; lead: QrLeadMock }

export default function BookingQrCodesPanel() {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()

  const [guideOpen, setGuideOpen] = useState(true)
  const [campaignName, setCampaignName] = useState('')
  const [promoId, setPromoId] = useState(QR_FORM_DEFAULT_PROMO_ID)
  const [formTitle, setFormTitle] = useState('')
  const [formBody, setFormBody] = useState('')
  const [slug, setSlug] = useState(QR_FORM_DEFAULT_SLUG)
  const [leads, setLeads] = useState<QrLeadMock[]>(() => QR_LEADS_MOCK.map((lead) => ({ ...lead })))
  const [verifyInput, setVerifyInput] = useState('')
  const [verifyResult, setVerifyResult] = useState<VerifyResultState>({ kind: 'empty' })
  const [kioskOpen, setKioskOpen] = useState(false)

  useEffect(() => {
    setCampaignName(t(`${TK}.defaultCampaignName`))
    setFormTitle(t(`${TK}.defaultFormTitle`))
    setFormBody(t(`${TK}.defaultFormBody`))
  }, [currentLanguage, t])

  const kioskIframeRef = useRef<HTMLIFrameElement>(null)
  const previewIframeRef = useRef<HTMLIFrameElement>(null)
  const kioskExitRef = useRef<HTMLButtonElement>(null)
  const kioskOpenerRef = useRef<HTMLElement | null>(null)

  const selectedPromo = useMemo(
    () => QR_PROMOS_MOCK.find((promo) => promo.id === promoId) ?? QR_PROMOS_MOCK[0],
    [promoId],
  )

  const publicPath = buildQrPublicPath(slug)
  const absoluteUrl = buildQrAbsoluteUrl(slug)
  const qrImageSrc = buildPublicQrImageUrl(absoluteUrl, QR_IMAGE_SIZES.panel)

  const previewHtml = useMemo(
    () =>
      buildQrPreviewHtml({
        title: formTitle,
        body: formBody,
        promo: selectedPromo,
        language: currentLanguage,
        kiosk: false,
      }),
    [currentLanguage, formBody, formTitle, selectedPromo],
  )

  const kioskHtml = useMemo(
    () =>
      buildQrPreviewHtml({
        title: formTitle,
        body: formBody,
        promo: selectedPromo,
        language: currentLanguage,
        kiosk: true,
      }),
    [currentLanguage, formBody, formTitle, selectedPromo],
  )

  const closeKiosk = useCallback(() => {
    setKioskOpen(false)
    const opener = kioskOpenerRef.current
    if (opener && typeof opener.focus === 'function') opener.focus()
    kioskOpenerRef.current = null
  }, [])

  const openKiosk = () => {
    kioskOpenerRef.current = document.activeElement as HTMLElement | null
    setKioskOpen(true)
  }

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const previewWindow = previewIframeRef.current?.contentWindow
      const kioskWindow = kioskIframeRef.current?.contentWindow
      if (event.source !== previewWindow && event.source !== kioskWindow) return
      const data = event.data
      if (!data || data.type !== QR_PREVIEW_TOAST_MESSAGE) return
      if (typeof data.message !== 'string' || !data.message.trim()) return
      const level = data.level === 'success' ? 'success' : 'error'
      showToast(data.message, level)
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [showToast])

  useEffect(() => {
    if (!kioskOpen) return
    kioskExitRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeKiosk()
      }
    }

    const onMessage = (event: MessageEvent) => {
      if (event.source !== kioskIframeRef.current?.contentWindow) return
      if (!event.data || event.data.type !== 'nexora-kiosk-close') return
      closeKiosk()
    }

    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('message', onMessage)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('message', onMessage)
    }
  }, [closeKiosk, kioskOpen])

  const handleVerify = () => {
    const raw = verifyInput.trim().toUpperCase()
    if (!raw) {
      setVerifyResult({ kind: 'bad', messageKey: 'verifyEmpty' })
      return
    }
    const lead = leads.find((item) => item.code.toUpperCase() === raw)
    if (!lead) {
      setVerifyResult({ kind: 'bad', messageKey: 'verifyNotFound', code: raw })
      return
    }
    if (lead.status === QrLeadStatus.CodeUsed) {
      setVerifyResult({ kind: 'used', lead })
      return
    }
    const promo =
      QR_PROMOS_MOCK.find((item) => lead.code.toUpperCase().startsWith(item.codePrefix))
      ?? selectedPromo
    setVerifyResult({ kind: 'ok', lead, promo })
  }

  const markCodeUsed = (code: string) => {
    const usedAt = new Date().toLocaleTimeString(currentLanguage === 'vi' ? 'vi-VN' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })
    let markedLead: QrLeadMock | undefined
    setLeads((prev) =>
      prev.map((lead) => {
        if (lead.code !== code) return lead
        markedLead = {
          ...lead,
          status: QrLeadStatus.CodeUsed,
          usedAt,
        }
        return markedLead
      }),
    )
    if (markedLead) setVerifyResult({ kind: 'marked', lead: markedLead })
    setVerifyInput('')
  }

  const handleDownloadPng = async () => {
    try {
      await downloadQrCode(qrImageSrc, `qr-${slug.trim() || 'nexora'}.png`)
      showToast(t(`${TK}.downloadSuccess`), 'success')
    } catch {
      showToast(t(`${TK}.qrNotReady`), 'error')
    }
  }

  const handlePrintPoster = async () => {
    try {
      const response = await fetch(qrImageSrc)
      if (!response.ok) throw new Error('QR fetch failed')
      const blob = await response.blob()
      const qrDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error('QR read failed'))
        reader.readAsDataURL(blob)
      })
      const posterHtml = buildQrPosterHtml({
        promoLabel: getQrPromoLabel(selectedPromo, currentLanguage),
        qrDataUrl,
        publicPath,
        title: t(`${TK}.posterTitle`),
        step1: t(`${TK}.posterStep1`),
        step2: t(`${TK}.posterStep2`),
        step3: t(`${TK}.posterStep3`),
        secondary: t(`${TK}.posterSecondary`),
      })
      const frame = document.createElement('iframe')
      frame.style.cssText = 'position:fixed;width:0;height:0;border:none;'
      document.body.appendChild(frame)
      frame.onload = () => {
        frame.contentWindow?.focus()
        frame.contentWindow?.print()
        window.setTimeout(() => frame.remove(), 2000)
      }
      frame.srcdoc = posterHtml
    } catch {
      showToast(t(`${TK}.qrNotReady`), 'error')
    }
  }

  const handlePublish = () => {
    showToast(
      t(`${TK}.publishSuccess`, {
        name: campaignName,
        promo: getQrPromoLabel(selectedPromo, currentLanguage),
        link: absoluteUrl,
      }),
      'success',
    )
  }

  const promoLabel = (promo: QrPromoMock) => getQrPromoLabel(promo, currentLanguage)

  return (
    <div className="panel-qr-codes" id="panel-qr-codes">
      <div className="marketing-panel-head">
        <div>
          <p>{t(`${TK}.subtitle`)}</p>
        </div>
        <div className="qr-head-actions">
          <button
            className="booking-secondary-button"
            type="button"
            onClick={() => setGuideOpen((open) => !open)}
          >
            <BookOpen className="marketing-icon" aria-hidden="true" />
            <span>{guideOpen ? t(`${TK}.hideGuide`) : t(`${TK}.showGuide`)}</span>
          </button>
          <button className="booking-primary-button" type="button" onClick={handlePublish}>
            <UploadCloud className="marketing-icon" aria-hidden="true" />
            <span>{t(`${TK}.publish`)}</span>
          </button>
        </div>
      </div>

      {guideOpen ? (
        <div className="guide-panel" id="qrGuide">
          <div className="guide-cols">
            <div>
              <div className="guide-phase-title marketing-icon-label" style={{ color: '#b794f6' }}>
                <Settings className="marketing-icon is-compact" aria-hidden="true" />
                <span>{t(`${TK}.guidePhase1Title`)}</span>
              </div>
              <div className="guide-step">
                <div className="guide-num">1</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep1`))} />
              </div>
              <div className="guide-step">
                <div className="guide-num">2</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep2`))} />
              </div>
              <div className="guide-step">
                <div className="guide-num">3</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep3`))} />
              </div>
            </div>
            <div>
              <div className="guide-phase-title marketing-icon-label" style={{ color: '#0891b2' }}>
                <Smartphone className="marketing-icon is-compact" aria-hidden="true" />
                <span>{t(`${TK}.guidePhase2Title`)}</span>
              </div>
              <div className="guide-step">
                <div className="guide-num c2">4</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep4`))} />
              </div>
              <div className="guide-step">
                <div className="guide-num c2">5</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep5`))} />
              </div>
              <div className="guide-step">
                <div className="guide-num c2">6</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep6`))} />
              </div>
            </div>
            <div>
              <div
                className="guide-phase-title marketing-icon-label"
                style={{ color: 'var(--nexora-success)' }}
              >
                <DollarSign className="marketing-icon is-compact" aria-hidden="true" />
                <span>{t(`${TK}.guidePhase3Title`)}</span>
              </div>
              <div className="guide-step">
                <div className="guide-num c3">7</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep7`))} />
              </div>
              <div className="guide-step">
                <div className="guide-num c3">8</div>
                <div dangerouslySetInnerHTML={richHtml(t(`${TK}.guideStep8`))} />
              </div>
            </div>
          </div>
          <div className="guide-tips">
            <span className="marketing-status">
              <AlertTriangle className="marketing-icon is-compact" aria-hidden="true" />
              <span dangerouslySetInnerHTML={richHtml(t(`${TK}.guideTips`))} />
            </span>
          </div>
        </div>
      ) : null}

      <div className="qr-builder">
        <div className="qr-form-stack">
          <div className="qr-section">
            <div className="qr-section-title">
              <Gift className="marketing-icon is-compact" aria-hidden="true" />
              <span>{t(`${TK}.sectionPromo`)}</span>
            </div>
            <div className="qr-field">
              <label className="qr-field-label" htmlFor="qrName">
                {t(`${TK}.campaignName`)}
              </label>
              <input
                className="booking-input"
                id="qrName"
                value={campaignName}
                onChange={(event) => setCampaignName(event.target.value)}
              />
            </div>
            <div className="qr-field" style={{ marginBottom: 0 }}>
              <label className="qr-field-label" htmlFor="qrPromo">
                {t(`${TK}.selectPromo`)}
              </label>
              <select
                className="booking-input"
                id="qrPromo"
                value={promoId}
                onChange={(event) => setPromoId(event.target.value)}
              >
                {QR_PROMOS_MOCK.map((promo) => (
                  <option key={promo.id} value={promo.id}>
                    {promoLabel(promo)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="qr-section">
            <div className="qr-section-title">
              <FileText className="marketing-icon is-compact" aria-hidden="true" />
              <span>{t(`${TK}.sectionForm`)}</span>
            </div>
            <div className="qr-field">
              <label className="qr-field-label" htmlFor="qrFormTitle">
                {t(`${TK}.formTitle`)}
              </label>
              <input
                className="booking-input"
                id="qrFormTitle"
                value={formTitle}
                onChange={(event) => setFormTitle(event.target.value)}
              />
            </div>
            <div className="qr-field" style={{ marginBottom: 0 }}>
              <label className="qr-field-label" htmlFor="qrQuestion">
                {t(`${TK}.formBody`)}
              </label>
              <textarea
                className="booking-input"
                id="qrQuestion"
                value={formBody}
                onChange={(event) => setFormBody(event.target.value)}
              />
            </div>
            <div className="consent-note">
              <AlertTriangle className="marketing-icon is-compact" aria-hidden="true" />
              <span dangerouslySetInnerHTML={richHtml(t(`${TK}.consentNote`))} />
            </div>
          </div>

          <div className="qr-section">
            <div className="qr-section-title">
              <Link2 className="marketing-icon is-compact" aria-hidden="true" />
              <span>{t(`${TK}.sectionLink`)}</span>
            </div>
            <label className="qr-field-label" htmlFor="qrSlug">
              {t(`${TK}.slugLabel`)}
            </label>
            <input
              className="booking-input"
              id="qrSlug"
              value={slug}
              onChange={(event) => setSlug(event.target.value)}
            />
            <div className="link-preview" id="qrLinkPreview">
              {publicPath}
            </div>
            <div className="qr-display-row">
              <div className="qr-box" id="qrCanvas">
                <img src={qrImageSrc} alt={t(`${TK}.qrAlt`)} width={140} height={140} />
              </div>
              <div className="qr-actions">
                <button className="booking-secondary-button" type="button" onClick={handleDownloadPng}>
                  <Download className="marketing-icon" aria-hidden="true" />
                  <span>{t(`${TK}.downloadPng`)}</span>
                </button>
                <button className="booking-secondary-button" type="button" onClick={handlePrintPoster}>
                  <Printer className="marketing-icon" aria-hidden="true" />
                  <span>{t(`${TK}.printPoster`)}</span>
                </button>
                <button className="booking-secondary-button" type="button" onClick={openKiosk}>
                  <Tablet className="marketing-icon" aria-hidden="true" />
                  <span>{t(`${TK}.kioskMode`)}</span>
                </button>
                <div
                  className="lead-flow-note"
                  dangerouslySetInnerHTML={richHtml(t(`${TK}.leadFlowNote`))}
                />
              </div>
            </div>
          </div>

          <div className="qr-section">
            <div className="qr-section-title">
              <CheckCircle className="marketing-icon is-compact" aria-hidden="true" />
              <span>{t(`${TK}.sectionVerify`)}</span>
            </div>
            <label className="qr-field-label" htmlFor="verifyInput">
              {t(`${TK}.verifyLabel`)}
            </label>
            <div className="verify-row">
              <input
                className="booking-input"
                id="verifyInput"
                placeholder={t(`${TK}.verifyPlaceholder`)}
                autoComplete="off"
                value={verifyInput}
                onChange={(event) => setVerifyInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleVerify()
                }}
              />
              <button className="booking-primary-button" type="button" onClick={handleVerify}>
                <Search className="marketing-icon" aria-hidden="true" />
                <span>{t(`${TK}.verifyButton`)}</span>
              </button>
            </div>
            {verifyResult.kind !== 'empty' ? (
              <div
                className={`verify-result show ${
                  verifyResult.kind === 'ok' || verifyResult.kind === 'marked'
                    ? 'ok'
                    : verifyResult.kind === 'used'
                      ? 'used'
                      : 'bad'
                }`}
                role="status"
                aria-live="polite"
                aria-atomic="true"
              >
                {verifyResult.kind === 'bad' ? (
                  <span className="marketing-status">
                    {verifyResult.messageKey === 'verifyEmpty' ? (
                      <AlertTriangle className="marketing-icon is-compact" aria-hidden="true" />
                    ) : (
                      <XCircle className="marketing-icon is-compact" aria-hidden="true" />
                    )}
                    <span>
                      {verifyResult.messageKey === 'verifyEmpty'
                        ? t(`${TK}.verifyEmpty`)
                        : t(`${TK}.verifyNotFound`, { code: verifyResult.code ?? '' })}
                    </span>
                  </span>
                ) : null}
                {verifyResult.kind === 'used' ? (
                  <span className="marketing-status">
                    <AlertTriangle className="marketing-icon is-compact" aria-hidden="true" />
                    <span>
                      {t(`${TK}.verifyUsed`, {
                        when: verifyResult.lead.usedAt
                          ? t(`${TK}.verifyUsedWhen`, { time: verifyResult.lead.usedAt })
                          : '',
                        name: verifyResult.lead.name,
                        phone: verifyResult.lead.phone,
                      })}
                    </span>
                  </span>
                ) : null}
                {verifyResult.kind === 'ok' ? (
                  <div className="marketing-status">
                    <CheckCircle className="marketing-icon is-compact" aria-hidden="true" />
                    <div>
                      <div className="verify-name">{verifyResult.lead.name}</div>
                      <div className="verify-meta">
                        {verifyResult.lead.phone}
                        {' • '}
                        {promoLabel(verifyResult.promo)}
                        {' • '}
                        {t(`${TK}.verifyReceivedAt`, {
                          time: getQrLeadTime(verifyResult.lead, currentLanguage),
                        })}
                      </div>
                      <button
                        className="booking-primary-button"
                        type="button"
                        onClick={() => markCodeUsed(verifyResult.lead.code)}
                      >
                        <Check className="marketing-icon is-compact" aria-hidden="true" />
                        <span>{t(`${TK}.markUsed`)}</span>
                      </button>
                    </div>
                  </div>
                ) : null}
                {verifyResult.kind === 'marked' ? (
                  <span className="marketing-status">
                    <CheckCircle className="marketing-icon is-compact" aria-hidden="true" />
                    <span>{t(`${TK}.markUsedSuccess`, { name: verifyResult.lead.name })}</span>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="qr-section">
            <div className="qr-section-title">
              <Users className="marketing-icon is-compact" aria-hidden="true" />
              <span>{t(`${TK}.sectionLeads`)}</span>
            </div>
            <div className="qr-leads-scroll">
              <table className="booking-table qr-leads-table">
                <thead>
                  <tr>
                    <th>{t(`${TK}.colTime`)}</th>
                    <th>{t(`${TK}.colName`)}</th>
                    <th>{t(`${TK}.colPhone`)}</th>
                    <th>{t(`${TK}.colCode`)}</th>
                    <th>{t(`${TK}.colStatus`)}</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <tr key={lead.id}>
                      <td data-label={t(`${TK}.colTime`)}>{getQrLeadTime(lead, currentLanguage)}</td>
                      <td data-label={t(`${TK}.colName`)}>{lead.name}</td>
                      <td data-label={t(`${TK}.colPhone`)}>{lead.phone}</td>
                      <td className="qr-lead-code" data-label={t(`${TK}.colCode`)}>
                        {lead.code}
                      </td>
                      <td data-label={t(`${TK}.colStatus`)}>
                        <span className={`call-status ${QR_LEAD_STATUS_CLASS[lead.status]}`}>
                          {t(`${TK}.${QR_LEAD_STATUS_I18N_KEY[lead.status]}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="qr-preview">
          <div className="preview-bar">
            <div className="preview-dot" style={{ background: '#ff5f57' }} />
            <div className="preview-dot" style={{ background: '#febc2e' }} />
            <div className="preview-dot" style={{ background: '#28c840' }} />
            <div className="preview-url" id="qrPreviewUrl">
              {publicPath}
            </div>
            <Smartphone className="marketing-icon is-compact" aria-hidden="true" />
          </div>
          <iframe
            id="qrIframe"
            ref={previewIframeRef}
            title={t(`${TK}.previewTitle`)}
            srcDoc={previewHtml}
          />
        </div>
      </div>

      {kioskOpen ? (
        <div
          className="kiosk-overlay open"
          id="kioskOverlay"
          role="dialog"
          aria-modal="true"
          aria-labelledby="kioskTitle"
          aria-hidden="false"
        >
          <div className="kiosk-bar">
            <span className="kiosk-hint" id="kioskTitle">
              <Tablet className="marketing-icon" aria-hidden="true" />
              <span>{t(`${TK}.kioskHint`)}</span>
            </span>
            <button
              className="booking-secondary-button"
              type="button"
              id="kioskExit"
              ref={kioskExitRef}
              onClick={closeKiosk}
              onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                event.preventDefault()
                kioskIframeRef.current?.contentWindow?.postMessage(
                  {
                    type: 'nexora-kiosk-focus',
                    edge: event.shiftKey ? 'last' : 'first',
                  },
                  '*',
                )
              }}
            >
              <X className="marketing-icon" aria-hidden="true" />
              <span>{t(`${TK}.kioskExit`)}</span>
            </button>
          </div>
          <iframe
            id="kioskIframe"
            ref={kioskIframeRef}
            title={t(`${TK}.kioskIframeTitle`)}
            srcDoc={kioskHtml}
          />
        </div>
      ) : null}
    </div>
  )
}
