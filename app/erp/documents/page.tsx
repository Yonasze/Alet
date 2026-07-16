import Link from 'next/link'
import {
  Archive,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileClock,
  FileText,
  FolderOpen,
  ShieldCheck,
} from 'lucide-react'

import { documentWorkflowAction } from './actions'
import { DocumentUploadForm } from '@/components/erp/documents/document-upload-form'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { getDocumentWorkspace, type DocumentStatus } from '@/services/documents/document-service'

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'Draft',
  under_review: 'Under review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
  archived: 'Archived',
}

function statusVariant(status: DocumentStatus): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'approved') return 'default'
  if (status === 'rejected' || status === 'expired') return 'destructive'
  if (status === 'under_review') return 'secondary'
  return 'outline'
}

function formatBytes(bytes: number | null): string {
  if (!bytes) return 'â€”'
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default async function DocumentsPage() {
  let workspace
  try {
    workspace = await getDocumentWorkspace()
  } catch (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Documents unavailable</CardTitle>
          <CardDescription>{error instanceof Error ? error.message : 'Unable to load the document register.'}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  const today = new Date()
  const expiryWindow = new Date(today)
  expiryWindow.setDate(expiryWindow.getDate() + 30)
  const approved = workspace.documents.filter((document) => document.status === 'approved').length
  const pending = workspace.documents.filter((document) => document.status === 'under_review').length
  const expiring = workspace.documents.filter((document) => {
    if (!document.expiryDate || document.status === 'archived') return false
    const expiry = new Date(`${document.expiryDate}T00:00:00`)
    return expiry >= today && expiry <= expiryWindow
  }).length

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-primary">Document control</p>
          <h2 className="mt-1 font-serif text-3xl font-semibold">Documents</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Keep contracts, drawings, permits, purchasing records, and handover files private, versioned, and approval-ready.
          </p>
        </div>
        <Badge variant="secondary"><ShieldCheck className="size-3" aria-hidden="true" /> Private project storage</Badge>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Documents', value: workspace.documents.length, icon: FolderOpen },
          { label: 'Approved', value: approved, icon: FileCheck2 },
          { label: 'Awaiting review', value: pending, icon: FileClock },
          { label: 'Expiring in 30 days', value: expiring, icon: Clock3 },
        ].map((metric) => (
          <Card key={metric.label} size="sm">
            <CardHeader className="flex-row items-start justify-between">
              <div>
                <CardDescription>{metric.label}</CardDescription>
                <CardTitle className="mt-2 text-3xl">{metric.value}</CardTitle>
              </div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <metric.icon className="size-4" aria-hidden="true" />
              </span>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Document register</CardTitle>
            <CardDescription>Current versions across organization and project records.</CardDescription>
          </CardHeader>
          <CardContent>
            {workspace.documents.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <FileText className="size-9 text-muted-foreground" aria-hidden="true" />
                <p className="mt-3 font-medium">No documents yet</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Upload the first controlled file using the form beside the register.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document</TableHead>
                    <TableHead>Project</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workspace.documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell>
                        <div className="max-w-64 whitespace-normal font-medium">{document.title}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          {document.documentNumber ?? document.category} Â· {formatBytes(document.fileSize)}
                        </div>
                      </TableCell>
                      <TableCell>{document.projectCode ?? 'Organization'}</TableCell>
                      <TableCell><Badge variant={statusVariant(document.status)}>{statusLabels[document.status]}</Badge></TableCell>
                      <TableCell>v{document.currentVersion}</TableCell>
                      <TableCell>{document.expiryDate ?? 'â€”'}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Link
                            href={`/erp/documents/${document.id}/download`}
                            className={cn(buttonVariants({ variant: 'ghost', size: 'icon-sm' }))}
                            aria-label={`Download ${document.title}`}
                          >
                            <Download className="size-4" aria-hidden="true" />
                          </Link>
                          {document.status === 'draft' || document.status === 'rejected' ? (
                            <form action={documentWorkflowAction}>
                              <input type="hidden" name="documentId" value={document.id} />
                              <Button type="submit" name="action" value="submit" variant="outline" size="xs">Submit</Button>
                            </form>
                          ) : null}
                          {document.status === 'under_review' ? (
                            <>
                              <form action={documentWorkflowAction}>
                                <input type="hidden" name="documentId" value={document.id} />
                                <Button type="submit" name="action" value="approve" size="icon-xs" aria-label={`Approve ${document.title}`}>
                                  <CheckCircle2 className="size-3" aria-hidden="true" />
                                </Button>
                              </form>
                              <form action={documentWorkflowAction}>
                                <input type="hidden" name="documentId" value={document.id} />
                                <Button type="submit" name="action" value="reject" variant="destructive" size="icon-xs" aria-label={`Reject ${document.title}`}>
                                  <Archive className="size-3" aria-hidden="true" />
                                </Button>
                              </form>
                            </>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload document</CardTitle>
            <CardDescription>New files start as drafts and remain private.</CardDescription>
          </CardHeader>
          <CardContent><DocumentUploadForm projects={workspace.projects} /></CardContent>
        </Card>
      </section>
    </div>
  )
}

