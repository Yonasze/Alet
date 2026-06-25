import { NextResponse, type NextRequest } from 'next/server'

const sessionCookieName = 'alet-erp-session'
const supabaseCookiePrefixes = ['sb-', 'supabase-auth-token'] as const

function hasSupabaseSessionCookie(request: NextRequest): boolean {
  return request.cookies.has(sessionCookieName) || request.cookies.getAll().some((cookie) =>
    supabaseCookiePrefixes.some((prefix) => cookie.name.startsWith(prefix)),
  )
}

export function middleware(request: NextRequest) {
  const isErpRoute = request.nextUrl.pathname.startsWith('/erp')

  if (!isErpRoute) {
    return NextResponse.next()
  }

  if (!hasSupabaseSessionCookie(request)) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('next', request.nextUrl.pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/erp/:path*'],
}
