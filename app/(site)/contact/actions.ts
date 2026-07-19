'use server'

import { submitPublicProjectEnquiry } from '@/services/enquiries/public-enquiry-service'

export type ContactFormState = { error?: string; success?: boolean }

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim()
}

export async function submitContactAction(
  projectSlug: string,
  _state: ContactFormState,
  formData: FormData,
): Promise<ContactFormState> {
  if (!projectSlug) return { error: 'No published project is available to receive enquiries.' }

  const email = value(formData, 'email')
  try {
    await submitPublicProjectEnquiry({
      project_slug: projectSlug,
      name: value(formData, 'name'),
      phone: value(formData, 'phone'),
      email,
      preferred_contact_method: email ? 'email' : 'phone',
      message: `[GENERAL CONTACT] ${value(formData, 'message')}`,
      consent_given: false,
      website: value(formData, 'website'),
    })
    return { success: true }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to send your message.' }
  }
}
