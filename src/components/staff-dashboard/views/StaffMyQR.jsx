// StaffMyQR — personal QR/link + per-business staff QR (placeholder QR visuals).
import { useState, useEffect } from 'react'
import { Share2, Copy, QrCode, X, Loader2, CheckCircle2, XCircle } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'
import { useStaffAccount } from '../../../contexts/StaffAccountContext'
import { useNotification } from '../../../contexts/NotificationContext'
import { storage } from '../../../utils/storage'

const panel = 'rounded-2xl border border-nexoraBorder bg-nexoraSurface p-4 shadow-sm'

const slugify = (str = '') => str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export default function StaffMyQR() {
  const { t, currentLanguage } = useTranslation()
  const { staffMember, linkedBusinesses } = useStaffAccount()
  const { showToast } = useNotification()

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
        currentLanguage === 'vi' ? 'Đã sao chép liên kết!' : 'Link copied to clipboard!',
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
      console.log('[DEBUG STAFF QR] Scanned merchant:', bizName)

      // 1. Get nexora_merchant_setup from localStorage
      let merchantSetup = null
      try {
        const saved = storage.getItem('nexora_merchant_setup')
        if (saved) {
          merchantSetup = JSON.parse(saved)
        }
      } catch (e) {
        console.error(e)
      }

      // If it doesn't exist, create a mock one so the simulation works beautifully
      if (!merchantSetup) {
        merchantSetup = {
          businessInfo: {
            name: bizName,
            industry: 'Nail Salon',
            address: '123 Beauty Lane, San Jose, CA 95112',
            phone: '(408) 555-0123',
            email: 'owner@goldenglownails.com'
          },
          staffList: []
        }
      }

      // Ensure staffList is an array
      if (!Array.isArray(merchantSetup.staffList)) {
        merchantSetup.staffList = []
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

      // If not already in roster, add them
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
        merchantSetup.staffList.push(newMember)
      } else {
        // If in roster but pending, update flow type or make sure it's correct
        existingMember.status = 'Pending Acceptance'
        existingMember.isActive = false
        existingMember.flowType = 'Self-Service Join (via QR)'
      }

      // Save back to local storage
      storage.setItem('nexora_merchant_setup', JSON.stringify(merchantSetup))

      // 2. Add notification to merchant
      let notifications = []
      try {
        const savedNotis = storage.getItem('nexora_notifications')
        if (savedNotis) {
          notifications = JSON.parse(savedNotis)
        }
      } catch (e) {
        console.error(e)
      }

      const newNoti = {
        id: `noti-join-${staffMember.id}-${Date.now()}`,
        staffId: staffMember.id,
        type: 'feedback_alert',
        title: currentLanguage === 'vi' ? 'Yêu cầu gia nhập qua QR' : 'Join Request (via QR)',
        message: currentLanguage === 'vi'
          ? `Thợ ${staffMember.fullName} đã quét QR và yêu cầu gia nhập tiệm của bạn.`
          : `Technician ${staffMember.fullName} scanned your QR and requested to link with your salon.`,
        time: currentLanguage === 'vi' ? 'Vừa xong' : 'Just now',
        read: false,
        linkTab: 'staff'
      }
      notifications = [newNoti, ...notifications]
      storage.setItem('nexora_notifications', JSON.stringify(notifications))

      // Trigger storage event so that both merchant dashboard and staff dashboard contexts update in real-time
      window.dispatchEvent(new Event('storage'))

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
      console.error('URL parsing failed, treating as plain text', e)
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
      const savedSetup = storage.getItem('nexora_merchant_setup')
      if (savedSetup) {
        const parsed = JSON.parse(savedSetup)
        if (Array.isArray(parsed.staffList)) {
          parsed.staffList = parsed.staffList.filter(s => s.id !== staffMember.id)
        }
        if (Array.isArray(parsed.touchPoints)) {
          parsed.touchPoints = parsed.touchPoints.filter(tp => !(tp.type === 'Staff QR' && tp.staffId === staffMember.id))
        }
        storage.setItem('nexora_merchant_setup', JSON.stringify(parsed))
      }

      // Add a notification for the merchant
      let notifications = []
      try {
        const savedNotis = storage.getItem('nexora_notifications')
        if (savedNotis) {
          notifications = JSON.parse(savedNotis)
        }
      } catch (e) {}

      const newNoti = {
        id: `noti-unlink-${staffMember.id}-${Date.now()}`,
        staffId: staffMember.id,
        type: 'feedback_alert',
        title: currentLanguage === 'vi' ? 'Đã hủy liên kết' : 'Unlinked',
        message: currentLanguage === 'vi'
          ? `Thợ ${staffMember.fullName} đã hủy liên kết khỏi tiệm của bạn.`
          : `Technician ${staffMember.fullName} has unlinked from your salon.`,
        time: currentLanguage === 'vi' ? 'Vừa xong' : 'Just now',
        read: false,
        linkTab: 'staff'
      }
      notifications = [newNoti, ...notifications]
      storage.setItem('nexora_notifications', JSON.stringify(notifications))

      // Trigger storage event to update both dashboards
      window.dispatchEvent(new Event('storage'))

      showToast(
        currentLanguage === 'vi'
          ? 'Đã hủy liên kết với tiệm thành công.'
          : 'Successfully unlinked from the salon.',
        'success'
      )
    } catch (e) {
      console.error(e)
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
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] py-3 text-sm font-extrabold text-white transition hover:opacity-90"
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
          <h3 className="text-base font-extrabold text-nexoraText">{t('staff_dashboard.home.linked_businesses') || 'Linked Businesses'}</h3>
          <button
            type="button"
            onClick={handleOpenScan}
            className="flex items-center gap-1.5 rounded-lg border border-nexoraBorder bg-white hover:bg-slate-50 px-3 py-1.5 text-xs font-bold text-nexoraBrand transition shadow-sm"
          >
            <QrCode className="h-3.5 w-3.5" />
            <span>{currentLanguage === 'vi' ? 'Quét QR Tiệm' : 'Scan Salon QR'}</span>
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
                      title={currentLanguage === 'vi' ? 'Nhấp để phóng to QR nhận tips' : 'Click to enlarge Tipping QR'}
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
                        ? (currentLanguage === 'vi' ? 'Mã QR quét nhận tiền tip cá nhân tại tiệm này' : 'Personal Tipping QR code for this salon')
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
                    {biz.status === 'Active' ? (currentLanguage === 'vi' ? 'Đang hoạt động' : 'Active') :
                     biz.status === 'Pending Approval' ? (currentLanguage === 'vi' ? 'Chờ phê duyệt' : 'Pending Approval') :
                     biz.status === 'Pending Unlink' ? (currentLanguage === 'vi' ? 'Chờ hủy liên kết' : 'Pending Unlink') :
                     (currentLanguage === 'vi' ? 'Chưa liên kết' : 'Not Connected')}
                  </span>
                  {biz.status === 'Active' && (
                    <button
                      type="button"
                      onClick={() => handleRequestUnlink(biz.businessName)}
                      className="inline-flex items-center gap-1 rounded-lg bg-rose-50 border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 transition hover:bg-rose-100 shadow-sm cursor-pointer select-none"
                    >
                      <span>{currentLanguage === 'vi' ? 'Hủy' : 'Unlink'}</span>
                    </button>
                  )}
                  {isNotConnected && (
                    <button
                      type="button"
                      onClick={handleOpenScan}
                      className="inline-flex items-center gap-1 rounded-lg bg-nexoraBrand px-3 py-1.5 text-xs font-bold text-white transition hover:bg-opacity-95 shadow-sm"
                    >
                      <QrCode className="h-3 w-3" />
                      <span>{currentLanguage === 'vi' ? 'Liên kết' : 'Link'}</span>
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
                {currentLanguage === 'vi' ? 'Quét Mã QR Của Tiệm' : 'Scan Salon QR Code'}
              </h3>
              <p className="text-[10px] text-slate-500 font-medium text-center leading-normal">
                {currentLanguage === 'vi' 
                  ? 'Quét mã QR liên kết thợ của tiệm (referral QR) để gửi yêu cầu gia nhập chủ động' 
                  : 'Scan the salon referral QR code to actively submit your join request'}
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
                {currentLanguage === 'vi' ? 'Hoặc Nhập Liên Kết / Tên Tiệm' : 'Or Enter Invite Link / Business Name'}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={
                    currentLanguage === 'vi'
                      ? 'Dán liên kết hoặc tên tiệm...'
                      : 'Paste salon invite link or name...'
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
                  {currentLanguage === 'vi' ? 'Gửi' : 'Send'}
                </button>
              </div>
            </div>

            {/* Quick simulation buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block text-center">
                {currentLanguage === 'vi' ? 'Giả lập quét QR' : 'Simulate QR Scan'}
              </span>
              
              <div className="flex flex-col gap-2">
                {/* Standard Successful Scan button */}
                <button
                  type="button"
                  onClick={() => simulateMerchantScan('Golden Glow Nail Spa')}
                  className="w-full py-2 bg-gradient-to-r from-[#2B59FF] to-[#8E4DF8] text-white rounded-xl text-xs font-black uppercase tracking-wider transition-opacity hover:opacity-90 shadow-sm"
                >
                  Golden Glow Nail Spa
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
                {currentLanguage === 'vi' ? 'QR Nhận Tip Cá Nhân' : 'Personal Tipping QR'}
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
                {currentLanguage === 'vi' ? 'Liên Kết Nhận Tip' : 'Tipping Link'}
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
                        currentLanguage === 'vi' ? 'Đã sao chép liên kết nhận tip!' : 'Tipping link copied!',
                        'success'
                      )
                    } catch (e) {}
                  }}
                  className="h-7 px-3 bg-slate-800 text-white rounded-lg text-[10px] font-bold hover:bg-slate-700 transition flex items-center gap-1 shrink-0"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{currentLanguage === 'vi' ? 'Sao chép' : 'Copy'}</span>
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
                <span>{currentLanguage === 'vi' ? 'Mở trang tip (Giả lập khách) ›' : 'Open Tipping Page (Simulate) ›'}</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
