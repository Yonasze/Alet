'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'
const mediaBucket = 'project-media'

export type ProjectEditState = {
  error?: string
}

type UploadedMedia = {
  storage_path: string
  title: string
  alt_text: string
  purpose: 'building' | 'location' | 'unit'
  unit_type_id?: string
  unit_type_code?: string
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function parseJson<T>(formData: FormData, key: string, fallback: T): T {
  try {
    return JSON.parse(stringValue(formData, key)) as T
  } catch {
    return fallback
  }
}

function userIdFromToken(token: string) {
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8')) as { sub?: string }
    return payload.sub
  } catch {
    return undefined
  }
}

async function deleteUploads(url: string, apiKey: string, token: string, paths: string[]) {
  if (paths.length === 0) return
  await fetch(`${url}/storage/v1/object/${mediaBucket}`, {
    method: 'DELETE',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ prefixes: paths }),
    cache: 'no-store',
  }).catch(() => undefined)
}

export async function updateProjectAction(
  projectId: string,
  _state: ProjectEditState,
  formData: FormData,
): Promise<ProjectEditState> {
  const { url, anonKey, serviceRoleKey } = getSupabaseServerConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value
  const userId = accessToken ? userIdFromToken(accessToken) : undefined

  if (!accessToken || !userId) {
    return { error: 'Your ERP session expired. Sign in again.' }
  }

  const uploadedMedia = parseJson<UploadedMedia[]>(formData, 'uploaded_media', [])
  const uploadedPaths = uploadedMedia.map((item) => item.storage_path).filter(Boolean)
  const cleanupKey = serviceRoleKey ?? anonKey
  const cleanupToken = serviceRoleKey ?? accessToken
  const fail = async (message: string) => {
    await deleteUploads(url, cleanupKey, cleanupToken, uploadedPaths)
    return { error: message }
  }

  if (!stringValue(formData, 'name')) {
    return fail('Project name is required.')
  }

  if (uploadedMedia.some((item) => !item.storage_path.startsWith(`${userId}/`))) {
    return fail('One or more uploaded images are invalid. Please select the images again.')
  }

  const payload = {
    project_id: projectId,
    name: stringValue(formData, 'name'),
    slug: stringValue(formData, 'slug'),
    marketing_title: stringValue(formData, 'marketing_title'),
    short_description: stringValue(formData, 'short_description'),
    description: stringValue(formData, 'description'),
    address: stringValue(formData, 'address'),
    city: stringValue(formData, 'city') || 'Addis Ababa',
    subcity: stringValue(formData, 'subcity'),
    latitude: stringValue(formData, 'latitude'),
    longitude: stringValue(formData, 'longitude'),
    google_maps_url: stringValue(formData, 'google_maps_url'),
    amenities: stringValue(formData, 'amenities')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    payment_plan_summary: stringValue(formData, 'payment_plan_summary'),
    offers: stringValue(formData, 'offers'),
    phase: stringValue(formData, 'phase') || 'planning_design',
    floors_completed: stringValue(formData, 'floors_completed'),
    expected_completion_date: stringValue(formData, 'expected_completion_date'),
    unit_types: parseJson(formData, 'unit_type_updates', []),
    media_files: uploadedMedia,
  }

  try {
    const response = await fetch(`${url}/rest/v1/rpc/update_project_from_workspace`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ payload }),
      cache: 'no-store',
    })

    const result = (await response.json()) as { project_id?: string; message?: string }

    if (!response.ok || !result.project_id) {
      return fail(result.message ?? 'Unable to update the project.')
    }

    redirect(`/erp/projects/${projectId}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    await deleteUploads(url, cleanupKey, cleanupToken, uploadedPaths)
    return { error: error instanceof Error ? error.message : 'Unable to update the project.' }
  }
}
