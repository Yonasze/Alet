import Link from 'next/link'
import { ArrowRight, BadgeDollarSign, CalendarClock, ContactRound, LockKeyhole, TrendingUp } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEtb } from '@/services/projects/supabase-project-service'
import { formatSalesDate, getSalesWorkspace, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { SalesNav } from './sales-nav'

const pipelineStages = ['new', 'contacted', 'qualified', 'viewing', 'unit_selected', 'on_hold', 'reserved', 'contracted'] as const

export default async function SalesDashboardPage() {
  const data = await getSalesWorkspace()
  const projectName = new Map(data.projects.map((item) => [item.id, item.name]))
  const openLeads = data.leads.filter((item) => item.status === 'open')
  const dueFollowUps = openLeads.filter((item) => item.next_follow_up_at && new Date(item.next_follow_up_at) <= new Date())
  const activeReservations = data.reservations.filter((item) => ['on_hold','reserved','contracted'].includes(item.status))
  const pipelineValue = activeReservations.reduce((sum, item) => sum + Number(item.reserved_price_etb), 0)

  const metrics = [
    { label: 'Open leads', value: String(openLeads.length), detail: 'Website and direct enquiries', icon: ContactRound },
    { label: 'Follow-ups due', value: String(dueFollowUps.length), detail: 'Due now or overdue', icon: CalendarClock },
    { label: 'Locked units', value: String(activeReservations.length), detail: 'Held, reserved or contracted', icon: LockKeyhole },
    { label: 'Pipeline value', value: formatEtb(pipelineValue), detail: 'VAT-inclusive agreed prices', icon: BadgeDollarSign },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Sales CRM</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">Sales command center</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Enquiries, follow-ups, unit selection, reservations and contracts in one controlled pipeline.</p>
        </div>
        <Button asChild><Link href="/erp/sales/leads/new">Add lead</Link></Button>
      </div>
      <SalesNav />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div><CardDescription>{metric.label}</CardDescription><CardTitle className="mt-2 text-2xl">{metric.value}</CardTitle></div>
              <span className="rounded-lg bg-primary/10 p-2 text-primary"><metric.icon className="size-5" aria-hidden="true" /></span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{metric.detail}</CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="size-5" />Sales pipeline</CardTitle>
          <CardDescription>Every lead remains visible until won, lost or closed.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <div className="grid min-w-[1050px] grid-cols-8 gap-3">
            {pipelineStages.map((stage) => {
              const leads = data.leads.filter((lead) => lead.stage === stage)
              return (
                <div key={stage} className="rounded-lg bg-muted/55 p-2">
                  <div className="flex items-center justify-between px-1 py-2 text-xs font-semibold uppercase tracking-wide">
                    <span>{salesStageLabel(stage)}</span><Badge variant="secondary">{leads.length}</Badge>
                  </div>
                  <div className="space-y-2">
                    {leads.slice(0, 6).map((lead) => (
                      <Link key={lead.id} href={`/erp/sales/leads/${lead.id}`} className="block rounded-lg border bg-card p-3 text-sm shadow-sm transition hover:border-primary">
                        <p className="font-medium">{lead.full_name}</p>
                        <p className="mt-1 truncate text-xs text-muted-foreground">{projectName.get(lead.project_id)}</p>
                      </Link>
                    ))}
                    {leads.length === 0 ? <p className="px-1 py-3 text-xs text-muted-foreground">No leads</p> : null}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div><CardTitle>Recent enquiries</CardTitle><CardDescription>Newest sales conversations across published projects.</CardDescription></div>
          <Button asChild variant="outline"><Link href="/erp/sales/leads">All leads <ArrowRight className="size-4" /></Link></Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {data.leads.slice(0, 8).map((lead) => (
            <Link key={lead.id} href={`/erp/sales/leads/${lead.id}`} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 hover:border-primary">
              <div><p className="font-medium">{lead.full_name}</p><p className="text-xs text-muted-foreground">{lead.phone ?? lead.email} · {projectName.get(lead.project_id)}</p></div>
              <div className="text-right"><Badge variant="outline">{salesStageLabel(lead.stage)}</Badge><p className="mt-1 text-xs text-muted-foreground">{formatSalesDate(lead.created_at)}</p></div>
            </Link>
          ))}
          {data.leads.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Public and manually entered leads will appear here.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
