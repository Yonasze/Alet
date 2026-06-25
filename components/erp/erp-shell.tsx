import Link from 'next/link'
import {
  Bell,
  Building2,
  ChevronRight,
  ClipboardList,
  Factory,
  FileText,
  Hammer,
  LayoutDashboard,
  Package,
  ReceiptText,
  ShieldCheck,
  Users,
  WalletCards,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navigationItems = [
  { label: 'Dashboard', href: '/erp', icon: LayoutDashboard },
  { label: 'Projects', href: '/erp/projects', icon: Building2 },
  { label: 'Sales CRM', href: '/erp/sales', icon: Users },
  { label: 'Finance', href: '/erp/finance', icon: WalletCards },
  { label: 'Construction', href: '/erp/construction', icon: Hammer },
  { label: 'Procurement', href: '/erp/procurement', icon: ClipboardList },
  { label: 'Inventory', href: '/erp/inventory', icon: Package },
  { label: 'Contractors', href: '/erp/contractors', icon: Factory },
  { label: 'Documents', href: '/erp/documents', icon: FileText },
  { label: 'Events', href: '/erp/events', icon: ReceiptText },
] as const

type ErpShellProps = {
  children: React.ReactNode
}

export function ErpShell({ children }: ErpShellProps) {
  return (
    <div className="min-h-screen bg-[#eef1ed] text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="border-b border-sidebar-border px-6 py-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <Building2 className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block font-serif text-xl font-semibold leading-tight">Alet ERP</span>
              <span className="block text-xs text-sidebar-foreground/70">Real estate command center</span>
            </span>
          </Link>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4" aria-label="ERP modules">
          {navigationItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                item.href === '/erp' && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-sidebar-border p-4">
          <div className="rounded-lg bg-sidebar-accent p-3 text-sm">
            <div className="flex items-center gap-2 font-medium text-sidebar-accent-foreground">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Project-scoped access
            </div>
            <p className="mt-2 text-xs leading-5 text-sidebar-foreground/70">
              Data is designed around organization and project isolation from day one.
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-30 border-b bg-card/95 backdrop-blur">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>ERP</span>
                <ChevronRight className="size-3" aria-hidden="true" />
                <span>Foundation</span>
              </div>
              <h1 className="mt-1 font-serif text-xl font-semibold text-foreground">Operations Dashboard</h1>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" aria-label="Notifications">
                <Bell className="size-4" aria-hidden="true" />
              </Button>
              <Button variant="secondary" size="sm">
                Alet Main Project
              </Button>
            </div>
          </div>
        </header>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
