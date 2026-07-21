import { BellRing, CheckCheck, Clock3 } from 'lucide-react'
import { markNotificationsReadAction } from './actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getEventNotifications } from '@/services/events/supabase-event-service'
import { eventDate } from '@/services/events/event-types'

export default async function NotificationsPage(){
  const notifications=await getEventNotifications()
  const unread=notifications.filter(item=>!item.read_at)
  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[.18em] text-gold">Notification center</p><h2 className="mt-1 font-serif text-3xl font-semibold">Event reminders</h2><p className="mt-2 text-sm text-muted-foreground">Automatic in-app reminders for events you own or attend.</p></div>{unread.length>0?<form action={markNotificationsReadAction.bind(null,undefined)}><Button variant="outline"><CheckCheck className="size-4"/>Mark all read</Button></form>:null}</div>
    <Card className="border-primary/10"><CardHeader><CardTitle>{unread.length} unread</CardTitle><CardDescription>{notifications.length} recent reminders</CardDescription></CardHeader><CardContent className="space-y-3">{notifications.map(item=><article key={item.id} className={`rounded-xl border p-4 ${item.read_at?'bg-card':'border-gold/35 bg-gold/5'}`}><div className="flex items-start justify-between gap-4"><div className="flex gap-3"><span className="mt-0.5 rounded-full bg-primary p-2 text-primary-foreground"><BellRing className="size-4"/></span><div><p className="font-semibold text-primary">{item.title}</p><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3"/>{eventDate(item.delivered_at)}</p></div></div>{!item.read_at?<form action={markNotificationsReadAction.bind(null,item.id)}><Button size="sm" variant="ghost">Mark read</Button></form>:null}</div></article>)}{notifications.length===0?<div className="py-16 text-center"><BellRing className="mx-auto size-10 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No reminders yet. Upcoming event reminders will appear here automatically.</p></div>:null}</CardContent></Card>
  </div>
}
