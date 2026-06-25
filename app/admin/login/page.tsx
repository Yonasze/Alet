import Link from 'next/link'
import { Building2, LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function AdminLoginPage() {
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
            <CardTitle>Admin Login</CardTitle>
            <CardDescription>Supabase authentication will protect project-scoped ERP access.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="admin@alet.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" autoComplete="current-password" />
              </div>
              <Button className="w-full" type="submit">
                <LockKeyhole className="size-4" aria-hidden="true" />
                Continue to ERP
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
