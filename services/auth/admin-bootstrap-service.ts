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

type OrganizationRow = { id: string }
type RoleRow = { id: string }
type UserRoleRow = { id: string }

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
        source: 'alet-admin-bootstrap',
      },
    }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as SupabaseAdminUserResponse

  if (!response.ok || !payload.id) {
    throw new Error(payload.error_description ?? payload.msg ?? payload.error ?? 'Unable to create admin user')
  }

  try {
    const organizationId = process.env.ALET_BOOTSTRAP_ORGANIZATION_ID
      ?? (await adminRest<OrganizationRow[]>(
        '/rest/v1/organizations?select=id&order=created_at.asc&limit=1',
        serviceRoleKey,
        url,
      ))[0]?.id
    if (!organizationId) throw new Error('Create an organization before bootstrapping an administrator.')

    const adminRole = (await adminRest<RoleRow[]>(
      '/rest/v1/roles?select=id&code=eq.admin&limit=1',
      serviceRoleKey,
      url,
    ))[0]
    if (!adminRole) throw new Error('The administrator role has not been seeded.')

    await adminRest('/rest/v1/profiles?on_conflict=id', serviceRoleKey, url, {
      method: 'POST',
      headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
      body: JSON.stringify({
        id: payload.id,
        organization_id: organizationId,
        full_name: email.split('@')[0],
        role: 'admin',
      }),
    })

    const existingAssignments = await adminRest<UserRoleRow[]>(
      `/rest/v1/user_roles?select=id&user_id=eq.${encodeURIComponent(payload.id)}&role_id=eq.${encodeURIComponent(adminRole.id)}&project_id=is.null&limit=1`,
      serviceRoleKey,
      url,
    )
    if (existingAssignments.length === 0) {
      await adminRest('/rest/v1/user_roles', serviceRoleKey, url, {
        method: 'POST',
        headers: { Prefer: 'return=minimal' },
        body: JSON.stringify({
          organization_id: organizationId,
          user_id: payload.id,
          role_id: adminRole.id,
          project_id: null,
        }),
      })
    }
  } catch (error) {
    await fetch(`${url}/auth/v1/admin/users/${payload.id}`, {
      method: 'DELETE',
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      cache: 'no-store',
    }).catch(() => undefined)
    throw error
  }

  return payload
}

async function adminRest<T = unknown>(
  path: string,
  serviceRoleKey: string,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
    cache: 'no-store',
  })
  if (!response.ok) {
    const detail = await response.text()
    throw new Error(`Unable to assign administrator access (${response.status}): ${detail}`)
  }
  const body = await response.text()
  return body ? JSON.parse(body) as T : undefined as T
}
