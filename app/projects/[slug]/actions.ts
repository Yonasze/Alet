'use server'

import { submitPublicProjectEnquiry } from '@/services/enquiries/public-enquiry-service'

export type EnquiryState = { error?: string; success?: boolean }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function submitEnquiryAction(
  projectSlug: string,
  _state: EnquiryState,
  formData: FormData,
): Promise<EnquiryState> {
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
    await submitPublicProjectEnquiry(payload)
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'We could not send your enquiry. Please try again.' }
  }
}
