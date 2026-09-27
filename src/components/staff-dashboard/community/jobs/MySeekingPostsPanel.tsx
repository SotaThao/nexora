import { Plus, RefreshCw } from 'lucide-react'

import { useTranslation } from '../../../../contexts/LanguageContext'
import { SkeletonList } from '../../../ui/skeleton'
import type { SeekingPost } from '../../../../types/communityJobs'
import SeekingPostCard from './SeekingPostCard'

const TK = 'staff_dashboard.community.jobs.myPosts'

interface MySeekingPostsPanelProps {
  posts: SeekingPost[]
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onCreate: () => void
  onEdit: (post: SeekingPost) => void
  onClose: (post: SeekingPost) => void
}

export default function MySeekingPostsPanel({ posts, isLoading, isError, onRetry, onCreate, onEdit, onClose }: MySeekingPostsPanelProps) {
  const { t } = useTranslation()

  return (
    <div className="overflow-hidden rounded-xl border border-nexoraBorder bg-white shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-nexoraRule p-4 sm:p-5">
        <div>
          <h2 className="text-lg font-black text-nexoraText">{t(`${TK}.title`)}</h2>
          <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.description`)}</p>
        </div>
        <button type="button" onClick={onCreate} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-black text-white shadow-nexora-soft hover:bg-nexoraBrandDark">
          <Plus className="h-4 w-4" aria-hidden />{t(`${TK}.createAction`)}
        </button>
      </header>

      {isLoading ? (
        <div className="p-5"><SkeletonList count={2} lines={3} showAvatar /></div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <p className="font-bold text-nexoraText">{t(`${TK}.loadError`)}</p>
          <button type="button" onClick={onRetry} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraBrand hover:bg-nexoraBrandSoft">
            <RefreshCw className="h-4 w-4" aria-hidden />{t(`${TK}.retry`)}
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
          <div>
            <p className="font-black text-nexoraText">{t(`${TK}.emptyTitle`)}</p>
            <p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.emptyDescription`)}</p>
          </div>
          <button type="button" onClick={onCreate} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">
            <Plus className="h-4 w-4" aria-hidden />{t(`${TK}.createAction`)}
          </button>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <SeekingPostCard key={post.id} post={post} onEdit={onEdit} onClose={onClose} />
          ))}
        </div>
      )}
    </div>
  )
}
