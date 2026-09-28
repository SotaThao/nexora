import { Clock3, FolderTree, Plus } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import type { PosServiceApiDto } from '../../../../types/repositories'
import { PosServiceStatus } from '../../../../constants/posServiceStatus'
import { formatUsdAmount } from '../../../../utils/currencyInput'
import Tooltip from '../../../ui/Tooltip'
import { ServicesPricingSortableList } from '../services/ServicesPricingPanel'

const TK = 'components.dashboard.views.pos.PosServicesView'

export type PosServiceSection = {
  id: string
  name: string
  services: PosServiceApiDto[]
}

type Props = {
  sections: PosServiceSection[]
  disabled: boolean
  onManageCategories: () => void
  onAdd: (categoryId: string | null) => void
  onEdit: (service: PosServiceApiDto) => void
  onDelete: (service: PosServiceApiDto, categoryId: string) => void
  onReorder: (services: PosServiceApiDto[]) => Promise<void>
}

export default function PosServicesCardView({
  sections, disabled, onManageCategories, onAdd, onEdit, onDelete, onReorder,
}: Props) {
  const { t } = useTranslation()
  const actionClass = 'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-nexoraSurface px-3 text-sm font-semibold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50'
  const compactActionClass = 'inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-nexoraBorder bg-nexoraSurface px-2.5 text-xs font-semibold text-nexoraText hover:bg-nexoraSurfaceMuted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-nexoraBrand disabled:opacity-50'

  return (
    <div className="booking-hub-view !min-h-0 space-y-4">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={compactActionClass} onClick={onManageCategories} disabled={disabled}>
          <FolderTree className="h-4 w-4" aria-hidden="true" />
          {t(`${TK}.manageCategories`)}
        </button>
        {sections.length === 0 ? (
          <button type="button" className={actionClass} onClick={() => onAdd(null)} disabled={disabled}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t(`${TK}.addService`)}
          </button>
        ) : null}
      </div>
      {sections.length === 0 ? <p className="py-6 text-center text-sm text-nexoraMuted">{t(`${TK}.noServices`)}</p> : null}
      {sections.map((section) => (
        <section key={section.id} aria-labelledby={`pos-card-category-${section.id}`} className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-nexoraSurfaceMuted px-3 py-2">
            <h2 id={`pos-card-category-${section.id}`} className="min-w-0 break-words text-sm font-bold text-nexoraText">
              {section.name}{' '}
              <span className="ml-2 font-normal text-nexoraMuted">
                {t(`${TK}.${section.services.length === 1 ? 'serviceCountOne' : 'serviceCount'}`, { count: section.services.length })}
              </span>
            </h2>
            <button type="button" className={actionClass} onClick={() => onAdd(section.id)} disabled={disabled}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t(`${TK}.addService`)}
            </button>
          </div>
          {section.services.length === 0 ? (
            <p className="px-3 py-4 text-sm text-nexoraMuted">{t(`${TK}.categoryEmpty`)}</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,260px),1fr))] gap-3">
              <ServicesPricingSortableList
                items={section.services}
                getId={(service) => service.id}
                onReorder={onReorder}
                dragHandleLabel={t(`${TK}.serviceDragHandle`)}
                disabled={disabled}
                layout="grid"
                renderItem={(service, dragHandle) => (
                  <article className="flex h-full min-w-0 flex-col gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurface p-3" aria-label={service.name}>
                    <div className="flex min-w-0 items-start gap-3">
                      {service.photoUrl ? (
                        <img src={service.photoUrl} alt="" width={48} height={48} loading="lazy" className="h-12 w-12 shrink-0 rounded-lg object-cover" />
                      ) : null}
                      <h3 className="min-w-0 flex-1 break-words text-sm font-bold text-nexoraText">{service.name}</h3>
                      {dragHandle}
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-base font-bold text-nexoraText">{formatUsdAmount(service.price)}</span>
                      <span className="inline-flex items-center gap-1 text-xs text-nexoraMuted">
                        <Clock3 className="h-3.5 w-3.5" aria-hidden="true" />
                        {service.durationMinutes} {t(`${TK}.minutesSuffix`)}
                      </span>
                    </div>
                    {service.isRequiredApproval ? (
                      <div className="flex self-start items-center gap-1">
                        <span className="settings-service-approval is-required">
                          {t(`${TK}.approvalCardBadge`)}
                        </span>
                        <Tooltip
                          content={t(`${TK}.requireApprovalLabel`)}
                          ariaLabel={t(`${TK}.requireApprovalLabel`)}
                          placement="top"
                        />
                      </div>
                    ) : null}
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-nexoraRule pt-2">
                      <span className={`settings-service-status ${service.status === PosServiceStatus.Active ? 'is-active' : 'is-inactive'}`}>
                        {t(`${TK}.${service.status === PosServiceStatus.Active ? 'activeBadge' : 'inactiveBadge'}`)}
                      </span>
                      <div className="flex gap-1">
                        <button type="button" className={actionClass} aria-label={`${t(`${TK}.editService`)}: ${service.name}`} onClick={() => onEdit(service)} disabled={disabled}>
                          {t(`${TK}.editAction`)}
                        </button>
                        <button type="button" className={actionClass} aria-label={`${t(`${TK}.deleteService`)}: ${service.name}`} onClick={() => onDelete(service, section.id)} disabled={disabled}>
                          {t(`${TK}.deleteAction`)}
                        </button>
                      </div>
                    </div>
                  </article>
                )}
              />
            </div>
          )}
        </section>
      ))}
    </div>
  )
}
