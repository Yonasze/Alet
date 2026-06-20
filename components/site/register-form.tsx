'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const unitOptions = ['Studio', '1 Bedroom', '2 Bedroom', '3 Bedroom', 'Not sure yet']

export function RegisterForm() {
  const [loading, setLoading] = useState(false)
  const [unit, setUnit] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    // TODO: connect to Supabase `leads` table (status defaults to "New")
    await new Promise((r) => setTimeout(r, 700))
    setLoading(false)
    e.currentTarget.reset()
    setUnit('')
    toast.success('Thank you! Our team will be in touch shortly.')
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
      <Field label="Full name" htmlFor="name">
        <Input id="name" name="name" required placeholder="Your name" />
      </Field>
      <Field label="Phone" htmlFor="phone">
        <Input id="phone" name="phone" required type="tel" placeholder="+251 ..." />
      </Field>
      <Field label="Email" htmlFor="email">
        <Input id="email" name="email" type="email" placeholder="you@email.com" />
      </Field>
      <Field label="Unit type of interest" htmlFor="unit_interest">
        <Select value={unit} onValueChange={setUnit}>
          <SelectTrigger id="unit_interest" className="w-full">
            <SelectValue placeholder="Select a unit type" />
          </SelectTrigger>
          <SelectContent>
            {unitOptions.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <div className="sm:col-span-2">
        <Field label="Message" htmlFor="message">
          <Textarea
            id="message"
            name="message"
            rows={4}
            placeholder="Tell us what you're looking for..."
          />
        </Field>
      </div>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          disabled={loading}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 sm:w-auto"
        >
          {loading ? 'Sending...' : 'Register Interest'}
        </Button>
      </div>
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  )
}
