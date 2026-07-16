import {Badge} from '@/components/ui/badge'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {ProcurementNav} from '../procurement-nav'

export default async function ApprovalsPage(){
 const d=await getProcurementWorkspace();const people=new Map(d.profiles.map(p=>[p.id,p.full_name]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Approval history</h2><p className="mt-2 text-sm text-muted-foreground">A traceable record of purchasing decisions and status transitions.</p></div><ProcurementNav/>
  <Card><CardHeader><CardTitle>Procurement decision log</CardTitle><CardDescription>Latest 200 workflow events across suppliers, requests, quotations, orders, deliveries and invoices.</CardDescription></CardHeader><CardContent className="space-y-3">{d.approvals.map(a=><div key={a.id} className="grid gap-3 rounded-lg border p-4 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{procurementLabel(a.entity_type)} · {procurementLabel(a.action)}</p><Badge variant="outline">{a.from_status?procurementLabel(a.from_status):'Created'} → {a.to_status?procurementLabel(a.to_status):'Recorded'}</Badge></div><p className="mt-1 text-xs text-muted-foreground">{people.get(a.actor_user_id??'')??'System or authorized user'} · {procurementDate(a.created_at)}</p>{a.comments?<p className="mt-2 text-sm">{a.comments}</p>:null}</div><code className="text-xs text-muted-foreground">{a.entity_id.slice(0,8)}</code></div>)}{d.approvals.length===0?<div className="py-14 text-center text-sm text-muted-foreground">Approval events will appear as procurement work begins.</div>:null}</CardContent></Card>
 </div>
}
