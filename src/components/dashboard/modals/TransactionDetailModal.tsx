import { useMemo, useState } from 'react'
import { X, Share2, CreditCard, Coins } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { formatCurrency } from '../utils'
import { WalletLogos } from '../constants'
import { logger } from '../../../utils/logger'
import { resolveMerchantStaffTipQr, buildQrImageUrl } from '../../../utils/staffTipUrl'
import QrModal from './QrModal'

function normalizeTipItems(tx) {
  if (!Array.isArray(tx?.tipItems)) return []
  return tx.tipItems
    .map((item) => ({
      staffProfileId: item?.staffProfileId ?? '',
      staffName: item?.staffName ?? '',
      amount: item?.amount ?? 0,
    }))
    .filter((item) => item.staffProfileId || item.staffName)
}

function findTouchpointForTx(tx, touchpoints = []) {
  if (!touchpoints.length) return null
  return (
    touchpoints.find((tp) => tp.id === tx.touchPointId) ||
    touchpoints.find((tp) => tp.name === tx.touchpoint) ||
    touchpoints.find((tp) => tp.type === 'FrontDesk') ||
    touchpoints[0] ||
    null
  )
}

function findStaffMember(staffProfileId, staff = []) {
  return staff.find((member) => member.staffProfileId === staffProfileId) ?? null
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

function renderStatusBadge(status, t) {
  const s = (status || '').toLowerCase()
  if (s === 'success' || s === 'succeeded' || s === 'confirmed' || s === 'completed') {
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
  touchpoints = [],
  staff = [],
}) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [qrTarget, setQrTarget] = useState(null)

  const tipItems = useMemo(() => normalizeTipItems(selectedTx), [selectedTx])
  const isMultiStaff = Boolean(selectedTx?.isMultiStaff && tipItems.length > 0)

  if (!selectedTx) return null

  const openStaffQr = (staffProfileId, staffName) => {
    if (!staffProfileId) return
    const member = findStaffMember(staffProfileId, staff)
    const masterTouchpoint = findTouchpointForTx(selectedTx, touchpoints)
    const staffTipQr = resolveMerchantStaffTipQr(staffProfileId, {
      businessName,
      masterTouchpoint,
    })
    if (!staffTipQr?.tipUrl) return

    setQrTarget({
      name: `Personal QR - ${staffName || member?.fullName || 'Staff'}`,
      subtitle: member?.position || 'Staff QR',
      slug: staffTipQr.touchPointSlug,
      url: staffTipQr.tipUrl,
      qrImageUrl: staffTipQr.qrImageUrl,
      isActive: member?.isActive !== false,
      isStaffQr: true,
    })
  }

  const buildShareUrl = (staffProfileId) => {
    const masterTouchpoint = findTouchpointForTx(selectedTx, touchpoints)
    return resolveMerchantStaffTipQr(staffProfileId, {
      businessName,
      masterTouchpoint,
    })?.tipUrl
  }

  const handleShare = async (staffProfileId, staffName) => {
    const shareUrl = buildShareUrl(staffProfileId)
    if (!shareUrl) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Tip ${staffName}`,
          url: shareUrl,
        })
      } catch (err) {
        logger.error(err)
      }
    } else {
      await navigator.clipboard.writeText(shareUrl)
      showToast(t('components.dashboard.modals.TransactionDetailModal.tippingLinkCopiedTo'), 'success')
    }
  }

  const renderQrThumb = (staffProfileId, staffName, size = 80) => {
    const shareUrl = buildShareUrl(staffProfileId)
    if (!shareUrl) return null
    const qrImageSrc = buildQrImageUrl(shareUrl, size)

    return (
      <button
        type="button"
        onClick={() => openStaffQr(staffProfileId, staffName)}
        className="group flex shrink-0 flex-col items-center gap-1 rounded-lg border border-slate-200 bg-white p-1.5 shadow-sm transition hover:border-nexoraBrand hover:shadow-md cursor-pointer"
        title={t('components.dashboard.views.StaffView.clickToEnlarge')}
      >
        <img
          src={qrImageSrc}
          alt={`QR for ${staffName}`}
          className="h-16 w-16 object-contain"
        />
        <span className="text-[8px] font-bold uppercase tracking-wider text-nexoraMuted group-hover:text-nexoraBrand">
          {t('components.dashboard.views.StaffView.clickToEnlarge')}
        </span>
      </button>
    )
  }

  const singleStaffProfileId = selectedTx.staffProfileId
  const singleStaffName = selectedTx.staffName

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
              {isMultiStaff ? (
                <span className="mt-2 rounded-full bg-violet-50 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-violet-600 border border-violet-100">
                  {t('staff_dashboard.tips.multi_staff')}
                </span>
              ) : null}
              {renderStatusBadge(selectedTx.status, t)}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-4 text-xs border-t border-nexoraBorder pt-4">
              <div className="col-span-2">
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_id')}
                </span>
                <span className="font-mono text-[11px] font-semibold text-nexoraText block mt-0.5 break-all">
                  {selectedTx.id}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_time')}
                </span>
                <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.dateTime}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_payment')}
                </span>
                <div className="flex items-center gap-1.5 mt-1">
                  {getPaymentMethodLogo(selectedTx.paymentMethod)}
                  <span className="font-semibold text-nexoraText">{selectedTx.paymentMethod}</span>
                </div>
              </div>
              <div className={isMultiStaff ? 'col-span-2' : ''}>
                <span className="text-[10px] font-bold text-nexoraMuted block">
                  {t('dashboard.activity_log.col_tp')}
                </span>
                <span className="font-semibold text-nexoraText block mt-0.5">{selectedTx.touchpoint || '—'}</span>
              </div>
              {!isMultiStaff ? (
                <div>
                  <span className="text-[10px] font-bold text-nexoraMuted block">
                    {t('dashboard.activity_log.col_staff')}
                  </span>
                  <span className="font-semibold text-nexoraText block mt-0.5">
                    {singleStaffName || '—'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-400 block mt-0.5 break-all">
                    {t('dashboard.activity_log.staff_id')}: {singleStaffProfileId || 'N/A'}
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
                    className="flex items-center gap-3 rounded-lg border border-nexoraBorder bg-white p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-nexoraText truncate">{item.staffName || '—'}</p>
                      <p className="font-mono text-[10px] text-slate-400 mt-0.5 break-all">
                        {t('dashboard.activity_log.staff_id')}: {item.staffProfileId || 'N/A'}
                      </p>
                      <p className="text-sm font-extrabold text-nexoraBrand mt-1.5">
                        {formatCurrency(item.amount)}
                      </p>
                      {item.staffProfileId ? (
                        <button
                          type="button"
                          onClick={() => handleShare(item.staffProfileId, item.staffName)}
                          className="mt-2 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                        >
                          <Share2 className="h-3 w-3" />
                          {t('components.dashboard.modals.TransactionDetailModal.shareLink')}
                        </button>
                      ) : null}
                    </div>
                    {item.staffProfileId ? renderQrThumb(item.staffProfileId, item.staffName) : null}
                  </div>
                ))}
              </div>
            ) : singleStaffProfileId ? (
              <div className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100 items-center">
                {renderQrThumb(singleStaffProfileId, singleStaffName, 160)}
                <div className="flex flex-col text-left min-w-0">
                  <span className="text-[9px] font-black uppercase text-nexoraMuted tracking-widest">
                    {t('components.dashboard.modals.TransactionDetailModal.tippingQrCode')}
                  </span>
                  <span className="text-[11px] text-slate-500 mt-1 leading-normal">
                    {t('components.dashboard.modals.TransactionDetailModal.scanToTipThis')}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleShare(singleStaffProfileId, singleStaffName)}
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
