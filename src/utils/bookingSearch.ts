/** Case-insensitive name match for public booking service search. */
export function matchesSearchQuery(name: string, query: string): boolean {
  const needle = String(query || '').trim().toLowerCase()
  if (!needle) return true
  return String(name || '').toLowerCase().includes(needle)
}

export interface HighlightPart {
  text: string
  highlight: boolean
}

/** Split a name into plain / highlight segments for search-match UI. */
export function getSearchHighlightParts(name: string, query: string): HighlightPart[] {
  const value = String(name || '')
  const needle = String(query || '').trim()
  if (!value || !needle) return [{ text: value, highlight: false }]

  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const parts = value.split(new RegExp(`(${escaped})`, 'ig'))
  return parts
    .filter((part) => part.length > 0)
    .map((part) => ({
      text: part,
      highlight: part.toLowerCase() === needle.toLowerCase(),
    }))
}
