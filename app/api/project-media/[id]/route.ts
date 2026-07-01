import { getSupabaseServerConfig } from '@/lib/supabase/server'

type PublicMediaRow = {
  storage_path: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { url, anonKey, serviceRoleKey } = getSupabaseServerConfig()

  if (!serviceRoleKey) {
    return new Response('Image service is not configured.', { status: 503 })
  }

  const mediaResponse = await fetch(
    `${url}/rest/v1/public_project_media?select=storage_path&media_id=eq.${encodeURIComponent(id)}&limit=1`,
    {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
        Accept: 'application/json',
      },
      cache: 'no-store',
    },
  )

  if (!mediaResponse.ok) {
    return new Response('Image lookup failed.', { status: 502 })
  }

  const media = await mediaResponse.json() as PublicMediaRow[]
  const storagePath = media[0]?.storage_path

  if (!storagePath) {
    return new Response('Image not found.', { status: 404 })
  }

  const encodedPath = storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  const imageResponse = await fetch(
    `${url}/storage/v1/object/project-media/${encodedPath}`,
    {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
      cache: 'no-store',
    },
  )

  if (!imageResponse.ok || !imageResponse.body) {
    return new Response('Image not found.', { status: 404 })
  }

  return new Response(imageResponse.body, {
    headers: {
      'Content-Type': imageResponse.headers.get('content-type') ?? 'application/octet-stream',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
