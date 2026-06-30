import Link from 'next/link'
import { ArrowRight, Building2, MapPin, Plus, Rows3 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { formatPhase, getErpProjects } from '@/services/projects/supabase-project-service'

export default async function ProjectsPage() {
  const projects = await getErpProjects()

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Project Module</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">Projects</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            One project represents one building, from planning through publication and handover.
          </p>
        </div>
        <Button asChild>
          <Link href="/erp/projects/new">
            <Plus className="size-4" aria-hidden="true" />
            New Project
          </Link>
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-14 text-center">
            <Building2 className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
            <h3 className="mt-4 font-serif text-2xl font-semibold">Create the first project</h3>
            <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground">
              The guided workflow covers identity, floors, typical units, pricing, media, progress and publication.
            </p>
            <Button asChild className="mt-6">
              <Link href="/erp/projects/new">Start project wizard</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <section className="grid gap-4 lg:grid-cols-2">
          {projects.map((project) => {
            const publication = project.project_publications[0]?.status ?? 'draft'

            return (
              <Card key={project.id} className="rounded-lg">
                <CardHeader>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="mt-1 flex items-center gap-2">
                        <MapPin className="size-3.5" aria-hidden="true" />
                        {[project.subcity, project.city].filter(Boolean).join(', ')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant="outline">{formatPhase(project.phase)}</Badge>
                      <Badge variant={publication === 'published' ? 'default' : 'secondary'} className="capitalize">
                        {publication.replace('_', ' ')}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg border bg-background p-3">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Rows3 className="size-4" aria-hidden="true" />
                        Floors
                      </div>
                      <div className="mt-2 text-2xl font-semibold">{project.total_floors}</div>
                    </div>
                    <div className="rounded-lg border bg-background p-3">
                      <div className="text-muted-foreground">Construction</div>
                      <div className="mt-2 text-lg font-semibold">
                        {project.phase === 'floor_construction'
                          ? `${project.floors_completed} of ${project.total_floors}`
                          : formatPhase(project.phase)}
                      </div>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href={`/erp/projects/${project.id}`}>
                      Open project workspace
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </section>
      )}
    </div>
  )
}
