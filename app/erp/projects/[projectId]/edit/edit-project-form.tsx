'use client'

import { type FormEvent, useActionState, useState, useTransition } from 'react'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

import { updateProjectAction, type ProjectEditState } from './actions'

type EditProjectFormProps = {
  projectId: string
  project: Record<string, unknown>
  unitTypes: Array<Record<string, unknown>>
}

type UnitTypeDraft = {
  id: string
  code: string
  name: string
  description: string
}

type UploadDescriptor = {
  client_key: string
  input_name: string
  file: File
  purpose: 'building' | 'location' | 'unit'
  unit_type_id?: string
  unit_type_code?: string
  title: string
  alt_text: string
}

const initialState: ProjectEditState = {}
const imageTypes = ['image/jpeg', 'image/png', 'image/webp']

function value(record: Record<string, unknown>, key: string) {
  const item = record[key]
  return typeof item === 'string' || typeof item === 'number' ? String(item) : ''
}

function isoDate(record: Record<string, unknown>, key: string) {
  const item = record[key]
  return typeof item === 'string' ? item.slice(0, 10) : ''
}

export function EditProjectForm({ projectId, project, unitTypes }: EditProjectFormProps) {
  const [state, formAction, isPending] = useActionState(updateProjectAction.bind(null, projectId), initialState)
  const [, startTransition] = useTransition()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string>()
  const [unitTypeDrafts, setUnitTypeDrafts] = useState<UnitTypeDraft[]>(() => unitTypes.map((unitType) => ({
    id: value(unitType, 'id'),
    code: value(unitType, 'code'),
    name: value(unitType, 'name'),
    description: value(unitType, 'description'),
  })))

  const updateUnitType = (id: string, patch: Partial<UnitTypeDraft>) => {
    setUnitTypeDrafts((items) => items.map((item) => item.id === id ? { ...item, ...patch } : item))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!form.reportValidity()) return

    const formData = new FormData(form)
    const descriptors: UploadDescriptor[] = []

    const addFile = (
      inputName: string,
      purpose: UploadDescriptor['purpose'],
      metadata: Omit<UploadDescriptor, 'client_key' | 'input_name' | 'file' | 'purpose'>,
      file: File,
    ) => {
      if (!imageTypes.includes(file.type) || file.size > 10 * 1024 * 1024) {
        throw new Error(`${file.name} must be JPG, PNG or WebP and no larger than 10 MB.`)
      }
      descriptors.push({
        client_key: `${inputName}_${descriptors.length}`,
        input_name: inputName,
        file,
        purpose,
        ...metadata,
      })
    }

    setUploadError(undefined)
    setIsUploading(true)
    let preparedPaths: string[] = []

    try {
      const buildingFiles = formData.getAll('building_images').filter((item): item is File => item instanceof File && item.size > 0)
      if (buildingFiles.length > 0 && (buildingFiles.length < 3 || buildingFiles.length > 4)) {
        throw new Error('Choose 3 or 4 building images when replacing the project building gallery.')
      }
      buildingFiles.forEach((file, index) => addFile('building_images', 'building', {
        title: `Building image ${index + 1}`,
        alt_text: `Project building view ${index + 1}`,
      }, file))

      const locationFile = formData.get('location_image')
      if (locationFile instanceof File && locationFile.size > 0) {
        addFile('location_image', 'location', {
          title: 'Location image',
          alt_text: 'Project location and surrounding area',
        }, locationFile)
      }

      for (const unitType of unitTypeDrafts) {
        const inputName = `unit_image_${unitType.id}`
        const unitFile = formData.get(inputName)
        if (unitFile instanceof File && unitFile.size > 0) {
          addFile(inputName, 'unit', {
            unit_type_id: unitType.id,
            unit_type_code: unitType.code,
            title: `${unitType.name} configuration`,
            alt_text: `${unitType.name} unit configuration`,
          }, unitFile)
        }
      }

      const uploadedMedia = []
      if (descriptors.length > 0) {
        const tokenResponse = await fetch('/api/project-media/upload-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            files: descriptors.map((item) => ({
              client_key: item.client_key,
              file_name: item.file.name,
              content_type: item.file.type,
              size: item.file.size,
            })),
          }),
        })
        const tokenResult = await tokenResponse.json() as {
          message?: string
          uploads?: Array<{ client_key: string; storage_path: string; signed_url: string }>
        }
        if (!tokenResponse.ok || !tokenResult.uploads) {
          throw new Error(tokenResult.message ?? 'Unable to prepare the image uploads.')
        }

        preparedPaths = tokenResult.uploads.map((item) => item.storage_path)
        const uploadByKey = new Map(tokenResult.uploads.map((item) => [item.client_key, item]))
        for (const descriptor of descriptors) {
          const upload = uploadByKey.get(descriptor.client_key)
          if (!upload) throw new Error(`Upload preparation failed for ${descriptor.file.name}.`)
          const uploadBody = new FormData()
          uploadBody.append('cacheControl', '3600')
          uploadBody.append('', descriptor.file)
          const uploadResponse = await fetch(upload.signed_url, {
            method: 'PUT',
            headers: { 'x-upsert': 'false' },
            body: uploadBody,
          })
          if (!uploadResponse.ok) {
            throw new Error(`Unable to upload ${descriptor.file.name}. Please try again.`)
          }
          uploadedMedia.push({
            storage_path: upload.storage_path,
            title: descriptor.title,
            alt_text: descriptor.alt_text,
            purpose: descriptor.purpose,
            unit_type_id: descriptor.unit_type_id,
            unit_type_code: descriptor.unit_type_code,
          })
        }
      }

      for (const descriptor of descriptors) formData.delete(descriptor.input_name)
      formData.set('uploaded_media', JSON.stringify(uploadedMedia))
      formData.set('unit_type_updates', JSON.stringify(unitTypeDrafts.map(({ id, name, description }) => ({ id, name, description }))))
      startTransition(() => formAction(formData))
    } catch (error) {
      if (preparedPaths.length > 0) {
        await fetch('/api/project-media/upload-token', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paths: preparedPaths }),
        }).catch(() => undefined)
      }
      setUploadError(error instanceof Error ? error.message : 'Unable to upload the project images.')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
            <Link href={`/erp/projects/${projectId}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Project workspace
            </Link>
          </Button>
          <p className="text-sm font-medium text-primary">Edit project</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">{value(project, 'name')}</h2>
        </div>
        <Button type="submit" disabled={isPending || isUploading}>
          {isPending || isUploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {isUploading ? 'Uploading images...' : isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>These details feed the ERP workspace and, when published, the public website snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2"><Label htmlFor="name">Project name</Label><Input id="name" name="name" defaultValue={value(project, 'name')} required /></div>
          <div className="space-y-2"><Label htmlFor="slug">Public slug</Label><Input id="slug" name="slug" defaultValue={value(project, 'slug')} /></div>
          <div className="space-y-2"><Label htmlFor="marketing_title">Marketing title</Label><Input id="marketing_title" name="marketing_title" defaultValue={value(project, 'marketing_title')} /></div>
          <div className="space-y-2"><Label htmlFor="amenities">Amenities</Label><Input id="amenities" name="amenities" defaultValue={Array.isArray(project.amenities) ? project.amenities.join(', ') : ''} /></div>
          <div className="space-y-2"><Label htmlFor="address">Street address</Label><Input id="address" name="address" defaultValue={value(project, 'address')} /></div>
          <div className="space-y-2"><Label htmlFor="subcity">Subcity</Label><Input id="subcity" name="subcity" defaultValue={value(project, 'subcity')} /></div>
          <div className="space-y-2"><Label htmlFor="city">City</Label><Input id="city" name="city" defaultValue={value(project, 'city') || 'Addis Ababa'} required /></div>
          <div className="space-y-2"><Label htmlFor="google_maps_url">Google Maps URL</Label><Input id="google_maps_url" name="google_maps_url" type="url" defaultValue={value(project, 'google_maps_url')} /></div>
          <div className="space-y-2"><Label htmlFor="latitude">Latitude</Label><Input id="latitude" name="latitude" type="number" step="any" defaultValue={value(project, 'latitude')} /></div>
          <div className="space-y-2"><Label htmlFor="longitude">Longitude</Label><Input id="longitude" name="longitude" type="number" step="any" defaultValue={value(project, 'longitude')} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="short_description">Short description</Label><Textarea id="short_description" name="short_description" defaultValue={value(project, 'short_description')} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Full description</Label><Textarea id="description" name="description" className="min-h-32" defaultValue={value(project, 'description')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Progress and publication text</CardTitle>
          <CardDescription>Update construction phase, public completion date, payment plan and offers.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="phase">Current phase</Label>
            <select id="phase" name="phase" defaultValue={value(project, 'phase') || 'planning_design'} className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm">
              <option value="planning_design">Planning and Design</option>
              <option value="groundbreaking">Groundbreaking</option>
              <option value="foundation_work">Foundation Work</option>
              <option value="floor_construction">Floor Construction</option>
              <option value="ready_to_handover">Ready to Handover</option>
              <option value="completed">Completed</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="space-y-2"><Label htmlFor="floors_completed">Floors completed</Label><Input id="floors_completed" name="floors_completed" type="number" min="0" max={value(project, 'total_floors')} defaultValue={value(project, 'floors_completed')} /></div>
          <div className="space-y-2"><Label htmlFor="expected_completion_date">Expected completion</Label><Input id="expected_completion_date" name="expected_completion_date" type="date" defaultValue={isoDate(project, 'expected_completion_date')} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="payment_plan_summary">Payment-plan summary</Label><Textarea id="payment_plan_summary" name="payment_plan_summary" defaultValue={value(project, 'payment_plan_summary')} /></div>
          <div className="space-y-2 md:col-span-2"><Label htmlFor="offers">Current public offers</Label><Textarea id="offers" name="offers" defaultValue={value(project, 'offers')} /></div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Unit type descriptions and images</CardTitle>
          <CardDescription>Update public unit wording and replace the image shown for each unit type.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {unitTypeDrafts.map((unitType) => (
            <div key={unitType.id} className="rounded-xl border p-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Unit type name</Label>
                  <Input value={unitType.name} onChange={(event) => updateUnitType(unitType.id, { name: event.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`unit_image_${unitType.id}`}>Replace unit image</Label>
                  <Input id={`unit_image_${unitType.id}`} name={`unit_image_${unitType.id}`} type="file" accept="image/jpeg,image/png,image/webp" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Unit type description</Label>
                  <Textarea value={unitType.description} onChange={(event) => updateUnitType(unitType.id, { description: event.target.value })} placeholder="Describe the layout, view, orientation or other sales-relevant details." />
                </div>
              </div>
            </div>
          ))}
          {unitTypeDrafts.length === 0 ? <p className="text-sm text-muted-foreground">No unit types are available for editing yet.</p> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Replace public images</CardTitle>
          <CardDescription>Use desktop uploads. Existing public images are replaced only when you choose new files.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="building_images">Replace building gallery</Label>
            <Input id="building_images" name="building_images" type="file" accept="image/jpeg,image/png,image/webp" multiple />
            <p className="text-xs text-muted-foreground">Choose 3 or 4 building images when replacing the gallery.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location_image">Replace location image</Label>
            <Input id="location_image" name="location_image" type="file" accept="image/jpeg,image/png,image/webp" />
            <p className="text-xs text-muted-foreground">Use a site map, aerial view or surrounding-area image.</p>
          </div>
        </CardContent>
      </Card>

      {uploadError || state.error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{uploadError ?? state.error}</p>
      ) : null}

      <div className="sticky bottom-4 flex justify-end rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur">
        <Button type="submit" size="lg" disabled={isPending || isUploading}>
          {isPending || isUploading ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <Save className="size-4" aria-hidden="true" />}
          {isUploading ? 'Uploading images...' : isPending ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </form>
  )
}
