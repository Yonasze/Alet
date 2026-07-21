import { getSupabaseServerConfig } from '@/lib/supabase/server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { url, anonKey } = getSupabaseServerConfig()
  const publicHeaders = {
    apikey: anonKey,
    Authorization: `Bearer ${anonKey}`,
  }

  const pathResponse = await fetch(
    `${url}/rest/v1/rpc/public_project_media_storage_path`,
    {
      method: 'POST',
      headers: {
        ...publicHeaders,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ target_media_id: id }),
      cache: 'no-store',
    },
  )

  if (!pathResponse.ok) {
    return new Response('Image not found.', { status: 404 })
  }

  const storagePath = await pathResponse.json() as string | null
  if (!storagePath) {
    return new Response('Image not found.', { status: 404 })
  }

  const encodedPath = storagePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  const imageResponse = await fetch(
    `${url}/storage/v1/object/project-media/${encodedPath}`,
    { headers: publicHeaders, cache: 'no-store' },
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
