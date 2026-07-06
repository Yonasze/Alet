import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarClock, Mail, MessageSquare, Phone, UserRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatSalesDate, getSalesLead, salesStageLabel } from '@/services/sales/supabase-sales-service'

import { LeadUpdateForm } from '../../sales-forms'

type Props = { params: Promise<{ leadId: string }> }

export default async function SalesLeadPage({ params }: Props) {
  const { leadId } = await params
  const data = await getSalesLead(leadId)
  if (!data) notFound()
  const { lead, activities, projects, unitTypes } = data
  const project = projects.find((item) => item.id === lead.project_id)
  const unitType = unitTypes.find((item) => item.id === lead.unit_type_id)

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost"><Link href="/erp/sales/leads"><ArrowLeft className="size-4" />Back to leads</Link></Button>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-sm font-medium text-primary">{project?.name}</p><h2 className="mt-1 font-serif text-3xl font-semibold">{lead.full_name}</h2><p className="mt-2 text-sm text-muted-foreground">Created {formatSalesDate(lead.created_at)} · Source: {lead.source.replaceAll('_',' ')}</p></div>
        <Badge>{salesStageLabel(lead.stage)}</Badge>
      </div>
      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="size-5" />Contact</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="flex items-center gap-2"><Phone className="size-4 text-muted-foreground" />{lead.phone ?? 'No phone'}</p>
              <p className="flex items-center gap-2"><Mail className="size-4 text-muted-foreground" />{lead.email ?? 'No email'}</p>
              <p className="flex items-center gap-2"><MessageSquare className="size-4 text-muted-foreground" />Prefers {lead.preferred_contact_method}</p>
              <p className="flex items-center gap-2"><CalendarClock className="size-4 text-muted-foreground" />Follow-up: {formatSalesDate(lead.next_follow_up_at)}</p>
              <div className="rounded-lg bg-muted p-3"><p className="text-xs text-muted-foreground">Interested unit</p><p className="mt-1 font-medium">{unitType?.name ?? 'Not decided'}</p></div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Initial enquiry</CardTitle></CardHeader><CardContent className="whitespace-pre-line text-sm leading-6 text-muted-foreground">{lead.message ?? 'No enquiry message.'}</CardContent></Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Update lead</CardTitle><CardDescription>Move the lead through the pipeline and record every contact.</CardDescription></CardHeader>
          <CardContent><LeadUpdateForm lead={lead} /></CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Activity history</CardTitle><CardDescription>Calls, meetings, viewings, emails and notes appear here.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {activities.map((activity) => <div key={activity.id} className="rounded-lg border p-3"><div className="flex justify-between gap-4"><Badge variant="outline">{salesStageLabel(activity.activity_type)}</Badge><span className="text-xs text-muted-foreground">{formatSalesDate(activity.created_at)}</span></div><p className="mt-3 text-sm">{activity.summary}</p></div>)}
          {activities.length === 0 ? <p className="py-6 text-center text-sm text-muted-foreground">No activity has been recorded yet.</p> : null}
        </CardContent>
      </Card>
    </div>
  )
}
