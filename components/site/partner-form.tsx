'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitPartnerAction, type PartnerFormState } from '@/app/(site)/partner/actions'

const initialState: PartnerFormState = {}

export function PartnerForm({ projectSlug }: { projectSlug: string }) {
  const [state, action, isPending] = useActionState(
    submitPartnerAction.bind(null, projectSlug),
    initialState,
  )

  if (state.success) {
    return (
      <div role="status" className="rounded-sm border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
        Partnership enquiry received. Our development team will contact you soon.
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="space-y-2">
        <Label htmlFor="p-name">Full name</Label>
        <Input id="p-name" name="name" required placeholder="Your name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-phone">Phone</Label>
        <Input id="p-phone" name="phone" required type="tel" placeholder="+251 ..." />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-email">Email</Label>
        <Input id="p-email" name="email" type="email" placeholder="you@email.com" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="p-location">Location of land</Label>
        <Input id="p-location" name="land_location" required placeholder="e.g. Bole, Addis Ababa" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="p-size">Land size</Label>
        <Input id="p-size" name="land_size" placeholder="e.g. 500 m²" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="p-message">Message</Label>
        <Textarea id="p-message" name="message" rows={4} placeholder="Tell us about your land and what you have in mind..." />
      </div>
      {state.error ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {isPending ? 'Sending...' : 'Submit Partnership Inquiry'}
        </Button>
      </div>
    </form>
  )
}
