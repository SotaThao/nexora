import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const IMAGE_FORMAT_PATTERN = /^[a-z0-9]+$/i
const PRIVATE_URL_TTL_SECONDS = 5 * 60

type Visibility = 'public' | 'private'
type UploadType = 'upload' | 'authenticated'

type SignUploadBody = {
  action: 'sign-upload'
  communityId?: unknown
  postId?: unknown
  visibility?: unknown
}

type SignUrlBody = {
  action: 'sign-url'
  publicId?: unknown
  visibility?: unknown
  format?: unknown
}

class HttpError extends Error {
  constructor(readonly status: number, message: string) {
    super(message)
  }
}

function response(status: number, body: Record<string, unknown>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

// Allow configuring via a single CLOUDINARY_URL secret
// (cloudinary://<api_key>:<api_secret>@<cloud_name>) as well as the three
// discrete CLOUDINARY_* secrets. Discrete vars win when both are present.
function parseCloudinaryUrl(): Record<string, string> {
  const raw = Deno.env.get('CLOUDINARY_URL')?.trim()
  if (!raw) return {}
  // Tolerate a secret value that accidentally captured trailing text (e.g. a
  // shell that swallowed the next command): stop each field at whitespace.
  const match = raw.match(/^cloudinary:\/\/([^:\s]+):([^@\s]+)@([^\s]+)/)
  if (!match) return {}
  return {
    CLOUDINARY_API_KEY: match[1].trim(),
    CLOUDINARY_API_SECRET: match[2].trim(),
    CLOUDINARY_CLOUD_NAME: match[3].trim(),
  }
}
const CLOUDINARY_URL_ENV = parseCloudinaryUrl()

function requiredEnv(name: string): string {
  const value = Deno.env.get(name)?.trim() || CLOUDINARY_URL_ENV[name]
  if (!value) throw new HttpError(500, `Missing required function secret: ${name}`)
  return value
}

function requireVisibility(value: unknown): Visibility {
  if (value === 'public' || value === 'private') return value
  throw new HttpError(400, 'Invalid community visibility.')
}

function requireUuid(value: unknown, field: string): string {
  if (typeof value === 'string' && UUID_PATTERN.test(value)) return value
  throw new HttpError(400, `Invalid ${field}.`)
}

function uploadTypeFor(visibility: Visibility): UploadType {
  return visibility === 'private' ? 'authenticated' : 'upload'
}

function safePublicId(publicId: string): string {
  return publicId.split('/').map(encodeURIComponent).join('/')
}

function communityIdFromPublicId(publicId: unknown): string {
  if (typeof publicId !== 'string') throw new HttpError(400, 'Invalid media reference.')
  const parts = publicId.split('/')
  if (parts.length >= 4 && parts[0] === 'community' && UUID_PATTERN.test(parts[1]) && UUID_PATTERN.test(parts[2])) {
    return parts[1]
  }
  if (parts.length >= 3 && UUID_PATTERN.test(parts[0]) && UUID_PATTERN.test(parts[1])) {
    return parts[0]
  }
  throw new HttpError(400, 'Invalid community media reference.')
}

async function sha1(value: string): Promise<Uint8Array> {
  const bytes = new TextEncoder().encode(value)
  return new Uint8Array(await crypto.subtle.digest('SHA-1', bytes))
}

async function sha1Hex(value: string): Promise<string> {
  return Array.from(await sha1(value), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function cloudinaryApiSignature(params: Record<string, string | number>, apiSecret: string): Promise<string> {
  const toSign = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${value}`)
    .join('&')
  return sha1Hex(`${toSign}${apiSecret}`)
}

async function requireMember(request: Request, communityId: string, visibility: Visibility): Promise<void> {
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Authentication is required.')

  const supabase = createClient(
    requiredEnv('SUPABASE_URL'),
    requiredEnv('SUPABASE_ANON_KEY'),
    { global: { headers: { Authorization: authorization } } },
  )
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new HttpError(401, 'Invalid authentication token.')

  const { data: isMember, error: memberError } = await supabase.rpc('is_member', { p_community_id: communityId })
  if (memberError || isMember !== true) throw new HttpError(403, 'Community membership is required.')

  // Never trust a visibility supplied by the browser: it determines Cloudinary delivery type.
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('media_visibility')
    .eq('id', communityId)
    .maybeSingle()
  if (communityError || !community || community.media_visibility !== visibility) {
    throw new HttpError(403, 'Community media visibility does not match.')
  }
}

async function parseBody(request: Request): Promise<SignUploadBody | SignUrlBody> {
  try {
    const body = await request.json()
    if (!body || typeof body !== 'object' || !('action' in body)) throw new Error('invalid')
    return body as SignUploadBody | SignUrlBody
  } catch {
    throw new HttpError(400, 'Invalid JSON request body.')
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return response(405, { error: 'Method not allowed.' })

  try {
    const body = await parseBody(request)
    const cloudName = requiredEnv('CLOUDINARY_CLOUD_NAME')
    const apiKey = requiredEnv('CLOUDINARY_API_KEY')
    const apiSecret = requiredEnv('CLOUDINARY_API_SECRET')

    if (body.action === 'sign-upload') {
      const communityId = requireUuid(body.communityId, 'communityId')
      const postId = requireUuid(body.postId, 'postId')
      const visibility = requireVisibility(body.visibility)
      await requireMember(request, communityId, visibility)

      const timestamp = Math.floor(Date.now() / 1_000)
      const folder = `community/${communityId}/${postId}`
      const type = uploadTypeFor(visibility)
      // `folder` covers legacy fixed-folder environments; the prefix preserves the
      // same public-ID convention for Cloudinary's current dynamic-folder mode.
      const publicIdPrefix = folder
      const signature = await cloudinaryApiSignature({ folder, public_id_prefix: publicIdPrefix, timestamp, type }, apiSecret)
      return response(200, {
        cloudName,
        apiKey,
        timestamp,
        signature,
        folder,
        publicIdPrefix,
        type,
        uploadUrl: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/upload`,
      })
    }

    if (body.action === 'sign-url') {
      const publicId = typeof body.publicId === 'string' ? body.publicId : ''
      const communityId = communityIdFromPublicId(publicId)
      const visibility = requireVisibility(body.visibility)
      await requireMember(request, communityId, visibility)

      if (visibility === 'public') {
        return response(200, { url: `https://res.cloudinary.com/${encodeURIComponent(cloudName)}/image/upload/${safePublicId(publicId)}` })
      }

      if (typeof body.format !== 'string' || !IMAGE_FORMAT_PATTERN.test(body.format)) {
        throw new HttpError(400, 'Private media format is required.')
      }
      const timestamp = Math.floor(Date.now() / 1_000)
      const expiresAt = timestamp + PRIVATE_URL_TTL_SECONDS
      const type: UploadType = 'authenticated'
      const signature = await cloudinaryApiSignature({
        expires_at: expiresAt,
        format: body.format,
        public_id: publicId,
        timestamp,
        type,
      }, apiSecret)
      const query = new URLSearchParams({
        public_id: publicId,
        format: body.format,
        type,
        timestamp: String(timestamp),
        expires_at: String(expiresAt),
        api_key: apiKey,
        signature,
      })
      return response(200, { url: `https://api.cloudinary.com/v1_1/${encodeURIComponent(cloudName)}/image/download?${query.toString()}` })
    }

    throw new HttpError(400, 'Unsupported media action.')
  } catch (error) {
    if (error instanceof HttpError) return response(error.status, { error: error.message })
    return response(500, { error: 'Unable to process media request.' })
  }
})
