// Supabase publishable keys are browser-safe identifiers. Database access remains
// protected by Row Level Security; never add the service-role key to this file.
const defaultUrl = 'https://gznqhagitfcpuymnincs.supabase.co'
const defaultPublishableKey = 'sb_publishable_HmMygoUWYarwrzb1qml0qQ_QEX5RwEO'

export type PublicSupabaseConfig = {
  url: string
  anonKey: string
}

export function getPublicSupabaseConfig(): PublicSupabaseConfig {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL ?? defaultUrl,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? defaultPublishableKey,
  }
}
