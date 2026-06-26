'use server'

import { createConfirmedAdminUser } from '@/services/auth/admin-bootstrap-service'

export type BootstrapAdminState = {
  error?: string
  success?: string
}

export async function bootstrapAdminAction(
  _state: BootstrapAdminState,
  formData: FormData,
): Promise<BootstrapAdminState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')
  const secret = String(formData.get('secret') ?? '')
  const expectedSecret = process.env.ALET_ADMIN_BOOTSTRAP_SECRET

  if (!expectedSecret) {
    return { error: 'ALET_ADMIN_BOOTSTRAP_SECRET is not configured.' }
  }

  if (secret !== expectedSecret) {
    return { error: 'Bootstrap secret is incorrect.' }
  }

  if (!email || !password) {
    return { error: 'Enter an admin email and password.' }
  }

  if (password.length < 12) {
    return { error: 'Use a password with at least 12 characters.' }
  }

  try {
    const user = await createConfirmedAdminUser({ email, password })
    return { success: `Admin user created and confirmed: ${user.email ?? email}` }
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unable to create admin user.' }
  }
}
