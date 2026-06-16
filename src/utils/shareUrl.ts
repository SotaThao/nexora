function buildShareData({
  url,
  title,
  text,
}: {
  url: string
  title?: string
  text?: string
}): ShareData {
  const shareData: ShareData = { url }
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

/** Prefer native `navigator.share`; copy to clipboard only when Web Share is unavailable. */
export async function shareUrl({
  url,
  title,
  text,
}: {
  url: string
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
      throw err
    }
  }

  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
    return 'copied'
  }

  throw new Error('SHARE_UNAVAILABLE')
}
