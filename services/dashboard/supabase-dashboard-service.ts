import { cookies } from 'next/headers'

import { getSupabaseServerConfig } from '@/lib/supabase/server'

type Receivable = {
  contract_id: string
  scheduled_etb: number
  paid_etb: number
}

type DashboardMetrics = {
  projects: number | null
  units: number | null
  collectionProgress: number | null
  submittedPayments: number | null
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const token = (await cookies()).get('alet-erp-session')?.value
  if (!token) {
    return { projects: null, units: null, collectionProgress: null, submittedPayments: null }
  }

  const { url, anonKey } = getSupabaseServerConfig()
  const headers = { apikey: anonKey, Authorization: `Bearer ${token}` }

  async function request(path: string, prefer?: string) {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: { ...headers, ...(prefer ? { Prefer: prefer } : {}) },
      cache: 'no-store',
    })
    if (!response.ok) throw new Error(`Dashboard data request failed (${response.status}).`)
    return response
  }

  async function count(table: string, filter = '') {
    const response = await request(`${table}?select=id&limit=1${filter}`, 'count=exact')
    const total = response.headers.get('content-range')?.split('/')[1]
    if (!total || !/^\d+$/.test(total)) throw new Error('Dashboard count unavailable.')
    return Number(total)
  }

  async function getCollectionProgress() {
    let scheduled = 0
    let paid = 0
    let cursor: string | undefined

    for (;;) {
      const after = cursor ? `&contract_id=gt.${encodeURIComponent(cursor)}` : ''
      const response = await request(
        `finance_receivables?select=contract_id,scheduled_etb,paid_etb&scheduled_etb=gt.0&order=contract_id.asc&limit=500${after}`,
      )
      const rows: Receivable[] = await response.json()
      if (rows.length === 0) break

      for (const row of rows) {
        scheduled += Number(row.scheduled_etb)
        paid += Number(row.paid_etb)
      }
      cursor = rows[rows.length - 1].contract_id
    }

    return scheduled > 0 ? Math.round((paid / scheduled) * 100) : null
  }

  const [projects, units, collectionProgress, submittedPayments] = await Promise.all([
    count('projects').catch(() => null),
    count('units').catch(() => null),
    getCollectionProgress().catch(() => null),
    count('finance_payments', '&status=eq.submitted').catch(() => null),
  ])

  return { projects, units, collectionProgress, submittedPayments }
}
