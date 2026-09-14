import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useTranslation } from '../../../contexts/LanguageContext'

export interface TechnicianServiceSection {
  id: string
  name: string
  services: Array<{ id: string; name: string }>
}

export default function TechnicianServiceSelector({ serviceSections, selectedIds, onChange, invalid = false }: {
  serviceSections: TechnicianServiceSection[]
  selectedIds: ReadonlySet<string>
  onChange: (ids: Set<string>) => void
  invalid?: boolean
}) {
  const { t } = useTranslation()
  const TK = 'components.dashboard.views.BookingHubView.team'
  const panelPrefix = useId()
  const [servicesExpanded, setServicesExpanded] = useState(true)
  const [openServiceCategoryIds, setOpenServiceCategoryIds] = useState(() => new Set(serviceSections[0] ? [serviceSections[0].id] : []))
  const checkAllServicesRef = useRef<HTMLInputElement>(null)
  const serviceIds = Array.from(new Set(serviceSections.flatMap((section) => section.services.map((service) => service.id))))
  const selectedServiceCount = serviceIds.filter((id) => selectedIds.has(id)).length
  const allServicesSelected = serviceIds.length > 0 && selectedServiceCount === serviceIds.length
  useEffect(() => {
    if (checkAllServicesRef.current) checkAllServicesRef.current.indeterminate = selectedServiceCount > 0 && !allServicesSelected
  }, [selectedServiceCount, allServicesSelected])
  const toggleServiceGroup = (ids: string[]) => {
    const next = new Set(selectedIds)
    const allSelected = ids.every((id) => next.has(id))
    ids.forEach((id) => allSelected ? next.delete(id) : next.add(id))
    onChange(next)
  }
  const toggleService = (id: string) => toggleServiceGroup([id])
  const toggleAllServices = () => toggleServiceGroup(serviceIds)
  const toggleServiceCategory = (id: string) => setOpenServiceCategoryIds((current) => {
    const next = new Set(current)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  return (
    <div
      className="tech-services-control"
      aria-invalid={invalid}
    >
      <div
        className={`tech-services-all-row${servicesExpanded ? " is-open" : ""}${selectedServiceCount > 0 ? " has-selection" : ""}`}
      >
        <label className="tech-services-check-label">
          <input
            ref={checkAllServicesRef}
            type="checkbox"
            checked={allServicesSelected}
            onChange={toggleAllServices}
          />
          <span>{t(`${TK}.checkAllServices`)}</span>
        </label>
        <button
          className="tech-services-expand-button"
          type="button"
          aria-label={t(`${TK}.services`)}
          aria-expanded={servicesExpanded}
          aria-controls={`${panelPrefix}-catalog`}
          onClick={() => setServicesExpanded((open) => !open)}
        >
          <span className="tech-services-count">
            {serviceIds.length}
          </span>
          <ChevronDown />
        </button>
      </div>

      <div
        className={`tech-services-catalog-panel${servicesExpanded ? " is-open" : ""}`}
        id={`${panelPrefix}-catalog`}
        aria-hidden={!servicesExpanded}
      >
        <div className="tech-services-catalog-panel-inner">
          <div className="tech-service-categories">
            {serviceSections.map((section) => {
              const isOpen = openServiceCategoryIds.has(
                section.id,
              );
              const serviceNames = section.services
                .map((service) => service.id)
                .filter(Boolean);
              const selectedCount = serviceNames.filter((name) =>
                selectedIds.has(name),
              ).length;
              const allCategorySelected =
                serviceNames.length > 0 &&
                selectedCount === serviceNames.length;
              const someCategorySelected =
                selectedCount > 0 && !allCategorySelected;
              const panelId = `${panelPrefix}-${section.id}`;

              return (
                <div
                  className={`tech-service-category${isOpen ? " is-open" : ""}${selectedCount > 0 ? " has-selection" : ""}`}
                  key={section.id}
                >
                  <div className="tech-service-category-head">
                    <label className="tech-services-check-label">
                      <input
                        ref={(input) => {
                          if (input) {
                            input.indeterminate =
                              someCategorySelected;
                          }
                        }}
                        type="checkbox"
                        checked={allCategorySelected}
                        tabIndex={servicesExpanded ? 0 : -1}
                        aria-label={t(`${TK}.checkAllCategory`, {
                          category: section.name,
                        })}
                        onChange={() =>
                          toggleServiceGroup(serviceNames)
                        }
                      />
                      <span>{t(`${TK}.checkAll`)}</span>
                      <strong>{section.name}</strong>
                    </label>
                    <button
                      className="tech-services-expand-button"
                      type="button"
                      aria-label={section.name}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      tabIndex={servicesExpanded ? 0 : -1}
                      onClick={() =>
                        toggleServiceCategory(section.id)
                      }
                    >
                      <span className="tech-services-count">
                        {section.services.length}
                      </span>
                      <ChevronDown />
                    </button>
                  </div>
                  <div
                    className={`tech-service-category-panel${isOpen ? " is-open" : ""}`}
                    id={panelId}
                    aria-hidden={!isOpen}
                  >
                    <div className="tech-service-category-panel-inner">
                      <div className="tech-service-option-grid">
                        {section.services.map((service) => {
                          const name = service.id;
                          return (
                            <label
                              className="tech-service-option"
                              key={`${section.id}-${service.id}`}
                            >
                              <input
                                type="checkbox"
                                checked={
                                  Boolean(name) &&
                                  selectedIds.has(name)
                                }
                                tabIndex={
                                  servicesExpanded && isOpen
                                    ? 0
                                    : -1
                                }
                                onChange={() =>
                                  toggleService(name)
                                }
                              />
                              <span>{service.name}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
