import { cookies } from 'next/headers'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'

async function salesRequest<T>(path: string): Promise<T> {
  const { url, anonKey } = getSupabaseServerConfig()
  const token = (await cookies()).get(sessionCookieName)?.value
  if (!token) throw new Error('Your ERP session expired. Sign in again.')

  const response = await fetch(`${url}/rest/v1/${path}`, {
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, Accept: 'application/json' },
    cache: 'no-store',
  })
  if (!response.ok) throw new Error(`Unable to load Sales CRM data (${response.status}).`)
  return response.json() as Promise<T>
}

export type SalesLead = {
  id: string
  project_id: string
  unit_type_id: string | null
  customer_id: string | null
  full_name: string
  phone: string | null
  email: string | null
  preferred_contact_method: string
  source: string
  status: string
  stage: string
  budget_min_etb: number | null
  budget_max_etb: number | null
  message: string | null
  notes: string | null
  lost_reason: string | null
  next_follow_up_at: string | null
  last_contacted_at: string | null
  created_at: string
  updated_at: string
}

export type SalesReservation = {
  id: string
  project_id: string
  lead_id: string | null
  customer_id: string
  unit_id: string
  reservation_number: string
  status: string
  reserved_price_etb: number
  hold_expires_at: string | null
  reservation_expires_at: string | null
  notes: string | null
  created_at: string
}

export type SalesContract = {
  id: string
  project_id: string
  reservation_id: string
  customer_id: string
  unit_id: string
  contract_number: string
  status: string
  total_price_etb: number
  signed_at: string | null
  sold_at: string | null
  handed_over_at: string | null
  created_at: string
}

export type SalesProject = { id: string; name: string; code: string }
export type SalesUnitType = { id: string; project_id: string; code: string; name: string; bedrooms: number | null }
export type SalesUnit = {
  id: string
  project_id: string
  unit_type_id: string | null
  unit_number: string
  status: string
  gross_area_sqm: number | null
  net_area_sqm: number | null
  base_price: number | null
}
export type SalesCustomer = { id: string; full_name: string; phone: string | null; email: string | null }
export type SalesActivity = {
  id: string
  lead_id: string | null
  activity_type: string
  summary: string
  due_at: string | null
  completed_at: string | null
  created_at: string
}

export async function getSalesWorkspace() {
  const [leads, reservations, contracts, projects, unitTypes, units, customers] = await Promise.all([
    salesRequest<SalesLead[]>('sales_leads?select=*&order=created_at.desc'),
    salesRequest<SalesReservation[]>('sales_reservations?select=*&order=created_at.desc'),
    salesRequest<SalesContract[]>('sales_contracts?select=*&order=created_at.desc'),
    salesRequest<SalesProject[]>('projects?select=id,name,code&order=name.asc'),
    salesRequest<SalesUnitType[]>('unit_types?select=id,project_id,code,name,bedrooms&order=name.asc'),
    salesRequest<SalesUnit[]>('units?select=id,project_id,unit_type_id,unit_number,status,gross_area_sqm,net_area_sqm,base_price&order=unit_number.asc'),
    salesRequest<SalesCustomer[]>('sales_customers?select=id,full_name,phone,email&order=full_name.asc'),
  ])
  return { leads, reservations, contracts, projects, unitTypes, units, customers }
}

export async function getSalesLead(leadId: string) {
  const id = encodeURIComponent(leadId)
  const [leads, activities, projects, unitTypes] = await Promise.all([
    salesRequest<SalesLead[]>(`sales_leads?select=*&id=eq.${id}&limit=1`),
    salesRequest<SalesActivity[]>(`sales_activities?select=*&lead_id=eq.${id}&order=created_at.desc`),
    salesRequest<SalesProject[]>('projects?select=id,name,code&order=name.asc'),
    salesRequest<SalesUnitType[]>('unit_types?select=id,project_id,code,name,bedrooms&order=name.asc'),
  ])
  return leads[0] ? { lead: leads[0], activities, projects, unitTypes } : null
}

export function salesStageLabel(value: string) {
  return value.split('_').map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
}

export function formatSalesDate(value: string | null) {
  if (!value) return 'Not set'
  return new Date(value).toLocaleString('en-ET', { dateStyle: 'medium', timeStyle: 'short' })
}
