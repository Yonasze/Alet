'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { submitContactAction, type ContactFormState } from '@/app/(site)/contact/actions'

const initialState: ContactFormState = {}

export function ContactForm({ projectSlug }: { projectSlug: string }) {
  const [state, action, isPending] = useActionState(
    submitContactAction.bind(null, projectSlug),
    initialState,
  )

  if (state.success) {
    return (
      <div role="status" className="rounded-sm border border-emerald-300 bg-emerald-50 p-5 text-emerald-900">
        Message received. Our team will get back to you soon.
      </div>
    )
  }

  return (
    <form action={action} className="grid gap-5 sm:grid-cols-2">
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="space-y-2">
        <Label htmlFor="c-name">Full name</Label>
        <Input id="c-name" name="name" required placeholder="Your name" />
      </div>
      <div className="space-y-2">
        <Label htmlFor="c-phone">Phone</Label>
        <Input id="c-phone" name="phone" type="tel" placeholder="+251 ..." />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="c-email">Email</Label>
        <Input id="c-email" name="email" type="email" required placeholder="you@email.com" />
      </div>
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="c-message">Message</Label>
        <Textarea id="c-message" name="message" rows={5} required placeholder="How can we help?" />
      </div>
      {state.error ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.error}</p> : null}
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={isPending}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {isPending ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}
