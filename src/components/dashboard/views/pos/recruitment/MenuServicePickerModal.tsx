import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Search, X } from 'lucide-react'

import { POS_ACTIVE_SERVICE_STATUS } from '../../../../../constants/posRecruitment'
import { useTranslation } from '../../../../../contexts/LanguageContext'
import IconButton from '../../../../ui/IconButton'
import type { PosCategoryApiDto, PosServiceApiDto } from '../../../../../types/repositories'
import { deriveSkillsFromServices, normalizeRecruitmentSearch } from './recruitmentModel'

const TK = 'components.dashboard.views.pos.recruitment.composer.servicePicker'
const ALL_CATEGORIES = 'all'

interface MenuServicePickerModalProps {
  open: boolean
  services: PosServiceApiDto[]
  categories: PosCategoryApiDto[]
  selectedIds: string[]
  onApply: (services: PosServiceApiDto[]) => void
  onClose: () => void
}

export default function MenuServicePickerModal({
  open,
  services,
  categories,
  selectedIds,
  onApply,
  onClose,
}: MenuServicePickerModalProps) {
  const { t } = useTranslation()
  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState(ALL_CATEGORIES)
  const [draftIds, setDraftIds] = useState(() => new Set(selectedIds))
  const selectedKey = selectedIds.join('|')
  useEffect(() => {
    if (open) setDraftIds(new Set(selectedIds))
  }, [open, selectedKey])
  const activeServices = useMemo(
    () => services.filter((service) => service.status === POS_ACTIVE_SERVICE_STATUS),
    [services],
  )
  const filtered = activeServices.filter((service) => {
    const categoryMatches = categoryId === ALL_CATEGORIES || service.categoryIds.includes(categoryId)
    const skills = deriveSkillsFromServices([service.name]).map((skill) => t(`components.dashboard.views.pos.recruitment.enums.skill.${skill}`))
    return categoryMatches && normalizeRecruitmentSearch(`${service.name} ${skills.join(' ')}`).includes(normalizeRecruitmentSearch(search))
  })
  const selectedServices = activeServices.filter((service) => draftIds.has(service.id))
  const selectedSkills = deriveSkillsFromServices(selectedServices.map((service) => service.name))
    .map((skill) => t(`components.dashboard.views.pos.recruitment.enums.skill.${skill}`))

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/60 p-3 backdrop-blur-sm" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t(`${TK}.title`)}
        className="nexora-modal-card flex w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-nexoraBorder bg-white shadow-2xl"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-nexoraRule px-4 py-3 sm:px-5">
          <div><p className="text-[10px] font-black uppercase tracking-[0.14em] text-nexoraBrand">{t(`${TK}.eyebrow`)}</p><h2 className="mt-1 font-black text-nexoraText">{t(`${TK}.title`)}</h2><p className="mt-1 text-xs font-medium text-nexoraMuted">{t(`${TK}.description`)}</p></div>
          <IconButton label={t(`${TK}.close`)} onClick={onClose} className="min-h-11 min-w-11"><X className="h-5 w-5" aria-hidden /></IconButton>
        </header>
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs font-bold text-nexoraText">
              <span>{t(`${TK}.searchLabel`)}</span>
              <span className="relative mt-1.5 block"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-nexoraSubtle" aria-hidden />
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t(`${TK}.searchPlaceholder`)} className="min-h-11 w-full rounded-lg border border-nexoraBorder pl-9 pr-3 text-sm outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft" />
              </span>
            </label>
            <label className="block text-xs font-bold text-nexoraText">
              <span>{t(`${TK}.categoryLabel`)}</span>
              <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="mt-1.5 min-h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 text-sm font-medium text-nexoraText outline-none focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrandSoft">
                <option value={ALL_CATEGORIES}>{t(`${TK}.allCategories`)}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-2">
            {filtered.map((service) => {
              const checked = draftIds.has(service.id)
              const skills = deriveSkillsFromServices([service.name])
              const categoryName = service.categoryIds.map((id) => categories.find((category) => category.id === id)?.name).filter(Boolean).join(', ')
              return (
                <label key={service.id} className={`flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border p-3 ${checked ? 'border-nexoraBrand bg-nexoraBrandSoft' : 'border-nexoraBorder hover:bg-nexoraSurfaceMuted'}`}>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => setDraftIds((current) => {
                      const next = new Set(current)
                      if (next.has(service.id)) next.delete(service.id)
                      else next.add(service.id)
                      return next
                    })}
                    className="h-4 w-4 accent-nexoraBrand"
                  />
                  <span className="min-w-0 flex-1"><strong className="block truncate text-sm text-nexoraText">{service.name}</strong>{categoryName ? <span className="mt-0.5 block text-xs font-medium text-nexoraMuted">{categoryName}</span> : null}<span className="mt-1 block text-[10px] font-semibold text-nexoraBrand">{t(`${TK}.serviceSuggestion`, { skills: skills.map((skill) => t(`components.dashboard.views.pos.recruitment.enums.skill.${skill}`)).join(' · ') })}</span></span>
                </label>
              )
            })}
          </div>
          {filtered.length === 0 ? <p className="py-10 text-center text-sm font-semibold text-nexoraMuted">{t(`${TK}.empty`)}</p> : null}
        </div>
        <footer className="flex items-center justify-between gap-3 border-t border-nexoraRule bg-white px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] sm:px-5">
          <span className="text-xs font-semibold text-nexoraMuted"><span className="block">{t(`${TK}.selectedCount`, { count: draftIds.size })}</span><span className="mt-1 block text-[10px] text-nexoraSubtle">{selectedSkills.length > 0 ? t(`${TK}.skillSuggestions`, { skills: selectedSkills.join(', ') }) : t(`${TK}.selectionHint`)}</span></span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="min-h-11 rounded-lg border border-nexoraBorder px-4 text-xs font-bold text-nexoraText hover:bg-nexoraSurfaceMuted">{t(`${TK}.cancel`)}</button>
            <button type="button" onClick={() => onApply(activeServices.filter((service) => draftIds.has(service.id)))} className="min-h-11 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white hover:bg-nexoraBrandDark">{t(`${TK}.apply`)}</button>
          </div>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
