import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementEtb,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {purchaseOrderAction} from '../actions'
import {ProcurementNav} from '../procurement-nav'

export default async function PurchaseOrdersPage(){
 const d=await getProcurementWorkspace();const suppliers=new Map(d.suppliers.map(s=>[s.id,s]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Purchase orders</h2><p className="mt-2 text-sm text-muted-foreground">Approve, issue and track orders created from selected quotations.</p></div><ProcurementNav/>
  <div className="space-y-4">{d.purchaseOrders.map(po=>{const items=d.purchaseOrderItems.filter(i=>i.purchase_order_id===po.id);return <Card key={po.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{po.po_number} · {suppliers.get(po.supplier_id)?.name}</CardTitle><CardDescription>Ordered {procurementDate(po.order_date)} · Expected {procurementDate(po.expected_delivery_date)}</CardDescription></div><Badge>{procurementLabel(po.status)}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{items.map(i=><div key={i.id} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto_auto_auto]"><p className="font-medium">{i.description}</p><p>{i.quantity} {i.unit}</p><p>Accepted {i.delivered_quantity}</p><p className="font-semibold">{procurementEtb(i.total_etb)}</p></div>)}</div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-muted-foreground">Order total</p><p className="text-lg font-semibold">{procurementEtb(po.total_etb)}</p></div><div className="flex flex-wrap gap-2">
    {po.status==='draft'?<form action={purchaseOrderAction.bind(null,po.id)}><input type="hidden" name="action" value="approve"/><Button type="submit">Approve order</Button></form>:null}
    {po.status==='approved'?<form action={purchaseOrderAction.bind(null,po.id)}><input type="hidden" name="action" value="issue"/><Button type="submit">Issue to supplier</Button></form>:null}
    {po.status==='delivered'?<form action={purchaseOrderAction.bind(null,po.id)}><input type="hidden" name="action" value="close"/><Button type="submit">Close order</Button></form>:null}
    {['draft','approved','issued'].includes(po.status)?<form action={purchaseOrderAction.bind(null,po.id)}><input type="hidden" name="action" value="cancel"/><Button type="submit" variant="destructive">Cancel</Button></form>:null}
   </div></div></CardContent></Card>})}{d.purchaseOrders.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">A purchase order is created automatically when a quotation is selected.</CardContent></Card>:null}</div>
 </div>
}
