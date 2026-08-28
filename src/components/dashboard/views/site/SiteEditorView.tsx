// SiteEditorView — Single-Page Unified Merchant Site Studio (US-107)
import React, { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Sparkles,
  Layout,
  FileText,
  Tag,
  Eye,
  Rocket,
  Save,
  CheckCircle,
  X,
  ExternalLink,
  Smartphone,
  Monitor,
  Tv,
  Globe,
  AlertCircle,
  Check
} from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useMerchantSiteQuery,
  useUpdateMerchantSiteMutation,
  useUpdateMerchantSiteStatusMutation
} from '../../../../data/hooks/useMerchantSite'
import {
  useMerchantSetup,
  useBusinessHours
} from '../../../../data/hooks/useMerchantSetup'
import { usePosServices } from '../../../../data/hooks/usePosServices'
import { usePosCategories } from '../../../../data/hooks/usePosCategories'
import { useMerchantStaff } from '../../../../data/hooks/useMerchantStaff'
import {
  MerchantSiteStatus,
  MerchantSiteTemplateId,
  MerchantSitePaletteId,
} from '../../../../constants/merchantSiteStatus'
import type {
  MerchantSiteDto,
  PublicSiteDto,
  PublicStaffMemberDto,
} from '../../../../constants/merchantSiteStatus'
import type { MerchantSiteIdentity } from '../../../../data/repositories/merchantSite'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import { getApiErrorCode } from '../../../../types/domain'
import { logger } from '../../../../utils/logger'
import { buildPublicBookingFormUrl } from '../../../../utils/publicBookingUrl'
import { TemplatePickerPanel } from './TemplatePickerPanel'
import { SiteContentForm } from './SiteContentForm'
import { SitePromotionsEditor } from './SitePromotionsEditor'
import { SiteRenderer } from '../../../public/site/SiteRenderer'
import { SitePublishBar } from './SitePublishBar'
import { GoLiveChecklistCard } from './GoLiveChecklistCard'

export default function SiteEditorView() {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [previewDevice, setPreviewDevice] = useState<'fhd' | 'desktop' | 'mobile'>('fhd')

  // Body scroll lock and close preview modal on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPreviewOpen) {
        setIsPreviewOpen(false)
      }
    }
    if (isPreviewOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isPreviewOpen])

  const { data: merchantSetup, isLoading: isMerchantSetupLoading } = useMerchantSetup()
  const businessInfo = merchantSetup?.businessInfo
  const businessId = businessInfo?.businessId?.trim() || businessInfo?.id?.trim() || 'demo-biz-1'
  const businessName = businessInfo?.name?.trim() || 'Nexora Luxury Nails & Spa Lounge'
  const businessSlug = businessInfo?.slug?.trim() || 'nexora-luxury'
  const publicBookingUrl = buildPublicBookingFormUrl(businessSlug)
  const phone = businessInfo?.phone?.trim()
    || businessInfo?.bookingNotificationPhone?.trim()
    || '(832) 555-0198'
  const address = businessInfo?.address?.trim() || '10882 Westheimer Rd, Houston, TX 77042'
  const merchantSiteIdentity = useMemo<MerchantSiteIdentity>(
    () => ({ businessId, businessName, businessSlug, phone, address }),
    [address, businessId, businessName, businessSlug, phone],
  )

  const { data: serverSite, isLoading } = useMerchantSiteQuery(
    businessSlug,
    merchantSiteIdentity,
  )
  const { data: posServices } = usePosServices()
  const { data: posCategories } = usePosCategories()
  const { data: staffData } = useMerchantStaff()
  const { data: businessHours } = useBusinessHours()

  const updateSite = useUpdateMerchantSiteMutation(businessSlug)
  const updateStatus = useUpdateMerchantSiteStatusMutation(
    businessSlug,
    merchantSiteIdentity,
  )
  const categoryNameById = useMemo(
    () => new Map((posCategories ?? []).map(category => [category.id, category.name])),
    [posCategories],
  )

  // Hybrid Local Draft State
  const [draftSite, setDraftSite] = useState<MerchantSiteDto | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    if (serverSite && (!draftSite || !isDirty)) {
      setDraftSite(serverSite)
    }
  }, [serverSite])

  if (isLoading || isMerchantSetupLoading || !serverSite || !draftSite) {
    return (
      <div className="p-12 text-center text-slate-500 text-sm font-medium">
        Đang tải thông tin cấu hình website salon...
      </div>
    )
  }

  const isPublished = serverSite.status === MerchantSiteStatus.Published
  const isSaving = updateSite.isPending || updateStatus.isPending

  // Map real POS Services from admin
  const realServices = posServices && posServices.length > 0
    ? posServices.map((s) => ({
        id: s.id,
        name: s.name,
        price: s.price,
        durationMinutes: s.durationMinutes,
        description: s.description || undefined,
        categoryName: s.categoryIds
          .map(categoryId => categoryNameById.get(categoryId))
          .find((categoryName): categoryName is string => Boolean(categoryName)),
      }))
    : undefined

  // Map real Staff from admin
  const realStaff: PublicStaffMemberDto[] | undefined = staffData?.items && staffData.items.length > 0
    ? staffData.items.filter(s => s.isActive !== false).map((s): PublicStaffMemberDto => ({
        id: s.id || s.nickname || '',
        name: s.nickname || s.fullName || 'Kỹ Thuật Viên',
        role: typeof s.roleAtBusiness === 'string' && s.roleAtBusiness.trim()
          ? s.roleAtBusiness.trim()
          : typeof s.position === 'string' && s.position.trim()
            ? s.position.trim()
            : 'Kỹ Thuật Viên',
        avatarUrl: typeof s.avatar === 'string' ? s.avatar : null
      }))
    : (merchantSetup?.staffList && merchantSetup.staffList.length > 0)
    ? merchantSetup.staffList.map((s): PublicStaffMemberDto => ({
        id: s.id || s.nickname || '',
        name: s.nickname || s.fullName || 'Kỹ Thuật Viên',
        role: 'Kỹ Thuật Viên',
        avatarUrl: null
      }))
    : undefined

  // Map real Business Hours from admin
  const realHours = businessHours && businessHours.length > 0
    ? businessHours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.openTime,
        closeTime: h.closeTime
      }))
    : undefined

  const handleSaveDraft = async () => {
    if (!draftSite) return
    try {
      await updateSite.mutateAsync({
        ...(merchantSiteIdentity ?? {}),
        templateId: draftSite.templateId,
        paletteId: draftSite.paletteId,
        customColor: draftSite.customColor,
        content: draftSite.content
      })
      setIsDirty(false)
      showToast('✓ Đã lưu toàn bộ thay đổi thành công!', 'success')
    } catch (err) {
      logger.error('Failed to save draft:', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err))) || t('errors.generic'), 'error')
    }
  }

  const handlePublish = async () => {
    if (!draftSite) return
    try {
      if (isDirty) {
        await updateSite.mutateAsync({
          ...(merchantSiteIdentity ?? {}),
          templateId: draftSite.templateId,
          paletteId: draftSite.paletteId,
          customColor: draftSite.customColor,
          content: draftSite.content
        })
      }
      await updateStatus.mutateAsync(MerchantSiteStatus.Published)
      setIsDirty(false)
      showToast('🎉 Chúc mừng! Website của bạn đã được xuất bản trực tiếp.', 'success')
    } catch (err) {
      logger.error('Failed to publish site:', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err))) || t('errors.generic'), 'error')
    }
  }

  const handleArchive = async () => {
    try {
      await updateStatus.mutateAsync(MerchantSiteStatus.Archived)
      showToast('Website đã tạm ngừng xuất bản.', 'success')
    } catch (err) {
      logger.error('Failed to archive site:', err)
      showToast(t(getErrorI18nKey(getApiErrorCode(err))) || t('errors.generic'), 'error')
    }
  }

  const publicSiteData: PublicSiteDto = {
    businessSlug,
    businessName,
    phone,
    address,
    templateId: draftSite.templateId,
    paletteId: draftSite.paletteId,
    customColor: draftSite.customColor,
    status: draftSite.status,
    publishedAt: draftSite.publishedAt,
    content: draftSite.content,
    services: realServices,
    staffList: realStaff,
    businessHours: realHours
  }

  return (
    <div className="w-full space-y-8 pb-28">
      {/* Top Header Bar & Actions */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
              <Sparkles className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-nexoraText tracking-tight">
                  Merchant Site Studio
                </h1>
                {isDirty ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ● Có thay đổi chưa lưu
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    ✓ Đã lưu mới nhất
                  </span>
                )}
              </div>
              <p className="text-xs text-nexoraMuted mt-0.5">
                Thiết lập và tùy biến toàn diện website salon sống trên 1 trang duy nhất
              </p>
            </div>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all shadow-sm ${
              isDirty
                ? 'bg-indigo-50 text-indigo-700 border-2 border-indigo-300 hover:bg-indigo-100'
                : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
          </button>

          <button
            type="button"
            onClick={() => setIsPreviewOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition-all shadow-md"
          >
            <Eye className="w-4 h-4 text-amber-400" />
            <span>Xem Trước Website</span>
          </button>

          {isPublished ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 transition-all shadow"
            >
              <span>Ngừng Xuất Bản</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all shadow-md"
            >
              <Rocket className="w-4 h-4" />
              <span>Xuất Bản Website</span>
            </button>
          )}
        </div>
      </div>

      {/* If Published: Show Go-Live Checklist */}
      {isPublished && (
        <GoLiveChecklistCard businessSlug={businessSlug} />
      )}

      {/* SECTION 1: Templates & Palettes */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow">
              1
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-nexoraText">
                Mẫu Giao Diện & Bảng Màu Chủ Đạo
              </h2>
              <p className="text-xs text-nexoraMuted">
                Chọn phong cách nhận diện thương hiệu và màu sắc chủ đạo của salon
              </p>
            </div>
          </div>
        </div>

        <TemplatePickerPanel
          site={draftSite}
          onChange={(templateId, paletteId, customColor) => {
            setDraftSite(prev => prev ? { ...prev, templateId, paletteId, customColor } : prev)
            setIsDirty(true)
          }}
        />
      </section>

      {/* SECTION 2: Content & Media */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow">
              2
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-nexoraText">
                Thông Điệp Thương Hiệu & Album Hình Ảnh
              </h2>
              <p className="text-xs text-nexoraMuted">
                Hero Slogan, câu chuyện tiệm, điểm nổi bật và album ảnh không gian/mẫu móng
              </p>
            </div>
          </div>
        </div>

        <SiteContentForm
          content={draftSite.content}
          paletteId={draftSite.paletteId}
          customColor={draftSite.customColor}
          templateId={draftSite.templateId}
          onChange={(contentPatch) => {
            setDraftSite(prev => prev ? { ...prev, content: { ...prev.content, ...contentPatch } } : prev)
            setIsDirty(true)
          }}
        />
      </section>

      {/* SECTION 3: Promotions & Vouchers */}
      <section className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-indigo-600 text-white font-black text-sm shadow">
              3
            </span>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-nexoraText">
                Chương Trình Khuyến Mãi & Voucher Ưu Đãi
              </h2>
              <p className="text-xs text-nexoraMuted">
                Tạo mã ưu đãi, banner quảng bá thu hút khách hàng đặt lịch hẹn online
              </p>
            </div>
          </div>
        </div>

        <SitePromotionsEditor
          promotions={draftSite.content.promotions || []}
          onChange={(promotions) => {
            setDraftSite(prev => prev ? { ...prev, content: { ...prev.content, ...draftSite.content, promotions } } : prev)
            setIsDirty(true)
          }}
        />
      </section>

      {/* Floating Bottom Sticky Action Bar */}
      <SitePublishBar
        status={serverSite.status}
        isSaving={isSaving}
        isDirty={isDirty}
        onSave={handleSaveDraft}
        onPreview={() => setIsPreviewOpen(true)}
        onPublish={handlePublish}
        onArchive={handleArchive}
      />

      {/* FULL-SCREEN LIVE PREVIEW MODAL */}
      {isPreviewOpen && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-black/90 backdrop-blur-md flex flex-col animate-in fade-in duration-200 m-0 p-0">
          {/* Modal Header */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white shrink-0 shadow-lg z-10">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <Eye className="w-4 h-4" />
                Xem Trước Website Salon
              </span>

              {/* Device Mode Switcher */}
              <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-inner">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('fhd')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewDevice === 'fhd' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>Full HD (1920px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop (1440px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile (375px)</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <a
                href={publicBookingUrl || undefined}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <span>Mở Tab Mới</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body: Device Sandbox Frame */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center items-start bg-slate-950/90">
            {previewDevice === 'mobile' ? (
              /* Realistic iPhone 15/16 Pro Shell (390px) with Apple HIG Safe Area */
              <div className="relative w-[390px] h-[820px] my-auto bg-slate-900 rounded-[54px] p-2.5 shadow-2xl border-4 border-slate-700 flex flex-col shrink-0 overflow-hidden select-none">
                {/* iOS Top Status Bar with Dynamic Island */}
                <div className="absolute top-2.5 left-2.5 right-2.5 h-11 px-6 flex items-center justify-between z-40 pointer-events-none text-white">
                  {/* Left: Clock */}
                  <span className="text-[12px] font-bold tracking-tight">9:41</span>

                  {/* Center: Dynamic Island */}
                  <div className="w-28 h-6 bg-black rounded-full flex items-center justify-between px-3 shadow-md">
                    <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ring-1 ring-white/10" />
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-950/80 ring-1 ring-indigo-500/20" />
                  </div>

                  {/* Right: iOS Icons (Signal, Wi-Fi, Battery) */}
                  <div className="flex items-center gap-1.5 text-[11px] opacity-90 font-medium">
                    <span>5G</span>
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98C20.93 5.9 16.69 4 12 4z"/></svg>
                    <div className="w-5 h-2.5 border border-white rounded-xs p-0.5 flex items-center">
                      <div className="h-full w-full bg-white rounded-2xs" />
                    </div>
                  </div>
                </div>

                {/* Screen Content Container (Respects Top Safe Area 44px + Bottom Safe Area 32px) */}
                <div className="relative w-full h-full rounded-[44px] overflow-y-auto overflow-x-hidden shadow-inner pt-11 pb-10 bg-slate-950 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                  <SiteRenderer site={publicSiteData} isMobileView={true} />
                </div>

                {/* iOS Home Indicator */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/50 rounded-full pointer-events-none z-40" />
              </div>
            ) : previewDevice === 'fhd' ? (
              /* Full HD 1920px Ultra-Wide Desktop Browser Shell */
              <div className="w-full max-w-[1920px] h-[880px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
                {/* Browser Address Bar */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-lg mx-auto px-4 py-1 rounded-xl bg-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2 border border-slate-700">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{publicBookingUrl}</span>
                    <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-400/10 border border-amber-400/30">1920x1080 FHD</span>
                  </div>
                </div>
                {/* Web View */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <SiteRenderer site={publicSiteData} isMobileView={false} />
                </div>
              </div>
            ) : (
              /* Desktop Browser Shell (1440px scaled) */
              <div className="w-full max-w-6xl h-[780px] bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col">
                {/* Browser Address Bar */}
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-rose-500" />
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                  </div>
                  <div className="flex-1 max-w-md mx-auto px-4 py-1 rounded-xl bg-slate-800 text-[11px] font-mono text-slate-400 flex items-center justify-center gap-2 border border-slate-700">
                    <Globe className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{publicBookingUrl}</span>
                    <span className="text-[10px] text-indigo-400 font-bold px-1.5 py-0.5 rounded bg-indigo-400/10 border border-indigo-400/30">1440px</span>
                  </div>
                </div>
                {/* Web View */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden">
                  <SiteRenderer site={publicSiteData} isMobileView={false} />
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
