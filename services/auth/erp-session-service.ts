import { cookies } from 'next/headers'

import { erpSessionCookieName, isErpRoleCode, type ErpRoleCode } from '@/lib/auth/erp-access'
import { getSupabaseServerConfig } from '@/lib/supabase/server'

type AuthUser = {
  id: string
  email?: string
}

type RoleRelation = {
  code?: string
  is_read_only?: boolean
}

type RoleRow = {
  project_id: string | null
  roles: RoleRelation | RoleRelation[] | null
}

type ProfileRow = {
  full_name: string | null
  organization_id: string
  role: string | null
}

export type ErpSession = {
  userId: string
  email?: string
  fullName?: string
  organizationId: string
  roles: ErpRoleCode[]
  projectIds: string[]
  isReadOnly: boolean
}

function relation(value: RoleRow['roles']): RoleRelation | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined
}

async function authenticatedFetch(path: string, accessToken: string) {
  const { url, anonKey } = getSupabaseServerConfig()
  return fetch(`${url}${path}`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })
}

export async function getErpSessionForToken(
  accessToken: string,
  expectedUserId?: string,
): Promise<ErpSession | null> {
  const userResponse = await authenticatedFetch('/auth/v1/user', accessToken)
  if (!userResponse.ok) return null

  const user = await userResponse.json() as AuthUser
  if (!user.id || (expectedUserId && user.id !== expectedUserId)) return null

  const encodedUserId = encodeURIComponent(user.id)
  const [profilesResponse, rolesResponse] = await Promise.all([
    authenticatedFetch(`/rest/v1/profiles?select=full_name,organization_id,role&id=eq.${encodedUserId}&limit=1`, accessToken),
    authenticatedFetch(`/rest/v1/user_roles?select=project_id,roles(code,is_read_only)&user_id=eq.${encodedUserId}`, accessToken),
  ])

  if (!profilesResponse.ok || !rolesResponse.ok) return null

  const profiles = await profilesResponse.json() as ProfileRow[]
  const roleRows = await rolesResponse.json() as RoleRow[]
  const profile = profiles[0]
  if (!profile?.organization_id) return null

  const assignedRoles = roleRows
    .map((row) => relation(row.roles)?.code)
    .filter((code): code is ErpRoleCode => Boolean(code && isErpRoleCode(code)))
  const fallbackRole = profile.role && isErpRoleCode(profile.role) ? [profile.role] : []
  const roles = [...new Set([...assignedRoles, ...fallbackRole])]
  if (roles.length === 0) return null

  const readOnlyFlags = roleRows
    .map((row) => relation(row.roles)?.is_read_only)
    .filter((value): value is boolean => typeof value === 'boolean')

  return {
    userId: user.id,
    email: user.email,
    fullName: profile.full_name ?? undefined,
    organizationId: profile.organization_id,
    roles,
    projectIds: [...new Set(roleRows.flatMap((row) => row.project_id ? [row.project_id] : []))],
    isReadOnly: readOnlyFlags.length > 0 && readOnlyFlags.every(Boolean),
  }
}

export async function getCurrentErpSession(): Promise<ErpSession | null> {
  const accessToken = (await cookies()).get(erpSessionCookieName)?.value
  return accessToken ? getErpSessionForToken(accessToken) : null
}
