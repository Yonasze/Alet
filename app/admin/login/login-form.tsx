'use client'

import { useActionState } from 'react'
import { LockKeyhole } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { loginAction, type LoginActionState } from './actions'

type LoginFormProps = {
  nextPath: string
}

const initialState: LoginActionState = {}

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(loginAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={nextPath} />
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" name="email" type="email" autoComplete="email" placeholder="admin@alet.com" required />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error ? (
        <p className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button className="w-full" type="submit" disabled={isPending}>
        <LockKeyhole className="size-4" aria-hidden="true" />
        {isPending ? 'Signing in...' : 'Continue to ERP'}
      </Button>
    </form>
  )
}
