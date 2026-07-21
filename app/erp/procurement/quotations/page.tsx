import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementEtb,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {quotationAction} from '../actions'
import {ProcurementNav} from '../procurement-nav'
import {QuotationForm} from '../procurement-forms'

export default async function QuotationsPage(){
 const d=await getProcurementWorkspace();const suppliers=new Map(d.suppliers.map(s=>[s.id,s]));const requests=new Map(d.requisitions.map(r=>[r.id,r]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Supplier quotations</h2><p className="mt-2 text-sm text-muted-foreground">Record comparable offers, evaluate them and select one to create a purchase order.</p></div><ProcurementNav/>
  <div className="grid gap-6 xl:grid-cols-[.85fr_1.15fr]"><Card><CardHeader><CardTitle>Record quotation</CardTitle><CardDescription>Only approved requisitions and suppliers are available.</CardDescription></CardHeader><CardContent><QuotationForm requisitions={d.requisitions} requisitionItems={d.requisitionItems} suppliers={d.suppliers}/></CardContent></Card>
   <div className="space-y-4">{d.quotations.map(q=>{const items=d.quotationItems.filter(i=>i.quotation_id===q.id);return <Card key={q.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{q.quotation_number} · {suppliers.get(q.supplier_id)?.name}</CardTitle><CardDescription>{requests.get(q.requisition_id)?.request_number} · {procurementDate(q.quotation_date)} · Valid until {procurementDate(q.valid_until)}</CardDescription></div><Badge>{procurementLabel(q.status)}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{items.map(i=><div key={i.id} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto_auto]"><p className="font-medium">{i.description}</p><p>{i.quantity} {i.unit} × {procurementEtb(i.unit_price_etb)}</p><p className="font-semibold">{procurementEtb(i.total_etb)}</p></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="font-semibold">{procurementEtb(q.total_etb)}</p><p className="text-xs text-muted-foreground">Includes {q.vat_rate}% VAT · {q.delivery_days??'No'} delivery days</p></div><div className="flex flex-wrap gap-2">
    {q.status==='draft'?<form action={quotationAction.bind(null,q.id)}><input type="hidden" name="action" value="submit"/><Button type="submit">Submit offer</Button></form>:null}
    {q.status==='submitted'?<form action={quotationAction.bind(null,q.id)}><input type="hidden" name="action" value="evaluate"/><Button type="submit">Mark evaluated</Button></form>:null}
    {['submitted','evaluated'].includes(q.status)?<><form action={quotationAction.bind(null,q.id)}><input type="hidden" name="action" value="select"/><Button type="submit">Select and create PO</Button></form><form action={quotationAction.bind(null,q.id)}><input type="hidden" name="action" value="reject"/><Button type="submit" variant="destructive">Reject</Button></form></>:null}
   </div></div></CardContent></Card>})}{d.quotations.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Approve a requisition and supplier before recording quotations.</CardContent></Card>:null}</div>
  </div>
 </div>
}
