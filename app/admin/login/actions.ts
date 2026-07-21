'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { signInWithPassword } from '@/services/auth/supabase-auth-service'

const sessionCookieName = 'alet-erp-session'
const refreshCookieName = 'alet-erp-refresh'

export type LoginActionState = {
  error?: string
}

export async function loginAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = String(formData.get('next') ?? '/erp')

  if (!email || !password) {
    return { error: 'Enter your admin email and password.' }
  }

  try {
    const result = await signInWithPassword(email, password)
    const cookieStore = await cookies()
    const secure = process.env.NODE_ENV === 'production'

    cookieStore.set(sessionCookieName, result.accessToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: result.expiresIn,
    })

    cookieStore.set(refreshCookieName, result.refreshToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure,
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unable to sign in.',
    }
  }

  redirect(next.startsWith('/') ? next : '/erp')
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(sessionCookieName)
  cookieStore.delete(refreshCookieName)
  redirect('/erp/login')
}
