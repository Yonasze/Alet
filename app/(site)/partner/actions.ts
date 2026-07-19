'use server'

import { submitPublicProjectEnquiry } from '@/services/enquiries/public-enquiry-service'

export type PartnerFormState = { error?: string; success?: boolean }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function submitPartnerAction(
  projectSlug: string,
  _state: PartnerFormState,
  formData: FormData,
): Promise<PartnerFormState> {
  if (!projectSlug) return { error: 'No published project is available to receive enquiries.' }

  const location = value(formData, 'land_location')
  const size = value(formData, 'land_size')
  const details = value(formData, 'message')
  try {
    await submitPublicProjectEnquiry({
      project_slug: projectSlug,
      name: value(formData, 'name'),
      phone: value(formData, 'phone'),
      email: value(formData, 'email'),
      preferred_contact_method: 'phone',
      message: `[LAND PARTNERSHIP] Location: ${location}. Size: ${size || 'Not supplied'}. ${details}`,
      consent_given: false,
      website: value(formData, 'website'),
    })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to send your partnership enquiry.' }
  }
}
