import { CalendarClock, LockKeyhole } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEtb } from '@/services/projects/supabase-project-service'
import { formatSalesDate, getSalesWorkspace, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { reservationAction } from '../actions'
import { SalesNav } from '../sales-nav'
import { ReservationForm } from '../sales-forms'

function availableAction(status: string) {
  if (status === 'on_hold') return { action: 'reserve', label: 'Confirm reservation' }
  if (status === 'reserved' || status === 'on_hold') return { action: 'contract', label: 'Create contract' }
  if (status === 'contracted') return { action: 'sell', label: 'Mark sold' }
  if (status === 'sold') return { action: 'handover', label: 'Record handover' }
  return null
}

export default async function SalesReservationsPage() {
  const data = await getSalesWorkspace()
  const leads = new Map(data.leads.map((item) => [item.id, item]))
  const customers = new Map(data.customers.map((item) => [item.id, item]))
  const units = new Map(data.units.map((item) => [item.id, item]))
  const projects = new Map(data.projects.map((item) => [item.id, item]))

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">Sales CRM</p><h2 className="mt-1 font-serif text-3xl font-semibold">Holds and reservations</h2><p className="mt-2 text-sm text-muted-foreground">Lock an available unit to one customer and preserve the agreed VAT-inclusive price.</p></div>
      <SalesNav />
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="size-5" />Lock a unit</CardTitle><CardDescription>Holds default to 48 hours. Reservations default to 14 days.</CardDescription></CardHeader>
          <CardContent><ReservationForm leads={data.leads} units={data.units} /></CardContent>
        </Card>
        <div className="space-y-3">
          {data.reservations.map((item) => {
            const lead = item.lead_id ? leads.get(item.lead_id) : null
            const customer = customers.get(item.customer_id)
            const unit = units.get(item.unit_id)
            const next = availableAction(item.status)
            const expiry = item.status === 'on_hold' ? item.hold_expires_at : item.reservation_expires_at
            return (
              <Card key={item.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div><CardTitle>{item.reservation_number}</CardTitle><CardDescription>{projects.get(item.project_id)?.name} · Unit {unit?.unit_number}</CardDescription></div>
                    <Badge>{salesStageLabel(item.status)}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-3 text-sm sm:grid-cols-3"><div><p className="text-xs text-muted-foreground">Customer</p><p className="font-medium">{customer?.full_name ?? lead?.full_name}</p></div><div><p className="text-xs text-muted-foreground">Agreed price</p><p className="font-medium">{formatEtb(item.reserved_price_etb)}</p></div><div><p className="text-xs text-muted-foreground">Expiry</p><p className="flex items-center gap-1 font-medium"><CalendarClock className="size-3.5" />{formatSalesDate(expiry)}</p></div></div>
                  {!['cancelled','expired','handed_over'].includes(item.status) ? (
                    <div className="flex flex-wrap gap-2 border-t pt-4">
                      {next ? <form action={reservationAction.bind(null,item.id)}><input type="hidden" name="action" value={next.action} /><Button type="submit">{next.label}</Button></form> : null}
                      {item.status === 'on_hold' ? <form action={reservationAction.bind(null,item.id)}><input type="hidden" name="action" value="contract" /><Button type="submit" variant="outline">Create contract now</Button></form> : null}
                      {!['sold','handed_over'].includes(item.status) ? <form action={reservationAction.bind(null,item.id)}><input type="hidden" name="action" value="cancel" /><input type="hidden" name="reason" value="Cancelled from Sales CRM" /><Button type="submit" variant="destructive">Cancel</Button></form> : null}
                    </div>
                  ) : null}
                </CardContent>
              </Card>
            )
          })}
          {data.reservations.length === 0 ? <Card className="border-dashed"><CardContent className="py-14 text-center text-sm text-muted-foreground">No units are held or reserved yet.</CardContent></Card> : null}
        </div>
      </div>
    </div>
  )
}
