'use client'

import { useActionState } from 'react'
import { UserPlus } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { bootstrapAdminAction, type BootstrapAdminState } from './actions'

const initialState: BootstrapAdminState = {}

export function BootstrapForm() {
  const [state, formAction, isPending] = useActionState(bootstrapAdminAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Admin email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Admin password</Label>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={12} required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="secret">Bootstrap secret</Label>
        <Input id="secret" name="secret" type="password" autoComplete="off" required />
      </div>
      {state.error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-2 text-sm text-primary">
          {state.success}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        <UserPlus className="size-4" aria-hidden="true" />
        {isPending ? 'Creating admin...' : 'Create confirmed admin'}
      </Button>
    </form>
  )
}
