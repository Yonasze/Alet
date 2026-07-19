import { getPublicSupabaseConfig, type PublicSupabaseConfig } from '@/lib/supabase/public-config'

export type SupabaseRuntimeConfig = PublicSupabaseConfig

export function getSupabaseRuntimeConfig(): SupabaseRuntimeConfig {
  return getPublicSupabaseConfig()
}
