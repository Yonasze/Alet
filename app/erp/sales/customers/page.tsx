import Link from 'next/link'
import { Mail, Phone, UserRound } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSalesWorkspace } from '@/services/sales/supabase-sales-service'

import { SalesNav } from '../sales-nav'

export default async function SalesCustomersPage() {
  const { customers, leads, reservations, contracts } = await getSalesWorkspace()
  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">Sales CRM</p><h2 className="mt-1 font-serif text-3xl font-semibold">Customers</h2><p className="mt-2 text-sm text-muted-foreground">Qualified contacts become customer records when a unit is held or reserved.</p></div>
      <SalesNav />
      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {customers.map((customer) => (
          <Link key={customer.id} href={`/erp/sales/customers/${customer.id}`} className="block">
          <Card className="h-full transition hover:border-primary">
            <CardHeader><span className="mb-2 flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary"><UserRound className="size-5" /></span><CardTitle>{customer.full_name}</CardTitle><CardDescription>{leads.filter((lead) => lead.customer_id === customer.id).length} linked lead(s)</CardDescription></CardHeader>
            <CardContent className="space-y-2 text-sm"><p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{customer.phone ?? 'No phone'}</p><p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{customer.email ?? 'No email'}</p><p className="pt-2 text-xs text-muted-foreground">{reservations.filter((item) => item.customer_id === customer.id).length} reservations · {contracts.filter((item) => item.customer_id === customer.id).length} contracts</p></CardContent>
          </Card>
          </Link>
        ))}
        {customers.length === 0 ? <Card className="border-dashed lg:col-span-2 xl:col-span-3"><CardContent className="py-14 text-center text-sm text-muted-foreground">Customers are created automatically when a lead selects a unit.</CardContent></Card> : null}
      </section>
    </div>
  )
}
