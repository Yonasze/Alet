import 'server-only'

export type SupabasePasswordSignInResult = {
  accessToken: string
  refreshToken: string
  expiresIn: number
  user: {
    id: string
    email?: string
  }
}

type SupabaseTokenResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  user?: {
    id: string
    email?: string
  }
  error?: string
  error_description?: string
  msg?: string
}

function getAuthConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error('Missing Supabase environment variables')
  }

  return { url, anonKey }
}

export async function signInWithPassword(email: string, password: string): Promise<SupabasePasswordSignInResult> {
  const { url, anonKey } = getAuthConfig()
  const response = await fetch(`${url}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  })

  const payload = (await response.json()) as SupabaseTokenResponse

  if (!response.ok || !payload.access_token || !payload.refresh_token || !payload.user) {
    throw new Error(payload.error_description ?? payload.msg ?? payload.error ?? 'Invalid email or password')
  }

  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresIn: payload.expires_in ?? 3600,
    user: payload.user,
  }
}
