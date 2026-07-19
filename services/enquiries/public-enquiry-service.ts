import { getSupabaseServerConfig } from '@/lib/supabase/server'

export type PublicEnquiryPayload = {
  project_slug: string
  name: string
  phone?: string
  email?: string
  preferred_contact_method?: string
  unit_type_code?: string
  budget_min_etb?: string
  budget_max_etb?: string
  message?: string
  consent_given?: boolean
  website?: string
}

export async function submitPublicProjectEnquiry(payload: PublicEnquiryPayload) {
  const { url, anonKey } = getSupabaseServerConfig()
  const response = await fetch(`${url}/rest/v1/rpc/submit_project_enquiry`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ payload }),
    cache: 'no-store',
  })
  const result = await response.json().catch(() => ({})) as { message?: string; accepted?: boolean }

  if (!response.ok || !result.accepted) {
    throw new Error('We could not send your enquiry. Please try again.')
  }
}
