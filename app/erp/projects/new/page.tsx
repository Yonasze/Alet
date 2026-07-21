import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

import { ProjectWizardForm } from './project-wizard-form'

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3 mb-2">
          <Link href="/erp/projects">
            <ArrowLeft className="size-4" aria-hidden="true" />
            Projects
          </Link>
        </Button>
        <p className="text-sm font-medium text-primary">New Project Wizard</p>
        <h2 className="mt-1 font-serif text-3xl font-semibold">Create one complete building project</h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Complete the ten steps to create floors, generate individual units, record the first ETB price, add media and progress, and optionally publish to the website.
        </p>
      </div>
      <ProjectWizardForm />
    </div>
  )
}
