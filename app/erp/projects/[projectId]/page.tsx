import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  History,
  ImageIcon,
  Layers3,
  Megaphone,
  Pencil,
  Users,
} from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  formatEtb,
  formatPhase,
  getErpProjectWorkspace,
} from '@/services/projects/supabase-project-service'

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>
}

const sections = [
  ['overview', 'Overview'],
  ['structure', 'Building Structure'],
  ['units', 'Floors and Units'],
  ['pricing', 'Pricing'],
  ['media', 'Marketing and Media'],
  ['progress', 'Progress'],
  ['team', 'Team'],
  ['publication', 'Publication'],
  ['audit', 'Audit History'],
] as const

function text(value: unknown, fallback = '—') {
  return typeof value === 'string' && value.length > 0 ? value : fallback
}

function number(value: unknown) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function bedroomLabel(value: unknown, category?: unknown) {
  if (category === 'commercial') return 'Commercial space'
  const bedrooms = Number(value)
  if (!Number.isFinite(bedrooms)) return 'Unit type'
  if (bedrooms === 0) return 'Studio'
  return `${bedrooms}BR`
}

function areaRange(values: number[]) {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0)
  if (valid.length === 0) return '—'
  const min = Math.min(...valid)
  const max = Math.max(...valid)
  return min === max ? `${min} m²` : `${min}–${max} m²`
}

function statusCount(units: Array<Record<string, unknown>>, status: string) {
  return units.filter((unit) => text(unit.status, '').toLowerCase() === status).length
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  const { projectId } = await params
  const workspace = await getErpProjectWorkspace(projectId)

  if (!workspace) notFound()

  const { project, floors, units, unitTypes, prices, media, milestones, publication, audit, team } = workspace
  const statusCounts = units.reduce<Record<string, number>>((summary, unit) => {
    const status = text(unit.status, 'unknown')
    summary[status] = (summary[status] ?? 0) + 1
    return summary
  }, {})
  const currentPrices = prices.filter((price) => price.is_current === true)
  const publicationStatus = text(publication?.status, 'draft')
  const availableUnits = statusCount(units, 'available')
  const reservedUnits = statusCount(units, 'reserved')
  const contractedUnits = statusCount(units, 'contracted')
  const soldUnits = statusCount(units, 'sold')
  const handedOverUnits = statusCount(units, 'handed_over')
  const unitTypeById = new Map(unitTypes.map((unitType) => [text(unitType.id, ''), unitType]))

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href="/erp/projects">
              <ArrowLeft className="size-4" aria-hidden="true" />
              Projects
            </Link>
          </Button>
          <p className="text-sm font-medium text-primary">Project workspace</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">{text(project.name)}</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {text(project.code)} · {[project.subcity, project.city].filter(Boolean).join(', ')} · {formatPhase(project.phase)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link href={`/erp/projects/${projectId}/edit`}>
              <Pencil className="size-4" aria-hidden="true" />
              Edit project
            </Link>
          </Button>
          <Badge variant="outline">{formatPhase(project.phase)}</Badge>
          <Badge variant={publicationStatus === 'published' ? 'default' : 'secondary'} className="capitalize">
            {publicationStatus.replace('_', ' ')}
          </Badge>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto rounded-lg border bg-card p-2" aria-label="Project workspace sections">
        {sections.map(([id, label]) => (
          <a key={id} href={`#${id}`} className="shrink-0 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted">
            {label}
          </a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-24 space-y-4">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardHeader><CardDescription>Available units</CardDescription><CardTitle className="text-3xl">{availableUnits}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Reserved / contracted</CardDescription><CardTitle className="text-3xl">{reservedUnits + contractedUnits}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Sold units</CardDescription><CardTitle className="text-3xl">{soldUnits}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Handed over</CardDescription><CardTitle className="text-3xl">{handedOverUnits}</CardTitle></CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
            <CardDescription>Sales-ready project summary. Contractual status changes will be controlled by Sales CRM later.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Address</p><p className="mt-1 font-medium">{text(project.address)}</p></div>
            <div><p className="text-muted-foreground">Publication</p><p className="mt-1 font-medium capitalize">{publicationStatus.replace('_', ' ')}</p></div>
            <div><p className="text-muted-foreground">Construction phase</p><p className="mt-1 font-medium">{formatPhase(project.phase)}</p></div>
            <div><p className="text-muted-foreground">Floor progress</p><p className="mt-1 font-medium">{number(project.floors_completed)} of {number(project.total_floors)} floors completed</p></div>
            <div><p className="text-muted-foreground">Unit types</p><p className="mt-1 font-medium">{unitTypes.length}</p></div>
            <div><p className="text-muted-foreground">Starting price</p><p className="mt-1 font-medium">{formatEtb(currentPrices.length ? Math.min(...currentPrices.map((price) => number(price.amount))) : null)}</p></div>
            <div className="md:col-span-2"><p className="text-muted-foreground">Description</p><p className="mt-1 leading-6">{text(project.description, 'No project description yet.')}</p></div>
          </CardContent>
        </Card>
      </section>

      <section id="structure" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="size-5" />Building Structure</CardTitle>
            <CardDescription>One project represents this single building. No development or site grouping is used.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Highest floor</p><p className="mt-2 text-2xl font-semibold">{number(project.total_floors)}</p></div>
            <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Typical floors</p><p className="mt-2 text-2xl font-semibold">{floors.filter((floor) => floor.floor_kind === 'typical').length}</p></div>
            <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Special floors</p><p className="mt-2 text-2xl font-semibold">{floors.filter((floor) => floor.floor_kind === 'special').length}</p></div>
          </CardContent>
        </Card>
      </section>

      <section id="units" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Layers3 className="size-5" />Floors and Units</CardTitle>
            <CardDescription>Individual inventory generated from typical templates and special-floor overrides.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex flex-wrap gap-2">
              {Object.entries(statusCounts).map(([status, count]) => (
                <Badge key={status} variant="outline" className="capitalize">{status.replace('_', ' ')}: {count}</Badge>
              ))}
              {units.length === 0 ? <span className="text-sm text-muted-foreground">No units generated yet.</span> : null}
            </div>
            {units.length > 0 ? (
              <Table>
                <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Type</TableHead><TableHead>Net area</TableHead><TableHead>Gross area</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {units.slice(0, 20).map((unit) => {
                    const unitType = unitTypeById.get(text(unit.unit_type_id, ''))
                    return (
                      <TableRow key={text(unit.id)}>
                        <TableCell className="font-medium">{text(unit.unit_number)}</TableCell>
                        <TableCell>{bedroomLabel(unit.bedrooms ?? unitType?.bedrooms, unit.category)}</TableCell>
                        <TableCell>{number(unit.net_area_sqm)} m²</TableCell>
                        <TableCell>{number(unit.gross_area_sqm)} m²</TableCell>
                        <TableCell className="max-w-64 text-muted-foreground">{text(unit.unit_description)}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize">{text(unit.status).replace('_', ' ')}</Badge></TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            ) : null}
          </CardContent>
        </Card>
      </section>

      <section id="pricing" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CircleDollarSign className="size-5" />Pricing</CardTitle>
            <CardDescription>ETB price history is preserved; current rows are shown first.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {currentPrices.map((price) => {
                const joinedUnitType = Array.isArray(price.unit_types) ? price.unit_types[0] : price.unit_types
                const unitType = (joinedUnitType ?? unitTypeById.get(text(price.unit_type_id, '')) ?? {}) as Record<string, unknown>
                const matchingUnits = units.filter((unit) => text(unit.unit_type_id, '') === text(price.unit_type_id, ''))
                return (
                  <div key={text(price.id)} className="rounded-lg border p-4">
                    <Badge variant="outline" className="capitalize">{text(unitType.name, text(price.scope).replace('_', ' '))}</Badge>
                    <p className="mt-3 text-xl font-semibold">{formatEtb(number(price.amount))}</p>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {bedroomLabel(unitType.bedrooms, unitType.category)} · Net {areaRange(matchingUnits.map((unit) => number(unit.net_area_sqm)))} · Gross {areaRange(matchingUnits.map((unit) => number(unit.gross_area_sqm)))}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">Selling price includes VAT. Gross area includes common areas and parking allocation.</p>
                  </div>
                )
              })}
              {currentPrices.length === 0 ? <p className="text-sm text-muted-foreground">No current prices entered.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="media" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5" />Marketing and Media</CardTitle>
            <CardDescription>Only approved, public items can flow to the website. Use Edit project to replace building, location or unit images.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {media.filter((item) => item.is_public !== false).map((item) => (
                <div key={text(item.id)} className="rounded-lg border p-4">
                  <p className="font-medium">{text(item.title, 'Untitled media')}</p>
                  <p className="mt-1 text-xs text-muted-foreground capitalize">{text(item.purpose, text(item.media_type))} · {item.is_approved ? 'Approved' : 'Internal'}</p>
                </div>
              ))}
              {media.filter((item) => item.is_public !== false).length === 0 ? <p className="text-sm text-muted-foreground">No media uploaded.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="progress" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Activity className="size-5" />Progress</CardTitle>
            <CardDescription>
              {project.phase === 'floor_construction'
                ? `${number(project.floors_completed)} of ${number(project.total_floors)} floors completed`
                : formatPhase(project.phase)}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {milestones.map((milestone) => (
              <div key={text(milestone.id)} className="flex items-center justify-between rounded-lg border p-4">
                <div><p className="font-medium">{text(milestone.title)}</p><p className="text-xs text-muted-foreground">{formatPhase(milestone.phase)}</p></div>
                <p className="font-semibold">{number(milestone.progress_percent)}%</p>
              </div>
            ))}
            {milestones.length === 0 ? <p className="text-sm text-muted-foreground">No milestones recorded.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section id="team" className="scroll-mt-24">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-5" />Team</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {team.map((member) => {
              const role = Array.isArray(member.roles) ? member.roles[0] : member.roles
              const roleRecord = (role ?? {}) as Record<string, unknown>
              return (
                <div key={text(member.id)} className="flex items-center justify-between rounded-lg border p-4">
                  <span className="text-sm">{text(member.user_id)}</span>
                  <Badge variant="outline">{text(roleRecord.name, text(roleRecord.code))}</Badge>
                </div>
              )
            })}
            {team.length === 0 ? <p className="text-sm text-muted-foreground">Only organization-wide administrators currently have access.</p> : null}
          </CardContent>
        </Card>
      </section>

      <section id="publication" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="size-5" />Publication</CardTitle>
            <CardDescription>Anonymous visitors only receive the approved publication snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div><p className="text-sm text-muted-foreground">Current status</p><Badge className="mt-2 capitalize">{publicationStatus.replace('_', ' ')}</Badge></div>
            {project.slug ? <Button asChild variant="outline"><Link href={`/projects/${project.slug}`}>Open public page</Link></Button> : null}
          </CardContent>
        </Card>
      </section>

      <section id="audit" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><History className="size-5" />Audit History</CardTitle>
            <CardDescription>Collapsed by default so the workspace stays focused.</CardDescription>
          </CardHeader>
          <CardContent>
            <details className="rounded-lg border bg-background p-4">
              <summary className="cursor-pointer text-sm font-medium">Show edit history and system log</summary>
              <div className="mt-4 space-y-3">
                {audit.map((entry) => (
                  <div key={text(entry.id)} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-4 text-sm">
                    <div className="flex items-center gap-3">
                      <ClipboardCheck className="size-4 text-muted-foreground" aria-hidden="true" />
                      <span className="capitalize">{text(entry.action)} {text(entry.entity_type).replaceAll('_', ' ')}</span>
                    </div>
                    <time className="text-xs text-muted-foreground">{new Date(text(entry.changed_at)).toLocaleString('en-ET')}</time>
                  </div>
                ))}
                {audit.length === 0 ? <p className="text-sm text-muted-foreground">No auditable changes recorded yet.</p> : null}
              </div>
            </details>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
