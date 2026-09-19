// PosPromotionsView — POS > Promotions. UI matches the reward-promotions HTML studio prototype
// (centered page, template grid, stats, search/filter, card actions with icons).
// Deactivating is the normal way to end an offer; deleting is only possible while unused.
import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  ArrowRight,
  CheckCircle2,
  Copy,
  Edit2,
  Eye,
  Image as ImageIcon,
  Layers,
  Loader2,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  Printer,
  Search,
  X,
} from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useNotification } from '../../../../contexts/NotificationContext'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreatePosPromotion,
  useDeletePosPromotion,
  usePosPromotions,
  useUpdatePosPromotion,
} from '../../../../data/hooks/usePosPromotions'
import { PosServiceDiscountType } from '../../../../constants/posDiscount'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import { printPosPromoPoster } from './printPosPromoPoster'
import CreateEditPosPromotionModal from './modals/CreateEditPosPromotionModal'
import {
  formatPromotionArtSaving,
  formatPromotionStudioSchedule,
} from './posPromotionDisplay'
import {
  draftFromTemplate,
  localizeTemplateText,
  POS_PROMOTION_TEMPLATES,
  promoArtThemeForIndex,
  type PosPromotionDraft,
  type PosPromotionTemplate,
} from './posPromotionTemplates'
import {
  promotionBannerColorHex,
  promotionBannerImageUrl,
  themeFromColorHex,
} from './posPromotionBanner'
import './pos-promotions.css'

const K = 'components.dashboard.views.pos.PosPromotionsView'

type StatusFilter = 'all' | 'enabled' | 'disabled'

function PromotionArt({
  name,
  badgeLabel,
  artSaving,
  imageUrl,
  theme,
  colorHex,
  specialOfferFallback,
  large = false,
}: {
  name: string
  badgeLabel?: string | null
  artSaving: string
  imageUrl?: string | null
  theme: string
  colorHex?: string | null
  specialOfferFallback: string
  large?: boolean
}) {
  if (imageUrl) {
    return (
      <div className={`promo-art image-art${large ? ' poster-art' : ''}`}>
        <img src={imageUrl} alt="" width={large ? 560 : 320} height={large ? 350 : 200} />
      </div>
    )
  }

  const customStyle =
    colorHex && !theme
      ? { background: `linear-gradient(115deg, ${colorHex}22, ${colorHex}0d)`, color: colorHex }
      : colorHex
        ? { color: colorHex }
        : undefined

  return (
    <div className={`promo-art theme-${theme || 'purple'}`} style={customStyle}>
      <span className="art-badge">{badgeLabel || specialOfferFallback}</span>
      <h3>{name || '—'}</h3>
      <strong className="art-saving">{artSaving}</strong>
    </div>
  )
}

function draftFromPromotion(promotion: PosPromotionApiDto, copySuffix: string): PosPromotionDraft {
  return {
    name: `${promotion.name} · ${copySuffix}`,
    badgeLabel: promotion.badgeLabel ?? '',
    description: promotion.description ?? '',
    discountType:
      promotion.discountType === PosServiceDiscountType.Amount
        ? PosServiceDiscountType.Amount
        : PosServiceDiscountType.Percent,
    discountValue: promotion.discountValue,
    daysOfWeek: promotion.daysOfWeek as PosPromotionDraft['daysOfWeek'],
    startTime: promotion.startTime.slice(0, 5),
    endTime: promotion.endTime.slice(0, 5),
    theme: themeFromColorHex(promotion.primaryBannerColorHex) ?? 'purple',
    templateCode: promotion.templateCode ?? null,
  }
}

export default function PosPromotionsView({ businessId }: { businessId?: string }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const { data: promotions = [], isLoading, isError, refetch } = usePosPromotions(businessId)
  const createPromotion = useCreatePosPromotion(businessId)
  const updatePromotion = useUpdatePosPromotion(businessId)
  const deletePromotion = useDeletePosPromotion(businessId)

  const [isCreating, setIsCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<PosPromotionDraft | null>(null)
  const [editing, setEditing] = useState<PosPromotionApiDto | null>(null)
  const [previewing, setPreviewing] = useState<PosPromotionApiDto | null>(null)
  const [previewThemeIndex, setPreviewThemeIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [compactChrome, setCompactChrome] = useState(false)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const sync = () => setCompactChrome(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  const reportError = (err: unknown) => showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')

  const closeModal = () => {
    setIsCreating(false)
    setCreateDraft(null)
    setEditing(null)
  }

  const openCreateBlank = () => {
    setEditing(null)
    setCreateDraft(null)
    setIsCreating(true)
  }

  const openCreateFromTemplate = (template: PosPromotionTemplate) => {
    setEditing(null)
    setCreateDraft(draftFromTemplate(template, currentLanguage))
    setIsCreating(true)
  }

  const openDuplicate = (promotion: PosPromotionApiDto) => {
    setEditing(null)
    setCreateDraft(draftFromPromotion(promotion, t(`${K}.copySuffix`)))
    setIsCreating(true)
  }

  const openPreview = (promotion: PosPromotionApiDto, index: number) => {
    setPreviewThemeIndex(index)
    setPreviewing(promotion)
  }

  const handleSubmit = (payload: PosPromotionPayload) => {
    if (editing) {
      updatePromotion.mutate(
        { promotionId: editing.id, payload },
        { onSuccess: closeModal, onError: reportError },
      )
      return
    }
    createPromotion.mutate(payload, { onSuccess: closeModal, onError: reportError })
  }

  const handleToggleActive = (promotion: PosPromotionApiDto) => {
    updatePromotion.mutate(
      {
        promotionId: promotion.id,
        payload: {
          name: promotion.name,
          badgeLabel: promotion.badgeLabel ?? null,
          description: promotion.description ?? null,
          templateCode: promotion.templateCode ?? null,
          discountType: promotion.discountType,
          discountValue: promotion.discountValue,
          daysOfWeek: promotion.daysOfWeek,
          startTime: promotion.startTime,
          endTime: promotion.endTime,
          isActive: !promotion.isActive,
        },
      },
      { onError: reportError },
    )
  }

  const handleDelete = async (promotion: PosPromotionApiDto) => {
    if (!promotion.canDelete) {
      showToast(t(`${K}.deleteBlocked`), 'error')
      return
    }
    const confirmed = await showConfirm(
      t(`${K}.deleteConfirmMessage`, { name: promotion.name }),
      t(`${K}.deleteConfirmTitle`),
    )
    if (!confirmed) return
    deletePromotion.mutate(promotion.id, { onError: reportError })
  }

  const handlePrintPoster = () => {
    printPosPromoPoster()
  }

  const enabledCount = promotions.filter((p) => p.isActive).length
  const bannerCount = promotions.filter((p) => Boolean(promotionBannerImageUrl(p))).length

  const filteredPromotions = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return promotions.filter((promotion) => {
      if (statusFilter === 'enabled' && !promotion.isActive) return false
      if (statusFilter === 'disabled' && promotion.isActive) return false
      if (!q) return true
      const haystack = `${promotion.name} ${promotion.badgeLabel ?? ''}`.toLowerCase()
      return haystack.includes(q)
    })
  }, [promotions, searchQuery, statusFilter])

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== 'all'
  const isModalOpen = isCreating || editing !== null

  const clearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
  }

  const dayLabel = (day: string) =>
    t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`)

  const scheduleText = (promotion: PosPromotionApiDto) =>
    formatPromotionStudioSchedule(
      promotion.daysOfWeek,
      promotion.startTime,
      promotion.endTime,
      currentLanguage,
      dayLabel,
    )

  const artSaving = (promotion: Pick<PosPromotionApiDto, 'discountType' | 'discountValue'>) =>
    formatPromotionArtSaving(promotion.discountType, promotion.discountValue)

  return (
    <div className="pos-promotions-page pos-promotions-breakout">
      <div className="pos-promotions-inner">
        <header className="promotions-heading">
          <div>
            <p className="promo-eyebrow">{t(`${K}.eyebrow`)}</p>
            <h1>{t('dashboard.menu.pos_promotions')}</h1>
            <p>{t(`${K}.description`)}</p>
          </div>
          <div className="heading-actions">
            <label className="promo-language">
              <span className="sr-only">{t(`${K}.language`)}</span>
              <select
                value={currentLanguage}
                aria-label={t(`${K}.language`)}
                onChange={(e) => setLanguage(e.target.value === 'vi' ? 'vi' : 'en')}
              >
                <option value="en">{compactChrome ? 'EN' : 'English'}</option>
                <option value="vi">{compactChrome ? 'VI' : 'Tiếng Việt'}</option>
              </select>
            </label>
            <button type="button" className="promo-button primary" onClick={openCreateBlank}>
              <Plus className="promo-action-icon h-4 w-4" aria-hidden />
              <span>{t(`${K}.addPromotion`)}</span>
            </button>
          </div>
        </header>

        <section className="promo-library" aria-labelledby="promo-templates-title">
          <p className="promo-eyebrow">{t(`${K}.startTemplate`)}</p>
          <h2 id="promo-templates-title">{t(`${K}.templateTitle`)}</h2>
          <p className="section-description">{t(`${K}.templateDescription`)}</p>
          <div className="promo-template-grid">
            {POS_PROMOTION_TEMPLATES.map((template) => (
              <article key={template.id} className="promo-template">
                <div className="template-art theme-purple">
                  <span className="template-symbol" aria-hidden>
                    {template.symbol}
                  </span>
                  <strong>{localizeTemplateText(template.offer, currentLanguage)}</strong>
                </div>
                <h3>{localizeTemplateText(template.purpose, currentLanguage)}</h3>
                <p>{localizeTemplateText(template.hint, currentLanguage)}</p>
                <button
                  type="button"
                  className="promo-button primary"
                  onClick={() => openCreateFromTemplate(template)}
                >
                  <span>{t(`${K}.useTemplate`)}</span>
                  <ArrowRight className="promo-action-icon h-4 w-4" aria-hidden />
                </button>
              </article>
            ))}
          </div>
          <p className="promo-note">{t(`${K}.templateNote`)}</p>
        </section>

        <section className="promo-stats" aria-label={t(`${K}.statsAria`)}>
          <article className="promo-stat">
            <span className="stat-icon">
              <Layers className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2>{t(`${K}.statTotal`)}</h2>
              <strong>{promotions.length}</strong>
            </div>
          </article>
          <article className="promo-stat">
            <span className="stat-icon mint">
              <CheckCircle2 className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2>{t(`${K}.statEnabled`)}</h2>
              <strong>{enabledCount}</strong>
            </div>
          </article>
          <article className="promo-stat">
            <span className="stat-icon blue">
              <ImageIcon className="h-[18px] w-[18px]" aria-hidden />
            </span>
            <div>
              <h2>{t(`${K}.statBanners`)}</h2>
              <strong>{bannerCount}</strong>
            </div>
          </article>
        </section>

        <section className="promo-manager" aria-label={t(`${K}.managerAria`)}>
          <div className="promo-toolbar">
            <div className="promo-search">
              <Search className="h-4 w-4 shrink-0" aria-hidden />
              <input
                type="text"
                className="promo-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t(`${K}.searchPlaceholder`)}
                aria-label={t(`${K}.searchPlaceholder`)}
                autoComplete="off"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              aria-label={t(`${K}.filterAria`)}
            >
              <option value="all">{t(`${K}.filterAll`)}</option>
              <option value="enabled">{t(`${K}.statEnabled`)}</option>
              <option value="disabled">{t(`${K}.filterDisabled`)}</option>
            </select>
          </div>

          {isLoading ? (
            <div className="nexora-card p-6">
              <SkeletonList count={3} lines={2} />
            </div>
          ) : isError ? (
            <div className="promo-empty" role="alert">
              <h2>{t(`${K}.loadError`)}</h2>
              <p>{t(`${K}.loadErrorHint`)}</p>
              <button type="button" className="promo-button" onClick={() => void refetch()}>
                {t(`${K}.retry`)}
              </button>
            </div>
          ) : filteredPromotions.length === 0 ? (
            <div className="promo-empty">
              <Search className="mx-auto h-8 w-8 text-[#999eb8]" aria-hidden />
              <h2>{hasActiveFilters ? t(`${K}.noMatches`) : t(`${K}.emptyTitle`)}</h2>
              <p>{hasActiveFilters ? t(`${K}.noMatchesHint`) : t(`${K}.emptyHint`)}</p>
              {hasActiveFilters ? (
                <button type="button" className="promo-button" onClick={clearFilters}>
                  {t(`${K}.clearFilters`)}
                </button>
              ) : (
                <button type="button" className="promo-button primary" onClick={openCreateBlank}>
                  <Plus className="h-4 w-4" aria-hidden />
                  <span>{t(`${K}.addPromotion`)}</span>
                </button>
              )}
            </div>
          ) : (
            <div className="promotion-grid">
              {filteredPromotions.map((promotion, index) => {
                const imageUrl = promotionBannerImageUrl(promotion)
                const colorHex = promotionBannerColorHex(promotion)
                const theme =
                  themeFromColorHex(colorHex) ?? promoArtThemeForIndex(index)
                const bannerLabel = `1 ${t(`${K}.bannerUnit`)}`
                return (
                  <article key={promotion.id} className="promotion-card">
                    <PromotionArt
                      name={promotion.name}
                      badgeLabel={promotion.badgeLabel}
                      artSaving={artSaving(promotion)}
                      imageUrl={imageUrl}
                      theme={theme}
                      colorHex={colorHex}
                      specialOfferFallback={t(`${K}.specialOffer`)}
                    />
                    <div className="promotion-card-body">
                      <h3>{promotion.name}</h3>
                      <p className="promotion-schedule">{scheduleText(promotion)}</p>
                      <div className="promo-badges">
                        <span
                          className={`promo-status ${promotion.isActive ? 'enabled' : 'disabled'}`}
                        >
                          {promotion.isActive ? t(`${K}.statEnabled`) : t(`${K}.filterDisabled`)}
                        </span>
                        {promotion.isActive ? (
                          <span className="promo-chip">{t(`${K}.chipCheckout`)}</span>
                        ) : null}
                        {imageUrl ? (
                          <span className="promo-chip">{t(`${K}.chipHero`)}</span>
                        ) : null}
                        <span className="promo-chip">{bannerLabel}</span>
                      </div>
                      <div className="promotion-actions">
                        <button
                          type="button"
                          className="promo-button"
                          title={t(`${K}.editAction`)}
                          aria-label={t(`${K}.editAction`)}
                          onClick={() => setEditing(promotion)}
                        >
                          <Edit2 className="promo-action-icon" aria-hidden />
                          <span>{t(`${K}.editAction`)}</span>
                        </button>
                        <button
                          type="button"
                          className="promo-button"
                          title={
                            promotion.isActive ? t(`${K}.deactivate`) : t(`${K}.activate`)
                          }
                          aria-label={
                            promotion.isActive ? t(`${K}.deactivate`) : t(`${K}.activate`)
                          }
                          disabled={updatePromotion.isPending}
                          onClick={() => handleToggleActive(promotion)}
                        >
                          {promotion.isActive ? (
                            <Pause className="promo-action-icon" aria-hidden />
                          ) : (
                            <Play className="promo-action-icon" aria-hidden />
                          )}
                          <span>
                            {promotion.isActive ? t(`${K}.deactivate`) : t(`${K}.activate`)}
                          </span>
                        </button>
                        <button
                          type="button"
                          className="promo-button"
                          title={t(`${K}.duplicate`)}
                          aria-label={t(`${K}.duplicate`)}
                          onClick={() => openDuplicate(promotion)}
                        >
                          <Copy className="promo-action-icon" aria-hidden />
                          <span>{t(`${K}.duplicate`)}</span>
                        </button>
                        <button
                          type="button"
                          className="promo-button"
                          title={t(`${K}.preview`)}
                          aria-label={t(`${K}.preview`)}
                          onClick={() => openPreview(promotion, index)}
                        >
                          <Eye className="promo-action-icon" aria-hidden />
                          <span>{t(`${K}.preview`)}</span>
                        </button>
                        <details className="promo-more">
                          <summary
                            className="promo-button icon-button"
                            aria-label={t(`${K}.moreActions`)}
                            title={t(`${K}.moreActions`)}
                          >
                            <MoreHorizontal className="promo-action-icon" aria-hidden />
                          </summary>
                          <div className="promo-more-menu">
                            <button
                              type="button"
                              className="danger"
                              disabled={deletePromotion.isPending}
                              onClick={() => void handleDelete(promotion)}
                            >
                              {deletePromotion.isPending ? (
                                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                              ) : null}
                              {t(`${K}.delete`)}
                            </button>
                          </div>
                        </details>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>

      {isModalOpen ? (
        <CreateEditPosPromotionModal
          businessId={businessId}
          promotion={editing}
          draft={isCreating ? createDraft : null}
          isSaving={createPromotion.isPending || updatePromotion.isPending}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      ) : null}

      {previewing
        ? createPortal(
            <div className="pos-promo-poster-print-backdrop fixed inset-0 z-50 flex items-center justify-center bg-[#0c1b3b59] p-4 backdrop-blur-[2px]">
              <div
                className="pos-promo-poster-dialog pos-promo-poster-print-root"
                role="dialog"
                aria-modal="true"
                aria-labelledby="pos-promo-poster-title"
              >
                <header className="editor-header">
                  <div>
                    <p className="promo-eyebrow">{t(`${K}.preview`)}</p>
                    <h2 id="pos-promo-poster-title">{t(`${K}.promotionPoster`)}</h2>
                  </div>
                  <button
                    type="button"
                    className="promo-close"
                    aria-label={t(`${K}.closePreview`)}
                    onClick={() => setPreviewing(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </header>
                <div className="poster-body">
                  <div className="poster-output">
                    <PromotionArt
                      name={previewing.name}
                      badgeLabel={previewing.badgeLabel}
                      artSaving={artSaving(previewing)}
                      imageUrl={promotionBannerImageUrl(previewing)}
                      theme={
                        themeFromColorHex(promotionBannerColorHex(previewing)) ??
                        promoArtThemeForIndex(previewThemeIndex)
                      }
                      colorHex={promotionBannerColorHex(previewing)}
                      specialOfferFallback={t(`${K}.specialOffer`)}
                      large
                    />
                  </div>
                  <div className="poster-details">
                    <h3>{previewing.name}</h3>
                    {previewing.description ? (
                      <p className="poster-description">{previewing.description}</p>
                    ) : null}
                    <p className="poster-schedule">{scheduleText(previewing)}</p>
                  </div>
                </div>
                <footer className="editor-footer">
                  <p className="promo-note">{t(`${K}.printHint`)}</p>
                  <button type="button" className="promo-button primary" onClick={handlePrintPoster}>
                    <Printer className="promo-action-icon h-4 w-4" aria-hidden />
                    <span>{t(`${K}.print`)}</span>
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
