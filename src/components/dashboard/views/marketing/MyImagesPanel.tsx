import { ImageOff } from 'lucide-react'
import { useTranslation } from '../../../../contexts/LanguageContext'
import { useMarketingAdsImages } from '../../../../data/hooks/useAiBanner'
import { usePagination } from '../../../../hooks/usePagination'
import Panel from '../../../ui/Panel'
import Pagination from '../../../ui/Pagination'
import { SkeletonList } from '../../../ui/skeleton'
import { MARKETING_IMAGES_PAGE_SIZE, MARKETING_TK } from './constants'

const TK = MARKETING_TK

/**
 * "My Images" — paginated library of every AI image generated so far for
 * this workspace. Backed by useMarketingAdsImages (mock repository in
 * Đợt 0). Renders a real empty state when nothing has been generated yet,
 * not a bare/empty table.
 */
export default function MyImagesPanel() {
  const { t } = useTranslation()
  const { pageNumber, pageSize, setPage } = usePagination({
    pageSize: MARKETING_IMAGES_PAGE_SIZE,
  })
  const imagesQuery = useMarketingAdsImages({ pageNumber, pageSize })

  const items = imagesQuery.data?.items ?? []
  const totalCount = imagesQuery.data?.totalCount ?? 0
  const isInitialLoading = imagesQuery.isLoading

  return (
    <Panel className="space-y-4 p-6 rounded-3xl">
      <div>
        <h3 className="text-sm font-bold text-nexoraText">{t(`${TK}.libraryTitle`)}</h3>
        <p className="mt-0.5 text-xs text-nexoraMuted">{t(`${TK}.librarySubtitle`)}</p>
      </div>

      {isInitialLoading ? (
        <SkeletonList count={3} lines={2} />
      ) : imagesQuery.isError ? (
        <p className="text-xs font-medium text-rose-600">{t(`${TK}.loadErrorMessage`)}</p>
      ) : totalCount === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-nexoraBorder py-10 text-center">
          <ImageOff className="h-8 w-8 text-nexoraSubtle" aria-hidden />
          <p className="text-sm font-bold text-nexoraText">{t(`${TK}.emptyTitle`)}</p>
          <p className="max-w-xs text-xs text-nexoraMuted">{t(`${TK}.emptyDescription`)}</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-2xl border border-nexoraBorder bg-nexoraSurface"
              >
                <div className="aspect-[16/10] bg-nexoraSurfaceMuted">
                  <img
                    src={image.imageUrl}
                    alt={image.prompt || t(`${TK}.cardAltText`)}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="space-y-1 p-2.5">
                  <p
                    className="truncate text-[10px] font-bold text-nexoraMuted"
                    title={image.prompt || undefined}
                  >
                    {image.prompt || t(`${TK}.cardAltText`)}
                  </p>
                  <p className="text-[10px] font-semibold text-nexoraBrand">
                    {t(`${TK}.cardCreditCost`, { cost: image.creditCost })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Pagination
            pageNumber={imagesQuery.data?.pageNumber ?? pageNumber}
            pageSize={pageSize}
            totalPages={imagesQuery.data?.totalPages ?? 1}
            totalCount={totalCount}
            hasNextPage={imagesQuery.data?.hasNextPage ?? false}
            hasPreviousPage={imagesQuery.data?.hasPreviousPage ?? false}
            onPageChange={setPage}
            isLoading={imagesQuery.isFetching}
          />
        </>
      )}
    </Panel>
  )
}
