'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { CalendarPlus, LoaderCircle } from 'lucide-react'
import { createEventAction, type EventActionState } from '@/app/erp/events/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { eventCategories, eventLabel, eventPriorities, type EventPerson, type EventProject } from '@/services/events/event-types'

function SubmitButton() {
  const { pending } = useFormStatus()
  return <Button type="submit" disabled={pending}>{pending ? <LoaderCircle className="size-4 animate-spin"/> : <CalendarPlus className="size-4"/>}{pending ? 'Schedulingâ€¦' : 'Schedule event'}</Button>
}

export function EventForm({ projects, people }: { projects: EventProject[]; people: EventPerson[] }) {
  const [state, action] = useActionState<EventActionState, FormData>(createEventAction, {})
  return <form action={action} className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-2 md:col-span-2"><Label htmlFor="event-title">Title</Label><Input id="event-title" name="title" placeholder="Weekly site coordination" required/></div>
      <div className="space-y-2"><Label htmlFor="event-project">Project</Label><select id="event-project" name="project_id" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm" required><option value="">Choose project</option>{projects.map(project=><option key={project.id} value={project.id}>{project.code} â€” {project.name}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="event-owner">Owner</Label><select id="event-owner" name="owner_id" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"><option value="">Assign to me</option>{people.map(person=><option key={person.id} value={person.id}>{person.full_name}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="event-category">Category</Label><select id="event-category" name="category" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">{eventCategories.map(category=><option key={category} value={category}>{eventLabel(category)}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="event-priority">Priority</Label><select id="event-priority" name="priority" defaultValue="normal" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">{eventPriorities.map(priority=><option key={priority} value={priority}>{eventLabel(priority)}</option>)}</select></div>
      <div className="space-y-2"><Label htmlFor="event-start">Starts</Label><Input id="event-start" name="starts_at" type="datetime-local" required/></div>
      <div className="space-y-2"><Label htmlFor="event-end">Ends</Label><Input id="event-end" name="ends_at" type="datetime-local"/></div>
      <div className="space-y-2"><Label htmlFor="event-location">Location</Label><Input id="event-location" name="location" placeholder="Site office or online link"/></div>
      <div className="space-y-2"><Label htmlFor="event-reminder">Reminder</Label><select id="event-reminder" name="reminder_minutes" defaultValue="60" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"><option value="15">15 minutes before</option><option value="60">1 hour before</option><option value="1440">1 day before</option><option value="10080">1 week before</option></select></div>
      <div className="space-y-2 md:col-span-2"><Label htmlFor="event-description">Notes</Label><Textarea id="event-description" name="description" rows={3} placeholder="Agenda, preparation, or follow-up details"/></div>
      <label className="flex items-center gap-2 text-sm md:col-span-2"><input name="all_day" type="checkbox" className="size-4"/>All-day event</label>
    </div>
    {state.error ? <p className="text-sm text-destructive" role="alert">{state.error}</p> : null}
    {state.success ? <p className="text-sm text-primary" role="status">{state.success}</p> : null}
    <SubmitButton/>
  </form>
}


