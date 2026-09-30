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
import { TOAST_SNACK_DURATION_MS } from '../../../../constants/toast'
import { getApiErrorCode } from '../../../../types/domain'
import { getErrorI18nKey } from '../../../../data/errorCodes'
import {
  useCreatePosPromotion,
  useDeletePosPromotion,
  usePosPromotionTemplates,
  usePosPromotions,
  useUpdatePosPromotion,
} from '../../../../data/hooks/usePosPromotions'
import {
  bannersPayloadFromPromotion,
  default as posPromotionsRepository,
} from '../../../../data/repositories/posPromotions'
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import { printPosPromoPoster } from './printPosPromoPoster'
import CreateEditPosPromotionModal from './modals/CreateEditPosPromotionModal'
import PosPromotionBannerArt from './PosPromotionBannerArt'
import { formatPromotionStudioSchedule } from './posPromotionDisplay'
import {
  draftFromTemplate,
  localizeTemplateText,
  POS_PROMOTION_TEMPLATES,
  templateFromApi,
  type PosPromotionDraft,
  type PosPromotionTemplate,
} from './posPromotionTemplates'
import { promotionBannerColorHex, promotionBannerImageUrl } from './posPromotionBanner'
import './pos-promotions.css'

const K = 'components.dashboard.views.pos.PosPromotionsView'

type StatusFilter = 'all' | 'enabled' | 'disabled'

export default function PosPromotionsView({ businessId }: { businessId?: string }) {
  const { t, currentLanguage, setLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const { data: promotions = [], isLoading, isError, refetch } = usePosPromotions(businessId)
  const { data: studioMetadata } = usePosPromotionTemplates()
  const createPromotion = useCreatePosPromotion(businessId)
  const updatePromotion = useUpdatePosPromotion(businessId)
  const deletePromotion = useDeletePosPromotion(businessId)

  const studioTemplates = useMemo<readonly PosPromotionTemplate[]>(() => {
    const fromApi = studioMetadata?.templates ?? []
    if (fromApi.length === 0) return POS_PROMOTION_TEMPLATES
    return fromApi.map(templateFromApi)
  }, [studioMetadata?.templates])

  const [isCreating, setIsCreating] = useState(false)
  const [createDraft, setCreateDraft] = useState<PosPromotionDraft | null>(null)
  const [editing, setEditing] = useState<PosPromotionApiDto | null>(null)
  const [previewing, setPreviewing] = useState<PosPromotionApiDto | null>(null)
  const [previewThemeIndex, setPreviewThemeIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [compactChrome, setCompactChrome] = useState(false)
  const [busyAction, setBusyAction] = useState<{
    promotionId: string
    action: 'toggle' | 'delete' | 'duplicate'
  } | null>(null)
  const [openMoreMenuId, setOpenMoreMenuId] = useState<string | null>(null)

  useEffect(() => {
    const media = window.matchMedia('(max-width: 700px)')
    const sync = () => setCompactChrome(media.matches)
    sync()
    media.addEventListener('change', sync)
    return () => media.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    if (!openMoreMenuId) return

    const closeIfOutside = (event: MouseEvent | PointerEvent) => {
      const target = event.target
      if (!(target instanceof Element)) return
      if (target.closest('.promo-more')) return
      setOpenMoreMenuId(null)
    }

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenMoreMenuId(null)
    }

    document.addEventListener('pointerdown', closeIfOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('pointerdown', closeIfOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [openMoreMenuId])

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

  const openPreview = (promotion: PosPromotionApiDto, index: number) => {
    setPreviewThemeIndex(index)
    setPreviewing(promotion)
  }

  const handleSubmit = (payload: PosPromotionPayload) => {
    if (editing) {
      updatePromotion.mutate(
        { promotionId: editing.id, payload },
        {
          onSuccess: () => {
            showToast(t(`${K}.updateSuccess`), 'success', TOAST_SNACK_DURATION_MS)
            closeModal()
          },
          onError: reportError,
        },
      )
      return
    }
    createPromotion.mutate(payload, {
      onSuccess: () => {
        showToast(t(`${K}.createSuccess`), 'success', TOAST_SNACK_DURATION_MS)
        closeModal()
      },
      onError: reportError,
    })
  }

  const handleDuplicate = async (promotion: PosPromotionApiDto) => {
    if (!businessId || busyAction) return
    setBusyAction({ promotionId: promotion.id, action: 'duplicate' })
    try {
      const detail = await posPromotionsRepository.getPosPromotion(businessId, promotion.id)
      const copyName = `${promotion.name} · ${t(`${K}.copySuffix`)}`
      await createPromotion.mutateAsync({
        name: copyName,
        badgeLabel: promotion.badgeLabel ?? null,
        description: promotion.description ?? null,
        templateCode: promotion.templateCode ?? null,
        discountType: promotion.discountType,
        discountValue: promotion.discountValue,
        daysOfWeek: promotion.daysOfWeek,
        startTime: promotion.startTime.slice(0, 5),
        endTime: promotion.endTime.slice(0, 5),
        // Duplicate starts off so Owner can review before enabling.
        isActive: false,
        showOnOneQrHero: Boolean(detail.showOnOneQrHero),
        submitToSearchDeals: Boolean(detail.submitToSearchDeals),
        banners: bannersPayloadFromPromotion(detail),
      })
      showToast(t(`${K}.createSuccess`), 'success', TOAST_SNACK_DURATION_MS)
    } catch (err) {
      reportError(err)
    } finally {
      setBusyAction(null)
    }
  }

  const handleToggleActive = async (promotion: PosPromotionApiDto) => {
    if (!businessId || busyAction) return
    const nextActive = !promotion.isActive
    setBusyAction({ promotionId: promotion.id, action: 'toggle' })
    try {
      // PUT is a full replace — reload banners so toggle does not wipe studio covers.
      const detail = await posPromotionsRepository.getPosPromotion(businessId, promotion.id)
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
            isActive: nextActive,
            showOnOneQrHero: Boolean(promotion.showOnOneQrHero ?? detail.showOnOneQrHero),
            submitToSearchDeals: Boolean(
              promotion.submitToSearchDeals ?? detail.submitToSearchDeals,
            ),
            banners: bannersPayloadFromPromotion(detail),
          },
        },
        {
          onSuccess: () => {
            showToast(
              t(nextActive ? `${K}.enableSuccess` : `${K}.disableSuccess`, {
                name: promotion.name,
              }),
              'success',
              TOAST_SNACK_DURATION_MS,
            )
          },
          onError: reportError,
          onSettled: () => setBusyAction(null),
        },
      )
    } catch (err) {
      setBusyAction(null)
      reportError(err)
    }
  }

  const handleDelete = async (promotion: PosPromotionApiDto) => {
    if (!promotion.canDelete) {
      showToast(t(`${K}.deleteBlocked`), 'error')
      return
    }
    if (busyAction) return
    setOpenMoreMenuId(null)
    const confirmed = await showConfirm(
      t(`${K}.deleteConfirmMessage`, { name: promotion.name }),
      t(`${K}.deleteConfirmTitle`),
    )
    if (!confirmed) return
    setBusyAction({ promotionId: promotion.id, action: 'delete' })
    deletePromotion.mutate(promotion.id, {
      onSuccess: () => {
        showToast(t(`${K}.deleteSuccess`, { name: promotion.name }), 'success', TOAST_SNACK_DURATION_MS)
      },
      onError: reportError,
      onSettled: () => setBusyAction(null),
    })
  }

  const handlePrintPoster = () => {
    printPosPromoPoster()
  }

  const enabledCount = promotions.filter((p) => p.isActive).length
  // List DTO only exposes the cover — count image or solid-color covers (not multi-banner total).
  const bannerCount = promotions.filter(
    (p) => Boolean(promotionBannerImageUrl(p) || promotionBannerColorHex(p)),
  ).length

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
            {studioTemplates.map((template) => (
              <article key={template.id} className="promo-template">
                <div className={`template-art theme-${template.theme}`}>
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
                const bannerLabel = `1 ${t(`${K}.bannerUnit`)}`
                return (
                  <article key={promotion.id} className="promotion-card">
                    <PosPromotionBannerArt
                      promotion={promotion}
                      index={index}
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
                        {promotion.showOnOneQrHero ? (
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
                          disabled={Boolean(busyAction)}
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
                          aria-busy={
                            busyAction?.promotionId === promotion.id &&
                            busyAction.action === 'toggle'
                          }
                          disabled={Boolean(busyAction)}
                          onClick={() => void handleToggleActive(promotion)}
                        >
                          {busyAction?.promotionId === promotion.id &&
                          busyAction.action === 'toggle' ? (
                            <Loader2 className="promo-action-icon animate-spin" aria-hidden />
                          ) : promotion.isActive ? (
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
                          aria-busy={
                            busyAction?.promotionId === promotion.id &&
                            busyAction.action === 'duplicate'
                          }
                          disabled={Boolean(busyAction)}
                          onClick={() => void handleDuplicate(promotion)}
                        >
                          {busyAction?.promotionId === promotion.id &&
                          busyAction.action === 'duplicate' ? (
                            <Loader2 className="promo-action-icon animate-spin" aria-hidden />
                          ) : (
                            <Copy className="promo-action-icon" aria-hidden />
                          )}
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
                        <div
                          className={`promo-more${openMoreMenuId === promotion.id ? ' is-open' : ''}`}
                        >
                          <button
                            type="button"
                            className="promo-button icon-button"
                            aria-label={t(`${K}.moreActions`)}
                            title={t(`${K}.moreActions`)}
                            aria-expanded={openMoreMenuId === promotion.id}
                            aria-haspopup="menu"
                            disabled={Boolean(busyAction)}
                            onClick={() =>
                              setOpenMoreMenuId((current) =>
                                current === promotion.id ? null : promotion.id,
                              )
                            }
                          >
                            <MoreHorizontal className="promo-action-icon" aria-hidden />
                          </button>
                          {openMoreMenuId === promotion.id ? (
                            <div className="promo-more-menu" role="menu">
                              <button
                                type="button"
                                className="danger"
                                role="menuitem"
                                aria-busy={
                                  busyAction?.promotionId === promotion.id &&
                                  busyAction.action === 'delete'
                                }
                                disabled={Boolean(busyAction)}
                                onClick={() => void handleDelete(promotion)}
                              >
                                {busyAction?.promotionId === promotion.id &&
                                busyAction.action === 'delete' ? (
                                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                                ) : null}
                                {t(`${K}.delete`)}
                              </button>
                            </div>
                          ) : null}
                        </div>
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
                    <PosPromotionBannerArt
                      promotion={previewing}
                      index={previewThemeIndex}
                      specialOfferFallback={t(`${K}.specialOffer`)}
                      className="poster-art"
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
