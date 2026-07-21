import {Badge} from '@/components/ui/badge'
import {Button} from '@/components/ui/button'
import {Card,CardContent,CardDescription,CardHeader,CardTitle} from '@/components/ui/card'
import {getProcurementWorkspace,procurementLabel} from '@/services/procurement/supabase-procurement-service'
import {supplierAction} from '../actions'
import {SupplierForm} from '../procurement-forms'
import {ProcurementNav} from '../procurement-nav'

export default async function SuppliersPage(){
 const d=await getProcurementWorkspace()
 return <div className="space-y-6"><div><p className="text-sm font-medium text-primary">Procurement</p><h2 className="mt-1 font-serif text-3xl font-semibold">Supplier registry</h2><p className="mt-2 text-sm text-muted-foreground">Onboard, approve and monitor suppliers before they enter a sourcing decision.</p></div><ProcurementNav/>
  <div className="grid gap-6 xl:grid-cols-[.8fr_1.2fr]"><Card><CardHeader><CardTitle>Add supplier</CardTitle><CardDescription>New suppliers remain Pending until approved.</CardDescription></CardHeader><CardContent><SupplierForm/></CardContent></Card>
   <div className="space-y-4">{d.suppliers.map(s=><Card key={s.id}><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle>{s.supplier_code} · {s.name}</CardTitle><CardDescription>{procurementLabel(s.category)} · {s.contact_person??'No contact person'}</CardDescription></div><Badge variant="outline">{procurementLabel(s.status)}</Badge></div></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 text-sm md:grid-cols-2"><p><span className="text-muted-foreground">Phone: </span>{s.phone??'Not supplied'}</p><p><span className="text-muted-foreground">Email: </span>{s.email??'Not supplied'}</p><p><span className="text-muted-foreground">TIN: </span>{s.tax_id??'Not supplied'}</p><p><span className="text-muted-foreground">Terms: </span>{s.payment_terms??'Not supplied'}</p></div><div className="flex flex-wrap gap-2">
    {s.status==='pending'?<form action={supplierAction.bind(null,s.id)}><input type="hidden" name="action" value="approve"/><Button type="submit">Approve supplier</Button></form>:null}
    {s.status==='approved'?<form action={supplierAction.bind(null,s.id)}><input type="hidden" name="action" value="suspend"/><input type="hidden" name="comments" value="Suspended from Procurement workspace"/><Button type="submit" variant="destructive">Suspend</Button></form>:null}
    {s.status==='suspended'?<form action={supplierAction.bind(null,s.id)}><input type="hidden" name="action" value="reactivate"/><Button type="submit">Reactivate</Button></form>:null}
    {s.status!=='inactive'?<form action={supplierAction.bind(null,s.id)}><input type="hidden" name="action" value="deactivate"/><Button type="submit" variant="outline">Deactivate</Button></form>:null}
   </div></CardContent></Card>)}{d.suppliers.length===0?<Card><CardContent className="py-14 text-center text-sm text-muted-foreground">Add the first supplier to begin sourcing.</CardContent></Card>:null}</div>
  </div>
 </div>
}
