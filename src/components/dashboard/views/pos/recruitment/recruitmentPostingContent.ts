import DOMPurify from 'dompurify'
import type { RecruitmentPostingContent, RecruitmentPostingImage } from '../../../../../types/posRecruitment'

export const POSTING_IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const POSTING_INLINE_IMAGE_MAX = 6
export const POSTING_VIDEO_MAX = 3
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const RICH_TAGS = ['p', 'div', 'br', 'strong', 'b', 'em', 'i', 'u', 'h1', 'h2', 'h3', 'ol', 'ul', 'li', 'a']

export function safePostingLink(value: string): string | null {
  try {
    const url = new URL(value.trim())
    return ['http:', 'https:', 'mailto:', 'tel:'].includes(url.protocol) ? value.trim() : null
  } catch { return null }
}

export function sanitizePostingHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, { ALLOWED_TAGS: RICH_TAGS, ALLOWED_ATTR: ['href'], ALLOW_DATA_ATTR: false, ALLOW_ARIA_ATTR: false })
  const element = document.createElement('div')
  element.innerHTML = clean
  element.querySelectorAll('a').forEach((anchor) => {
    const href = safePostingLink(anchor.getAttribute('href') ?? '')
    if (!href) anchor.removeAttribute('href')
    else { anchor.setAttribute('href', href); anchor.setAttribute('target', '_blank'); anchor.setAttribute('rel', 'noopener noreferrer') }
  })
  return element.innerHTML
}

export function postingPlainText(html: string): string {
  const element = document.createElement('div')
  element.innerHTML = sanitizePostingHtml(html)
  const visit = (node: Node): string => {
    if (node.nodeType === 3) return node.textContent ?? ''
    if (node instanceof HTMLElement && node.tagName === 'BR') return '\n'
    const children = Array.from(node.childNodes).map(visit).join('')
    return node instanceof HTMLElement && ['P', 'DIV', 'H1', 'H2', 'H3', 'LI', 'UL', 'OL'].includes(node.tagName) ? `${children}\n` : children
  }
  return visit(element).replace(/\n{3,}/g, '\n\n').trim()
}

export function postingHtmlFromText(body: string): string {
  return body.split('\n').map((line) => {
    const element = document.createElement('p')
    element.textContent = line
    return line ? element.outerHTML : '<p><br></p>'
  }).join('')
}

function imageSignature(bytes: Uint8Array, type: string): boolean {
  if (type === 'image/jpeg') return bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
  if (type === 'image/png') return [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)
  return type === 'image/webp' && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
}

function safeImage(value: unknown): RecruitmentPostingImage | undefined {
  if (!value || typeof value !== 'object' || !('url' in value) || typeof value.url !== 'string') return undefined
  const name = 'name' in value && typeof value.name === 'string' ? value.name.replace(/[\u0000-\u001f\u007f]/g, '').slice(0, 120) : ''
  if (value.url.startsWith('https://')) {
    try {
      const url = new URL(value.url)
      if (!url.username && !url.password && !/\.(?:svg|html?)$/i.test(url.pathname)) return { url: value.url, name }
    } catch { return undefined }
    return undefined
  }
  const match = value.url.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/)
  if (!match || match[2].length % 4 !== 0 || match[2].length * 3 / 4 - (match[2].endsWith('==') ? 2 : match[2].endsWith('=') ? 1 : 0) > POSTING_IMAGE_MAX_BYTES) return undefined
  try {
    const bytes = Uint8Array.from(atob(match[2].slice(0, 32)), (letter) => letter.charCodeAt(0))
    if (!imageSignature(bytes, match[1])) return undefined
  } catch { return undefined }
  return { url: value.url, name }
}

export function normalizePostingVideoUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.port) return null
    if (url.hostname === 'youtu.be') return /^\/[A-Za-z0-9_-]{11}\/?$/.test(url.pathname) ? url.href : null
    if (!['youtube.com', 'www.youtube.com', 'm.youtube.com'].includes(url.hostname)) return null
    return (url.pathname === '/watch' && /^[A-Za-z0-9_-]{11}$/.test(url.searchParams.get('v') ?? '')) || /^\/(?:shorts|embed)\/[A-Za-z0-9_-]{11}\/?$/.test(url.pathname) ? url.href : null
  } catch { return null }
}

export function normalizePostingContent(value: unknown): RecruitmentPostingContent | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value) || !('html' in value) || typeof value.html !== 'string') return undefined
  const images = 'images' in value && Array.isArray(value.images) ? value.images.map(safeImage).filter((image): image is RecruitmentPostingImage => Boolean(image)).slice(0, POSTING_INLINE_IMAGE_MAX) : []
  const videos = 'videoUrls' in value && Array.isArray(value.videoUrls) ? value.videoUrls.filter((url): url is string => typeof url === 'string').map(normalizePostingVideoUrl).filter((url): url is string => Boolean(url)) : []
  const coverImage = 'coverImage' in value ? safeImage(value.coverImage) : undefined
  return { html: sanitizePostingHtml(value.html), ...(coverImage ? { coverImage } : {}), images, videoUrls: Array.from(new Set(videos)).slice(0, POSTING_VIDEO_MAX) }
}

export async function readPostingImage(file: File): Promise<RecruitmentPostingImage> {
  if (!IMAGE_TYPES.includes(file.type) || file.size <= 0 || file.size > POSTING_IMAGE_MAX_BYTES || !imageSignature(new Uint8Array(await file.slice(0, 12).arrayBuffer()), file.type)) throw new Error('Invalid image')
  const url = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Image read failed'))
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Image read failed'))
    reader.readAsDataURL(file)
  })
  await new Promise<void>((resolve, reject) => {
    const image = new Image()
    image.onload = () => image.naturalWidth && image.naturalHeight ? resolve() : reject(new Error('Invalid image'))
    image.onerror = () => reject(new Error('Invalid image'))
    image.src = url
  })
  return { url, name: file.name.slice(0, 120) }
}
