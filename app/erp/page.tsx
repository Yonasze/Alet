import { Activity, Building2, CircleDollarSign, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getDashboardMetrics } from '@/services/dashboard/supabase-dashboard-service'

export default async function ErpDashboardPage() {
  const { projects, units, collectionProgress, submittedPayments } = await getDashboardMetrics()
  const number = new Intl.NumberFormat('en-ET')
  const overviewMetrics = [
    { label: 'Projects', value: projects === null ? null : number.format(projects), detail: 'Projects you can access', icon: Building2 },
    { label: 'Units', value: units === null ? null : number.format(units), detail: 'Units in your accessible projects', icon: Activity },
    { label: 'Collection progress', value: collectionProgress === null ? null : `${collectionProgress}%`, detail: 'Paid share of visible scheduled installments', icon: TrendingUp },
    { label: 'Payments to verify', value: submittedPayments === null ? null : number.format(submittedPayments), detail: 'Submitted payments visible to you', icon: CircleDollarSign },
  ]

  return (
    <section aria-label="Operations overview" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {overviewMetrics.map(({ label, value, detail, icon: Icon }) => (
        <Card key={label} className="rounded-lg">
          <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardDescription>{label}</CardDescription>
              <CardTitle className="mt-2 text-3xl">{value ?? '—'}</CardTitle>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="size-5" aria-hidden="true" />
            </span>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {value === null ? 'No data available' : detail}
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
