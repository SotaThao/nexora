import { useMemo, useState } from 'react'
import { X, Share2, CreditCard, Coins, CheckCircle, Hourglass, Loader2 } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import {
  formatCurrency,
  formatTransactionDateTime,
  isAwaitingShopConfirmation,
  isShopConfirmed,
} from '../utils'
import { WalletLogos } from '../constants'
import { logger } from '../../../utils/logger'
import { buildQrImageUrl, slugify, toLocalCustomerTouchUrl } from '../../../utils/staffTipUrl'
import { useConfirmMerchantTipsReceipt } from '../../../data/hooks/useTransactions'
import QrModal from './QrModal'

function buildStaffCodeLookup(staff = []) {
  const map = new Map()
  for (const member of staff) {
    const profileId = member.staffProfileId || member.id
    const code = member.staffCode?.trim()
    if (profileId && code) {
      map.set(profileId, code)
    }
  }
  return map
}

function resolveStaffCode(staffProfileId, staffCodeByProfileId, directCode) {
  const fromTx = typeof directCode === 'string' ? directCode.trim() : ''
  if (fromTx) return fromTx
  if (staffProfileId && staffCodeByProfileId.has(staffProfileId)) {
    return staffCodeByProfileId.get(staffProfileId)
  }
  return ''
}

function normalizeTipItems(tx, staffCodeByProfileId = new Map()) {
  if (!Array.isArray(tx?.tipItems)) return []
  return tx.tipItems
    .map((item) => ({
      staffProfileId: item?.staffProfileId ?? '',
      staffName: item?.staffName ?? '',
      staffCode: resolveStaffCode(item?.staffProfileId, staffCodeByProfileId, item?.staffCode),
      amount: item?.amount ?? 0,
    }))
    .filter((item) => item.staffProfileId || item.staffName)
}

function findTouchpointForTx(tx, touchpoints = []) {
  if (!touchpoints.length) return null
  const txTouchpointName = (tx?.touchpoint || '').trim().toLowerCase()
  return (
    touchpoints.find((tp) => tp.id === tx.touchPointId) ||
    touchpoints.find((tp) => tp.name === tx.touchpoint) ||
    touchpoints.find((tp) => slugify(tp.name || '') === slugify(txTouchpointName)) ||
    touchpoints.find((tp) => tp.type === 'FrontDesk') ||
    touchpoints[0] ||
    null
  )
}

function resolveTouchPointQrUrl({
  touchpoint,
  tx,
  businessName = '',
  businessSlug = '',
}) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (touchpoint?.url) {
    return toLocalCustomerTouchUrl(String(touchpoint.url), origin)
  }

  const resolvedBusinessSlug = businessSlug || slugify(businessName)
  const touchPointSlug =
    touchpoint?.slug ||
    touchpoint?.id ||
    (tx?.touchpoint ? slugify(tx.touchpoint) : '') ||
    (touchpoint?.name ? slugify(touchpoint.name) : '')

  if (!resolvedBusinessSlug || !touchPointSlug) return null

  return `${origin}/touch/${resolvedBusinessSlug}/${touchPointSlug}`
}

function renderStaffCodeBadge(code) {
  return (
    <span className="inline-flex rounded-md border border-nexoraBrand/20 bg-nexoraBrandSoft px-2 py-0.5 font-mono text-xs font-extrabold tracking-wide text-nexoraBrand">
      {code || 'N/A'}
    </span>
  )
}

function getPaymentMethodLogo(method) {
  const norm = (method || '').toLowerCase().replace(/\s+/g, '')
  if (norm === 'card') {
    return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
  }
  if (norm === 'crypto') {
    return <Coins className="h-[18px] w-[18px] text-amber-500" />
  }
  const logo = WalletLogos[norm]
  if (logo) return logo
  return <CreditCard className="h-[18px] w-[18px] text-slate-500" />
}

function truncateMid(str: string, head = 8, tail = 6): string {
  if (!str || str.length <= head + tail + 3) return str
  return `${str.slice(0, head)}…${str.slice(-tail)}`
}

function renderStatusBadge(tx, t) {
  if (isAwaitingShopConfirmation(tx)) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-50 text-violet-600 border border-violet-100/50 mt-2">
        <Hourglass className="h-3 w-3" />
        {t('merchant_dashboard.tips.awaiting_shop_confirmation')}
      </span>
    )
  }
  const status = tx?.status
  const s = (status || '').toLowerCase()
  if (s === 'completed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 mt-2">
        {status}
      </span>
    )
  }
  if (s === 'success' || s === 'succeeded' || s === 'confirmed') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100/50 mt-2">
        {t('components.dashboard.views.ReportsView.success')}
      </span>
    )
  }
  if (s === 'pending' || s === 'processing' || s === 'initiated') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100/50 mt-2">
        {t('components.dashboard.views.ReportsView.pending')}
      </span>
    )
  }
  if (s === 'failed' || s === 'skipped') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100/50 mt-2">
        {t('components.dashboard.views.ReportsView.failed')}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-50 text-slate-600 border border-slate-100/50 mt-2">
      {status}
    </span>
  )
}

export default function TransactionDetailModal({
  selectedTx,
  onClose,
  businessName = '',
  businessSlug = '',
  touchpoints = [],
  staff = [],
}) {
  const { t, currentLanguage } = useTranslation()
  const { showToast } = useNotification()
  const [qrTarget, setQrTarget] = useState(null)
  const confirmReceiptMutation = useConfirmMerchantTipsReceipt()

  const staffCodeByProfileId = useMemo(() => buildStaffCodeLookup(staff), [staff])
  const tipItems = useMemo(
    () => normalizeTipItems(selectedTx, staffCodeByProfileId),
    [selectedTx, staffCodeByProfileId],
  )
  const isMultiStaff = Boolean(selectedTx?.isMultiStaff && tipItems.length > 0)
  const touchpoint = useMemo(
    () => findTouchpointForTx(selectedTx, touchpoints),
    [selectedTx, touchpoints],
  )
  const touchPointQrUrl = useMemo(
    () =>
      resolveTouchPointQrUrl({
        touchpoint,
        tx: selectedTx,
        businessName,
        businessSlug,
      }),
    [touchpoint, selectedTx, businessName, businessSlug],
  )

  if (!selectedTx) return null

  const touchPointName = touchpoint?.name || selectedTx.touchpoint || 'Touch Point'

  const openTouchPointQr = () => {
    if (!touchPointQrUrl) return

    setQrTarget({
      name: touchPointName,
      subtitle: businessName,
      slug: touchpoint?.slug || touchpoint?.id || '',
      url: touchPointQrUrl,
      qrImageUrl: touchpoint?.qrImageUrl,
      isActive: touchpoint?.isActive !== false,
      isStaffQr: false,
    })
  }

  const handleShareTouchPoint = async () => {
    if (!touchPointQrUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: touchPointName,
          url: touchPointQrUrl,
        })
      } catch (err) {
        logger.error(err)
      }
    } else {
      await navigator.clipboard.writeText(touchPointQrUrl)
      showToast(t('components.dashboard.modals.TransactionDetailModal.tippingLinkCopiedTo'), 'success')
    }
  }

  const renderQrThumb = (size = 80) => {
    if (!touchPointQrUrl) return null
    const qrImageSrc = buildQrImageUrl(touchPointQrUrl, size, touchpoint?.qrImageUrl)

    return (
      <button
        type="button"
        onClick={openTouchPointQr}
        className="group relative shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:border-nexoraBrand hover:shadow-md cursor-pointer"
        title={t('components.dashboard.views.StaffView.clickToEnlarge')}
      >
        <img
          src={qrImageSrc}
          alt={`QR for ${touchPointName}`}
          className="h-20 w-20 object-contain"
        />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-lg bg-nexoraBrand/80 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-[9px] font-black uppercase tracking-widest text-white">
            PREVIEW
          </span>
        </div>
      </button>
    )
  }

  const singleStaffProfileId = selectedTx.staffProfileId
  const singleStaffName = selectedTx.staffName
  const singleStaffCode = resolveStaffCode(
    singleStaffProfileId,
    staffCodeByProfileId,
    selectedTx.staffCode,
  )

  const awaitingShopConfirmation = isAwaitingShopConfirmation(selectedTx)
  const shopConfirmed = isShopConfirmed(selectedTx)
  const isConfirming = confirmReceiptMutation.isPending

  const handleConfirmReceipt = () => {
    if (!selectedTx?.id || isConfirming) return
    confirmReceiptMutation.mutate([selectedTx.id], {
      onSuccess: (result) => {
        // Close only when the tip was fully confirmed; on partial/full failure
        // keep the modal open so the owner sees the unchanged pending state.
        if (result.failedIds.length === 0) onClose()
      },
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-nexoraBorder shadow-2xl p-6 relative">
          <div className="flex items-center justify-between border-b border-nexoraBorder pb-4 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase text-nexoraMuted tracking-wider">
                {t('dashboard.activity_log.modal_title')}
              </span>
              <p className="text-xs text-nexoraMuted mt-0.5">
                {isMultiStaff
                  ? t('components.dashboard.modals.TransactionDetailModal.multiStaffTip')
                  : t('components.dashboard.modals.TransactionDetailModal.singleStaffTip')}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-nexoraMuted hover:text-nexoraText transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-5">
            <div className="flex flex-col items-center justify-center py-4 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold text-nexoraMuted uppercase tracking-wider">
                {t('dashboard.activity_log.col_amount')}
              </span>
              <h3 className="text-3xl font-black text-nexoraText mt-1">
                {formatCurrency(selectedTx.amount)}
              </h3>

              {renderStatusBadge(selectedTx, t)}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs border-t border-nexoraBorder pt-4">
              {/* Row 1: ID | Date */}
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_id')}
                </span>
                <span
                  className="font-mono text-[11px] font-semibold text-nexoraText block mt-0.5"
                  title={selectedTx.id}
                >
                  {truncateMid(selectedTx.id)}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_time')}
                </span>
                <span className="font-semibold text-nexoraText block mt-0.5">
                  {formatTransactionDateTime(selectedTx.dateTime, currentLanguage)}
                </span>
              </div>
              {/* Row 2: Payment Method | Touch Point */}
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_payment')}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {getPaymentMethodLogo(selectedTx.paymentMethod)}
                  <span className="font-semibold text-nexoraText">{selectedTx.paymentMethod}</span>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_tp')}
                </span>
                <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.touchpoint || '—'}</span>
              </div>
              {/* Row 3 (single-staff only): Staff */}
              {!isMultiStaff ? (
                <div className="col-span-2">
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_staff')}
                  </span>
                  <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-nexoraText">{singleStaffName || '—'}</span>
                    {renderStaffCodeBadge(singleStaffCode)}
                  </span>
                </div>
              ) : null}
            </div>

            {isMultiStaff ? (
              <div className="rounded-xl border border-nexoraBorder bg-nexoraCanvas/40 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-nexoraBorder/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-nexoraMuted">
                    {t('components.dashboard.modals.TransactionDetailModal.staffBreakdown')}
                  </span>
                  <span className="text-[10px] font-semibold text-nexoraSubtle">
                    {t('components.dashboard.modals.TransactionDetailModal.recipients', {
                      count: tipItems.length,
                    })}
                  </span>
                </div>
                {tipItems.map((item) => (
                  <div
                    key={item.staffProfileId || item.staffName}
                    className="flex items-center justify-between gap-3 rounded-lg border border-nexoraBorder bg-white px-3 py-2.5"
                  >
                    <div className="min-w-0 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs font-bold text-nexoraText">{item.staffName || '—'}</span>
                      {renderStaffCodeBadge(item.staffCode)}
                    </div>
                    <p className="text-xl font-black text-nexoraBrand shrink-0">
                      {formatCurrency(item.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {awaitingShopConfirmation ? (
              <div className="rounded-xl border border-violet-100 bg-violet-50/60 p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <Hourglass className="h-4 w-4 shrink-0 text-violet-500 mt-0.5" />
                  <p className="text-[11px] leading-normal text-violet-700">
                    {t('merchant_dashboard.tips.confirm_receipt_help')}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isConfirming}
                  onClick={handleConfirmReceipt}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                >
                  {isConfirming ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  {t('merchant_dashboard.tips.confirm_receipt')}
                </button>
              </div>
            ) : null}

            {shopConfirmed ? (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
                <CheckCircle className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <p className="text-[11px] leading-normal text-emerald-700">
                  {t('merchant_dashboard.tips.confirmed_help', {
                    time: formatTransactionDateTime(selectedTx.merchantConfirmedAt, currentLanguage),
                  })}
                </p>
              </div>
            ) : null}

            {touchPointQrUrl ? (
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-center">
                {renderQrThumb(160)}
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[9px] font-black uppercase text-nexoraMuted tracking-widest">
                    {t('components.dashboard.modals.TransactionDetailModal.tippingQrCode')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {t('components.dashboard.modals.TransactionDetailModal.scanToTipTouchPoint')}
                  </span>
                  <button
                    type="button"
                    onClick={handleShareTouchPoint}
                    className="mt-2.5 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-[10px] font-black uppercase tracking-wider text-indigo-600 transition-colors w-max cursor-pointer"
                  >
                    <Share2 className="h-3 w-3" />
                    {t('components.dashboard.modals.TransactionDetailModal.shareLink')}
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {qrTarget ? (
        <QrModal
          target={qrTarget}
          businessName={businessName}
          onClose={() => setQrTarget(null)}
        />
      ) : null}
    </>
  )
}
