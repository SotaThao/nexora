function buildShareData({
  url,
  title,
  text,
}: {
  url?: string
  title?: string
  text?: string
}): ShareData {
  const shareData: ShareData = {}
  if (url) shareData.url = url
  if (title) shareData.title = title
  if (text) shareData.text = text
  return shareData
}

export function canUseNativeWebShare(shareData: ShareData): boolean {
  if (typeof navigator.share !== 'function') return false
  if (typeof navigator.canShare !== 'function') return true
  try {
    return navigator.canShare(shareData)
  } catch {
    return false
  }
}

async function copyShareFallback(value?: string): Promise<boolean> {
  if (!value) return false

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value)
      return true
    } catch {
      // Fall through to the legacy copy path for restricted browser contexts.
    }
  }

  if (typeof document === 'undefined' || typeof document.execCommand !== 'function') {
    return false
  }

  const textarea = document.createElement('textarea')
  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()

  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/** Prefer native `navigator.share`; copy to clipboard when Web Share is unavailable or rejected. */
export async function shareUrl({
  url,
  title,
  text,
}: {
  url?: string
  title?: string
  text?: string
}): Promise<'shared' | 'copied' | 'cancelled'> {
  const shareData = buildShareData({ url, title, text })

  if (canUseNativeWebShare(shareData)) {
    try {
      await navigator.share(shareData)
      return 'shared'
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return 'cancelled'
      }
      if (await copyShareFallback(url || text)) {
        return 'copied'
      }
      throw err
    }
  }

  const fallbackText = url || text
  if (await copyShareFallback(fallbackText)) {
    return 'copied'
  }

  throw new Error('SHARE_UNAVAILABLE')
}
