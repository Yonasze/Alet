'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'
const mediaBucket = 'project-media'

export type ProjectWizardState = {
  error?: string
}

type UnitConfiguration = {
  client_id: string
  unit_id_pattern: string
  type: string
  bathrooms: string | number
  balconies: string | number
  net_area_sqm: string | number
  gross_area_sqm: string | number
  price: string | number
  description: string
}

type SpecialFloorConfiguration = {
  floor_number: number
  units: UnitConfiguration[]
}

type UploadedMedia = {
  storage_path: string
  title: string
  alt_text: string
  purpose: 'building' | 'location' | 'unit'
  unit_client_id?: string
  unit_type_code?: string
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(stringValue(formData, key))
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseJson<T>(formData: FormData, key: string, fallback: T): T {
  try {
    return JSON.parse(stringValue(formData, key)) as T
  } catch {
    return fallback
  }
}

function decimalValue(value: string | number) {
  const parsed = Number(String(value).replaceAll(',', '').trim())
  return Number.isFinite(parsed) ? parsed : Number.NaN
}

function normalizeUnit(unit: UnitConfiguration) {
  return {
    ...unit,
    bathrooms: decimalValue(unit.bathrooms),
    balconies: decimalValue(unit.balconies),
    net_area_sqm: decimalValue(unit.net_area_sqm),
    gross_area_sqm: decimalValue(unit.gross_area_sqm),
    price: decimalValue(unit.price),
  }
}

function validUnit(unit: ReturnType<typeof normalizeUnit>) {
  return Boolean(
    unit.client_id &&
    unit.unit_id_pattern?.includes('{floor}') &&
    unit.type &&
    unit.net_area_sqm > 0 &&
    unit.gross_area_sqm >= unit.net_area_sqm &&
    unit.price >= 0,
  )
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

export async function createProjectAction(
  _state: ProjectWizardState,
  formData: FormData,
): Promise<ProjectWizardState> {
  const { url, anonKey, serviceRoleKey } = getSupabaseServerConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value
  const userId = accessToken ? userIdFromToken(accessToken) : undefined

  if (!accessToken || !userId) {
    return { error: 'Your ERP session expired. Sign in again.' }
  }

  const cleanupKey = serviceRoleKey ?? anonKey
  const cleanupToken = serviceRoleKey ?? accessToken
  const uploadedMedia = parseJson<UploadedMedia[]>(formData, 'uploaded_media', [])
  const uploadedPaths = uploadedMedia.map((item) => item.storage_path).filter(Boolean)
  const fail = async (message: string) => {
    await deleteUploads(url, cleanupKey, cleanupToken, uploadedPaths)
    return { error: message }
  }

  const totalFloors = Math.max(0, numberValue(formData, 'total_floors', 0))
  const typicalFloorStart = numberValue(formData, 'typical_floor_start', 0)
  const typicalFloorEnd = numberValue(formData, 'typical_floor_end', totalFloors)
  const typicalUnits = parseJson<UnitConfiguration[]>(formData, 'typical_units', []).map(normalizeUnit)
  const specialFloorConfigurations = parseJson<SpecialFloorConfiguration[]>(
    formData,
    'special_floor_configurations',
    [],
  ).map((floor) => ({ ...floor, units: floor.units.map(normalizeUnit) }))
  const allUnits = [
    ...typicalUnits,
    ...specialFloorConfigurations.flatMap((floor) => floor.units),
  ]

  if (uploadedMedia.some((item) => !item.storage_path.startsWith(`${userId}/`))) {
    return fail('One or more uploaded images are invalid. Please select the images again.')
  }
  if (uploadedMedia.filter((item) => item.purpose === 'building').length < 3) {
    return fail('Upload at least three building images.')
  }
  if (uploadedMedia.filter((item) => item.purpose === 'location').length < 1) {
    return fail('Upload a location image.')
  }
  if (allUnits.some((unit) => !uploadedMedia.some(
    (item) => item.purpose === 'unit' && item.unit_client_id === unit.client_id,
  ))) {
    return fail('Upload one configuration image for every typical and special-floor unit.')
  }

  if (
    typicalFloorStart < 0 ||
    typicalFloorEnd < typicalFloorStart ||
    typicalFloorEnd > totalFloors
  ) {
    return fail('Choose a valid typical-floor range between Ground Floor and the highest floor.')
  }

  if (typicalUnits.length === 0 || typicalUnits.some((unit) => !validUnit(unit))) {
    return fail('Add at least one valid typical-floor unit. Unit IDs must include {floor}, and gross area must be at least the net area.')
  }

  const specialFloorNumbers = new Set<number>()
  for (const floor of specialFloorConfigurations) {
    if (
      !Number.isInteger(Number(floor.floor_number)) ||
      Number(floor.floor_number) < 0 ||
      Number(floor.floor_number) > totalFloors ||
      specialFloorNumbers.has(Number(floor.floor_number)) ||
      floor.units.length === 0 ||
      floor.units.some((unit) => !validUnit(unit))
    ) {
      return fail('Each special floor needs a unique valid floor number and at least one valid unit.')
    }
    specialFloorNumbers.add(Number(floor.floor_number))
  }

  for (let floor = 1; floor <= totalFloors; floor += 1) {
    if ((floor < typicalFloorStart || floor > typicalFloorEnd) && !specialFloorNumbers.has(floor)) {
      return fail(`Floor ${floor} has no layout. Include it in the typical range or add it as a special floor.`)
    }
  }

  const projectName = stringValue(formData, 'name')
  const payload = {
    name: projectName,
    code: stringValue(formData, 'code'),
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
    total_floors: totalFloors,
    typical_floor_start: typicalFloorStart,
    typical_floor_end: typicalFloorEnd,
    floors_completed: numberValue(formData, 'floors_completed'),
    typical_units: typicalUnits,
    special_floor_configurations: specialFloorConfigurations,
    amenities: stringValue(formData, 'amenities')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean),
    payment_plan_summary: stringValue(formData, 'payment_plan_summary'),
    offers: stringValue(formData, 'offers'),
    media_files: uploadedMedia,
    phase: stringValue(formData, 'phase') || 'planning_design',
    progress_percent: numberValue(formData, 'progress_percent'),
    progress_description: stringValue(formData, 'progress_description'),
    expected_completion_date: stringValue(formData, 'expected_completion_date'),
    publish: formData.get('publish') === 'on',
  }

  if (!payload.name || !payload.code) {
    return fail('Project name and code are required.')
  }

  try {
    const response = await fetch(`${url}/rest/v1/rpc/create_project_from_wizard`, {
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
      return fail(result.message ?? 'Unable to create the project.')
    }

    redirect(`/erp/projects/${result.project_id}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    await deleteUploads(url, cleanupKey, cleanupToken, uploadedPaths)
    return { error: error instanceof Error ? error.message : 'Unable to create the project.' }
  }
}
