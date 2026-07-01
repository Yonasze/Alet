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
  unit_id_pattern: string
  type: 'studio' | '1br' | '2br' | '3br' | '4br' | 'commercial'
  bathrooms: string
  balconies: string
  net_area_sqm: string
  gross_area_sqm: string
  price: string
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

function unitLetter(index: number) {
  return String.fromCharCode(65 + (index % 26))
}

function newUnit(
  id: string,
  type: UnitDraft['type'] = 'studio',
  unitIdPattern = 'T-{floor}A',
): UnitDraft {
  return {
    id,
    unit_id_pattern: unitIdPattern,
    type,
    bathrooms: type === 'studio' ? '1' : '2',
    balconies: '0',
    net_area_sqm: type === 'studio' ? '45' : '100',
    gross_area_sqm: type === 'studio' ? '60' : '125',
    price: '',
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
  const updateValue = (key: 'bathrooms' | 'balconies' | 'net_area_sqm' | 'gross_area_sqm', value: string) => {
    onChange({ ...unit, [key]: value })
  }

  const netArea = Number(unit.net_area_sqm)
  const grossArea = Number(unit.gross_area_sqm)
  const invalidArea = unit.net_area_sqm !== '' && unit.gross_area_sqm !== '' && grossArea < netArea

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
          <Label>Editable unit ID</Label>
          <Input
            value={unit.unit_id_pattern}
            onChange={(event) => onChange({ ...unit, unit_id_pattern: event.target.value })}
            placeholder="T-{floor}A"
            required
          />
          <p className="text-xs text-muted-foreground">Keep {'{floor}'} in the ID. Example: T-3A.</p>
        </div>
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
          <Input type="number" min="1" step="0.01" value={unit.net_area_sqm} onChange={(e) => updateValue('net_area_sqm', e.target.value)} required />
          <p className="text-xs text-muted-foreground">Area inside the unit itself.</p>
        </div>
        <div className="space-y-2">
          <Label>Gross area (m²)</Label>
          <Input
            type="number"
            min={unit.net_area_sqm || '0'}
            step="0.01"
            value={unit.gross_area_sqm}
            onChange={(e) => updateValue('gross_area_sqm', e.target.value)}
            aria-invalid={invalidArea}
            required
          />
          <p className="text-xs text-muted-foreground">Includes corridors, lobby, common areas and parking allocation.</p>
        </div>
        <div className="space-y-2">
          <Label>Bathrooms</Label>
          <Input type="number" min="0" step="0.5" value={unit.bathrooms} onChange={(e) => updateValue('bathrooms', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Balconies</Label>
          <Input type="number" min="0" value={unit.balconies} onChange={(e) => updateValue('balconies', e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Total selling price incl. VAT (ETB)</Label>
          <Input
            type="text"
            inputMode="numeric"
            value={unit.price}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '')
              onChange({ ...unit, price: digits === '' ? '' : Number(digits).toLocaleString('en-US') })
            }}
            placeholder="12,500,000"
            required
          />
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
  const [highestFloorInput, setHighestFloorInput] = useState('10')
  const totalFloors = Math.max(0, Number.parseInt(highestFloorInput, 10) || 0)
  const [typicalFloorStart, setTypicalFloorStart] = useState<number | ''>(0)
  const [typicalFloorEnd, setTypicalFloorEnd] = useState<number | ''>(10)
  const [newSpecialFloor, setNewSpecialFloor] = useState(0)
  const [typicalUnits, setTypicalUnits] = useState<UnitDraft[]>([
    newUnit('typical-1', 'studio', 'T-{floor}A'),
    newUnit('typical-2', '2br', 'T-{floor}B'),
  ])
  const [specialFloors, setSpecialFloors] = useState<SpecialFloorDraft[]>([])

  const addTypicalUnit = () => {
    setTypicalUnits((units) => [
      ...units,
      newUnit(`typical-${Date.now()}`, '1br', `T-{floor}${unitLetter(units.length)}`),
    ])
  }

  const updateTypicalUnit = (id: string, unit: UnitDraft) => {
    setTypicalUnits((units) => units.map((item) => item.id === id ? unit : item))
  }

  const addSpecialFloor = () => {
    setSpecialFloors((floors) => {
      if (floors.some((floor) => floor.floor_number === newSpecialFloor)) return floors

      const id = `special-${newSpecialFloor}-${Date.now()}`
      return [...floors, {
        id,
        floor_number: newSpecialFloor,
        units: [newUnit(`${id}-unit-1`, 'studio', 'S-{floor}A')],
      }].sort((a, b) => a.floor_number - b.floor_number)
    })
  }

  const removeSpecialFloor = (floorNumber: number) => {
    setSpecialFloors((floors) => floors.filter((floor) => floor.floor_number !== floorNumber))
  }

  const updateSpecialFloor = (id: string, update: (floor: SpecialFloorDraft) => SpecialFloorDraft) => {
    setSpecialFloors((floors) => floors.map((floor) => floor.id === id ? update(floor) : floor))
  }

  const allSellingPrices = [
    ...typicalUnits.map((unit) => Number(unit.price.replaceAll(',', ''))),
    ...specialFloors.flatMap((floor) => floor.units.map((unit) => Number(unit.price.replaceAll(',', '')))),
  ].filter((price) => Number.isFinite(price) && price > 0)
  const websiteStartingPrice = allSellingPrices.length > 0 ? Math.min(...allSellingPrices) : 0
  const floorOptions = Array.from({ length: totalFloors + 1 }, (_, index) => index)
  const pricingRows = [
    ...typicalUnits.map((unit) => ({ layout: 'Typical', unit })),
    ...specialFloors.flatMap((floor) => floor.units.map((unit) => ({
      layout: floor.floor_number === 0 ? 'Ground special' : `Floor ${floor.floor_number} special`,
      unit,
    }))),
  ]

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

      <Step number={3} title="Building floors" description="Enter the highest numbered floor. Ground Floor is floor 0 and is included automatically.">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="total_floors">Highest floor number</Label>
            <Input
              id="total_floors"
              name="total_floors"
              type="text"
              inputMode="numeric"
              pattern="[0-9]+"
              value={highestFloorInput}
              onChange={(event) => {
                const raw = event.target.value.replace(/\D/g, '')
                setHighestFloorInput(raw)
                if (raw !== '') {
                  const next = Number.parseInt(raw, 10)
                  setTypicalFloorEnd((current) => current === '' ? '' : Math.min(Math.max(current, 0), next))
                  setTypicalFloorStart((current) => current === '' ? '' : Math.min(Math.max(current, 0), next))
                  setSpecialFloors((floors) => floors.filter((floor) => floor.floor_number <= next))
                  setNewSpecialFloor((current) => Math.min(current, next))
                }
              }}
              placeholder="20"
              required
            />
            <p className="text-xs text-muted-foreground">Accepts any whole number such as 10, 20 or 35.</p>
          </div>
          <Field label="Floors completed" name="floors_completed" type="number" min="0" defaultValue="0" required />
        </div>
      </Step>

      <Step number={4} title="Typical-floor configuration" description="First choose which consecutive floors use the typical layout, then build the mixed unit layout repeated across that range.">
        <div className="mb-6 grid gap-4 rounded-xl border bg-muted/30 p-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="typical_floor_start">Typical layout starts on floor</Label>
            <Input
              id="typical_floor_start"
              name="typical_floor_start"
              type="number"
              min="0"
              max={totalFloors}
              value={typicalFloorStart}
              onChange={(event) => setTypicalFloorStart(event.target.value === '' ? '' : Number(event.target.value))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="typical_floor_end">Typical layout ends on floor</Label>
            <Input
              id="typical_floor_end"
              name="typical_floor_end"
              type="number"
              min={typicalFloorStart === '' ? 0 : typicalFloorStart}
              max={totalFloors}
              value={typicalFloorEnd}
              onChange={(event) => setTypicalFloorEnd(event.target.value === '' ? '' : Number(event.target.value))}
              required
            />
          </div>
          <p className="text-xs text-muted-foreground md:col-span-2">
            Example: 0 to 10 repeats this layout from Ground Floor through Floor 10. A selected special floor overrides the typical layout.
          </p>
        </div>
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

      <Step number={5} title="Special-floor configurations" description="Optional: select Ground Floor or any nonconsecutive numbered floors. Every selected floor gets an independent layout.">
        <div className="space-y-5">
          <div className="flex flex-wrap items-end gap-3 rounded-xl border bg-muted/30 p-4">
            <div className="min-w-56 space-y-2">
              <Label htmlFor="new_special_floor">Floor level</Label>
              <select
                id="new_special_floor"
                value={newSpecialFloor}
                onChange={(event) => setNewSpecialFloor(Number(event.target.value))}
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              >
                {floorOptions.map((floorNumber) => (
                  <option
                    key={floorNumber}
                    value={floorNumber}
                    disabled={specialFloors.some((floor) => floor.floor_number === floorNumber)}
                  >
                    {floorNumber === 0 ? 'Ground Floor (0)' : `Floor ${floorNumber}`}
                  </option>
                ))}
              </select>
            </div>
            <Button type="button" variant="outline" onClick={addSpecialFloor}>
              <Plus className="size-4" aria-hidden="true" />
              Add special floor
            </Button>
            <p className="w-full text-xs text-muted-foreground">
              Special floors are optional. Add Ground, Floor 1, Floor 10 or any other nonconsecutive levels one at a time.
            </p>
          </div>

          {specialFloors.map((floor) => (
            <div key={floor.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{floor.floor_number === 0 ? 'Ground Floor' : `Floor ${floor.floor_number}`}</p>
                  <p className="text-xs text-muted-foreground">Independent special-floor layout</p>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeSpecialFloor(floor.floor_number)}>
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
                    units: [
                      ...item.units,
                      newUnit(
                        `${floor.id}-unit-${Date.now()}`,
                        '1br',
                        `S-{floor}${unitLetter(item.units.length)}`,
                      ),
                    ],
                  }))}
                >
                  <Plus className="size-4" aria-hidden="true" />
                  Add unit to this special floor
                </Button>
              </div>
            </div>
          ))}
          {specialFloors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No special floors added. Floors 1 through the highest floor must be covered by the typical range. Ground Floor may be left without units for parking or a lobby.
            </p>
          ) : null}
        </div>
      </Step>

      <Step number={6} title="Unit generation and validation" description="The database creates one inventory record per configured position on each floor and rejects duplicate unit numbers or invalid areas.">
        <div className="rounded-lg border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
          Editable unit IDs use the floor placeholder. For example, <code>T-{'{floor}'}A</code> becomes <code>T-3A</code> on Floor 3, while <code>S-{'{floor}'}A</code> becomes <code>S-GA</code> on Ground Floor. IDs must remain unique within the project.
        </div>
      </Step>

      <Step number={7} title="ETB price analysis" description="Selling prices entered in each unit specification already include VAT. This section calculates price per gross square metre.">
        <div className="space-y-4">
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/60">
                <tr>
                  <th className="px-4 py-3">Layout</th>
                  <th className="px-4 py-3">Unit ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Gross area</th>
                  <th className="px-4 py-3">Selling price incl. VAT</th>
                  <th className="px-4 py-3">ETB / gross m²</th>
                </tr>
              </thead>
              <tbody>
                {pricingRows.map(({ layout, unit }) => (
                  <tr key={`${layout}-${unit.id}`} className="border-t">
                    <td className="px-4 py-3">{layout}</td>
                    <td className="px-4 py-3 font-medium">{unit.unit_id_pattern}</td>
                    <td className="px-4 py-3">{unitLabels[unit.type]}</td>
                    <td className="px-4 py-3">{unit.gross_area_sqm} m²</td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(Number(unit.price.replaceAll(',', '')) || 0)}
                    </td>
                    <td className="px-4 py-3">
                      {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(
                        Number(unit.gross_area_sqm) > 0
                          ? (Number(unit.price.replaceAll(',', '')) || 0) / Number(unit.gross_area_sqm)
                          : 0,
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
            <p className="text-sm text-muted-foreground">Public website starting price</p>
            <p className="mt-2 font-serif text-2xl font-semibold">
              {new Intl.NumberFormat('en-ET', { style: 'currency', currency: 'ETB', maximumFractionDigits: 0 }).format(websiteStartingPrice)}
            </p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              The public project page shows one summary card per unit type—not every individual unit—and uses the lowest configured selling price as “Starting price.”
            </p>
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
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="project_images">Project images</Label>
            <Input
              id="project_images"
              name="project_images"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              required
            />
            <p className="text-xs leading-5 text-muted-foreground">
              Upload 3 or 4 images from your computer. Accepted formats: JPG, PNG and WebP; maximum 10 MB per image. The first image is used as the main project image.
            </p>
          </div>
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
              Requires 3 or 4 uploaded project images. The website receives only the approved publication-safe snapshot.
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
