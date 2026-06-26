import Link from 'next/link'
import { Building2, ShieldCheck } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { BootstrapForm } from './bootstrap-form'

export default function AdminBootstrapPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#eef1ed] px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        <Link href="/" className="mx-auto flex w-fit items-center gap-3 text-primary">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Building2 className="size-5" aria-hidden="true" />
          </span>
          <span className="font-serif text-2xl font-semibold">Alet ERP</span>
        </Link>

        <Card className="rounded-lg">
          <CardHeader>
            <div className="flex items-start gap-3">
              <span className="mt-1 flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ShieldCheck className="size-5" aria-hidden="true" />
              </span>
              <div>
                <CardTitle>Admin Bootstrap</CardTitle>
                <CardDescription>
                  Create one confirmed Supabase Auth admin user without an email invite.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <BootstrapForm />
            <p className="text-xs leading-5 text-muted-foreground">
              Keep this route protected by a strong bootstrap secret. Remove the secret after the first admin is created.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
