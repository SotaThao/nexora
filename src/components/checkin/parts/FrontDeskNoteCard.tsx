import { ChevronDown, MessageSquareText } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from '../../../contexts/LanguageContext'

const K = 'components.checkin.ServiceCatalogSection'
const NOTE_MAX_LENGTH = 500

export default function FrontDeskNoteCard({
  note,
  onChangeNote,
}: {
  note: string
  onChangeNote: (next: string) => void
}) {
  const { t } = useTranslation()
  const [isExpanded, setIsExpanded] = useState(true)

  return (
    <section className="rounded-2xl border border-nexoraBorder bg-nexoraSurface shadow-sm">
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((previous) => !previous)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <span className="flex min-w-0 items-center gap-2.5">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand"
          >
            <MessageSquareText className="h-4 w-4" />
          </span>
          <span className="min-w-0 truncate text-xs font-bold text-nexoraText">
            {t(`${K}.noteLabel`)}
            {note.trim() ? ` · ${note.trim()}` : ''}
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-nexoraMuted transition ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded ? (
        <div className="px-4 pb-4">
          <textarea
            value={note}
            onChange={(event) => onChangeNote(event.target.value)}
            maxLength={NOTE_MAX_LENGTH}
            rows={3}
            placeholder={t(`${K}.notePlaceholder`)}
            className="w-full rounded-xl border border-nexoraBorder bg-white px-3 py-2 text-xs text-nexoraText outline-none focus:border-nexoraBrand"
          />
        </div>
      ) : null}
    </section>
  )
}
