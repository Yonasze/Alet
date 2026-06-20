'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function PartnerForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: connect to Supabase `partner_leads` table (status defaults to "New")
    await new Promise((r) => setTimeout(r, 700))
    setLoading(false)
    e.currentTarget.reset()
    toast.success('Thank you! Our development team will reach out soon.')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
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
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {loading ? 'Sending...' : 'Submit Partnership Inquiry'}
        </Button>
      </div>
    </form>
  )
}
