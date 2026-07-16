'use client'

import { useActionState } from 'react'
import { useFormStatus } from 'react-dom'
import { FileUp, LoaderCircle } from 'lucide-react'

import {
  uploadDocumentAction,
  type UploadDocumentState,
} from '@/app/erp/documents/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  documentCategories,
  type DocumentProject,
} from '@/services/documents/document-service'

const initialState: UploadDocumentState = {}

const categoryLabels: Record<(typeof documentCategories)[number], string> = {
  legal: 'Legal & title',
  design: 'Design & drawings',
  procurement: 'Procurement',
  inventory: 'Inventory',
  construction: 'Construction',
  sales: 'Sales & customers',
  finance: 'Finance',
  contractor: 'Contractors',
  compliance: 'Permits & compliance',
  handover: 'Handover',
  other: 'Other',
}

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <Button type="submit" disabled={pending}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden="true" /> : <FileUp className="size-4" aria-hidden="true" />}
      {pending ? 'Uploadingâ€¦' : 'Upload document'}
    </Button>
  )
}

type DocumentUploadFormProps = {
  projects: DocumentProject[]
}

export function DocumentUploadForm({ projects }: DocumentUploadFormProps) {
  const [state, formAction] = useActionState(uploadDocumentAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="document-title">Title</Label>
          <Input id="document-title" name="title" placeholder="e.g. Tower A structural drawing" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-number">Reference number</Label>
          <Input id="document-number" name="documentNumber" placeholder="DOC-2026-001" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-project">Project</Label>
          <select
            id="document-project"
            name="projectId"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue=""
          >
            <option value="">Organization-wide document</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.code} â€” {project.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-category">Category</Label>
          <select
            id="document-category"
            name="category"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue="legal"
          >
            {documentCategories.map((category) => (
              <option key={category} value={category}>{categoryLabels[category]}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-confidentiality">Access level</Label>
          <select
            id="document-confidentiality"
            name="confidentiality"
            className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            defaultValue="internal"
          >
            <option value="internal">Internal</option>
            <option value="confidential">Confidential</option>
            <option value="restricted">Restricted</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-issue-date">Issue date</Label>
          <Input id="document-issue-date" name="issueDate" type="date" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-expiry-date">Expiry date</Label>
          <Input id="document-expiry-date" name="expiryDate" type="date" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="document-description">Description</Label>
          <Textarea id="document-description" name="description" placeholder="Purpose, scope, or revision notes" rows={3} />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="document-file">File</Label>
          <Input
            id="document-file"
            name="file"
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xls,.xlsx,.dwg"
            required
          />
          <p className="text-xs text-muted-foreground">PDF, image, Word, Excel, or DWG; maximum 10 MB.</p>
        </div>
      </div>

      {state.error ? <p role="alert" className="text-sm text-destructive">{state.error}</p> : null}
      {state.message ? <p role="status" className="text-sm text-primary">{state.message}</p> : null}

      <SubmitButton />
    </form>
  )
}

