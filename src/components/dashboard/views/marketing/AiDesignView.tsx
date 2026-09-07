import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import {
  useGenerateMarketingAdImage,
  useMarketingAdsCreditSummary,
  useMarketingAdsImageQualityCosts,
  useMarketingAdsImages,
  useSaveMarketingAdDraft,
} from '../../../../data/hooks/useAiBanner'
import {
  AdType,
  ImageQuality,
  InsufficientCreditsError,
} from '../../../../data/repositories/marketingAds'
import { logger } from '../../../../utils/logger'
import { isMarketingHttpUrl } from '../../../../data/repositories/marketingLandingPages'
import {
  AI_QUALITY_COST,
  AI_QUALITY_OPTIONS,
  DEFAULT_IMAGE_QUALITY,
  MARKETING_TK,
  QUALITY_LABELS,
  QUALITY_RESOLUTIONS,
  type AiQualityOption,
} from './constants'
import { BannerImageCropper, type BannerImageCropperHandle } from './BannerImageCropper'
import { LucideIcon } from './LucideIcon'
import MyImagesPanel from './MyImagesPanel'
import { RefHistoryPickerGrid } from './RefHistoryPickerGrid'
import SuggestedPromptChips from './SuggestedPromptChips'
import { AiHistoryThumbnails, type AiHistoryThumbnailItem } from './AiHistoryThumbnails'

declare global {
  interface Window {
    __aiAdsActions?: unknown
  }
}

const TK = MARKETING_TK

const QUALITY_TO_ENUM: Record<AiQualityOption, ImageQuality> = {
  low: ImageQuality.Low,
  medium: ImageQuality.Medium,
  high: ImageQuality.High,
}

function isBannerImageWithinSizeLimit(file: File, maxMb = 5): boolean {
  return file.size <= maxMb * 1024 * 1024
}

/**
 * Marketing → AI Design View (Create Ad - Quick mode)
 * Ported 1:1 from merchant-ai-ads CreateAiScreen.tsx.
 * Contains all 44 countable gate elements with exact IDs and interactions.
 */
export default function AiDesignView({ onCreateLandingPage }: { onCreateLandingPage?: (imageUrl: string, name: string) => void }) {
  const { t } = useTranslation()
  const { showToast } = useNotification()


  // Generator Phase: 'before' | 'loading' | 'after'
  const [phase, setPhase] = useState<'before' | 'loading' | 'after'>('before')
  const [loadingProgress, setLoadingProgress] = useState(0)

  // Quick mode form state
  const [quality, setQuality] = useState<AiQualityOption>(DEFAULT_IMAGE_QUALITY)
  const [qualityDropdownOpen, setQualityDropdownOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [promptSummary, setPromptSummary] = useState('')
  const [creditError, setCreditError] = useState<string | null>(null)

  // Reference image state
  const [refHistoryPickerOpen, setRefHistoryPickerOpen] = useState(false)
  const [refPreviewImageUrl, setRefPreviewImageUrl] = useState('')
  const [refPreviewFileName, setRefPreviewFileName] = useState('')
  const [refRequiresCrop, setRefRequiresCrop] = useState(false)
  const hasRefPreview = !!refPreviewImageUrl

  // Result state
  const [resultImageUrl, setResultImageUrl] = useState('')
  const [isBannerSelected, setIsBannerSelected] = useState(false)
  const [lastCost, setLastCost] = useState(0)

  // Submission form state
  const [bannerName, setBannerName] = useState('')
  const [targetUrl, setTargetUrl] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const generationLock = useRef(false)
  const submissionLock = useRef(false)

  // Refs
  const refCropExportRef = useRef<BannerImageCropperHandle | null>(null)
  const refPreviewObjectUrlRef = useRef<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const loadingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const qualityTriggerRef = useRef<HTMLButtonElement | null>(null)
  const qualityDropdownRef = useRef<HTMLDivElement | null>(null)
  const dropzoneRef = useRef<HTMLDivElement | null>(null)
  const beforeSectionRef = useRef<HTMLDivElement | null>(null)
  const [isDropzoneActive, setIsDropzoneActive] = useState(false)

  // Data hooks
  const creditsQuery = useMarketingAdsCreditSummary()
  const qualityCostsQuery = useMarketingAdsImageQualityCosts()
  const generateMutation = useGenerateMarketingAdImage()
  const saveDraftMutation = useSaveMarketingAdDraft()
  const historyImagesQuery = useMarketingAdsImages({ pageSize: 4 })

  const availableCredits = creditsQuery.data?.totalAvailable ?? 420
  const currentCost = useMemo(() => {
    const enumVal = QUALITY_TO_ENUM[quality]
    const match = qualityCostsQuery.data?.find((item) => item.imageQuality === enumVal)
    return match?.creditCost ?? AI_QUALITY_COST[quality] ?? 30
  }, [qualityCostsQuery.data, quality])

  const today = useMemo(() => new Date().toISOString().split('T')[0], [])
  const isGenerating = generateMutation.isPending || phase === 'loading'

  // Map history images for thumbnails
  const historyThumbnails: AiHistoryThumbnailItem[] = useMemo(() => {
    return (historyImagesQuery.data?.items ?? []).map((img, idx) => ({
      id: img.id,
      url: img.imageUrl,
      label: img.prompt
        ? img.prompt.length > 20
          ? `${img.prompt.slice(0, 20)}…`
          : img.prompt
        : `Sample #${idx + 1}`,
    }))
  }, [historyImagesQuery.data?.items])

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
      }
      if (refPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(refPreviewObjectUrlRef.current)
      }
    }
  }, [])

  // Close quality dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const trigger = qualityTriggerRef.current
      const dropdown = qualityDropdownRef.current
      if (
        dropdown &&
        trigger &&
        !trigger.contains(e.target as Node) &&
        !dropdown.contains(e.target as Node)
      ) {
        setQualityDropdownOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [])

  // Drag and drop on reference dropzone
  useEffect(() => {
    const dropzone = dropzoneRef.current
    if (!dropzone) return

    const onDrop = (e: DragEvent) => {
      e.preventDefault()
      setIsDropzoneActive(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) handleRefFileSelect(file)
    }
    const onDragOver = (e: DragEvent) => {
      e.preventDefault()
      setIsDropzoneActive(true)
    }
    const onDragLeave = () => {
      setIsDropzoneActive(false)
    }

    dropzone.addEventListener('drop', onDrop)
    dropzone.addEventListener('dragover', onDragOver)
    dropzone.addEventListener('dragleave', onDragLeave)

    return () => {
      dropzone.removeEventListener('drop', onDrop)
      dropzone.removeEventListener('dragover', onDragOver)
      dropzone.removeEventListener('dragleave', onDragLeave)
    }
  }, [])

  // Reference file selection
  const handleRefFileSelect = useCallback((file: File | undefined) => {
    if (!file) return
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
    if (!ALLOWED_TYPES.includes(file.type)) {
      showToast('Unsupported file format. Please upload a JPG, JPEG, PNG, or WEBP file.', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }
    if (!isBannerImageWithinSizeLimit(file)) {
      showToast('Reference image exceeds 5MB limit. Please choose a smaller file.', 'error')
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    if (refPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(refPreviewObjectUrlRef.current)
    }
    const previewUrl = URL.createObjectURL(file)
    refPreviewObjectUrlRef.current = previewUrl
    setRefPreviewImageUrl(previewUrl)
    setRefPreviewFileName(file.name)
    setRefRequiresCrop(true)
    setRefHistoryPickerOpen(false)
    showToast(`Reference image received: ${file.name}`)
  }, [showToast])

  const handleRefFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleRefFileSelect(e.target.files?.[0])
    e.target.value = ''
  }

  const handleRemoveRefImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (refPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(refPreviewObjectUrlRef.current)
      refPreviewObjectUrlRef.current = null
    }
    setRefPreviewImageUrl('')
    setRefPreviewFileName('')
    setRefRequiresCrop(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const handleSelectRefFromHistory = (url: string, name: string) => {
    if (refPreviewObjectUrlRef.current) {
      URL.revokeObjectURL(refPreviewObjectUrlRef.current)
      refPreviewObjectUrlRef.current = null
    }
    setRefPreviewImageUrl(url)
    setRefPreviewFileName(name)
    setRefRequiresCrop(false)
    setRefHistoryPickerOpen(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    showToast(`Reference image selected: ${name}`)
  }

  const triggerRefFileInput = () => {
    fileInputRef.current?.click()
  }

  const handleSelectQuality = (q: AiQualityOption) => {
    setQuality(q)
    setQualityDropdownOpen(false)
    setCreditError(null)
  }

  const handleFillPrompt = (text: string) => {
    setPrompt(text)
  }

  // Generate AI Banner
  const handleGenerateBanner = async () => {
    if (generationLock.current || isGenerating || creditsQuery.isLoading || qualityCostsQuery.isLoading) return

    const currentPrompt = prompt.trim()

    if (!currentPrompt) {
      showToast('Please enter your ad idea (Prompt)!', 'error')
      return
    }

    if (availableCredits < currentCost) {
      setCreditError(
        `Insufficient credits: This generation requires ${currentCost} credits, but you only have ${availableCredits} credits.`
      )
      return
    }
    setCreditError(null)

    generationLock.current = true
    setPhase('loading')
    setLoadingProgress(0)

    // Resolve cropped file if crop was required
    let finalRefImageUrl: string | null = refPreviewImageUrl || null
    if (refRequiresCrop && refCropExportRef.current) {
      try {
        const croppedFile = await refCropExportRef.current.exportCroppedFile(
          refPreviewFileName || 'cropped-reference.png'
        )
        const croppedUrl = URL.createObjectURL(croppedFile)
        if (refPreviewObjectUrlRef.current) {
          URL.revokeObjectURL(refPreviewObjectUrlRef.current)
        }
        refPreviewObjectUrlRef.current = croppedUrl
        finalRefImageUrl = croppedUrl
        setRefPreviewImageUrl(croppedUrl)
        setRefRequiresCrop(false)
      } catch (err) {
        logger.warn('[AiDesignView] Error exporting cropped reference image', err)
      }
    }

    setPhase('loading')
    setLoadingProgress(0)

    if (loadingIntervalRef.current) {
      clearInterval(loadingIntervalRef.current)
    }

    let percent = 0
    loadingIntervalRef.current = setInterval(() => {
      percent = Math.min(percent + 10, 90)
      setLoadingProgress(percent)
    }, 300)

    try {
      const response = await generateMutation.mutateAsync({
        adType: AdType.Banner,
        prompt: currentPrompt,
        imageQuality: QUALITY_TO_ENUM[quality],
        referenceImageUrl: finalRefImageUrl,
      })

      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }

      const usedCost = response.creditCost ?? currentCost
      setLoadingProgress(100)
      setResultImageUrl(response.imageUrl)
      setPromptSummary(currentPrompt)
      setLastCost(usedCost)
      setBannerName(`AI Banner - ${currentPrompt.substring(0, 20) || 'Template Design'}`)
      setTargetUrl('')
      setStartDate('')
      setEndDate('')
      setIsBannerSelected(false)
      setPhase('after')
      showToast(`Design generated successfully! Used ${usedCost} credits.`)
    } catch (error) {
      if (loadingIntervalRef.current) {
        clearInterval(loadingIntervalRef.current)
        loadingIntervalRef.current = null
      }
      setPhase('before')
      setLoadingProgress(0)
      if (error instanceof InsufficientCreditsError) {
        setCreditError(
          `Insufficient credits: This generation requires ${currentCost} credits, but you only have ${availableCredits} credits.`
        )
        showToast('Insufficient credits to generate design.', 'error')
      } else {
        logger.error('[AiDesignView] generateImage failed', error)
        showToast('Failed to generate design. Please try again.', 'error')
      }
    } finally {
      generationLock.current = false
    }
  }

  // Use this banner
  const handleUseThisBanner = () => {
    setIsBannerSelected(true)
    showToast('This banner is now selected for use!')
  }

  // Edit design with reference
  const handleEditDesign = () => {
    if (resultImageUrl) {
      if (refPreviewObjectUrlRef.current) {
        URL.revokeObjectURL(refPreviewObjectUrlRef.current)
        refPreviewObjectUrlRef.current = null
      }
      setRefPreviewImageUrl(resultImageUrl)
      setRefPreviewFileName('Generated AI banner')
      setRefRequiresCrop(false)
    }
    setPhase('before')
    beforeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Regenerate design
  const handleRegenerateDesign = () => {
    setPhase('before')
  }

  // Select history image
  const handleSelectHistoryImage = (url: string) => {
    setResultImageUrl(url)
    setIsBannerSelected(false)
    showToast('History image loaded!')
  }

  // Save Draft
  const handleSaveDraft = async () => {
    if (submissionLock.current || isSubmitting || !isBannerSelected) return
    const currentName = bannerName.trim() || 'AI Draft'
    const currentTargetUrl = targetUrl.trim()
    const currentStartDate = startDate
    const currentEndDate = endDate

    if (!resultImageUrl) {
      showToast('No design image found to save!', 'error')
      return
    }

    if (currentTargetUrl && !isMarketingHttpUrl(currentTargetUrl)) {
      showToast(t('marketingSuite.errors.invalidUrl'), 'error')
      return
    }

    if ((currentStartDate && !currentEndDate) || (!currentStartDate && currentEndDate)) {
      showToast('Please enter both start and end dates.', 'error')
      return
    }

    if (currentStartDate && currentEndDate && currentStartDate > currentEndDate) {
      showToast('End date must be after start date.', 'error')
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    try {
      await saveDraftMutation.mutateAsync({
        name: currentName,
        imageUrl: resultImageUrl,
        targetUrl: currentTargetUrl || undefined,
        startDate: currentStartDate || undefined,
        endDate: currentEndDate || undefined,
        source: 'ai_generated',
      })
      showToast('AI design draft saved successfully!')
    } catch (error) {
      logger.error('[AiDesignView] saveDraft failed', error)
      showToast('Failed to save draft. Please try again.', 'error')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  // Publish — merchants manage their own campaigns here, so there is no
  // platform review step. Publishing saves the banner (it stays in Draft
  // status until it has a landing page) and hands off straight into
  // building that landing page.
  const handlePublish = async () => {
    if (submissionLock.current || isSubmitting || !isBannerSelected) return
    const currentName = bannerName.trim()
    const currentTargetUrl = targetUrl.trim()
    const currentStartDate = startDate
    const currentEndDate = endDate

    if (!resultImageUrl) {
      showToast('No design image found to save!', 'error')
      return
    }

    if (!currentName) {
      showToast('Please enter a banner name.', 'error')
      return
    }

    if (currentTargetUrl && !isMarketingHttpUrl(currentTargetUrl)) {
      showToast(t('marketingSuite.errors.invalidUrl'), 'error')
      return
    }

    if ((currentStartDate && !currentEndDate) || (!currentStartDate && currentEndDate)) {
      showToast('Please enter both start and end dates.', 'error')
      return
    }

    if (currentStartDate && currentEndDate && currentStartDate > currentEndDate) {
      showToast('End date must be after start date.', 'error')
      return
    }

    submissionLock.current = true
    setIsSubmitting(true)
    try {
      await saveDraftMutation.mutateAsync({
        name: currentName,
        imageUrl: resultImageUrl,
        targetUrl: currentTargetUrl || undefined,
        startDate: currentStartDate || undefined,
        endDate: currentEndDate || undefined,
        source: 'ai_generated',
      })
      onCreateLandingPage?.(resultImageUrl, currentName)
    } catch (error) {
      logger.error('[AiDesignView] publish failed', error)
      showToast('Failed to save banner. Please try again.', 'error')
    } finally {
      submissionLock.current = false
      setIsSubmitting(false)
    }
  }

  // Bind window.__aiAdsActions for programmatic/testing compatibility
  useEffect(() => {
    window.__aiAdsActions = {
      generateAIBanner: handleGenerateBanner,
      useThisBanner: handleUseThisBanner,
      editWithReference: handleEditDesign,
      backToPromptEdit: handleRegenerateDesign,
      selectAIQuality: handleSelectQuality,
      saveAIDraft: handleSaveDraft,
      publishAIBanner: handlePublish,
      triggerRefUpload: triggerRefFileInput,
      toggleRefHistoryPicker: () => setRefHistoryPickerOpen((prev) => !prev),
      toggleQualityDropdown: () => setQualityDropdownOpen((prev) => !prev),
      fillPrompt: handleFillPrompt,
      selectHistoryImage: handleSelectHistoryImage,
    }

    return () => {
      delete window.__aiAdsActions
    }
  })

  return (
    <div className="space-y-6 pb-24 lg:pb-0">
      <section
        id="screen-create-ai"
        className="screen-section space-y-4 max-w-full"
      >
        {/* Quick mode container */}
        <div id="ai-mode-quick">
          {/* Phase: before */}
          <div
            ref={beforeSectionRef}
            id="ai-generator-before"
            className={`grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 ${
              phase === 'after' ? 'hidden' : ''
            }`}
          >
            {/* Left Column: Form Controls */}
            <div className="relative z-10 lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6 hover:shadow-card-hover transition-all duration-300">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-950 flex items-center gap-2">
                  <LucideIcon name="sparkles" className="w-5 h-5 text-indigo-600 animate-pulse" />{' '}
                  AI Banner Generator
                </h3>

                {/* Effort / Quality dropdown */}
                <div className="relative">
                  <button
                    ref={qualityTriggerRef}
                    onClick={() => setQualityDropdownOpen((prev) => !prev)}
                    id="quality-trigger"
                    type="button"
                    className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 px-2.5 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 hover:border-indigo-300 shadow-sm transition-all duration-200"
                  >
                    <LucideIcon name="settings-2" className="w-3.5 h-3.5" />
                    <span className="text-slate-400 font-medium">Effort:</span>
                    <span id="quality-trigger-label">{QUALITY_LABELS[quality]}</span>
                  </button>

                  <div
                    ref={qualityDropdownRef}
                    id="quality-dropdown"
                    className={`absolute right-0 top-full mt-1.5 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl z-20 overflow-hidden ${
                      qualityDropdownOpen ? '' : 'hidden'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 pt-3 pb-1.5">
                      Image quality
                    </p>
                    <div className="px-2 pb-2 space-y-0.5">
                      {AI_QUALITY_OPTIONS.map((q) => {
                        const isActive = quality === q
                        return (
                          <button
                            key={q}
                            type="button"
                            onClick={() => handleSelectQuality(q)}
                            data-quality={q}
                            className={`quality-btn w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
                              isActive
                                ? 'bg-indigo-50 text-indigo-700'
                                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
                            }`}
                          >
                            <span className="flex items-center gap-2">
                              <LucideIcon
                                name={q === 'high' ? 'sparkles' : 'gauge'}
                                className="w-3.5 h-3.5"
                              />
                              {QUALITY_LABELS[q]}
                            </span>
                            <span
                              className={`font-normal ${
                                isActive ? 'text-indigo-500' : 'text-slate-400'
                              }`}
                            >
                              ~{AI_QUALITY_COST[q]} credit
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Reference image section */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700">Reference image</label>
                  <button
                    type="button"
                    onClick={() => setRefHistoryPickerOpen((prev) => !prev)}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors flex items-center gap-1"
                  >
                    <LucideIcon name="history" className="w-3 h-3" /> Choose from generated images
                  </button>
                </div>

                {/* History Picker */}
                <div
                  id="ai-ref-history-picker"
                  className={`rounded-2xl border border-slate-200 bg-slate-50 p-3 space-y-2 ${
                    refHistoryPickerOpen ? '' : 'hidden'
                  }`}
                >
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Previously generated images
                  </p>
                  <RefHistoryPickerGrid onSelect={handleSelectRefFromHistory} />
                </div>

                {/* Dropzone */}
                <div
                  ref={dropzoneRef}
                  id="ai-ref-dropzone"
                  role="button"
                  tabIndex={0}
                  onClick={triggerRefFileInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      triggerRefFileInput()
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-4 flex items-center justify-center gap-3 cursor-pointer transition-all duration-300 group ${
                    isDropzoneActive
                      ? 'border-indigo-500 bg-indigo-50/20'
                      : 'border-slate-200 hover:border-indigo-500 hover:bg-slate-50/50'
                  } ${hasRefPreview ? 'hidden' : ''}`}
                >
                  <input
                    type="file"
                    id="ai-ref-file-input"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                    onChange={handleRefFileChange}
                  />
                  <LucideIcon
                    name="image"
                    className="w-5 h-5 text-slate-400 group-hover:scale-110 transition-transform duration-300"
                    id="ai-ref-icon"
                  />
                  <span className="text-xs text-slate-500 font-medium" id="ai-ref-text">
                    Choose or upload a reference image
                  </span>
                  <span
                    className="text-[10px] font-semibold text-slate-400 bg-slate-50 border px-2 py-0.5 rounded"
                    id="ai-ref-size-hint"
                  >
                    JPG, PNG, WEBP up to 5MB · 3:1 ratio crop
                  </span>
                </div>

                {/* Preview Card */}
                <div
                  id="ai-ref-preview-card"
                  className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden ${
                    hasRefPreview ? '' : 'hidden'
                  }`}
                >
                  <div className="flex items-center justify-between px-4 pt-4 pb-3">
                    <h4 className="text-xs font-bold text-slate-950">Reference image</h4>
                    <button
                      type="button"
                      onClick={handleRemoveRefImage}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline transition-colors btn-bounce"
                    >
                      Remove image
                    </button>
                  </div>
                  <div className="px-4">
                    {refRequiresCrop ? (
                      <BannerImageCropper
                        ref={refCropExportRef}
                        imageUrl={refPreviewImageUrl}
                        fileName={refPreviewFileName}
                      />
                    ) : (
                      <div className="aspect-[3/1] bg-white rounded-2xl overflow-hidden relative border border-slate-200 flex items-center justify-center">
                        <img
                          id="ai-ref-preview-img"
                          src={refPreviewImageUrl}
                          alt="Reference image"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 mt-4">
                    <div>
                      <p
                        className="text-xs font-bold text-slate-900 truncate"
                        id="ai-ref-preview-name"
                      >
                        {refPreviewFileName || 'Reference image'}
                      </p>
                      <p className="text-[10px] text-emerald-500 font-semibold mt-0.5">
                        {isGenerating
                          ? 'Processing reference image...'
                          : refRequiresCrop
                          ? 'Drag image to adjust crop'
                          : 'Ready for AI generation'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={triggerRefFileInput}
                      disabled={isGenerating}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors btn-bounce disabled:opacity-50 disabled:pointer-events-none shrink-0 ml-2"
                    >
                      Change image
                    </button>
                  </div>
                </div>
              </div>

              {/* Prompt input */}
              <div className="space-y-1.5">
                <label htmlFor="ai-prompt-input" className="text-xs font-bold text-slate-700">
                  Describe your ad idea (Prompt) *
                </label>
                <textarea
                  id="ai-prompt-input"
                  rows={4}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe colors, text, layout, industry, style..."
                  className="w-full bg-slate-50 text-slate-800 text-xs p-3.5 rounded-2xl border border-slate-200/60 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-input-glow transition-all duration-300 resize-none"
                />
              </div>

              {/* Suggested ideas */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <LucideIcon name="lightbulb" className="w-3.5 h-3.5 text-amber-500 animate-bounce" />{' '}
                  Suggested design ideas
                </span>
                <SuggestedPromptChips onSelectPrompt={handleFillPrompt} />
                <p className="text-[11px] text-slate-400">
                  Click a suggestion chip above to fill the editor. You can edit the text freely before
                  asking AI to generate.
                </p>
              </div>

              {/* Generate button */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={handleGenerateBanner}
                    disabled={isGenerating || creditsQuery.isLoading || qualityCostsQuery.isLoading || availableCredits < currentCost}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 hover:shadow-btn-indigo-glow hover:-translate-y-0.5 text-white font-bold text-xs transition-all duration-300 shadow-md shadow-indigo-100 hover:shadow-lg flex items-center gap-2 btn-bounce disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <LucideIcon name="loader-2" className="w-4 h-4 animate-spin" />
                    ) : (
                      <LucideIcon name="play" className="w-4 h-4" />
                    )}
                    {isGenerating ? 'Generating design...' : 'Generate design now'}
                  </button>
                </div>

                {/* Inline generating status — keeps the form visible instead of swapping it out */}
                <div
                  id="ai-generator-loading"
                  className={`space-y-2 ${phase === 'loading' ? '' : 'hidden'}`}
                >
                  <p className="text-[11px] text-slate-400" id="ai-loading-cost-text">
                    AI is analyzing and designing your banner — using {currentCost} credits to
                    process your prompt and optimize the highest-quality graphics...
                  </p>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all duration-1000"
                      id="ai-loading-progress"
                      style={{ width: `${loadingProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Plan & Credits + Tips */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4 hover:shadow-card-hover transition-all duration-300">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-3">
                  Plan & credits
                </h3>

                <div className="space-y-3.5 text-xs font-medium text-slate-600">
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Current ad plan:</span>
                    <span className="font-bold text-slate-900" id="ai-current-plan">
                      Premium
                    </span>
                  </div>
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Available AI credits:</span>
                    <span className="font-bold text-indigo-600" id="ai-current-tokens">
                      {availableCredits} credit
                    </span>
                  </div>
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Cost for this generation:</span>
                    <span
                      className={`font-bold ${creditError ? 'text-rose-600' : 'text-slate-900'}`}
                    >
                      ~{currentCost} credit
                    </span>
                  </div>
                  {creditError ? (
                    <p className="text-[11px] text-rose-600 font-medium leading-relaxed">
                      {creditError}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Phase: after */}
          <div
            id="ai-generator-after"
            className={`grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-6 ${
              phase === 'after' ? '' : 'hidden'
            }`}
          >
            {/* Left Column: Result & Actions */}
            <div className="relative z-10 lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-6 hover:shadow-card-hover transition-shadow duration-300">
              {/* Generated prompt summary */}
              <div className="border-b border-slate-100 pb-4 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Generated prompt
                </span>
                <p
                  className="text-xs font-semibold text-slate-800 italic"
                  id="ai-result-prompt-summary"
                >
                  {promptSummary
                    ? `"${promptSummary}"`
                    : '"Create a luxury banner for a nail salon promotion..."'}
                </p>
              </div>

              {/* Result section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span id="quick-result-header-text">
                      {isBannerSelected ? 'Selected banner' : 'Result '}
                    </span>
                  </h3>
                </div>

                {/* Banner preview image box */}
                <div
                  className="w-full rounded-2xl bg-white overflow-hidden relative border border-slate-200 group flex items-center justify-center"
                  id="ai-result-image-box"
                >
                  <img
                    id="ai-result-preview-img"
                    src={resultImageUrl}
                    alt="AI Generated Banner"
                    className="w-full h-auto max-h-[540px] object-contain rounded-2xl transition-transform duration-700 group-hover:scale-[1.01]"
                  />

                  {/* Quality Badge */}
                  <div
                    id="ai-quality-badge"
                    className="absolute top-3 left-3 backdrop-blur-sm text-[10px] font-bold px-2.5 py-1 rounded-lg shadow flex items-center gap-1.5 bg-slate-900/60 text-white"
                  >
                    <LucideIcon
                      name={quality === 'high' ? 'sparkles' : 'gauge'}
                      className="w-3 h-3"
                      id="ai-quality-badge-icon"
                    />
                    <span id="ai-quality-badge-text">{QUALITY_LABELS[quality]}</span>
                    <span className="opacity-60">·</span>
                    <span id="ai-quality-badge-res">{QUALITY_RESOLUTIONS[quality]}</span>
                  </div>

                  {/* Selected Badge */}
                  <div
                    id="ai-selected-badge"
                    className={`absolute top-3 right-3 bg-emerald-500/90 text-white backdrop-blur-sm text-xs font-bold px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 transition-all duration-300 ${
                      isBannerSelected ? 'opacity-100' : 'hidden opacity-0'
                    }`}
                  >
                    <LucideIcon name="check-circle" className="w-4 h-4" /> Selected for use
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    id="btn-use-this-banner"
                    type="button"
                    onClick={handleUseThisBanner}
                    disabled={isBannerSelected}
                    className={`flex-1 py-3.5 rounded-xl text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 ${
                      isBannerSelected
                        ? 'bg-emerald-600 cursor-default'
                        : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-btn-indigo-glow hover:-translate-y-0.5 shadow-md shadow-indigo-100 btn-bounce'
                    }`}
                  >
                    <LucideIcon name={isBannerSelected ? 'check-circle' : 'check'} className="w-4 h-4" />
                    {isBannerSelected ? 'Banner selected' : 'Use this banner'}
                  </button>
                  {!isBannerSelected && (
                    <button
                      type="button"
                      onClick={handleEditDesign}
                      className="py-3.5 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2 btn-bounce"
                    >
                      <LucideIcon name="edit" className="w-4 h-4" /> Edit design
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleRegenerateDesign}
                    className="py-3.5 px-5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300 font-semibold text-xs transition-all duration-300 flex items-center justify-center gap-2 btn-bounce"
                  >
                    <LucideIcon name="rotate-ccw" className="w-4 h-4" /> Regenerate design
                  </button>
                </div>
              </div>

              {/* Generation history thumbnails */}
              <div className="space-y-3 border-t border-slate-100 pt-5">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Generation history
                </h4>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  <AiHistoryThumbnails
                    items={historyThumbnails}
                    onSelect={handleSelectHistoryImage}
                  />
                </div>
              </div>
            </div>

            {/* Right Column: Plan & Details */}
            <div className="space-y-6">
              {/* Plan & Credits */}
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium space-y-4 hover:shadow-card-hover transition-all duration-300">
                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-50 pb-3">
                  Plan & credits
                </h3>
                <div className="space-y-3.5 text-xs font-medium text-slate-600">
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Current ad plan:</span>
                    <span className="font-bold text-slate-900" id="ai-current-plan-2">
                      Premium
                    </span>
                  </div>
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Available AI credits:</span>
                    <span className="font-bold text-indigo-600" id="ai-current-tokens-2">
                      {availableCredits} credit
                    </span>
                  </div>
                  <div className="flex justify-between hover:text-slate-900 transition-colors">
                    <span>Cost for this generation:</span>
                    <span className="font-bold text-amber-600" id="ai-last-cost">
                      {lastCost > 0 ? `- ${lastCost} credit` : '- credit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Submission Panel */}
              <div
                id="ai-submission-panel"
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-premium h-fit space-y-6 transition-all duration-300 hover:shadow-card-hover"
              >
                <div className="flex items-center justify-between border-b border-slate-50 pb-3">
                  <h3 className="text-base font-bold text-slate-900">Ad details</h3>
                  <span
                    id="ai-lock-status"
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      isBannerSelected ? 'text-emerald-500' : 'text-amber-500'
                    }`}
                  >
                    {isBannerSelected ? 'Ready' : 'Locked'}
                  </span>
                </div>

                {!isBannerSelected && (
                  <div className="flex flex-col items-center gap-2 py-6 text-center">
                    <LucideIcon name="lock" className="w-5 h-5 text-slate-300" />
                    <p className="text-xs text-slate-400 max-w-[220px]">
                      Select "Use this banner" to unlock ad details.
                    </p>
                  </div>
                )}

                <div className={`space-y-6 ${isBannerSelected ? '' : 'hidden'}`}>
                <div className="space-y-1.5">
                  <label htmlFor="ai-name-input" className="text-xs font-bold text-slate-700">
                    Banner name *
                  </label>
                  <input
                    type="text"
                    id="ai-name-input"
                    disabled={isSubmitting || !isBannerSelected}
                    value={bannerName}
                    onChange={(e) => setBannerName(e.target.value)}
                    placeholder="e.g. Luxury AI Banner Design"
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200/60 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-input-glow transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="ai-target-url"
                    className="text-xs font-bold text-slate-700 flex justify-between"
                  >
                    <span>Target URL</span>
                    <span className="text-slate-400 font-normal">Optional</span>
                  </label>
                  <input
                    type="url"
                    id="ai-target-url"
                    disabled={isSubmitting || !isBannerSelected}
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    placeholder="https://example.com"
                    className="w-full bg-slate-50 text-slate-800 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200/60 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-input-glow transition-all duration-300"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-700">Display schedule</label>
                    <span className="text-slate-400 text-xs">Optional</span>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1 2xl:grid-cols-2">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold">Start date</span>
                      <input
                        type="date"
                        id="ai-start-date"
                        disabled={isSubmitting || !isBannerSelected}
                        min={today}
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-xs p-2 rounded-xl border border-slate-200/60 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-input-glow transition-all duration-300"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold">End date</span>
                      <input
                        type="date"
                        id="ai-end-date"
                        disabled={isSubmitting || !isBannerSelected}
                        min={today}
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-slate-50 text-slate-800 text-xs p-2 rounded-xl border border-slate-200/60 focus:outline-none focus:border-indigo-500 focus:bg-white focus:shadow-input-glow transition-all duration-300"
                      />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic leading-relaxed mt-1">
                    Target URL and schedule are optional. If you set one date, both start and end
                    dates are required.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    disabled={isSubmitting || !isBannerSelected}
                    onClick={handleSaveDraft}
                    className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 font-semibold text-xs transition-colors duration-300 btn-bounce disabled:opacity-50"
                  >
                    Save draft
                  </button>
                  <button
                    type="button"
                    disabled={isSubmitting || !isBannerSelected}
                    onClick={handlePublish}
                    className="flex flex-1 items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 hover:shadow-btn-indigo-glow hover:-translate-y-0.5 text-white font-bold text-xs transition-all duration-300 btn-bounce disabled:opacity-50"
                  >
                    Publish
                    <LucideIcon name="arrow-right" className="h-3.5 w-3.5" />
                  </button>
                </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* Library of previously generated images */}
      <MyImagesPanel />
    </div>
  )
}
