import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {deliveryAction} from '../actions'
import {DeliveryForm} from '../procurement-forms'
import {ProcurementNav} from '../procurement-nav'

export default async function DeliveriesPage(){
 const d=await getProcurementWorkspace();const orders=new Map(d.purchaseOrders.map(po=>[po.id,po]));const suppliers=new Map(d.suppliers.map(s=>[s.id,s]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Goods receiving</h2><p className="mt-2 text-sm text-muted-foreground">Receive issued orders and inspect quantities before invoices can be matched.</p></div><ProcurementNav/>
  <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><Card><CardHeader><CardTitle>Receive delivery</CardTitle><CardDescription>Record only quantities physically received.</CardDescription></CardHeader><CardContent><DeliveryForm purchaseOrders={d.purchaseOrders} purchaseOrderItems={d.purchaseOrderItems}/></CardContent></Card>
   <div className="space-y-4">{d.deliveries.map(x=>{const items=d.deliveryItems.filter(i=>i.delivery_id===x.id);return <Card key={x.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{x.delivery_number} · {suppliers.get(x.supplier_id)?.name}</CardTitle><CardDescription>{orders.get(x.purchase_order_id)?.po_number} · Received {procurementDate(x.delivery_date)}</CardDescription></div><Badge>{procurementLabel(x.inspection_status)}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="space-y-2">{items.map(i=>{const orderItem=d.purchaseOrderItems.find(p=>p.id===i.purchase_order_item_id);return <div key={i.id} className="grid gap-2 rounded-lg border p-3 text-sm md:grid-cols-[1fr_auto_auto]"><p className="font-medium">{orderItem?.description??'Purchase order item'}</p><p>Received {i.quantity_received}</p><p>Accepted {i.quantity_accepted}</p></div>})}</div>{x.notes?<p className="text-sm text-muted-foreground">{x.notes}</p>:null}{x.inspection_status==='pending'?<div className="flex flex-wrap gap-2"><form action={deliveryAction.bind(null,x.id)}><input type="hidden" name="action" value="accept"/><Button type="submit">Accept delivery</Button></form><form action={deliveryAction.bind(null,x.id)}><input type="hidden" name="action" value="reject"/><input type="hidden" name="comments" value="Delivery rejected during Procurement inspection"/><Button type="submit" variant="destructive">Reject delivery</Button></form></div>:null}</CardContent></Card>})}{d.deliveries.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Issue a purchase order before receiving a delivery.</CardContent></Card>:null}</div>
  </div>
 </div>
}
