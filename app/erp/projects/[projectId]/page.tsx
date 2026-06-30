import Link from 'next/link'
import { notFound } from 'next/navigation'
import {
  Activity,
  ArrowLeft,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  DoorOpen,
  History,
  ImageIcon,
  Layers3,
  Megaphone,
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
        <div className="flex gap-2">
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
            <CardHeader><CardDescription>Floors</CardDescription><CardTitle className="text-3xl">{floors.length}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Generated units</CardDescription><CardTitle className="text-3xl">{units.length}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Unit types</CardDescription><CardTitle className="text-3xl">{unitTypes.length}</CardTitle></CardHeader>
          </Card>
          <Card>
            <CardHeader><CardDescription>Starting price</CardDescription><CardTitle className="text-xl">
              {formatEtb(currentPrices.length ? Math.min(...currentPrices.map((price) => number(price.amount))) : null)}
            </CardTitle></CardHeader>
          </Card>
        </div>
        <Card>
          <CardHeader><CardTitle>Overview</CardTitle></CardHeader>
          <CardContent className="grid gap-5 text-sm md:grid-cols-2">
            <div><p className="text-muted-foreground">Address</p><p className="mt-1 font-medium">{text(project.address)}</p></div>
            <div><p className="text-muted-foreground">Responsible team member</p><p className="mt-1 font-medium">{text(project.responsible_user_id, 'Not assigned')}</p></div>
            <div><p className="text-muted-foreground">VAT</p><p className="mt-1 font-medium">{number(project.vat_rate)}%</p></div>
            <div><p className="text-muted-foreground">Parking price</p><p className="mt-1 font-medium">{formatEtb(number(project.parking_price))}</p></div>
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
            <div className="rounded-lg border p-4"><p className="text-sm text-muted-foreground">Total floors</p><p className="mt-2 text-2xl font-semibold">{number(project.total_floors)}</p></div>
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
                <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Category</TableHead><TableHead>Net area</TableHead><TableHead>Gross area</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {units.slice(0, 20).map((unit) => (
                    <TableRow key={text(unit.id)}>
                      <TableCell className="font-medium">{text(unit.unit_number)}</TableCell>
                      <TableCell className="capitalize">{text(unit.category)}</TableCell>
                      <TableCell>{number(unit.net_area_sqm)} m²</TableCell>
                      <TableCell>{number(unit.gross_area_sqm)} m²</TableCell>
                      <TableCell className="max-w-64 text-muted-foreground">{text(unit.unit_description)}</TableCell>
                      <TableCell><Badge variant="outline" className="capitalize">{text(unit.status).replace('_', ' ')}</Badge></TableCell>
                    </TableRow>
                  ))}
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
              {currentPrices.map((price) => (
                <div key={text(price.id)} className="rounded-lg border p-4">
                  <Badge variant="outline" className="capitalize">{text(price.scope).replace('_', ' ')}</Badge>
                  <p className="mt-3 text-xl font-semibold">{formatEtb(number(price.amount))}</p>
                  <p className="mt-1 text-xs text-muted-foreground">VAT {number(price.vat_rate)}% · Parking {formatEtb(number(price.parking_price))}</p>
                </div>
              ))}
              {currentPrices.length === 0 ? <p className="text-sm text-muted-foreground">No current prices entered.</p> : null}
            </div>
          </CardContent>
        </Card>
      </section>

      <section id="media" className="scroll-mt-24">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImageIcon className="size-5" />Marketing and Media</CardTitle>
            <CardDescription>Only approved, public items can flow to the website.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {media.map((item) => (
                <div key={text(item.id)} className="rounded-lg border p-4">
                  <p className="font-medium">{text(item.title, 'Untitled media')}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{text(item.media_type)} · {item.is_approved ? 'Approved' : 'Internal'}</p>
                </div>
              ))}
              {media.length === 0 ? <p className="text-sm text-muted-foreground">No media uploaded.</p> : null}
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
            <CardDescription>Project, price, permission, progress and publication changes.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
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
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
