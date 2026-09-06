import { useTranslation } from '../../../../../contexts/LanguageContext'
import { CHECK_IN_BACKGROUNDS } from './checkInBackgroundCatalog'

export function CheckInBackgroundGallery({ selectedId, onSelect }: { selectedId: string; onSelect: (id: string) => void }) {
  const { t } = useTranslation()
  return <div role="radiogroup" aria-label={t('checkInPrint.artworkGallery')} className="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {CHECK_IN_BACKGROUNDS.map((template, index) => <button
      type="button"
      role="radio"
      aria-checked={selectedId === template.id}
      aria-label={t('checkInPrint.backgrounds.' + template.id)}
      key={template.id}
      onClick={() => onSelect(template.id)}
      onKeyDown={event => {
        if (!['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'].includes(event.key)) return
        event.preventDefault()
        const next = (index + (event.key === 'ArrowRight' || event.key === 'ArrowDown' ? 1 : -1) + CHECK_IN_BACKGROUNDS.length) % CHECK_IN_BACKGROUNDS.length
        onSelect(CHECK_IN_BACKGROUNDS[next].id)
        ;(event.currentTarget.parentElement?.children[next] as HTMLButtonElement)?.focus()
      }}
      className={`min-w-0 rounded-xl border-2 p-2 text-xs ${selectedId === template.id ? 'border-nexoraBrand bg-nexoraCanvas' : 'border-nexoraBorder bg-white'}`}
    >
      <img src={template.thumbnailUrl ?? template.imageUrl} loading="lazy" decoding="async" alt="" className="h-auto max-h-32 w-full rounded object-contain" />
      <span className="mt-1 block font-bold">{t('checkInPrint.backgrounds.' + template.id)}</span>
    </button>)}
  </div>
}
