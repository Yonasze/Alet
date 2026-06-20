'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function ContactForm() {
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: connect to Supabase `leads` table (status defaults to "New")
    await new Promise((r) => setTimeout(r, 700))
    setLoading(false)
    e.currentTarget.reset()
    toast.success('Message sent! We will get back to you soon.')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
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
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </div>
    </form>
  )
}
