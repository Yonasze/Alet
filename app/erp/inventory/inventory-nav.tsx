import Link from 'next/link'
import{Archive,Boxes,ClipboardCheck,LayoutDashboard,MapPin,PackageSearch,ScrollText}from 'lucide-react'
const items=[
 {href:'/erp/inventory',label:'Dashboard',icon:LayoutDashboard},
 {href:'/erp/inventory/stock',label:'Stock',icon:Boxes},
 {href:'/erp/inventory/catalog',label:'Catalog',icon:PackageSearch},
 {href:'/erp/inventory/locations',label:'Locations',icon:MapPin},
 {href:'/erp/inventory/issues',label:'Issues',icon:ClipboardCheck},
 {href:'/erp/inventory/receipts',label:'Receipts',icon:Archive},
 {href:'/erp/inventory/movements',label:'Ledger',icon:ScrollText},
]as const
export function InventoryNav(){return <nav className="flex flex-wrap gap-2" aria-label="Inventory">{items.map(i=><Link key={i.href} href={i.href} className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-2 text-sm font-medium transition hover:border-primary hover:text-primary"><i.icon className="size-4"/>{i.label}</Link>)}</nav>}
