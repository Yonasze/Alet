import {
  Activity,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  HardHat,
  PackageCheck,
  TrendingUp,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

const overviewMetrics = [
  { label: 'Active projects', value: '3', detail: 'Organization scoped', icon: Building2 },
  { label: 'Units in pipeline', value: '184', detail: 'Draft to handover', icon: Activity },
  { label: 'Collection progress', value: '62%', detail: 'Installment weighted', icon: TrendingUp },
  { label: 'Open ledger items', value: '27', detail: 'Finance review queue', icon: CircleDollarSign },
] as const

const moduleStatus = [
  { module: 'Authentication', owner: 'Admin', status: 'Foundation', nextStep: 'Wire Supabase Auth and memberships' },
  { module: 'Projects & Units', owner: 'Admin', status: 'Next', nextStep: 'Create building, floor, and unit screens' },
  { module: 'Sales CRM', owner: 'Sales', status: 'Planned', nextStep: 'Lead to reservation workflow' },
  { module: 'Finance Ledger', owner: 'Finance', status: 'Core', nextStep: 'Payment plans and transaction posting' },
  { module: 'Construction Events', owner: 'Engineer', status: 'Core', nextStep: 'Milestone events that trigger payments' },
] as const

const eventQueue = [
  { event: 'FLOOR_COMPLETED', reference: 'Tower A / Floor 5', action: 'Trigger payment stage', icon: HardHat },
  { event: 'PAYMENT_RECEIVED', reference: 'Unit A-0502', action: 'Update ledger and commission', icon: ClipboardCheck },
  { event: 'MATERIAL_DELIVERED', reference: 'Cement delivery PO-1042', action: 'Increase project inventory', icon: PackageCheck },
  { event: 'UNIT_RESERVED', reference: 'Unit B-0301', action: 'Lock unit from duplicate sale', icon: Users },
] as const

export default function ErpDashboardPage() {
  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {overviewMetrics.map((metric) => (
          <Card key={metric.label} className="rounded-lg">
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
              </div>
              <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <metric.icon className="size-5" aria-hidden="true" />
              </span>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">{metric.detail}</CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle>ERP Build Roadmap</CardTitle>
                <CardDescription>Module-by-module delivery aligned to the master specification.</CardDescription>
              </div>
              <Badge variant="secondary">Sprint 1</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Module</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Next step</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {moduleStatus.map((item) => (
                  <TableRow key={item.module}>
                    <TableCell className="font-medium">{item.module}</TableCell>
                    <TableCell>{item.owner}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === 'Core' ? 'default' : 'outline'}>{item.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{item.nextStep}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Event Engine Preview</CardTitle>
            <CardDescription>Business actions that will synchronize construction, finance, sales, and inventory.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {eventQueue.map((item) => (
              <div key={`${item.event}-${item.reference}`} className="rounded-lg border bg-background p-3">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex size-8 items-center justify-center rounded-lg bg-accent/25 text-primary">
                    <item.icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{item.event}</div>
                    <div className="text-sm text-muted-foreground">{item.reference}</div>
                    <div className="mt-1 text-xs text-primary">{item.action}</div>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
