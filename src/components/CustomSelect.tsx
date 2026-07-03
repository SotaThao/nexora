import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown } from 'lucide-react'

const MENU_GAP = 6
const VIEWPORT_PAD = 8

export default function CustomSelect({
  value,
  onChange,
  options,
  className = '',
  buttonClass = '',
  optionsClass = '',
  placeholder = 'Select option...',
  size = 'md',
  disabled = false,
  buttonLabel = '',
  leadingIcon = null,
  menuMinWidth = 0,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [menuCoords, setMenuCoords] = useState(null)
  const rootRef = useRef(null)
  const buttonRef = useRef(null)
  const menuRef = useRef(null)

  const updateMenuPosition = useCallback(() => {
    const button = buttonRef.current
    const menu = menuRef.current
    if (!button || !menu) return

    const rect = button.getBoundingClientRect()
    const menuHeight = menu.offsetHeight

    const prevWidth = menu.style.width
    const prevMinWidth = menu.style.minWidth
    menu.style.width = 'max-content'
    menu.style.minWidth = `${Math.max(rect.width, menuMinWidth || 0)}px`
    const contentWidth = menu.offsetWidth
    menu.style.width = prevWidth
    menu.style.minWidth = prevMinWidth

    const viewportMaxWidth = window.innerWidth - VIEWPORT_PAD * 2
    const naturalWidth = Math.max(rect.width, contentWidth, menuMinWidth || 0)
    const width = Math.min(naturalWidth, viewportMaxWidth)

    const spaceBelow = window.innerHeight - rect.bottom - VIEWPORT_PAD
    const spaceAbove = rect.top - VIEWPORT_PAD
    const openUp = menuHeight > spaceBelow && spaceAbove > spaceBelow

    let top = openUp ? rect.top - MENU_GAP - menuHeight : rect.bottom + MENU_GAP
    top = Math.max(VIEWPORT_PAD, Math.min(top, window.innerHeight - menuHeight - VIEWPORT_PAD))

    const maxLeft = window.innerWidth - width - VIEWPORT_PAD
    const left = Math.max(VIEWPORT_PAD, Math.min(rect.left, maxLeft))

    setMenuCoords({ top, left, width })
  }, [menuMinWidth])

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuCoords(null)
      return undefined
    }

    updateMenuPosition()
    window.addEventListener('scroll', updateMenuPosition, true)
    window.addEventListener('resize', updateMenuPosition)
    return () => {
      window.removeEventListener('scroll', updateMenuPosition, true)
      window.removeEventListener('resize', updateMenuPosition)
    }
  }, [isOpen, options, updateMenuPosition, menuMinWidth])

  useEffect(() => {
    function handleClickOutside(event) {
      const target = event.target
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) {
        return
      }
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedOption = options.find((opt) => opt.value === value)

  const handleSelect = (val) => {
    onChange({ target: { value: val } })
    setIsOpen(false)
  }

  const isSmall = size === 'sm'

  const borderClassStr = buttonClass.includes('border-') ? '' : 'border-nexoraBorder'
  const bgClassStr = buttonClass.includes('bg-') ? '' : 'bg-white'
  const hasTextColor = /\btext-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white|brand)\b/.test(buttonClass)
  const textClassStr = hasTextColor ? '' : 'text-nexoraText'
  const focusBorderClassStr = buttonClass.includes('focus:border-') ? '' : 'focus:border-nexoraBrand'
  const focusRingClassStr = buttonClass.includes('focus:ring-') ? '' : 'focus:ring-1 focus:ring-nexoraBrand/20'
  const hasFontWeight = buttonClass.includes('font-')
  const fontWeightClass = hasFontWeight ? '' : (isSmall ? 'font-semibold' : '')

  const hasWidthClass = /\bw-/.test(buttonClass)

  const optionTextClass = optionsClass || (isSmall ? 'text-xs' : 'text-sm')

  const buttonText = buttonLabel || (selectedOption ? selectedOption.label : placeholder)

  const menu = isOpen
    ? createPortal(
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            top: menuCoords?.top ?? -9999,
            left: menuCoords?.left ?? 0,
            width: menuCoords?.width ?? buttonRef.current?.offsetWidth,
            zIndex: 9999,
            visibility: menuCoords ? 'visible' : 'hidden',
          }}
          className={`max-h-60 overflow-y-auto rounded-lg border border-nexoraBorder bg-white py-1 shadow-premium ${optionsClass}`}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleSelect(opt.value)}
                className={`flex w-full cursor-pointer select-none items-center justify-between px-4 py-2 text-left transition-colors ${optionTextClass}
                  ${
                    isSelected
                      ? 'bg-nexoraBrandSoft font-bold text-nexoraBrand'
                      : 'text-nexoraText hover:bg-nexoraSurfaceMuted'
                  }`}
              >
                <span className="break-words text-left">{opt.label}</span>
              </button>
            )
          })}
        </div>,
        document.body,
      )
    : null

  return (
    <div className={`relative min-w-0 ${className || 'w-full'}`} ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`flex items-center justify-between border ${borderClassStr} ${textClassStr} ${bgClassStr} text-left transition-all select-none focus:outline-none ${focusBorderClassStr} ${focusRingClassStr}
          ${isSmall ? 'h-9 rounded px-3 text-xs' : 'min-h-[42px] rounded-lg px-4 py-2.5 text-sm'}
          ${fontWeightClass}
          ${!hasWidthClass ? 'w-full' : ''}
          ${disabled ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-nexoraSubtle' : 'cursor-pointer'}
          ${buttonClass || 'w-full'}`}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {leadingIcon}
          <span className="truncate">{buttonText}</span>
        </span>
        <ChevronDown
          className={`ml-2 shrink-0 text-nexoraSubtle transition-transform duration-200
            ${isSmall ? 'h-3.5 w-3.5' : 'h-4 w-4'}
            ${isOpen ? 'rotate-180 text-nexoraBrand' : ''}`}
        />
      </button>
      {menu}
    </div>
  )
}
