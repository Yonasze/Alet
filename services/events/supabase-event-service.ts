import { cookies } from 'next/headers'
import { getSupabaseServerConfig } from '@/lib/supabase/server'
import type { EventNotification, EventPerson, EventProject, ScheduledEvent } from './event-types'

const cookieName = 'alet-erp-session'

async function api(path: string) {
  const { url, anonKey } = getSupabaseServerConfig()
  const token = (await cookies()).get(cookieName)?.value
  if (!token) throw new Error('Your ERP session expired. Sign in again.')
  const response = await fetch(`${url}${path}`, { headers: { apikey: anonKey, Authorization: `Bearer ${token}` }, cache: 'no-store' })
  if (!response.ok) {
    const result = await response.json().catch(() => ({})) as { message?: string }
    throw new Error(result.message ?? 'Events could not be loaded.')
  }
  return response.json()
}

export async function getEventsWorkspace(): Promise<{ events: ScheduledEvent[]; projects: EventProject[]; people: EventPerson[] }> {
  const fields = 'id,event_number,project_id,title,description,category,status,priority,starts_at,ends_at,all_day,location,owner_id,attendee_ids,reminder_minutes,completed_at'
  const [events, projects, people] = await Promise.all([
    api(`/rest/v1/business_events?select=${fields}&starts_at=not.is.null&order=starts_at.asc`),
    api('/rest/v1/projects?select=id,name,code&order=name.asc'),
    api('/rest/v1/profiles?select=id,full_name&order=full_name.asc'),
  ])
  return { events: events as ScheduledEvent[], projects: projects as EventProject[], people: people as EventPerson[] }
}

export async function getEventNotifications(): Promise<EventNotification[]> {
  return api('/rest/v1/event_notifications?select=id,event_id,project_id,title,message,delivered_at,read_at&order=delivered_at.desc&limit=100') as Promise<EventNotification[]>
}
