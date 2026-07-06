'use client'

import { useActionState, useMemo, useState } from 'react'
import { LoaderCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import type { SalesCustomer, SalesLead, SalesProject, SalesReservation, SalesUnit, SalesUnitType } from '@/services/sales/supabase-sales-service'

import {
  createLeadAction,
  createReservationAction,
  type SalesActionState,
  updateCustomerAction,
  updateLeadAction,
  updateReservationAction,
} from './actions'

const initialState: SalesActionState = {}

const fieldClass =
  'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30'
const areaClass =
  'min-h-24 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30'

function Message({ state }: { state: SalesActionState }) {
  if (state.error) return <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
  if (state.success) return <p className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-sm text-emerald-800">{state.success}</p>
  return null
}

function SubmitButton({ label }: { label: string }) {
  return (
    <Button type="submit">
      <LoaderCircle className="hidden size-4 animate-spin group-aria-busy/button:block" aria-hidden="true" />
      {label}
    </Button>
  )
}

export function NewLeadForm({ projects, unitTypes }: { projects: SalesProject[]; unitTypes: SalesUnitType[] }) {
  const [state, action] = useActionState(createLeadAction, initialState)
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '')
  const matchingTypes = unitTypes.filter((item) => item.project_id === projectId)

  return (
    <form action={action} className="space-y-5">
      <Message state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Project
          <select name="project_id" value={projectId} onChange={(event) => setProjectId(event.target.value)} className={fieldClass} required>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Interested unit type
          <select name="unit_type_id" className={fieldClass}>
            <option value="">Not decided</option>
            {matchingTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Full name
          <input name="full_name" className={fieldClass} maxLength={120} required />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Phone
          <input name="phone" className={fieldClass} type="tel" maxLength={40} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Email
          <input name="email" className={fieldClass} type="email" maxLength={200} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Preferred contact
          <select name="preferred_contact_method" className={fieldClass}>
            <option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Source
          <select name="source" className={fieldClass}>
            <option value="manual">Direct</option><option value="referral">Referral</option><option value="walk_in">Walk-in</option><option value="phone">Phone call</option><option value="social_media">Social media</option>
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="space-y-1.5 text-sm font-medium">Minimum budget
            <input name="budget_min_etb" className={fieldClass} inputMode="decimal" placeholder="ETB" />
          </label>
          <label className="space-y-1.5 text-sm font-medium">Maximum budget
            <input name="budget_max_etb" className={fieldClass} inputMode="decimal" placeholder="ETB" />
          </label>
        </div>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">Initial enquiry
        <textarea name="message" className={areaClass} maxLength={2000} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">Internal notes
        <textarea name="notes" className={areaClass} />
      </label>
      <SubmitButton label="Create lead" />
    </form>
  )
}

export function LeadUpdateForm({ lead, unitTypes }: { lead: SalesLead; unitTypes: SalesUnitType[] }) {
  const boundAction = updateLeadAction.bind(null, lead.id)
  const [state, action] = useActionState(boundAction, initialState)

  return (
    <form action={action} className="space-y-5">
      <Message state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Full name
          <input name="full_name" defaultValue={lead.full_name} className={fieldClass} required />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Interested unit type
          <select name="unit_type_id" defaultValue={lead.unit_type_id ?? ''} className={fieldClass}>
            <option value="">Not decided</option>{unitTypes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Phone
          <input name="phone" defaultValue={lead.phone ?? ''} className={fieldClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Email
          <input name="email" type="email" defaultValue={lead.email ?? ''} className={fieldClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Preferred contact
          <select name="preferred_contact_method" defaultValue={lead.preferred_contact_method} className={fieldClass}>
            <option value="phone">Phone</option><option value="whatsapp">WhatsApp</option><option value="email">Email</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Source
          <input name="source" defaultValue={lead.source} className={fieldClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Minimum budget (ETB)
          <input name="budget_min_etb" defaultValue={lead.budget_min_etb ?? ''} inputMode="decimal" className={fieldClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Maximum budget (ETB)
          <input name="budget_max_etb" defaultValue={lead.budget_max_etb ?? ''} inputMode="decimal" className={fieldClass} />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">Enquiry message
        <textarea name="message" defaultValue={lead.message ?? ''} className={areaClass} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Pipeline stage
          <select name="stage" defaultValue={lead.stage} className={fieldClass}>
            {['new','contacted','qualified','viewing','unit_selected','on_hold','reserved','contracted','sold','handed_over','closed'].map((stage) => (
              <option key={stage} value={stage}>{stage.split('_').map((part) => part[0].toUpperCase() + part.slice(1)).join(' ')}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Next follow-up
          <input name="next_follow_up_at" type="datetime-local" className={fieldClass} />
        </label>
        <label className="space-y-1.5 text-sm font-medium">Activity type
          <select name="activity_type" className={fieldClass}>
            <option value="note">Note</option><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="viewing">Viewing</option><option value="follow_up">Follow-up</option>
          </select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Lost/closed reason
          <input name="lost_reason" defaultValue={lead.lost_reason ?? ''} className={fieldClass} />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">New activity summary
        <textarea name="activity_summary" className={areaClass} placeholder="What happened and what is next?" />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">Internal notes
        <textarea name="notes" defaultValue={lead.notes ?? ''} className={areaClass} />
      </label>
      <SubmitButton label="Save all lead changes" />
    </form>
  )
}

export function CustomerEditForm({ customer }: { customer: SalesCustomer }) {
  const boundAction = updateCustomerAction.bind(null, customer.id)
  const [state, action] = useActionState(boundAction, initialState)
  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Full name<input name="full_name" defaultValue={customer.full_name} className={fieldClass} required /></label>
        <label className="space-y-1.5 text-sm font-medium">Phone<input name="phone" defaultValue={customer.phone ?? ''} className={fieldClass} /></label>
        <label className="space-y-1.5 text-sm font-medium">Email<input name="email" type="email" defaultValue={customer.email ?? ''} className={fieldClass} /></label>
        <label className="space-y-1.5 text-sm font-medium">Address<input name="address" defaultValue={customer.address ?? ''} className={fieldClass} /></label>
        <label className="space-y-1.5 text-sm font-medium">ID type<input name="government_id_type" defaultValue={customer.government_id_type ?? ''} className={fieldClass} /></label>
        <label className="space-y-1.5 text-sm font-medium">ID number<input name="government_id_number" defaultValue={customer.government_id_number ?? ''} className={fieldClass} /></label>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="consent_given" defaultChecked={customer.consent_given} />Marketing/contact consent recorded</label>
      <SubmitButton label="Save customer details" />
    </form>
  )
}

export function ReservationEditForm({ reservation }: { reservation: SalesReservation }) {
  const boundAction = updateReservationAction.bind(null, reservation.id)
  const [state, action] = useActionState(boundAction, initialState)
  return (
    <form action={action} className="space-y-3 rounded-lg border bg-muted/30 p-3">
      <Message state={state} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1 text-xs font-medium">VAT-inclusive agreed price
          <input name="reserved_price_etb" defaultValue={reservation.reserved_price_etb} inputMode="decimal" className={fieldClass} />
        </label>
        <label className="space-y-1 text-xs font-medium">Expiry
          <input name="expires_at" type="datetime-local" className={fieldClass} />
        </label>
      </div>
      <label className="block space-y-1 text-xs font-medium">Reservation notes
        <textarea name="notes" defaultValue={reservation.notes ?? ''} className={areaClass} />
      </label>
      <SubmitButton label="Update reservation" />
    </form>
  )
}

export function ReservationForm({ leads, units }: { leads: SalesLead[]; units: SalesUnit[] }) {
  const [state, action] = useActionState(createReservationAction, initialState)
  const eligibleLeads = leads.filter((lead) => lead.status === 'open' && !['on_hold','reserved','contracted','sold','handed_over'].includes(lead.stage))
  const [leadId, setLeadId] = useState(eligibleLeads[0]?.id ?? '')
  const lead = eligibleLeads.find((item) => item.id === leadId)
  const matchingUnits = useMemo(
    () => units.filter((unit) => unit.project_id === lead?.project_id && unit.status === 'available'),
    [units, lead?.project_id],
  )

  return (
    <form action={action} className="space-y-4">
      <Message state={state} />
      <label className="block space-y-1.5 text-sm font-medium">Qualified lead
        <select name="lead_id" value={leadId} onChange={(event) => setLeadId(event.target.value)} className={fieldClass} required>
          <option value="">Select a lead</option>
          {eligibleLeads.map((item) => <option key={item.id} value={item.id}>{item.full_name} · {item.phone ?? item.email}</option>)}
        </select>
      </label>
      <label className="block space-y-1.5 text-sm font-medium">Available unit
        <select name="unit_id" className={fieldClass} required>
          <option value="">Select a unit</option>
          {matchingUnits.map((unit) => <option key={unit.id} value={unit.id}>{unit.unit_number} · Gross {unit.gross_area_sqm ?? unit.net_area_sqm ?? '—'} m²</option>)}
        </select>
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 text-sm font-medium">Initial status
          <select name="status" className={fieldClass}><option value="on_hold">48-hour hold</option><option value="reserved">Reservation</option></select>
        </label>
        <label className="space-y-1.5 text-sm font-medium">Agreed VAT-inclusive selling price
          <input name="reserved_price_etb" className={fieldClass} inputMode="decimal" placeholder="ETB" required />
        </label>
      </div>
      <label className="block space-y-1.5 text-sm font-medium">Custom expiry (optional)
        <input name="expires_at" type="datetime-local" className={fieldClass} />
      </label>
      <label className="block space-y-1.5 text-sm font-medium">Notes
        <textarea name="notes" className={areaClass} />
      </label>
      <SubmitButton label="Lock unit" />
    </form>
  )
}
