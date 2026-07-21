'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { LoaderCircle, Save } from 'lucide-react'
import { updateEventAction, type EventActionState } from '@/app/erp/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { eventCategories, eventInputDate, eventLabel, eventPriorities, type EventPerson, type EventProject, type ScheduledEvent } from '@/services/events/event-types'

function SaveButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" size="sm" disabled={pending}>{pending?<LoaderCircle className="size-4 animate-spin"/>:<Save className="size-4"/>}{pending?'Savingâ€¦':'Save changes'}</Button>
}

export function EventEditForm({ event, projects, people }: { event: ScheduledEvent; projects: EventProject[]; people: EventPerson[] }) {
  const [state, action] = useActionState<EventActionState, FormData>(updateEventAction, {})
  return <form action={action} className="mt-4 space-y-4 rounded-xl border border-gold/25 bg-muted/25 p-4">
    <input type="hidden" name="event_id" value={event.id}/>
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor={`title-${event.id}`}>Title</Label><Input id={`title-${event.id}`} name="title" defaultValue={event.title} required/></div>
      <div className="space-y-1.5"><Label htmlFor={`project-${event.id}`}>Project</Label><select id={`project-${event.id}`} name="project_id" defaultValue={event.project_id} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">{projects.map(project=><option key={project.id} value={project.id}>{project.code} â€” {project.name}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor={`owner-${event.id}`}>Owner</Label><select id={`owner-${event.id}`} name="owner_id" defaultValue={event.owner_id??''} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="">Assign to me</option>{people.map(person=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor={`category-${event.id}`}>Category</Label><select id={`category-${event.id}`} name="category" defaultValue={event.category} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">{eventCategories.map(category=><option key={category} value={category}>{eventLabel(category)}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor={`priority-${event.id}`}>Priority</Label><select id={`priority-${event.id}`} name="priority" defaultValue={event.priority} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm">{eventPriorities.map(priority=><option key={priority} value={priority}>{eventLabel(priority)}</option>)}</select></div>
      <div className="space-y-1.5"><Label htmlFor={`start-${event.id}`}>Starts</Label><Input id={`start-${event.id}`} name="starts_at" type="datetime-local" defaultValue={eventInputDate(event.starts_at)} required/></div>
      <div className="space-y-1.5"><Label htmlFor={`end-${event.id}`}>Ends</Label><Input id={`end-${event.id}`} name="ends_at" type="datetime-local" defaultValue={eventInputDate(event.ends_at)}/></div>
      <div className="space-y-1.5"><Label htmlFor={`location-${event.id}`}>Location</Label><Input id={`location-${event.id}`} name="location" defaultValue={event.location??''}/></div>
      <div className="space-y-1.5"><Label htmlFor={`reminder-${event.id}`}>Reminder</Label><select id={`reminder-${event.id}`} name="reminder_minutes" defaultValue={String(event.reminder_minutes[0]??60)} className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm"><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option><option value="10080">1 week before</option></select></div>
      <div className="space-y-1.5 md:col-span-2"><Label htmlFor={`notes-${event.id}`}>Notes</Label><Textarea id={`notes-${event.id}`} name="description" defaultValue={event.description??''} rows={2}/></div>
      <fieldset className="space-y-2 md:col-span-2"><legend className="text-sm font-medium">Attendees</legend><div className="grid max-h-36 gap-2 overflow-y-auto rounded-lg border bg-background p-3 sm:grid-cols-2">{people.map(person=><label key={person.id} className="flex items-center gap-2 text-sm"><input name="attendee_ids" value={person.id} type="checkbox" defaultChecked={event.attendee_ids.includes(person.id)} className="size-4 accent-primary"/>{person.full_name}</label>)}</div></fieldset>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="all_day" type="checkbox" defaultChecked={event.all_day} className="size-4 accent-primary"/>All-day event</label>
    </div>
    {state.error?<p role="alert" className="text-sm text-destructive">{state.error}</p>:null}
    {state.success?<p role="status" className="text-sm text-primary">{state.success}</p>:null}
    <SaveButton/>
  </form>
}
