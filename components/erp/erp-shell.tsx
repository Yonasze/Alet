'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
import type { ErpModuleCode, ErpRoleCode } from '@/lib/auth/erp-access'
import { cn } from '@/lib/utils'

import { LogoutButton } from './logout-button'

const navigationItems = [
  { module: 'dashboard', label: 'Dashboard', href: '/erp', icon: LayoutDashboard, title: 'Operations Dashboard' },
  { module: 'projects', label: 'Projects', href: '/erp/projects', icon: Building2, title: 'Projects Module' },
  { module: 'sales', label: 'Sales CRM', href: '/erp/sales', icon: Users, title: 'Sales CRM' },
  { module: 'finance', label: 'Finance', href: '/erp/finance', icon: WalletCards, title: 'Finance' },
  { module: 'construction', label: 'Construction', href: '/erp/construction', icon: Hammer, title: 'Construction' },
  { module: 'procurement', label: 'Procurement', href: '/erp/procurement', icon: ClipboardList, title: 'Procurement' },
  { module: 'inventory', label: 'Inventory', href: '/erp/inventory', icon: Package, title: 'Inventory' },
  { module: 'contractors', label: 'Contractors', href: '/erp/contractors', icon: Factory, title: 'Contractors' },
  { module: 'documents', label: 'Documents', href: '/erp/documents', icon: FileText, title: 'Documents' },
  { module: 'events', label: 'Events', href: '/erp/events', icon: ReceiptText, title: 'Events' },
] as const

type ErpShellProps = {
  children: React.ReactNode
  allowedModules: ErpModuleCode[]
  userLabel: string
  roles: ErpRoleCode[]
}

function isActivePath(pathname: string, href: string) {
  return href === '/erp' ? pathname === '/erp' : pathname === href || pathname.startsWith(`${href}/`)
}

export function ErpShell({ children, allowedModules, userLabel, roles }: ErpShellProps) {
  const pathname = usePathname()
  const visibleItems = navigationItems.filter((item) => allowedModules.includes(item.module))
  const activeItem = visibleItems.find((item) => isActivePath(pathname, item.href)) ?? visibleItems[0]

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
          {visibleItems.map((item) => {
            const active = isActivePath(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/80 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  active && 'bg-sidebar-accent text-sidebar-accent-foreground',
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.label}
              </Link>
            )
          })}
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
                <span>{activeItem.label}</span>
              </div>
              <h1 className="mt-1 font-serif text-xl font-semibold text-foreground">{activeItem.title}</h1>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden text-right md:block">
                <p className="max-w-48 truncate text-xs font-medium">{userLabel}</p>
                <p className="text-[11px] text-muted-foreground">{roles.join(', ')}</p>
              </div>
              <Button variant="outline" size="sm" aria-label="Notifications">
                <Bell className="size-4" aria-hidden="true" />
              </Button>
              <Button asChild variant="secondary" size="sm">
                <Link href="/erp/projects">Alet Main Project</Link>
              </Button>
              <LogoutButton />
            </div>
          </div>
        </header>

        <nav className="flex gap-2 overflow-x-auto border-b bg-card px-4 py-2 lg:hidden" aria-label="ERP modules mobile">
          {visibleItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActivePath(pathname, item.href) ? 'page' : undefined}
              className={cn(
                'shrink-0 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground',
                isActivePath(pathname, item.href) && 'bg-primary text-primary-foreground',
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <main className="px-4 py-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
