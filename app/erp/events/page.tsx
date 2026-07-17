import { AlertTriangle, CalendarCheck, CalendarClock, CalendarDays, CheckCircle2, CirclePlay, MapPin, RotateCcw, XCircle } from 'lucide-react'
import { eventWorkflowAction } from './actions'
import { EventForm } from '@/components/erp/events/event-form'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getEventsWorkspace } from '@/services/events/supabase-event-service'
import { eventCategories, eventDate, eventLabel, type ScheduledEvent } from '@/services/events/event-types'

const day = 86400000
function action(event: ScheduledEvent, name: string, label: string, icon: typeof CheckCircle2, variant: 'default'|'outline'|'destructive'='outline') {
  const Icon = icon
  return <form action={eventWorkflowAction.bind(null,event.id)}><input type="hidden" name="action" value={name}/><Button size="sm" variant={variant}><Icon className="size-3.5"/>{label}</Button></form>
}

export default async function EventsPage({ searchParams }: { searchParams: Promise<{ status?: string; category?: string }> }) {
  const [data, filters] = await Promise.all([getEventsWorkspace(), searchParams])
  const now = new Date(), todayStart = new Date(now); todayStart.setHours(0,0,0,0)
  const todayEnd = new Date(todayStart.getTime()+day), weekEnd = new Date(now.getTime()+7*day)
  const projectMap = new Map(data.projects.map(project=>[project.id,project]))
  const peopleMap = new Map(data.people.map(person=>[person.id,person]))
  const visible = data.events.filter(event=>(!filters.status||event.status===filters.status)&&(!filters.category||event.category===filters.category))
  const today = data.events.filter(event=>new Date(event.starts_at)>=todayStart&&new Date(event.starts_at)<todayEnd&&event.status!=='cancelled')
  const upcoming = data.events.filter(event=>new Date(event.starts_at)>=now&&new Date(event.starts_at)<=weekEnd&&event.status==='scheduled')
  const overdue = data.events.filter(event=>new Date(event.starts_at)<now&&['scheduled','in_progress'].includes(event.status))
  const completed = data.events.filter(event=>event.status==='completed')
  const metrics=[{label:'Today',value:today.length,detail:'Events scheduled today',icon:CalendarDays},{label:'Next 7 days',value:upcoming.length,detail:'Upcoming commitments',icon:CalendarClock},{label:'Overdue',value:overdue.length,detail:'Needs action or rescheduling',icon:AlertTriangle},{label:'Completed',value:completed.length,detail:'Closed events',icon:CalendarCheck}]
  return <div className="space-y-6">
    <div><p className="text-sm font-medium text-primary">Events Module</p><h2 className="mt-1 font-serif text-3xl font-semibold">Operational calendar</h2><p className="mt-2 text-sm text-muted-foreground">Coordinate meetings, inspections, milestones, deadlines and reminders across every project.</p></div>
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(metric=><Card key={metric.label}><CardHeader className="flex flex-row items-start justify-between"><div><CardDescription>{metric.label}</CardDescription><CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle></div><span className="rounded-lg bg-primary/10 p-2 text-primary"><metric.icon className="size-5"/></span></CardHeader><CardContent className="text-sm text-muted-foreground">{metric.detail}</CardContent></Card>)}</section>
    <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]">
      <Card><CardHeader><CardTitle>Schedule an event</CardTitle><CardDescription>Create a project commitment with ownership and a reminder.</CardDescription></CardHeader><CardContent><EventForm projects={data.projects} people={data.people}/></CardContent></Card>
      <Card><CardHeader><CardTitle>Event timeline</CardTitle><CardDescription>{visible.length} events match the current view.</CardDescription><form className="mt-3 flex flex-wrap gap-2"><select name="status" defaultValue={filters.status??''} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"><option value="">All statuses</option>{['scheduled','in_progress','completed','cancelled'].map(status=><option key={status} value={status}>{eventLabel(status)}</option>)}</select><select name="category" defaultValue={filters.category??''} className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"><option value="">All categories</option>{eventCategories.map(category=><option key={category} value={category}>{eventLabel(category)}</option>)}</select><Button type="submit" size="sm" variant="outline">Filter</Button></form></CardHeader>
      <CardContent className="space-y-3">{visible.map(event=>{const project=projectMap.get(event.project_id), owner=event.owner_id?peopleMap.get(event.owner_id):null;return <article key={event.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{event.title}</p><Badge variant="outline">{eventLabel(event.category)}</Badge><Badge variant={event.priority==='urgent'?'destructive':'secondary'}>{eventLabel(event.priority)}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{event.event_number} Â· {project?.code} Â· {eventDate(event.starts_at,!event.all_day)}</p></div><Badge>{eventLabel(event.status)}</Badge></div>{event.description?<p className="mt-3 text-sm text-muted-foreground">{event.description}</p>:null}<div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">{event.location?<span className="flex items-center gap-1"><MapPin className="size-3"/>{event.location}</span>:null}<span>Owner: {owner?.full_name??'Event creator'}</span>{event.reminder_minutes[0]?<span>Reminder: {event.reminder_minutes[0]>=1440?`${event.reminder_minutes[0]/1440} day(s)`:`${event.reminder_minutes[0]} min`} before</span>:null}</div><div className="mt-4 flex flex-wrap gap-2">{event.status==='scheduled'?action(event,'start','Start',CirclePlay):null}{['scheduled','in_progress'].includes(event.status)?action(event,'complete','Complete',CheckCircle2,'default'):null}{!['completed','cancelled'].includes(event.status)?action(event,'cancel','Cancel',XCircle,'destructive'):null}{['completed','cancelled'].includes(event.status)?action(event,'reopen','Reopen',RotateCcw):null}</div></article>})}{visible.length===0?<div className="py-14 text-center"><CalendarDays className="mx-auto size-9 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No scheduled events match this view.</p></div>:null}</CardContent></Card>
    </div>
  </div>
}


