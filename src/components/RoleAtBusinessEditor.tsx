import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Briefcase, Loader2, X } from 'lucide-react'
import { useTranslation } from '../contexts/LanguageContext'
import { useNotification } from '../contexts/NotificationContext'
import { useIsMobileUI } from '../hooks/useIsMobileUI'
import { getErrorI18nKey } from '../data/errorCodes'
import { getApiErrorCode, isApiError } from '../types/domain'
import { STAFF_ROLE_AT_BUSINESS_MAX_LENGTH, STAFF_ROLE_ERROR_KEYS } from './staff/constants'

export interface RoleAtBusinessEditorSaveResult {
  roleAtBusiness: string
}

interface RoleAtBusinessEditorProps {
  value: string | null
  triggerLabel: string
  fieldLabel: string
  helperText: string
  placeholder?: string
  notFoundErrorKey?: string
  onRefresh: () => Promise<string | null>
  onSave: (roleAtBusiness: string) => Promise<RoleAtBusinessEditorSaveResult>
}

interface PopoverPosition {
  left: number
  top: number
  width: number
}

const VIEWPORT_PADDING = 8
const POPOVER_GAP = 8
const POPOVER_WIDTH = 320
const ESTIMATED_PANEL_HEIGHT = 300

function normalizeRole(value: string | null | undefined): string {
  return value?.trim() ?? ''
}

function resolveInlineValidationError(value: string, t: (key: string) => string): string {
  const trimmed = value.trim()
  if (!trimmed) return t(STAFF_ROLE_ERROR_KEYS.required)
  if (trimmed.length > STAFF_ROLE_AT_BUSINESS_MAX_LENGTH) {
    return t(STAFF_ROLE_ERROR_KEYS.tooLong)
  }
  return ''
}

function resolveSubmitError(
  error: unknown,
  t: (key: string) => string,
  notFoundErrorKey: string,
): string {
  if (isApiError(error)) {
    if (error.status === 400) {
      const errorCode = getApiErrorCode(error, '')
      return errorCode
        ? t(getErrorI18nKey(errorCode))
        : t(STAFF_ROLE_ERROR_KEYS.required)
    }
    if (error.status === 401) return t(STAFF_ROLE_ERROR_KEYS.unauthorized)
    if (error.status === 403) return t('errors.common_forbidden')
    if (error.status === 404) return t(notFoundErrorKey)
    if (error.status === 0) return t('staff_detail.role_error_network')
    const errorCode = getApiErrorCode(error, '')
    return errorCode
      ? t(getErrorI18nKey(errorCode))
      : t('staff_detail.role_error_network')
  }
  return t('staff_detail.role_error_network')
}

export default function RoleAtBusinessEditor({
  value,
  triggerLabel,
  fieldLabel,
  helperText,
  placeholder,
  notFoundErrorKey = STAFF_ROLE_ERROR_KEYS.linkNotActive,
  onRefresh,
  onSave,
}: RoleAtBusinessEditorProps) {
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
  const [initialRole, setInitialRole] = useState(normalizeRole(value))
  const [inlineError, setInlineError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const [popoverPosition, setPopoverPosition] = useState<PopoverPosition | null>(null)

  const normalizedInput = normalizeRole(inputValue)
  const isUnchanged = normalizedInput === initialRole
  const isSubmitting = isSaving

  useEffect(() => {
    if (isOpen) return
    const nextValue = normalizeRole(value)
    setInitialRole(nextValue)
    setInputValue(nextValue)
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
      ESTIMATED_PANEL_HEIGHT,
      window.innerHeight - VIEWPORT_PADDING * 2,
    )
    const maxLeft = Math.max(VIEWPORT_PADDING, window.innerWidth - width - VIEWPORT_PADDING)
    const left = Math.min(Math.max(triggerRect.left, VIEWPORT_PADDING), maxLeft)
    const spaceAbove = triggerRect.top - VIEWPORT_PADDING
    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_PADDING
    const canFitAbove = spaceAbove >= panelHeight + POPOVER_GAP
    const canFitBelow = spaceBelow >= panelHeight + POPOVER_GAP
    const openAbove = canFitAbove || !canFitBelow
    const preferredTop = openAbove
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
    return () => {
      window.removeEventListener('resize', updatePopoverPosition)
    }
  }, [isMobile, isOpen, updatePopoverPosition])

  useEffect(() => {
    if (!isOpen) return

    const handleMouseDown = (event: MouseEvent) => {
      // Mobile uses a full-screen sheet dialog — do not dismiss on outside click.
      if (isMobile) return
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
  }, [closeEditor, isMobile, isOpen])

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
    const currentValue = normalizeRole(value)
    setInitialRole(currentValue)
    setInputValue(currentValue)
    setInlineError('')
    setIsRefreshing(true)
    setIsOpen(true)

    try {
      const freshValue = normalizeRole(await onRefresh())
      if (refreshRequestRef.current !== requestId) return
      setInitialRole(freshValue)
      setInputValue(freshValue)
    } catch {
      if (refreshRequestRef.current !== requestId) return
      setInlineError(t('staff_detail.role_error_network'))
    } finally {
      if (refreshRequestRef.current === requestId) {
        setIsRefreshing(false)
      }
    }
  }

  const handleSubmit = async () => {
    const trimmedRole = normalizeRole(inputValue)
    const clientError = resolveInlineValidationError(inputValue, t)
    if (clientError) {
      setInlineError(clientError)
      return
    }

    setInlineError('')
    setLiveMessage(t('common.saving'))
    setIsSaving(true)

    try {
      const result = await onSave(trimmedRole)
      const savedRole = normalizeRole(result?.roleAtBusiness ?? trimmedRole)
      const successKey = initialRole
        ? 'staff_detail.role_toast_updated'
        : 'staff_detail.role_toast_set'
      const successMessage = t(successKey)
      setInitialRole(savedRole)
      setInputValue(savedRole)
      setLiveMessage(successMessage)
      showToast(successMessage, 'success')
      closeEditor()
    } catch (error: unknown) {
      if (isApiError(error) && (error.status === 401 || error.status === 403 || error.status === 404)) {
        closeEditor()
        showToast(resolveSubmitError(error, t, notFoundErrorKey), 'error')
        try {
          await onRefresh()
        } catch {
          // Access error toast already describes the failure.
        }
        return
      }
      setInlineError(resolveSubmitError(error, t, notFoundErrorKey))
    } finally {
      setIsSaving(false)
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

  const trigger = (
    <button
      ref={triggerRef}
      type='button'
      aria-haspopup='dialog'
      aria-expanded={isOpen}
      aria-controls={isOpen ? panelId : undefined}
      aria-label={triggerLabel}
      title={triggerLabel}
      onClick={() => void handleOpen()}
      className='inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-nexoraBorder bg-white px-4 text-xs font-bold text-nexoraText shadow-sm transition hover:bg-nexoraSurfaceMuted focus:outline-none focus:ring-2 focus:ring-nexoraBrand/30'
    >
      <Briefcase className='h-4 w-4 text-nexoraBrand' aria-hidden='true' />
      <span>{triggerLabel}</span>
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
          maxLength={STAFF_ROLE_AT_BUSINESS_MAX_LENGTH}
          readOnly={isSubmitting || isRefreshing}
          placeholder={placeholder}
          aria-describedby={`${helperId} ${counterId}${inlineError ? ` ${errorId}` : ''}`}
          aria-invalid={Boolean(inlineError)}
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
          {inputValue.length}/{STAFF_ROLE_AT_BUSINESS_MAX_LENGTH}
        </span>
      </div>
      <div className='mt-2 min-h-[1rem]'>
        {inlineError ? (
          <p id={errorId} role='alert' className='text-xs font-bold text-nexoraDangerDark'>
            {inlineError}
          </p>
        ) : null}
      </div>
    </>
  )

  const editorContent = (
    <div className='flex max-h-[92dvh] flex-col overflow-y-auto p-5'>
      <div className='flex items-start justify-between gap-3'>
        <h2 id={titleId} className='text-base font-extrabold text-nexoraText'>
          {t('staff_detail.role_dialog_title')}
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
          if (isSubmitting || isRefreshing || isUnchanged) return
          void handleSubmit()
        }}
      >
        {editorFields}
        <div className='mt-5 flex items-center justify-end'>
          <button
            type='submit'
            disabled={isSubmitting || isRefreshing || isUnchanged}
            className='inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-nexoraBrand px-4 text-xs font-bold text-white transition hover:bg-nexoraBrand/90 disabled:cursor-not-allowed disabled:opacity-50'
          >
            {isSaving ? <Loader2 className='h-4 w-4 animate-spin' aria-hidden='true' /> : null}
            {t('common.save')}
          </button>
        </div>
      </form>
    </div>
  )

  const mobileEditor = (
    <div
      className='fixed inset-0 z-[100] flex items-end bg-nexoraText/60'
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
    <div className='relative shrink-0'>
      {trigger}
      {portal}
      <span className='sr-only' aria-live='polite' aria-atomic='true'>
        {liveMessage}
      </span>
    </div>
  )
}
