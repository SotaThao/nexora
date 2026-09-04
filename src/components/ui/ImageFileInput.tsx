import React, { useRef } from 'react'
import { readImageFileAsDataUrl } from '../../utils/imageFile'

interface ImageFileInputProps extends React.HTMLAttributes<HTMLElement> {
  onPick?: (dataUrl: string) => void
  onPickFile?: (file: File) => void
  disabled?: boolean
  source?: string
  capture?: 'environment' | 'user' | boolean
  accept?: string
  inputAriaLabel?: string
  className?: string
  inputClassName?: string
  children?: React.ReactNode
  as?: string
}

export default function ImageFileInput({
  onPick,
  onPickFile = undefined,
  disabled = false,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  source = 'photos',
  capture,
  accept = 'image/*',
  inputAriaLabel,
  className = '',
  inputClassName = 'sr-only',
  children = null,
  as = 'label',
  ...rest
}: ImageFileInputProps) {
  const inputRef = useRef(null)

  const handleWebChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      onPickFile?.(file)
      if (onPick) {
        const dataUrl = await readImageFileAsDataUrl(file)
        onPick(dataUrl)
      }
    } catch {
      // Ignore unreadable files; consumers receive no invalid image data.
    } finally {
      event.target.value = ''
    }
  }

  const handleActivate = (event) => {
    if (disabled) {
      event?.preventDefault?.()
      return
    }
    // For non-label wrappers, forward the activation to the hidden file input.
    if (as !== 'label') {
      event?.preventDefault?.()
      inputRef.current?.click()
    }
  }

  const Wrapper = as === 'button' ? 'button' : as === 'label' ? 'label' : 'div'
  const usesManualActivation = as !== 'label'

  return (
    <Wrapper
      {...rest}
      className={className}
      onClick={usesManualActivation ? handleActivate : undefined}
      type={as === 'button' ? 'button' : undefined}
      role={as === 'div' ? 'button' : undefined}
      tabIndex={as === 'div' && !disabled ? 0 : undefined}
      onKeyDown={as === 'div' && !disabled ? (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          handleActivate(event)
        }
      } : undefined}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        aria-label={inputAriaLabel}
        capture={capture as any}
        className={inputClassName}
        onChange={handleWebChange}
        disabled={disabled}
      />
    </Wrapper>
  )
}
