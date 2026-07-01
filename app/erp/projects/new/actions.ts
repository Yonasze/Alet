'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'
const mediaBucket = 'project-media'
const maxImageBytes = 10 * 1024 * 1024
const allowedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp'])

export type ProjectWizardState = {
  error?: string
}

type UnitConfiguration = {
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

function safeFileName(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9.]+/g, '-').replace(/-+/g, '-').slice(-120)
}

async function deleteUploads(url: string, anonKey: string, accessToken: string, paths: string[]) {
  await Promise.allSettled(paths.map((path) => fetch(`${url}/storage/v1/object/${mediaBucket}/${path}`, {
    method: 'DELETE',
    headers: { apikey: anonKey, Authorization: `Bearer ${accessToken}` },
    cache: 'no-store',
  })))
}

export async function createProjectAction(
  _state: ProjectWizardState,
  formData: FormData,
): Promise<ProjectWizardState> {
  const { url, anonKey } = getSupabaseServerConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value
  const userId = accessToken ? userIdFromToken(accessToken) : undefined

  if (!accessToken || !userId) {
    return { error: 'Your ERP session expired. Sign in again.' }
  }

  const imageFiles = formData
    .getAll('project_images')
    .filter((value): value is File => value instanceof File && value.size > 0)

  if (imageFiles.length < 3 || imageFiles.length > 4) {
    return { error: 'Upload exactly 3 or 4 project images.' }
  }

  if (imageFiles.some((file) => !allowedImageTypes.has(file.type) || file.size > maxImageBytes)) {
    return { error: 'Images must be JPG, PNG or WebP and no larger than 10 MB each.' }
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

  if (
    typicalFloorStart < 0 ||
    typicalFloorEnd < typicalFloorStart ||
    typicalFloorEnd > totalFloors
  ) {
    return { error: 'Choose a valid typical-floor range between Ground Floor and the highest floor.' }
  }

  if (typicalUnits.length === 0 || typicalUnits.some((unit) => !validUnit(unit))) {
    return { error: 'Add at least one valid typical-floor unit. Unit IDs must include {floor}, and gross area must be at least the net area.' }
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
      return { error: 'Each special floor needs a unique valid floor number and at least one valid unit.' }
    }
    specialFloorNumbers.add(Number(floor.floor_number))
  }

  for (let floor = 1; floor <= totalFloors; floor += 1) {
    if ((floor < typicalFloorStart || floor > typicalFloorEnd) && !specialFloorNumbers.has(floor)) {
      return { error: `Floor ${floor} has no layout. Include it in the typical range or add it as a special floor.` }
    }
  }

  const uploadedPaths: string[] = []

  try {
    for (const file of imageFiles) {
      const path = `${userId}/${crypto.randomUUID()}-${safeFileName(file.name)}`
      const uploadResponse = await fetch(`${url}/storage/v1/object/${mediaBucket}/${path}`, {
        method: 'POST',
        headers: {
          apikey: anonKey,
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': file.type,
          'x-upsert': 'false',
        },
        body: file,
        cache: 'no-store',
      })

      if (!uploadResponse.ok) {
        throw new Error(`Unable to upload ${file.name}: ${await uploadResponse.text()}`)
      }
      uploadedPaths.push(path)
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
      media_files: uploadedPaths.map((storagePath, index) => ({
        storage_path: storagePath,
        title: imageFiles[index].name,
        alt_text: `${projectName} project image ${index + 1}`,
      })),
      phase: stringValue(formData, 'phase') || 'planning_design',
      progress_percent: numberValue(formData, 'progress_percent'),
      progress_description: stringValue(formData, 'progress_description'),
      expected_completion_date: stringValue(formData, 'expected_completion_date'),
      publish: formData.get('publish') === 'on',
    }

    if (!payload.name || !payload.code) {
      await deleteUploads(url, anonKey, accessToken, uploadedPaths)
      return { error: 'Project name and code are required.' }
    }

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
      await deleteUploads(url, anonKey, accessToken, uploadedPaths)
      return { error: result.message ?? 'Unable to create the project.' }
    }

    redirect(`/erp/projects/${result.project_id}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    await deleteUploads(url, anonKey, accessToken, uploadedPaths)
    return { error: error instanceof Error ? error.message : 'Unable to create the project.' }
  }
}
