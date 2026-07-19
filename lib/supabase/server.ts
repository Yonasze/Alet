import { getPublicSupabaseConfig } from '@/lib/supabase/public-config'

export type SupabaseServerConfig = {
  url: string
  anonKey: string
  serviceRoleKey?: string
}

export function getSupabaseServerConfig(): SupabaseServerConfig {
  const { url, anonKey } = getPublicSupabaseConfig()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  return { url, anonKey, serviceRoleKey }
}
