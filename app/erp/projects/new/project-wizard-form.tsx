'use client'

import { useActionState, useState } from 'react'
import { CheckCircle2, Loader2, Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { createProjectAction, type ProjectWizardState } from './actions'

const initialState: ProjectWizardState = {}

type UnitDraft = {
  id: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br' | 'commercial'
  bathrooms: number
  balconies: number
  net_area_sqm: number
  gross_area_sqm: number
  price: number
  description: string
}

type SpecialFloorDraft = {
  id: string
  floor_number: number
  units: UnitDraft[]
}

const unitLabels: Record<UnitDraft['type'], string> = {
  studio: 'Studio',
  '1br': '1 Bedroom',
  '2br': '2 Bedroom',
  '3br': '3 Bedroom',
  '4br': '4 Bedroom',
  commercial: 'Commercial',
}

function newUnit(id: string, type: UnitDraft['type'] = 'studio'): UnitDraft {
  return {
    id,
    type,
    bathrooms: type === 'studio' ? 1 : 2,
    balconies: 0,
    net_area_sqm: type === 'studio' ? 45 : 100,
    gross_area_sqm: type === 'studio' ? 60 : 125,
    price: 0,
    description: '',
  }
}

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

type UnitEditorProps = {
  unit: UnitDraft
  index: number
  canRemove: boolean
  onChange: (unit: UnitDraft) => void
  onRemove: () => void
}

function UnitEditor({ unit, index, canRemove, onChange, onRemove }: UnitEditorProps) {
  const updateNumber = (key: 'bathrooms' | 'balconies' | 'net_area_sqm' | 'gross_area_sqm' | 'price', value: string) => {
    onChange({ ...unit, [key]: Number(value) })
  }

  const invalidArea = unit.gross_area_sqm < unit.net_area_sqm

  return (
    <div className="rounded-xl border bg-background p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="font-medium">Unit {index + 1}</p>
        <Button type="button" variant="ghost" size="sm" onClick={onRemove} disabled={!canRemove}>
          <Trash2 className="size-4" aria-hidden="true" />
          Remove
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Unit type</Label>
          <select
            value={unit.type}
            onChange={(event) => onChange({ ...unit, type: event.target.value as UnitDraft['type'] })}
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
          >
            {Object.entries(unitLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label>Net area (m²)</Label>
          <Input type="number" min="1" step="0.01" value={unit.net_area_sqm} onChange={(e) => updateNumber('net_area_sqm', e.target.value)} required />
          <p className="text-xs text-muted-foreground">Area inside the unit itself.</p>
        </div>
        <div className="space-y-2">
          <Label>Gross area (m²)</Label>
          <Input
            type="number"
            min={unit.net_area_sqm}
            step="0.01"
            value={unit.gross_area_sqm}
            onChange={(e) => updateNumber('gross_area_sqm', e.target.value)}
            aria-invalid={invalidArea}
            required
          />
          <p className="text-xs text-muted-foreground">Includes corridors, lobby, common areas and parking allocation.</p>
        </div>
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Input type="number" min="0" step="0.5" value={unit.bathrooms} onChange={(e) => updateNumber('bathrooms', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Balconies</Label>
          <Input type="number" min="0" value={unit.balconies} onChange={(e) => updateNumber('balconies', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Unit price (ETB)</Label>
          <Input type="number" min="0" step="0.01" value={unit.price} onChange={(e) => updateNumber('price', e.target.value)} required />
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label>Additional description</Label>
          <Textarea
            value={unit.description}
            onChange={(event) => onChange({ ...unit, description: event.target.value })}
            placeholder="Orientation, view, layout, terrace or other details specific to this unit position."
          />
        </div>
      </div>
      {invalidArea ? <p className="mt-3 text-sm text-destructive">Gross area cannot be smaller than net area.</p> : null}
    </div>
  )
}

export function ProjectWizardForm() {
  const [state, formAction, isPending] = useActionState(createProjectAction, initialState)
  const [typicalUnits, setTypicalUnits] = useState<UnitDraft[]>([
    newUnit('typical-1', 'studio'),
    newUnit('typical-2', '2br'),
  ])
  const [specialFloors, setSpecialFloors] = useState<SpecialFloorDraft[]>([])

  const addTypicalUnit = () => {
    setTypicalUnits((units) => [...units, newUnit(`typical-${Date.now()}`, '1br')])
  }

  const updateTypicalUnit = (id: string, unit: UnitDraft) => {
    setTypicalUnits((units) => units.map((item) => item.id === id ? unit : item))
  }

  const addSpecialFloor = () => {
    const id = `special-${Date.now()}`
    setSpecialFloors((floors) => [
      ...floors,
      { id, floor_number: floors.length + 1, units: [newUnit(`${id}-unit-1`, 'studio')] },
    ])
  }

  const updateSpecialFloor = (id: string, update: (floor: SpecialFloorDraft) => SpecialFloorDraft) => {
    setSpecialFloors((floors) => floors.map((floor) => floor.id === id ? update(floor) : floor))
  }

  const serializedTypicalUnits = typicalUnits.map(({ id: _id, ...unit }) => unit)
  const serializedSpecialFloors = specialFloors.map(({ id: _id, units, ...floor }) => ({
    ...floor,
    units: units.map(({ id: _unitId, ...unit }) => unit),
  }))

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="typical_units" value={JSON.stringify(serializedTypicalUnits)} />
      <input type="hidden" name="special_floor_configurations" value={JSON.stringify(serializedSpecialFloors)} />

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

      <Step number={4} title="Typical-floor configuration" description="Build the exact mixed layout repeated on every typical floor. Add as many studio, 1BR, 2BR, 3BR, 4BR or commercial units as needed.">
        <div className="space-y-4">
          {typicalUnits.map((unit, index) => (
            <UnitEditor
              key={unit.id}
              unit={unit}
              index={index}
              canRemove={typicalUnits.length > 1}
              onChange={(next) => updateTypicalUnit(unit.id, next)}
              onRemove={() => setTypicalUnits((units) => units.filter((item) => item.id !== unit.id))}
            />
          ))}
          <Button type="button" variant="outline" onClick={addTypicalUnit}>
            <Plus className="size-4" aria-hidden="true" />
            Add unit to typical floor
          </Button>
        </div>
      </Step>

      <Step number={5} title="Special-floor configurations" description="Each special floor has its own independent layout and can contain a different mix and number of units.">
        <div className="space-y-5">
          {specialFloors.map((floor) => (
            <div key={floor.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                <div className="w-48 space-y-2">
                  <Label>Special floor number</Label>
                  <Input
                    type="number"
                    min="1"
                    value={floor.floor_number}
                    onChange={(event) => updateSpecialFloor(floor.id, (item) => ({ ...item, floor_number: Number(event.target.value) }))}
                    required
                  />
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setSpecialFloors((floors) => floors.filter((item) => item.id !== floor.id))}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Remove special floor
                </Button>
              </div>

              <div className="space-y-4">
                {floor.units.map((unit, index) => (
                  <UnitEditor
                    key={unit.id}
                    unit={unit}
                    index={index}
                    canRemove={floor.units.length > 1}
                    onChange={(next) => updateSpecialFloor(floor.id, (item) => ({
                      ...item,
                      units: item.units.map((current) => current.id === unit.id ? next : current),
                    }))}
                    onRemove={() => updateSpecialFloor(floor.id, (item) => ({
                      ...item,
                      units: item.units.filter((current) => current.id !== unit.id),
                    }))}
                  />
                ))}
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => updateSpecialFloor(floor.id, (item) => ({
                    ...item,
                    units: [...item.units, newUnit(`${floor.id}-unit-${Date.now()}`, '1br')],
                  }))}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add unit to this special floor
                </Button>
              </div>
            </div>
          ))}
          <Button type="button" variant="outline" onClick={addSpecialFloor}>
            <Plus className="size-4" aria-hidden="true" />
            Add special floor
          </Button>
          {specialFloors.length === 0 ? <p className="text-sm text-muted-foreground">No special floors. Every floor currently uses the typical layout.</p> : null}
        </div>
      </Step>

      <Step number={6} title="Unit generation and validation" description="The database creates one inventory record per configured position on each floor and rejects duplicate unit numbers or invalid areas.">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
          Typical units use floor and position numbers such as <code>5-01</code>. Special-floor units use an S prefix such as <code>10-S01</code>. Apartments remain independent inventory and cannot be split or combined.
        </div>
      </Step>

      <Step number={7} title="ETB pricing and VAT" description="Enter each unit position's ETB price above. Gross area includes corridors, lobby, common areas and the parking allocation, so parking is not priced separately.">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="VAT rate (%)" name="vat_rate" type="number" min="0" step="0.01" defaultValue="15" required />
          <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Price history starts from the ETB values entered in the typical and special floor unit rows. Later price changes create new history records.
          </div>
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
