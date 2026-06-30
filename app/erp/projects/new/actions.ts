'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'

export type ProjectWizardState = {
  error?: string
}

type UnitConfiguration = {
  unit_id_pattern: string
  type: string
  bathrooms: number
  balconies: number
  net_area_sqm: number
  gross_area_sqm: number
  price: number
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

function validUnit(unit: UnitConfiguration) {
  return Boolean(
    unit.unit_id_pattern?.includes('{floor}') &&
    unit.type &&
    Number(unit.net_area_sqm) > 0 &&
    Number(unit.gross_area_sqm) >= Number(unit.net_area_sqm) &&
    Number(unit.price) >= 0,
  )
}

export async function createProjectAction(
  _state: ProjectWizardState,
  formData: FormData,
): Promise<ProjectWizardState> {
  const { url, anonKey } = getSupabaseServerConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value

  if (!accessToken) {
    return { error: 'Your ERP session expired. Sign in again.' }
  }

  const totalFloors = Math.max(0, numberValue(formData, 'total_floors', 0))
  const typicalFloorStart = numberValue(formData, 'typical_floor_start', 0)
  const typicalFloorEnd = numberValue(formData, 'typical_floor_end', totalFloors)
  const typicalUnits = parseJson<UnitConfiguration[]>(formData, 'typical_units', [])
  const specialFloorConfigurations = parseJson<SpecialFloorConfiguration[]>(
    formData,
    'special_floor_configurations',
    [],
  )

  if (
    typicalFloorStart < 0 ||
    typicalFloorEnd < typicalFloorStart ||
    typicalFloorEnd > totalFloors
  ) {
    return { error: 'Choose a valid typical-floor range within the numbered building floors.' }
  }

  if (typicalUnits.length === 0 || typicalUnits.some((unit) => !validUnit(unit))) {
    return { error: 'Add at least one valid typical-floor unit. Unit IDs must include {floor}, and gross area must be at least the net area.' }
  }

  const specialFloorNumbers = new Set<number>()
  for (const floor of specialFloorConfigurations) {
    if (
      !Number.isInteger(Number(floor.floor_number)) ||
      Number(floor.floor_number) < 1 ||
      Number(floor.floor_number) > totalFloors ||
      specialFloorNumbers.has(Number(floor.floor_number)) ||
      floor.units.length === 0 ||
      floor.units.some((unit) => !validUnit(unit))
    ) {
      return { error: 'Each special floor needs a unique valid floor number and at least one valid unit.' }
    }
    specialFloorNumbers.add(Number(floor.floor_number))
  }

  for (let floor = 0; floor <= totalFloors; floor += 1) {
    if ((floor < typicalFloorStart || floor > typicalFloorEnd) && !specialFloorNumbers.has(floor)) {
      return { error: `Floor ${floor} has no layout. Include it in the typical range or select it as a special floor.` }
    }
  }

  const payload = {
    name: stringValue(formData, 'name'),
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
    media_url: stringValue(formData, 'media_url'),
    media_title: stringValue(formData, 'media_title'),
    media_alt_text: stringValue(formData, 'media_alt_text'),
    phase: stringValue(formData, 'phase') || 'planning_design',
    progress_percent: numberValue(formData, 'progress_percent'),
    progress_description: stringValue(formData, 'progress_description'),
    expected_completion_date: stringValue(formData, 'expected_completion_date'),
    publish: formData.get('publish') === 'on',
  }

  if (!payload.name || !payload.code) {
    return { error: 'Project name and code are required.' }
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
      return { error: result.message ?? 'Unable to create the project.' }
    }

    redirect(`/erp/projects/${result.project_id}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    return { error: error instanceof Error ? error.message : 'Unable to create the project.' }
  }
}
