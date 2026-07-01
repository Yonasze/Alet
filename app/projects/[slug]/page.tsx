import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Check,
  ExternalLink,
  MapPin,
  Ruler,
  WalletCards,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatEtb, formatPhase, getPublicProject } from '@/services/projects/supabase-project-service'

export const revalidate = 60

type ProjectPageProps = {
  params: Promise<{ slug: string }>
}

function bedroomSummary(bedrooms: number | null, category: string) {
  if (category === 'commercial') return 'Commercial space'
  if (bedrooms === null) return 'Unit type'
  if (bedrooms === 0) return 'Studio'
  return `${bedrooms}BR apartment`
}

function areaSummary(minimum: number, maximum: number) {
  return minimum === maximum ? `${minimum} m²` : `${minimum}–${maximum} m²`
}

export default async function PublicProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params
  const data = await getPublicProject(slug)

  if (!data) notFound()

  const { project, unitTypes, media, milestones } = data
  const gallery = media.filter((item) => item.purpose !== 'unit' && !item.is_hero)

  return (
    <main className="min-h-screen bg-[#f4f2ec] text-[#173647]">
      <header className="border-b border-[#173647]/10 bg-white/90">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/projects" className="flex items-center gap-2 text-sm font-medium">
            <ArrowLeft className="size-4" aria-hidden="true" />
            All projects
          </Link>
          <Link href="/" className="flex items-center gap-2 font-serif text-xl font-semibold">
            <Building2 className="size-5" aria-hidden="true" />
            Alet
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden bg-[#173647] text-white">
        {project.hero_image_url ? (
          <img src={project.hero_image_url} alt="" className="absolute inset-0 h-full w-full object-cover opacity-35" />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-[#173647] via-[#173647]/90 to-[#173647]/40" />
        <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8 lg:py-28">
          <Badge className="bg-[#c59a55] text-[#173647] hover:bg-[#c59a55]">{formatPhase(project.phase)}</Badge>
          <h1 className="mt-6 max-w-4xl font-serif text-5xl font-semibold leading-tight md:text-7xl">{project.name}</h1>
          <p className="mt-5 flex items-center gap-2 text-white/80">
            <MapPin className="size-4" aria-hidden="true" />
            {[project.address, project.subcity, project.city].filter(Boolean).join(', ')}
          </p>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-white/75">
            {project.short_description ?? project.description}
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            {project.google_maps_url ? (
              <Button asChild className="bg-white text-[#173647] hover:bg-white/90">
                <a href={project.google_maps_url} target="_blank" rel="noreferrer">
                  Open Google Maps
                  <ExternalLink className="size-4" aria-hidden="true" />
                </a>
              </Button>
            ) : null}
            <Button asChild variant="outline" className="border-white/40 bg-transparent text-white hover:bg-white/10 hover:text-white">
              <a href="#unit-types">Explore unit types</a>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-6 px-5 py-10 lg:grid-cols-4 lg:px-8">
        <Card>
          <CardContent className="pt-6">
            <WalletCards className="size-5 text-[#b38a4a]" aria-hidden="true" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Starting price</p>
            <p className="mt-1 font-serif text-xl font-semibold">{formatEtb(project.starting_price_etb)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <Building2 className="size-5 text-[#b38a4a]" aria-hidden="true" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Progress</p>
            <p className="mt-1 font-serif text-xl font-semibold">{project.progress_label}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <CalendarDays className="size-5 text-[#b38a4a]" aria-hidden="true" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Completion</p>
            <p className="mt-1 font-serif text-xl font-semibold">
              {project.expected_completion_date
                ? new Date(project.expected_completion_date).toLocaleDateString('en-ET', { year: 'numeric', month: 'long' })
                : 'To be announced'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <MapPin className="size-5 text-[#b38a4a]" aria-hidden="true" />
            <p className="mt-3 text-xs uppercase tracking-wider text-muted-foreground">Location</p>
            <p className="mt-1 font-serif text-xl font-semibold">{project.subcity ?? project.city}</p>
          </CardContent>
        </Card>
      </section>

      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-10 lg:grid-cols-[1.4fr_0.8fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b38a4a]">About the project</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold">Thoughtful spaces, lasting value.</h2>
          <p className="mt-6 whitespace-pre-line text-base leading-8 text-[#173647]/75">{project.description}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Amenities</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {(project.amenities ?? []).map((amenity) => (
              <div key={amenity} className="flex items-center gap-3 text-sm">
                <span className="flex size-6 items-center justify-center rounded-full bg-[#b38a4a]/15 text-[#8a672f]">
                  <Check className="size-3.5" aria-hidden="true" />
                </span>
                {amenity}
              </div>
            ))}
            {project.amenities.length === 0 ? <p className="text-sm text-muted-foreground">Amenities will be announced soon.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section id="unit-types" className="bg-white">
        <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#b38a4a]">Available unit types</p>
          <h2 className="mt-3 font-serif text-4xl font-semibold">Find the right space.</h2>
          <div className="mt-9 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {unitTypes.map((unitType) => {
              const unitImage = media.find(
                (item) => item.purpose === 'unit' && item.unit_type_code === unitType.code,
              )
              return (
              <Card key={unitType.code} className="overflow-hidden">
                {unitImage ? (
                  <img
                    src={unitImage.public_url}
                    alt={unitImage.alt_text ?? unitImage.title ?? unitType.name}
                    className="aspect-[4/3] w-full object-cover"
                  />
                ) : null}
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="outline" className="capitalize">{unitType.category}</Badge>
                      <CardTitle className="mt-3">{unitType.name}</CardTitle>
                    </div>
                    <p className="text-right text-sm font-semibold">{formatEtb(unitType.starting_price_etb)}</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p className="font-medium text-[#173647]">
                    {bedroomSummary(unitType.bedrooms, unitType.category)} · Net {areaSummary(unitType.minimum_net_area_sqm, unitType.maximum_net_area_sqm)} · Gross {areaSummary(unitType.minimum_gross_area_sqm, unitType.maximum_gross_area_sqm)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Ruler className="size-4" aria-hidden="true" />
                    Net area: {areaSummary(unitType.minimum_net_area_sqm, unitType.maximum_net_area_sqm)}
                  </p>
                  <p className="flex items-center gap-2">
                    <Ruler className="size-4" aria-hidden="true" />
                    Gross area: {areaSummary(unitType.minimum_gross_area_sqm, unitType.maximum_gross_area_sqm)}
                  </p>
                  <p className="text-xs">Gross area includes common areas and the parking allocation.</p>
                </CardContent>
              </Card>
              )
            })}
            {unitTypes.length === 0 ? (
              <p className="col-span-full rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                Available unit types will appear here after inventory is released.
              </p>
            ) : null}
          </div>
        </div>
      </section>

      {gallery.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="font-serif text-4xl font-semibold">Project gallery</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {gallery.map((item) => (
              <img
                key={item.public_url}
                src={item.public_url}
                alt={item.alt_text ?? item.title ?? project.name}
                className="aspect-[4/3] w-full rounded-xl object-cover"
              />
            ))}
          </div>
        </section>
      ) : null}

      <section className="bg-[#e7e5dc]">
        <div className="mx-auto grid max-w-7xl gap-8 px-5 py-16 lg:grid-cols-2 lg:px-8">
          <Card>
            <CardHeader><CardTitle>Payment plan</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {project.payment_plan_summary ?? 'Contact Alet for the approved payment plan.'}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Current offers</CardTitle></CardHeader>
            <CardContent className="whitespace-pre-line text-sm leading-7 text-muted-foreground">
              {project.offers ?? 'There are no public offers at this time.'}
            </CardContent>
          </Card>
        </div>
      </section>

      {milestones.length > 0 ? (
        <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
          <h2 className="font-serif text-4xl font-semibold">Progress milestones</h2>
          <div className="mt-8 space-y-4">
            {milestones.map((milestone) => (
              <Card key={`${milestone.phase}-${milestone.title}`}>
                <CardContent className="flex flex-wrap items-center justify-between gap-5 pt-6">
                  <div>
                    <Badge variant="outline">{formatPhase(milestone.phase)}</Badge>
                    <h3 className="mt-3 font-semibold">{milestone.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{milestone.description}</p>
                  </div>
                  <p className="font-serif text-2xl font-semibold">{milestone.progress_percent}%</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  )
}
