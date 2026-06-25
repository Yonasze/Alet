import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { logoutAction } from '@/app/admin/login/actions'

export function LogoutButton() {
  return (
    <form action={logoutAction}>
      <Button variant="outline" size="sm" type="submit">
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </form>
  )
}
