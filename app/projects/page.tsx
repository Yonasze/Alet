import Link from 'next/link'
import { ArrowRight, Building2, CalendarDays, MapPin } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { formatEtb, formatPhase, getPublicProjects } from '@/services/projects/supabase-project-service'

export const revalidate = 60

export default async function PublicProjectsPage() {
  const projects = await getPublicProjects()

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#173647]">
      <header className="border-b border-[#173647]/10 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-serif text-xl font-semibold">
            <span className="flex size-10 items-center justify-center rounded-full bg-[#173647] text-white">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            Alet Real Estate
          </Link>
          <Button asChild variant="outline">
            <Link href="/erp/login">ERP Login</Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#b38a4a]">Our developments</p>
          <h1 className="mt-4 font-serif text-5xl font-semibold leading-tight md:text-6xl">Projects built to endure.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#173647]/70">
            Explore approved Alet projects, their location, construction progress, homes and commercial spaces.
          </p>
        </div>

        {projects.length === 0 ? (
          <Card className="mt-12 border-dashed bg-white/70">
            <CardContent className="py-14 text-center">
              <Building2 className="mx-auto size-10 text-[#b38a4a]" aria-hidden="true" />
              <h2 className="mt-5 font-serif text-2xl font-semibold">Projects are being prepared</h2>
              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
                Approved project information will appear here automatically after publication in Alet ERP.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="mt-12 grid gap-7 lg:grid-cols-2">
            {projects.map((project) => (
              <article key={project.id} className="overflow-hidden rounded-2xl border border-[#173647]/10 bg-white shadow-sm">
                <div className="relative aspect-[16/9] overflow-hidden bg-[#dfe4df]">
                  {project.hero_image_url ? (
                    <img
                      src={project.hero_image_url}
                      alt=""
                      className="h-full w-full object-cover transition duration-500 hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Building2 className="size-14 text-[#173647]/30" aria-hidden="true" />
                    </div>
                  )}
                  <Badge className="absolute left-5 top-5 bg-white text-[#173647] hover:bg-white">
                    {formatPhase(project.phase)}
                  </Badge>
                </div>

                <div className="p-6 lg:p-8">
                  <div className="flex items-start justify-between gap-5">
                    <div>
                      <h2 className="font-serif text-3xl font-semibold">{project.name}</h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-[#173647]/65">
                        <MapPin className="size-4" aria-hidden="true" />
                        {[project.subcity, project.city].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <p className="shrink-0 text-right text-sm text-[#173647]/60">
                      From
                      <span className="mt-1 block font-semibold text-[#173647]">{formatEtb(project.starting_price_etb)}</span>
                    </p>
                  </div>

                  <p className="mt-5 line-clamp-3 text-sm leading-6 text-[#173647]/70">
                    {project.short_description ?? project.description}
                  </p>

                  <div className="mt-6 flex flex-wrap gap-4 border-t border-[#173647]/10 pt-5 text-sm">
                    <span className="font-medium">{project.progress_label}</span>
                    {project.expected_completion_date ? (
                      <span className="flex items-center gap-2 text-[#173647]/65">
                        <CalendarDays className="size-4" aria-hidden="true" />
                        Completion {new Date(project.expected_completion_date).toLocaleDateString('en-ET', { year: 'numeric', month: 'short' })}
                      </span>
                    ) : null}
                  </div>

                  <Button asChild className="mt-7 w-full bg-[#173647] text-white hover:bg-[#173647]/90">
                    <Link href={`/projects/${project.slug}`}>
                      View project
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
