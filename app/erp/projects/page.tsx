import Link from 'next/link'
import { ArrowRight, Building2, MapPin, Rows3, WalletCards } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getProjects } from '@/services/projects/project-service'

export default function ProjectsPage() {
  const projects = getProjects()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Sprint 2</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">Projects & Units</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Manage the organization-to-project structure and drill into buildings, floors, and units.
          </p>
        </div>
        <Button variant="secondary">
          <Building2 className="size-4" aria-hidden="true" />
          New Project
        </Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          <Card key={project.id} className="rounded-lg">
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{project.name}</CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-2">
                    <MapPin className="size-3.5" aria-hidden="true" />
                    {project.location ?? 'Location pending'}
                  </CardDescription>
                </div>
                <Badge variant={project.status === 'active' ? 'default' : 'secondary'}>{project.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Rows3 className="size-4" aria-hidden="true" />
                    Units
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{project.activeUnitCount ?? 0}</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="text-muted-foreground">Reserved</div>
                  <div className="mt-2 text-2xl font-semibold">{project.reservedUnitCount ?? 0}</div>
                </div>
                <div className="rounded-lg border bg-background p-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <WalletCards className="size-4" aria-hidden="true" />
                    Sold
                  </div>
                  <div className="mt-2 text-2xl font-semibold">{project.soldUnitCount ?? 0}</div>
                </div>
              </div>

              <Button asChild className="w-full">
                <Link href={`/erp/projects/${project.id}`}>
                  Open project structure
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  )
}
