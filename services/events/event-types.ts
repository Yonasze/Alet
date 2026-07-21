export const eventCategories = ['meeting','site_inspection','milestone','deadline','handover','payment','procurement','inventory','compliance','other'] as const
export const eventPriorities = ['low','normal','high','urgent'] as const
export type EventCategory = (typeof eventCategories)[number]
export type EventPriority = (typeof eventPriorities)[number]
export type EventStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'

export type EventProject = { id: string; name: string; code: string }
export type EventPerson = { id: string; full_name: string }
export type ScheduledEvent = {
  id: string
  event_number: string
  project_id: string
  title: string
  description: string | null
  category: EventCategory
  status: EventStatus
  priority: EventPriority
  starts_at: string
  ends_at: string | null
  all_day: boolean
  location: string | null
  owner_id: string | null
  attendee_ids: string[]
  reminder_minutes: number[]
  completed_at: string | null
}

export type EventNotification = {
  id: string
  event_id: string
  project_id: string
  title: string
  message: string
  delivered_at: string
  read_at: string | null
}

export function eventLabel(value: string) {
  return value.replaceAll('_',' ').replace(/\b\w/g, character => character.toUpperCase())
}

export function eventDate(value: string, includeTime = true) {
  return new Intl.DateTimeFormat('en-ET', {
    timeZone: 'Africa/Addis_Ababa', month: 'short', day: 'numeric', year: 'numeric',
    ...(includeTime ? { hour: 'numeric', minute: '2-digit' } : {}),
  }).format(new Date(value))
}

export function eventInputDate(value: string | null) {
  if (!value) return ''
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Addis_Ababa', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value))
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value ?? ''
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`
}
