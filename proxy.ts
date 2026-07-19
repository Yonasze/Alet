import { NextResponse, type NextRequest } from 'next/server'

import { erpSessionCookieName } from '@/lib/auth/erp-access'
import { getPublicSupabaseConfig } from '@/lib/supabase/public-config'

const refreshCookieName = 'alet-erp-refresh'

type RefreshResponse = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
}

function tokenIsCurrent(token: string | undefined): boolean {
  if (!token) return false

  try {
    const base64 = token.split('.')[1].replaceAll('-', '+').replaceAll('_', '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const payload = JSON.parse(atob(padded)) as { exp?: number }
    return typeof payload.exp === 'number' && payload.exp > Math.floor(Date.now() / 1000) + 15
  } catch {
    return false
  }
}

async function refreshSession(request: NextRequest): Promise<RefreshResponse | null> {
  const refreshToken = request.cookies.get(refreshCookieName)?.value
  const { url, anonKey } = getPublicSupabaseConfig()
  if (!refreshToken) return null

  const response = await fetch(`${url}/auth/v1/token?grant_type=refresh_token`, {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: 'no-store',
  })
  if (!response.ok) return null

  const result = await response.json() as RefreshResponse
  return result.access_token && result.refresh_token ? result : null
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/erp/login', request.url)
  loginUrl.searchParams.set('next', pathname)
  const response = NextResponse.redirect(loginUrl)
  response.cookies.delete(erpSessionCookieName)
  response.cookies.delete(refreshCookieName)
  return response
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const isLoginRoute = pathname === '/erp/login'

  let accessToken = request.cookies.get(erpSessionCookieName)?.value
  let refreshed: RefreshResponse | null = null
  if (!isLoginRoute && !tokenIsCurrent(accessToken)) {
    refreshed = await refreshSession(request)
    accessToken = refreshed?.access_token
    if (!accessToken) return redirectToLogin(request, pathname)
  }

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-alet-erp-pathname', pathname)
  if (refreshed?.access_token && refreshed.refresh_token) {
    const forwardedCookies = request.cookies.getAll()
      .filter((cookie) => cookie.name !== erpSessionCookieName && cookie.name !== refreshCookieName)
    forwardedCookies.push({ name: erpSessionCookieName, value: refreshed.access_token })
    forwardedCookies.push({ name: refreshCookieName, value: refreshed.refresh_token })
    requestHeaders.set('cookie', forwardedCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; '))
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } })
  if (refreshed?.access_token && refreshed.refresh_token) {
    const cookieOptions = {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: request.nextUrl.protocol === 'https:',
      path: '/',
    }
    response.cookies.set(erpSessionCookieName, refreshed.access_token, {
      ...cookieOptions,
      maxAge: refreshed.expires_in ?? 3600,
    })
    response.cookies.set(refreshCookieName, refreshed.refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 30,
    })
  }
  return response
}

export const config = {
  matcher: ['/erp/:path*'],
}
