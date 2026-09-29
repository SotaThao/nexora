// CreateEditPosPromotionModal — studio layout matching the reward-promotions HTML prototype:
// details, discount & schedule, placements, and a multi-banner / poster preview column.
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ExternalLink,
  Globe,
  Loader2,
  Plus,
  Scan,
  ShoppingBag,
  Upload,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import {
  MAX_DISCOUNT_AMOUNT,
  MAX_DISCOUNT_PERCENT,
  PosServiceDiscountType,
} from '../../../../../constants/posDiscount'
import { TWELVE_HOUR_INPUT_LANG } from '../../../../../constants/timeFormat'
import { sanitizeDecimalInput } from '../../../../../utils/currencyInput'
import { normalizeAllowedImageFile } from '../../../../../utils/imageFile'
import { usePosPromotionDetail } from '../../../../../data/hooks/usePosPromotions'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../../types/repositories'
import { POS_WEEK_DAYS, formatPromotionArtSaving, formatPromotionStudioSchedule } from '../posPromotionDisplay'
import type { PosPromotionDraft, PromoArtTheme } from '../posPromotionTemplates'
import {
  colorHexFromTheme,
  promotionBannerImageUrl,
  themeFromColorHex,
} from '../posPromotionBanner'
import PosPromotionBannerArt from '../PosPromotionBannerArt'
import { printPosPromoPoster } from '../printPosPromoPoster'
import '../pos-promotions.css'

const BANNER_THEMES: PromoArtTheme[] = [
  'purple',
  'gold',
  'rose',
  'ocean',
  'teal',
  'sage',
  'peach',
  'slate',
]

const K = 'components.dashboard.views.pos.PosPromotionsView'
const MAX_BANNERS = 8
const DEFAULT_START = '10:00'
const DEFAULT_END = '14:00'
const DEFAULT_THEME: PromoArtTheme = 'purple'

type EditorBanner = {
  key: string
  theme: PromoArtTheme
  /** Remote URL from detail, or object URL for a new file. */
  imageUrl: string | null
  imageFile: File | null
  imageName: string | null
  /** True when imageUrl is a createObjectURL we must revoke. */
  localObjectUrl: boolean
}

/** Keep discount typing decimal-only and clamp to the type's ceiling (100% / $99,999.99). */
function sanitizeDiscountValueInput(raw: string, max: number): string {
  const cleaned = sanitizeDecimalInput(raw)
  if (!cleaned || cleaned.endsWith('.')) return cleaned
  const n = Number(cleaned)
  if (!Number.isFinite(n)) return cleaned
  if (n > max) return String(max)
  return cleaned
}

function newBannerKey(): string {
  return `banner-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function createThemeBanner(theme: PromoArtTheme = DEFAULT_THEME): EditorBanner {
  return {
    key: newBannerKey(),
    theme,
    imageUrl: null,
    imageFile: null,
    imageName: null,
    localObjectUrl: false,
  }
}

function bannerHasImage(banner: EditorBanner): boolean {
  return Boolean(banner.imageFile || banner.imageUrl)
}

function revokeLocalUrl(banner: EditorBanner) {
  if (banner.localObjectUrl && banner.imageUrl) URL.revokeObjectURL(banner.imageUrl)
}

enum PromotionField {
  Name = 'name',
  Value = 'value',
  Days = 'days',
  Window = 'window',
  Banners = 'banners',
}

type PromotionErrors = Partial<Record<PromotionField, string>>

function toApiTime(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}

function toInputTime(value: string): string {
  return value.slice(0, 5)
}

export default function CreateEditPosPromotionModal({
  businessId,
  promotion,
  draft,
  isSaving,
  onSubmit,
  onClose,
}: {
  businessId?: string
  /** Null while creating. */
  promotion: PosPromotionApiDto | null
  /** Prefill from a template when creating; ignored while editing. */
  draft?: PosPromotionDraft | null
  isSaving: boolean
  onSubmit: (payload: PosPromotionPayload) => void
  onClose: () => void
}) {
  const { t, currentLanguage } = useTranslation()
  const uploadInputId = useId()
  const detailQuery = usePosPromotionDetail(businessId, promotion?.id)
  /** Seed banners from detail once per promotion — refetch must not wipe in-progress uploads. */
  const detailSeededForIdRef = useRef<string | null>(null)

  const [name, setName] = useState('')
  const [badgeLabel, setBadgeLabel] = useState('')
  const [description, setDescription] = useState('')
  const [banners, setBanners] = useState<EditorBanner[]>(() => [createThemeBanner()])
  const [selectedBannerIndex, setSelectedBannerIndex] = useState(0)
  const [addTheme, setAddTheme] = useState<PromoArtTheme>(DEFAULT_THEME)
  const [templateCode, setTemplateCode] = useState<string | null>(null)
  const [discountType, setDiscountType] = useState<PosServiceDiscountType>(PosServiceDiscountType.Percent)
  const [valueInput, setValueInput] = useState('')
  const [days, setDays] = useState<string[]>([])
  const [startTime, setStartTime] = useState(DEFAULT_START)
  const [endTime, setEndTime] = useState(DEFAULT_END)
  const [isActive, setIsActive] = useState(false)
  const [showHero, setShowHero] = useState(false)
  const [submitPublic, setSubmitPublic] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<PromotionErrors>({})
  const [posterOpen, setPosterOpen] = useState(false)
  const [posterIndex, setPosterIndex] = useState(0)

  const replaceBanners = (next: EditorBanner[]) => {
    setBanners((prev) => {
      prev.forEach((banner) => {
        if (!next.some((item) => item.key === banner.key)) revokeLocalUrl(banner)
      })
      return next
    })
  }

  useEffect(() => {
    detailSeededForIdRef.current = null
    if (promotion) {
      setName(promotion.name ?? '')
      setBadgeLabel(promotion.badgeLabel ?? '')
      setDescription(promotion.description ?? '')
      const seedTheme = themeFromColorHex(promotion.primaryBannerColorHex) ?? DEFAULT_THEME
      const seedImage = promotionBannerImageUrl(promotion)
      replaceBanners([
        seedImage
          ? {
              key: newBannerKey(),
              theme: seedTheme,
              imageUrl: seedImage,
              imageFile: null,
              imageName: null,
              localObjectUrl: false,
            }
          : createThemeBanner(seedTheme),
      ])
      setSelectedBannerIndex(0)
      setAddTheme(seedTheme)
      setTemplateCode(promotion.templateCode ?? null)
      setDiscountType(
        promotion.discountType === PosServiceDiscountType.Amount
          ? PosServiceDiscountType.Amount
          : PosServiceDiscountType.Percent,
      )
      setValueInput(String(promotion.discountValue))
      setDays(promotion.daysOfWeek ?? [])
      setStartTime(toInputTime(promotion.startTime))
      setEndTime(toInputTime(promotion.endTime))
      setIsActive(promotion.isActive)
      setShowHero(Boolean(promotion.showOnOneQrHero))
      setSubmitPublic(Boolean(promotion.submitToSearchDeals))
    } else if (draft) {
      setName(draft.name)
      setBadgeLabel(draft.badgeLabel)
      setDescription(draft.description)
      replaceBanners([createThemeBanner(draft.theme)])
      setSelectedBannerIndex(0)
      setAddTheme(draft.theme)
      setTemplateCode(draft.templateCode ?? null)
      setDiscountType(draft.discountType)
      setValueInput(String(draft.discountValue))
      setDays([...draft.daysOfWeek])
      setStartTime(draft.startTime)
      setEndTime(draft.endTime)
      setIsActive(false)
      setShowHero(false)
      setSubmitPublic(false)
    } else {
      setName('')
      setBadgeLabel('')
      setDescription('')
      replaceBanners([createThemeBanner()])
      setSelectedBannerIndex(0)
      setAddTheme(DEFAULT_THEME)
      setTemplateCode(null)
      setDiscountType(PosServiceDiscountType.Percent)
      setValueInput('')
      setDays([])
      setStartTime(DEFAULT_START)
      setEndTime(DEFAULT_END)
      setIsActive(false)
      setShowHero(false)
      setSubmitPublic(false)
    }
    setFieldErrors({})
    setPosterOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seed once per promotion/draft identity
  }, [promotion, draft])

  useEffect(() => {
    const detail = detailQuery.data
    if (!promotion || !detail?.banners?.length) return
    // Only hydrate once — later refetches must not clobber a freshly chosen local file.
    if (detailSeededForIdRef.current === promotion.id) return

    const next = [...detail.banners]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((banner) => {
        const theme = themeFromColorHex(banner.colorHex) ?? DEFAULT_THEME
        return {
          key: newBannerKey(),
          theme,
          imageUrl: banner.imageUrl || null,
          imageFile: null,
          imageName: banner.imageUrl ? t(`${K}.uploadedTheme`) : null,
          localObjectUrl: false,
        } satisfies EditorBanner
      })

    if (next.length === 0) return
    detailSeededForIdRef.current = promotion.id
    replaceBanners(next)
    setSelectedBannerIndex(0)
    setAddTheme(next[0].theme)
    setShowHero(Boolean(detail.showOnOneQrHero))
    setSubmitPublic(Boolean(detail.submitToSearchDeals))
  }, [detailQuery.data, promotion, t])

  useEffect(() => {
    return () => {
      banners.forEach(revokeLocalUrl)
    }
    // Only on unmount — banners cleanup on replace is handled in replaceBanners.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const parsedValue = Number(valueInput)
  const isPercent = discountType === PosServiceDiscountType.Percent
  const valueMax = isPercent ? MAX_DISCOUNT_PERCENT : MAX_DISCOUNT_AMOUNT
  const valueWithinMax =
    Number.isFinite(parsedValue) && parsedValue > 0 && parsedValue <= valueMax

  const selectedBanner = banners[selectedBannerIndex] ?? banners[0]
  const atBannerLimit = banners.length >= MAX_BANNERS

  /** Color themes already used by a solid banner — each theme may appear once in the list. */
  const usedColorThemes = useMemo(() => {
    const used = new Set<PromoArtTheme>()
    banners.forEach((banner) => {
      if (!bannerHasImage(banner)) used.add(banner.theme)
    })
    return used
  }, [banners])

  const nextAvailableTheme = useMemo(
    () => BANNER_THEMES.find((themeId) => !usedColorThemes.has(themeId)) ?? null,
    [usedColorThemes],
  )

  const canAddThemeBanner =
    !atBannerLimit && Boolean(nextAvailableTheme) && !usedColorThemes.has(addTheme)

  // If the pending add color gets taken, jump the picker to the next free theme.
  useEffect(() => {
    if (!usedColorThemes.has(addTheme)) return
    if (nextAvailableTheme) setAddTheme(nextAvailableTheme)
  }, [addTheme, nextAvailableTheme, usedColorThemes])

  /** Any solid theme already in the banner list is locked — picker is only for the next Add. */
  const isThemeLockedInDropdown = (themeId: PromoArtTheme) => usedColorThemes.has(themeId)

  const clearFieldError = (field: PromotionField) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const syncWindowError = (nextStart: string, nextEnd: string) => {
    if (!nextStart || !nextEnd) {
      clearFieldError(PromotionField.Window)
      return
    }
    if (nextEnd <= nextStart) {
      setFieldErrors((prev) => ({
        ...prev,
        [PromotionField.Window]: t(`${K}.windowInvalid`),
      }))
      return
    }
    clearFieldError(PromotionField.Window)
  }

  const validateFields = (): PromotionErrors => {
    const errors: PromotionErrors = {}

    if (!name.trim()) errors[PromotionField.Name] = t(`${K}.errorNameRequired`)

    if (!valueInput.trim()) {
      errors[PromotionField.Value] = t(`${K}.errorValueRequired`)
    } else if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      errors[PromotionField.Value] = t(`${K}.errorValueInvalid`)
    } else if (isPercent && parsedValue > MAX_DISCOUNT_PERCENT) {
      errors[PromotionField.Value] = t(`${K}.errorValuePercentMax`, { max: MAX_DISCOUNT_PERCENT })
    } else if (!isPercent && parsedValue > MAX_DISCOUNT_AMOUNT) {
      errors[PromotionField.Value] = t(`${K}.errorValueAmountMax`, { max: MAX_DISCOUNT_AMOUNT })
    }

    if (days.length === 0) errors[PromotionField.Days] = t(`${K}.errorDaysRequired`)

    if (!startTime || !endTime) {
      errors[PromotionField.Window] = t(`${K}.errorWindowRequired`)
    } else if (endTime <= startTime) {
      errors[PromotionField.Window] = t(`${K}.windowInvalid`)
    }

    if (banners.length < 1 || banners.length > MAX_BANNERS) {
      errors[PromotionField.Banners] = t(`${K}.bannerError`)
    }

    return errors
  }

  const toggleDay = (day: string) => {
    setDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]))
    clearFieldError(PromotionField.Days)
  }

  /** Dropdown only picks the color for the next "Add banner" — never mutates the selected row. */
  const handleThemeSelectChange = (theme: PromoArtTheme) => {
    if (usedColorThemes.has(theme)) return
    setAddTheme(theme)
  }

  const handleAddBanner = () => {
    if (atBannerLimit) return
    const themeToAdd = !usedColorThemes.has(addTheme) ? addTheme : nextAvailableTheme
    if (!themeToAdd) return
    const next = createThemeBanner(themeToAdd)
    setBanners((prev) => [...prev, next])
    setSelectedBannerIndex(banners.length)
    clearFieldError(PromotionField.Banners)
  }

  const handleUpload = (file: File | null) => {
    if (!file) return
    const normalized = normalizeAllowedImageFile(file)
    if (!normalized) {
      setFieldErrors((prev) => ({
        ...prev,
        [PromotionField.Banners]: t(`${K}.bannerImageInvalidType`),
      }))
      return
    }
    const objectUrl = URL.createObjectURL(normalized)
    const imageBanner: EditorBanner = {
      key: newBannerKey(),
      theme: addTheme,
      imageUrl: objectUrl,
      imageFile: normalized,
      imageName: normalized.name,
      localObjectUrl: true,
    }

    // Uploaded art becomes the cover (index 0). A lone default theme banner is replaced;
    // otherwise the selected slot is converted / replaced, then moved to front.
    setBanners((prev) => {
      if (prev.length === 0) return [imageBanner]

      const onlyDefaultTheme = prev.length === 1 && !bannerHasImage(prev[0])
      if (onlyDefaultTheme) {
        revokeLocalUrl(prev[0])
        return [imageBanner]
      }

      const idx = Math.min(Math.max(selectedBannerIndex, 0), prev.length - 1)
      const copy = [...prev]
      revokeLocalUrl(copy[idx])
      copy[idx] = { ...imageBanner, key: copy[idx].key }
      if (idx !== 0) {
        const [picked] = copy.splice(idx, 1)
        copy.unshift(picked)
      }
      return copy
    })
    setSelectedBannerIndex(0)
    clearFieldError(PromotionField.Banners)
  }

  const moveBanner = (index: number, delta: number) => {
    const nextIndex = index + delta
    if (nextIndex < 0 || nextIndex >= banners.length) return
    setBanners((prev) => {
      const copy = [...prev]
      ;[copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]]
      return copy
    })
    setSelectedBannerIndex(nextIndex)
  }

  /** Clicking a banner both previews it and makes it the cover (sort order 0). */
  const selectBannerAsCover = (index: number) => {
    if (index < 0 || index >= banners.length) return
    if (index === 0) {
      setSelectedBannerIndex(0)
      return
    }
    setBanners((prev) => {
      const copy = [...prev]
      const [picked] = copy.splice(index, 1)
      copy.unshift(picked)
      return copy
    })
    setSelectedBannerIndex(0)
  }

  const removeBanner = (index: number) => {
    if (banners.length <= 1) return
    setBanners((prev) => {
      const removed = prev[index]
      if (removed) revokeLocalUrl(removed)
      return prev.filter((_, i) => i !== index)
    })
    setSelectedBannerIndex((prev) => {
      if (index < prev) return prev - 1
      if (index === prev) return Math.min(index, banners.length - 2)
      return prev
    })
  }

  const handleSubmit = () => {
    if (isSaving) return
    // Edit PUT is a full banner replace — wait for detail so we don't wipe extra banners.
    if (promotion && !detailQuery.isSuccess) return
    const errors = validateFields()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    const bannerPayloads = banners.map((banner) => {
      if (banner.imageFile) {
        return { colorHex: null, image: banner.imageFile as File, imageUrl: null as string | null }
      }
      if (banner.imageUrl && !banner.localObjectUrl) {
        return { colorHex: null, image: null as File | null, imageUrl: banner.imageUrl }
      }
      return {
        colorHex: colorHexFromTheme(banner.theme),
        image: null as File | null,
        imageUrl: null as string | null,
      }
    })

    // Cover is banners[0] — kept in sync when the Owner clicks a row (selectBannerAsCover)
    // or uses move up/down. Do not reorder here.
    const coverImage = bannerPayloads[0]?.image ?? null

    onSubmit({
      name: name.trim(),
      badgeLabel: badgeLabel.trim() || null,
      description: description.trim() || null,
      templateCode: templateCode || null,
      // Legacy Photo mirrors the cover image so create still works if nested banner file
      // binding drops Banners[i].Image on the wire.
      photo: coverImage,
      banners: bannerPayloads,
      discountType,
      discountValue: parsedValue,
      daysOfWeek: days,
      startTime: toApiTime(startTime),
      endTime: toApiTime(endTime),
      isActive,
      showOnOneQrHero: showHero,
      submitToSearchDeals: submitPublic,
    })
  }

  const previewRate = valueInput.trim() && valueWithinMax
    ? formatPromotionArtSaving(discountType, parsedValue)
    : t(`${K}.invalidPreview`)

  const previewName = name.trim() || t(`${K}.previewUntitled`)
  const previewBadge = badgeLabel.trim() || t(`${K}.specialOffer`)
  const isEditDetailPending = Boolean(promotion) && detailQuery.isPending
  const isEditDetailFailed = Boolean(promotion) && detailQuery.isError
  const saveDisabled = isSaving || isEditDetailPending || isEditDetailFailed
  const firstError =
    fieldErrors.name ||
    fieldErrors.value ||
    fieldErrors.days ||
    fieldErrors.window ||
    fieldErrors.banners ||
    ''

  const themeSelectValue = addTheme

  const bannerLabel = (banner: EditorBanner) => {
    if (bannerHasImage(banner)) {
      return banner.imageName || t(`${K}.uploadedTheme`)
    }
    return t(`${K}.theme.${banner.theme}`)
  }

  const renderArt = (banner: EditorBanner | undefined, large = false) => {
    if (!banner) return null
    return (
      <PosPromotionBannerArt
        promotion={{
          name: previewName,
          badgeLabel: previewBadge,
          discountType,
          discountValue: parsedValue,
          primaryBannerImageUrl: bannerHasImage(banner) ? banner.imageUrl : null,
          photoUrl: null,
          primaryBannerColorHex: bannerHasImage(banner) ? null : colorHexFromTheme(banner.theme),
        }}
        specialOfferFallback={t(`${K}.specialOffer`)}
        savingLabel={previewRate}
        className={large ? 'poster-art' : ''}
      />
    )
  }

  const schedulePreview = useMemo(
    () =>
      formatPromotionStudioSchedule(
        days,
        startTime,
        endTime,
        currentLanguage,
        (day) => t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`),
      ),
    [days, startTime, endTime, currentLanguage, t],
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0c1b3b59] p-4 backdrop-blur-[2px]">
      <div
        className="pos-promo-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pos-promo-editor-title"
      >
        <header className="editor-header">
          <div>
            <p className="promo-eyebrow">{t(`${K}.studioEyebrow`)}</p>
            <h2 id="pos-promo-editor-title">
              {promotion ? t(`${K}.editTitle`) : t(`${K}.createTitle`)}
            </h2>
          </div>
          <button
            type="button"
            className="promo-close"
            aria-label={t(`${K}.cancel`)}
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="editor-help">
          <strong>{t(`${K}.helpTitle`)}</strong>
          <span>{t(`${K}.helpSteps`)}</span>
          <small>{t(`${K}.helpNote`)}</small>
        </div>

        <div className="editor-body">
          <div className="editor-fields">
            <section className="editor-section" aria-labelledby="promo-details-title">
              <h3 className="section-number" id="promo-details-title">
                {t(`${K}.detailsSection`)}
              </h3>
              <div className="promo-field-row details-row">
                <label className="promo-field">
                  <span>{t(`${K}.nameLabel`)}</span>
                  <input
                    type="text"
                    value={name}
                    maxLength={100}
                    onChange={(e) => {
                      setName(e.target.value)
                      clearFieldError(PromotionField.Name)
                    }}
                    placeholder={t(`${K}.namePlaceholder`)}
                    aria-invalid={Boolean(fieldErrors.name)}
                    className={fieldErrors.name ? 'is-invalid' : undefined}
                  />
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.badgeLabel`)}</span>
                  <input
                    type="text"
                    value={badgeLabel}
                    maxLength={50}
                    onChange={(e) => setBadgeLabel(e.target.value)}
                    placeholder={t(`${K}.badgePlaceholder`)}
                  />
                </label>
              </div>
              {fieldErrors.name ? <p className="field-error">{fieldErrors.name}</p> : null}
              <p className="promo-note">{t(`${K}.detailsHint`)}</p>
              <label className="promo-field">
                <span>{t(`${K}.descriptionLabel`)}</span>
                <textarea
                  value={description}
                  maxLength={1000}
                  rows={3}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t(`${K}.descriptionPlaceholder`)}
                />
              </label>
            </section>

            <section className="editor-section" aria-labelledby="promo-schedule-title">
              <h3 className="section-number" id="promo-schedule-title">
                {t(`${K}.scheduleSection`)}
              </h3>
              <div className="promo-field-row">
                <label className="promo-field">
                  <span>{t(`${K}.typeLabel`)}</span>
                  <select
                    value={discountType}
                    onChange={(e) => {
                      const nextType = e.target.value as PosServiceDiscountType
                      const nextMax =
                        nextType === PosServiceDiscountType.Percent
                          ? MAX_DISCOUNT_PERCENT
                          : MAX_DISCOUNT_AMOUNT
                      setDiscountType(nextType)
                      setValueInput((prev) => sanitizeDiscountValueInput(prev, nextMax))
                      clearFieldError(PromotionField.Value)
                    }}
                  >
                    <option value={PosServiceDiscountType.Percent}>{t(`${K}.typePercent`)}</option>
                    <option value={PosServiceDiscountType.Amount}>{t(`${K}.typeAmount`)}</option>
                  </select>
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.valueLabel`)}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    value={valueInput}
                    onChange={(e) => {
                      setValueInput(sanitizeDiscountValueInput(e.target.value, valueMax))
                      clearFieldError(PromotionField.Value)
                    }}
                    placeholder={isPercent ? '15' : '10'}
                    aria-invalid={Boolean(fieldErrors.value)}
                    className={fieldErrors.value ? 'is-invalid' : undefined}
                  />
                </label>
              </div>
              {fieldErrors.value ? <p className="field-error">{fieldErrors.value}</p> : null}

              <fieldset className="promo-days">
                <legend>{t(`${K}.daysLabel`)}</legend>
                <div>
                  {POS_WEEK_DAYS.map((day) => (
                    <label
                      key={day}
                      className={`promo-day${fieldErrors.days ? ' is-invalid' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={days.includes(day)}
                        onChange={() => toggleDay(day)}
                      />
                      <span>
                        {t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`)}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {fieldErrors.days ? <p className="field-error">{fieldErrors.days}</p> : null}

              <div className="promo-field-row">
                <label className="promo-field">
                  <span>{t(`${K}.startLabel`)}</span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    value={startTime}
                    onChange={(e) => {
                      const next = e.target.value
                      setStartTime(next)
                      syncWindowError(next, endTime)
                    }}
                    aria-invalid={Boolean(fieldErrors.window)}
                    className={fieldErrors.window ? 'is-invalid' : undefined}
                  />
                </label>
                <label className="promo-field">
                  <span>{t(`${K}.endLabel`)}</span>
                  <input
                    type="time"
                    lang={TWELVE_HOUR_INPUT_LANG}
                    value={endTime}
                    onChange={(e) => {
                      const next = e.target.value
                      setEndTime(next)
                      syncWindowError(startTime, next)
                    }}
                    aria-invalid={Boolean(fieldErrors.window)}
                    className={fieldErrors.window ? 'is-invalid' : undefined}
                  />
                </label>
              </div>
              {fieldErrors.window ? <p className="field-error">{fieldErrors.window}</p> : null}
              <p className="promo-note">{t(`${K}.timeHint`)}</p>
            </section>

            <section className="editor-section" aria-labelledby="promo-placements-title">
              <h3 className="section-number" id="promo-placements-title">
                {t(`${K}.placementsSection`)}
              </h3>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.activeLabel`)}</strong>
                  <small>{t(`${K}.checkoutHint`)}</small>
                </span>
                <ShoppingBag className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={showHero}
                  onChange={(e) => setShowHero(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.heroLabel`)}</strong>
                  <small>{t(`${K}.heroHint`)}</small>
                </span>
                <Scan className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <label className="promo-check-card">
                <input
                  type="checkbox"
                  checked={submitPublic}
                  onChange={(e) => setSubmitPublic(e.target.checked)}
                />
                <span>
                  <strong>{t(`${K}.publicLabel`)}</strong>
                  <small>{t(`${K}.publicHint`)}</small>
                </span>
                <Globe className="promo-check-icon h-5 w-5" aria-hidden />
              </label>
              <p className="promo-note">{t(`${K}.publicNote`)}</p>
            </section>
          </div>

          <aside className="editor-preview" aria-labelledby="promo-banners-title">
            <h3 className="section-number" id="promo-banners-title">
              {t(`${K}.bannersSection`)}
            </h3>
            <div aria-live="polite">{renderArt(selectedBanner)}</div>
            <p className="promo-note">{t(`${K}.bannerHint`)}</p>

            <div className="promo-banner-list" role="listbox" aria-label={t(`${K}.bannersSection`)}>
              {banners.map((banner, index) => {
                const selected = index === selectedBannerIndex
                return (
                  <div
                    key={banner.key}
                    role="option"
                    tabIndex={0}
                    aria-selected={selected}
                    aria-current={selected ? 'true' : undefined}
                    className={`banner-row${selected ? ' is-selected' : ''}`}
                    onClick={() => selectBannerAsCover(index)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        selectBannerAsCover(index)
                      }
                    }}
                  >
                    <span className="banner-name">
                      {index + 1}. {bannerLabel(banner)}
                      {index === 0 ? <small>{t(`${K}.cover`)}</small> : null}
                    </span>
                    <div className="banner-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        className="promo-button icon-button"
                        aria-label={t(`${K}.moveUp`)}
                        title={t(`${K}.moveUp`)}
                        disabled={index === 0}
                        onClick={() => moveBanner(index, -1)}
                      >
                        <ArrowUp className="promo-action-icon" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="promo-button icon-button"
                        aria-label={t(`${K}.moveDown`)}
                        title={t(`${K}.moveDown`)}
                        disabled={index === banners.length - 1}
                        onClick={() => moveBanner(index, 1)}
                      >
                        <ArrowDown className="promo-action-icon" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className="promo-button icon-button danger"
                        aria-label={t(`${K}.removeBanner`)}
                        title={t(`${K}.removeBanner`)}
                        disabled={banners.length <= 1}
                        onClick={() => removeBanner(index)}
                      >
                        <X className="promo-action-icon" aria-hidden />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            {fieldErrors.banners ? <p className="field-error">{fieldErrors.banners}</p> : null}

            <div className="promo-field-row banner-add-row">
              <label className="promo-field">
                <span>{t(`${K}.chooseTheme`)}</span>
                <select
                  value={themeSelectValue}
                  aria-describedby={usedColorThemes.size > 0 ? 'promo-theme-select-hint' : undefined}
                  onChange={(e) => {
                    const value = e.target.value
                    if (!value) return
                    handleThemeSelectChange(value as PromoArtTheme)
                  }}
                >
                  {BANNER_THEMES.map((themeId) => {
                    const locked = isThemeLockedInDropdown(themeId)
                    return (
                      <option
                        key={themeId}
                        value={themeId}
                        disabled={locked}
                        aria-disabled={locked}
                      >
                        {locked
                          ? t(`${K}.themeUsedOption`, { name: t(`${K}.theme.${themeId}`) })
                          : t(`${K}.theme.${themeId}`)}
                      </option>
                    )
                  })}
                </select>
              </label>
              <button
                type="button"
                className="promo-button"
                disabled={!canAddThemeBanner}
                title={!canAddThemeBanner ? t(`${K}.themeAlreadyUsed`) : undefined}
                onClick={handleAddBanner}
              >
                <Plus className="promo-action-icon h-4 w-4" aria-hidden />
                <span>{t(`${K}.addBanner`)}</span>
              </button>
            </div>
            {usedColorThemes.size > 0 ? (
              <p id="promo-theme-select-hint" className="promo-note">
                {t(`${K}.themeAlreadyUsed`)}
              </p>
            ) : null}

            <label className="promo-upload" htmlFor={uploadInputId}>
              <Upload className="h-5 w-5 text-nexoraBrand" aria-hidden />
              <strong>{t(`${K}.upload`)}</strong>
              <span className="promo-note">{t(`${K}.chooseFile`)}</span>
              <input
                id={uploadInputId}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,.png,.jpg,.jpeg,.webp"
                onChange={(e) => {
                  handleUpload(e.target.files?.[0] ?? null)
                  e.target.value = ''
                }}
              />
            </label>
            <p className="promo-note">{t(`${K}.uploadHint`)}</p>

            <button
              type="button"
              className="promo-text-button"
              onClick={() => {
                setPosterIndex(selectedBannerIndex)
                setPosterOpen(true)
              }}
            >
              <ExternalLink className="h-4 w-4" aria-hidden />
              <span>{t(`${K}.previewPrint`)}</span>
            </button>
          </aside>
        </div>

        <footer className="editor-footer">
          <div>
            {firstError ? (
              <p className="promo-error" role="alert">
                {firstError}
              </p>
            ) : null}
            {isEditDetailFailed ? (
              <p className="promo-error" role="alert">
                {t(`${K}.editDetailLoadError`)}
              </p>
            ) : null}
            <p className="promo-note">
              {isEditDetailPending
                ? t(`${K}.editDetailLoading`)
                : promotion
                  ? t(`${K}.editNote`)
                  : t(`${K}.saveNote`)}
            </p>
          </div>
          <div className="editor-footer-actions">
            <button type="button" className="promo-button" onClick={onClose} disabled={isSaving}>
              {t(`${K}.cancel`)}
            </button>
            <button
              type="button"
              className="promo-button primary"
              onClick={handleSubmit}
              disabled={saveDisabled}
              aria-busy={isSaving || isEditDetailPending}
            >
              {isSaving || isEditDetailPending ? (
                <Loader2 className="promo-action-icon h-4 w-4 animate-spin" aria-hidden />
              ) : null}
              <span>{t(`${K}.save`)}</span>
            </button>
          </div>
        </footer>
      </div>

      {posterOpen
        ? createPortal(
            <div className="pos-promo-poster-print-backdrop fixed inset-0 z-[60] flex items-center justify-center bg-[#0c1b3b59] p-4 backdrop-blur-[2px]">
              <div
                className="pos-promo-poster-dialog pos-promo-poster-print-root"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pos-promo-draft-poster-title"
              >
                <header className="editor-header">
                  <div>
                    <p className="promo-eyebrow">{t(`${K}.preview`)}</p>
                    <h2 id="pos-promo-draft-poster-title">{t(`${K}.promotionPoster`)}</h2>
                  </div>
                  <button
                    type="button"
                    className="promo-close"
                    aria-label={t(`${K}.closePreview`)}
                    onClick={() => setPosterOpen(false)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>
                <div className="poster-body">
                  <div className="poster-output">
                    {renderArt(banners[posterIndex] ?? selectedBanner, true)}
                  </div>
                  {banners.length > 1 ? (
                    <div className="poster-pager">
                      <button
                        type="button"
                        className="promo-button"
                        disabled={posterIndex === 0}
                        aria-label={t(`${K}.previousBanner`)}
                        onClick={() => setPosterIndex((i) => Math.max(0, i - 1))}
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden />
                      </button>
                      <span>
                        {posterIndex + 1} / {banners.length}
                      </span>
                      <button
                        type="button"
                        className="promo-button"
                        disabled={posterIndex >= banners.length - 1}
                        aria-label={t(`${K}.nextBanner`)}
                        onClick={() => setPosterIndex((i) => Math.min(banners.length - 1, i + 1))}
                      >
                        <ArrowRight className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  ) : null}
                  <div className="poster-details">
                    <h3>{previewName}</h3>
                    {description.trim() ? (
                      <p className="poster-description">{description.trim()}</p>
                    ) : null}
                    <p className="poster-schedule">{schedulePreview}</p>
                  </div>
                </div>
                <footer className="editor-footer">
                  <p className="promo-note">{t(`${K}.printHint`)}</p>
                  <button
                    type="button"
                    className="promo-button primary"
                    onClick={() => printPosPromoPoster()}
                  >
                    {t(`${K}.print`)}
                  </button>
                </footer>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}
