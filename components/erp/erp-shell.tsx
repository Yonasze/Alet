'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, Building2, ChevronRight, ClipboardList, Factory, FileText, Hammer, LayoutDashboard, Menu, Package, ReceiptText, ShieldCheck, Users, WalletCards } from 'lucide-react'
import { BrandMark } from '@/components/brand-mark'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LogoutButton } from './logout-button'

const navigationItems=[
  {label:'Dashboard',href:'/erp',icon:LayoutDashboard,title:'Operations Dashboard'},
  {label:'Projects',href:'/erp/projects',icon:Building2,title:'Projects Module'},
  {label:'Sales CRM',href:'/erp/sales',icon:Users,title:'Sales CRM'},
  {label:'Finance',href:'/erp/finance',icon:WalletCards,title:'Finance'},
  {label:'Construction',href:'/erp/construction',icon:Hammer,title:'Construction'},
  {label:'Procurement',href:'/erp/procurement',icon:ClipboardList,title:'Procurement'},
  {label:'Inventory',href:'/erp/inventory',icon:Package,title:'Inventory'},
  {label:'Contractors',href:'/erp/contractors',icon:Factory,title:'Contractors'},
  {label:'Documents',href:'/erp/documents',icon:FileText,title:'Documents'},
  {label:'Events',href:'/erp/events',icon:ReceiptText,title:'Events'},
  {label:'Notifications',href:'/erp/notifications',icon:Bell,title:'Notification Center'},
] as const

function isActivePath(pathname:string,href:string){return href==='/erp'?pathname==='/erp':pathname===href||pathname.startsWith(`${href}/`)}

function ErpModuleLinks({ pathname, className, onSelect }: {
  pathname: string
  className: string
  onSelect?: () => void
}) {
  return (
    <nav className={className} aria-label="ERP modules">
      {navigationItems.map(({ href, label, icon: Icon }) => {
        const active = isActivePath(pathname, href)
        return (
          <Link
            key={href}
            href={href}
            onNavigate={onSelect}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground/75 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold',
              active && 'bg-gold text-[#082945] shadow-sm hover:bg-gold hover:text-[#082945]',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {label}
          </Link>
        )
      })}
    </nav>
  )
}

function MobileErpMenu({ pathname }: { pathname: string }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const trigger = useRef<HTMLElement>(null)

  function closeMenu() {
    if (menu.current) menu.current.open = false
  }

  return (
    <details
      ref={menu}
      className="border-t border-primary/10 bg-card lg:hidden"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && menu.current?.open) {
          closeMenu()
          trigger.current?.focus()
        }
      }}
    >
      <summary
        ref={trigger}
        className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-medium text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&::-webkit-details-marker]:hidden"
      >
        <Menu className="size-4" aria-hidden="true" />
        ERP modules
      </summary>
      <ErpModuleLinks
        pathname={pathname}
        className="max-h-[60dvh] space-y-1 overflow-y-auto bg-sidebar px-3 py-3"
        onSelect={closeMenu}
      />
    </details>
  )
}

export function ErpShell({children}:{children:React.ReactNode}){
  const pathname=usePathname()
  const activeItem=navigationItems.find(item=>isActivePath(pathname,item.href))??navigationItems[0]
  return <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(197,154,68,.12),transparent_28%),#f4f2ec] text-foreground">
    <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-[linear-gradient(180deg,#082945_0%,#061f35_100%)] text-sidebar-foreground shadow-2xl lg:flex lg:flex-col">
      <div className="border-b border-sidebar-border px-6 py-5"><Link href="/" className="flex items-center gap-3"><span className="flex size-16 items-center justify-center rounded-2xl border border-gold/25 bg-white/5"><BrandMark inverted /></span><span><span className="block font-serif text-xl font-semibold leading-tight tracking-wide">ALET ERP</span><span className="block text-[11px] uppercase tracking-[.14em] text-gold">Real estate command center</span></span></Link></div>
      <ErpModuleLinks pathname={pathname} className="flex-1 space-y-1 overflow-y-auto px-3 py-4" />
      <div className="border-t border-sidebar-border p-4"><div className="rounded-xl border border-white/10 bg-white/5 p-3 text-sm"><div className="flex items-center gap-2 font-medium text-white"><ShieldCheck className="size-4 text-gold"/>Project-scoped access</div><p className="mt-2 text-xs leading-5 text-sidebar-foreground/65">Secure organization and project isolation across every Alet module.</p></div></div>
    </aside>
    <div className="lg:pl-72"><header className="sticky top-0 z-30 border-b border-primary/10 bg-card/90 shadow-sm backdrop-blur-xl"><div className="flex min-h-16 flex-wrap items-center justify-between gap-3 px-4 py-3 lg:px-8"><div><div className="flex items-center gap-2 text-xs text-muted-foreground"><span>ERP</span><ChevronRight className="size-3"/><span>{activeItem.label}</span></div><h1 className="mt-1 font-serif text-xl font-semibold text-foreground">{activeItem.title}</h1></div><div className="flex items-center gap-2"><Button asChild variant="outline" size="sm" aria-label="Notifications"><Link href="/erp/notifications"><Bell className="size-4"/></Link></Button><Button asChild variant="secondary" size="sm"><Link href="/erp/projects">Alet Main Project</Link></Button><LogoutButton/></div></div><MobileErpMenu key={pathname} pathname={pathname} /></header><main className="px-4 py-6 lg:px-8">{children}</main></div>
  </div>
}
