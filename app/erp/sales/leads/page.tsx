import Link from 'next/link'
import { Plus, Search } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatSalesDate, getSalesWorkspace, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { SalesNav } from '../sales-nav'

type Props = { searchParams: Promise<{ stage?: string; q?: string }> }

export default async function SalesLeadsPage({ searchParams }: Props) {
  const { stage = '', q = '' } = await searchParams
  const data = await getSalesWorkspace()
  const projects = new Map(data.projects.map((item) => [item.id, item.name]))
  const query = q.toLowerCase()
  const leads = data.leads.filter((lead) =>
    (!stage || lead.stage === stage) &&
    (!query || [lead.full_name,lead.phone,lead.email].filter(Boolean).some((value) => String(value).toLowerCase().includes(query))),
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">Sales CRM</p><h2 className="mt-1 font-serif text-3xl font-semibold">Leads and enquiries</h2><p className="mt-2 text-sm text-muted-foreground">Public enquiries and direct sales contacts share one follow-up queue.</p></div>
        <Button asChild><Link href="/erp/sales/leads/new"><Plus className="size-4" />Add lead</Link></Button>
      </div>
      <SalesNav />
      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <label className="flex h-10 items-center gap-2 rounded-lg border bg-background px-3"><Search className="size-4 text-muted-foreground" /><input name="q" defaultValue={q} placeholder="Search name, phone or email" className="w-full bg-transparent text-sm outline-none" /></label>
            <select name="stage" defaultValue={stage} className="h-10 rounded-lg border bg-background px-3 text-sm">
              <option value="">All stages</option>
              {['new','contacted','qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','handed_over','closed'].map((item) => <option key={item} value={item}>{salesStageLabel(item)}</option>)}
            </select>
            <Button type="submit" variant="outline">Filter</Button>
          </form>
        </CardContent>
      </Card>
      <div className="space-y-3">
        {leads.map((lead) => (
          <Link key={lead.id} href={`/erp/sales/leads/${lead.id}`} className="grid gap-3 rounded-xl border bg-card p-4 transition hover:border-primary md:grid-cols-[1.2fr_1fr_1fr_auto] md:items-center">
            <div><p className="font-semibold">{lead.full_name}</p><p className="mt-1 text-sm text-muted-foreground">{lead.phone ?? lead.email}</p></div>
            <div><p className="text-xs text-muted-foreground">Project</p><p className="text-sm font-medium">{projects.get(lead.project_id)}</p></div>
            <div><p className="text-xs text-muted-foreground">Next follow-up</p><p className="text-sm">{formatSalesDate(lead.next_follow_up_at)}</p></div>
            <Badge variant={lead.status === 'won' ? 'default' : 'outline'}>{salesStageLabel(lead.stage)}</Badge>
          </Link>
        ))}
        {leads.length === 0 ? <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No leads match this filter.</CardContent></Card> : null}
      </div>
    </div>
  )
}
