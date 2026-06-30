import { cookies } from 'next/headers'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'

type RequestOptions = {
  authenticated?: boolean
  revalidate?: number
}

async function supabaseRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { url, anonKey } = getSupabaseServerConfig()
  const cookieStore = await cookies()
  const accessToken = options.authenticated ? cookieStore.get(sessionCookieName)?.value : undefined

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken ?? anonKey}`,
      Accept: 'application/json',
    },
    ...(options.revalidate === undefined
      ? { cache: 'no-store' as const }
      : { next: { revalidate: options.revalidate } }),
  })

  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Supabase request failed (${response.status}): ${detail}`)
  }

  return response.json() as Promise<T>
}

export type PublicProject = {
  id: string
  slug: string
  name: string
  short_description: string | null
  description: string | null
  address: string | null
  city: string
  subcity: string | null
  latitude: number | null
  longitude: number | null
  google_maps_url: string | null
  amenities: string[]
  payment_plan_summary: string | null
  offers: string | null
  expected_completion_date: string | null
  phase: string
  floors_completed: number
  total_floors: number
  progress_label: string
  starting_price_etb: number | null
  hero_image_url: string | null
  published_at: string | null
}

export type PublicUnitType = {
  project_slug: string
  code: string
  name: string
  category: 'residential' | 'commercial'
  bedrooms: number | null
  bathrooms: number | null
  minimum_net_area_sqm: number
  maximum_net_area_sqm: number
  minimum_gross_area_sqm: number
  maximum_gross_area_sqm: number
  minimum_size_sqm: number
  maximum_size_sqm: number
  starting_price_etb: number | null
}

export type PublicMedia = {
  project_slug: string
  media_type: string
  title: string | null
  alt_text: string | null
  public_url: string
  is_hero: boolean
  sort_order: number
}

export type PublicMilestone = {
  project_slug: string
  phase: string
  title: string
  description: string | null
  progress_percent: number
  target_date: string | null
  completed_at: string | null
}

export async function getPublicProjects(): Promise<PublicProject[]> {
  return supabaseRequest<PublicProject[]>('public_projects?select=*&order=published_at.desc', { revalidate: 60 })
}

export async function getPublicProject(slug: string) {
  const safeSlug = encodeURIComponent(slug)
  const [projects, unitTypes, media, milestones] = await Promise.all([
    supabaseRequest<PublicProject[]>(`public_projects?select=*&slug=eq.${safeSlug}&limit=1`, { revalidate: 60 }),
    supabaseRequest<PublicUnitType[]>(`public_project_unit_types?select=*&project_slug=eq.${safeSlug}&order=starting_price_etb.asc.nullslast`, { revalidate: 60 }),
    supabaseRequest<PublicMedia[]>(`public_project_media?select=*&project_slug=eq.${safeSlug}&order=is_hero.desc,sort_order.asc`, { revalidate: 60 }),
    supabaseRequest<PublicMilestone[]>(`public_project_milestones?select=*&project_slug=eq.${safeSlug}`, { revalidate: 60 }),
  ])

  return projects[0] ? { project: projects[0], unitTypes, media, milestones } : null
}

export type ErpProjectListItem = {
  id: string
  name: string
  code: string
  slug: string | null
  status: string
  phase: string
  city: string
  subcity: string | null
  total_floors: number
  floors_completed: number
  updated_at: string
  project_publications: { status: string } | Array<{ status: string }> | null
}

export async function getErpProjects(): Promise<ErpProjectListItem[]> {
  return supabaseRequest<ErpProjectListItem[]>(
    'projects?select=id,name,code,slug,status,phase,city,subcity,total_floors,floors_completed,updated_at,project_publications(status)&order=updated_at.desc',
    { authenticated: true },
  )
}

export type ErpProjectWorkspace = {
  project: Record<string, unknown>
  floors: Array<Record<string, unknown>>
  units: Array<Record<string, unknown>>
  unitTypes: Array<Record<string, unknown>>
  prices: Array<Record<string, unknown>>
  media: Array<Record<string, unknown>>
  milestones: Array<Record<string, unknown>>
  publication: Record<string, unknown> | null
  audit: Array<Record<string, unknown>>
  team: Array<Record<string, unknown>>
}

export async function getErpProjectWorkspace(projectId: string): Promise<ErpProjectWorkspace | null> {
  const id = encodeURIComponent(projectId)
  const auth = { authenticated: true } as const
  const [projects, floors, units, unitTypes, prices, media, milestones, publications, audit, team] = await Promise.all([
    supabaseRequest<Array<Record<string, unknown>>>(`projects?select=*&id=eq.${id}&limit=1`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`project_floors?select=*&project_id=eq.${id}&order=sequence.asc,floor_number.asc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`units?select=id,unit_number,status,category,size_sqm,net_area_sqm,gross_area_sqm,unit_description,bedrooms,bathrooms,balconies,orientation,base_price,vat_rate,project_floor_id,unit_type_id&project_id=eq.${id}&order=unit_number.asc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`unit_types?select=*&project_id=eq.${id}&order=name.asc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`project_prices?select=*&project_id=eq.${id}&order=effective_from.desc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`project_media?select=*&project_id=eq.${id}&order=is_hero.desc,sort_order.asc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`project_milestones?select=*&project_id=eq.${id}&order=created_at.desc`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`project_publications?select=*&project_id=eq.${id}&limit=1`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`audit_logs?select=*&project_id=eq.${id}&order=changed_at.desc&limit=100`, auth),
    supabaseRequest<Array<Record<string, unknown>>>(`user_roles?select=id,user_id,project_id,created_at,roles(code,name)&project_id=eq.${id}`, auth),
  ])

  if (!projects[0]) return null

  return {
    project: projects[0],
    floors,
    units,
    unitTypes,
    prices,
    media,
    milestones,
    publication: publications[0] ?? null,
    audit,
    team,
  }
}

export function formatEtb(value: number | string | null | undefined): string {
  const amount = Number(value)
  if (!Number.isFinite(amount)) return 'Price on request'

  return new Intl.NumberFormat('en-ET', {
    style: 'currency',
    currency: 'ETB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatPhase(value: unknown): string {
  return String(value ?? 'planning_design')
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}
