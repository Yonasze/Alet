'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

const sessionCookieName = 'alet-erp-session'

export type SalesActionState = { error?: string; success?: string }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

async function callSalesRpc(name: string, payload: Record<string, unknown>) {
  const { url, anonKey } = getSupabaseServerConfig()
  const token = (await cookies()).get(sessionCookieName)?.value
  if (!token) throw new Error('Your ERP session expired. Sign in again.')

  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({})) as { message?: string; lead_id?: string }
  if (!response.ok) throw new Error(result.message ?? 'The Sales CRM could not save this change.')
  return result
}

export async function createLeadAction(_state: SalesActionState, formData: FormData): Promise<SalesActionState> {
  try {
    const result = await callSalesRpc('create_crm_lead', {
      project_id: value(formData, 'project_id'),
      unit_type_id: value(formData, 'unit_type_id'),
      full_name: value(formData, 'full_name'),
      phone: value(formData, 'phone'),
      email: value(formData, 'email'),
      preferred_contact_method: value(formData, 'preferred_contact_method'),
      source: value(formData, 'source'),
      budget_min_etb: value(formData, 'budget_min_etb').replaceAll(',', ''),
      budget_max_etb: value(formData, 'budget_max_etb').replaceAll(',', ''),
      message: value(formData, 'message'),
      notes: value(formData, 'notes'),
    })
    redirect(`/erp/sales/leads/${result.lead_id}`)
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    return { error: error instanceof Error ? error.message : 'Unable to create the lead.' }
  }
}

export async function updateLeadAction(
  leadId: string,
  _state: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  try {
    await callSalesRpc('update_crm_lead', {
      lead_id: leadId,
      stage: value(formData, 'stage'),
      notes: value(formData, 'notes'),
      lost_reason: value(formData, 'lost_reason'),
      next_follow_up_at: value(formData, 'next_follow_up_at'),
      activity_type: value(formData, 'activity_type'),
      activity_summary: value(formData, 'activity_summary'),
    })
    revalidatePath('/erp/sales')
    revalidatePath('/erp/sales/leads')
    revalidatePath(`/erp/sales/leads/${leadId}`)
    return { success: 'Lead updated and activity recorded.' }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to update the lead.' }
  }
}

export async function createReservationAction(
  _state: SalesActionState,
  formData: FormData,
): Promise<SalesActionState> {
  try {
    await callSalesRpc('create_sales_reservation', {
      lead_id: value(formData, 'lead_id'),
      unit_id: value(formData, 'unit_id'),
      status: value(formData, 'status'),
      reserved_price_etb: value(formData, 'reserved_price_etb').replaceAll(',', ''),
      expires_at: value(formData, 'expires_at'),
      notes: value(formData, 'notes'),
    })
    revalidatePath('/erp/sales')
    revalidatePath('/erp/sales/reservations')
    redirect('/erp/sales/reservations')
  } catch (error) {
    if (error && typeof error === 'object' && 'digest' in error) throw error
    return { error: error instanceof Error ? error.message : 'Unable to reserve the unit.' }
  }
}

export async function reservationAction(reservationId: string, formData: FormData) {
  await callSalesRpc('sales_reservation_action', {
    reservation_id: reservationId,
    action: value(formData, 'action'),
    reason: value(formData, 'reason'),
    expires_at: value(formData, 'expires_at'),
    payment_plan: [],
  })
  revalidatePath('/erp/sales')
  revalidatePath('/erp/sales/reservations')
  revalidatePath('/erp/sales/contracts')
}
