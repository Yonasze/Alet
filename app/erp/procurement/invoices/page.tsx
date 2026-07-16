import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementDate,procurementEtb,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {invoiceAction} from '../actions'
import {InvoiceForm} from '../procurement-forms'
import {ProcurementNav} from '../procurement-nav'

export default async function InvoicesPage(){
 const d=await getProcurementWorkspace();const orders=new Map(d.purchaseOrders.map(po=>[po.id,po]));const suppliers=new Map(d.suppliers.map(s=>[s.id,s]))
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Supplier invoices</h2><p className="mt-2 text-sm text-muted-foreground">Register, match and approve invoices before handing payment to Finance.</p></div><ProcurementNav/>
  <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><Card><CardHeader><CardTitle>Register invoice</CardTitle><CardDescription>Available after an accepted delivery is recorded.</CardDescription></CardHeader><CardContent><InvoiceForm purchaseOrders={d.purchaseOrders}/></CardContent></Card>
   <div className="space-y-4">{d.invoices.map(i=><Card key={i.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{i.invoice_number} · {suppliers.get(i.supplier_id)?.name}</CardTitle><CardDescription>{i.supplier_invoice_number} · {orders.get(i.purchase_order_id)?.po_number} · Due {procurementDate(i.due_date)}</CardDescription></div><Badge>{procurementLabel(i.status)}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-muted-foreground">Subtotal</p><p className="font-semibold">{procurementEtb(i.subtotal_etb)}</p></div><div><p className="text-muted-foreground">VAT</p><p className="font-semibold">{procurementEtb(i.vat_amount_etb)}</p></div><div><p className="text-muted-foreground">Total</p><p className="font-semibold">{procurementEtb(i.total_etb)}</p></div></div><div className="flex flex-wrap gap-2">
    {i.status==='registered'?<form action={invoiceAction.bind(null,i.id)}><input type="hidden" name="action" value="match"/><Button type="submit">Three-way match</Button></form>:null}
    {i.status==='matched'?<form action={invoiceAction.bind(null,i.id)}><input type="hidden" name="action" value="approve"/><Button type="submit">Approve invoice</Button></form>:null}
    {i.status==='approved'?<form action={invoiceAction.bind(null,i.id)}><input type="hidden" name="action" value="request_payment"/><Button type="submit">Send to Finance</Button></form>:null}
    {['registered','matched'].includes(i.status)?<form action={invoiceAction.bind(null,i.id)}><input type="hidden" name="action" value="reject"/><input type="hidden" name="comments" value="Invoice rejected from Procurement workspace"/><Button type="submit" variant="destructive">Reject</Button></form>:null}
   </div>{i.finance_disbursement_id?<p className="rounded-lg bg-primary/5 p-3 text-sm">Finance payment request created and linked.</p>:null}{i.rejection_reason?<p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{i.rejection_reason}</p>:null}</CardContent></Card>)}{d.invoices.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No supplier invoices registered.</CardContent></Card>:null}</div>
  </div>
 </div>
}
