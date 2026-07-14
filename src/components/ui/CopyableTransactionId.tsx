import { useState, useCallback, type MouseEvent } from 'react'
import { Copy, Check } from 'lucide-react'

const DEFAULT_HEAD = 8
const DEFAULT_TAIL = 4

export function truncateTransactionId(
  id: string | null | undefined,
  head = DEFAULT_HEAD,
  tail = DEFAULT_TAIL,
): string {
  const value = String(id ?? '').trim()
  if (!value) return '—'
  if (value.length <= head + tail + 1) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}

type CopyableTransactionIdProps = {
  id: string | null | undefined
  className?: string
  head?: number
  tail?: number
  copyLabel?: string
  copiedLabel?: string
}

export default function CopyableTransactionId({
  id,
  className = '',
  head = DEFAULT_HEAD,
  tail = DEFAULT_TAIL,
  copyLabel = 'Copy',
  copiedLabel = 'Copied',
}: CopyableTransactionIdProps) {
  const full = String(id ?? '').trim()
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    e.preventDefault()
    if (!full) return
    try {
      await navigator.clipboard.writeText(full)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard may be unavailable in some WebViews
    }
  }, [full])

  if (!full) {
    return <span className={className}>—</span>
  }

  const display = truncateTransactionId(full, head, tail)

  return (
    <span className={`inline-flex items-center gap-1 min-w-0 max-w-full ${className}`}>
      <span
        className="font-mono text-[11px] font-bold text-nexoraText truncate"
        title={full}
      >
        {display}
      </span>
      <button
        type="button"
        onClick={handleCopy}
        className="shrink-0 inline-flex h-6 w-6 items-center justify-center rounded-md text-nexoraMuted hover:bg-nexoraCanvas hover:text-nexoraBrand transition-colors cursor-pointer"
        title={copied ? copiedLabel : copyLabel}
        aria-label={copied ? copiedLabel : copyLabel}
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-nexoraSuccess" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </span>
  )
}
