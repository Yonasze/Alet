import { CheckCircle2, FileSignature } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEtb } from '@/services/projects/supabase-project-service'
import { formatSalesDate, getSalesWorkspace, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { SalesNav } from '../sales-nav'

export default async function SalesContractsPage() {
  const data = await getSalesWorkspace()
  const customers = new Map(data.customers.map((item) => [item.id, item]))
  const units = new Map(data.units.map((item) => [item.id, item]))
  const projects = new Map(data.projects.map((item) => [item.id, item]))
  const total = data.contracts.filter((item) => item.status !== 'cancelled').reduce((sum,item) => sum + Number(item.total_price_etb),0)

  return (
    <div className="space-y-6">
      <div><p className="text-sm font-medium text-primary">Sales CRM</p><h2 className="mt-1 font-serif text-3xl font-semibold">Contracts</h2><p className="mt-2 text-sm text-muted-foreground">Contract values are permanent price snapshots and will feed the future Finance module.</p></div>
      <SalesNav />
      <section className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader><CardDescription>Contracts</CardDescription><CardTitle className="text-3xl">{data.contracts.length}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Contract value</CardDescription><CardTitle className="text-2xl">{formatEtb(total)}</CardTitle></CardHeader></Card>
        <Card><CardHeader><CardDescription>Completed handovers</CardDescription><CardTitle className="text-3xl">{data.contracts.filter((item) => item.status === 'completed').length}</CardTitle></CardHeader></Card>
      </section>
      <div className="space-y-3">
        {data.contracts.map((contract) => (
          <Card key={contract.id}>
            <CardContent className="grid gap-4 pt-6 md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
              <div className="flex items-start gap-3"><span className="rounded-lg bg-primary/10 p-2 text-primary">{contract.status === 'completed' ? <CheckCircle2 className="size-5" /> : <FileSignature className="size-5" />}</span><div><p className="font-semibold">{contract.contract_number}</p><p className="text-xs text-muted-foreground">{projects.get(contract.project_id)?.name} · Unit {units.get(contract.unit_id)?.unit_number}</p></div></div>
              <div><p className="text-xs text-muted-foreground">Customer</p><p className="text-sm font-medium">{customers.get(contract.customer_id)?.full_name}</p></div>
              <div><p className="text-xs text-muted-foreground">VAT-inclusive price</p><p className="text-sm font-semibold">{formatEtb(contract.total_price_etb)}</p><p className="text-xs text-muted-foreground">Signed {formatSalesDate(contract.signed_at)}</p></div>
              <Badge variant={contract.status === 'completed' ? 'default' : 'outline'}>{salesStageLabel(contract.status)}</Badge>
            </CardContent>
          </Card>
        ))}
        {data.contracts.length === 0 ? <Card className="border-dashed"><CardContent className="py-14 text-center text-sm text-muted-foreground">Contracts appear after a hold or reservation is converted.</CardContent></Card> : null}
      </div>
    </div>
  )
}
