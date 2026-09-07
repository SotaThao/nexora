import { LucideIcon } from './LucideIcon'

export interface AiHistoryThumbnailItem {
  id: string
  url: string
  label?: string
}

export interface AiHistoryThumbnailsProps {
  items?: AiHistoryThumbnailItem[]
  onSelect?: (url: string) => void
  isLoading?: boolean
  isError?: boolean
}

const GENERATION_HISTORY_COUNT = 4

export function AiHistoryThumbnails({
  items = [],
  onSelect,
  isLoading = false,
  isError = false,
}: AiHistoryThumbnailsProps) {
  if (isLoading) {
    return (
      <>
        {Array.from({ length: GENERATION_HISTORY_COUNT }).map((_, index) => (
          <div
            key={index}
            className="animate-pulse rounded-2xl border border-slate-100 bg-white p-2 shadow-sm"
          >
            <div className="mb-1 aspect-[16/10] rounded-xl bg-slate-100" />
            <div className="mx-2 h-3 rounded bg-slate-100" />
          </div>
        ))}
      </>
    )
  }

  if (isError) {
    return (
      <div className="col-span-full flex items-center gap-3 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-4">
        <LucideIcon name="alert-circle" className="h-5 w-5 shrink-0 text-rose-400" />
        <p className="text-xs text-rose-600">
          Unable to load generation history. Please try again.
        </p>
      </div>
    )
  }

  if (items.length === 0) {
    return null
  }

  return (
    <>
      {items.map((image, index) => {
        const label = image.label || `Sample #${index + 1}`
        return (
          <button
            key={image.id}
            type="button"
            onClick={() => onSelect?.(image.url)}
            className="group cursor-pointer rounded-2xl border border-slate-100 bg-white p-2 text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-indigo-600 hover:shadow-md"
          >
            <div className="mb-1 aspect-[16/10] overflow-hidden rounded-xl border border-transparent bg-slate-50 transition-all duration-300 group-hover:border-indigo-100">
              <img
                src={image.url}
                alt={label}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <p className="truncate px-1 text-center text-[9px] font-bold uppercase tracking-wide text-slate-400 transition-colors duration-300 group-hover:text-indigo-600">
              {label}
            </p>
          </button>
        )
      })}
    </>
  )
}

export default AiHistoryThumbnails
