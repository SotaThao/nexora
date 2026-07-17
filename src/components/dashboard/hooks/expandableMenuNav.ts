type SetExpanded = (value: boolean | ((prev: boolean) => boolean)) => void

export type ExpandableMenuSection = {
  id: string
  setExpanded: SetExpanded
  /** Navigate / activate this section when it was not the active menu. */
  enter: () => void
}

type HandleExpandableMenuClickOptions = {
  clickedId: string
  activeMenu: string
  sections: ExpandableMenuSection[]
  onPlainNavigate: (id: string) => void
  /** Collapse sibling accordion groups (e.g. Payments & Payouts). */
  collapseExtras?: () => void
}

/**
 * Shared sidebar/drawer behavior for expandable menu items:
 * - same section already active → toggle expand
 * - other expandable section → enter + expand it, collapse siblings
 * - plain item → navigate and collapse all expandables
 */
export function handleExpandableMenuClick({
  clickedId,
  activeMenu,
  sections,
  onPlainNavigate,
  collapseExtras,
}: HandleExpandableMenuClickOptions) {
  const collapseAllExcept = (keepId?: string) => {
    for (const section of sections) {
      if (section.id !== keepId) section.setExpanded(false)
    }
    collapseExtras?.()
  }

  const section = sections.find((entry) => entry.id === clickedId)
  if (section) {
    if (activeMenu === section.id) {
      section.setExpanded((prev) => !prev)
      return
    }
    section.enter()
    section.setExpanded(true)
    collapseAllExcept(section.id)
    return
  }

  onPlainNavigate(clickedId)
  collapseAllExcept()
}
