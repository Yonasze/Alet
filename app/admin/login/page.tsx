import Link from 'next/link'
import { Building2 } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { getSafeErpNextPath } from '@/lib/auth/safe-next'

import { LoginForm } from './login-form'

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>
}

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const { next } = await searchParams
  const nextPath = getSafeErpNextPath(next)

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
            <CardTitle>Staff sign in</CardTitle>
            <CardDescription>Use the work account and ERP role assigned by an administrator.</CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm nextPath={nextPath} />
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
