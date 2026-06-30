'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'

export type ProjectWizardState = {
  error?: string
}

function stringValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const parsed = Number(stringValue(formData, key))
  return Number.isFinite(parsed) ? parsed : fallback
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

  const totalFloors = Math.max(1, numberValue(formData, 'total_floors', 1))
  const specialFloors = stringValue(formData, 'special_floors')
    .split(',')
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 1 && value <= totalFloors)

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
    floors_completed: numberValue(formData, 'floors_completed'),
    special_floors: specialFloors,
    units_per_floor: Math.max(1, numberValue(formData, 'units_per_floor', 1)),
    special_units_per_floor: Math.max(1, numberValue(formData, 'special_units_per_floor', 1)),
    unit_type_code: stringValue(formData, 'unit_type_code'),
    unit_type_name: stringValue(formData, 'unit_type_name'),
    unit_category: stringValue(formData, 'unit_category') || 'residential',
    unit_type_description: stringValue(formData, 'unit_type_description'),
    unit_size_sqm: numberValue(formData, 'unit_size_sqm'),
    special_unit_size_sqm: numberValue(formData, 'special_unit_size_sqm'),
    bedrooms: stringValue(formData, 'bedrooms'),
    bathrooms: stringValue(formData, 'bathrooms'),
    balconies: numberValue(formData, 'balconies'),
    starting_price: numberValue(formData, 'starting_price'),
    vat_rate: numberValue(formData, 'vat_rate', 15),
    parking_price: numberValue(formData, 'parking_price'),
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

  if (!payload.name || !payload.code || !payload.unit_type_code || !payload.unit_type_name) {
    return { error: 'Project identity and the initial unit type are required.' }
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
