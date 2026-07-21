'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { getSupabaseServerConfig } from '@/lib/supabase/server'

const cookieName='alet-erp-session'

export async function markNotificationsReadAction(notificationId?: string) {
  const { url, anonKey }=getSupabaseServerConfig()
  const token=(await cookies()).get(cookieName)?.value
  if(!token) throw new Error('Your ERP session expired. Sign in again.')
  const filter=notificationId?`id=eq.${encodeURIComponent(notificationId)}`:'read_at=is.null'
  const response=await fetch(`${url}/rest/v1/event_notifications?${filter}`,{method:'PATCH',headers:{apikey:anonKey,Authorization:`Bearer ${token}`,'Content-Type':'application/json',Prefer:'return=minimal'},body:JSON.stringify({read_at:new Date().toISOString()}),cache:'no-store'})
  if(!response.ok) throw new Error('Notifications could not be updated.')
  revalidatePath('/erp/notifications')
}
