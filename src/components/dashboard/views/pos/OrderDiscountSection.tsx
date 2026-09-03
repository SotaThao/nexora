// Order-level discount entry and eligible promotions stay together behind one compact action.
import { useState } from 'react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { PosDiscountBearer } from '../../../../constants/posDiscount'
import type {
  EligiblePromotionApiDto,
  OrderDetailApiDto,
  SetOrderDiscountPayload,
} from '../../../../types/repositories'
import { formatPromotionDays, formatPromotionRate, formatPromotionWindow } from './posPromotionDisplay'
import ServiceDiscountModal, { type ServiceDiscountSubmit } from './modals/ServiceDiscountModal'

const K = 'components.dashboard.views.pos.OrderDiscountSection'

export default function OrderDiscountSection({
  order,
  promotions,
  isSaving,
  onApply,
}: {
  order: OrderDetailApiDto
  promotions: EligiblePromotionApiDto[]
  isSaving: boolean
  onApply: (payload: SetOrderDiscountPayload) => void
}) {
  const { t, currentLanguage } = useTranslation()
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleSubmit = (submitted: ServiceDiscountSubmit) => {
    setIsModalOpen(false)
    onApply({
      discountType: submitted.discountType,
      discountValue: submitted.discountValue,
      discountNote: submitted.discountNote,
      promotionId: null,
    })
  }

  const handleRemove = () => {
    setIsModalOpen(false)
    onApply({ discountType: null, discountValue: null, discountNote: null, promotionId: null })
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        disabled={isSaving}
        className="inline-flex h-7 items-center rounded-lg border border-amber-200 bg-amber-50/60 px-2.5 text-[10px] font-bold text-amber-700 transition-colors hover:bg-amber-100/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {t(`${K}.button`)}
      </button>

      <ServiceDiscountModal
        target={
          isModalOpen
            ? {
                scope: 'order',
                serviceLineId: order.id,
                serviceName: t(`${K}.title`),
                lineTotal: order.servicesSubtotal,
                discountCap: order.orderDiscountCap,
                canAssignDiscountToStaff: false,
                discountType: order.orderDiscountType,
                discountValue: order.orderDiscountValue,
                discountBearer: PosDiscountBearer.Salon,
                discountNote: order.orderDiscountNote,
              }
            : null
        }
        isSaving={isSaving}
        onSubmit={handleSubmit}
        onRemove={handleRemove}
        onClose={() => {
          if (!isSaving) setIsModalOpen(false)
        }}
        supplementalContent={
          <section className="space-y-1.5 border-t border-nexoraBorder/70 pt-3">
            <h3 className="text-[10px] font-bold uppercase tracking-wide text-nexoraMuted">
              {t(`${K}.promotionsTitle`)}
            </h3>
            {promotions.length > 0 ? (
              <div className="space-y-1.5">
                {promotions.map((promotion) => {
                  const isApplied = order.appliedPromotionId === promotion.id
                  return (
                    <button
                      key={promotion.id}
                      type="button"
                      onClick={() => {
                        setIsModalOpen(false)
                        onApply({ promotionId: promotion.id, discountType: null, discountValue: null })
                      }}
                      disabled={isSaving}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border p-2.5 text-left transition-colors disabled:opacity-60 ${
                        isApplied
                          ? 'border-nexoraBrand/50 bg-nexoraBrandSoft'
                          : 'border-nexoraBorder/70 bg-white hover:border-nexoraBrand/50 hover:bg-nexoraBrandSoft/40'
                      }`}
                    >
                      <span className="min-w-0">
                        {promotion.badgeLabel ? (
                          <span className="mb-1 inline-flex rounded-md bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-600">
                            {promotion.badgeLabel}
                          </span>
                        ) : null}
                        <span className="block truncate text-xs font-bold text-nexoraText">
                          {promotion.name}
                        </span>
                        <span className="block truncate text-[10px] text-nexoraMuted">
                          {formatPromotionDays(promotion.daysOfWeek, (day) => t(`${K}.dayShort.${day}`))}{' '}
                          · {formatPromotionWindow(promotion.startTime, promotion.endTime, currentLanguage)}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-nexoraBrandDark">
                        {t(`${K}.promotionRate`, {
                          rate: formatPromotionRate(promotion.discountType, promotion.discountValue),
                        })}
                      </span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </section>
        }
      />
    </>
  )
}
