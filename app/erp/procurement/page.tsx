import Link from 'next/link'
import {BadgeCheck,ClipboardList,PackageCheck,ReceiptText,ShoppingCart,Truck,UsersRound} from 'lucide-react'
import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementEtb,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {ProcurementNav} from './procurement-nav'

export default async function ProcurementPage(){
 const d=await getProcurementWorkspace()
 const pendingSuppliers=d.suppliers.filter(s=>s.status==='pending')
 const approvalQueue=d.requisitions.filter(r=>r.status==='submitted')
 const activeOrders=d.purchaseOrders.filter(po=>['approved','issued','partially_delivered'].includes(po.status))
 const pendingDeliveries=d.deliveries.filter(x=>x.inspection_status==='pending')
 const invoiceQueue=d.invoices.filter(i=>['registered','matched','approved'].includes(i.status))
 const committed=d.purchaseOrders.filter(po=>po.status!=='cancelled').reduce((sum,po)=>sum+Number(po.total_etb),0)
 const metrics=[
  {label:'Approval queue',value:approvalQueue.length,detail:'Submitted purchase requests',icon:BadgeCheck},
  {label:'Active orders',value:activeOrders.length,detail:procurementEtb(committed)+' committed',icon:PackageCheck},
  {label:'Delivery inspections',value:pendingDeliveries.length,detail:'Goods awaiting acceptance',icon:Truck},
  {label:'Invoice queue',value:invoiceQueue.length,detail:'Match, approve or send to Finance',icon:ReceiptText},
 ]
 return <div className="space-y-6">
  <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-medium text-primary">Procurement Module</p><h2 className="mt-1 font-serif text-3xl font-semibold">Procurement command center</h2><p className="mt-2 text-sm text-muted-foreground">Controlled purchasing from request and supplier selection through delivery and payment.</p></div><Button asChild><Link href="/erp/procurement/requisitions">Create requisition</Link></Button></div>
  <ProcurementNav/>
  <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{metrics.map(m=><Card key={m.label}><CardHeader className="flex flex-row items-start justify-between"><div><CardDescription>{m.label}</CardDescription><CardTitle className="mt-2 text-3xl">{m.value}</CardTitle></div><span className="rounded-lg bg-primary/10 p-2 text-primary"><m.icon className="size-5"/></span></CardHeader><CardContent className="text-sm text-muted-foreground">{m.detail}</CardContent></Card>)}</section>
  <div className="grid gap-6 xl:grid-cols-[1.2fr_.8fr]">
   <Card><CardHeader><CardTitle>Purchasing pipeline</CardTitle><CardDescription>Recent requests and their current control stage.</CardDescription></CardHeader><CardContent className="space-y-3">{d.requisitions.slice(0,8).map(r=><Link key={r.id} href="/erp/procurement/requisitions" className="grid gap-3 rounded-lg border p-3 hover:border-primary md:grid-cols-[1.3fr_1fr_auto] md:items-center"><div><p className="font-medium">{r.request_number} · {r.title}</p><p className="text-xs text-muted-foreground">{procurementLabel(r.request_type)} · Required {procurementDate(r.required_date)}</p></div><p className="text-sm font-semibold">{procurementEtb(r.estimated_amount_etb)}</p><Badge variant="outline">{procurementLabel(r.status)}</Badge></Link>)}{d.requisitions.length===0?<div className="py-12 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground"/><p className="mt-3 text-sm text-muted-foreground">No purchase requisitions yet.</p></div>:null}</CardContent></Card>
   <Card><CardHeader><CardTitle>Attention needed</CardTitle></CardHeader><CardContent className="space-y-3">
    <Link href="/erp/procurement/suppliers" className="flex items-center justify-between rounded-lg border p-3 hover:border-primary"><span className="flex items-center gap-2 text-sm font-medium"><UsersRound className="size-4"/>Supplier approvals</span><Badge>{pendingSuppliers.length}</Badge></Link>
    <Link href="/erp/procurement/requisitions" className="flex items-center justify-between rounded-lg border p-3 hover:border-primary"><span className="flex items-center gap-2 text-sm font-medium"><ShoppingCart className="size-4"/>Requisition approvals</span><Badge>{approvalQueue.length}</Badge></Link>
    <Link href="/erp/procurement/deliveries" className="flex items-center justify-between rounded-lg border p-3 hover:border-primary"><span className="flex items-center gap-2 text-sm font-medium"><Truck className="size-4"/>Delivery inspections</span><Badge>{pendingDeliveries.length}</Badge></Link>
    <Link href="/erp/procurement/invoices" className="flex items-center justify-between rounded-lg border p-3 hover:border-primary"><span className="flex items-center gap-2 text-sm font-medium"><ReceiptText className="size-4"/>Invoice controls</span><Badge>{invoiceQueue.length}</Badge></Link>
   </CardContent></Card>
  </div>
 </div>
}
