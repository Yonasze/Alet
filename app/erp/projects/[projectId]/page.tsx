import { notFound } from 'next/navigation'
import { Building2, DoorOpen, Layers3, Ruler, WalletCards } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { formatCurrency, getProjectStructure } from '@/services/projects/project-service'
import { calculateUnitInventoryValue, getNextUnitStatuses, summarizeUnitStatuses } from '@/services/projects/unit-service'

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params
  const structure = getProjectStructure(projectId)

  if (!structure) {
    notFound()
  }

  const summary = summarizeUnitStatuses(structure.units)
  const inventoryValue = calculateUnitInventoryValue(structure.units)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Project structure</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">{structure.project.name}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {structure.project.location} · {structure.project.code} · {structure.project.status}
          </p>
        </div>
        <Badge variant="secondary">Organization scoped</Badge>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="rounded-lg">
          <CardHeader>
            <CardDescription>Buildings</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Building2 className="size-6" aria-hidden="true" />
              {structure.buildings.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardDescription>Tracked floors</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <Layers3 className="size-6" aria-hidden="true" />
              {structure.floors.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardDescription>Tracked units</CardDescription>
            <CardTitle className="flex items-center gap-2 text-3xl">
              <DoorOpen className="size-6" aria-hidden="true" />
              {structure.units.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="rounded-lg">
          <CardHeader>
            <CardDescription>Inventory value</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <WalletCards className="size-6" aria-hidden="true" />
              {formatCurrency(inventoryValue)}
            </CardTitle>
          </CardHeader>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Unit Lifecycle</CardTitle>
            <CardDescription>Every unit stays inside the approved status path.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(summary).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between rounded-lg border bg-background px-3 py-2 text-sm">
                <span className="capitalize text-muted-foreground">{status.replace('_', ' ')}</span>
                <span className="font-semibold">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Building Hierarchy</CardTitle>
            <CardDescription>Project → building → floor → unit structure for sales and construction tracking.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Building</TableHead>
                  <TableHead>Floors</TableHead>
                  <TableHead>Units</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {structure.buildings.map((building) => (
                  <TableRow key={building.id}>
                    <TableCell className="font-medium">{building.name}</TableCell>
                    <TableCell>{building.floorCount}</TableCell>
                    <TableCell>{building.unitCount}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Units</CardTitle>
          <CardDescription>Unit-level revenue assets with status and next lifecycle actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Unit</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Next allowed status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {structure.units.map((unit) => {
                const nextStatuses = getNextUnitStatuses(unit.status)

                return (
                  <TableRow key={unit.id}>
                    <TableCell className="font-medium">{unit.unitNumber}</TableCell>
                    <TableCell className="uppercase">{unit.type}</TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1">
                        <Ruler className="size-3.5" aria-hidden="true" />
                        {unit.sizeSqm} sqm
                      </span>
                    </TableCell>
                    <TableCell>{formatCurrency(unit.basePrice)}</TableCell>
                    <TableCell>
                      <Badge variant={unit.status === 'available' ? 'default' : 'outline'}>
                        {unit.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {nextStatuses.length > 0 ? nextStatuses.map((status) => status.replace('_', ' ')).join(', ') : 'Final state'}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
