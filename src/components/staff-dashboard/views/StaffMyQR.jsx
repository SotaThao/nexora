// StaffMyQR — personal QR/link + per-business staff QR (placeholder QR visuals).
import { useState, useEffect } from 'react'
import { Share2, Copy, QrCode, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { useMerchantSetup, useSaveMerchantSetup } from '../../../data/hooks/useMerchantSetup'
import { useAddNotification } from '../../../data/hooks/useNotifications'
import { logger } from '../../../utils/logger'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function StaffMyQR() {
  const { t, currentLanguage } = useTranslation()
  const { staffMember, linkedBusinesses } = useStaffAccount()
  const { showToast } = useNotification()

  // Data layer — merchant setup (read + write) and notifications (write)
  const { data: merchantSetupData = null } = useMerchantSetup()
  const saveMerchantSetupMutation = useSaveMerchantSetup()
  const addNotificationMutation = useAddNotification()

  const [showScanner, setShowScanner] = useState(false)
  const [scanStatus, setScanStatus] = useState('idle') // 'idle' | 'checking' | 'success' | 'error'
  const [customInviteLink, setCustomInviteLink] = useState('')
  const [scanTimeout, setScanTimeout] = useState(null)
  const [zoomedQr, setZoomedQr] = useState(null)

  useEffect(() => {
    return () => {
      if (scanTimeout) clearTimeout(scanTimeout)
    }
  }, [scanTimeout])

  const staffLink = `${window.location.origin}/?flow=staff-invite&staff=${staffMember.id || ''}`

  const handleCopy = () => {
    try {
      navigator.clipboard?.writeText(staffLink)
      showToast(
        t('components.staff_dashboard.views.StaffMyQR.text_1_bb3266'),
        'success'
      )
    } catch (e) {
      /* clipboard unavailable — no-op */
    }
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({ title: 'NEXORA Staff', text: staffMember.id, url: staffLink }).catch(() => {})
    } else {
      handleCopy()
    }
  }

  const handleOpenScan = () => {
    setShowScanner(true)
    setScanStatus('idle')
    setCustomInviteLink('')
  }

  const simulateMerchantScan = (businessNameInput) => {
    const bizName = businessNameInput.trim()
    if (!bizName) return

    if (scanTimeout) clearTimeout(scanTimeout)
    setScanStatus('checking')

    const timer = setTimeout(() => {
      logger.debug('[DEBUG STAFF QR] Scanned merchant:', bizName)

      // 1. Use cached merchant setup from hook; fall back to a mock if none exists yet
      let merchantSetup = merchantSetupData
        ? { ...merchantSetupData }
        : {
            businessInfo: {
              name: bizName,
              industry: 'Nail Salon',
              address: '',
              phone: '',
              email: ''
            },
            staffList: []
          }

      // Ensure staffList is an array
      if (!Array.isArray(merchantSetup.staffList)) {
        merchantSetup = { ...merchantSetup, staffList: [] }
      }

      // Check if this technician is already in the merchant's staff list
      const isAlreadyInRoster = merchantSetup.staffList.some(s => s.id === staffMember.id)
      const existingMember = merchantSetup.staffList.find(s => s.id === staffMember.id)

      if (isAlreadyInRoster && existingMember?.status !== 'Pending Acceptance' && existingMember?.status !== 'Pending Setup') {
        setScanStatus('error')
        showToast(
          currentLanguage === 'vi'
            ? `Bạn đã được liên kết với tiệm ${bizName}!`
            : `You are already linked to ${bizName}!`,
          'warning'
        )
        return
      }

      setScanStatus('success')
      showToast(
        currentLanguage === 'vi'
          ? `Gửi yêu cầu tham gia tiệm ${bizName} thành công!`
          : `Successfully sent join request to ${bizName}!`,
        'success'
      )

      // Build updated staff list
      let updatedStaffList
      if (!isAlreadyInRoster) {
        const newMember = {
          id: staffMember.id,
          fullName: staffMember.fullName || 'Mia Tran',
          nickname: staffMember.nickname || 'Mia T.',
          position: staffMember.position || 'Nail Tech',
          avatar: staffMember.avatar || '',
          phone: staffMember.phone || '',
          email: staffMember.email || '',
          isActive: false,
          status: 'Pending Acceptance',
          flowType: 'Self-Service Join (via QR)',
          paymentAccounts: {
            vlinkpay: staffMember.paymentAccounts?.vlinkpay || '',
            zelle: staffMember.paymentAccounts?.zelle || '',
            venmo: staffMember.paymentAccounts?.venmo || '',
            cashapp: staffMember.paymentAccounts?.cashapp || '',
            paypal: staffMember.paymentAccounts?.paypal || '',
            bankwire: staffMember.paymentAccounts?.bankwire || '',
            applecash: staffMember.paymentAccounts?.applecash || ''
          },
          payoutConfigs: staffMember.payoutConfigs || {}
        }
        updatedStaffList = [...merchantSetup.staffList, newMember]
      } else {
        // If in roster but pending, update flow type or make sure it's correct
        updatedStaffList = merchantSetup.staffList.map(s =>
          s.id === staffMember.id
            ? { ...s, status: 'Pending Acceptance', isActive: false, flowType: 'Self-Service Join (via QR)' }
            : s
        )
      }

      // Save updated merchant setup via mutation (invalidates query cache automatically)
      saveMerchantSetupMutation.mutate({ ...merchantSetup, staffList: updatedStaffList })

      // 2. Add notification to merchant via mutation
      const newNoti = {
        id: `noti-join-${staffMember.id}-${Date.now()}`,
        staffId: staffMember.id,
        type: 'feedback_alert',
        title: t('components.staff_dashboard.views.StaffMyQR.text_2_b8a2a1'),
        message: currentLanguage === 'vi'
          ? `Thợ ${staffMember.fullName} đã quét QR và yêu cầu gia nhập tiệm của bạn.`
          : `Technician ${staffMember.fullName} scanned your QR and requested to link with your salon.`,
        time: t('components.staff_dashboard.views.StaffMyQR.text_3_fc2c2e'),
        read: false,
        linkTab: 'staff'
      }
      addNotificationMutation.mutate(newNoti)

      // Close scanner modal after a short delay
      setTimeout(() => {
        setShowScanner(false)
        setScanStatus('idle')
      }, 1000)

    }, 800)

    setScanTimeout(timer)
  }

  const handleUrlOrTextSubmit = (val) => {
    let bizName = val.trim()
    if (!bizName) return

    // Check if it's a URL
    try {
      if (bizName.startsWith('http://') || bizName.startsWith('https://')) {
        const url = new URL(bizName)
        const params = new URLSearchParams(url.search)
        const bizParam = params.get('biz')
        if (bizParam) {
          bizName = bizParam
        }
      }
    } catch (e) {
      logger.error('URL parsing failed, treating as plain text', e)
    }

    simulateMerchantScan(bizName)
  }

  const handleRequestUnlink = (businessName) => {
    const confirmed = window.confirm(
      currentLanguage === 'vi'
        ? `Bạn có chắc chắn muốn hủy liên kết với tiệm ${businessName}? Hành động này sẽ gỡ bỏ bạn khỏi danh sách nhân viên của tiệm ngay lập tức.`
        : `Are you sure you want to unlink from ${businessName}? This will immediately remove you from the salon's roster.`
    )
    if (!confirmed) return

    try {
      if (merchantSetupData) {
        const updatedSetup = { ...merchantSetupData }
        if (Array.isArray(updatedSetup.staffList)) {
          updatedSetup.staffList = updatedSetup.staffList.filter(s => s.id !== staffMember.id)
        }
        if (Array.isArray(updatedSetup.touchPoints)) {
          updatedSetup.touchPoints = updatedSetup.touchPoints.filter(
            tp => !(tp.type === 'Staff QR' && tp.staffId === staffMember.id)
          )
        }
        // Save via mutation (invalidates query cache automatically)
        saveMerchantSetupMutation.mutate(updatedSetup)
      }

      // Add a notification for the merchant via mutation
      const newNoti = {
        id: `noti-unlink-${staffMember.id}-${Date.now()}`,
        staffId: staffMember.id,
        type: 'feedback_alert',
        title: t('components.staff_dashboard.views.StaffMyQR.text_4_837d0d'),
        message: currentLanguage === 'vi'
          ? `Thợ ${staffMember.fullName} đã hủy liên kết khỏi tiệm của bạn.`
          : `Technician ${staffMember.fullName} has unlinked from your salon.`,
        time: t('components.staff_dashboard.views.StaffMyQR.text_3_fc2c2e'),
        read: false,
        linkTab: 'staff'
      }
      addNotificationMutation.mutate(newNoti)

      showToast(
        t('components.staff_dashboard.views.StaffMyQR.text_5_b750e4'),
        'success'
      )
    } catch (e) {
      logger.error(e)
    }
  }

  return (
    <div className="space-y-4">
      <style>{`
        @keyframes scannerLaser {
          0% { top: 0%; opacity: 0.8; }
          50% { top: 100%; opacity: 0.8; }
          100% { top: 0%; opacity: 0.8; }
        }
        .animate-scannerLaser {
          animation: scannerLaser 2.5s linear infinite;
        }
        @keyframes scaleUp {
          0% { transform: scale(0.85); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
      `}</style>

      <section className={`${panel} text-center`}>
        <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.qr.personal_title')}</h3>
        <p className="mt-1 text-xs text-nexoraMuted">{t('staff_dashboard.qr.personal_sub')}</p>
        <div className="mx-auto my-4 h-44 w-44 rounded-xl bg-white border border-nexoraBorder/60 p-3.5 flex items-center justify-center shadow-sm select-none overflow-hidden shrink-0">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(staffLink)}`}
            alt="Scan QR"
            className="h-full w-full object-contain"
          />
        </div>
        <div className="text-sm font-bold text-nexoraText">{t('staff_dashboard.staff_id')}: {staffMember.id}</div>
        <div className="mt-3 space-y-2">
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-nexoraElectric to-nexoraViolet py-3 text-sm font-extrabold text-white transition hover:opacity-90"
          >
            <Share2 className="h-4 w-4" />
            {t('staff_dashboard.qr.share')}
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-nexoraBorder bg-nexoraSurface py-3 text-sm font-bold text-nexoraBrand transition hover:bg-nexoraCanvas"
          >
            <Copy className="h-4 w-4" />
            {t('staff_dashboard.qr.copy_link')}
          </button>
        </div>
      </section>

      <section className={panel}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.linked_businesses')}</h3>
          <button
            type="button"
            onClick={handleOpenScan}
            className="flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-nexoraBrand transition shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{t('components.staff_dashboard.views.StaffMyQR.text_6_c9dfba')}</span>
          </button>
        </div>

        <div className="divide-y divide-nexoraBorder">
          {linkedBusinesses.map((biz) => {
            const isNotConnected = biz.status === 'Pending Link'
            const techSlug = `staff/${slugify(staffMember.nickname || staffMember.fullName || '')}`
            const tipUrl = `${window.location.origin}${window.location.pathname}?flow=customer&tech=${encodeURIComponent(techSlug)}&biz=${encodeURIComponent(biz.businessName)}`

            return (
              <div key={biz.businessStaffLinkId} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 border-b border-nexoraBorder last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  {biz.status === 'Active' && (
                    <div
                      onClick={() => setZoomedQr({ url: tipUrl, title: biz.businessName })}
                      className="h-12 w-12 bg-white border border-slate-200 p-1 rounded-xl cursor-zoom-in hover:scale-105 transition-transform flex items-center justify-center shrink-0 shadow-sm relative group"
                      title={t('components.staff_dashboard.views.StaffMyQR.text_7_597d46')}
                    >
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(tipUrl)}`}
                        alt="Tipping QR"
                        className="h-full w-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-[8px] font-black">
                        ZOOM
                      </div>
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-nexoraText">{biz.displayName} @ {biz.businessName}</div>
                    <div className="truncate text-xs text-nexoraMuted">
                      {biz.status === 'Active'
                        ? (t('components.staff_dashboard.views.StaffMyQR.text_8_080b40'))
                        : t('staff_dashboard.qr.business_sub')
                      }
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 font-sans justify-end">
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-black ${
                    biz.status === 'Active' ? 'bg-emerald-50 text-emerald-600' :
                    biz.status === 'Pending Approval' ? 'bg-amber-50 text-amber-600' :
                    biz.status === 'Pending Unlink' ? 'bg-rose-50 text-rose-600' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {biz.status === 'Active' ? (t('components.staff_dashboard.views.StaffMyQR.text_9_d2aca7')) :
                     biz.status === 'Pending Approval' ? (t('components.staff_dashboard.views.StaffMyQR.text_10_e00c37')) :
                     biz.status === 'Pending Unlink' ? (t('components.staff_dashboard.views.StaffMyQR.text_11_0f6793')) :
                     (t('components.staff_dashboard.views.StaffMyQR.text_12_5788c4'))}
                  </span>
                  {biz.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleRequestUnlink(biz.businessName)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 shadow-sm cursor-pointer select-none"
                    >
                      <span>{t('components.staff_dashboard.views.StaffMyQR.text_13_9bd0ce')}</span>
                    </button>
                  )}
                  {isNotConnected && (
                    <button
                      type="button"
                      onClick={handleOpenScan}
                      className="inline-flex items-center gap-1 rounded-lg bg-nexoraBrand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-opacity-95 shadow-sm"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{t('components.staff_dashboard.views.StaffMyQR.text_14_6beed4')}</span>
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 rounded-xl border border-dashed border-nexoraBorder bg-nexoraCanvas p-3 text-xs leading-relaxed text-nexoraMuted">
          {t('staff_dashboard.qr.note')}
        </p>
      </section>

      {/* Simulated QR Code Camera Scanner Modal Overlay */}
      {showScanner && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowScanner(false)
                setScanStatus('idle')
              }}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
              title="Close Scanner"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {t('components.staff_dashboard.views.StaffMyQR.text_15_b0ef32')}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-normal">
                {t('components.staff_dashboard.views.StaffMyQR.text_16_5f25d1')}
              </p>
            </div>

            {/* Scanning viewport */}
            <div className="relative h-44 w-44 mx-auto rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden flex items-center justify-center shadow-inner">
              {/* Corner brackets */}
              <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-sm"></div>
              <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-sm"></div>
              <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-sm"></div>
              <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-sm"></div>

              {/* QR icon background */}
              {scanStatus === 'checking' ? (
                <Loader2 className="h-16 w-16 text-amber-500 animate-spin" />
              ) : scanStatus === 'success' ? (
                <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-scaleUp" />
              ) : scanStatus === 'error' ? (
                <XCircle className="h-16 w-16 text-rose-500" />
              ) : (
                <QrCode className="h-16 w-16 text-slate-300 opacity-80 animate-pulse" />
              )}

              {/* Laser line */}
              {scanStatus === 'idle' && (
                <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-amber-500 to-transparent shadow-[0_0_8px_#f59e0b] animate-scannerLaser"></div>
              )}
            </div>

            {/* Custom URL or text input */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {t('components.staff_dashboard.views.StaffMyQR.text_17_0bdef9')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    t('components.staff_dashboard.views.StaffMyQR.text_18_42f6d9')
                  }
                  className="flex-grow h-9 px-3 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 text-slate-700 bg-slate-50"
                  value={customInviteLink}
                  onChange={(e) => setCustomInviteLink(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => handleUrlOrTextSubmit(customInviteLink)}
                  className="h-9 px-3 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
                >
                  {t('components.staff_dashboard.views.StaffMyQR.text_19_e9c6ac')}
                </button>
              </div>
            </div>

            {/* Quick simulation buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">
                {t('components.staff_dashboard.views.StaffMyQR.text_20_3fd4ec')}
              </span>
              
              <div className="flex flex-col gap-2">
                {/* Standard Successful Scan button */}
                <button
                  type="button"
                  onClick={() => simulateMerchantScan('Demo Salon A')}
                  className="w-full py-2 bg-gradient-to-r from-nexoraElectric to-nexoraViolet text-white rounded-xl text-xs font-black uppercase tracking-wider transition-opacity hover:opacity-90 shadow-sm"
                >
                  Demo Salon A
                </button>

                <button
                  type="button"
                  onClick={() => simulateMerchantScan('VLINK Nail Spa')}
                  className="w-full py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  VLINK Nail Spa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Zoomed Tipping QR Modal */}
      {zoomedQr && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedQr(null)}
        >
          <div
            className="bg-white border border-slate-100 rounded-3xl max-w-sm w-full p-6 text-center space-y-5 relative overflow-hidden text-slate-800 shadow-2xl animate-scaleUp cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setZoomedQr(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-100"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Header */}
            <div className="space-y-1 text-center">
              <span className="text-[9px] font-black text-nexoraBrand uppercase tracking-widest block">
                {t('components.staff_dashboard.views.StaffMyQR.text_21_683ade')}
              </span>
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                {zoomedQr.title}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-normal">
                {currentLanguage === 'vi'
                  ? `Khách hàng quét mã này để gửi tip trực tiếp cho ${staffMember.nickname || staffMember.fullName}`
                  : `Customers scan this QR to tip ${staffMember.nickname || staffMember.fullName} directly`}
              </p>
            </div>

            {/* QR viewport */}
            <div className="relative h-56 w-56 mx-auto rounded-2xl border-2 border-slate-100 bg-white p-4 flex items-center justify-center shadow-md">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(zoomedQr.url)}`}
                alt="Personal Tipping QR"
                className="h-full w-full object-contain"
              />
            </div>

            {/* Link Copy */}
            <div className="space-y-2 text-left">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                {t('components.staff_dashboard.views.StaffMyQR.text_22_5994bb')}
              </label>
              <div className="flex gap-2 bg-slate-50 rounded-xl p-1.5 border border-slate-100 items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono truncate max-w-[210px] pl-2">
                  {zoomedQr.url}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      navigator.clipboard?.writeText(zoomedQr.url)
                      showToast(
                        t('components.staff_dashboard.views.StaffMyQR.text_23_156215'),
                        'success'
                      )
                    } catch (e) {}
                  }}
                  className="h-7 px-3 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{t('components.staff_dashboard.views.StaffMyQR.text_24_cd2bb1')}</span>
                </button>
              </div>
            </div>

            {/* Simulation button */}
            <div className="pt-2 border-t border-slate-100">
              <a
                href={zoomedQr.url}
                target="_blank"
                rel="opener"
                className="inline-flex w-full items-center justify-center gap-1 text-[11px] font-black text-nexoraBrand hover:underline tracking-wide bg-nexoraBrandSoft py-2 rounded-xl transition"
              >
                <span>{t('components.staff_dashboard.views.StaffMyQR.text_25_2badc7')}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
