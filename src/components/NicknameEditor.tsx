import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type SyntheticEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Loader2, Pencil, X } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { useIsMobileUI } from '../hooks/useIsMobileUI'
import { isApiError } from '../types/domain'

export interface NicknameEditorSaveResult {
  nicknameAtBusiness: string | null
  displayName: string
}

interface NicknameEditorProps {
  value: string | null
  originalName: string
  triggerLabel: string
  fieldLabel: string
  helperText: string
  onRefresh: () => Promise<string | null>
  onSave: (nickname: string | null) => Promise<NicknameEditorSaveResult>
  triggerVariant?: 'text' | 'icon'
  containerClassName?: string
  stopPropagation?: boolean
}

interface PopoverPosition {
  left: number
  top: number
  width: number
}

const VIEWPORT_PADDING = 8
const POPOVER_GAP = 8
const POPOVER_WIDTH = 320

function normalizeNickname(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? ''
  return trimmed || null
}

export default function NicknameEditor({
  value,
  originalName,
  triggerLabel,
  fieldLabel,
  helperText,
  onRefresh,
  onSave,
  triggerVariant = 'text',
  containerClassName = '',
  stopPropagation = false,
}: NicknameEditorProps) {
  const { t } = useTranslation()
  const { showToast } = useNotification()
  const isMobile = useIsMobileUI()
  const reactId = useId()
  const inputId = `${reactId}-input`
  const titleId = `${reactId}-title`
  const helperId = `${reactId}-helper`
  const counterId = `${reactId}-counter`
  const errorId = `${reactId}-error`
  const panelId = `${reactId}-panel`
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const refreshRequestRef = useRef(0)
  const [isOpen, setIsOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [inputValue, setInputValue] = useState(value ?? '')
  const [initialNickname, setInitialNickname] = useState<string | null>(
    normalizeNickname(value),
  )
  const [inlineError, setInlineError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null)

  const isSubmitting = isSaving || isClearing
  const normalizedInput = normalizeNickname(inputValue)
  const hasLengthError = normalizedInput?.length === 1
  const validationError = hasLengthError
    ? t('common.nickname_error_length')
    : inlineError
  const isUnchanged = normalizedInput === initialNickname

  useEffect(() => {
    if (isOpen) return
    const nextValue = normalizeNickname(value)
    setInitialNickname(nextValue)
    setInputValue(nextValue ?? '')
  }, [isOpen, value])

  const closeEditor = useCallback(() => {
    refreshRequestRef.current += 1
    setIsOpen(false)
    setIsRefreshing(false)
    setInlineError('')
    setPopoverPosition(null)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  const updatePopoverPosition = useCallback(() => {
    if (!isOpen || isMobile || !triggerRef.current || typeof window === 'undefined') return

    const triggerRect = triggerRef.current.getBoundingClientRect()
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - VIEWPORT_PADDING * 2)
    const panelHeight = Math.min(
      panelRef.current?.offsetHeight ?? 300,
      window.innerHeight - VIEWPORT_PADDING * 2,
    )
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)
    const left = Math.min(Math.max(triggerRect.left, VIEWPORT_PADDING), maxLeft)
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING
    const canFitAbove = triggerRect.top - VIEWPORT_PADDING >= panelHeight + POPOVER_GAP
    const preferredTop = spaceBelow < panelHeight + POPOVER_GAP && canFitAbove
      ? triggerRect.top - panelHeight - POPOVER_GAP
      : triggerRect.bottom + POPOVER_GAP
    const maxTop = Math.max(VIEWPORT_PADDING, window.innerHeight - panelHeight - VIEWPORT_PADDING)
    const top = Math.min(Math.max(preferredTop, VIEWPORT_PADDING), maxTop)

    setPopoverPosition({ left, top, width })
  }, [isMobile, isOpen])

  useLayoutEffect(() => {
    if (!isOpen || isMobile) return
    updatePopoverPosition()
    window.addEventListener('resize', updatePopoverPosition)
    window.addEventListener('scroll', updatePopoverPosition, true)
    return () => {
      window.removeEventListener('resize', updatePopoverPosition)
      window.removeEventListener('scroll', updatePopoverPosition, true)
    }
  }, [isMobile, isOpen, isRefreshing, updatePopoverPosition, validationError])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node
      if (triggerRef.current?.contains(target) || panelRef.current?.contains(target)) return
      closeEditor()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        closeEditor()
      }
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [closeEditor, isOpen])

  useEffect(() => {
    if (!isOpen || !isMobile || typeof document === 'undefined') return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [isMobile, isOpen])

  useEffect(() => {
    if (!isOpen) return
    window.setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen])

  const handleOpen = async () => {
    if (isOpen) {
      closeEditor()
      return
    }

    const requestId = refreshRequestRef.current + 1
    refreshRequestRef.current = requestId
    const currentValue = normalizeNickname(value)
    setInitialNickname(currentValue)
    setInputValue(currentValue ?? '')
    setInlineError('')
    setIsRefreshing(true)
    setIsOpen(true)

    try {
      const freshValue = normalizeNickname(await onRefresh())
      if (refreshRequestRef.current !== requestId) return
      setInitialNickname(freshValue)
      setInputValue(freshValue ?? '')
    } catch {
      if (refreshRequestRef.current !== requestId) return
      setInlineError(t('common.nickname_error_network'))
    } finally {
      if (refreshRequestRef.current === requestId) {
        setIsRefreshing(false)
      }
    }
  }

  const handleSubmit = async (nickname: string | null, clearing: boolean) => {
    const normalizedNickname = normalizeNickname(nickname)
    if (normalizedNickname?.length === 1) {
      setInlineError(t('common.nickname_error_length'))
      return
    }

    setInlineError('')
    setLiveMessage(t('common.saving'))
    if (clearing) setIsClearing(true)
    else setIsSaving(true)

    try {
      const result = await onSave(normalizedNickname)
      const savedNickname = normalizeNickname(result.nicknameAtBusiness)
      const successKey = savedNickname === null
        ? 'common.nickname_toast_removed'
        : initialNickname === null
          ? 'common.nickname_toast_set'
          : 'common.nickname_toast_updated'
      const successMessage = t(successKey)
      setInitialNickname(savedNickname)
      setInputValue(savedNickname ?? '')
      setLiveMessage(successMessage)
      showToast(successMessage, 'success')
      closeEditor()
    } catch (error: unknown) {
      if (isApiError(error) && error.status === 400) {
        setInlineError(t('common.nickname_error_length'))
      } else if (isApiError(error) && (error.status === 403 || error.status === 404)) {
        const errorKey = error.status === 403
          ? 'errors.common_forbidden'
          : 'errors.common_not_found'
        closeEditor()
        showToast(t(errorKey), 'error')
        try {
          await onRefresh()
        } catch {
          // The access error toast already describes the actionable failure.
        }
      } else {
        setInlineError(t('common.nickname_error_network'))
      }
    } finally {
      setIsSaving(false)
      setIsClearing(false)
    }
  }

  const handleFocusTrap = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (!isMobile || event.key !== 'Tab' || !panelRef.current) return
    const focusable = Array.from(
      panelRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), [href], [tabindex]',
      ),
    ).filter((element) => !element.hasAttribute('hidden') && element.tabIndex >= 0)
    if (focusable.length === 0) {
      event.preventDefault()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const stopTriggerPropagation = (event: SyntheticEvent) => {
    if (stopPropagation) event.stopPropagation()
  }

  const triggerClassName = triggerVariant === 'icon'
    ? 'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-nexoraBrand transition hover:bg-nexoraBrandSoft focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30'
    : 'inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText shadow-sm transition hover:bg-nexoraSurfaceMuted focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30'

  const trigger = (
    <button
      ref={triggerRef}
      type='button'
      aria-haspopup='dialog'
      aria-expanded={isOpen}
      aria-controls={isOpen ? panelId : undefined}
      aria-label={triggerLabel}
      title={triggerLabel}
      onClick={(event) => {
        stopTriggerPropagation(event)
        void handleOpen()
      }}
      onKeyDown={stopTriggerPropagation}
      onKeyUp={stopTriggerPropagation}
      className={triggerClassName}
    >
      {triggerVariant === 'icon' ? (
        <span className='grid h-7 w-7 place-items-center rounded-lg bg-nexoraBrandSoft text-nexoraBrand'>
          <Pencil className='h-4 w-4' aria-hidden='true' />
        </span>
      ) : (
        <>
          <Pencil className='h-4 w-4 text-nexoraBrand' aria-hidden='true' />
          <span>{triggerLabel}</span>
        </>
      )}
    </button>
  )

  const editorFields = (
    <>
      <label htmlFor={inputId} className='text-xs font-extrabold text-nexoraText'>
        {fieldLabel}
      </label>
      <div className='relative mt-1.5'>
        <input
          ref={inputRef}
          id={inputId}
          value={inputValue}
          maxLength={100}
          readOnly={isSubmitting || isRefreshing}
          placeholder={originalName}
          aria-describedby={`${helperId} ${counterId}${validationError ? ` ${errorId}` : ''}`}
          aria-invalid={Boolean(validationError)}
          aria-busy={isRefreshing || isSubmitting}
          onChange={(event) => {
            setInputValue(event.target.value)
            setInlineError('')
          }}
          className='h-11 w-full rounded-lg border border-nexoraBorder bg-white px-3 pr-12 text-base font-semibold text-nexoraText outline-none transition placeholder:text-nexoraMuted focus:border-nexoraBrand focus:ring-2 focus:ring-nexoraBrand/20 read-only:bg-nexoraCanvas'
        />
        {isRefreshing ? (
          <Loader2 className='absolute right-3 top-3.5 h-4 w-4 animate-spin text-nexoraBrand' aria-hidden='true' />
        ) : null}
      </div>
      <div className='mt-1.5 flex items-start justify-between gap-3'>
        <p id={helperId} className='text-xs leading-relaxed text-nexoraMuted'>
          {helperText}
        </p>
        <span id={counterId} className='shrink-0 text-xs font-semibold text-nexoraMuted'>
          {inputValue.length}/100
        </span>
      </div>
      {validationError ? (
        <p id={errorId} role='alert' className='mt-2 text-xs font-bold text-nexoraDangerDark'>
          {validationError}
        </p>
      ) : null}
    </>
  )

  const editorActions = (
    <div className='mt-5 flex items-center justify-between gap-3'>
      {initialNickname !== null ? (
        <button
          type='button'
          onClick={() => void handleSubmit(null, true)}
          disabled={isSubmitting || isRefreshing}
          className='inline-flex min-h-10 items-center gap-2 rounded-lg px-2 text-xs font-bold text-nexoraDangerDark transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50'
        >
          {isClearing ? <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' /> : null}
          {t('common.nickname_clear_action')}
        </button>
      ) : <span />}
      <button
        type='submit'
        disabled={isSubmitting || isRefreshing || isUnchanged || hasLengthError}
        className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-50'
      >
        {isSaving ? <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' /> : null}
        {normalizedInput === null
          ? t('common.nickname_clear_confirm_label')
          : t('common.save')}
      </button>
    </div>
  )

  const editorContent = (
    <div className='flex max-h-[92dvh] flex-col overflow-y-auto p-5'>
      <div className='flex items-start justify-between gap-3'>
        <h2 id={titleId} className='text-base font-extrabold text-nexoraText'>
          {t('common.nickname_dialog_title')}
        </h2>
        <button
          type='button'
          onClick={closeEditor}
          className='inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-nexoraMuted transition hover:bg-nexoraSurfaceMuted focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30'
          aria-label={t('common.close')}
          title={t('common.close')}
        >
          <X className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>

      <form
        className='mt-4'
        onSubmit={(event) => {
          event.preventDefault()
          if (isSubmitting || isRefreshing || isUnchanged || hasLengthError) return
          void handleSubmit(normalizedInput, false)
        }}
      >
        {editorFields}
        {editorActions}
      </form>
    </div>
  )

  const mobileEditor = (
    <div
      className='fixed inset-0 z-[100] flex items-end bg-nexoraText/60'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeEditor()
      }}
    >
      <div
        ref={panelRef}
        id={panelId}
        role='dialog'
        aria-modal='true'
        aria-labelledby={titleId}
        onKeyDown={handleFocusTrap}
        className='w-full max-h-[92dvh] rounded-t-2xl bg-white pb-[max(1rem,env(safe-area-inset-bottom))] shadow-2xl'
      >
        {editorContent}
      </div>
    </div>
  )

  const desktopEditor = (
    <div
      ref={panelRef}
      id={panelId}
      role='dialog'
      aria-labelledby={titleId}
      style={{
        position: 'fixed',
        left: popoverPosition?.left ?? 0,
        top: popoverPosition?.top ?? -9999,
        width: popoverPosition?.width ?? POPOVER_WIDTH,
        visibility: popoverPosition ? 'visible' : 'hidden',
        zIndex: 100,
      }}
      className='max-h-[calc(100dvh-16px)] overflow-y-auto rounded-xl border border-nexoraBorder bg-white shadow-2xl'
    >
      {editorContent}
    </div>
  )

  const portal = isOpen && typeof document !== 'undefined'
    ? createPortal(isMobile ? mobileEditor : desktopEditor, document.body)
    : null

  return (
    <div className={containerClassName}>
      {trigger}
      {portal}
      <span className='sr-only' aria-live='polite' aria-atomic='true'>
        {liveMessage}
      </span>
    </div>
  )
}
