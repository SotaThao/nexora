// Shared between the technician picker and the overview — both show the same person, and two
// copies of this would drift the moment one of them handled a single-word name differently.
export function initialsOf(displayName: string) {
  return displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}
