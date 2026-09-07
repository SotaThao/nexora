import { useMarketingAdsImages } from '../../../../data/hooks/useAiBanner'

export interface RefHistoryPickerItem {
  id: string
  url: string
  label?: string
}

export interface RefHistoryPickerGridProps {
  items?: RefHistoryPickerItem[]
  onSelect?: (url: string, name: string) => void
  isLoading?: boolean
  isError?: boolean
}

export function formatGeneratedImageLabel(prompt?: string): string {
  const trimmed = (prompt ?? '').trim()
  if (!trimmed) return 'Generated banner'
  return trimmed.length > 40 ? `${trimmed.slice(0, 40)}…` : trimmed
}

const REF_HISTORY_IMAGE_COUNT = 8

export function RefHistoryPickerGrid({
  items,
  onSelect,
  isLoading: propIsLoading,
  isError: propIsError,
}: RefHistoryPickerGridProps) {
  const query = useMarketingAdsImages(
    { pageSize: REF_HISTORY_IMAGE_COUNT },
    { enabled: items === undefined },
  )

  const isLoading = propIsLoading ?? (items === undefined && query.isLoading)
  const isError = propIsError ?? (items === undefined && query.isError)

  const displayImages: RefHistoryPickerItem[] =
    items !== undefined
      ? items
      : (query.data?.items ?? []).map((img) => ({
          id: img.id,
          url: img.imageUrl,
          label: formatGeneratedImageLabel(img.prompt),
        }))

  if (isLoading) {
    return (
      <div id="ai-ref-history-grid" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: REF_HISTORY_IMAGE_COUNT }).map((_, index) => (
          <div
            key={index}
            className="aspect-square animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div id="ai-ref-history-grid">
        <p className="py-2 text-center text-xs text-rose-500">
          Unable to load generated images. Please try again.
        </p>
      </div>
    )
  }

  if (displayImages.length === 0) {
    return (
      <div id="ai-ref-history-grid">
        <p className="py-2 text-center text-xs text-slate-400">
          No images generated yet.
        </p>
      </div>
    )
  }

  return (
    <div id="ai-ref-history-grid" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {displayImages.map((image) => {
        const label = image.label || 'Generated banner'
        return (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelect?.(image.url, label)}
            className="group aspect-square cursor-pointer overflow-hidden rounded-xl border-2 border-transparent p-0 transition-all duration-200 hover:border-indigo-500"
          >
            <img
              src={image.url}
              alt={label}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </button>
        )
      })}
    </div>
  )
}

export default RefHistoryPickerGrid
