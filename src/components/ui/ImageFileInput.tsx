import React, { useRef } from 'react'
import { readImageFileAsDataUrl } from '../../utils/imageFile'

interface ImageFileInputProps extends React.HTMLAttributes<HTMLElement> {
  onPick?: (dataUrl: string) => void
  onPickFile?: (file: File) => void
  disabled?: boolean
  source?: string
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
  className = '',
  inputClassName = 'sr-only',
  children = null,
  as = 'label',
  ...rest
}: ImageFileInputProps) {
  const inputRef = useRef(null)

  const emitSelection = (selection) => {
    if (!selection) return
    onPick?.(selection.dataUrl)
    onPickFile?.(selection.file)
  }

  const handleWebChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const dataUrl = await readImageFileAsDataUrl(file)
    emitSelection({ dataUrl, file })
    event.target.value = ''
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
        accept="image/*"
        className={inputClassName}
        onChange={handleWebChange}
        disabled={disabled}
      />
    </Wrapper>
  )
}
