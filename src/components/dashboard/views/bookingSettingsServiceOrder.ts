export function moveServicesWithinCategory<TService extends { id: string }>(
  services: readonly TService[],
  categoryServiceIds: readonly string[],
  activeId: string,
  overId: string,
): TService[] {
  const activeIndex = categoryServiceIds.indexOf(activeId)
  const overIndex = categoryServiceIds.indexOf(overId)
  if (activeIndex < 0 || overIndex < 0 || activeIndex === overIndex) return [...services]

  const orderedIds = [...categoryServiceIds]
  const [movedId] = orderedIds.splice(activeIndex, 1)
  orderedIds.splice(overIndex, 0, movedId)

  const servicesById = new Map(services.map((service) => [service.id, service]))
  const categoryIdSet = new Set(categoryServiceIds)
  let orderedIndex = 0

  return services.map((service) => {
    if (!categoryIdSet.has(service.id)) return service
    const replacement = servicesById.get(orderedIds[orderedIndex])
    orderedIndex += 1
    return replacement ?? service
  })
}

export function buildServiceOrderItems<TService extends { id: string }>(
  services: readonly TService[],
) {
  return services.map((service, sortOrder) => ({
    serviceId: service.id,
    sortOrder,
  }))
}
