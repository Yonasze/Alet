'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

import { erpSessionCookieName } from '@/lib/auth/erp-access'
import { getSafeErpNextPath } from '@/lib/auth/safe-next'
import { getErpSessionForToken } from '@/services/auth/erp-session-service'
import { signInWithPassword } from '@/services/auth/supabase-auth-service'

const refreshCookieName = 'alet-erp-refresh'

export type LoginActionState = {
  error?: string
}

export async function loginAction(_state: LoginActionState, formData: FormData): Promise<LoginActionState> {
  const email = String(formData.get('email') ?? '').trim()
  const password = String(formData.get('password') ?? '')
  const next = getSafeErpNextPath(String(formData.get('next') ?? '/erp'))

  if (!email || !password) {
    return { error: 'Enter your work email and password.' }
  }

  try {
    const result = await signInWithPassword(email, password)
    const erpSession = await getErpSessionForToken(result.accessToken, result.user.id)
    if (!erpSession) {
      return { error: 'This account does not have an active ERP role.' }
    }

    const cookieStore = await cookies()
    const secure = process.env.NODE_ENV === 'production'

    cookieStore.set(erpSessionCookieName, result.accessToken, {
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

  redirect(next)
}

export async function logoutAction() {
  const cookieStore = await cookies()
  cookieStore.delete(erpSessionCookieName)
  cookieStore.delete(refreshCookieName)
  redirect('/erp/login')
}
