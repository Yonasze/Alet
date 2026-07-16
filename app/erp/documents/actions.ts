'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'

import {
  createDocumentRecord,
  documentCategories,
  getCurrentOrganizationId,
  removeDocumentFile,
  runDocumentAction,
  uploadDocumentFile,
  type DocumentCategory,
} from '@/services/documents/document-service'

const maxFileSize = 10 * 1024 * 1024
const allowedMimeTypes = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/octet-stream',
])

export type UploadDocumentState = {
  error?: string
  message?: string
}

function safeFileName(fileName: string): string {
  return fileName
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 140) || 'document'
}

export async function uploadDocumentAction(
  _state: UploadDocumentState,
  formData: FormData,
): Promise<UploadDocumentState> {
  const title = String(formData.get('title') ?? '').trim()
  const projectId = String(formData.get('projectId') ?? '').trim()
  const documentNumber = String(formData.get('documentNumber') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const category = String(formData.get('category') ?? '') as DocumentCategory
  const confidentiality = String(formData.get('confidentiality') ?? 'internal') as
    | 'internal'
    | 'confidential'
    | 'restricted'
  const issueDate = String(formData.get('issueDate') ?? '').trim()
  const expiryDate = String(formData.get('expiryDate') ?? '').trim()
  const file = formData.get('file')

  if (!title) return { error: 'Enter a document title.' }
  if (!documentCategories.includes(category)) return { error: 'Choose a valid document category.' }
  if (!['internal', 'confidential', 'restricted'].includes(confidentiality)) {
    return { error: 'Choose a valid confidentiality level.' }
  }
  if (!(file instanceof File) || file.size === 0) return { error: 'Choose a file to upload.' }
  if (file.size > maxFileSize) return { error: 'The file must be 10 MB or smaller.' }
  if (!allowedMimeTypes.has(file.type || 'application/octet-stream')) {
    return { error: 'Upload a PDF, image, Word, Excel, or supported technical file.' }
  }
  if (issueDate && expiryDate && expiryDate < issueDate) {
    return { error: 'The expiry date cannot be before the issue date.' }
  }

  const documentId = randomUUID()
  let storagePath = ''

  try {
    const organizationId = await getCurrentOrganizationId()
    storagePath = [
      organizationId,
      projectId || 'organization',
      documentId,
      'v1',
      safeFileName(file.name),
    ].join('/')

    await uploadDocumentFile(storagePath, file)
    await createDocumentRecord({
      id: documentId,
      projectId: projectId || undefined,
      documentNumber: documentNumber || undefined,
      title,
      description: description || undefined,
      category,
      confidentiality,
      issueDate: issueDate || undefined,
      expiryDate: expiryDate || undefined,
      storagePath,
      fileName: file.name,
      mimeType: file.type || 'application/octet-stream',
      sizeBytes: file.size,
    })
  } catch (error) {
    if (storagePath) await removeDocumentFile(storagePath).catch(() => undefined)
    return { error: error instanceof Error ? error.message : 'Unable to upload the document.' }
  }

  revalidatePath('/erp/documents')
  return { message: 'Document uploaded as a draft.' }
}

export async function documentWorkflowAction(formData: FormData): Promise<void> {
  const documentId = String(formData.get('documentId') ?? '')
  const action = String(formData.get('action') ?? '')
  if (!documentId || !['submit', 'approve', 'reject', 'archive'].includes(action)) return
  await runDocumentAction(documentId, action)
  revalidatePath('/erp/documents')
}

