import { notFound } from 'next/navigation'

import { getErpProjectWorkspace } from '@/services/projects/supabase-project-service'

import { EditProjectForm } from './edit-project-form'

type EditProjectPageProps = {
  params: Promise<{ projectId: string }>
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { projectId } = await params
  const workspace = await getErpProjectWorkspace(projectId)

  if (!workspace) notFound()

  return (
    <EditProjectForm
      projectId={projectId}
      project={workspace.project}
      unitTypes={workspace.unitTypes}
    />
  )
}
