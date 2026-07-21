import Link from 'next/link'
import { ChevronLeft, ChevronRight, Clock3, MapPin } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { eventLabel, type ScheduledEvent } from '@/services/events/event-types'

type CalendarView = 'month' | 'week'
const zone = 'Africa/Addis_Ababa'
const dayMs = 86400000

function dateKey(value: Date | string) {
  return new Intl.DateTimeFormat('en-CA',{timeZone:zone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value))
}
function dateFromKey(value: string) { return new Date(`${value}T12:00:00+03:00`) }
function addDays(value: Date, count: number) { return new Date(value.getTime()+count*dayMs) }
function href(view: CalendarView, date: Date) { return `/erp/events?view=${view}&date=${dateKey(date)}` }

export function EventCalendar({ events, view, selectedDate }: { events: ScheduledEvent[]; view: CalendarView; selectedDate?: string }) {
  const anchor = selectedDate && /^\d{4}-\d{2}-\d{2}$/.test(selectedDate) ? dateFromKey(selectedDate) : new Date()
  const isMonth = view==='month'
  const monthStart = new Date(anchor.getFullYear(),anchor.getMonth(),1,12)
  const mondayOffset = (monthStart.getDay()+6)%7
  const weekAnchor = addDays(anchor,-((anchor.getDay()+6)%7))
  const start = isMonth ? addDays(monthStart,-mondayOffset) : weekAnchor
  const cells = Array.from({length:isMonth?42:7},(_,index)=>addDays(start,index))
  const previous = isMonth ? new Date(anchor.getFullYear(),anchor.getMonth()-1,1,12) : addDays(anchor,-7)
  const next = isMonth ? new Date(anchor.getFullYear(),anchor.getMonth()+1,1,12) : addDays(anchor,7)
  const title = isMonth
    ? new Intl.DateTimeFormat('en-ET',{month:'long',year:'numeric',timeZone:zone}).format(anchor)
    : `${new Intl.DateTimeFormat('en-ET',{month:'short',day:'numeric',timeZone:zone}).format(start)} â€“ ${new Intl.DateTimeFormat('en-ET',{month:'short',day:'numeric',year:'numeric',timeZone:zone}).format(addDays(start,6))}`
  const byDay = new Map<string,ScheduledEvent[]>()
  for(const event of events){const key=dateKey(event.starts_at);byDay.set(key,[...(byDay.get(key)??[]),event])}

  return <Card className="overflow-hidden border-primary/10 shadow-sm">
    <CardHeader className="border-b bg-card/80">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-xs font-semibold uppercase tracking-[.2em] text-gold">{eventLabel(view)} view</p><CardTitle className="mt-1 text-2xl">{title}</CardTitle></div>
        <div className="flex items-center gap-2"><Button asChild size="sm" variant="outline" aria-label="Previous period"><Link href={href(view,previous)}><ChevronLeft className="size-4"/></Link></Button><Button asChild size="sm" variant="outline"><Link href={`/erp/events?view=${view}`}>Today</Link></Button><Button asChild size="sm" variant="outline" aria-label="Next period"><Link href={href(view,next)}><ChevronRight className="size-4"/></Link></Button></div>
      </div>
    </CardHeader>
    <CardContent className="p-0">
      <div className="grid grid-cols-7 border-b bg-muted/35 text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">{['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=><div key={day} className="px-2 py-3">{day}</div>)}</div>
      <div className="grid grid-cols-7">
        {cells.map(date=>{const key=dateKey(date),items=byDay.get(key)??[],outside=isMonth&&date.getMonth()!==anchor.getMonth();return <div key={key} className={`min-h-32 border-b border-r p-2 ${outside?'bg-muted/20 text-muted-foreground':'bg-card'} ${dateKey(new Date())===key?'ring-1 ring-inset ring-gold':''}`}><p className="mb-2 text-sm font-semibold">{date.getDate()}</p><div className="space-y-1.5">{items.slice(0,isMonth?3:6).map(event=><div key={event.id} className="rounded-lg border-l-2 border-gold bg-primary/5 p-2 text-left"><p className="truncate text-xs font-semibold text-primary">{event.title}</p>{!isMonth?<><p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><Clock3 className="size-3"/>{new Intl.DateTimeFormat('en-ET',{timeZone:zone,hour:'numeric',minute:'2-digit'}).format(new Date(event.starts_at))}</p>{event.location?<p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground"><MapPin className="size-3"/>{event.location}</p>:null}</>:null}</div>)}{items.length>(isMonth?3:6)?<Badge variant="secondary">+{items.length-(isMonth?3:6)} more</Badge>:null}</div></div>})}
      </div>
    </CardContent>
  </Card>
}
