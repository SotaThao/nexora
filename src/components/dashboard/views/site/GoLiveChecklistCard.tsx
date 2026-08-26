import React, { useState } from 'react'
import { Check, Copy, Download, QrCode } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { logger } from '../../../../utils/logger'
import { buildPublicBookingFormUrl } from '../../../../utils/publicBookingUrl'
import { buildPublicQrImageUrl, downloadQrCode, QR_IMAGE_SIZES } from '../../../../utils/qrUtils'

interface GoLiveChecklistCardProps {
  businessSlug: string
}

export const GoLiveChecklistCard: React.FC<GoLiveChecklistCardProps> = ({ businessSlug }) => {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [copied, setCopied] = useState(false)
  const [isDownloadingQr, setIsDownloadingQr] = useState(false)
  const publicUrl = buildPublicBookingFormUrl(businessSlug)
  const qrPreviewUrl = publicUrl
    ? buildPublicQrImageUrl(publicUrl, QR_IMAGE_SIZES.panel)
    : ''

  const handleCopy = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleDownloadQr = async () => {
    if (!publicUrl || isDownloadingQr) return

    setIsDownloadingQr(true)
    try {
      await downloadQrCode(
        buildPublicQrImageUrl(publicUrl, QR_IMAGE_SIZES.print),
        'booking-qr.png',
      )
    } catch (error) {
      logger.error('[GoLiveChecklistCard] Failed to download booking QR code.', error)
      showToast(t('errors.generic'), 'error')
    } finally {
      setIsDownloadingQr(false)
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-indigo-800/60">
        <div>
          <span className="inline-block px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 mb-2">
            ✓ Website Đã Kích Hoạt
          </span>
          <h3 className="text-xl sm:text-2xl font-bold">Đưa Tiệm Của Bạn Lên Mạng Ngay Hôm Nay</h3>
          <p className="text-xs sm:text-sm text-slate-300 mt-1">Dán link bên dưới vào trang Facebook và Google Business để nhận khách đặt hẹn tự động</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg transition-transform active:scale-95"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Đã sao chép link!' : 'Copy Link Trang Web'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Step 1 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h4 className="font-bold text-sm">Facebook "Book Now"</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mở Fanpage tiệm ➔ Chỉnh sửa nút hành động ➔ Chọn <strong>Đặt Ngay (Book Now)</strong> ➔ Dán link trang web tiệm.
          </p>
        </div>

        {/* Step 2 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm">
            2
          </div>
          <h4 className="font-bold text-sm">Google Maps & Business</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Vào Google Business Profile ➔ Mục Liên kết đặt hẹn (Appointment Links) ➔ Dán link để khách tìm trên bản đồ bấm đặt ngay.
          </p>
        </div>

        {/* Step 3 */}
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold text-sm">
            3
          </div>
          <h4 className="font-bold text-sm">In Mã QR Standee Bàn</h4>
          <p className="text-xs text-slate-300 leading-relaxed">
            Tải mã QR chất lượng cao đặt tại bàn làm móng để khách tự quét xem menu và đặt hẹn cho lần tiếp theo.
          </p>
          {qrPreviewUrl ? (
            <div className="flex items-center gap-3 pt-2">
              <div className="h-16 w-16 shrink-0 rounded-lg bg-white p-1.5">
                <img src={qrPreviewUrl} alt="Mã QR đặt lịch" className="h-full w-full" />
              </div>
              <button
                type="button"
                onClick={handleDownloadQr}
                disabled={isDownloadingQr}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-lg border border-purple-300/30 bg-purple-500/20 px-3 py-2 text-xs font-bold text-purple-100 hover:bg-purple-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDownloadingQr ? <QrCode className="h-4 w-4 animate-pulse" /> : <Download className="h-4 w-4" />}
                <span>Tải mã QR chất lượng cao</span>
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
