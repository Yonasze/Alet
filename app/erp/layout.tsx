import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

import { ErpShell } from '@/components/erp/erp-shell'
import { canAccessErpPath, getAllowedErpModules } from '@/lib/auth/erp-access'
import { getCurrentErpSession } from '@/services/auth/erp-session-service'

export default async function ErpLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = (await headers()).get('x-alet-erp-pathname') ?? '/erp'
  if (pathname === '/erp/login') return children

  const session = await getCurrentErpSession()
  if (!session) {
    redirect(`/erp/login?next=${encodeURIComponent(pathname)}`)
  }

  if (!canAccessErpPath(pathname, session.roles)) {
    redirect('/erp?access=denied')
  }

  return (
    <ErpShell
      allowedModules={getAllowedErpModules(session.roles)}
      userLabel={session.fullName ?? session.email ?? 'ERP staff'}
      roles={session.roles}
    >
      {children}
    </ErpShell>
  )
}
