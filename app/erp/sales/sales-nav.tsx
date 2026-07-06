import Link from 'next/link'
import { BarChart3, ContactRound, FileSignature, ListFilter, LockKeyhole, UsersRound } from 'lucide-react'

const items = [
  { href: '/erp/sales', label: 'Dashboard', icon: BarChart3 },
  { href: '/erp/sales/leads', label: 'Leads', icon: ListFilter },
  { href: '/erp/sales/customers', label: 'Customers', icon: ContactRound },
  { href: '/erp/sales/reservations', label: 'Reservations', icon: LockKeyhole },
  { href: '/erp/sales/contracts', label: 'Contracts', icon: FileSignature },
] as const

export function SalesNav() {
  return (
    <nav className="flex flex-wrap gap-2" aria-label="Sales CRM">
      {items.map((item) => (
        <Link key={item.href} href={item.href} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary">
          <item.icon className="size-4" aria-hidden="true" />{item.label}
        </Link>
      ))}
    </nav>
  )
}
