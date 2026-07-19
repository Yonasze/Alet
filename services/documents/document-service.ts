import { cookies } from 'next/headers'

import { getPublicSupabaseConfig } from '@/lib/supabase/public-config'

import type {
  DocumentCategory,
  DocumentProject,
  DocumentStatus,
} from '@/services/documents/document-types'

export type { DocumentStatus } from '@/services/documents/document-types'

const sessionCookieName = 'alet-erp-session'
const documentBucket = 'erp-documents'

export type ErpDocument = {
  id: string
  organizationId: string
  projectId: string | null
  projectName: string | null
  projectCode: string | null
  documentNumber: string | null
  title: string
  description: string | null
  category: DocumentCategory
  status: DocumentStatus
  confidentiality: 'internal' | 'confidential' | 'restricted'
  currentVersion: number
  issueDate: string | null
  expiryDate: string | null
  fileName: string | null
  fileSize: number | null
  updatedAt: string
}

type DocumentRow = {
  id: string
  organization_id: string
  project_id: string | null
  document_number: string | null
  title: string
  description: string | null
  category: DocumentCategory
  status: DocumentStatus
  confidentiality: ErpDocument['confidentiality']
  current_version: number
  issue_date: string | null
  expiry_date: string | null
  updated_at: string
  projects: { name: string; code: string } | null
}

type VersionRow = {
  document_id: string
  version_number: number
  file_name: string
  size_bytes: number
  storage_path: string
}

type DocumentPayload = {
  id: string
  projectId?: string
  documentNumber?: string
  title: string
  description?: string
  category: DocumentCategory
  confidentiality: ErpDocument['confidentiality']
  issueDate?: string
  expiryDate?: string
  storagePath: string
  fileName: string
  mimeType: string
  sizeBytes: number
}

async function getRequestContext() {
  const { url, anonKey } = getPublicSupabaseConfig()
  const accessToken = (await cookies()).get(sessionCookieName)?.value

  if (!accessToken) throw new Error('Your ERP session has expired. Sign in again.')

  return { url, anonKey, accessToken }
}

async function apiFetch(path: string, init?: RequestInit): Promise<Response> {
  const { url, anonKey, accessToken } = await getRequestContext()
  return fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: 'no-store',
  })
}

async function responseError(response: Response): Promise<Error> {
  const payload = (await response.json().catch(() => null)) as
    | { message?: string; error?: string; msg?: string }
    | null
  return new Error(payload?.message ?? payload?.msg ?? payload?.error ?? `Supabase request failed (${response.status})`)
}

export async function getDocumentWorkspace(): Promise<{
  documents: ErpDocument[]
  projects: DocumentProject[]
}> {
  const documentSelect = [
    'id', 'organization_id', 'project_id', 'document_number', 'title', 'description',
    'category', 'status', 'confidentiality', 'current_version', 'issue_date',
    'expiry_date', 'updated_at', 'projects(name,code)',
  ].join(',')

  const [documentsResponse, versionsResponse, projectsResponse] = await Promise.all([
    apiFetch(`/rest/v1/documents?select=${encodeURIComponent(documentSelect)}&order=updated_at.desc`),
    apiFetch('/rest/v1/document_versions?select=document_id,version_number,file_name,size_bytes,storage_path&order=version_number.desc'),
    apiFetch('/rest/v1/projects?select=id,name,code&order=name.asc'),
  ])

  for (const response of [documentsResponse, versionsResponse, projectsResponse]) {
    if (!response.ok) throw await responseError(response)
  }

  const rows = (await documentsResponse.json()) as DocumentRow[]
  const versions = (await versionsResponse.json()) as VersionRow[]
  const projects = (await projectsResponse.json()) as DocumentProject[]
  const currentFiles = new Map<string, VersionRow>()

  for (const version of versions) {
    if (!currentFiles.has(version.document_id)) currentFiles.set(version.document_id, version)
  }

  return {
    projects,
    documents: rows.map((row) => {
      const version = currentFiles.get(row.id)
      return {
        id: row.id,
        organizationId: row.organization_id,
        projectId: row.project_id,
        projectName: row.projects?.name ?? null,
        projectCode: row.projects?.code ?? null,
        documentNumber: row.document_number,
        title: row.title,
        description: row.description,
        category: row.category,
        status: row.status,
        confidentiality: row.confidentiality,
        currentVersion: row.current_version,
        issueDate: row.issue_date,
        expiryDate: row.expiry_date,
        fileName: version?.file_name ?? null,
        fileSize: version?.size_bytes ?? null,
        updatedAt: row.updated_at,
      }
    }),
  }
}

export async function getCurrentOrganizationId(): Promise<string> {
  const response = await apiFetch('/rest/v1/rpc/current_user_organization_id', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  if (!response.ok) throw await responseError(response)
  const organizationId = (await response.json()) as string | null
  if (!organizationId) throw new Error('Your user is not assigned to an organization.')
  return organizationId
}

export async function uploadDocumentFile(storagePath: string, file: File): Promise<void> {
  const encodedPath = storagePath.split('/').map(encodeURIComponent).join('/')
  const response = await apiFetch(`/storage/v1/object/${documentBucket}/${encodedPath}`, {
    method: 'POST',
    headers: {
      'Content-Type': file.type || 'application/octet-stream',
      'x-upsert': 'false',
    },
    body: await file.arrayBuffer(),
  })
  if (!response.ok) throw await responseError(response)
}

export async function removeDocumentFile(storagePath: string): Promise<void> {
  const response = await apiFetch(`/storage/v1/object/${documentBucket}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prefixes: [storagePath] }),
  })
  if (!response.ok) throw await responseError(response)
}

export async function createDocumentRecord(payload: DocumentPayload): Promise<void> {
  const response = await apiFetch('/rest/v1/rpc/create_document', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      payload: {
        id: payload.id,
        project_id: payload.projectId ?? null,
        document_number: payload.documentNumber ?? null,
        title: payload.title,
        description: payload.description ?? null,
        category: payload.category,
        confidentiality: payload.confidentiality,
        issue_date: payload.issueDate ?? null,
        expiry_date: payload.expiryDate ?? null,
        storage_path: payload.storagePath,
        file_name: payload.fileName,
        mime_type: payload.mimeType,
        size_bytes: payload.sizeBytes,
        change_summary: 'Initial document upload',
        tags: [],
      },
    }),
  })
  if (!response.ok) throw await responseError(response)
}

export async function runDocumentAction(documentId: string, action: string, notes?: string): Promise<void> {
  const response = await apiFetch('/rest/v1/rpc/document_action', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { document_id: documentId, action, notes: notes ?? null } }),
  })
  if (!response.ok) throw await responseError(response)
}

export async function createDocumentDownloadUrl(documentId: string): Promise<{ url: string; fileName: string }> {
  const query = `document_id=eq.${encodeURIComponent(documentId)}&select=storage_path,file_name&order=version_number.desc&limit=1`
  const versionResponse = await apiFetch(`/rest/v1/document_versions?${query}`)
  if (!versionResponse.ok) throw await responseError(versionResponse)
  const versions = (await versionResponse.json()) as Array<Pick<VersionRow, 'storage_path' | 'file_name'>>
  const version = versions[0]
  if (!version) throw new Error('No file is attached to this document.')

  const encodedPath = version.storage_path.split('/').map(encodeURIComponent).join('/')
  const signResponse = await apiFetch(`/storage/v1/object/sign/${documentBucket}/${encodedPath}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expiresIn: 60, download: version.file_name }),
  })
  if (!signResponse.ok) throw await responseError(signResponse)
  const signed = (await signResponse.json()) as { signedURL?: string; signedUrl?: string }
  const signedPath = signed.signedURL ?? signed.signedUrl
  if (!signedPath) throw new Error('Unable to create the document download link.')
  const { url } = await getRequestContext()

  return {
    url: signedPath.startsWith('http') ? signedPath : `${url}/storage/v1${signedPath}`,
    fileName: version.file_name,
  }
}

