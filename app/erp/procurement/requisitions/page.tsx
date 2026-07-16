import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementEtb,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {requisitionAction} from '../actions'
import {ProcurementNav} from '../procurement-nav'
import {RequisitionForm} from '../procurement-forms'

export default async function RequisitionsPage(){
 const d=await getProcurementWorkspace();const projects=new Map(d.projects.map(p=>[p.id,p]));const packages=new Map(d.workPackages.map(w=>[w.id,w]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Purchase requisitions</h2><p className="mt-2 text-sm text-muted-foreground">Capture project demand, estimated value and approval before sourcing.</p></div><ProcurementNav/>
  <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]"><Card><CardHeader><CardTitle>New requisition</CardTitle><CardDescription>Build the item schedule and save it as Draft.</CardDescription></CardHeader><CardContent><RequisitionForm projects={d.projects} workPackages={d.workPackages}/></CardContent></Card>
   <div className="space-y-4">{d.requisitions.map(r=>{const items=d.requisitionItems.filter(i=>i.requisition_id===r.id);return <Card key={r.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{r.request_number} · {r.title}</CardTitle><CardDescription>{projects.get(r.project_id)?.name} · {r.work_package_id?(packages.get(r.work_package_id)?.code??'Linked work package'):'Not linked to a work package'} · Required {procurementDate(r.required_date)}</CardDescription></div><div className="flex gap-2"><Badge variant={r.priority==='critical'?'destructive':'outline'}>{procurementLabel(r.priority)}</Badge><Badge>{procurementLabel(r.status)}</Badge></div></div></CardHeader><CardContent className="space-y-4"><p className="text-sm">{r.purpose}</p><div className="space-y-2">{items.map(i=><div key={i.id} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto_auto]"><div><p className="font-medium">{i.description}</p><p className="text-xs text-muted-foreground">{i.specification??'No specification'}</p></div><p>{i.quantity} {i.unit}</p><p className="font-semibold">{procurementEtb(i.estimated_total_etb)}</p></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3"><p className="font-semibold">Estimated total: {procurementEtb(r.estimated_amount_etb)}</p><div className="flex flex-wrap gap-2">
     {r.status==='draft'?<form action={requisitionAction.bind(null,r.id)}><input type="hidden" name="action" value="submit"/><Button type="submit">Submit</Button></form>:null}
     {r.status==='submitted'?<><form action={requisitionAction.bind(null,r.id)}><input type="hidden" name="action" value="approve"/><Button type="submit">Approve</Button></form><form action={requisitionAction.bind(null,r.id)}><input type="hidden" name="action" value="reject"/><input type="hidden" name="comments" value="Requisition rejected from Procurement workspace"/><Button type="submit" variant="destructive">Reject</Button></form></>:null}
     {['draft','submitted','approved','sourcing'].includes(r.status)?<form action={requisitionAction.bind(null,r.id)}><input type="hidden" name="action" value="cancel"/><Button type="submit" variant="outline">Cancel</Button></form>:null}
    </div></div>{r.rejection_reason?<p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{r.rejection_reason}</p>:null}</CardContent></Card>})}{d.requisitions.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Create the first purchase requisition.</CardContent></Card>:null}</div>
  </div>
 </div>
}
