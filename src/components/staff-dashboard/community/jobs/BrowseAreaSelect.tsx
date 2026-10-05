import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export interface BrowseAreaSelectOption {
  value: string
  label: string
}

interface BrowseAreaSelectProps {
  /** Accessible name for the combobox button. */
  label: string
  value: string
  options: BrowseAreaSelectOption[]
  onChange: (value: string) => void
}

/**
 * Small custom single-select (button + listbox popover) so the area filter matches the pills and
 * search field instead of the browser-native <select> chrome.
 */
export default function BrowseAreaSelect({ label, value, options, onChange }: BrowseAreaSelectProps) {
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value))
  const selected = options[selectedIndex]

  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [open])

  const openList = () => {
    setActiveIndex(selectedIndex)
    setOpen(true)
  }

  const select = (index: number) => {
    const option = options[index]
    if (option) onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'Escape') {
      if (open) {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openList()
        return
      }
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActiveIndex((index) => (index + step + options.length) % options.length)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (open) select(activeIndex)
      else openList()
      return
    }
    if (event.key === 'Tab') setOpen(false)
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        role="combobox"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open ? `${listId}-${activeIndex}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={handleKeyDown}
        className="flex min-h-11 w-full items-center justify-between gap-2 rounded-lg border border-nexoraBorder bg-white px-3 text-left text-sm font-medium text-nexoraText outline-none hover:border-nexoraBrand focus-visible:border-nexoraBrand focus-visible:ring-2 focus-visible:ring-nexoraBrandSoft"
      >
        <span className="min-w-0 truncate">{selected?.label ?? ''}</span>
        <ChevronDown className={`h-4 w-4 shrink-0 text-nexoraSubtle transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden />
      </button>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute left-0 right-0 z-30 mt-1 max-h-60 overflow-y-auto rounded-lg border border-nexoraBorder bg-white py-1 shadow-lg"
        >
          {options.map((option, index) => {
            const isSelected = option.value === value
            return (
              <li
                key={option.value}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onMouseEnter={() => setActiveIndex(index)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(index)}
                className={`flex min-h-11 cursor-pointer items-center justify-between gap-2 px-3 text-sm font-medium text-nexoraText hover:bg-nexoraBrandSoft ${
                  index === activeIndex ? 'bg-nexoraBrandSoft' : ''
                } ${isSelected ? 'font-bold text-nexoraBrand' : ''}`}
              >
                <span className="min-w-0 truncate">{option.label}</span>
                {isSelected ? <Check className="h-4 w-4 shrink-0" aria-hidden /> : null}
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
