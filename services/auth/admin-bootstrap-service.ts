type SupabaseAdminUser = {
  id: string
  email?: string
  app_metadata?: Record<string, unknown>
}

type SupabaseAdminUserResponse = SupabaseAdminUser & {
  error?: string
  error_description?: string
  msg?: string
}

type CreateAdminUserInput = {
  email: string
  password: string
}

function getAdminAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error('Missing Supabase admin environment variables')
  }

  return { url, serviceRoleKey }
}

export async function createConfirmedAdminUser({
  email,
  password,
}: CreateAdminUserInput): Promise<SupabaseAdminUser> {
  const { url, serviceRoleKey } = getAdminAuthConfig()
  const response = await fetch(`${url}/auth/v1/admin/users`, {
    method: 'POST',
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      email_confirm: true,
      app_metadata: {
        role: 'admin',
      },
      user_metadata: {
        role: 'admin',
        source: 'alet-admin-bootstrap',
      },
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as SupabaseAdminUserResponse

  if (!response.ok || !payload.id) {
    throw new Error(payload.error_description ?? payload.msg ?? payload.error ?? 'Unable to create admin user')
  }

  return payload
}
