import { NextResponse } from 'next/server'

import { createDocumentDownloadUrl } from '@/services/documents/document-service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> },
) {
  try {
    const { documentId } = await params
    const download = await createDocumentDownloadUrl(documentId)
    return NextResponse.redirect(download.url)
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unable to download the document.' },
      { status: 404 },
    )
  }
}

