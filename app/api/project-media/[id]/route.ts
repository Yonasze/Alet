import { getSupabaseServerConfig } from '@/lib/supabase/server'

type PrivateMediaRow = {
  storage_path: string
  project_id: string
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params
  const { url, serviceRoleKey } = getSupabaseServerConfig()

  if (!serviceRoleKey) {
    return new Response('Image service is not configured.', { status: 503 })
  }

  const serviceHeaders = {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    Accept: 'application/json',
  }
  const mediaResponse = await fetch(
    `${url}/rest/v1/project_media?select=storage_path,project_id&id=eq.${encodeURIComponent(id)}&is_public=eq.true&is_approved=eq.true&limit=1`,
    { headers: serviceHeaders, cache: 'no-store' },
  )

  if (!mediaResponse.ok) {
    return new Response('Image lookup failed.', { status: 502 })
  }

  const media = await mediaResponse.json() as PrivateMediaRow[]
  const mediaRow = media[0]

  if (!mediaRow?.storage_path) {
    return new Response('Image not found.', { status: 404 })
  }

  const publicationResponse = await fetch(
    `${url}/rest/v1/project_publications?select=project_id&project_id=eq.${encodeURIComponent(mediaRow.project_id)}&status=eq.published&limit=1`,
    { headers: serviceHeaders, cache: 'no-store' },
  )
  const publications = publicationResponse.ok
    ? await publicationResponse.json() as Array<{ project_id: string }>
    : []

  if (publications.length === 0) {
    return new Response('Image not found.', { status: 404 })
  }

  const encodedPath = mediaRow.storage_path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')

  const imageResponse = await fetch(
    `${url}/storage/v1/object/project-media/${encodedPath}`,
    { headers: serviceHeaders, cache: 'no-store' },
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
