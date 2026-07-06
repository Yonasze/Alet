import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, FileSignature, LockKeyhole } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEtb } from '@/services/projects/supabase-project-service'
import { formatSalesDate, getSalesCustomer, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { CustomerEditForm } from '../../sales-forms'

type Props = { params: Promise<{ customerId: string }> }

export default async function SalesCustomerPage({ params }: Props) {
  const { customerId } = await params
  const data = await getSalesCustomer(customerId)
  if (!data) notFound()
  const { customer, leads, reservations, contracts, projects, units } = data
  const projectNames = new Map(projects.map((item) => [item.id,item.name]))
  const unitNumbers = new Map(units.map((item) => [item.id,item.unit_number]))

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost"><Link href="/erp/sales/customers"><ArrowLeft className="size-4" />Back to customers</Link></Button>
      <div><p className="text-sm font-medium text-primary">Customer workspace</p><h2 className="mt-1 font-serif text-3xl font-semibold">{customer.full_name}</h2><p className="mt-2 text-sm text-muted-foreground">Edit contact and identification details and review every linked sales record.</p></div>
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card><CardHeader><CardTitle>Edit customer</CardTitle><CardDescription>Changes also synchronize the customer’s linked leads.</CardDescription></CardHeader><CardContent><CustomerEditForm customer={customer} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Linked leads</CardTitle></CardHeader><CardContent className="space-y-3">
          {leads.map((lead) => <Link key={lead.id} href={`/erp/sales/leads/${lead.id}`} className="flex items-center justify-between rounded-lg border p-3 hover:border-primary"><div><p className="font-medium">{lead.full_name}</p><p className="text-xs text-muted-foreground">{projectNames.get(lead.project_id)} · Created {formatSalesDate(lead.created_at)}</p></div><Badge variant="outline">{salesStageLabel(lead.stage)}</Badge></Link>)}
          {leads.length===0 ? <p className="text-sm text-muted-foreground">No linked leads.</p> : null}
        </CardContent></Card>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-5" />Reservations</CardTitle></CardHeader><CardContent className="space-y-3">
          {reservations.map((item) => <div key={item.id} className="rounded-lg border p-3"><div className="flex justify-between gap-3"><div><p className="font-medium">{item.reservation_number}</p><p className="text-xs text-muted-foreground">Unit {unitNumbers.get(item.unit_id)}</p></div><Badge>{salesStageLabel(item.status)}</Badge></div><p className="mt-3 text-sm font-semibold">{formatEtb(item.reserved_price_etb)}</p></div>)}
          {reservations.length===0 ? <p className="text-sm text-muted-foreground">No reservations.</p> : null}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="flex items-center gap-2"><FileSignature className="size-5" />Contracts</CardTitle></CardHeader><CardContent className="space-y-3">
          {contracts.map((item) => <div key={item.id} className="rounded-lg border p-3"><div className="flex justify-between gap-3"><div><p className="font-medium">{item.contract_number}</p><p className="text-xs text-muted-foreground">Unit {unitNumbers.get(item.unit_id)}</p></div><Badge variant="outline">{salesStageLabel(item.status)}</Badge></div><p className="mt-3 text-sm font-semibold">{formatEtb(item.total_price_etb)}</p></div>)}
          {contracts.length===0 ? <p className="text-sm text-muted-foreground">No contracts.</p> : null}
        </CardContent></Card>
      </div>
    </div>
  )
}
