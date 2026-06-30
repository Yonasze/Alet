'use client'

import { useActionState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createProjectAction, type ProjectWizardState } from './actions'

const initialState: ProjectWizardState = {}

type StepProps = {
  number: number
  title: string
  description: string
  children: React.ReactNode
}

function Step({ number, title, description, children }: StepProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex gap-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {number}
          </span>
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

function Field({ label, name, ...props }: { label: string; name: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      <Input id={name} name={name} {...props} />
    </div>
  )
}

export function ProjectWizardForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState)

  return (
    <form action={formAction} className="space-y-6">
      <Step number={1} title="Project identity and responsible team" description="One project is one building. The signed-in administrator becomes the initial responsible user.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Project name" name="name" placeholder="Alet Bole Residence" required />
          <Field label="Project code" name="code" placeholder="ABR-01" required />
          <Field label="Public slug" name="slug" placeholder="alet-bole-residence" />
        </div>
      </Step>

      <Step number={2} title="Address, coordinates and Google Maps" description="Location details used internally and on the approved public page.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Street address" name="address" placeholder="Africa Avenue" />
          <Field label="Subcity" name="subcity" placeholder="Bole" />
          <Field label="City" name="city" defaultValue="Addis Ababa" required />
          <Field label="Google Maps URL" name="google_maps_url" type="url" placeholder="https://maps.google.com/..." />
          <Field label="Latitude" name="latitude" type="number" step="any" placeholder="9.0108" />
          <Field label="Longitude" name="longitude" type="number" step="any" placeholder="38.7613" />
        </div>
      </Step>

      <Step number={3} title="Building floors" description="Define the building height and current completed-floor count.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Total floors" name="total_floors" type="number" min="1" defaultValue="10" required />
          <Field label="Floors completed" name="floors_completed" type="number" min="0" defaultValue="0" required />
        </div>
      </Step>

      <Step number={4} title="Typical-floor configuration" description="Create the first residential or commercial unit type and repeat it across typical floors.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Unit type code" name="unit_type_code" placeholder="2br" required />
          <Field label="Unit type name" name="unit_type_name" placeholder="Two Bedroom Apartment" required />
          <div className="space-y-2">
            <Label htmlFor="unit_category">Category</Label>
            <select id="unit_category" name="unit_category" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>
          <Field label="Units per typical floor" name="units_per_floor" type="number" min="1" defaultValue="4" required />
          <Field label="Unit size (m²)" name="unit_size_sqm" type="number" min="1" step="0.01" defaultValue="120" required />
          <Field label="Bedrooms" name="bedrooms" type="number" min="0" defaultValue="2" />
          <Field label="Bathrooms" name="bathrooms" type="number" min="0" step="0.5" defaultValue="2" />
          <Field label="Balconies" name="balconies" type="number" min="0" defaultValue="1" />
          <Field label="Unit type description" name="unit_type_description" placeholder="Corner apartment with..." />
        </div>
      </Step>

      <Step number={5} title="Special-floor overrides" description="Optional independent layout for podium, penthouse or other special floors.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Special floor numbers" name="special_floors" placeholder="1, 10" />
          <Field label="Units per special floor" name="special_units_per_floor" type="number" min="1" defaultValue="2" />
          <Field label="Special unit size (m²)" name="special_unit_size_sqm" type="number" min="1" step="0.01" defaultValue="180" />
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Leave the floor list empty when every floor follows the typical template.</p>
      </Step>

      <Step number={6} title="Unit generation and validation" description="The database generates unique unit numbers and rejects conflicts transactionally.">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
          Typical units use <code>{'{floor}-01'}</code>, <code>{'{floor}-02'}</code> and onward. Special-floor units use an S prefix. Apartments are generated as independent inventory and cannot be split or combined.
        </div>
      </Step>

      <Step number={7} title="ETB pricing, VAT and parking price" description="The initial price becomes the first immutable history entry.">
        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Starting price (ETB)" name="starting_price" type="number" min="0" step="0.01" required />
          <Field label="VAT rate (%)" name="vat_rate" type="number" min="0" step="0.01" defaultValue="15" required />
          <Field label="Parking price (ETB)" name="parking_price" type="number" min="0" step="0.01" defaultValue="0" required />
        </div>
      </Step>

      <Step number={8} title="Marketing content and media" description="Only approved content is copied into the public publication snapshot.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Marketing title" name="marketing_title" placeholder="Elevated living in Bole" />
          <Field label="Amenities (comma separated)" name="amenities" placeholder="Generator, gym, security, rooftop" />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="short_description">Short description</Label>
            <Textarea id="short_description" name="short_description" placeholder="A concise public introduction." />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Full description</Label>
            <Textarea id="description" name="description" className="min-h-32" placeholder="Describe the project, its design and location." />
          </div>
          <Field label="Hero image URL" name="media_url" type="url" placeholder="https://..." />
          <Field label="Media title" name="media_title" placeholder="Main exterior rendering" />
          <Field label="Image alternative text" name="media_alt_text" placeholder="Exterior view of..." />
        </div>
      </Step>

      <Step number={9} title="Progress and current phase" description="Construction progress is displayed without revealing inventory quantities.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="phase">Current phase</Label>
            <select id="phase" name="phase" className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="planning_design">Planning and Design</option>
              <option value="groundbreaking">Groundbreaking</option>
              <option value="foundation_work">Foundation Work</option>
              <option value="floor_construction">Floor Construction</option>
              <option value="ready_to_handover">Ready to Handover</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <Field label="Overall progress (%)" name="progress_percent" type="number" min="0" max="100" step="0.01" defaultValue="0" />
          <Field label="Expected completion" name="expected_completion_date" type="date" />
          <div className="space-y-2 md:col-span-3">
            <Label htmlFor="progress_description">Progress note</Label>
            <Textarea id="progress_description" name="progress_description" placeholder="Current construction update." />
          </div>
        </div>
      </Step>

      <Step number={10} title="Review and publication" description="Create a draft, or publish immediately when all public information and media are approved.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="payment_plan_summary">Payment-plan summary</Label>
            <Textarea id="payment_plan_summary" name="payment_plan_summary" placeholder="30% deposit, construction installments..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offers">Current public offers</Label>
            <Textarea id="offers" name="offers" placeholder="Launch offer or leave blank." />
          </div>
        </div>
        <label className="mt-5 flex items-start gap-3 rounded-lg border p-4">
          <input type="checkbox" name="publish" className="mt-1 size-4" />
          <span>
            <span className="block text-sm font-medium">Publish after creation</span>
            <span className="mt-1 block text-xs leading-5 text-muted-foreground">
              Requires a hero image URL. The website receives only the approved publication-safe snapshot.
            </span>
          </span>
        </label>
      </Step>

      {state.error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{state.error}</p>
      ) : null}

      <div className="sticky bottom-4 flex items-center justify-between rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        <p className="hidden items-center gap-2 text-sm text-muted-foreground md:flex">
          <CheckCircle2 className="size-4 text-primary" aria-hidden="true" />
          Creation is atomic and audited.
        </p>
        <Button type="submit" size="lg" disabled={isPending}>
          {isPending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
          {isPending ? 'Creating project...' : 'Create project'}
        </Button>
      </div>
    </form>
  )
}
