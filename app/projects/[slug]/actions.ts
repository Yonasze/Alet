'use server'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

export type EnquiryState = { error?: string; success?: boolean }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function submitEnquiryAction(
  projectSlug: string,
  _state: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
  const { url, anonKey } = getSupabaseServerConfig()
  const payload = {
    project_slug: projectSlug,
    name: value(formData, 'name'),
    phone: value(formData, 'phone'),
    email: value(formData, 'email'),
    preferred_contact_method: value(formData, 'preferred_contact_method'),
    unit_type_code: value(formData, 'unit_type_code'),
    budget_min_etb: value(formData, 'budget_min_etb').replaceAll(',', ''),
    budget_max_etb: value(formData, 'budget_max_etb').replaceAll(',', ''),
    message: value(formData, 'message'),
    consent_given: formData.get('consent_given') === 'on',
    website: value(formData, 'website'),
  }

  try {
    const response = await fetch(`${url}/rest/v1/rpc/submit_project_enquiry`, {
      method: 'POST',
      headers: { apikey: anonKey, Authorization: `Bearer ${anonKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ payload }),
      cache: 'no-store',
    })
    const result = await response.json().catch(() => ({})) as { message?: string; accepted?: boolean }
    if (!response.ok || !result.accepted) return { error: result.message ?? 'We could not send your enquiry. Please try again.' }
    return { success: true }
  } catch {
    return { error: 'We could not send your enquiry. Please try again.' }
  }
}
