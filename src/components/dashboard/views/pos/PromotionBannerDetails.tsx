import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { CalendarClock, X } from 'lucide-react'
import PosPromotionBannerArt, { type PromotionBannerSource } from './PosPromotionBannerArt'
import { promotionBannerImageUrl } from './posPromotionBanner'
import { formatPromotionArtSaving } from './posPromotionDisplay'

export default function PromotionBannerDetails({
  promotion, index, specialOfferFallback, schedule, scheduleLabel, detailsLabel, closeLabel, onOpenChange,
}: {
  promotion: PromotionBannerSource & { description?: string | null }
  index: number
  specialOfferFallback: string
  schedule: string
  scheduleLabel: string
  detailsLabel: string
  closeLabel: string
  onOpenChange?: (open: boolean) => void
}) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const imageUrl = promotionBannerImageUrl(promotion)

  useEffect(() => {
    if (!open) return
    const dialog = dialogRef.current
    const previousOverflow = document.body.style.overflow
    dialog?.showModal()
    document.body.style.overflow = 'hidden'
    return () => {
      dialog?.close()
      document.body.style.overflow = previousOverflow
      triggerRef.current?.focus({ preventScroll: true })
    }
  }, [open])

  const close = () => {
    setOpen(false)
    onOpenChange?.(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${detailsLabel}: ${promotion.name || specialOfferFallback}`}
        aria-haspopup="dialog"
        className="block w-full rounded-xl text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-nexoraBrand"
        onClick={() => { setOpen(true); onOpenChange?.(true) }}
      >
        <PosPromotionBannerArt promotion={promotion} index={index} specialOfferFallback={specialOfferFallback} />
      </button>
      {open && createPortal(
        <dialog
          ref={dialogRef}
          aria-labelledby={titleId}
          className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-nexoraBorder bg-white p-0 text-nexoraText shadow-xl backdrop:bg-black/60"
          onCancel={(event) => { event.preventDefault(); close() }}
          onClick={(event) => {
            if (event.target !== event.currentTarget) return
            const rect = event.currentTarget.getBoundingClientRect()
            if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close()
          }}
        >
          <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-nexoraBorder bg-white px-4 py-3">
            <h2 id={titleId} className="min-w-0 break-words text-lg font-bold">{promotion.name || specialOfferFallback}</h2>
            <button type="button" autoFocus aria-label={closeLabel} onClick={close} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg hover:bg-nexoraSurfaceMuted focus-visible:outline focus-visible:outline-nexoraBrand">
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
          </header>
          <div className="space-y-4 p-4">
            <PosPromotionBannerArt
              promotion={promotion}
              index={index}
              specialOfferFallback={specialOfferFallback}
              imageLayout="detail"
            />
            {imageUrl && <p className="text-xl font-bold text-nexoraBrand">{formatPromotionArtSaving(promotion.discountType, promotion.discountValue)}</p>}
            {promotion.description?.trim() && <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">{promotion.description}</p>}
            {schedule && (
              <section className="flex items-start gap-3 rounded-xl border border-nexoraBorder bg-nexoraSurfaceMuted p-3" aria-label={scheduleLabel}>
                <CalendarClock className="mt-0.5 h-5 w-5 shrink-0 text-nexoraBrand" aria-hidden="true" />
                <div className="min-w-0 space-y-1">
                  <h3 className="text-sm font-semibold text-nexoraText">{scheduleLabel}</h3>
                  <p className="break-words text-sm leading-relaxed text-nexoraMuted">{schedule}</p>
                </div>
              </section>
            )}
          </div>
        </dialog>, document.body,
      )}
    </>
  )
}
