// PosPromotionsView — POS > Promotions. The offers the front desk can apply to a whole visit at
// checkout ("Discount all services"), each with its own days and daily window.
//
// A list screen rather than a card in General Settings: this is a collection that grows, like
// Services and Products, and the counter reads the same rows back as tappable cards.
//
// Deactivating is the normal way to end an offer. Deleting is only possible while no visit has ever
// used it — the row is the only record of which offer produced a discount already given, so the API
// refuses and this screen says so instead of surfacing a raw error.
import { useState } from 'react'
import { Edit2, Loader2, Plus, Trash2 } from 'lucide-react'
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
import type { PosPromotionApiDto, PosPromotionPayload } from '../../../../types/repositories'
import { SkeletonList } from '../../../ui/skeleton'
import CreateEditPosPromotionModal from './modals/CreateEditPosPromotionModal'
import { formatPromotionDays, formatPromotionRate, formatPromotionWindow } from './posPromotionDisplay'

const K = 'components.dashboard.views.pos.PosPromotionsView'

export default function PosPromotionsView({ businessId }: { businessId?: string }) {
  const { t, currentLanguage } = useTranslation()
  const { showToast, showConfirm } = useNotification()

  const { data: promotions = [], isLoading } = usePosPromotions(businessId)
  const createPromotion = useCreatePosPromotion(businessId)
  const updatePromotion = useUpdatePosPromotion(businessId)
  const deletePromotion = useDeletePosPromotion(businessId)

  const [isCreating, setIsCreating] = useState(false)
  const [editing, setEditing] = useState<PosPromotionApiDto | null>(null)

  const reportError = (err: unknown) => showToast(t(getErrorI18nKey(getApiErrorCode(err))), 'error')

  const closeModal = () => {
    setIsCreating(false)
    setEditing(null)
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
    // Offered as "switch it off" rather than a delete that the API is going to refuse anyway.
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

  const isModalOpen = isCreating || editing !== null

  return (
    <div className="space-y-6">
      <section className="space-y-1 px-0.5">
        <h1 className="text-2xl font-bold leading-tight text-nexoraText">{t('dashboard.menu.pos_promotions')}</h1>
        <p className="text-sm font-medium text-nexoraMuted">{t(`${K}.description`)}</p>
      </section>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-nexoraBrand px-3.5 py-2 text-xs font-bold text-white hover:bg-nexoraBrandDark"
        >
          <Plus className="h-3.5 w-3.5" />
          {t(`${K}.addPromotion`)}
        </button>
      </div>

      {isLoading ? (
        <div className="nexora-card p-6">
          <SkeletonList count={3} lines={2} />
        </div>
      ) : promotions.length === 0 ? (
        <div className="nexora-card p-6 text-xs text-nexoraMuted">{t(`${K}.noPromotions`)}</div>
      ) : (
        <ul className="space-y-2">
          {promotions.map((promotion) => (
            <li
              key={promotion.id}
              className={`flex items-center justify-between gap-3 rounded-2xl border bg-nexoraSurface p-3 shadow-sm ${
                promotion.isActive ? 'border-nexoraBorder' : 'border-nexoraBorder/60 opacity-70'
              }`}
            >
              <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  {promotion.badgeLabel ? (
                    <span className="rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                      {promotion.badgeLabel}
                    </span>
                  ) : null}
                  <span className="truncate text-sm font-bold text-nexoraText">{promotion.name}</span>
                  {!promotion.isActive ? (
                    <span className="rounded-md bg-nexoraCanvas px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-nexoraMuted">
                      {t(`${K}.inactiveBadge`)}
                    </span>
                  ) : null}
                </div>
                <p className="truncate text-[11px] text-nexoraMuted">
                  {formatPromotionDays(promotion.daysOfWeek, (day) =>
                    t(`components.dashboard.views.pos.OrderDiscountSection.dayShort.${day}`),
                  )}{' '}
                  · {formatPromotionWindow(promotion.startTime, promotion.endTime, currentLanguage)}
                </p>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <span className="text-sm font-black text-nexoraBrandDark">
                  {t(`${K}.rateOff`, {
                    rate: formatPromotionRate(promotion.discountType, promotion.discountValue),
                  })}
                </span>
                <button
                  type="button"
                  onClick={() => handleToggleActive(promotion)}
                  disabled={updatePromotion.isPending}
                  className="h-9 rounded-lg border border-nexoraBorder px-2.5 text-[11px] font-semibold text-nexoraText transition-colors hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40 disabled:opacity-60"
                >
                  {promotion.isActive ? t(`${K}.deactivate`) : t(`${K}.activate`)}
                </button>
                <button
                  type="button"
                  aria-label={t(`${K}.edit`)}
                  onClick={() => setEditing(promotion)}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition-colors hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={t(`${K}.delete`)}
                  onClick={() => handleDelete(promotion)}
                  disabled={deletePromotion.isPending}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-nexoraBorder text-nexoraText transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-60"
                >
                  {deletePromotion.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {isModalOpen ? (
        <CreateEditPosPromotionModal
          promotion={editing}
          isSaving={createPromotion.isPending || updatePromotion.isPending}
          onSubmit={handleSubmit}
          onClose={closeModal}
        />
      ) : null}
    </div>
  )
}
