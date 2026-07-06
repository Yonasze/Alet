'use client'

import { useActionState } from 'react'
import { CheckCircle2, Send } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { PublicUnitType } from '@/services/projects/supabase-project-service'

import { submitEnquiryAction, type EnquiryState } from './actions'

const initialState: EnquiryState = {}
const input = 'h-11 w-full rounded-lg border border-[#173647]/20 bg-white px-3 text-sm text-[#173647] outline-none focus:border-[#b38a4a] focus:ring-2 focus:ring-[#b38a4a]/20'
const area = 'min-h-28 w-full rounded-lg border border-[#173647]/20 bg-white px-3 py-2 text-sm text-[#173647] outline-none focus:border-[#b38a4a] focus:ring-2 focus:ring-[#b38a4a]/20'

export function PublicEnquiryForm({ projectSlug, unitTypes }: { projectSlug: string; unitTypes: PublicUnitType[] }) {
  const boundAction = submitEnquiryAction.bind(null, projectSlug)
  const [state, action] = useActionState(boundAction, initialState)

  if (state.success) {
    return <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-emerald-900"><CheckCircle2 className="size-7" /><h3 className="mt-3 font-serif text-2xl font-semibold">Thank you for your enquiry</h3><p className="mt-2 text-sm">A member of the Alet sales team will contact you shortly.</p></div>
  }

  return (
    <form action={action} className="space-y-4">
      {state.error ? <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{state.error}</p> : null}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Full name<input name="name" className={input} required maxLength={120} /></label>
        <label className="space-y-1.5 text-sm font-medium">Phone<input name="phone" type="tel" className={input} maxLength={40} /></label>
        <label className="space-y-1.5 text-sm font-medium">Email<input name="email" type="email" className={input} maxLength={200} /></label>
        <label className="space-y-1.5 text-sm font-medium">Preferred contact
          <select name="preferred_contact_method" className={input}><option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option></select>
        </label>
        <label className="space-y-1.5 text-sm font-medium sm:col-span-2">Interested unit type
          <select name="unit_type_code" className={input}><option value="">I am not sure yet</option>{unitTypes.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Minimum budget (ETB)<input name="budget_min_etb" inputMode="decimal" className={input} /></label>
        <label className="space-y-1.5 text-sm font-medium">Maximum budget (ETB)<input name="budget_max_etb" inputMode="decimal" className={input} /></label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">How can we help?<textarea name="message" className={area} maxLength={2000} /></label>
      <label className="flex items-start gap-3 text-sm text-[#173647]/75"><input type="checkbox" name="consent_given" className="mt-1 size-4" /><span>I agree that Alet may contact me about this project and related offers.</span></label>
      <Button type="submit" className="h-11 bg-[#173647] px-5 text-white hover:bg-[#173647]/90"><Send className="size-4" />Send enquiry</Button>
    </form>
  )
}
