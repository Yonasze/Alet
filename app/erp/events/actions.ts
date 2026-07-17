'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerConfig } from '@/lib/supabase/server'
import { eventCategories, eventPriorities } from '@/services/events/event-types'

const cookieName = 'alet-erp-session'
export type EventActionState = { error?: string; success?: string }
const value = (form: FormData, key: string) => String(form.get(key) ?? '').trim()
const ethiopiaTimestamp = (input: string) => input ? `${input}:00+03:00` : ''

async function rpc(name: string, payload: Record<string, unknown>) {
  const { url, anonKey } = getSupabaseServerConfig()
  const token = (await cookies()).get(cookieName)?.value
  if (!token) throw new Error('Your ERP session expired. Sign in again.')
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: 'POST', headers: { apikey: anonKey, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload }), cache: 'no-store',
  })
  const result = await response.json().catch(() => ({})) as { message?: string }
  if (!response.ok) throw new Error(result.message ?? 'The event could not be saved.')
}

export async function createEventAction(_state: EventActionState, form: FormData): Promise<EventActionState> {
  try {
    const category = value(form,'category')
    const priority = value(form,'priority')
    if (!eventCategories.includes(category as never)) throw new Error('Choose a valid event category.')
    if (!eventPriorities.includes(priority as never)) throw new Error('Choose a valid priority.')
    await rpc('create_scheduled_event', {
      project_id: value(form,'project_id'), title: value(form,'title'), description: value(form,'description'),
      category, priority, starts_at: ethiopiaTimestamp(value(form,'starts_at')), ends_at: ethiopiaTimestamp(value(form,'ends_at')),
      all_day: form.get('all_day') === 'on', location: value(form,'location'), owner_id: value(form,'owner_id'),
      reminder_minutes: value(form,'reminder_minutes') || '60', attendee_ids: form.getAll('attendee_ids').map(String),
    })
    revalidatePath('/erp/events')
    return { success: 'Event scheduled.' }
  } catch (error) { return { error: error instanceof Error ? error.message : 'Unable to schedule event.' } }
}

export async function eventWorkflowAction(eventId: string, form: FormData) {
  await rpc('scheduled_event_action', { event_id: eventId, action: value(form,'action') })
  revalidatePath('/erp/events')
}

