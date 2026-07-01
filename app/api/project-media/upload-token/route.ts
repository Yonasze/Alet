import { cookies } from 'next/headers'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'
const mediaBucket = 'project-media'
const maxImageBytes = 10 * 1024 * 1024
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

type UploadRequest = {
  client_key: string
  file_name: string
  content_type: string
  size: number
}

function userIdFromToken(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { sub?: string }
    return payload.sub
  } catch {
    return undefined
  }
}

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(-120)
}

export async function POST(request: Request) {
  const { url, serviceRoleKey } = getSupabaseServerConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value
  const userId = accessToken ? userIdFromToken(accessToken) : undefined

  if (!accessToken || !userId) {
    return Response.json({ message: 'Your ERP session expired. Sign in again.' }, { status: 401 })
  }
  if (!serviceRoleKey) {
    return Response.json({ message: 'Image upload is not configured.' }, { status: 503 })
  }

  const body = await request.json().catch(() => null) as { files?: UploadRequest[] } | null
  const files = body?.files

  if (!Array.isArray(files) || files.length < 5 || files.length > 100) {
    return Response.json({ message: 'Choose the required project and unit images.' }, { status: 400 })
  }
  if (files.some((file) => (
    !file.client_key ||
    !file.file_name ||
    !allowedImageTypes.has(file.content_type) ||
    !Number.isFinite(file.size) ||
    file.size <= 0 ||
    file.size > maxImageBytes
  ))) {
    return Response.json({ message: 'Images must be JPG, PNG or WebP and no larger than 10 MB each.' }, { status: 400 })
  }

  const uploads = []
  for (const file of files) {
    const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file.file_name)}`
    const encodedPath = path.split('/').map(encodeURIComponent).join('/')
    const signedResponse = await fetch(
      `${url}/storage/v1/object/upload/sign/${mediaBucket}/${encodedPath}`,
      {
        method: 'POST',
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
          'Content-Type': 'application/json',
        },
        body: '{}',
        cache: 'no-store',
      },
    )
    const signed = await signedResponse.json().catch(() => ({})) as { url?: string; message?: string }

    if (!signedResponse.ok || !signed.url) {
      return Response.json(
        { message: signed.message ?? `Unable to prepare ${file.file_name} for upload.` },
        { status: 502 },
      )
    }

    uploads.push({
      client_key: file.client_key,
      storage_path: path,
      signed_url: signed.url.startsWith('http')
        ? signed.url
        : `${url}/storage/v1${signed.url.startsWith('/') ? signed.url : `/${signed.url}`}`,
    })
  }

  return Response.json({ uploads })
}
